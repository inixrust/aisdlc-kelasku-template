/**
 * ATDD fase merah Story 1.6 — AC-2 (1.6-UNIT-002, P1). Risiko: R-022.
 * Menggantikan P1-009 level sistem: sesi terakhir = hari ini sudah Selesai (`<=`, PRD revisi A-7/A-9a),
 * walaupun spine AD-6 baris 87 masih menulis `<` (lihat checklist ATDD, asumsi A-2).
 *
 * Modul `./class-status.js` belum ada; impor dinamis agar berkas termuat selama `it.skip` dan
 * typecheck hijau. Saat aktivasi: `import { classStatus } from './class-status.js';` lalu hapus `.skip`.
 * Penuh (`full`) ditambahkan di Story 1.7, jadi di sini hanya `open` | `finished`.
 */
import { describe, expect, it } from 'vitest';
import type { ClassStatus } from '../../shared/glossary.js';

type ClassStatusFn = (input: { sessionDates: readonly string[]; today: string }) => ClassStatus;

const CLASS_STATUS_MODULE = './class-status.js';

async function loadClassStatus(): Promise<ClassStatusFn> {
  const mod = (await import(/* @vite-ignore */ CLASS_STATUS_MODULE)) as { classStatus: ClassStatusFn };
  return mod.classStatus;
}

const TODAY = '2026-11-09';

describe('classStatus (FR4, AD-6)', () => {
  it.skip('[P1] AC-2 FR4: a class is finished when max(session_date) <= today, including the whole last session date', async () => {
    const classStatus = await loadClassStatus();

    // Kriteria inti: sepanjang tanggal sesi terakhir kelas sudah Selesai.
    expect(classStatus({ sessionDates: ['2026-11-02', TODAY], today: TODAY })).toBe('finished');

    expect(classStatus({ sessionDates: ['2026-11-02', '2026-11-05'], today: TODAY })).toBe('finished');
    expect(classStatus({ sessionDates: [TODAY, '2026-11-10'], today: TODAY })).toBe('open');
    // Urutan masukan tidak menentukan: yang dipakai max(session_date).
    expect(classStatus({ sessionDates: ['2026-11-16', '2026-11-02'], today: TODAY })).toBe('open');
  });
});
