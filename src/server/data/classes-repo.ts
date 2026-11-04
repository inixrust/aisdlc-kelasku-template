/**
 * Repository `classes` dan `class_sessions` (AD-2, AD-10). SQL berparameter saja.
 * Fungsi tulis menerima `Tx` (hanya di dalam `withWriteTx`); fungsi baca menerima `Db`.
 */
import type { Db, Tx } from './db.js';

export interface ClassRow {
  id: number;
  publicCode: string;
  title: string;
  quota: number;
}

const SELECT_CLASS = 'SELECT id, public_code AS publicCode, title, quota FROM classes';

export function findClassById(db: Db, id: number): ClassRow | undefined {
  return db.prepare(`${SELECT_CLASS} WHERE id = ?`).get(id) as ClassRow | undefined;
}

export function findClassByPublicCode(db: Db, publicCode: string): ClassRow | undefined {
  return db.prepare(`${SELECT_CLASS} WHERE public_code = ?`).get(publicCode) as ClassRow | undefined;
}

export function publicCodeExists(db: Db, publicCode: string): boolean {
  return db.prepare('SELECT 1 FROM classes WHERE public_code = ?').get(publicCode) !== undefined;
}

export function classTitleExists(db: Db, title: string): boolean {
  return db.prepare('SELECT 1 FROM classes WHERE title = ?').get(title) !== undefined;
}

/** Tanggal sesi satu kelas, terurut naik. */
export function listSessionDates(db: Db, classId: number): string[] {
  return (
    db.prepare('SELECT session_date AS sessionDate FROM class_sessions WHERE class_id = ? ORDER BY session_date').all(classId) as {
      sessionDate: string;
    }[]
  ).map((row) => row.sessionDate);
}

export function insertClass(tx: Tx, row: { publicCode: string; title: string; quota: number; nowIso: string }): number {
  const result = tx
    .prepare(
      `INSERT INTO classes (public_code, title, quota, created_at, updated_at)
       VALUES (@publicCode, @title, @quota, @nowIso, @nowIso)`,
    )
    .run(row);
  return Number(result.lastInsertRowid);
}

export function insertSessions(tx: Tx, classId: number, sessionDates: readonly string[]): void {
  const insert = tx.prepare('INSERT INTO class_sessions (class_id, session_date) VALUES (?, ?)');
  for (const sessionDate of sessionDates) insert.run(classId, sessionDate);
}
