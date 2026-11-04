-- Story 1.7: pendaftaran peserta (FR7–FR10, AD-5, AD-10, AD-15, AD-17).
-- Status kelas, terisi/kuota, dan posisi antrean tidak disimpan; dihitung saat baca oleh domain.
-- Urutan antrean (R3) memakai `id`, bukan `created_at`. Hanya `registrations-repo.ts` yang menulis tabel ini; tanpa DELETE.
-- `public_ref` 10 karakter base64url acak (pembatalan publik), tidak pernah diubah.
-- Tanpa DEFAULT waktu: `*_at` diisi dari `ctx.nowIso`.

CREATE TABLE registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_ref TEXT NOT NULL UNIQUE CHECK (length(public_ref) = 10 AND public_ref NOT GLOB '*[^A-Za-z0-9_-]*'),
  class_id INTEGER NOT NULL REFERENCES classes (id) ON DELETE RESTRICT,
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
  created_at TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  promoted_at TEXT CHECK (promoted_at IS NULL OR promoted_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  cancelled_at TEXT CHECK (cancelled_at IS NULL OR cancelled_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  cancelled_by TEXT CHECK (cancelled_by IS NULL OR cancelled_by IN ('participant', 'admin')),
  CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))
);

-- R2 lapis kedua: satu pendaftaran aktif per (kelas, email ternormalisasi).
CREATE UNIQUE INDEX registrations_active_email ON registrations (class_id, email) WHERE status IN ('registered', 'waitlisted');
-- COUNT Terdaftar dan antrean per kelas, urut id.
CREATE INDEX registrations_class_status_id ON registrations (class_id, status, id);
-- Status peserta lewat email (FR14).
CREATE INDEX registrations_email ON registrations (email);
