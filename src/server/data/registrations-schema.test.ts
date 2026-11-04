/**
 * ATDD Story 1.7 — AC-1 (1.7-INT-010, P2 di test design; satu leaf karena setiap AC wajib punya
 * scaffold). Risiko: R-015, R-019. Skema `registrations` (AD-5, AD-10, AD-15, AD-17) lewat SQL mentah.
 * Pemeriksaan statis penulis tunggal (AD-17) kini ada di fitness test HP-3 `src/architecture.test.ts`.
 *
 * Fase hijau: diaktifkan oleh Story 1.7.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { givenClass } from '../../../test/helpers/registrations.js';
import { createTestDb, TEST_NOW_ISO, type TestDb } from '../../../test/helpers/test-db.js';

const EXPECTED_COLUMNS = [
  'cancelled_at',
  'cancelled_by',
  'class_id',
  'created_at',
  'email',
  'id',
  'name',
  'promoted_at',
  'public_ref',
  'status',
];

let testDb: TestDb;
let classId: number;

beforeAll(() => {
  testDb = createTestDb();
  classId = givenClass(testDb.db).id;
});

afterAll(() => testDb.cleanup());

let refSeq = 0;
function insertRaw(row: Partial<Record<string, unknown>> = {}): void {
  refSeq += 1;
  testDb.db
    .prepare(
      `INSERT INTO registrations (public_ref, class_id, email, name, status, created_at, promoted_at, cancelled_at, cancelled_by)
       VALUES (@public_ref, @class_id, @email, @name, @status, @created_at, @promoted_at, @cancelled_at, @cancelled_by)`,
    )
    .run({
      public_ref: `ref${String(refSeq).padStart(7, 'x')}`,
      class_id: classId,
      email: `skema-${refSeq}@contoh.id`,
      name: 'Peserta Skema',
      status: 'registered',
      created_at: TEST_NOW_ISO,
      promoted_at: null,
      cancelled_at: null,
      cancelled_by: null,
      ...row,
    });
}

describe('registrations schema (AD-5, AD-10, AD-15, AD-17)', () => {
  it('[P2] AC-1 AD-17: registrations has the agreed columns, CHECKs and indexes, and no time DEFAULT', () => {
    const columns = testDb.db.prepare("SELECT name, dflt_value AS dflt FROM pragma_table_info('registrations')").all() as {
      name: string;
      dflt: string | null;
    }[];

    // Kriteria inti.
    expect(columns.map((c) => c.name).sort()).toEqual(EXPECTED_COLUMNS);

    // AD-15: tanpa DEFAULT waktu.
    expect(columns.filter((c) => c.name.endsWith('_at') && c.dflt !== null)).toEqual([]);
    const tableSql = (testDb.db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'registrations'").get() as { sql: string }).sql;
    expect(tableSql).not.toMatch(/CURRENT_TIMESTAMP|datetime\s*\(|strftime\s*\(/i);

    // Indeks: unique parsial (class_id, email) WHERE status aktif; (class_id, status, id); (email).
    const indexSql = (testDb.db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'registrations' AND sql IS NOT NULL").all() as { sql: string }[])
      .map((r) => r.sql.replace(/\s+/g, ' '));
    expect(indexSql.some((s) => /UNIQUE/i.test(s) && /\(\s*class_id\s*,\s*email\s*\)/i.test(s) && /WHERE.*status.*IN.*'registered'.*'waitlisted'/i.test(s))).toBe(true);
    expect(indexSql.some((s) => /\(\s*class_id\s*,\s*status\s*,\s*id\s*\)/i.test(s))).toBe(true);
    expect(indexSql.some((s) => /\(\s*email\s*\)/i.test(s))).toBe(true);

    // Baris sah diterima; pelanggaran CHECK/UNIQUE ditolak.
    insertRaw();
    expect(() => insertRaw({ status: 'aktif' })).toThrow(/CHECK/);
    expect(() => insertRaw({ status: 'cancelled' })).toThrow(/CHECK/);
    expect(() => insertRaw({ cancelled_at: TEST_NOW_ISO, cancelled_by: 'admin' })).toThrow(/CHECK/);
    expect(() => insertRaw({ created_at: '2026-11-09 03:00:00' })).toThrow(/CHECK/);
    expect(() => insertRaw({ status: 'waitlisted', promoted_at: '2026-11-09' })).toThrow(/CHECK/);
    expect(() => insertRaw({ email: 'ganda@contoh.id' })).not.toThrow();
    expect(() => insertRaw({ email: 'ganda@contoh.id', status: 'waitlisted' })).toThrow(/UNIQUE/);
    expect(() => insertRaw({ email: 'ganda@contoh.id', status: 'cancelled', cancelled_at: TEST_NOW_ISO, cancelled_by: 'participant' })).not.toThrow();
    expect(() => insertRaw({ class_id: 987654 })).toThrow(/FOREIGN KEY/);

    // AD-17 penulis tunggal + tanpa DELETE dijaga permanen oleh fitness test HP-3 `src/architecture.test.ts`
    // (aturan `registrations-single-writer`, dipindahkan dari sini oleh automate Story 1.7).
  });

  // Automate Story 1.7 — CHECK yang belum disentuh AC-1. Jaring lapis DB di bawah zod (hanya terlihat lewat SQL langsung).
  it.each<[label: string, row: Partial<Record<string, unknown>>]>([
    ['an empty name', { name: '' }],
    ['a 101-character name', { name: 'a'.repeat(101) }],
    ['a 2-character email', { email: 'a@' }],
    ['a 255-character email', { email: `${'a'.repeat(250)}@x.id` }],
    ['a 9-character public_ref', { public_ref: 'AAAAAAAAA' }],
    ['a public_ref outside base64url', { public_ref: 'AAAA+AAAA/' }],
    ['an unknown cancelled_by', { status: 'cancelled', cancelled_at: TEST_NOW_ISO, cancelled_by: 'system' }],
    ['cancelled without cancelled_by', { status: 'cancelled', cancelled_at: TEST_NOW_ISO }],
    ['a cancelled_at that is not ISO-Z', { status: 'cancelled', cancelled_at: '2026-11-09 10:00', cancelled_by: 'admin' }],
  ])('[P2] AD-17: the schema rejects %s', (_label, row) => {
    expect(() => insertRaw(row)).toThrow(/CHECK/);
  });

  it('[P2] AD-17: boundary values 1/100-character name, 254-character email and a full cancellation are accepted', () => {
    expect(() => insertRaw({ name: 'a' })).not.toThrow();
    expect(() => insertRaw({ name: 'a'.repeat(100) })).not.toThrow();
    expect(() => insertRaw({ email: `${'a'.repeat(249)}@x.id` })).not.toThrow();
    expect(() => insertRaw({ status: 'cancelled', cancelled_at: TEST_NOW_ISO, cancelled_by: 'admin' })).not.toThrow();
  });
});
