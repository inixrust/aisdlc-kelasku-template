import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { AppError } from '../../shared/errors.js';
import { createTempDir, type TempDir } from '../../../test/helpers/temp-dir.js';
import { fixedClock, TEST_NOW_ISO } from '../../../test/helpers/test-db.js';
import { createDb, type Db, DEFAULT_MIGRATIONS_DIR, migrate, withWriteTx } from './db.js';

const FIXTURES = fileURLToPath(new URL('../../../test/helpers/fixtures/migrations-db/', import.meta.url));
const ALPHA = '001_create_alpha.sql';
const BETA = '002_create_beta.sql';
const BROKEN_SOURCE = 'broken_002_create_gamma.sql.txt';

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function tempDir(): TempDir {
  const dir = createTempDir('kelasku-dbtest-');
  cleanups.push(() => dir.cleanup());
  return dir;
}

function open(file: string, options?: Parameters<typeof createDb>[1]): Db {
  const db = createDb(file, options);
  cleanups.push(() => {
    if (db.open) db.close();
  });
  return db;
}

/** Direktori migrasi berisi salinan fixture dengan nama tujuan `[target, source]`. */
function migrationsDir(dir: TempDir, name: string, files: Array<[target: string, source: string]>): string {
  const target = dir.file(name);
  mkdirSync(target);
  for (const [targetName, sourceName] of files) copyFileSync(path.join(FIXTURES, sourceName), path.join(target, targetName));
  return target;
}

function userVersion(db: Db): number {
  return Number(db.pragma('user_version', { simple: true }));
}

function tableNames(db: Db): string[] {
  return (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{
      name: string;
    }>
  ).map((row) => row.name);
}

function backups(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir) : [];
}

describe('createDb (AD-1)', () => {
  it('opens with WAL, foreign keys, and a 5000 ms busy timeout, creating the parent directory', () => {
    const dir = tempDir();
    const file = dir.file('nested', 'deeper', 'kelasku.db');
    const db = open(file);
    expect(existsSync(file)).toBe(true);
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(db.pragma('busy_timeout', { simple: true })).toBe(5000);
  });

  it('accepts a custom busy timeout and rejects an invalid one', () => {
    const dir = tempDir();
    expect(open(dir.file('a.db'), { busyTimeoutMs: 50 }).pragma('busy_timeout', { simple: true })).toBe(50);
    expect(() => createDb(dir.file('b.db'), { busyTimeoutMs: -1 })).toThrow(/busyTimeoutMs/);
  });
});

describe('migrate (AD-12)', () => {
  it('applies every migration to a new database without a backup', () => {
    const dir = tempDir();
    const migrations = migrationsDir(dir, 'm', [[ALPHA, ALPHA], [BETA, BETA]]);
    const db = open(dir.file('kelasku.db'));
    const result = migrate(db, { migrationsDir: migrations, backupDir: dir.file('backups') });
    expect(result).toEqual({ fromVersion: 0, toVersion: 2, applied: [1, 2], backupPath: null });
    expect(userVersion(db)).toBe(2);
    expect(tableNames(db)).toEqual(['alpha', 'beta']);
    expect(backups(dir.file('backups'))).toEqual([]);
  });

  it('backs up a populated database before applying the pending migration', () => {
    const dir = tempDir();
    const db = open(dir.file('kelasku.db'));
    migrate(db, { migrationsDir: migrationsDir(dir, 'm1', [[ALPHA, ALPHA]]), backupDir: dir.file('backups') });
    db.prepare('INSERT INTO alpha (label) VALUES (?)').run('sebelum');
    expect(userVersion(db)).toBe(1);

    const result = migrate(db, {
      migrationsDir: migrationsDir(dir, 'm2', [[ALPHA, ALPHA], [BETA, BETA]]),
      backupDir: dir.file('backups'),
      now: () => new Date(TEST_NOW_ISO),
    });

    const expectedName = 'pre-migration-1-20261109T030000000Z.db';
    expect(result).toEqual({
      fromVersion: 1,
      toVersion: 2,
      applied: [2],
      backupPath: path.join(dir.file('backups'), expectedName),
    });
    expect(userVersion(db)).toBe(2);
    expect(backups(dir.file('backups'))).toEqual([expectedName]);

    // Salinan dibuat sebelum migrasi: masih versi 1, tanpa tabel beta, dengan data lama.
    const copy = open(dir.file('backups', expectedName));
    expect(userVersion(copy)).toBe(1);
    expect(tableNames(copy)).toEqual(['alpha']);
    expect(copy.prepare('SELECT label FROM alpha').all()).toEqual([{ label: 'sebelum' }]);
  });

  it('backs up a database that has tables but user_version 0', () => {
    const dir = tempDir();
    const db = open(dir.file('kelasku.db'));
    migrate(db, { migrationsDir: migrationsDir(dir, 'm1', [[ALPHA, ALPHA]]), backupDir: dir.file('backups') });
    db.prepare('INSERT INTO alpha (label) VALUES (?)').run('tanpa versi');
    db.pragma('user_version = 0');

    const result = migrate(db, {
      migrationsDir: migrationsDir(dir, 'm2', [['001_create_beta.sql', BETA]]),
      backupDir: dir.file('backups'),
      now: () => new Date(TEST_NOW_ISO),
    });

    const expectedName = 'pre-migration-0-20261109T030000000Z.db';
    expect(result.backupPath).toBe(path.join(dir.file('backups'), expectedName));
    const copy = open(dir.file('backups', expectedName));
    expect(userVersion(copy)).toBe(0);
    expect(copy.prepare('SELECT label FROM alpha').all()).toEqual([{ label: 'tanpa versi' }]);
  });

  it('changes nothing and makes no backup when already up to date', () => {
    const dir = tempDir();
    const migrations = migrationsDir(dir, 'm', [[ALPHA, ALPHA], [BETA, BETA]]);
    const db = open(dir.file('kelasku.db'));
    migrate(db, { migrationsDir: migrations, backupDir: dir.file('backups') });
    const result = migrate(db, { migrationsDir: migrations, backupDir: dir.file('backups') });
    expect(result).toEqual({ fromVersion: 2, toVersion: 2, applied: [], backupPath: null });
    expect(backups(dir.file('backups'))).toEqual([]);
  });

  it('throws on a broken migration, keeping user_version and rolling back its tables', () => {
    const dir = tempDir();
    const db = open(dir.file('kelasku.db'));
    const migrations = migrationsDir(dir, 'm', [[ALPHA, ALPHA], ['002_create_gamma.sql', BROKEN_SOURCE]]);
    expect(() => migrate(db, { migrationsDir: migrations, backupDir: dir.file('backups') })).toThrow(
      /002_create_gamma\.sql gagal; user_version tetap 1/,
    );
    expect(userVersion(db)).toBe(1);
    expect(tableNames(db)).toEqual(['alpha']);
    expect(db.inTransaction).toBe(false);
  });

  it('throws when the database is newer than the last migration', () => {
    const dir = tempDir();
    const db = open(dir.file('kelasku.db'));
    db.pragma('user_version = 999');
    const migrations = migrationsDir(dir, 'm', [[ALPHA, ALPHA]]);
    expect(() => migrate(db, { migrationsDir: migrations, backupDir: dir.file('backups') })).toThrow(/999/);
    expect(userVersion(db)).toBe(999);
    expect(backups(dir.file('backups'))).toEqual([]);
  });

  it.each([
    ['a gap in numbering', [[ALPHA, ALPHA], ['003_create_beta.sql', BETA]]],
    ['numbering that does not start at 001', [['002_create_beta.sql', ALPHA]]],
    ['a duplicate number', [[ALPHA, ALPHA], ['001_create_beta.sql', BETA]]],
    ['a misnamed .sql file', [[ALPHA, ALPHA], ['2_Create-Beta.sql', BETA]]],
    ['an upper-case .SQL extension', [[ALPHA, ALPHA], ['002_create_beta.SQL', BETA]]],
  ] as Array<[string, Array<[string, string]>]>)('rejects %s before touching the database', (_label, files) => {
    const dir = tempDir();
    const db = open(dir.file('kelasku.db'));
    expect(() => migrate(db, { migrationsDir: migrationsDir(dir, 'm', files), backupDir: dir.file('backups') })).toThrow();
    expect(userVersion(db)).toBe(0);
    expect(tableNames(db)).toEqual([]);
  });

  it('ignores non-.sql files and applies the production migrations directory', () => {
    const dir = tempDir();
    const db = open(dir.file('kelasku.db'));
    // Direktori fixture berisi berkas `.sql.txt` yang harus diabaikan.
    expect(migrate(db, { migrationsDir: FIXTURES, backupDir: dir.file('backups') }).applied).toEqual([1, 2]);

    const fresh = open(dir.file('produksi.db'));
    expect(() => migrate(fresh, { migrationsDir: DEFAULT_MIGRATIONS_DIR, backupDir: dir.file('backups') })).not.toThrow();
  });
});

describe('withWriteTx (AD-3, AD-7)', () => {
  function migratedDb(options?: Parameters<typeof createDb>[1]): { db: Db; file: string } {
    const dir = tempDir();
    const file = dir.file('kelasku.db');
    const db = open(file, options);
    migrate(db, { migrationsDir: migrationsDir(dir, 'm', [[ALPHA, ALPHA]]), backupDir: dir.file('backups') });
    return { db, file };
  }

  function labels(db: Db): string[] {
    return (db.prepare('SELECT label FROM alpha ORDER BY id').all() as Array<{ label: string }>).map((r) => r.label);
  }

  it('commits the writes and returns the callback value', () => {
    const { db } = migratedDb();
    const result = withWriteTx(db, fixedClock(), (tx) => {
      tx.prepare('INSERT INTO alpha (label) VALUES (?)').run('satu');
      return { inserted: 1 };
    });
    expect(result).toEqual({ inserted: 1 });
    expect(labels(db)).toEqual(['satu']);
    expect(db.inTransaction).toBe(false);
  });

  it('rolls back every write when the callback throws, rethrowing the same error', () => {
    const { db } = migratedDb();
    const failure = new AppError('validation_error');
    expect(() =>
      withWriteTx(db, fixedClock(), (tx) => {
        tx.prepare('INSERT INTO alpha (label) VALUES (?)').run('batal');
        throw failure;
      }),
    ).toThrow(failure);
    expect(labels(db)).toEqual([]);
    expect(db.inTransaction).toBe(false);
  });

  it('builds ctx from one clock read taken after the write lock is held', () => {
    const { db } = migratedDb();
    const frozen = fixedClock();
    const reads: boolean[] = [];
    const clock = {
      now: () => {
        reads.push(db.inTransaction);
        return frozen.now();
      },
    };
    const ctx = withWriteTx(db, clock, (_tx, c) => c);
    expect(reads).toEqual([true]);
    expect(ctx).toEqual({ nowIso: TEST_NOW_ISO, today: '2026-11-09' });
  });

  it('uses the Jakarta calendar date for ctx.today (17.00 UTC is the next day in WIB)', () => {
    const { db } = migratedDb();
    const ctx = withWriteTx(db, fixedClock('2026-11-09T17:00:00.000Z'), (_tx, c) => c);
    expect(ctx).toEqual({ nowIso: '2026-11-09T17:00:00.000Z', today: '2026-11-10' });
  });

  it('throws on a nested call without writing anything', () => {
    const { db } = migratedDb();
    expect(() =>
      withWriteTx(db, fixedClock(), (tx) => {
        tx.prepare('INSERT INTO alpha (label) VALUES (?)').run('luar');
        return withWriteTx(db, fixedClock(), () => 'dalam');
      }),
    ).toThrow(/bersarang/);
    expect(labels(db)).toEqual([]);
  });

  it('maps a write lock held by another connection to AppError database_busy (503)', () => {
    const { db, file } = migratedDb({ busyTimeoutMs: 50 });
    const holder = open(file);
    holder.exec('BEGIN IMMEDIATE');
    try {
      let thrown: unknown;
      try {
        withWriteTx(db, fixedClock(), () => 'tidak pernah');
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(AppError);
      expect(thrown).toMatchObject({ code: 'database_busy', httpStatus: 503 });
      expect((thrown as AppError).cause).toMatchObject({ code: expect.stringMatching(/^SQLITE_BUSY/) });
      expect(db.inTransaction).toBe(false);
    } finally {
      holder.exec('ROLLBACK');
    }
    expect(withWriteTx(db, fixedClock(), () => 'setelah lock dilepas')).toBe('setelah lock dilepas');
  });
});
