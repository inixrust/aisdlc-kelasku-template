/**
 * Satu-satunya sumber waktu server (AD-7). `domain/` dan `services/` tidak membaca jam sendiri;
 * mereka menerima `Clock` atau `ctx = { nowIso, today }` yang dibangun darinya.
 *
 * B-2(a): bila `NODE_ENV=test` dan `KELASKU_FAKE_NOW` diisi, jam dibekukan pada instan itu,
 * dibaca sekali saat `createClock()`. Di luar test variabel itu diabaikan.
 */
export interface Clock {
  /** Instan saat ini (salinan baru setiap panggilan). */
  now(): Date;
  /** "Hari ini" sebagai tanggal kalender Asia/Jakarta, `YYYY-MM-DD`. */
  todayJakarta(): string;
}

export interface ClockEnv {
  NODE_ENV?: string | undefined;
  KELASKU_FAKE_NOW?: string | undefined;
}

const JAKARTA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Tanggal kalender Asia/Jakarta (`YYYY-MM-DD`) dari sebuah instan, lepas dari zona proses. */
export function jakartaDateOf(instant: Date): string {
  const parts = JAKARTA_DATE.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes): string => {
    const value = parts.find((p) => p.type === type)?.value;
    if (value === undefined) throw new Error(`Bagian tanggal "${type}" tidak ditemukan.`);
    return value;
  };
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * Instan ISO `iso` ditambah `hours` jam, sebagai ISO-8601 UTC dengan milidetik (AD-15),
 * mis. `expires_at = ctx.nowIso + 12 jam`. Ada di sini agar `services/` tidak membuat `Date` sendiri.
 */
export function addHoursIso(iso: string, hours: number): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms) || !Number.isFinite(hours)) {
    throw new Error(`addHoursIso: argumen tidak valid (${iso}, ${hours}).`);
  }
  return new Date(ms + hours * 3_600_000).toISOString();
}

function parseFakeNow(value: string): Date {
  // Hanya instan ISO-8601 UTC lengkap, mis. 2026-11-09T03:00:00.000Z.
  const isoUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?Z$/;
  const instant = new Date(value);
  // Date menggulirkan tanggal mustahil (30 Feb → 2 Mar, 24.00 → besok); tolak lewat pemeriksaan bolak-balik.
  const roundTrips = !Number.isNaN(instant.getTime()) && instant.toISOString().slice(0, 16) === value.slice(0, 16);
  if (!isoUtc.test(value) || !roundTrips) {
    throw new Error(
      `KELASKU_FAKE_NOW tidak valid: "${value}". Gunakan instan ISO-8601 UTC, mis. 2026-11-09T03:00:00.000Z.`,
    );
  }
  return instant;
}

export function createClock(env: ClockEnv = process.env): Clock {
  const fakeNow = env.NODE_ENV === 'test' && env.KELASKU_FAKE_NOW ? env.KELASKU_FAKE_NOW : undefined;

  if (fakeNow !== undefined) {
    const frozenMs = parseFakeNow(fakeNow).getTime();
    return {
      now: () => new Date(frozenMs),
      todayJakarta: () => jakartaDateOf(new Date(frozenMs)),
    };
  }

  return {
    now: () => new Date(),
    todayJakarta: () => jakartaDateOf(new Date()),
  };
}
