import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERRORS } from '../../shared/errors.js';
import { ApiError, apiRequest, configureApi, loginPath, resetApiConfig, safeNextPath } from './client.js';

const ORIGIN = 'http://kelasku.local';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function setup(respond: () => Promise<Response>, currentPath = '/admin/kelas') {
  const fetch = vi.fn((_input: string, _init: RequestInit) => respond());
  const navigate = vi.fn();
  configureApi({ fetch, navigate, currentPath: () => currentPath });
  return { fetch, navigate };
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error('promise tidak reject');
}

afterEach(() => resetApiConfig());

describe('P2-012 fetch wrapper (AD-8)', () => {
  it('P2-012: resolves the JSON body of a 2xx response', async () => {
    setup(async () => jsonResponse(200, { email: 'admin@contoh.id' }));
    await expect(apiRequest('GET', '/api/auth/session')).resolves.toEqual({ email: 'admin@contoh.id' });
  });

  it('P2-012: GET sends same-origin credentials, no-store cache, and no body', async () => {
    const { fetch } = setup(async () => jsonResponse(200, {}));
    await apiRequest('GET', '/api/auth/session');
    const [input, init] = fetch.mock.calls[0]!;
    expect(input).toBe('/api/auth/session');
    expect(init).toMatchObject({ method: 'GET', credentials: 'same-origin', cache: 'no-store' });
    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('P2-012: writes always send Content-Type application/json, with {} when there is no body', async () => {
    const { fetch } = setup(async () => jsonResponse(200, { loggedOut: true }));
    await apiRequest('POST', '/api/auth/logout');
    await apiRequest('POST', '/api/auth/login', { body: { email: 'a@b.c', password: 'x' } });
    const [, logoutInit] = fetch.mock.calls[0]!;
    const [, loginInit] = fetch.mock.calls[1]!;
    expect(logoutInit).toMatchObject({ method: 'POST', credentials: 'same-origin', cache: 'no-store', body: '{}' });
    expect(logoutInit.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(loginInit.body).toBe(JSON.stringify({ email: 'a@b.c', password: 'x' }));
  });

  it('P2-012: a rejected fetch becomes network_error with the registry message', async () => {
    setup(() => Promise.reject(new TypeError('Failed to fetch')));
    const error = await rejection(apiRequest('GET', '/api/auth/session'));
    expect(error.code).toBe('network_error');
    expect(error.message).toBe(ERRORS.network_error.message);
    expect(error.status).toBeNull();
  });

  it.each([
    ['500 HTML', () => new Response('<html>Internal</html>', { status: 500, headers: { 'Content-Type': 'text/html' } })],
    ['200 non-JSON', () => new Response('ok', { status: 200 })],
    ['unknown error code', () => jsonResponse(400, { error: { code: 'tidak_dikenal', message: 'x' } })],
    ['envelope without message', () => jsonResponse(400, { error: { code: 'validation_error' } })],
    ['non-string fields', () => jsonResponse(400, { error: { code: 'validation_error', message: 'x', fields: { a: 1 } } })],
    ['JSON without envelope', () => jsonResponse(502, { pesan: 'gateway' })],
  ])('P2-012: %s becomes unexpected_response with the registry message', async (_label, make) => {
    setup(async () => make());
    const error = await rejection(apiRequest('GET', '/api/x'));
    expect(error.code).toBe('unexpected_response');
    expect(error.message).toBe(ERRORS.unexpected_response.message);
  });

  it('P2-012: an envelope becomes ApiError with code, registry message, and fields', async () => {
    setup(async () =>
      jsonResponse(400, {
        error: { code: 'validation_error', message: ERRORS.validation_error.message, fields: { email: 'Email wajib diisi.' } },
      }),
    );
    const error = await rejection(apiRequest('POST', '/api/auth/login', { body: {} }));
    expect(error.code).toBe('validation_error');
    expect(error.status).toBe(400);
    expect(error.message).toBe(ERRORS.validation_error.message);
    expect(error.fields).toEqual({ email: 'Email wajib diisi.' });
  });

  it('P2-012: 401 unauthorized redirects to Masuk with next and sessionExpired, then still rejects', async () => {
    const { navigate } = setup(async () => jsonResponse(401, { error: { code: 'unauthorized', message: ERRORS.unauthorized.message } }));
    const error = await rejection(apiRequest('GET', '/api/auth/session'));
    expect(error.code).toBe('unauthorized');
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/admin/masuk?next=/admin/kelas', { replace: true, state: { sessionExpired: true } });
  });

  it('P2-012: 401 keeps the search string of the current path in next', async () => {
    const { navigate } = setup(
      async () => jsonResponse(401, { error: { code: 'unauthorized', message: ERRORS.unauthorized.message } }),
      '/admin/kelas?x=1',
    );
    await rejection(apiRequest('GET', '/api/admin/classes'));
    const [to] = navigate.mock.calls[0]!;
    expect(to).toBe('/admin/masuk?next=/admin/kelas%3Fx%3D1');
    expect(new URL(to as string, ORIGIN).searchParams.get('next')).toBe('/admin/kelas?x=1');
  });

  it("P2-012: on401 'throw' rejects without redirecting (login, AdminLayout session check)", async () => {
    const { navigate } = setup(async () => jsonResponse(401, { error: { code: 'unauthorized', message: ERRORS.unauthorized.message } }));
    const error = await rejection(apiRequest('GET', '/api/auth/session', { on401: 'throw' }));
    expect(error.code).toBe('unauthorized');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('P2-012: invalid_credentials (401) never redirects', async () => {
    const { navigate } = setup(async () =>
      jsonResponse(401, { error: { code: 'invalid_credentials', message: ERRORS.invalid_credentials.message } }),
    );
    const error = await rejection(apiRequest('POST', '/api/auth/login', { body: {} }));
    expect(error.code).toBe('invalid_credentials');
    expect(error.message).toBe('Email atau password salah');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('P2-012: a 401 on the Masuk page does not redirect to itself', async () => {
    const { navigate } = setup(
      async () => jsonResponse(401, { error: { code: 'unauthorized', message: ERRORS.unauthorized.message } }),
      '/admin/masuk?next=/admin/kelas',
    );
    await rejection(apiRequest('GET', '/api/auth/session'));
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('P2-012 AD-8 the wrapper is the only fetch caller', () => {
  it('P2-012: no file in src/client/ other than api/client.ts calls fetch', () => {
    const root = path.resolve(import.meta.dirname, '..');
    const callers = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
      .map((entry) => path.join(entry.parentPath, entry.name))
      .filter((file) => /\bfetch\s*\(/.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(root, file).split(path.sep).join('/'));
    expect(callers).toEqual(['api/client.ts']);
  });
});

describe('P2-012 safeNextPath (open redirect guard)', () => {
  it.each([
    ['/admin/kelas?x=1', '/admin/kelas?x=1'],
    ['/admin/kelas', '/admin/kelas'],
    ['//evil.example', '/admin'],
    ['https://evil.example', '/admin'],
    ['/\\evil', '/admin'],
    ['javascript:x', '/admin'],
    ['', '/admin'],
    [null, '/admin'],
    [undefined, '/admin'],
    ['/\t/evil.example', '/admin'],
    ['admin/kelas', '/admin'],
  ])('P2-012: next %j → %s', (next, expected) => {
    expect(safeNextPath(next, ORIGIN)).toBe(expected);
  });

  it('P2-012: loginPath round-trips through safeNextPath', () => {
    const url = new URL(loginPath('/admin/kelas?x=1&y=2'), ORIGIN);
    expect(url.pathname).toBe('/admin/masuk');
    expect(safeNextPath(url.searchParams.get('next'), ORIGIN)).toBe('/admin/kelas?x=1&y=2');
    expect(loginPath('/admin/kelas')).toBe('/admin/masuk?next=/admin/kelas');
  });
});
