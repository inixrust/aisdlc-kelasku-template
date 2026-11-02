import { describe, expect, it } from 'vitest';

describe('test environment (HP-1)', () => {
  it('runs Vitest with process time zone UTC', () => {
    expect(process.env.TZ).toBe('UTC');
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('UTC');
    expect(new Date(Date.UTC(2026, 10, 9, 17, 30)).getHours()).toBe(17);
  });
});
