import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestDb } from '../../../test/helpers/test-db.js';
import { createServices } from './index.js';

const SERVER_DIR = fileURLToPath(new URL('../', import.meta.url));

/** Spesifier paket (bukan relatif) di seluruh graf impor statis berkas `entry` (`.js` → `.ts`). */
function packageImportsOf(entry: string): Set<string> {
  const pattern = /\b(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const packages = new Set<string>();
  const seen = new Set<string>();
  const queue = [entry];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
      const specifier = match[1] ?? match[2];
      if (specifier === undefined) continue;
      if (specifier.startsWith('.')) {
        queue.push(path.resolve(path.dirname(file), specifier.replace(/\.js$/, '.ts')));
      } else {
        packages.add(specifier);
      }
    }
  }
  return packages;
}

describe('createServices (B-1)', () => {
  const testDb = createTestDb();
  afterAll(() => testDb.cleanup());

  it('composes the use-case object from db and clock', () => {
    expect(Object.keys(createServices({ db: testDb.db, clock: testDb.clock }))).toEqual(['auth', 'classes']);
    expect(Object.keys(testDb.services)).toEqual(['auth', 'classes']);
  });

  it.each(['data/db.ts', 'services/index.ts'])(
    '%s does not pull Fastify into its import graph (usable from worker_threads and CLI scripts)',
    (relative) => {
      const packages = [...packageImportsOf(path.join(SERVER_DIR, relative))];
      expect(packages).toContain('better-sqlite3');
      expect(packages.filter((name) => name === 'fastify' || name.startsWith('@fastify/'))).toEqual([]);
    },
  );

  it('the import-graph scan sees Fastify where it is used (negative control)', () => {
    expect([...packageImportsOf(path.join(SERVER_DIR, 'http/app.ts'))]).toContain('fastify');
  });
});
