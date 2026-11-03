import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export interface TempDir {
  /** Path absolut direktori sementara. */
  readonly path: string;
  /** Path absolut berkas di dalam direktori ini (berkas tidak dibuat). */
  file(...segments: string[]): string;
  /** Hapus direktori beserta isinya; aman dipanggil lebih dari sekali. */
  cleanup(): void;
}

/**
 * Direktori unik di `os.tmpdir()` untuk satu test file atau satu test.
 * Dasar untuk berkas SQLite sementara (AD-14: satu DB per test file, jangan mock DB)
 * dan untuk build klien palsu. Panggil `cleanup()` di `afterAll`/`afterEach`.
 */
export function createTempDir(prefix = 'kelasku-test-'): TempDir {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  return {
    path: dir,
    file: (...segments) => path.join(dir, ...segments),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
