/**
 * Fitness test arsitektur (HP-3). Menjaga aturan lapisan dan larangan waktu
 * Architecture Spine secara statis atas teks sumber. Setiap aturan punya fixture
 * negatif agar test tidak lulus kosong.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface SourceFile {
  /** Path relatif ke root repositori, pemisah `/`. */
  path: string;
  content: string;
}

interface Violation {
  rule: RuleId;
  path: string;
  detail: string;
}

type RuleId =
  | 'sqlite-only-in-data'
  | 'no-wall-clock-in-domain-services'
  | 'no-sql-time-functions-in-migrations'
  | 'layer-direction';

type Layer = 'shared' | 'domain' | 'data' | 'services' | 'http' | 'client';

/** Arah impor yang diizinkan (spine § Design Paradigm). Lapisan selalu boleh mengimpor dirinya sendiri. */
const ALLOWED_LAYER_DEPS: Record<Layer, readonly Layer[]> = {
  shared: [],
  domain: ['shared'],
  data: ['shared'],
  services: ['domain', 'data', 'shared'],
  http: ['services', 'shared'],
  client: ['shared'],
};

const CODE_EXTENSIONS = ['.ts', '.tsx'];
const MIGRATIONS_DIR = 'src/server/data/migrations/';

function layerOf(filePath: string): Layer | null {
  if (filePath.startsWith('src/shared/')) return 'shared';
  if (filePath.startsWith('src/server/domain/')) return 'domain';
  if (filePath.startsWith('src/server/data/')) return 'data';
  if (filePath.startsWith('src/server/services/')) return 'services';
  if (filePath.startsWith('src/server/http/')) return 'http';
  if (filePath.startsWith('src/client/')) return 'client';
  return null;
}

const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?[^'"`;]*?\s+from\s+['"]([^'"]+)['"]/g,
  /\bexport\s+(?:type\s+)?[^'"`;]*?\s+from\s+['"]([^'"]+)['"]/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function importSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      if (match[1] !== undefined) specifiers.push(match[1]);
    }
  }
  return specifiers;
}

/** Resolve impor relatif ke path repositori; impor paket mengembalikan null. */
function resolveRelative(fromPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), specifier));
}

const WALL_CLOCK_PATTERNS: Array<[RegExp, string]> = [
  [/\bnew\s+Date\s*\(/, 'new Date('],
  [/\bDate\.now\s*\(/, 'Date.now('],
  [/(?<!\bnew\s+)(?<![.\w])Date\s*\(\s*\)/, 'Date()'],
  [/\.toISOString\(\)\s*\.slice\(\s*0\s*,\s*10\s*\)/, 'toISOString().slice(0, 10)'],
];

const SQL_TIME_PATTERNS: Array<[RegExp, string]> = [
  [/\bCURRENT_(?:TIMESTAMP|DATE|TIME)\b/i, 'CURRENT_TIMESTAMP/CURRENT_DATE/CURRENT_TIME'],
  [/\b(?:datetime|date|time|julianday|unixepoch|strftime)\s*\([^)]*['"]now['"]/i, "fungsi waktu SQL dengan 'now'"],
  // Tanpa argumen waktu, SQLite memakai waktu sekarang.
  [/\b(?:datetime|date|time|julianday|unixepoch)\s*\(\s*\)/i, 'fungsi waktu SQL tanpa argumen'],
];

function checkFiles(files: readonly SourceFile[]): Violation[] {
  const violations: Violation[] = [];

  for (const file of files) {
    const isCode = CODE_EXTENSIONS.some((ext) => file.path.endsWith(ext));
    const layer = layerOf(file.path);

    if (isCode) {
      for (const specifier of importSpecifiers(file.content)) {
        if (specifier === 'better-sqlite3' && !file.path.startsWith('src/server/data/')) {
          violations.push({ rule: 'sqlite-only-in-data', path: file.path, detail: specifier });
        }

        const target = resolveRelative(file.path, specifier);
        if (layer !== null && target !== null) {
          const targetLayer = layerOf(target);
          const leavesShared = layer === 'shared' && !target.startsWith('src/shared/');
          const clientToServer = layer === 'client' && target.startsWith('src/server/');
          const forbiddenLayer =
            targetLayer !== null && targetLayer !== layer && !ALLOWED_LAYER_DEPS[layer].includes(targetLayer);
          // domain/ murni: berkas server di luar lapisan (mis. clock.ts, main.ts) juga terlarang.
          const leavesPureDomain =
            layer === 'domain' && !target.startsWith('src/server/domain/') && !target.startsWith('src/shared/');
          if (leavesShared || clientToServer || forbiddenLayer || leavesPureDomain) {
            violations.push({ rule: 'layer-direction', path: file.path, detail: `${layer} → ${target}` });
          }
        }

        if (layer === 'domain' && specifier.startsWith('node:')) {
          violations.push({ rule: 'layer-direction', path: file.path, detail: `domain → ${specifier} (I/O)` });
        }
      }

      if (layer === 'domain' || layer === 'services') {
        for (const [pattern, label] of WALL_CLOCK_PATTERNS) {
          if (pattern.test(file.content)) {
            violations.push({ rule: 'no-wall-clock-in-domain-services', path: file.path, detail: label });
          }
        }
      }
    }

    if (file.path.startsWith(MIGRATIONS_DIR) && file.path.endsWith('.sql')) {
      for (const [pattern, label] of SQL_TIME_PATTERNS) {
        if (pattern.test(file.content)) {
          violations.push({ rule: 'no-sql-time-functions-in-migrations', path: file.path, detail: label });
        }
      }
    }
  }

  return violations;
}

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SCANNED_ROOTS = ['src', 'scripts', 'e2e'];
/** Berkas ini sendiri berisi fixture pelanggaran sebagai string, jadi tidak ikut dipindai. */
const SELF_PATH = 'src/architecture.test.ts';

function readRepositoryFiles(): SourceFile[] {
  const files: SourceFile[] = [];
  for (const root of SCANNED_ROOTS) {
    const absoluteRoot = path.join(REPO_ROOT, root);
    const entries = readdirSync(absoluteRoot, { recursive: true, withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const absolutePath = path.join(entry.parentPath, entry.name);
      const relativePath = path.relative(REPO_ROOT, absolutePath).split(path.sep).join('/');
      if (relativePath === SELF_PATH) continue;
      if (![...CODE_EXTENSIONS, '.sql'].some((ext) => relativePath.endsWith(ext))) continue;
      files.push({ path: relativePath, content: readFileSync(absolutePath, 'utf8') });
    }
  }
  return files;
}

function rulesHit(files: SourceFile[]): RuleId[] {
  return checkFiles(files).map((violation) => violation.rule);
}

describe('architecture fitness (HP-3)', () => {
  describe('negative fixtures: each rule catches its violation', () => {
    it('flags better-sqlite3 imported outside src/server/data/', () => {
      expect(
        rulesHit([{ path: 'src/server/services/x.ts', content: "import Database from 'better-sqlite3';" }]),
      ).toContain('sqlite-only-in-data');
      expect(rulesHit([{ path: 'scripts/x.ts', content: "const D = require('better-sqlite3');" }])).toContain(
        'sqlite-only-in-data',
      );
      expect(
        rulesHit([{ path: 'src/server/data/db.ts', content: "import Database from 'better-sqlite3';" }]),
      ).toEqual([]);
    });

    it.each([
      ['src/server/domain/x.ts', 'const now = new Date();'],
      ['src/server/services/x.ts', 'const t = Date.now();'],
      ['src/server/domain/x.ts', 'const today = clock.now().toISOString().slice(0, 10);'],
      ['src/server/services/x.ts', 'const today = d.toISOString().slice(0,10);'],
      ['src/server/domain/x.ts', 'const s = Date();'],
    ])('flags wall-clock use in %s: %s', (filePath, content) => {
      expect(rulesHit([{ path: filePath, content }])).toContain('no-wall-clock-in-domain-services');
    });

    it('allows wall-clock reads outside domain/ and services/', () => {
      expect(rulesHit([{ path: 'src/server/clock.ts', content: 'const now = new Date();' }])).toEqual([]);
    });

    it.each([
      'CREATE TABLE t (created_at TEXT DEFAULT CURRENT_TIMESTAMP);',
      "CREATE TABLE t (created_at TEXT DEFAULT (datetime('now')));",
      "CREATE TABLE t (created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')));",
      'CREATE TABLE t (created_at TEXT DEFAULT (datetime()));',
      'CREATE TABLE t (d TEXT DEFAULT (date( )));',
    ])('flags SQL time functions in migrations: %s', (content) => {
      expect(rulesHit([{ path: 'src/server/data/migrations/001_init.sql', content }])).toContain(
        'no-sql-time-functions-in-migrations',
      );
    });

    it('flags src/client importing from src/server/', () => {
      expect(
        rulesHit([{ path: 'src/client/pages/X.tsx', content: "import { buildApp } from '../../server/http/app';" }]),
      ).toContain('layer-direction');
    });

    it('flags src/shared importing from outside src/shared/', () => {
      expect(
        rulesHit([{ path: 'src/shared/format.ts', content: "import { createClock } from '../server/clock.js';" }]),
      ).toContain('layer-direction');
      expect(rulesHit([{ path: 'src/shared/format.ts', content: "import { z } from 'zod';" }])).toEqual([]);
    });

    it.each([
      ['src/server/domain/x.ts', "import { repo } from '../data/classes-repo.js';"],
      ['src/server/http/routes.ts', "import { repo } from '../data/classes-repo.js';"],
      ['src/server/data/x.ts', "export { y } from '../services/y.js';"],
      ['src/server/domain/x.ts', "import { createClock } from '../clock.js';"],
      ['src/server/domain/x.ts', "import { readFileSync } from 'node:fs';"],
    ])('flags imports against the layer direction in %s', (filePath, content) => {
      expect(rulesHit([{ path: filePath, content }])).toContain('layer-direction');
    });

    it('allows imports along the layer direction', () => {
      expect(
        rulesHit([
          { path: 'src/server/http/app.ts', content: "import { s } from '../services/s.js';\nimport { e } from '../../shared/errors.js';" },
          { path: 'src/server/services/s.ts', content: "import { d } from '../domain/d.js';\nimport { r } from '../data/r.js';" },
          { path: 'src/client/main.tsx', content: "import { e } from '../shared/errors';" },
        ]),
      ).toEqual([]);
    });
  });

  it('repository source files satisfy every rule', () => {
    const files = readRepositoryFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(checkFiles(files)).toEqual([]);
  });
});
