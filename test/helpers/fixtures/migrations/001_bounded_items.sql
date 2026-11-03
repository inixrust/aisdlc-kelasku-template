-- Fixture harness konkurensi (Story 1.3): tabel dengan batas 5 baris yang dijaga oleh task,
-- bukan oleh skema, sehingga cek-di-luar-transaksi bisa melampauinya. Bukan tabel produksi.
CREATE TABLE bounded_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_index INTEGER NOT NULL,
  created_at TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);
