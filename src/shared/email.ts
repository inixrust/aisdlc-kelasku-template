/**
 * Satu-satunya normalisasi email (AD-5): trim + lowercase. Dipakai sebelum setiap simpan dan cari.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
