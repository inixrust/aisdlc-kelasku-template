/**
 * ATDD Story 1.7 — rute publik pendaftaran (`fastify.inject`).
 * - AC-3  (1.7-API-007 bagian kelas publik + 1.7-API-008, P1): `GET /api/public/classes/:code`.
 * - AC-4  (1.7-API-006 + 1.7-API-007, P1): `POST /api/public/classes/:code/registrations` → 200; 400; tanpa id internal; 1.000 ref.
 * - AC-8  (1.7-API-004, P1-016): R2 serial, email dinormalisasi sebelum cek aktif.
 * - AC-13 (1.7-API-005 bagian 409, P1-018): kelas Selesai → 409 `registration_closed`, tanpa baris.
 * Risiko: R-002, R-009, R-022, R-024.
 *
 * Fase hijau: diaktifkan oleh Story 1.7. `registration_closed` (409, "Pendaftaran kelas ini sudah ditutup")
 * terdaftar di `src/shared/errors.ts`; test sengaja memakai nilai literal agar registri ikut teruji.
 */
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { givenClass, statusCounts } from '../../../test/helpers/registrations.js';
import { createTempDir, type TempDir } from '../../../test/helpers/temp-dir.js';
import { createTestDb, TEST_NOW_ISO, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueEmail } from '../../../test/helpers/unique.js';
import { getError } from '../../shared/errors.js';
import { buildApp } from './app.js';

/** `TEST_NOW_ISO` = Senin 9 Nov 2026, 10.00 WIB. */
const TODAY = '2026-11-09';
/** Clock untuk membuat kelas yang kini sudah Selesai lewat use-case (bukan SQL mentah). */
const PAST_NOW_ISO = '2026-11-05T03:00:00.000Z';
const REGISTRATION_REF = /^[A-Za-z0-9_-]{10}$/;
const PUBLIC_CLASS_KEYS = ['publicCode', 'sessionDates', 'status', 'title', 'today'];
const REGISTRATION_KEYS = ['alreadyActive', 'nextSessionDate', 'registrationRef', 'status', 'waitlistPosition'];

let testDb: TestDb;
let clientDir: TempDir;
let app: FastifyInstance;

interface RegistrationBody {
  status: string;
  waitlistPosition?: number;
  nextSessionDate?: string;
  alreadyActive: boolean;
  registrationRef: string;
  error?: { code: string; message: string; fields?: Record<string, string> };
}

function register(publicCode: string, body: unknown): Promise<LightMyRequestResponse> {
  return app.inject({
    method: 'POST',
    url: `/api/public/classes/${publicCode}/registrations`,
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  });
}

function getPublicClass(publicCode: string): Promise<LightMyRequestResponse> {
  return app.inject({ method: 'GET', url: `/api/public/classes/${publicCode}` });
}

const registrationCount = (): number =>
  (testDb.db.prepare('SELECT COUNT(*) AS n FROM registrations').get() as { n: number }).n;

beforeAll(async () => {
  testDb = createTestDb();
  clientDir = createTempDir('kelasku-client-');
  app = await buildApp({ services: testDb.services, clientDir: clientDir.path });
});

afterAll(async () => {
  await app.close();
  clientDir.cleanup();
  testDb.cleanup();
});

describe('GET /api/public/classes/:code (FR7, AD-6, AD-10)', () => {
  it('[P1] AC-3 FR7: a known code returns title, session dates, class status and today without internal id, quota or participant data', async () => {
    const cls = givenClass(testDb.db, { quota: 1, sessionDates: ['2026-11-23', '2026-11-16'] });
    const response = await getPublicClass(cls.publicCode);

    // Kriteria inti.
    expect(response.statusCode).toBe(200);

    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({ title: cls.title, sessionDates: ['2026-11-16', '2026-11-23'], status: 'open', today: TODAY });
    expect(Object.keys(body).filter((key) => !PUBLIC_CLASS_KEYS.includes(key))).toEqual([]);
    expect(response.body).not.toMatch(/"(id|classId|quota|registrations|participants|email|name)"/);

    // Penuh setelah kursi terakhir terisi; Selesai dari tanggal sesi terakhir <= today.
    await register(cls.publicCode, { name: 'Sari Wulandari', email: uniqueEmail('sari') });
    expect((await getPublicClass(cls.publicCode)).json()).toMatchObject({ status: 'full' });
    const finished = givenClass(testDb.db, { nowIso: PAST_NOW_ISO, sessionDates: ['2026-11-06', TODAY] });
    expect((await getPublicClass(finished.publicCode)).json()).toMatchObject({ status: 'finished' });

    // Kode tidak dikenal → 404 class_not_found.
    const unknown = await getPublicClass('TidakAdaKo');
    expect(unknown.statusCode).toBe(getError('class_not_found').httpStatus);
    expect((unknown.json() as RegistrationBody).error?.code).toBe('class_not_found');
  });
});

describe('POST /api/public/classes/:code/registrations (FR7, FR8, FR10, AD-5, AD-10)', () => {
  it('[P1] AC-4 FR7: a valid registration is answered 200 with status and a random registrationRef, never internal ids; invalid input is 400 validation_error', async () => {
    const cls = givenClass(testDb.db, { quota: 2 });
    const email = uniqueEmail('dimas');
    const response = await register(cls.publicCode, { name: 'Dimas Prasetyo', email: `  ${email.toUpperCase()} ` });

    // Kriteria inti.
    expect(response.statusCode).toBe(200);

    const body = response.json() as RegistrationBody;
    expect(body).toMatchObject({ status: 'registered', alreadyActive: false, nextSessionDate: '2026-11-16' });
    expect(body.waitlistPosition).toBeUndefined();
    expect(body.registrationRef).toMatch(REGISTRATION_REF);
    expect(Object.keys(body).filter((key) => !REGISTRATION_KEYS.includes(key))).toEqual([]);
    expect(response.body).not.toMatch(/"(id|classId|registrationId)"/);

    const row = testDb.db
      .prepare('SELECT email, name, status, created_at AS createdAt, public_ref AS publicRef FROM registrations WHERE class_id = ?')
      .get(cls.id);
    expect(row).toEqual({ email, name: 'Dimas Prasetyo', status: 'registered', createdAt: TEST_NOW_ISO, publicRef: body.registrationRef });

    // Input tidak valid → 400 validation_error + fields, tanpa baris baru.
    const before = registrationCount();
    const invalid: Array<[input: Record<string, unknown>, field: string]> = [
      [{ name: '', email: uniqueEmail() }, 'name'],
      [{ name: 'a'.repeat(101), email: uniqueEmail() }, 'name'],
      [{ email: uniqueEmail() }, 'name'],
      [{ name: 'Rina Kusuma', email: 'rina.contoh.id' }, 'email'],
      [{ name: 'Rina Kusuma' }, 'email'],
    ];
    for (const [input, field] of invalid) {
      const rejected = await register(cls.publicCode, input);
      expect(rejected.statusCode, JSON.stringify(Object.keys(input))).toBe(getError('validation_error').httpStatus);
      const error = (rejected.json() as RegistrationBody).error;
      expect(error?.code).toBe('validation_error');
      expect(error?.fields?.[field]).toEqual(expect.any(String));
    }
    expect(registrationCount()).toBe(before);
    // Nama 100 karakter masih sah.
    expect((await register(cls.publicCode, { name: 'a'.repeat(100), email: uniqueEmail() })).statusCode).toBe(200);

    // AD-10: 1.000 registrationRef unik dan tidak berurutan.
    const bulk = givenClass(testDb.db, { quota: 5 });
    const refs: string[] = [];
    for (let i = 0; i < 1000; i++) {
      refs.push((await register(bulk.publicCode, { name: `Peserta ${i + 1}`, email: uniqueEmail() })).json<RegistrationBody>().registrationRef);
    }
    expect(new Set(refs).size).toBe(1000);
    expect(refs.every((ref) => REGISTRATION_REF.test(ref))).toBe(true);
    // Acak → sekitar separuh pasangan berurutan naik; ref berurutan (counter/timestamp) → hampir semua naik.
    const ascendingPairs = refs.slice(1).filter((ref, i) => ref > (refs[i] ?? '')).length;
    expect(ascendingPairs).toBeGreaterThan(350);
    expect(ascendingPairs).toBeLessThan(650);
  }, 60_000);

  it('[P1] AC-8 R2: email is normalized before the active-registration check', async () => {
    const full = givenClass(testDb.db, { quota: 1 });
    await register(full.publicCode, { name: 'Andi Pratama', email: uniqueEmail('andi') });
    await register(full.publicCode, { name: 'Budi Santoso', email: 'Budi@Mail.com ' });
    const again = await register(full.publicCode, { name: 'Budi Santoso', email: 'budi@mail.com' });
    const body = again.json() as RegistrationBody;

    // Kriteria inti.
    expect(body.alreadyActive).toBe(true);

    expect(again.statusCode).toBe(200);
    expect(body).toMatchObject({ status: 'waitlisted', waitlistPosition: 1, alreadyActive: true });
    expect(statusCounts(testDb.db, full.id)).toEqual({ registered: 1, waitlisted: 1, cancelled: 0 });

    // Cabang Terdaftar: tanpa posisi antrean.
    const open = givenClass(testDb.db, { quota: 5 });
    await register(open.publicCode, { name: 'Citra Lestari', email: 'Citra@Mail.com ' });
    const citraAgain = (await register(open.publicCode, { name: 'Citra Lestari', email: 'citra@mail.com' })).json() as RegistrationBody;
    expect(citraAgain).toMatchObject({ status: 'registered', alreadyActive: true });
    expect(citraAgain.waitlistPosition).toBeUndefined();
    expect(statusCounts(testDb.db, open.id)).toEqual({ registered: 1, waitlisted: 0, cancelled: 0 });
  });

  it('[P1] AC-13 FR7: registering to a finished class is 409 registration_closed and creates no row', async () => {
    // Sesi terakhir 6 Nov; kini 9 Nov → Selesai.
    const finished = givenClass(testDb.db, { nowIso: PAST_NOW_ISO, sessionDates: ['2026-11-06'] });
    const response = await register(finished.publicCode, { name: 'Eko Saputra', email: uniqueEmail('eko') });

    // Kriteria inti.
    expect(response.statusCode).toBe(409);

    const error = (response.json() as RegistrationBody).error;
    expect(error).toEqual({ code: 'registration_closed', message: 'Pendaftaran kelas ini sudah ditutup' });
    expect(statusCounts(testDb.db, finished.id)).toEqual({ registered: 0, waitlisted: 0, cancelled: 0 });

    // Sepanjang tanggal sesi terakhir sudah tertutup (`max(session_date) <= today`).
    const lastToday = givenClass(testDb.db, { nowIso: PAST_NOW_ISO, sessionDates: ['2026-11-06', TODAY] });
    expect((await register(lastToday.publicCode, { name: 'Eko Saputra', email: uniqueEmail('eko') })).statusCode).toBe(409);
    expect(statusCounts(testDb.db, lastToday.id)).toEqual({ registered: 0, waitlisted: 0, cancelled: 0 });

    // Kode tidak dikenal → 404 class_not_found, bukan 409.
    const unknown = await register('TidakAdaKo', { name: 'Eko Saputra', email: uniqueEmail('eko') });
    expect((unknown.json() as RegistrationBody).error?.code).toBe('class_not_found');
  });
});
