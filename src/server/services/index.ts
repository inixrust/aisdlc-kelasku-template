/**
 * Komposisi use-case tanpa Fastify (B-1). Dipanggil oleh `main.ts`, test, worker konkurensi,
 * dan skrip CLI dengan koneksi masing-masing. Use-case ditambahkan oleh story berikutnya.
 */
import type { Db } from '../data/db.js';
import type { Clock } from '../clock.js';

export interface ServiceDeps {
  db: Db;
  clock: Clock;
}

// Kosong sampai Story 1.4 menambah use-case pertama; tetap tipe objek agar penambahan tidak memecah pemanggil.
export type Services = Record<never, never>;

export function createServices(deps: ServiceDeps): Services {
  void deps;
  return {};
}
