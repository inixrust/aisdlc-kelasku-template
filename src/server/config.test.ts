import { describe, expect, it } from 'vitest';
import { addHoursIso } from './clock.js';
import { DEFAULT_DATABASE_PATH, readCookieSecure, readDatabasePath } from './config.js';

describe('readCookieSecure (AD-9)', () => {
  it.each(['true', 'TRUE', ' True '])('treats %j as Secure', (raw) => {
    expect(readCookieSecure(raw)).toBe(true);
  });

  it.each([undefined, '', '  ', 'false', '1', 'yes'])('treats %j as not Secure', (raw) => {
    expect(readCookieSecure(raw)).toBe(false);
  });
});

describe('readDatabasePath', () => {
  it('falls back to the default path for a missing or blank value', () => {
    expect(readDatabasePath(undefined)).toBe(DEFAULT_DATABASE_PATH);
    expect(readDatabasePath('  ')).toBe(DEFAULT_DATABASE_PATH);
    expect(readDatabasePath('./data/e2e.db')).toBe('./data/e2e.db');
  });
});

describe('addHoursIso (AD-15)', () => {
  it('adds hours and keeps the ISO-8601 UTC format with milliseconds', () => {
    expect(addHoursIso('2026-11-09T03:00:00.000Z', 12)).toBe('2026-11-09T15:00:00.000Z');
    expect(addHoursIso('2026-11-09T20:30:00.000Z', 12)).toBe('2026-11-10T08:30:00.000Z');
  });

  it('throws on an invalid instant or a non-finite hour count', () => {
    expect(() => addHoursIso('bukan-tanggal', 12)).toThrow();
    expect(() => addHoursIso('2026-11-09T03:00:00.000Z', Number.NaN)).toThrow();
  });
});
