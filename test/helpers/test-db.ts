import { type Clock, createClock } from '../../src/server/clock.js';
import { createDb, type Db, migrate } from '../../src/server/data/db.js';
import { createServices, type Services } from '../../src/server/services/index.js';
import { createTempDir, type TempDir } from './temp-dir.js';

/** Instan beku bawaan test: Senin 9 Nov 2026, 10.00 WIB (sama dengan `KELASKU_FAKE_NOW` e2e). */
export const TEST_NOW_ISO = '2026-11-09T03:00:00.000Z';

/** `Clock` beku pada `iso` lewat jalur yang sama dengan produksi (`createClock`, B-2(a)). */
export function fixedClock(iso: string = TEST_NOW_ISO): Clock {
  return createClock({ NODE_ENV: 'test', KELASKU_FAKE_NOW: iso });
}

export interface CreateTestDbOptions {
  /** Direktori migrasi; bawaan migrasi produksi `src/server/data/migrations/`. */
  migrationsDir?: string;
  /** Instan clock beku; bawaan `TEST_NOW_ISO`. */
  nowIso?: string;
  /** `PRAGMA busy_timeout` koneksi ini; bawaan 5000. */
  busyTimeoutMs?: number;
}

export interface TestDb {
  /** Path absolut berkas SQLite; worker konkurensi membuka koneksi sendiri ke berkas ini. */
  readonly dbPath: string;
  readonly db: Db;
  readonly clock: Clock;
  readonly services: Services;
  /** Direktori sementara pemilik berkas DB (dan backup pra-migrasi, bila ada). */
  readonly dir: TempDir;
  /** Tutup koneksi lalu hapus direktori; aman dipanggil lebih dari sekali. */
  cleanup(): void;
}

/**
 * Berkas SQLite sementara yang nyata (AD-14: jangan mock DB): `createDb` → `migrate` →
 * `createServices`, dengan clock beku. Panggil `cleanup()` di `afterAll`/`afterEach`.
 */
export function createTestDb(options: CreateTestDbOptions = {}): TestDb {
  const dir = createTempDir('kelasku-db-');
  const dbPath = dir.file('kelasku.db');
  const clock = fixedClock(options.nowIso);
  let db: Db;
  try {
    db = createDb(dbPath, options.busyTimeoutMs === undefined ? {} : { busyTimeoutMs: options.busyTimeoutMs });
    try {
      migrate(db, {
        ...(options.migrationsDir === undefined ? {} : { migrationsDir: options.migrationsDir }),
        backupDir: dir.file('backups'),
        now: () => clock.now(),
      });
    } catch (error) {
      db.close();
      throw error;
    }
  } catch (error) {
    dir.cleanup();
    throw error;
  }

  const services = createServices({ db, clock });
  return {
    dbPath,
    db,
    clock,
    services,
    dir,
    cleanup: () => {
      if (db.open) db.close();
      dir.cleanup();
    },
  };
}
