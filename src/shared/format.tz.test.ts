import { describe, expect, it } from 'vitest';
import { formatDateTime, formatSessionDate } from './format.js';

// A-12: berkas ini dijalankan tiga kali (TZ=UTC, Asia/Jakarta, Asia/Jayapura); hasilnya harus identik.

describe('format (AD-10)', () => {
  it('formats a session date as an Indonesian calendar date', () => {
    expect(formatSessionDate('2026-11-09')).toBe('Senin, 9 Nov 2026');
    expect(formatSessionDate('2026-08-17')).toBe('Senin, 17 Agu 2026');
  });

  it('formats an instant in WIB', () => {
    expect(formatDateTime('2026-11-09T07:32:00.000Z')).toBe('9 Nov 2026, 14.32 WIB');
  });

  it('moves an instant past WIB midnight to the next calendar day', () => {
    expect(formatDateTime('2026-11-09T17:30:00.000Z')).toBe('10 Nov 2026, 00.30 WIB');
  });

  it.each(['09-11-2026', '2026-02-30', ''])('rejects an invalid session date %j', (value) => {
    expect(() => formatSessionDate(value)).toThrow(RangeError);
  });

  it.each(['bukan waktu', '2026-11-09T07:32:00', '2026-11-09'])('rejects an invalid or zoneless instant %j', (value) => {
    expect(() => formatDateTime(value)).toThrow(RangeError);
  });
});
