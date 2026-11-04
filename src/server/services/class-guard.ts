/**
 * Tx-step penjaga kelas Selesai (AD-18). Dipanggil di dalam `withWriteTx` sebagai baca keputusan pertama
 * setiap use-case tulis; tidak pernah membuka transaksi sendiri.
 */
import { AppError, type ErrorCode } from '../../shared/errors.js';
import * as classesRepo from '../data/classes-repo.js';
import type { Tx, WriteCtx } from '../data/db.js';
import { classStatus } from '../domain/class-status.js';

/** Aksi tulis yang dijaga → kode error saat kelas Selesai. Story berikutnya menambah aksi lain. */
const CLOSED_ERROR = {
  register: 'registration_closed',
} as const satisfies Record<string, ErrorCode>;

export type GuardedAction = keyof typeof CLOSED_ERROR;

export interface OpenClass {
  id: number;
  quota: number;
  /** Terurut naik. */
  sessionDates: string[];
}

/**
 * Membaca kelas + tanggal sesinya di dalam transaksi dan menolak bila kelas Selesai
 * (`max(session_date) <= ctx.today`). Kelas tak dikenal → `class_not_found`.
 */
export function assertClassOpen(tx: Tx, ctx: WriteCtx, classId: number, action: GuardedAction): OpenClass {
  const row = classesRepo.findClassById(tx, classId);
  if (row === undefined) throw new AppError('class_not_found');
  const sessionDates = classesRepo.listSessionDates(tx, row.id);
  // Selesai tidak bergantung pada jumlah Terdaftar; Penuh bukan alasan menolak (pendaftar masuk antrean).
  if (classStatus({ sessionDates, today: ctx.today, quota: row.quota, registeredCount: 0 }) === 'finished') {
    throw new AppError(CLOSED_ERROR[action]);
  }
  return { id: row.id, quota: row.quota, sessionDates };
}
