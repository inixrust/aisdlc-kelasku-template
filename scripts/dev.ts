/**
 * `npm run dev`: menjalankan Vite dev server (klien, proxy `/api`) dan
 * `tsx watch src/server/main.ts` (server) bersamaan. Bila salah satu berhenti,
 * yang lain ikut dihentikan. Tanpa dependensi tambahan agar sama di semua OS.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

function binPath(pkg: string): string {
  const manifestPath = require.resolve(`${pkg}/package.json`);
  const manifest = require(manifestPath) as { bin: string | Record<string, string> };
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin[pkg];
  if (bin === undefined) throw new Error(`Bin ${pkg} tidak ditemukan.`);
  return path.join(path.dirname(manifestPath), bin);
}

const viteBin = binPath('vite');
const tsxCli = binPath('tsx');

const children: ChildProcess[] = [
  spawn(process.execPath, [viteBin], { stdio: 'inherit' }),
  spawn(
    process.execPath,
    [tsxCli, 'watch', '--env-file-if-exists=.env', 'src/server/main.ts'],
    { stdio: 'inherit' },
  ),
];

let stopping = false;

function stopAll(exitCode: number): void {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on('exit', (code) => stopAll(code ?? 0));
  child.on('error', () => stopAll(1));
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
