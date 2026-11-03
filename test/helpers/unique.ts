import { randomUUID } from 'node:crypto';

/** Akhiran acak 8 karakter heksadesimal; dipakai agar data test paralel tidak bertabrakan. */
export function uniqueId(): string {
  return randomUUID().replaceAll('-', '').slice(0, 8);
}

/**
 * Email unik di domain contoh, mis. `peserta-1a2b3c4d@contoh.id`.
 * Sudah dalam bentuk ternormalisasi (huruf kecil, tanpa spasi); untuk menguji
 * normalisasi, ubah hasilnya secara eksplisit di test.
 */
export function uniqueEmail(label = 'peserta'): string {
  return `${label.toLowerCase()}-${uniqueId()}@contoh.id`;
}

/** Judul kelas unik, mis. `Kelas uji 1a2b3c4d`. */
export function uniqueTitle(label = 'Kelas uji'): string {
  return `${label} ${uniqueId()}`;
}
