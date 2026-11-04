import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { createClock } from '../src/server/clock.js';
import { createDb } from '../src/server/data/db.js';
import { createServices } from '../src/server/services/index.js';
import { AppError } from '../src/shared/errors.js';
import { createTempDir } from '../test/helpers/temp-dir.js';

const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
const PACKAGE_SCRIPTS = (JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  scripts: Record<string, string>;
}).scripts;

interface Exit {
  code: number | null;
  stdout: string;
  stderr: string;
}

/** Jalankan skrip npm persis seperti di `package.json` (`node --env-file-if-exists=.env --import tsx …`). */
function runScript(name: string, options: { args?: string[]; env?: Record<string, string>; stdin?: string }): Promise<Exit> {
  const [command, ...baseArgs] = (PACKAGE_SCRIPTS[name] ?? '').split(' ');
  if (command !== 'node') throw new Error(`skrip ${name} tidak diawali node: ${PACKAGE_SCRIPTS[name]}`);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [...baseArgs, ...(options.args ?? [])], {
      cwd: REPO_ROOT,
      env: { ...process.env, NODE_ENV: 'test', KELASKU_FAKE_NOW: '2026-11-09T03:00:00.000Z', ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
    const guard = setTimeout(() => child.kill('SIGKILL'), 20_000);
    child.on('error', reject);
    child.on('exit', (code) => {
      clearTimeout(guard);
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(options.stdin ?? '');
  });
}

async function canLogin(dbPath: string, email: string, password: string): Promise<boolean> {
  const db = createDb(dbPath);
  try {
    const services = createServices({ db, clock: createClock({ NODE_ENV: 'test', KELASKU_FAKE_NOW: '2026-11-09T03:00:00.000Z' }) });
    await services.auth.login({ email, password });
    return true;
  } catch (error) {
    if (error instanceof AppError && error.code === 'invalid_credentials') return false;
    throw error;
  } finally {
    db.close();
  }
}

function adminCount(dbPath: string): number {
  const db = createDb(dbPath);
  try {
    return (db.prepare('SELECT COUNT(*) AS n FROM admins').get() as { n: number }).n;
  } finally {
    db.close();
  }
}

const dir = createTempDir('kelasku-scripts-');
afterAll(() => dir.cleanup());

describe('admin:create (AD-9)', () => {
  const dbPath = dir.file('admin-create', 'kelasku.db');
  const env = { DATABASE_PATH: dbPath };

  it('creates the admin, then updates its password on a second run (one row, only the last password logs in)', async () => {
    const first = await runScript('admin:create', { args: ['--email', 'rina@lembaga.id'], env, stdin: 'password-pertama\n' });
    expect(first.code).toBe(0);
    expect(first.stdout.trim()).toBe('Akun admin dibuat.');

    const second = await runScript('admin:create', { args: ['--email', ' Rina@Lembaga.id '], env, stdin: 'password-kedua\r\nabaikan\n' });
    expect(second.code).toBe(0);
    expect(second.stdout.trim()).toBe('Password akun admin diperbarui.');

    expect(adminCount(dbPath)).toBe(1);
    expect(await canLogin(dbPath, 'rina@lembaga.id', 'password-pertama')).toBe(false);
    expect(await canLogin(dbPath, 'rina@lembaga.id', 'password-kedua')).toBe(true);

    for (const output of [first, second]) {
      expect(`${output.stdout}${output.stderr}`).not.toMatch(/rina@lembaga\.id|password-pertama|password-kedua/i);
    }
  }, 60_000);

  it('rejects a password shorter than 8 characters with exit 1', async () => {
    const result = await runScript('admin:create', { args: ['--email', 'pendek@lembaga.id'], env, stdin: 'pendek\n' });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Password minimal 8 karakter.');
    expect(result.stderr).not.toContain('pendek@lembaga.id');
    expect(await canLogin(dbPath, 'pendek@lembaga.id', 'pendek')).toBe(false);
  }, 30_000);

  it('rejects a missing --email with usage and exit 1, without creating the database', async () => {
    const missingDb = dir.file('admin-create-missing', 'kelasku.db');
    const result = await runScript('admin:create', { env: { DATABASE_PATH: missingDb }, stdin: 'password-panjang\n' });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('npm run admin:create -- --email');
    expect(existsSync(missingDb)).toBe(false);
  }, 30_000);
});

describe('seed:demo (B-2(c))', () => {
  it('exits non-zero without touching the database when SEED_ADMIN_* is empty', async () => {
    for (const seedEnv of [
      { SEED_ADMIN_EMAIL: '', SEED_ADMIN_PASSWORD: 'password-panjang' },
      { SEED_ADMIN_EMAIL: 'seed@lembaga.id', SEED_ADMIN_PASSWORD: '' },
    ]) {
      const dbPath = dir.file('seed-empty', 'kelasku.db');
      const result = await runScript('seed:demo', { env: { DATABASE_PATH: dbPath, ...seedEnv } });
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi');
      expect(existsSync(dbPath)).toBe(false);
      expect(existsSync(dir.file('seed-empty'))).toBe(false);
    }
  }, 60_000);

  it('creates the seed admin from env so it can log in, idempotently', async () => {
    const dbPath = dir.file('seed', 'kelasku.db');
    const env = { DATABASE_PATH: dbPath, SEED_ADMIN_EMAIL: 'Seed@Lembaga.id', SEED_ADMIN_PASSWORD: 'password-seed-1' };

    const first = await runScript('seed:demo', { env });
    expect(first.code).toBe(0);
    const second = await runScript('seed:demo', { env });
    expect(second.code).toBe(0);

    expect(adminCount(dbPath)).toBe(1);
    expect(await canLogin(dbPath, 'seed@lembaga.id', 'password-seed-1')).toBe(true);
    expect(`${first.stdout}${second.stdout}`).not.toMatch(/seed@lembaga\.id|password-seed-1/i);
  }, 60_000);

  // ATDD Story 1.6 — AC-9 (bagian seed dari 1.6-E2E-001, P1). Risiko: R-016. Fase hijau.
  it('[P1] AC-9 seeds a demo class whose session dates are relative to the Clock today, idempotently', async () => {
    const dbPath = dir.file('seed-classes', 'kelasku.db');
    const env = { DATABASE_PATH: dbPath, SEED_ADMIN_EMAIL: 'seed@lembaga.id', SEED_ADMIN_PASSWORD: 'password-seed-1' };
    const first = await runScript('seed:demo', { env });

    const classCount = (): number => {
      const db = createDb(dbPath);
      try {
        return (db.prepare('SELECT COUNT(*) AS n FROM classes').get() as { n: number }).n;
      } finally {
        db.close();
      }
    };

    // Kriteria inti.
    expect(classCount()).toBeGreaterThanOrEqual(1);

    expect(first.code).toBe(0);
    const afterFirst = classCount();
    const second = await runScript('seed:demo', { env });
    expect(second.code).toBe(0);
    expect(classCount()).toBe(afterFirst);

    // Relatif ke `KELASKU_FAKE_NOW` (today = 2026-11-09): minimal satu kelas masih Dibuka.
    const db = createDb(dbPath);
    try {
      const open = db
        .prepare('SELECT COUNT(DISTINCT class_id) AS n FROM class_sessions GROUP BY class_id HAVING MAX(session_date) > ?')
        .all('2026-11-09');
      expect(open.length).toBeGreaterThanOrEqual(1);
    } finally {
      db.close();
    }
  }, 60_000);

  it('AC-9 demo class session dates follow the Clock today exactly (KELASKU_FAKE_NOW = 2026-11-09)', async () => {
    const dbPath = dir.file('seed-class-dates', 'kelasku.db');
    const env = { DATABASE_PATH: dbPath, SEED_ADMIN_EMAIL: 'seed@lembaga.id', SEED_ADMIN_PASSWORD: 'password-seed-1' };
    expect((await runScript('seed:demo', { env })).code).toBe(0);

    const db = createDb(dbPath);
    try {
      const rows = db
        .prepare(
          `SELECT c.title AS title, group_concat(s.session_date, ',') AS dates
           FROM classes c JOIN (SELECT class_id, session_date FROM class_sessions ORDER BY session_date) s ON s.class_id = c.id
           GROUP BY c.id ORDER BY c.id`,
        )
        .all() as { title: string; dates: string }[];
      expect(rows).toEqual([
        { title: 'Demo: Excel untuk Laporan Keuangan', dates: '2026-11-02,2026-11-09,2026-11-16' },
        { title: 'Demo: Public Speaking untuk Pemula', dates: '2026-11-16,2026-11-23,2026-11-30' },
      ]);
    } finally {
      db.close();
    }
  }, 60_000);

  // ATDD Story 1.7 — AC-15 (1.7-INT-009, P1; B-2b, prasyarat E2E 1.8/1.9). Risiko: R-016. FASE MERAH.
  // Saat aktivasi: hapus `.skip`. Test AC-9 di atas (`toEqual` dua kelas demo) perlu disaring per judul
  // karena seed kini menambah tiga kelas lagi (lihat checklist ATDD 1.7).
  it.skip('[P1] AC-15 seeds a full class without waitlist, a full class with 3 waitlisted, and a finished class with registered + waitlisted, relative to the Clock today, idempotently', async () => {
    const dbPath = dir.file('seed-registrations', 'kelasku.db');
    const env = { DATABASE_PATH: dbPath, SEED_ADMIN_EMAIL: 'seed@lembaga.id', SEED_ADMIN_PASSWORD: 'password-seed-1' };
    const today = '2026-11-09'; // KELASKU_FAKE_NOW runScript
    const first = await runScript('seed:demo', { env });

    interface ClassFacts {
      quota: number;
      lastDate: string;
      registered: number;
      waitlisted: number;
    }
    const snapshot = (): { classes: ClassFacts[]; registrations: number } => {
      const db = createDb(dbPath);
      try {
        const classes = db
          .prepare(
            `SELECT c.quota AS quota,
                    (SELECT MAX(s.session_date) FROM class_sessions s WHERE s.class_id = c.id) AS lastDate,
                    (SELECT COUNT(*) FROM registrations r WHERE r.class_id = c.id AND r.status = 'registered') AS registered,
                    (SELECT COUNT(*) FROM registrations r WHERE r.class_id = c.id AND r.status = 'waitlisted') AS waitlisted
             FROM classes c ORDER BY c.id`,
          )
          .all() as ClassFacts[];
        const registrations = (db.prepare('SELECT COUNT(*) AS n FROM registrations').get() as { n: number }).n;
        return { classes, registrations };
      } finally {
        db.close();
      }
    };
    const { classes } = snapshot();
    const isOpen = (c: ClassFacts): boolean => c.lastDate > today;

    // Kriteria inti: kelas Penuh tanpa daftar tunggu.
    expect(classes.filter((c) => isOpen(c) && c.registered === c.quota && c.waitlisted === 0).length).toBeGreaterThanOrEqual(1);

    expect(first.code).toBe(0);
    expect(classes.filter((c) => isOpen(c) && c.registered === c.quota && c.waitlisted === 3).length).toBeGreaterThanOrEqual(1);
    expect(classes.filter((c) => !isOpen(c) && c.registered >= 1 && c.waitlisted >= 1).length).toBeGreaterThanOrEqual(1);
    // Tidak ada kelas yang melanggar R1.
    expect(classes.filter((c) => c.registered > c.quota)).toEqual([]);

    // Idempoten: jalan kedua tidak menambah kelas maupun pendaftaran.
    const before = snapshot();
    expect((await runScript('seed:demo', { env })).code).toBe(0);
    expect(snapshot()).toEqual(before);
  }, 60_000);
});
