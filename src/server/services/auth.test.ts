import { createHash } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestDb, fixedClock, TEST_NOW_ISO } from '../../../test/helpers/test-db.js';
import { uniqueEmail } from '../../../test/helpers/unique.js';
import { AppError } from '../../shared/errors.js';
import { createServices } from './index.js';

const PASSWORD = 'rahasia-panjang-1';

interface AdminDbRow {
  id: number;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  updated_at: string;
}

interface SessionDbRow {
  admin_id: number;
  token_hash: string;
  created_at: string;
  expires_at: string;
}

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

describe('auth use-cases (FR-1, AD-9)', () => {
  const testDb = createTestDb();
  const { db, services } = testDb;
  afterAll(() => testDb.cleanup());

  const adminRow = (email: string): AdminDbRow | undefined =>
    db.prepare('SELECT * FROM admins WHERE email = ?').get(email) as AdminDbRow | undefined;
  const sessionRows = (): SessionDbRow[] => db.prepare('SELECT * FROM admin_sessions ORDER BY id').all() as SessionDbRow[];

  async function expectAppError(promise: Promise<unknown>, code: string): Promise<AppError> {
    const error = await promise.then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    return error as AppError;
  }

  it('upsertAdmin stores a normalized email, a per-account random salt, and an scrypt hash (never the password)', async () => {
    const a = uniqueEmail('admin');
    const b = uniqueEmail('admin');
    expect(await services.auth.upsertAdmin({ email: `  ${a.toUpperCase()} `, password: PASSWORD })).toEqual({ created: true });
    expect(await services.auth.upsertAdmin({ email: b, password: PASSWORD })).toEqual({ created: true });

    const rowA = adminRow(a);
    const rowB = adminRow(b);
    expect(rowA).toBeDefined();
    expect(rowB).toBeDefined();
    expect(rowA?.password_salt).toMatch(/^[0-9a-f]{32}$/);
    expect(rowA?.password_hash).toMatch(/^[0-9a-f]{128}$/);
    expect(rowA?.password_salt).not.toBe(rowB?.password_salt);
    expect(rowA?.password_hash).not.toBe(rowB?.password_hash);
    expect(JSON.stringify(rowA)).not.toContain(PASSWORD);
    expect(rowA?.created_at).toBe(TEST_NOW_ISO);
    expect(rowA?.updated_at).toBe(TEST_NOW_ISO);
  });

  it('upsertAdmin is idempotent per email: one row, only the latest password logs in, old sessions revoked', async () => {
    const email = uniqueEmail('admin');
    await services.auth.upsertAdmin({ email, password: 'password-lama-1' });
    const old = await services.auth.login({ email, password: 'password-lama-1' });
    expect(services.auth.getSession(old.token)).not.toBeNull();

    expect(await services.auth.upsertAdmin({ email: email.toUpperCase(), password: 'password-baru-2' })).toEqual({
      created: false,
    });

    expect((db.prepare('SELECT COUNT(*) AS n FROM admins WHERE email = ?').get(email) as { n: number }).n).toBe(1);
    await expectAppError(services.auth.login({ email, password: 'password-lama-1' }), 'invalid_credentials');
    await expect(services.auth.login({ email, password: 'password-baru-2' })).resolves.toMatchObject({ email });
    expect(services.auth.getSession(old.token)).toBeNull();
  });

  it('upsertAdmin rejects a short password or an invalid email with validation_error fields', async () => {
    const short = await expectAppError(services.auth.upsertAdmin({ email: uniqueEmail(), password: 'pendek' }), 'validation_error');
    expect(Object.keys(short.fields ?? {})).toEqual(['password']);
    const badEmail = await expectAppError(services.auth.upsertAdmin({ email: 'bukan-email', password: PASSWORD }), 'validation_error');
    expect(Object.keys(badEmail.fields ?? {})).toEqual(['email']);
  });

  it('login normalizes the email, returns a base64url token, and stores only its SHA-256 with a 12-hour expiry', async () => {
    const email = uniqueEmail('admin');
    await services.auth.upsertAdmin({ email, password: PASSWORD });
    const before = sessionRows().length;

    const result = await services.auth.login({ email: ` ${email.toUpperCase()} `, password: PASSWORD });

    expect(result.email).toBe(email);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.expiresAt).toBe('2026-11-09T15:00:00.000Z');
    const rows = sessionRows();
    expect(rows).toHaveLength(before + 1);
    const row = rows.at(-1);
    expect(row?.token_hash).toBe(sha256(result.token));
    expect(row?.created_at).toBe(TEST_NOW_ISO);
    expect(row?.expires_at).toBe('2026-11-09T15:00:00.000Z');
    expect(JSON.stringify(rows)).not.toContain(result.token);
  });

  it('login rejects an unknown email and a wrong password identically, without creating a session', async () => {
    const email = uniqueEmail('admin');
    await services.auth.upsertAdmin({ email, password: PASSWORD });
    const before = sessionRows().length;

    const unknown = await expectAppError(services.auth.login({ email: uniqueEmail('admin'), password: PASSWORD }), 'invalid_credentials');
    const wrong = await expectAppError(services.auth.login({ email, password: `${PASSWORD}x` }), 'invalid_credentials');

    expect(unknown.toEnvelope()).toEqual(wrong.toEnvelope());
    expect(sessionRows()).toHaveLength(before);
  });

  it('getSession returns the admin for a valid token and null for missing, unknown, or expired tokens', async () => {
    const email = uniqueEmail('admin');
    await services.auth.upsertAdmin({ email, password: PASSWORD });
    const { token } = await services.auth.login({ email, password: PASSWORD });

    expect(services.auth.getSession(token)).toMatchObject({ email });
    expect(services.auth.getSession(undefined)).toBeNull();
    expect(services.auth.getSession('')).toBeNull();
    expect(services.auth.getSession('token-tidak-dikenal')).toBeNull();

    const justBefore = createServices({ db, clock: fixedClock('2026-11-09T14:59:59.999Z') });
    const atExpiry = createServices({ db, clock: fixedClock('2026-11-09T15:00:00.000Z') });
    expect(justBefore.auth.getSession(token)).toMatchObject({ email });
    expect(atExpiry.auth.getSession(token)).toBeNull();
  });

  it('login deletes expired sessions of every admin in the same transaction', async () => {
    const a = uniqueEmail('admin');
    const b = uniqueEmail('admin');
    await services.auth.upsertAdmin({ email: a, password: PASSWORD });
    await services.auth.upsertAdmin({ email: b, password: PASSWORD });
    const stale = await services.auth.login({ email: a, password: PASSWORD });

    const later = createServices({ db, clock: fixedClock('2026-11-10T03:00:00.000Z') });
    const fresh = await later.auth.login({ email: b, password: PASSWORD });

    const hashes = sessionRows().map((row) => row.token_hash);
    expect(hashes).not.toContain(sha256(stale.token));
    expect(hashes).toContain(sha256(fresh.token));
    expect(sessionRows().every((row) => row.expires_at > '2026-11-10T03:00:00.000Z')).toBe(true);
  });

  it('logout deletes only that session and is idempotent', async () => {
    const email = uniqueEmail('admin');
    await services.auth.upsertAdmin({ email, password: PASSWORD });
    const first = await services.auth.login({ email, password: PASSWORD });
    const second = await services.auth.login({ email, password: PASSWORD });

    services.auth.logout(first.token);
    expect(services.auth.getSession(first.token)).toBeNull();
    expect(services.auth.getSession(second.token)).toMatchObject({ email });

    expect(() => services.auth.logout(first.token)).not.toThrow();
    expect(() => services.auth.logout(undefined)).not.toThrow();
    expect(() => services.auth.logout('token-tidak-dikenal')).not.toThrow();
  });

  it('schema enforces the AD-15 timestamp format on *_at columns', () => {
    expect(() =>
      db
        .prepare(
          "INSERT INTO admins (email, password_hash, password_salt, created_at, updated_at) VALUES ('x@contoh.id', 'h', 's', '2026-11-09 03:00:00', '2026-11-09 03:00:00')",
        )
        .run(),
    ).toThrow(/CHECK/);
  });
});
