/**
 * Pembacaan env bersama server dan skrip CLI (konvensi Konfigurasi spine), agar keduanya
 * selalu membuka berkas DB yang sama.
 */
export const DEFAULT_DATABASE_PATH = './data/kelasku.db';

export function readDatabasePath(raw: string | undefined): string {
  return raw === undefined || raw.trim() === '' ? DEFAULT_DATABASE_PATH : raw;
}

/** `COOKIE_SECURE=true` (tanpa beda huruf besar/kecil) → cookie sesi `Secure`; selain itu `false`. */
export function readCookieSecure(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === 'true';
}
