/**
 * Status kelas dihitung saat baca (AD-6), tidak pernah disimpan. Selesai sejak 00.00 WIB pada tanggal
 * sesi terakhir: `max(session_date) <= today` (epics/PRD revisi). Selesai menang atas Penuh; Penuh bila
 * jumlah Terdaftar sudah mencapai kuota (Story 1.7).
 */
import type { ClassStatus } from '../../shared/glossary.js';

export interface ClassStatusInput {
  sessionDates: readonly string[];
  today: string;
  quota: number;
  registeredCount: number;
}

export function classStatus(input: ClassStatusInput): ClassStatus {
  const last = input.sessionDates.reduce<string | null>((max, date) => (max === null || date > max ? date : max), null);
  if (last !== null && last <= input.today) return 'finished';
  return input.registeredCount >= input.quota ? 'full' : 'open';
}

/** Tanggal sesi pertama yang belum lewat (`>= today`), atau `undefined` bila tidak ada. */
export function nextSessionDate(sessionDates: readonly string[], today: string): string | undefined {
  return sessionDates.reduce<string | undefined>(
    (next, date) => (date >= today && (next === undefined || date < next) ? date : next),
    undefined,
  );
}
