import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { createTempDir } from '../../test/helpers/temp-dir.js';
import { createDb } from './data/db.js';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MAIN = fileURLToPath(new URL('./main.ts', import.meta.url));
const require = createRequire(import.meta.url);
const TSX_CLI = path.join(path.dirname(require.resolve('tsx/package.json')), 'dist', 'cli.mjs');

interface Exit {
  code: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
}

function runMain(env: Record<string, string>): Promise<Exit> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [TSX_CLI, MAIN], {
      cwd: REPO_ROOT,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
      stderr += chunk;
    });
    // Jaring pengaman: bila migrasi tidak menolak, server akan mendengar terus; hentikan dan gagalkan test.
    const guard = setTimeout(() => child.kill('SIGKILL'), 20_000);
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      clearTimeout(guard);
      resolve({ code, signal, stderr });
    });
  });
}

describe('main.ts start-up (AD-12)', () => {
  const dir = createTempDir('kelasku-main-');
  afterAll(() => dir.cleanup());

  it('exits non-zero with a message on stderr when the database is newer than the migrations', async () => {
    const dbPath = dir.file('kelasku.db');
    const db = createDb(dbPath);
    db.pragma('user_version = 999');
    db.close();

    const result = await runMain({ DATABASE_PATH: dbPath, PORT: '0', NODE_ENV: 'test' });

    expect(result.signal).toBeNull();
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('user_version DB (999)');
  }, 30_000);
});
