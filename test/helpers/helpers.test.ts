import { existsSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createTempDir } from './temp-dir.js';
import { uniqueEmail, uniqueId, uniqueTitle } from './unique.js';

describe('test helper: createTempDir', () => {
  it('creates an isolated directory and removes it on cleanup', () => {
    const a = createTempDir();
    const b = createTempDir();
    try {
      expect(a.path).not.toBe(b.path);
      writeFileSync(a.file('kelasku.db'), '');
      expect(existsSync(a.file('kelasku.db'))).toBe(true);
    } finally {
      a.cleanup();
      b.cleanup();
    }
    expect(existsSync(a.path)).toBe(false);
    expect(() => a.cleanup()).not.toThrow();
  });
});

describe('test helper: unique data', () => {
  it('produces distinct, already-normalized values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uniqueId()));
    expect(ids.size).toBe(100);
    expect(uniqueId()).toMatch(/^[0-9a-f]{8}$/);
    expect(uniqueEmail('Admin')).toMatch(/^admin-[0-9a-f]{8}@contoh\.id$/);
    expect(uniqueTitle()).toMatch(/^Kelas uji [0-9a-f]{8}$/);
  });
});
