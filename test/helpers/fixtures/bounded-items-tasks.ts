/**
 * Task fixture untuk membuktikan harness konkurensi (Story 1.3) atas tabel `bounded_items`
 * (migrasi `fixtures/migrations/001_bounded_items.sql`). Keduanya menjalankan "hitung, lalu
 * sisipkan bila masih di bawah batas"; bedanya hanya letak cek terhadap transaksi tulis.
 */
import { fileURLToPath } from 'node:url';
import { withWriteTx } from '../../../src/server/data/db.js';
import { defineConcurrentTask } from '../concurrency.js';

export const BOUNDED_ITEMS_LIMIT = 5;

/** Direktori migrasi fixture yang membuat `bounded_items`. */
export const BOUNDED_ITEMS_MIGRATIONS_DIR = fileURLToPath(new URL('./migrations/', import.meta.url));

export interface BoundedInsertResult {
  inserted: boolean;
}

/**
 * Kontrol negatif: cek dan tulis di luar transaksi (pola yang dilarang AD-3). Dengan banyak
 * koneksi bersamaan, beberapa worker membaca jumlah yang sama sebelum ada yang menulis,
 * sehingga batas bisa terlampaui.
 */
export const checkOutsideTx = defineConcurrentTask<undefined, BoundedInsertResult>(
  import.meta.url,
  'checkOutsideTx',
  ({ db, clock, index }) => {
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM bounded_items').get() as { n: number };
    if (n >= BOUNDED_ITEMS_LIMIT) return { inserted: false };
    db.prepare('INSERT INTO bounded_items (worker_index, created_at) VALUES (?, ?)').run(
      index,
      clock.now().toISOString(),
    );
    return { inserted: true };
  },
);

/** Kontrol positif: cek dan tulis di dalam satu `withWriteTx` (`BEGIN IMMEDIATE`, AD-3). */
export const checkInsideWriteTx = defineConcurrentTask<undefined, BoundedInsertResult>(
  import.meta.url,
  'checkInsideWriteTx',
  ({ db, clock, index }) =>
    withWriteTx(db, clock, (tx, ctx) => {
      const { n } = tx.prepare('SELECT COUNT(*) AS n FROM bounded_items').get() as { n: number };
      if (n >= BOUNDED_ITEMS_LIMIT) return { inserted: false };
      tx.prepare('INSERT INTO bounded_items (worker_index, created_at) VALUES (?, ?)').run(index, ctx.nowIso);
      return { inserted: true };
    }),
);

/** Task gagal untuk menguji pelaporan error per worker. */
export const alwaysFails = defineConcurrentTask<undefined, never>(import.meta.url, 'alwaysFails', ({ index }) => {
  throw Object.assign(new Error(`gagal di worker ${index}`), { code: 'fixture_failure' });
});
