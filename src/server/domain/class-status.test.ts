/**
 * ATDD fase merah Story 1.6 — AC-2 (1.6-UNIT-002, P1). Risiko: R-022.
 * Menggantikan P1-009 level sistem: sesi terakhir = hari ini sudah Selesai (`<=`, PRD revisi A-7/A-9a),
 * walaupun spine AD-6 baris 87 masih menulis `<` (lihat checklist ATDD, asumsi A-2).
 *
 * Fase hijau: diaktifkan oleh Story 1.6 (impor statis, tanpa `.skip`).
 * Penuh (`full`) ditambahkan di Story 1.7, jadi di sini hanya `open` | `finished`.
 */
import { describe, expect, it } from 'vitest';
import { classStatus } from './class-status.js';

const TODAY = '2026-11-09';

describe('classStatus (FR4, AD-6)', () => {
  it('[P1] AC-2 FR4: a class is finished when max(session_date) <= today, including the whole last session date', () => {
    // Kriteria inti: sepanjang tanggal sesi terakhir kelas sudah Selesai.
    expect(classStatus({ sessionDates: ['2026-11-02', TODAY], today: TODAY, quota: 5, registeredCount: 0 })).toBe('finished');

    expect(classStatus({ sessionDates: ['2026-11-02', '2026-11-05'], today: TODAY, quota: 5, registeredCount: 0 })).toBe('finished');
    expect(classStatus({ sessionDates: [TODAY, '2026-11-10'], today: TODAY, quota: 5, registeredCount: 0 })).toBe('open');
    // Urutan masukan tidak menentukan: yang dipakai max(session_date).
    expect(classStatus({ sessionDates: ['2026-11-16', '2026-11-02'], today: TODAY, quota: 5, registeredCount: 0 })).toBe('open');
  });
});
