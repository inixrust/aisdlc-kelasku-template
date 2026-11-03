/**
 * Repository `admins` dan `admin_sessions` (AD-2, AD-9). SQL berparameter saja.
 * Fungsi tulis menerima `Tx` (hanya dipanggil di dalam `withWriteTx`); fungsi baca menerima `Db`.
 * Email selalu sudah dinormalisasi oleh pemanggil; token sesi tidak pernah masuk ke sini, hanya hash-nya.
 */
import type { Db, Tx } from './db.js';

export interface AdminRow {
  id: number;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}

const SELECT_ADMIN = `
  SELECT id, email, password_hash AS passwordHash, password_salt AS passwordSalt
  FROM admins`;

export function findAdminByEmail(db: Db, email: string): AdminRow | undefined {
  return db.prepare(`${SELECT_ADMIN} WHERE email = ?`).get(email) as AdminRow | undefined;
}

export function findAdminById(db: Db, id: number): AdminRow | undefined {
  return db.prepare(`${SELECT_ADMIN} WHERE id = ?`).get(id) as AdminRow | undefined;
}

export function insertAdmin(
  tx: Tx,
  row: { email: string; passwordHash: string; passwordSalt: string; nowIso: string },
): number {
  const result = tx
    .prepare(
      `INSERT INTO admins (email, password_hash, password_salt, created_at, updated_at)
       VALUES (@email, @passwordHash, @passwordSalt, @nowIso, @nowIso)`,
    )
    .run(row);
  return Number(result.lastInsertRowid);
}

export function updateAdminPassword(
  tx: Tx,
  row: { id: number; passwordHash: string; passwordSalt: string; nowIso: string },
): void {
  const result = tx
    .prepare(
      `UPDATE admins SET password_hash = @passwordHash, password_salt = @passwordSalt, updated_at = @nowIso
       WHERE id = @id`,
    )
    .run(row);
  if (result.changes !== 1) throw new Error(`updateAdminPassword: admin ${row.id} tidak ditemukan.`);
}

export function insertSession(
  tx: Tx,
  row: { adminId: number; tokenHash: string; nowIso: string; expiresAt: string },
): void {
  tx.prepare(
    `INSERT INTO admin_sessions (admin_id, token_hash, created_at, expires_at)
     VALUES (@adminId, @tokenHash, @nowIso, @expiresAt)`,
  ).run(row);
}

/** Admin pemilik sesi yang masih berlaku (`expires_at > nowIso`). */
export function findAdminBySessionToken(
  db: Db,
  tokenHash: string,
  nowIso: string,
): { id: number; email: string } | undefined {
  return db
    .prepare(
      `SELECT a.id, a.email
       FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash, nowIso) as { id: number; email: string } | undefined;
}

export function deleteSessionByTokenHash(tx: Tx, tokenHash: string): number {
  return tx.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash).changes;
}

/** Hapus sesi kedaluwarsa semua admin (`expires_at <= nowIso`). */
export function deleteExpiredSessions(tx: Tx, nowIso: string): number {
  return tx.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(nowIso).changes;
}

export function deleteSessionsOfAdmin(tx: Tx, adminId: number): number {
  return tx.prepare('DELETE FROM admin_sessions WHERE admin_id = ?').run(adminId).changes;
}
