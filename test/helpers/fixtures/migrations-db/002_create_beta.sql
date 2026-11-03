-- Fixture test runner migrasi (db.test.ts).
CREATE TABLE beta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alpha_id INTEGER NOT NULL REFERENCES alpha (id)
);
