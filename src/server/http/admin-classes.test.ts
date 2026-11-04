/**
 * ATDD Story 1.6 (fase hijau) — rute admin kelas.
 * - AC-3 (1.6-API-001 + 1.6-API-002, P1): `POST /api/admin/classes` → 201 DTO; validasi → 400.
 * - AC-8 (1.6-API-003, P2): `GET /api/admin/classes/:id` id tak dikenal → 404 `class_not_found`.
 * Auth 401 untuk rute baru sudah dicakup enumerasi `onRoute` di `auth.test.ts` (P0-008).
 *
 * Fase hijau: diaktifkan oleh Story 1.6; `class_not_found` kini terdaftar di `src/shared/errors.ts`.
 */
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTempDir, type TempDir } from '../../../test/helpers/temp-dir.js';
import { createTestDb, fixedClock, TEST_NOW_ISO, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueEmail, uniqueTitle } from '../../../test/helpers/unique.js';
import { getError } from '../../shared/errors.js';
import { createServices } from '../services/index.js';
import { buildApp } from './app.js';
import { SESSION_COOKIE } from './session-cookie.js';

const PASSWORD = 'rahasia-admin-123';
/** `TEST_NOW_ISO` = Senin 9 Nov 2026, 10.00 WIB. */
const TODAY = '2026-11-09';
const PUBLIC_CODE = /^[A-Za-z0-9_-]{10}$/;

let testDb: TestDb;
let clientDir: TempDir;
let app: FastifyInstance;
let cookie: string;

interface ClassDto {
  id: number;
  publicCode: string;
  title: string;
  sessionDates: string[];
  quota: number;
  today: string;
}

interface ErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

function adminRequest(method: 'GET' | 'POST', url: string, body?: unknown): Promise<LightMyRequestResponse> {
  return app.inject({
    method,
    url,
    headers: {
      cookie: `${SESSION_COOKIE}=${cookie}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { payload: JSON.stringify(body) }),
  });
}

function validClass(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: uniqueTitle('Excel untuk Laporan Keuangan'),
    sessionDates: ['2026-11-23', TODAY, '2026-11-16'],
    quota: 20,
    ...overrides,
  };
}

const count = (sql: string, ...params: unknown[]): number =>
  (testDb.db.prepare(sql).get(...params) as { n: number }).n;

beforeAll(async () => {
  testDb = createTestDb();
  clientDir = createTempDir('kelasku-client-');
  const adminEmail = uniqueEmail('admin');
  await testDb.services.auth.upsertAdmin({ email: adminEmail, password: PASSWORD });
  app = await buildApp({ services: testDb.services, clientDir: clientDir.path });
  const login = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ email: adminEmail, password: PASSWORD }),
  });
  const session = login.cookies.find((c) => c.name === SESSION_COOKIE);
  if (session === undefined) throw new Error('login admin test gagal: cookie sesi tidak di-set');
  cookie = session.value;
});

afterAll(async () => {
  await app.close();
  clientDir.cleanup();
  testDb.cleanup();
});

describe('POST /api/admin/classes (FR2, FR6, AD-3, AD-10)', () => {
  it('[P1] AC-3 FR2: a valid class is stored with its sessions in one transaction and answered 201 with the class DTO', async () => {
    const title = uniqueTitle('Excel untuk Laporan Keuangan');
    const response = await adminRequest('POST', '/api/admin/classes', validClass({ title: `  ${title}  ` }));

    // Kriteria inti.
    expect(response.statusCode).toBe(201);

    const body = response.json<ClassDto>();
    expect(body).toEqual({
      id: expect.any(Number),
      publicCode: expect.stringMatching(PUBLIC_CODE),
      title,
      sessionDates: [TODAY, '2026-11-16', '2026-11-23'],
      quota: 20,
      today: TODAY,
    });
    expect(body.publicCode).not.toContain(String(body.id));

    // Kelas + sesi tersimpan bersama; waktu dari ctx.nowIso (AD-15).
    expect(count('SELECT COUNT(*) AS n FROM classes WHERE id = ? AND public_code = ? AND created_at = ?', body.id, body.publicCode, TEST_NOW_ISO)).toBe(1);
    expect(count('SELECT COUNT(*) AS n FROM class_sessions WHERE class_id = ?', body.id)).toBe(3);

    // 1.6-API-002 — validasi per kolom: 400 validation_error, `fields` Indonesia, tanpa baris baru.
    const VALIDATION = getError('validation_error');
    const cases: Array<[string, Record<string, unknown>, string]> = [
      ['blank title after trim', validClass({ title: '   ' }), 'title'],
      ['title longer than 120 characters', validClass({ title: 'J'.repeat(121) }), 'title'],
      ['quota 0', validClass({ quota: 0 }), 'quota'],
      ['fractional quota', validClass({ quota: 2.5 }), 'quota'],
      ['quota as text', validClass({ quota: '20' }), 'quota'],
      ['no session dates', validClass({ sessionDates: [] }), 'sessionDates'],
      ['only today (would be born finished)', validClass({ sessionDates: [TODAY] }), 'sessionDates'],
      ['duplicate session date', validClass({ sessionDates: ['2026-11-16', '2026-11-16'] }), 'sessionDates.1'],
    ];
    const classesBefore = count('SELECT COUNT(*) AS n FROM classes');
    for (const [label, payload, field] of cases) {
      const invalid = await adminRequest('POST', '/api/admin/classes', payload);
      expect(invalid.statusCode, label).toBe(VALIDATION.httpStatus);
      const { error } = invalid.json<ErrorBody>();
      expect(error.code, label).toBe(VALIDATION.code);
      expect(error.message, label).toBe(VALIDATION.message);
      expect(error.fields?.[field], label).toMatch(/\S/);
    }
    const duplicate = await adminRequest('POST', '/api/admin/classes', validClass({ sessionDates: ['2026-11-16', '2026-11-16'] }));
    expect(duplicate.json<ErrorBody>().error.fields).toEqual({ 'sessionDates.1': 'Tanggal 16 Nov 2026 sudah ada di kelas ini' });
    expect(count('SELECT COUNT(*) AS n FROM classes')).toBe(classesBefore);

    // Batas atas judul diterima.
    const longest = await adminRequest('POST', '/api/admin/classes', validClass({ title: 'J'.repeat(120) }));
    expect(longest.statusCode).toBe(201);
  });
});

describe('GET /api/admin/classes/:id (FR5, AD-8, AD-10)', () => {
  it('[P2] AC-8 FR5: an unknown class id answers 404 class_not_found', async () => {
    const response = await adminRequest('GET', '/api/admin/classes/987654');

    // Kriteria inti.
    expect(response.json<ErrorBody>().error.code).toBe(getError('class_not_found').code);

    expect(response.statusCode).toBe(404);
    expect(response.json<ErrorBody>().error.message).toMatch(/\S/);

    // P1-011: id internal tidak menjadi bagian tautan pendaftaran.
    const created = (await adminRequest('POST', '/api/admin/classes', validClass())).json<ClassDto>();
    const read = await adminRequest('GET', `/api/admin/classes/${created.id}`);
    expect(read.statusCode).toBe(200);
    expect(read.json<ClassDto>()).toMatchObject({ id: created.id, publicCode: created.publicCode, today: TODAY });
    expect(created.publicCode).toMatch(PUBLIC_CODE);
    expect(created.publicCode).not.toContain(String(created.id));
  });

  it('[P2] AC-8 FR5: a non-numeric class id answers 404 class_not_found, not a server error', async () => {
    const response = await adminRequest('GET', '/api/admin/classes/abc');

    expect(response.statusCode).toBe(404);
    expect(response.json<ErrorBody>().error.code).toBe(getError('class_not_found').code);
  });
});

describe('POST /api/admin/classes — past-only dates (FR2, AD-19)', () => {
  it('[P2] AC-1 FR2: a class whose only session is in the past answers 400 on sessionDates without a new row', async () => {
    const before = count('SELECT COUNT(*) AS n FROM classes');

    const response = await adminRequest('POST', '/api/admin/classes', validClass({ sessionDates: ['2026-11-02'] }));

    expect(response.statusCode).toBe(getError('validation_error').httpStatus);
    expect(response.json<ErrorBody>().error.fields?.sessionDates).toMatch(/\S/);
    expect(count('SELECT COUNT(*) AS n FROM classes')).toBe(before);
  });
});

describe('POST /api/admin/classes — malformed session dates (FR2, AD-8)', () => {
  it('[P2] AC-3 FR2: an impossible calendar date or a non-string date answers 400 on sessionDates.0 without a new row', async () => {
    const VALIDATION = getError('validation_error');
    const before = count('SELECT COUNT(*) AS n FROM classes');

    for (const sessionDates of [['2026-02-30', '2026-11-16'], [123, '2026-11-16']]) {
      const response = await adminRequest('POST', '/api/admin/classes', validClass({ sessionDates }));
      const label = JSON.stringify(sessionDates);
      expect(response.statusCode, label).toBe(VALIDATION.httpStatus);
      const { error } = response.json<ErrorBody>();
      expect(error.code, label).toBe(VALIDATION.code);
      expect(error.fields?.['sessionDates.0'], label).toMatch(/\S/);
    }

    expect(count('SELECT COUNT(*) AS n FROM classes')).toBe(before);
  });
});

describe('GET /api/admin/classes/:id — derived status (FR4, AD-6)', () => {
  it('[P2] AC-2 FR4: a new class reads as open, and as finished once today reaches its last session date', async () => {
    const created = (await adminRequest('POST', '/api/admin/classes', validClass({ sessionDates: ['2026-11-16', '2026-11-23'] }))).json<ClassDto>();

    const read = await adminRequest('GET', `/api/admin/classes/${created.id}`);
    expect(read.statusCode).toBe(200);
    expect(read.json<ClassDto & { status: string }>().status).toBe('open');

    // Clock lain pada DB yang sama: Senin 23 Nov 2026 10.00 WIB = tanggal sesi terakhir.
    const later = createServices({ db: testDb.db, clock: fixedClock('2026-11-23T03:00:00.000Z') });
    expect(later.classes.getClass(created.id)).toMatchObject({ status: 'finished', today: '2026-11-23' });
    const dayBefore = createServices({ db: testDb.db, clock: fixedClock('2026-11-22T03:00:00.000Z') });
    expect(dayBefore.classes.getClass(created.id).status).toBe('open');
  });
});

describe('POST /api/admin/classes — public code alphabet (P1-011, AD-10)', () => {
  it('[P2] AC-8 FR6: every generated public code is 10 characters without digits', async () => {
    for (let i = 0; i < 20; i += 1) {
      const response = await adminRequest('POST', '/api/admin/classes', validClass());
      expect(response.statusCode).toBe(201);
      expect(response.json<ClassDto>().publicCode).toMatch(/^[A-Za-z_-]{10}$/);
    }
  });
});
