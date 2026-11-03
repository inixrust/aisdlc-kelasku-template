/**
 * Koneksi SQLite, runner migrasi, dan satu-satunya pembuka transaksi tulis (AD-1, AD-2, AD-3, AD-12).
 * Modul ini sengaja tidak mengimpor Fastify agar bisa dipakai dari `worker_threads` dan skrip CLI (B-1).
 */
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { AppError } from '../../shared/errors.js';
import { type Clock, jakartaDateOf } from '../clock.js';

export type Db = Database.Database;

declare const txBrand: unique symbol;
/**
 * Koneksi yang sedang berada di dalam `withWriteTx`. Repository dan tx-step menerima `Tx`,
 * sehingga memanggilnya dengan `Db` biasa (di luar transaksi) gagal saat typecheck.
 */
export type Tx = Db & { readonly [txBrand]: true };

/** Konteks waktu satu transaksi (AD-7, AD-15), dibaca sekali setelah write lock diperoleh. */
export interface WriteCtx {
  /** Instan ISO-8601 UTC dengan milidetik, untuk setiap kolom `*_at`. */
  nowIso: string;
  /** "Hari ini" Asia/Jakarta, `YYYY-MM-DD`. */
  today: string;
}

export interface CreateDbOptions {
  /** `PRAGMA busy_timeout` dalam milidetik; bawaan 5000 (AD-1). */
  busyTimeoutMs?: number;
}

export const DEFAULT_BUSY_TIMEOUT_MS = 5000;

/** Membuka berkas SQLite dengan WAL, foreign key, dan busy timeout; direktori induk dibuat bila belum ada. */
export function createDb(filePath: string, options: CreateDbOptions = {}): Db {
  const busyTimeoutMs = options.busyTimeoutMs ?? DEFAULT_BUSY_TIMEOUT_MS;
  if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0) {
    throw new Error(`busyTimeoutMs tidak valid: ${busyTimeoutMs}`);
  }

  mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  const db = new Database(filePath);
  try {
    // busy_timeout dipasang lebih dulu agar penggantian journal_mode pun menunggu lock.
    db.pragma(`busy_timeout = ${busyTimeoutMs}`);
    const journalMode = db.pragma('journal_mode = WAL', { simple: true });
    if (journalMode !== 'wal') {
      throw new Error(`journal_mode WAL tidak aktif (mendapat "${String(journalMode)}").`);
    }
    db.pragma('foreign_keys = ON');
  } catch (error) {
    db.close();
    throw error;
  }
  return db;
}

function isBusyError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code.startsWith('SQLITE_BUSY');
}

/**
 * Menjalankan `fn` di dalam satu transaksi `BEGIN IMMEDIATE` (AD-3). Hanya use-case di
 * `src/server/services/` yang memanggil ini. `fn` harus sinkron; semua baca yang mendasari
 * keputusan dilakukan di dalamnya. `ctx` dibaca dari `clock` setelah lock diperoleh (AD-7).
 * `SQLITE_BUSY` dipetakan ke `AppError('database_busy')` (HTTP 503).
 */
export function withWriteTx<T>(db: Db, clock: Pick<Clock, 'now'>, fn: (tx: Tx, ctx: WriteCtx) => T): T {
  if (db.inTransaction) {
    throw new Error('withWriteTx dipanggil di dalam transaksi yang sedang berjalan; transaksi bersarang tidak diizinkan.');
  }
  const run = db.transaction((): T => {
    const now = clock.now();
    const ctx: WriteCtx = { nowIso: now.toISOString(), today: jakartaDateOf(now) };
    return fn(db as Tx, ctx);
  });
  try {
    return run.immediate();
  } catch (error) {
    if (isBusyError(error)) throw new AppError('database_busy', { cause: error });
    throw error;
  }
}

export interface MigrateOptions {
  /** Direktori berkas `NNN_description.sql`; bawaan `./migrations` di samping modul ini. */
  migrationsDir?: string;
  /** Direktori salinan pra-migrasi; bawaan `backups` relatif terhadap direktori kerja. */
  backupDir?: string;
  /** Sumber instan untuk nama berkas backup; bawaan jam sistem. */
  now?: () => Date;
}

export interface MigrateResult {
  fromVersion: number;
  toVersion: number;
  applied: number[];
  /** Path salinan pra-migrasi, bila dibuat. */
  backupPath: string | null;
}

interface MigrationFile {
  version: number;
  fileName: string;
}

const MIGRATION_FILE = /^(\d{3})_[a-z0-9_]+\.sql$/;

export const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL('./migrations/', import.meta.url));

function listMigrations(dir: string): MigrationFile[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    throw new Error(`Direktori migrasi tidak bisa dibaca: ${dir}`, { cause: error });
  }

  const migrations: MigrationFile[] = [];
  for (const fileName of entries) {
    if (!fileName.toLowerCase().endsWith('.sql')) continue;
    const match = MIGRATION_FILE.exec(fileName);
    if (match?.[1] === undefined) {
      throw new Error(`Nama berkas migrasi tidak valid: ${fileName} (harus NNN_description.sql, huruf kecil).`);
    }
    migrations.push({ version: Number(match[1]), fileName });
  }
  migrations.sort((a, b) => a.version - b.version);
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(`Penomoran migrasi harus berurutan mulai 001 tanpa celah atau duplikat: ${migration.fileName}.`);
    }
  });
  return migrations;
}

function userVersion(db: Db): number {
  return Number(db.pragma('user_version', { simple: true }));
}

function hasUserTables(db: Db): boolean {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .get() as { n: number };
  return row.n > 0;
}

/** `2026-11-09T03:00:00.000Z` → `20261109T030000000Z` (aman untuk nama berkas di semua OS). */
function compactTimestamp(instant: Date): string {
  return instant.toISOString().replace(/[-:.]/g, '');
}

/**
 * Menerapkan migrasi tertunda berurutan (AD-12): masing-masing dalam satu transaksi bersama
 * `PRAGMA user_version = N`. Pada DB yang sudah berisi, salinan pra-migrasi dibuat lebih dulu.
 * Melempar bila migrasi gagal (migrasi itu tidak menaikkan `user_version`) atau DB lebih baru dari kode.
 */
export function migrate(db: Db, options: MigrateOptions = {}): MigrateResult {
  const migrationsDir = options.migrationsDir ?? DEFAULT_MIGRATIONS_DIR;
  const migrations = listMigrations(migrationsDir);
  const latest = migrations.at(-1)?.version ?? 0;
  const fromVersion = userVersion(db);

  if (fromVersion > latest) {
    throw new Error(
      `user_version DB (${fromVersion}) lebih baru dari migrasi terakhir (${latest}); jalankan versi aplikasi yang sesuai.`,
    );
  }

  const pending = migrations.filter((migration) => migration.version > fromVersion);
  if (pending.length === 0) {
    return { fromVersion, toVersion: fromVersion, applied: [], backupPath: null };
  }

  let backupPath: string | null = null;
  if (fromVersion > 0 || hasUserTables(db)) {
    const backupDir = path.resolve(options.backupDir ?? 'backups');
    mkdirSync(backupDir, { recursive: true });
    const instant = (options.now ?? (() => new Date()))();
    backupPath = path.join(backupDir, `pre-migration-${fromVersion}-${compactTimestamp(instant)}.db`);
    db.prepare('VACUUM INTO ?').run(backupPath);
  }

  const applied: number[] = [];
  for (const migration of pending) {
    const sql = readFileSync(path.join(migrationsDir, migration.fileName), 'utf8');
    let ran: boolean;
    try {
      ran = db.transaction((): boolean => {
        // Baca ulang di dalam write lock: proses lain mungkin sudah menerapkan migrasi ini.
        if (userVersion(db) >= migration.version) return false;
        db.exec(sql);
        // PRAGMA tidak menerima parameter; versi berasal dari nama berkas yang sudah divalidasi.
        db.pragma(`user_version = ${migration.version}`);
        return true;
      }).immediate();
    } catch (error) {
      throw new Error(`Migrasi ${migration.fileName} gagal; user_version tetap ${userVersion(db)}.`, {
        cause: error,
      });
    }
    if (ran) applied.push(migration.version);
  }

  return { fromVersion, toVersion: userVersion(db), applied, backupPath };
}
