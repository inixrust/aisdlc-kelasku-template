/**
 * Test statis token (AD-13, UX-DR1): frontmatter DESIGN.md ↔ `tokens.css` 1:1, dan tidak ada
 * nilai warna literal (hex, `rgb(`, `rgba(`) di `src/client/**` selain `tokens.css`.
 * Setiap pemeriksaan punya fixture negatif agar test tidak lulus kosong.
 * Frontmatter dibaca dengan parser kecil (YAML sederhana dua/tiga tingkat), tanpa dependensi YAML.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const DESIGN_PATH = '_bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/DESIGN.md';
const TOKENS_PATH = 'src/client/styles/tokens.css';
const CLIENT_DIR = 'src/client';

type Group = Record<string, string | Record<string, string>>;
type DesignTokens = Record<string, Group>;

const TOKEN_GROUPS = ['colors', 'typography', 'rounded', 'spacing', 'components'] as const;

function unquote(raw: string): string {
  const value = raw.trim();
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}

/** Baca grup token dari frontmatter DESIGN.md (`colors`, `typography`, `rounded`, `spacing`, `components`). */
function parseDesignTokens(markdown: string): DesignTokens {
  const lines = markdown.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') throw new Error('DESIGN.md tanpa frontmatter');
  const end = lines.indexOf('---', 1);
  if (end === -1) throw new Error('Frontmatter DESIGN.md tidak ditutup');

  const tokens: DesignTokens = {};
  let group: Group | null = null;
  let nested: Record<string, string> | null = null;

  for (const line of lines.slice(1, end)) {
    if (line.trim() === '' || line.trim().startsWith('#') || line.trim().startsWith('- ')) continue;
    const match = /^( *)('[^']*'|[^:'\s][^:]*):(?:\s+(.*))?$/.exec(line);
    if (match === null) throw new Error(`Baris frontmatter tidak dikenali: ${line}`);
    const indent = match[1]!.length;
    const key = unquote(match[2]!);
    const value = match[3] === undefined ? undefined : unquote(match[3]);

    if (indent === 0) {
      nested = null;
      group = (TOKEN_GROUPS as readonly string[]).includes(key) && value === undefined ? (tokens[key] = {}) : null;
    } else if (group === null) {
      continue;
    } else if (indent === 2) {
      if (value === undefined) {
        nested = {};
        group[key] = nested;
      } else {
        nested = null;
        group[key] = value;
      }
    } else if (indent === 4 && nested !== null && value !== undefined) {
      nested[key] = value;
    } else {
      throw new Error(`Indentasi frontmatter tidak dikenali: ${line}`);
    }
  }
  return tokens;
}

/** Custom property di blok `:root` → nilai (spasi dirapikan). */
function parseCustomProperties(css: string): Map<string, string> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const props = new Map<string, string>();
  for (const match of withoutComments.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1]!;
    if (props.has(name)) throw new Error(`Custom property ganda: ${name}`);
    props.set(name, match[2]!.trim().replace(/\s+/g, ' '));
  }
  return props;
}

const REFERENCE_PREFIX: Record<string, string> = { colors: 'color', rounded: 'radius', spacing: 'space' };
const TYPOGRAPHY_SUFFIX: Record<string, string> = {
  fontFamily: 'family',
  fontSize: 'size',
  fontWeight: 'weight',
  lineHeight: 'line-height',
};

/** `{colors.x}` → `var(--color-x)`; mengembalikan null bila nilai bukan nilai CSS (referensi lain, teks bebas). */
function resolveReferences(value: string): string | null {
  let unresolved = false;
  const resolved = value.replace(/\{(\w+)\.([\w-]+)\}/g, (_, group: string, key: string) => {
    const prefix = REFERENCE_PREFIX[group];
    if (prefix === undefined) {
      unresolved = true;
      return '';
    }
    return `var(--${prefix}-${key})`;
  });
  return unresolved ? null : resolved;
}

/** Properti komponen yang wajib ada di tokens.css (ukuran yang dipakai tata letak). */
function isRequiredComponentProperty(property: string): boolean {
  return property.startsWith('height') || property.endsWith('width') || property === 'size' || property === 'hit-area';
}

interface ExpectedToken {
  value: string | null;
  required: boolean;
}

/** Semua nama custom property yang sah menurut DESIGN.md beserta nilainya. */
function expectedProperties(tokens: DesignTokens): Map<string, ExpectedToken> {
  const expected = new Map<string, ExpectedToken>();
  const add = (name: string, value: string | null, required: boolean) => {
    if (expected.has(name)) throw new Error(`Nama custom property bentrok: ${name}`);
    expected.set(name, { value, required });
  };
  const flat = (group: string) => Object.entries(tokens[group] ?? {}).filter((e): e is [string, string] => typeof e[1] === 'string');
  const nested = (group: string) =>
    Object.entries(tokens[group] ?? {}).filter((e): e is [string, Record<string, string>] => typeof e[1] === 'object');

  for (const [key, value] of flat('colors')) add(`--color-${key}`, value, true);
  for (const [key, value] of flat('rounded')) add(`--radius-${key}`, value, true);
  for (const [key, value] of flat('spacing')) add(`--space-${key}`, value, true);
  for (const [role, props] of nested('typography')) {
    for (const [prop, value] of Object.entries(props)) {
      const suffix = TYPOGRAPHY_SUFFIX[prop];
      if (suffix === undefined) throw new Error(`Properti tipografi tak dikenal: ${role}.${prop}`);
      add(`--font-${role}-${suffix}`, value, true);
    }
  }
  for (const [component, props] of nested('components')) {
    for (const [prop, value] of Object.entries(props)) {
      add(`--${component}-${prop}`, resolveReferences(value), isRequiredComponentProperty(prop));
    }
  }
  return expected;
}

/** Selisih DESIGN.md ↔ tokens.css; kosong berarti 1:1. */
function tokenMismatches(tokens: DesignTokens, props: Map<string, string>): string[] {
  const expected = expectedProperties(tokens);
  const problems: string[] = [];
  for (const [name, { value, required }] of expected) {
    const actual = props.get(name);
    if (actual === undefined) {
      if (required) problems.push(`hilang: ${name}`);
      continue;
    }
    if (value === null) problems.push(`nilai DESIGN.md bukan nilai CSS: ${name}`);
    else if (actual !== value.replace(/\s+/g, ' ')) problems.push(`beda: ${name} = ${actual}, DESIGN.md: ${value}`);
  }
  for (const name of props.keys()) {
    if (!expected.has(name)) problems.push(`tidak ada di DESIGN.md: ${name}`);
  }
  return problems;
}

const COLOR_LITERAL_PATTERNS: Array<[RegExp, string]> = [
  [/#[0-9a-fA-F]{3,8}(?![\w-])/, 'hex'],
  [/\brgba?\s*\(/, 'rgb('],
];

/** Berkas klien berisi nilai warna literal (selain tokens.css dan berkas test). */
function colorLiteralViolations(files: Array<{ path: string; content: string }>): string[] {
  const violations: string[] = [];
  for (const file of files) {
    if (file.path === TOKENS_PATH || /\.test\.tsx?$/.test(file.path)) continue;
    file.content.split('\n').forEach((line, index) => {
      for (const [pattern, label] of COLOR_LITERAL_PATTERNS) {
        if (pattern.test(line)) violations.push(`${file.path}:${index + 1} (${label}) ${line.trim()}`);
      }
    });
  }
  return violations;
}

/** `var(--x)` di berkas klien yang `--x`-nya tidak didefinisikan di tokens.css (var() gagal diam-diam). */
function undefinedVarReferences(files: Array<{ path: string; content: string }>, defined: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  for (const file of files) {
    if (/\.test\.tsx?$/.test(file.path)) continue;
    for (const match of file.content.matchAll(/var\(\s*(--[\w-]+)/g)) {
      if (!defined.has(match[1]!)) problems.push(`${file.path}: ${match[1]}`);
    }
  }
  return problems;
}

function readClientFiles(): Array<{ path: string; content: string }> {
  const entries = readdirSync(path.join(ROOT, CLIENT_DIR), { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(tsx?|css|html)$/.test(entry.name))
    .map((entry) => {
      const relative = path.relative(ROOT, path.join(entry.parentPath, entry.name)).split(path.sep).join('/');
      return { path: relative, content: readFileSync(path.join(ROOT, relative), 'utf8') };
    });
}

const SAMPLE_DESIGN = [
  '---',
  'name: Contoh',
  'colors:',
  '  # komentar',
  "  primary: '#1D4ED8'",
  'typography:',
  '  body:',
  "    fontFamily: 'system-ui, \"Segoe UI\", sans-serif'",
  '    fontSize: 14px',
  "    fontWeight: '400'",
  "    lineHeight: '1.5'",
  'rounded:',
  '  md: 6px',
  'spacing:',
  "  '1': 4px",
  '  touch-target: 44px',
  'components:',
  '  button-primary:',
  "    background: '{colors.primary}'",
  '    height: 36px',
  "    height-participant: '{spacing.touch-target}'",
  "    icon: 'check'",
  "    typography: '{typography.body}'",
  '  dialog:',
  '    max-width: 440px',
  '---',
  '# Isi',
].join('\n');

const SAMPLE_CSS = `:root {
  --color-primary: #1D4ED8;
  --font-body-family: system-ui, "Segoe UI", sans-serif;
  --font-body-size: 14px;
  --font-body-weight: 400;
  --font-body-line-height: 1.5;
  --radius-md: 6px;
  --space-1: 4px;
  --space-touch-target: 44px;
  --button-primary-background: var(--color-primary);
  --button-primary-height: 36px;
  --button-primary-height-participant: var(--space-touch-target);
  --dialog-max-width: 440px;
}`;

describe('AD-13 design tokens: DESIGN.md ↔ tokens.css', () => {
  it('maps every DESIGN.md token 1:1 to a custom property in tokens.css', () => {
    const tokens = parseDesignTokens(readFileSync(path.join(ROOT, DESIGN_PATH), 'utf8'));
    const props = parseCustomProperties(readFileSync(path.join(ROOT, TOKENS_PATH), 'utf8'));

    expect(Object.keys(tokens['colors'] ?? {}).length).toBeGreaterThan(10);
    expect(Object.keys(tokens['typography'] ?? {}).length).toBeGreaterThan(5);
    expect(props.get('--top-bar-height')).toBe('48px');
    expect(props.get('--attendance-toggle-hit-area')).toBe('32px');
    expect(tokenMismatches(tokens, props)).toEqual([]);
  });

  it('accepts a matching sample (positive fixture)', () => {
    expect(tokenMismatches(parseDesignTokens(SAMPLE_DESIGN), parseCustomProperties(SAMPLE_CSS))).toEqual([]);
  });

  it('flags missing, changed, and unknown properties (negative fixtures)', () => {
    const tokens = parseDesignTokens(SAMPLE_DESIGN);
    const missing = parseCustomProperties(SAMPLE_CSS.replace('  --space-1: 4px;\n', '').replace('  --dialog-max-width: 440px;\n', ''));
    expect(tokenMismatches(tokens, missing)).toEqual(['hilang: --space-1', 'hilang: --dialog-max-width']);

    const changed = parseCustomProperties(SAMPLE_CSS.replace('--color-primary: #1D4ED8', '--color-primary: #1D4ED9'));
    expect(tokenMismatches(tokens, changed)).toEqual(['beda: --color-primary = #1D4ED9, DESIGN.md: #1D4ED8']);

    const literalInsteadOfReference = parseCustomProperties(
      SAMPLE_CSS.replace('--button-primary-height-participant: var(--space-touch-target)', '--button-primary-height-participant: 44px'),
    );
    expect(tokenMismatches(tokens, literalInsteadOfReference)).toEqual([
      'beda: --button-primary-height-participant = 44px, DESIGN.md: var(--space-touch-target)',
    ]);

    const unknown = parseCustomProperties(SAMPLE_CSS.replace(':root {', ':root {\n  --color-brand: #000000;'));
    expect(tokenMismatches(tokens, unknown)).toEqual(['tidak ada di DESIGN.md: --color-brand']);

    const notCss = parseCustomProperties(SAMPLE_CSS.replace(':root {', ':root {\n  --button-primary-typography: 14px;'));
    expect(tokenMismatches(tokens, notCss)).toEqual(['nilai DESIGN.md bukan nilai CSS: --button-primary-typography']);
  });
});

describe('AD-13 every var(--…) in src/client/** is defined in tokens.css', () => {
  it('finds no reference to an undefined custom property', () => {
    const defined = new Set(parseCustomProperties(readFileSync(path.join(ROOT, TOKENS_PATH), 'utf8')).keys());
    const files = readClientFiles();
    expect(files.some((f) => /var\(--/.test(f.content) && f.path !== TOKENS_PATH)).toBe(true);
    expect(undefinedVarReferences(files, defined)).toEqual([]);
  });

  it('flags references to undefined custom properties (negative fixture)', () => {
    const defined = new Set(['--alert-padding', '--color-primary']);
    expect(
      undefinedVarReferences(
        [
          { path: 'src/client/components/components.css', content: '.alert { padding: var(--alert-padding); color: var( --color-x); }' },
          { path: 'src/client/components/X.tsx', content: "const s = { color: 'var(--color-primary)', gap: 'var(--space-9)' };" },
          { path: 'src/client/a.test.ts', content: "'var(--nope)'" },
        ],
        defined,
      ),
    ).toEqual(['src/client/components/components.css: --color-x', 'src/client/components/X.tsx: --space-9']);
  });
});

describe('AD-13 no color literals outside tokens.css', () => {
  it('finds no hex, rgb( or rgba( in src/client/** except tokens.css', () => {
    const files = readClientFiles();
    expect(files.some((f) => f.path === TOKENS_PATH)).toBe(true);
    expect(files.some((f) => f.path.endsWith('.css') && f.path !== TOKENS_PATH)).toBe(true);
    expect(colorLiteralViolations(files)).toEqual([]);
  });

  it('flags hex, rgb( and rgba( literals (negative fixtures)', () => {
    expect(
      colorLiteralViolations([
        { path: 'src/client/styles/base.css', content: 'a { color: #1d4ed8; }' },
        { path: 'src/client/components/X.tsx', content: "const s = { color: 'rgb(0, 0, 0)' };" },
        { path: 'src/client/components/Y.css', content: '.y { background: rgba(0,0,0,.5); border-color: #FFF; }' },
        { path: 'src/client/styles/tokens.css', content: '--color-x: #FFFFFF;' },
        { path: 'src/client/a.test.ts', content: "'#FFFFFF'" },
        { path: 'src/client/components/Z.tsx', content: '<a href="#main-content">Lewati</a> <div id="root">' },
      ]),
    ).toEqual([
      'src/client/styles/base.css:1 (hex) a { color: #1d4ed8; }',
      "src/client/components/X.tsx:1 (rgb() const s = { color: 'rgb(0, 0, 0)' };",
      'src/client/components/Y.css:1 (hex) .y { background: rgba(0,0,0,.5); border-color: #FFF; }',
      'src/client/components/Y.css:1 (rgb() .y { background: rgba(0,0,0,.5); border-color: #FFF; }',
    ]);
  });
});
