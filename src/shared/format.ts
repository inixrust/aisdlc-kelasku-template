/**
 * Format tanggal untuk tampilan (AD-10, AD-13). Satu-satunya tempat tanggal/waktu diubah
 * menjadi teks Indonesia; selalu `id-ID` dan zona Asia/Jakarta, lepas dari zona proses/browser.
 */

const TIME_ZONE = 'Asia/Jakarta';

const SESSION_DATE = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
// Instan wajib membawa zona (`Z` atau `±HH:MM`); tanpa itu `Date` memakai zona proses/browser.
const ZONED_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const SHORT_DATE = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** `YYYY-MM-DD` → instan siang UTC (= 19.00 WIB pada tanggal kalender yang sama); null bila bukan tanggal nyata. */
function calendarNoon(date: string): Date | null {
  const match = CALENDAR_DATE.exec(date);
  if (match === null) return null;
  const [, year, month, day] = match;
  const instant = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  if (instant.getUTCDate() !== Number(day) || instant.getUTCMonth() !== Number(month) - 1) return null;
  return instant;
}

/** Benar bila `date` berbentuk `YYYY-MM-DD` dan tanggal kalendernya ada (bukan 30 Feb). */
export function isCalendarDate(date: string): boolean {
  return calendarNoon(date) !== null;
}

function requireCalendarDate(date: string): Date {
  const instant = calendarNoon(date);
  if (instant === null) throw new RangeError(`Tanggal sesi tidak valid: "${date}"`);
  return instant;
}

/** Tanggal sesi `YYYY-MM-DD` (kalender WIB) → "Senin, 9 Nov 2026". */
export function formatSessionDate(date: string): string {
  return SESSION_DATE.format(requireCalendarDate(date));
}

/** Tanggal `YYYY-MM-DD` (kalender WIB) tanpa nama hari → "9 Nov 2026" (mis. pesan tanggal ganda). */
export function formatShortDate(date: string): string {
  return SHORT_DATE.format(requireCalendarDate(date));
}

/** Instan ISO-8601 UTC → "9 Nov 2026, 14.32 WIB". */
export function formatDateTime(iso: string): string {
  const instant = new Date(iso);
  if (!ZONED_INSTANT.test(iso) || Number.isNaN(instant.getTime())) throw new RangeError(`Waktu tidak valid: "${iso}"`);
  return `${DATE_TIME.format(instant)} WIB`;
}
