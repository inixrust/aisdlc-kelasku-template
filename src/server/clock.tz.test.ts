import { describe, expect, it } from 'vitest';
import { createClock, jakartaDateOf } from './clock.js';

// A-12: berkas ini dijalankan tiga kali (TZ=UTC, Asia/Jakarta, Asia/Jayapura); hasilnya harus identik.

const fakeClock = (iso: string) => createClock({ NODE_ENV: 'test', KELASKU_FAKE_NOW: iso });

describe('clock (AD-7)', () => {
  it('runs under the process time zone chosen by the Vitest project (A-12)', ({ task }) => {
    const expectedByProject: Record<string, string> = {
      'tz-utc': 'UTC',
      'tz-jakarta': 'Asia/Jakarta',
      'tz-jayapura': 'Asia/Jayapura',
    };
    const expected = expectedByProject[task.file.projectName ?? ''];
    expect(expected).toBeDefined();
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(expected);
  });

  it.each([
    ['2026-11-09T17:30:00.000Z', '2026-11-10', '00.30 WIB 10 Nov, UTC still 9 Nov'],
    ['2026-11-09T23:59:00.000Z', '2026-11-10', '06.59 WIB 10 Nov'],
    ['2026-11-10T16:30:00.000Z', '2026-11-10', '23.30 WIB 10 Nov, Asia/Jayapura already 11 Nov'],
    ['2026-11-09T17:00:00.000Z', '2026-11-10', 'exactly 00.00 WIB'],
    ['2026-11-09T16:59:59.999Z', '2026-11-09', 'one millisecond before 00.00 WIB'],
  ])('todayJakarta() for %s is %s (%s)', (iso, expected) => {
    expect(fakeClock(iso).todayJakarta()).toBe(expected);
    expect(jakartaDateOf(new Date(iso))).toBe(expected);
  });

  it('freezes KELASKU_FAKE_NOW when NODE_ENV=test (B-2a)', async () => {
    const clock = fakeClock('2026-11-09T03:00:00.000Z');
    const first = clock.now();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = clock.now();
    expect(first.toISOString()).toBe('2026-11-09T03:00:00.000Z');
    expect(second.toISOString()).toBe('2026-11-09T03:00:00.000Z');
    expect(second).not.toBe(first);
  });

  it('returns a copy so callers cannot move the frozen instant', () => {
    const clock = fakeClock('2026-11-09T03:00:00.000Z');
    clock.now().setUTCFullYear(2000);
    expect(clock.now().toISOString()).toBe('2026-11-09T03:00:00.000Z');
  });

  it.each(['production', 'development', undefined])('ignores KELASKU_FAKE_NOW when NODE_ENV=%s', (nodeEnv) => {
    const clock = createClock({ NODE_ENV: nodeEnv, KELASKU_FAKE_NOW: '2026-11-09T03:00:00.000Z' });
    expect(Math.abs(clock.now().getTime() - Date.now())).toBeLessThan(5_000);
    expect(clock.todayJakarta()).toBe(jakartaDateOf(new Date()));
  });

  it('uses the real clock when NODE_ENV=test but KELASKU_FAKE_NOW is empty', () => {
    const clock = createClock({ NODE_ENV: 'test', KELASKU_FAKE_NOW: '' });
    expect(Math.abs(clock.now().getTime() - Date.now())).toBeLessThan(5_000);
  });

  it.each([
    'besok',
    '2026-11-09',
    '2026-11-09T03:00:00',
    '2026-13-40T03:00:00.000Z',
    '2026-02-30T03:00:00.000Z',
    '2026-11-09T24:00:00.000Z',
  ])(
    'rejects an invalid KELASKU_FAKE_NOW %s',
    (value) => {
      expect(() => createClock({ NODE_ENV: 'test', KELASKU_FAKE_NOW: value })).toThrow(/KELASKU_FAKE_NOW tidak valid/);
    },
  );
});
