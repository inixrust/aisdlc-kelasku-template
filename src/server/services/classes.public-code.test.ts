/**
 * Automate Story 1.6 — tabrakan `public_code` (cabang sekunder ATDD AC-3; FR6, AD-10). P3.
 * `crypto.randomBytes` diganti antrean byte terkendali agar tabrakan bisa dipaksa secara deterministik;
 * selain antrean, perilaku asli dipakai. DB tetap berkas SQLite nyata (bukan mock).
 * Berkas terpisah karena `vi.mock` berlaku untuk seluruh modul test.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueTitle } from '../../../test/helpers/unique.js';

const forced = vi.hoisted(() => ({ bytes: [] as Buffer[] }));

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  const randomBytes = ((size: number) => forced.bytes.shift() ?? actual.randomBytes(size)) as typeof actual.randomBytes;
  return { ...actual, randomBytes, default: { ...actual, randomBytes } };
});

/** 16 byte nol → base64url `AAAA…` → kode `AAAAAAAAAA`; 16 byte 0xff → kode `__________`. */
const ZEROS = (): Buffer => Buffer.alloc(16, 0x00);
const ONES = (): Buffer => Buffer.alloc(16, 0xff);

let testDb: TestDb;

const countClasses = (): number => (testDb.db.prepare('SELECT COUNT(*) AS n FROM classes').get() as { n: number }).n;
const newClass = () => ({ title: uniqueTitle('Kelas kode publik'), sessionDates: ['2026-11-16'], quota: 5 });

beforeAll(() => {
  testDb = createTestDb();
  // Kelas pertama sengaja memakai kode `AAAAAAAAAA` agar test berikutnya bisa bertabrakan dengannya.
  forced.bytes.push(ZEROS());
  expect(testDb.services.classes.createClass(newClass()).publicCode).toBe('AAAAAAAAAA');
});

afterEach(() => {
  forced.bytes.length = 0;
});

afterAll(() => {
  testDb.cleanup();
});

describe('createClass public code collisions (FR6, AD-10)', () => {
  it('[P3] AC-3 FR6: a colliding public code is regenerated inside the same transaction', () => {
    forced.bytes.push(ZEROS(), ONES());

    const created = testDb.services.classes.createClass(newClass());

    // Kriteria inti: kode kedua dipakai, bukan error UNIQUE.
    expect(created.publicCode).toBe('__________');
    expect(forced.bytes).toHaveLength(0);
  });

  it('[P3] AC-3 FR6: after five consecutive collisions createClass fails without writing a row', () => {
    const before = countClasses();
    forced.bytes.push(ZEROS(), ZEROS(), ZEROS(), ZEROS(), ZEROS());

    expect(() => testDb.services.classes.createClass(newClass())).toThrow(/public_code unik/);

    expect(countClasses()).toBe(before);
    expect(testDb.db.inTransaction).toBe(false);
  });
});
