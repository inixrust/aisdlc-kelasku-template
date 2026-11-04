/**
 * Status kelas dihitung saat baca (AD-6), tidak pernah disimpan. Selesai sejak 00.00 WIB pada tanggal
 * sesi terakhir: `max(session_date) <= today` (epics/PRD revisi). Penuh ditambahkan di Story 1.7.
 */
import type { ClassStatus } from '../../shared/glossary.js';

export function classStatus(input: { sessionDates: readonly string[]; today: string }): ClassStatus {
  const last = input.sessionDates.reduce<string | null>((max, date) => (max === null || date > max ? date : max), null);
  return last !== null && last <= input.today ? 'finished' : 'open';
}
