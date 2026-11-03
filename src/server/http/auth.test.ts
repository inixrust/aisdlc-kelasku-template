import type { FastifyInstance, LightMyRequestResponse, RouteOptions } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTempDir, type TempDir } from '../../../test/helpers/temp-dir.js';
import { createTestDb, fixedClock, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueEmail } from '../../../test/helpers/unique.js';
import { getError, toErrorEnvelope } from '../../shared/errors.js';
import { SCHEMA_MESSAGES } from '../../shared/schemas.js';
import { createServices, type Services } from '../services/index.js';
import type { AdminRoutes } from './admin-plugin.js';
import { buildApp } from './app.js';
import { SESSION_COOKIE } from './session-cookie.js';

const PASSWORD = 'rahasia-admin-123';
const UNAUTHORIZED = toErrorEnvelope('unauthorized');
const INVALID_CREDENTIALS = toErrorEnvelope('invalid_credentials');

let testDb: TestDb;
let clientDir: TempDir;
let adminEmail: string;
const logLines: string[] = [];
const apps: FastifyInstance[] = [];

/** Rute admin uji (P0-008): setiap metode, termasuk tulis, dan menghitung pemanggilan handler. */
let handlerCalls = 0;
const testAdminRoutes: AdminRoutes = (admin) => {
  const handler = async (request: { admin: { email: string } | null }) => {
    handlerCalls += 1;
    return { email: request.admin?.email ?? null };
  };
  admin.get('/uji', handler);
  admin.post('/uji', handler);
  admin.put('/uji/:id', handler);
  admin.patch('/uji/:id', handler);
  admin.delete('/uji/:id', handler);
};

interface AppHandle {
  app: FastifyInstance;
  routes: RouteOptions[];
}

async function makeApp(options: { services?: Services; cookieSecure?: boolean } = {}): Promise<AppHandle> {
  const routes: RouteOptions[] = [];
  const app = await buildApp({
    services: options.services ?? testDb.services,
    clientDir: clientDir.path,
    cookieSecure: options.cookieSecure ?? false,
    adminRoutes: [testAdminRoutes],
    onRoute: (route) => routes.push(route),
    logger: {
      level: 'trace',
      stream: { write: (line: string) => void logLines.push(line) },
    },
  });
  app.get('/api/uji/meledak', () => {
    throw new Error('SELECT secret FROM admins');
  });
  apps.push(app);
  return { app, routes };
}

function sessionCookieOf(response: LightMyRequestResponse): string {
  const cookie = response.cookies.find((c) => c.name === SESSION_COOKIE);
  if (cookie === undefined) throw new Error('cookie sesi tidak di-set');
  return cookie.value;
}

function login(app: FastifyInstance, body: unknown): Promise<LightMyRequestResponse> {
  return app.inject({ method: 'POST', url: '/api/auth/login', payload: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
}

const sessionCount = (): number => (testDb.db.prepare('SELECT COUNT(*) AS n FROM admin_sessions').get() as { n: number }).n;

let main: AppHandle;

beforeAll(async () => {
  testDb = createTestDb();
  clientDir = createTempDir('kelasku-client-');
  adminEmail = uniqueEmail('admin');
  await testDb.services.auth.upsertAdmin({ email: adminEmail, password: PASSWORD });
  main = await makeApp();
});

afterAll(async () => {
  for (const app of apps) await app.close();
  clientDir.cleanup();
  testDb.cleanup();
});

describe('POST /api/auth/login (FR-1, AD-9)', () => {
  it('logs in with a normalized email, sets an HttpOnly SameSite=Lax cookie, and stores one hashed session', async () => {
    const before = sessionCount();
    const response = await login(main.app, { email: `  ${adminEmail.toUpperCase()} `, password: PASSWORD });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ email: adminEmail });
    const setCookie = String(response.headers['set-cookie']);
    expect(setCookie).toMatch(new RegExp(`^${SESSION_COOKIE}=[A-Za-z0-9_-]{43};`));
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).not.toContain('Secure');
    expect(sessionCount()).toBe(before + 1);
    const token = sessionCookieOf(response);
    expect(testDb.db.prepare('SELECT COUNT(*) AS n FROM admin_sessions WHERE token_hash = ?').get(token)).toEqual({ n: 0 });
  });

  it('marks the cookie Secure only when cookieSecure is set (COOKIE_SECURE=true)', async () => {
    const { app } = await makeApp({ cookieSecure: true });
    const response = await login(app, { email: adminEmail, password: PASSWORD });
    expect(response.statusCode).toBe(200);
    expect(String(response.headers['set-cookie'])).toContain('Secure');
  });

  it('answers an unknown email and a wrong password with the identical 401 envelope and no session', async () => {
    const before = sessionCount();
    const unknown = await login(main.app, { email: uniqueEmail('admin'), password: PASSWORD });
    const wrong = await login(main.app, { email: adminEmail, password: `${PASSWORD}x` });

    for (const response of [unknown, wrong]) {
      expect(response.statusCode).toBe(getError('invalid_credentials').httpStatus);
      expect(response.json()).toEqual(INVALID_CREDENTIALS);
      expect(response.headers['set-cookie']).toBeUndefined();
    }
    expect(unknown.body).toBe(wrong.body);
    expect(sessionCount()).toBe(before);
  });

  it.each([
    ['a non-object body', 'teks'],
    ['an empty object', {}],
    ['a blank email and password', { email: '  ', password: '' }],
  ])('rejects %s with 400 validation_error fields', async (_label, body) => {
    const response = await login(main.app, body);
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      toErrorEnvelope('validation_error', {
        email: SCHEMA_MESSAGES.emailRequired,
        password: SCHEMA_MESSAGES.passwordRequired,
      }),
    );
  });

  it('rejects malformed JSON with 400 validation_error', async () => {
    const response = await main.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: '{',
      headers: { 'content-type': 'application/json' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(toErrorEnvelope('validation_error'));
  });
});

describe('Content-Type guard on /api writes (AD-9)', () => {
  it.each([
    ['text/plain', { 'content-type': 'text/plain' }],
    ['form-urlencoded', { 'content-type': 'application/x-www-form-urlencoded' }],
    ['an empty header', { 'content-type': '' }],
  ])('rejects POST /api/auth/login with %s as 415', async (_label, headers) => {
    const response = await main.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: JSON.stringify({ email: adminEmail, password: PASSWORD }),
      headers,
    });
    expect(response.statusCode).toBe(415);
    expect(response.json()).toEqual(toErrorEnvelope('unsupported_media_type'));
  });

  it('rejects a write without any Content-Type header as 415', async () => {
    const response = await main.app.inject({ method: 'POST', url: '/api/auth/logout' });
    expect(response.statusCode).toBe(415);
    expect(response.json()).toEqual(toErrorEnvelope('unsupported_media_type'));
  });

  it('accepts application/json with a charset parameter', async () => {
    const response = await main.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: JSON.stringify({ email: adminEmail, password: PASSWORD }),
      headers: { 'content-type': 'Application/JSON; charset=utf-8' },
    });
    expect(response.statusCode).toBe(200);
  });

  it('keeps unknown /api routes at 404 regardless of Content-Type', async () => {
    const response = await main.app.inject({ method: 'POST', url: '/api/tidak-ada', payload: 'x', headers: { 'content-type': 'text/plain' } });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(toErrorEnvelope('not_found'));
  });
});

describe('GET /api/auth/session (FR-1)', () => {
  it('returns the admin email for a valid cookie', async () => {
    const token = sessionCookieOf(await login(main.app, { email: adminEmail, password: PASSWORD }));
    const response = await main.app.inject({ method: 'GET', url: '/api/auth/session', cookies: { [SESSION_COOKIE]: token } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ email: adminEmail });
  });

  it('answers 401 unauthorized without a cookie, with an unknown token, and once now >= expires_at', async () => {
    const token = sessionCookieOf(await login(main.app, { email: adminEmail, password: PASSWORD }));
    const expired = await makeApp({ services: createServices({ db: testDb.db, clock: fixedClock('2026-11-09T15:00:00.000Z') }) });

    const responses = [
      await main.app.inject({ method: 'GET', url: '/api/auth/session' }),
      await main.app.inject({ method: 'GET', url: '/api/auth/session', cookies: { [SESSION_COOKIE]: 'tidak-dikenal' } }),
      await expired.app.inject({ method: 'GET', url: '/api/auth/session', cookies: { [SESSION_COOKIE]: token } }),
    ];
    for (const response of responses) {
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual(UNAUTHORIZED);
    }
  });
});

describe('POST /api/auth/logout (FR-1)', () => {
  const logout = (app: FastifyInstance, token?: string) =>
    app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      payload: '{}',
      headers: { 'content-type': 'application/json' },
      ...(token === undefined ? {} : { cookies: { [SESSION_COOKIE]: token } }),
    });

  it('deletes the session row, clears the cookie, and the old token is then rejected', async () => {
    const token = sessionCookieOf(await login(main.app, { email: adminEmail, password: PASSWORD }));
    const before = sessionCount();

    const response = await logout(main.app, token);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ loggedOut: true });
    const cleared = response.cookies.find((c) => c.name === SESSION_COOKIE);
    expect(cleared?.value).toBe('');
    expect(cleared?.httpOnly).toBe(true);
    expect(sessionCount()).toBe(before - 1);

    const after = await main.app.inject({ method: 'GET', url: '/api/auth/session', cookies: { [SESSION_COOKIE]: token } });
    expect(after.statusCode).toBe(401);
    expect(after.json()).toEqual(UNAUTHORIZED);
  });

  it('is idempotent: 200 and a cleared cookie without a valid session', async () => {
    for (const token of [undefined, 'tidak-dikenal']) {
      const response = await logout(main.app, token);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ loggedOut: true });
      expect(response.cookies.find((c) => c.name === SESSION_COOKIE)?.value).toBe('');
    }
  });
});

describe('/api/admin auth hook (AD-8, P0-008)', () => {
  const adminRoutesOf = (routes: RouteOptions[]) =>
    routes
      .filter((route) => route.url.startsWith('/api/admin'))
      .flatMap((route) => (Array.isArray(route.method) ? route.method : [route.method]).map((method) => ({ method, url: route.url })))
      .filter(({ method }) => method !== 'HEAD');

  const callAll = async (app: FastifyInstance, routes: RouteOptions[], token?: string) =>
    Promise.all(
      adminRoutesOf(routes).map(({ method, url }) =>
        app.inject({
          method: method as 'GET',
          url: url.replace(':id', '1'),
          ...(method === 'GET' || method === 'DELETE' ? {} : { payload: '{}', headers: { 'content-type': 'application/json' } }),
          ...(token === undefined ? {} : { cookies: { [SESSION_COOKIE]: token } }),
        }),
      ),
    );

  it('discovers every admin route via onRoute', () => {
    expect(adminRoutesOf(main.routes).map((r) => `${r.method} ${r.url}`).sort()).toEqual(
      ['DELETE /api/admin/uji/:id', 'GET /api/admin/uji', 'PATCH /api/admin/uji/:id', 'POST /api/admin/uji', 'PUT /api/admin/uji/:id'].sort(),
    );
  });

  it('answers 401 for every admin route without a valid session, and never runs the handler', async () => {
    const token = sessionCookieOf(await login(main.app, { email: adminEmail, password: PASSWORD }));
    const expired = await makeApp({ services: createServices({ db: testDb.db, clock: fixedClock('2026-11-09T15:00:00.000Z') }) });
    handlerCalls = 0;

    const responses = [
      ...(await callAll(main.app, main.routes)),
      ...(await callAll(main.app, main.routes, 'tidak-dikenal')),
      ...(await callAll(expired.app, expired.routes, token)),
    ];

    expect(responses).toHaveLength(15);
    for (const response of responses) {
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual(UNAUTHORIZED);
    }
    expect(handlerCalls).toBe(0);
  });

  it('answers 401 (not 415) for a non-JSON write without a session', async () => {
    const response = await main.app.inject({ method: 'POST', url: '/api/admin/uji', payload: 'x', headers: { 'content-type': 'text/plain' } });
    expect(response.statusCode).toBe(401);
  });

  it.each(['POST', 'PUT', 'PATCH'] as const)('answers 415 for a non-JSON %s with a valid session, without running the handler', async (method) => {
    const token = sessionCookieOf(await login(main.app, { email: adminEmail, password: PASSWORD }));
    handlerCalls = 0;
    const response = await main.app.inject({
      method,
      url: method === 'POST' ? '/api/admin/uji' : '/api/admin/uji/1',
      payload: 'x',
      headers: { 'content-type': 'text/plain' },
      cookies: { [SESSION_COOKIE]: token },
    });
    expect(response.statusCode).toBe(415);
    expect(response.json()).toEqual(toErrorEnvelope('unsupported_media_type'));
    expect(handlerCalls).toBe(0);
  });

  it('runs the handler with request.admin for a valid session', async () => {
    const token = sessionCookieOf(await login(main.app, { email: adminEmail, password: PASSWORD }));
    handlerCalls = 0;
    const responses = await callAll(main.app, main.routes, token);
    for (const response of responses) {
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ email: adminEmail });
    }
    expect(handlerCalls).toBe(5);
  });
});

describe('fallback error envelope (AD-8)', () => {
  it('maps an unexpected throw to 500 internal_error without leaking the raw message', async () => {
    const response = await main.app.inject({ method: 'GET', url: '/api/uji/meledak' });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(toErrorEnvelope('internal_error'));
    expect(response.body).not.toContain('SELECT');
    expect(logLines.join('\n')).toContain('SELECT secret FROM admins');
  });
});

describe('logging privacy (NFR-8)', () => {
  it('never writes the password, a session token, the cookie, or the admin email to the log', async () => {
    const response = await login(main.app, { email: adminEmail, password: PASSWORD });
    const token = sessionCookieOf(response);
    await main.app.inject({ method: 'GET', url: '/api/auth/session', cookies: { [SESSION_COOKIE]: token } });
    await main.app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      payload: '{}',
      headers: { 'content-type': 'application/json' },
      cookies: { [SESSION_COOKIE]: token },
    });

    const log = logLines.join('\n');
    expect(logLines.length).toBeGreaterThan(0);
    expect(log).toContain('/api/auth/login');
    expect(log).not.toContain(PASSWORD);
    expect(log).not.toContain(token);
    expect(log).not.toContain(SESSION_COOKIE);
    expect(log.toLowerCase()).not.toContain(adminEmail.toLowerCase());
  });
});
