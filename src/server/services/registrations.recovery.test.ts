/**
 * Automate Story 1.7 — jalur pemulihan use-case `register` yang tidak bisa dipicu dari luar secara deterministik.
 * - 1.7-INT-007 (P1, R-002, R-020): `SQLITE_CONSTRAINT_UNIQUE` dari insert kedua → baca ulang → 200 `alreadyActive`,
 *   bukan error (AD-5). Dipaksa dengan membuat cek aktif di transaksi pertama "basi" satu kali, sehingga insert
 *   menabrak unique index parsial seperti pada balapan sungguhan.
 * - Tabrakan `public_ref` (P3, AD-10): ref yang sudah dipakai dibuat ulang; 5 tabrakan → gagal tanpa baris.
 *
 * DB tetap berkas SQLite nyata. Hanya dua seam yang dikendalikan: `findActiveRegistration` (baca) dan
 * `crypto.randomBytes`. Di luar antrean/penghitung, keduanya memakai implementasi asli.
 * Berkas terpisah karena `vi.mock` berlaku untuk seluruh modul test.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { givenClass, statusCounts } from '../../../test/helpers/registrations.js';
import { createTestDb, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueEmail } from '../../../test/helpers/unique.js';

const forced = vi.hoisted(() => ({ staleActiveChecks: 0, bytes: [] as Buffer[] }));

vi.mock('../data/registrations-repo.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/registrations-repo.js')>();
  return {
    ...actual,
    findActiveRegistration: (...args: Parameters<typeof actual.findActiveRegistration>) => {
      if (forced.staleActiveChecks > 0) {
        forced.staleActiveChecks -= 1;
        return undefined;
      }
      return actual.findActiveRegistration(...args);
    },
  };
});

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  const randomBytes = ((size: number) => forced.bytes.shift() ?? actual.randomBytes(size)) as typeof actual.randomBytes;
  return { ...actual, randomBytes, default: { ...actual, randomBytes } };
});

/** 8 byte nol → base64url `AAAAAAAAAAA` → ref `AAAAAAAAAA`. */
const ZEROS = (): Buffer => Buffer.alloc(8, 0x00);

let testDb: TestDb;

const rowCount = (): number => (testDb.db.prepare('SELECT COUNT(*) AS n FROM registrations').get() as { n: number }).n;

beforeAll(() => {
  testDb = createTestDb();
});

afterEach(() => {
  forced.staleActiveChecks = 0;
  forced.bytes.length = 0;
});

afterAll(() => testDb.cleanup());

describe('R2: unique-constraint recovery in register (FR9, AD-5)', () => {
  it('[P1] 1.7-INT-007 R2: a unique violation from a stale active check is answered as alreadyActive, not an error', () => {
    const cls = givenClass(testDb.db, { quota: 1 });
    const budi = uniqueEmail('budi');
    const first = testDb.services.registrations.register(cls.publicCode, { name: 'Budi Santoso', email: budi });

    forced.staleActiveChecks = 1;
    const again = testDb.services.registrations.register(cls.publicCode, { name: 'Budi Santoso', email: ` ${budi.toUpperCase()}` });

    // Kriteria inti: tabrakan unique index dipetakan ke hasil sah, bukan SqliteError.
    expect(again).toMatchObject({ status: 'registered', alreadyActive: true, registrationRef: first.registrationRef });

    // Jalur yang dimaksud benar-benar terjadi: cek basi terpakai, insert pertama digulung balik.
    expect(forced.staleActiveChecks).toBe(0);
    expect(statusCounts(testDb.db, cls.id)).toEqual({ registered: 1, waitlisted: 0, cancelled: 0 });

    // Cabang Daftar tunggu: posisi dibaca ulang dari baris yang sudah ada.
    const sari = uniqueEmail('sari');
    const waiting = testDb.services.registrations.register(cls.publicCode, { name: 'Sari Wulandari', email: sari });
    forced.staleActiveChecks = 1;
    const waitingAgain = testDb.services.registrations.register(cls.publicCode, { name: 'Sari Wulandari', email: sari });
    expect(waitingAgain).toEqual({ ...waiting, alreadyActive: true });
    expect(waitingAgain.waitlistPosition).toBe(1);
    expect(statusCounts(testDb.db, cls.id)).toEqual({ registered: 1, waitlisted: 1, cancelled: 0 });
  });
});

describe('public_ref generation (AD-10)', () => {
  it('[P3] AD-10: a public_ref collision is regenerated, and five collisions fail without writing a row', () => {
    const cls = givenClass(testDb.db, { quota: 50 });
    forced.bytes.push(ZEROS());
    const owner = testDb.services.registrations.register(cls.publicCode, { name: 'Pemilik Ref', email: uniqueEmail('ref') });
    expect(owner.registrationRef).toBe('AAAAAAAAAA');

    // Satu tabrakan → ref baru dari byte asli.
    forced.bytes.push(ZEROS());
    const next = testDb.services.registrations.register(cls.publicCode, { name: 'Peserta Kedua', email: uniqueEmail('ref') });
    expect(next.registrationRef).not.toBe('AAAAAAAAAA');
    expect(next.registrationRef).toMatch(/^[A-Za-z0-9_-]{10}$/);

    // Lima tabrakan berturut-turut → gagal, transaksi digulung balik.
    const before = rowCount();
    forced.bytes.push(ZEROS(), ZEROS(), ZEROS(), ZEROS(), ZEROS());
    expect(() =>
      testDb.services.registrations.register(cls.publicCode, { name: 'Peserta Ketiga', email: uniqueEmail('ref') }),
    ).toThrow(/public_ref unik/);
    expect(rowCount()).toBe(before);
  });
});
