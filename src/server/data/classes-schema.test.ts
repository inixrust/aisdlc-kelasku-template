/**
 * Automate Story 1.6 — skema migrasi `002_classes.sql` (cabang sekunder ATDD AC-1; FR2, FR6, AD-6, AD-10, AD-15).
 * Jaring pengaman lapis DB di bawah validasi zod/domain: bila use-case suatu saat lolos memvalidasi,
 * CHECK/UNIQUE/FK tetap menolak baris yang tidak sah.
 *
 * Sengaja menulis SQL mentah lewat koneksi test (bukan use-case) karena yang diuji adalah skemanya sendiri;
 * tanpa impor `better-sqlite3` (hanya `src/server/data/` produksi yang boleh, fitness test arsitektur).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, TEST_NOW_ISO, type TestDb } from '../../../test/helpers/test-db.js';

let testDb: TestDb;
let codeSeq = 0;

/** Kode publik sah dan unik per panggilan (10 karakter alfabet base64url). */
function nextCode(): string {
  codeSeq += 1;
  let n = codeSeq;
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix = String.fromCharCode(97 + (n % 26)) + suffix;
    n = Math.floor(n / 26);
  }
  return `Schema${suffix}`;
}

interface ClassInsert {
  publicCode: unknown;
  title: unknown;
  quota: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

function insertClass(overrides: Partial<ClassInsert> = {}): number {
  const row: ClassInsert = { publicCode: nextCode(), title: 'Kelas skema', quota: 20, createdAt: TEST_NOW_ISO, updatedAt: TEST_NOW_ISO, ...overrides };
  const result = testDb.db
    .prepare(
      `INSERT INTO classes (public_code, title, quota, created_at, updated_at)
       VALUES (@publicCode, @title, @quota, @createdAt, @updatedAt)`,
    )
    .run(row);
  return Number(result.lastInsertRowid);
}

function insertSession(classId: number, sessionDate: unknown): void {
  testDb.db.prepare('INSERT INTO class_sessions (class_id, session_date) VALUES (?, ?)').run(classId, sessionDate);
}

/** Kode error SQLite dari operasi yang diharapkan gagal; `null` bila operasi berhasil. */
function sqliteCode(operation: () => unknown): string | null {
  try {
    operation();
    return null;
  } catch (error) {
    return (error as { code?: string }).code ?? 'NO_CODE';
  }
}

const countClasses = (): number => (testDb.db.prepare('SELECT COUNT(*) AS n FROM classes').get() as { n: number }).n;

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => {
  testDb.cleanup();
});

describe('migration 002: classes table constraints (FR2, AD-10, AD-15)', () => {
  it('[P2] AC-1 FR2: a valid class row is accepted as the control case', () => {
    expect(sqliteCode(() => insertClass())).toBeNull();
    expect(sqliteCode(() => insertClass({ title: 'J'.repeat(120), quota: 1 }))).toBeNull();
  });

  it.each<[string, Partial<ClassInsert>]>([
    ['quota 0', { quota: 0 }],
    ['negative quota', { quota: -3 }],
    ['fractional quota', { quota: 2.5 }],
    ['non-numeric quota text', { quota: 'dua puluh' }],
    ['empty title', { title: '' }],
    ['title longer than 120 characters', { title: 'J'.repeat(121) }],
    ['public code shorter than 10', { publicCode: 'Abcdefghi' }],
    ['public code longer than 10', { publicCode: 'Abcdefghijk' }],
    ['public code with a non-base64url character', { publicCode: 'Abcd!fghij' }],
    ['created_at in CURRENT_TIMESTAMP format', { createdAt: '2026-11-09 03:00:00' }],
    ['updated_at without the ISO Z suffix', { updatedAt: '2026-11-09T03:00:00.000+07:00' }],
  ])('[P2] AC-1 FR2: CHECK rejects %s without writing a row', (_label, overrides) => {
    const before = countClasses();

    expect(sqliteCode(() => insertClass(overrides))).toBe('SQLITE_CONSTRAINT_CHECK');

    expect(countClasses()).toBe(before);
  });

  it('[P2] AC-1 AD-15: created_at has no SQL time default, so omitting it fails NOT NULL', () => {
    const omitTimestamps = () =>
      testDb.db.prepare('INSERT INTO classes (public_code, title, quota) VALUES (?, ?, ?)').run(nextCode(), 'Tanpa waktu', 5);

    expect(sqliteCode(omitTimestamps)).toBe('SQLITE_CONSTRAINT_NOTNULL');
  });

  it('[P2] AC-1 FR6: public_code is UNIQUE across classes', () => {
    const publicCode = nextCode();
    insertClass({ publicCode });

    expect(sqliteCode(() => insertClass({ publicCode }))).toBe('SQLITE_CONSTRAINT_UNIQUE');
  });
});

describe('migration 002: class_sessions table constraints (FR2, AD-19)', () => {
  it('[P2] AC-1 FR2: a session date is a YYYY-MM-DD string, unique per class, and must reference an existing class', () => {
    const classId = insertClass();
    const otherClassId = insertClass();

    // Kontrol positif: tanggal sah; tanggal yang sama di kelas lain juga sah.
    expect(sqliteCode(() => insertSession(classId, '2026-11-16'))).toBeNull();
    expect(sqliteCode(() => insertSession(otherClassId, '2026-11-16'))).toBeNull();

    // Kriteria inti: tanggal ganda dalam satu kelas ditolak DB walau domain lolos.
    expect(sqliteCode(() => insertSession(classId, '2026-11-16'))).toBe('SQLITE_CONSTRAINT_UNIQUE');

    expect(sqliteCode(() => insertSession(classId, '16 Nov 2026'))).toBe('SQLITE_CONSTRAINT_CHECK');
    expect(sqliteCode(() => insertSession(classId, '2026-11-16T00:00:00Z'))).toBe('SQLITE_CONSTRAINT_CHECK');
    // `foreign_keys = ON` di `createDb`: sesi yatim ditolak.
    expect(sqliteCode(() => insertSession(987_654, '2026-11-23'))).toBe('SQLITE_CONSTRAINT_FOREIGNKEY');

    const sessions = testDb.db.prepare('SELECT session_date AS d FROM class_sessions WHERE class_id = ?').all(classId);
    expect(sessions).toEqual([{ d: '2026-11-16' }]);
  });
});
