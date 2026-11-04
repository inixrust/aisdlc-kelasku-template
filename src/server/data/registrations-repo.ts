/**
 * Repository `registrations` (AD-2, AD-5, AD-17). Satu-satunya modul yang menulis tabel ini; tanpa DELETE.
 * SQL berparameter saja. Fungsi tulis menerima `Tx`; fungsi baca menerima `Db` (atau `Tx`).
 */
import type { RegistrationStatus } from '../../shared/glossary.js';
import type { Db, Tx } from './db.js';

export type ActiveStatus = Extract<RegistrationStatus, 'registered' | 'waitlisted'>;

export interface ActiveRegistrationRow {
  id: number;
  publicRef: string;
  status: ActiveStatus;
}

/** Pendaftaran aktif (Terdaftar/Daftar tunggu) untuk email yang **sudah** dinormalisasi. */
export function findActiveRegistration(db: Db, classId: number, email: string): ActiveRegistrationRow | undefined {
  return db
    .prepare(
      `SELECT id, public_ref AS publicRef, status FROM registrations
       WHERE class_id = ? AND email = ? AND status IN ('registered', 'waitlisted')`,
    )
    .get(classId, email) as ActiveRegistrationRow | undefined;
}

export function countRegistered(db: Db, classId: number): number {
  return (
    db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE class_id = ? AND status = 'registered'").get(classId) as {
      n: number;
    }
  ).n;
}

/** Id antrean satu kelas, urut `id` naik (R3). */
export function listWaitlistIds(db: Db, classId: number): number[] {
  return (
    db.prepare("SELECT id FROM registrations WHERE class_id = ? AND status = 'waitlisted' ORDER BY id").all(classId) as {
      id: number;
    }[]
  ).map((row) => row.id);
}

export function publicRefExists(db: Db, publicRef: string): boolean {
  return db.prepare('SELECT 1 FROM registrations WHERE public_ref = ?').get(publicRef) !== undefined;
}

export function insertRegistration(
  tx: Tx,
  row: { publicRef: string; classId: number; email: string; name: string; status: ActiveStatus; nowIso: string },
): number {
  const result = tx
    .prepare(
      `INSERT INTO registrations (public_ref, class_id, email, name, status, created_at)
       VALUES (@publicRef, @classId, @email, @name, @status, @nowIso)`,
    )
    .run(row);
  return Number(result.lastInsertRowid);
}
