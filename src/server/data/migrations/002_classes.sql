-- Story 1.6: kelas dan tanggal sesinya (FR2, FR6, AD-6, AD-10, AD-15).
-- Status kelas (Dibuka/Penuh/Selesai) tidak disimpan; dihitung saat baca oleh domain.
-- `public_code` 10 karakter base64url acak, tidak pernah diubah; id internal tidak muncul di URL publik.
-- Tanpa DEFAULT waktu: `*_at` diisi dari `ctx.nowIso`.

CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_code TEXT NOT NULL UNIQUE CHECK (length(public_code) = 10 AND public_code NOT GLOB '*[^A-Za-z0-9_-]*'),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  quota INTEGER NOT NULL CHECK (typeof(quota) = 'integer' AND quota >= 1),
  created_at TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  updated_at TEXT NOT NULL CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);

CREATE TABLE class_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes (id) ON DELETE RESTRICT,
  session_date TEXT NOT NULL CHECK (session_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  UNIQUE (class_id, session_date)
);
