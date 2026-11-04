/**
 * Validasi daftar tanggal sesi (FR2, AD-19), satu fungsi untuk buat dan ubah kelas. Murni: "hari ini"
 * datang dari pemanggil (`ctx.today`, Asia/Jakarta). Tanggal sudah berbentuk `YYYY-MM-DD` yang sah
 * (dijaga skema zod); perbandingan string = perbandingan kalender.
 *
 * Batas mengikuti epics/PRD revisi: kelas Selesai bila `max(session_date) <= today`, jadi kelas baru
 * wajib punya minimal satu tanggal **setelah** hari ini agar tidak lahir Selesai.
 */
import { formatShortDate } from '../../shared/format.js';
import { SCHEMA_MESSAGES } from '../../shared/schemas.js';

export const SESSION_DATE_MESSAGES = {
  required: SCHEMA_MESSAGES.sessionDatesRequired,
  noneAfterToday: 'Minimal satu tanggal sesi harus setelah hari ini.',
  duplicate: (date: string) => `Tanggal ${formatShortDate(date)} sudah ada di kelas ini`,
} as const;

/**
 * `fields` error untuk envelope `validation_error` (`{}` bila sah). Kunci `sessionDates` untuk error
 * daftar; `sessionDates.<i>` untuk setiap kemunculan ulang tanggal ganda (indeks baris kemunculan kedua dst.).
 * Bila ada tanggal ganda, hanya error ganda yang dilaporkan.
 */
export function validateSessionDates(dates: readonly string[], today: string): Record<string, string> {
  if (dates.length === 0) return { sessionDates: SESSION_DATE_MESSAGES.required };

  const seen = new Set<string>();
  const duplicates: Record<string, string> = {};
  dates.forEach((date, index) => {
    if (seen.has(date)) duplicates[`sessionDates.${index}`] = SESSION_DATE_MESSAGES.duplicate(date);
    seen.add(date);
  });
  if (Object.keys(duplicates).length > 0) return duplicates;

  if (!dates.some((date) => date > today)) return { sessionDates: SESSION_DATE_MESSAGES.noneAfterToday };
  return {};
}

/** Salinan terurut naik dan unik; urutan tampilan berasal dari server (AD-20). */
export function sortSessionDates(dates: readonly string[]): string[] {
  return [...new Set(dates)].sort();
}
