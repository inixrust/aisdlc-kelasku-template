-- Story 1.4: akun admin dan sesi masuk (AD-9, AD-10, AD-15).
-- Email tersimpan ternormalisasi (normalizeEmail); password scrypt dengan salt per akun (hex).
-- Token sesi tidak pernah disimpan; hanya SHA-256 hex-nya.

CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  updated_at TEXT NOT NULL CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);

CREATE TABLE admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z'),
  expires_at TEXT NOT NULL CHECK (expires_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*Z')
);

CREATE INDEX admin_sessions_admin_id ON admin_sessions (admin_id);
