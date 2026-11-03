import { E2E_ADMIN } from './support/admin';
import { expect, test } from './support/fixtures';

const UNAUTHORIZED = { error: { code: 'unauthorized', message: 'Sesi masuk Anda berakhir. Silakan masuk lagi.' } };

test.describe('auth API (FR-1, AD-9)', () => {
  test('@P0 auth API: login, session, and logout with the seeded admin', async ({ request }) => {
    const login = await request.post('/api/auth/login', {
      data: { email: `  ${E2E_ADMIN.email.toUpperCase()} `, password: E2E_ADMIN.password },
    });
    expect(login.status()).toBe(200);
    expect(await login.json()).toEqual({ email: E2E_ADMIN.email });
    const setCookie = login.headers()['set-cookie'] ?? '';
    expect(setCookie).toContain('kelasku_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');

    const session = await request.get('/api/auth/session');
    expect(session.status()).toBe(200);
    expect(await session.json()).toEqual({ email: E2E_ADMIN.email });

    const logout = await request.post('/api/auth/logout', { data: {} });
    expect(logout.status()).toBe(200);
    expect(await logout.json()).toEqual({ loggedOut: true });

    const after = await request.get('/api/auth/session');
    expect(after.status()).toBe(401);
    expect(await after.json()).toEqual(UNAUTHORIZED);
  });

  test('@P0 auth API: wrong password and unknown email get the same 401 envelope', async ({ request }) => {
    const wrong = await request.post('/api/auth/login', { data: { email: E2E_ADMIN.email, password: 'salah-sekali-123' } });
    const unknown = await request.post('/api/auth/login', { data: { email: 'tidak-ada@kelasku.test', password: E2E_ADMIN.password } });
    for (const response of [wrong, unknown]) {
      expect(response.status()).toBe(401);
      expect(response.headers()['set-cookie']).toBeUndefined();
    }
    expect(await wrong.json()).toEqual(await unknown.json());
    expect((await wrong.json()).error.code).toBe('invalid_credentials');
  });

  test('@P1 auth API: non-JSON writes are rejected with 415', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: `email=${E2E_ADMIN.email}`,
      headers: { 'content-type': 'text/plain' },
    });
    expect(response.status()).toBe(415);
    expect((await response.json()).error.code).toBe('unsupported_media_type');
  });
});
