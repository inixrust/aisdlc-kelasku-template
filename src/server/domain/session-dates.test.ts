/**
 * ATDD fase merah Story 1.6 — AC-1 (1.6-UNIT-001, P1). Risiko: R-022, R-005, R-010.
 *
 * Fase hijau: diaktifkan oleh Story 1.6 (impor statis, tanpa `.skip`).
 *
 * Kontrak (catat di checklist ATDD): `validateSessionDates(dates, today)` murni,
 * mengembalikan `fields` error (`{}` bila sah). Kunci `sessionDates` untuk error daftar,
 * `sessionDates.<index>` untuk tanggal ganda (indeks kemunculan kedua).
 */
import { describe, expect, it } from 'vitest';
import { validateSessionDates } from './session-dates.js';

/** "Hari ini" WIB sama dengan `TEST_NOW_ISO` / `KELASKU_FAKE_NOW` e2e (Senin 9 Nov 2026). */
const TODAY = '2026-11-09';
const TOMORROW = '2026-11-10';
const LAST_WEEK = '2026-11-02';

describe('validateSessionDates (FR2, AD-19)', () => {
  it('[P1] AC-1 FR2: rejects empty, duplicate, and no-date-after-today lists; accepts past dates when one is after today', () => {
    // Kriteria inti (R-022): kelas yang hanya bersesi hari ini akan lahir Selesai → ditolak.
    expect(Object.keys(validateSessionDates([TODAY], TODAY))).toEqual(['sessionDates']);

    // Batas WIB yang diterima.
    expect(validateSessionDates([TODAY, TOMORROW], TODAY)).toEqual({});
    expect(validateSessionDates([LAST_WEEK, TOMORROW], TODAY)).toEqual({});

    // Daftar kosong dan daftar tanpa tanggal setelah hari ini.
    expect(Object.keys(validateSessionDates([], TODAY))).toEqual(['sessionDates']);
    expect(Object.keys(validateSessionDates([LAST_WEEK], TODAY))).toEqual(['sessionDates']);
    for (const message of [validateSessionDates([], TODAY), validateSessionDates([TODAY], TODAY)].map((f) => f.sessionDates)) {
      expect(message).toMatch(/\S/);
    }

    // Tanggal ganda: pesan menyebut tanggalnya, kunci menunjuk baris kemunculan kedua.
    expect(validateSessionDates(['2026-11-16', TODAY, '2026-11-16'], TODAY)).toEqual({
      'sessionDates.2': 'Tanggal 16 Nov 2026 sudah ada di kelas ini',
    });
    expect(validateSessionDates([TODAY, TODAY, TOMORROW], TODAY)).toEqual({
      'sessionDates.1': 'Tanggal 9 Nov 2026 sudah ada di kelas ini',
    });
  });
});
