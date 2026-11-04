/**
 * Bersama untuk skrip CLI (AD-1, B-2(c)): membuka `DATABASE_PATH` yang sama dengan server,
 * menerapkan migrasi tertunda, lalu memakai use-case yang sama dengan server.
 * Keluaran skrip tidak memuat email, password, atau token.
 */
import { createClock } from '../src/server/clock.js';
import { readDatabasePath } from '../src/server/config.js';
import { createDb, migrate } from '../src/server/data/db.js';
import { createServices, type ServiceDeps, type Services } from '../src/server/services/index.js';
import { isAppError } from '../src/shared/errors.js';

/** `deps` = koneksi dan clock yang sama, untuk skrip yang perlu merakit services dengan clock lain (seed). */
export async function withServices<T>(fn: (services: Services, deps: ServiceDeps) => Promise<T>): Promise<T> {
  const clock = createClock();
  const db = createDb(readDatabasePath(process.env.DATABASE_PATH));
  try {
    migrate(db, { now: () => clock.now() });
    return await fn(createServices({ db, clock }), { db, clock });
  } finally {
    db.close();
  }
}

/** Cetak pesan gagal yang aman (pesan registri + pesan per field) ke stderr, lalu exit 1. */
export function failWith(error: unknown): never {
  if (isAppError(error)) {
    const details = Object.values(error.fields ?? {});
    console.error([error.message, ...details].join('\n'));
  } else {
    console.error(error instanceof Error ? error.message : 'Terjadi kesalahan.');
  }
  process.exit(1);
}

export function run(main: () => Promise<void>): void {
  main().catch(failWith);
}
