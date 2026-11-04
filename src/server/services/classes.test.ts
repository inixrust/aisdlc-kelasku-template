/**
 * Automate Story 1.6 — use-case `createClass` (cabang sekunder ATDD AC-3; FR2, FR6, AD-3, AD-10).
 * Kontrak HTTP (201/400/404) sudah dicakup `src/server/http/admin-classes.test.ts`; di sini hanya
 * jaminan yang tidak terlihat dari HTTP: atomisitas satu `withWriteTx` dan keunikan kode publik.
 * DB nyata (berkas SQLite sementara), tanpa mock.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueTitle } from '../../../test/helpers/unique.js';
import { generatePublicCode, PUBLIC_CODE_LENGTH } from './classes.js';

let testDb: TestDb;

const count = (sql: string, ...params: unknown[]): number =>
  (testDb.db.prepare(sql).get(...params) as { n: number }).n;

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => {
  testDb.cleanup();
});

describe('createClass atomicity (FR2, AD-3)', () => {
  it('[P2] AC-3 FR2: a failure while inserting a later session rolls back the class row and earlier sessions', () => {
    const title = uniqueTitle('Kelas gagal tengah jalan');
    const classesBefore = count('SELECT COUNT(*) AS n FROM classes');
    const sessionsBefore = count('SELECT COUNT(*) AS n FROM class_sessions');

    // Fixture test: trigger menggagalkan insert sesi kedua (2026-11-23) setelah kelas + sesi pertama tertulis.
    testDb.db.exec(`
      CREATE TEMP TRIGGER fail_second_session BEFORE INSERT ON class_sessions
      WHEN NEW.session_date = '2026-11-23'
      BEGIN SELECT RAISE(ABORT, 'kegagalan sisipan sesi (fixture test)'); END;
    `);
    try {
      expect(() => testDb.services.classes.createClass({ title, sessionDates: ['2026-11-23', '2026-11-16'], quota: 10 })).toThrow(
        /kegagalan sisipan sesi/,
      );
    } finally {
      testDb.db.exec('DROP TRIGGER IF EXISTS temp.fail_second_session');
    }

    // Kriteria inti: tidak ada kelas setengah jadi.
    expect(count('SELECT COUNT(*) AS n FROM classes')).toBe(classesBefore);
    expect(count('SELECT COUNT(*) AS n FROM class_sessions')).toBe(sessionsBefore);
    expect(testDb.services.classes.hasClassWithTitle(title)).toBe(false);
    expect(testDb.db.inTransaction).toBe(false);

    // Koneksi tetap sehat: percobaan berikutnya tersimpan utuh.
    const created = testDb.services.classes.createClass({ title, sessionDates: ['2026-11-23', '2026-11-16'], quota: 10 });
    expect(count('SELECT COUNT(*) AS n FROM class_sessions WHERE class_id = ?', created.id)).toBe(2);
  });
});

describe('generatePublicCode (FR6, AD-10, P1-011)', () => {
  it('[P2] AC-3 FR6: 1,000 generated public codes are unique, 10 characters long, and digit-free', () => {
    const codes = Array.from({ length: 1000 }, () => generatePublicCode());

    // Kriteria inti: tanpa tabrakan pada 1.000 kode (≈57 bit acak per kode).
    expect(new Set(codes).size).toBe(codes.length);

    expect(PUBLIC_CODE_LENGTH).toBe(10);
    const malformed = codes.filter((code) => !/^[A-Za-z_-]{10}$/.test(code));
    expect(malformed).toEqual([]);
  });
});
