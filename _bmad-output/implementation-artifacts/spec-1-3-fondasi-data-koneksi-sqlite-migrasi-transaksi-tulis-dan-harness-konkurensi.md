---
title: 'Story 1.3: Fondasi data: koneksi SQLite, migrasi, transaksi tulis, dan harness konkurensi'
type: 'feature'
created: '2026-11-03'
status: 'done'
baseline_commit: 'e4802d2cd457af19bdeefdeaa41306fd57c89b9b'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** R1, R2, R4, R7 di story berikutnya butuh koneksi SQLite, migrasi, transaksi tulis tunggal, dan bukti konkurensi multi-koneksi; tanpa fondasi ini tiap story membangunnya sendiri dan test race bisa lulus palsu (NFR1, R-008).

**Approach:** Tambah `createDb`, `migrate`, `withWriteTx` di `src/server/data/db.ts` (AD-1, AD-2, AD-3, AD-12, AD-15), `createServices` tanpa Fastify (B-1) yang dipakai `main.ts`, pemetaan `database_busy` → 503 (R-020), dan helper test `runConcurrently`, `repeatConcurrent`/`CONCURRENCY_REPEATS`, `startTestServer` di `test/helpers/` yang dibuktikan dengan kontrol negatif.

## Boundaries & Constraints

**Always:** Hanya `src/server/data/` mengimpor `better-sqlite3`; `withWriteTx` = `db.transaction(fn).immediate()`, melempar bila `db.inTransaction`, `ctx = { nowIso, today }` dari satu `clock.now()` dibaca di dalam lock; `SQLITE_BUSY*` → `AppError('database_busy')`. Migrasi `NNN_description.sql` berurutan 001..N tanpa celah, satu transaksi per berkas bersama `PRAGMA user_version = N`. Worker konkurensi memakai `createDb` + `createServices` dengan koneksi sendiri dan mulai lewat barrier `SharedArrayBuffer` + `Atomics`; tanpa jeda tetap. Tabel uji harness dibuat lewat migrasi fixture, bukan `CREATE TABLE` di test.

**Never:** Tanpa tabel domain/migrasi bisnis (Story 1.4+); tanpa use-case nyata (`createServices` mengembalikan objek kosong); tanpa dependensi baru; tanpa env baru; tanpa ORM; tanpa memasang `BURN_IN`.

**Keputusan (asumsi dry run, tidak terlihat pengguna):**
- "DB sudah berisi" = `user_version > 0` atau ada tabel non-`sqlite_%`. Backup lewat `VACUUM INTO` (sinkron) ke `backups/` relatif direktori kerja (bawaan; bisa diganti opsi), timestamp UTC ringkas `YYYYMMDDTHHMMSSmmmZ`.
- "`user_version` tidak berubah" = migrasi yang gagal tidak menaikkan `user_version`; migrasi sebelumnya yang sukses tetap ter-commit (masing-masing satu transaksi).
- `user_version` > migrasi terakhir, berkas `.sql` bernama salah, atau penomoran bercelah → `migrate` melempar (start gagal, exit ≠ 0).
- `build` menyalin `src/server/data/migrations/` ke `dist/server/data/migrations/`; e2e memakai `DATABASE_PATH=./data/e2e.db`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Koneksi baru | `createDb(tmp)` | `journal_mode=wal`, `foreign_keys=1`, `busy_timeout=5000`; direktori induk dibuat | N/A |
| DB baru, 2 migrasi | `user_version=0`, kosong | `user_version=2`, tanpa backup | N/A |
| DB berisi, 1 tertunda | `user_version=1` | backup `pre-migration-1-<ts>.db` dibuat sebelum, lalu `user_version=2` | N/A |
| Sudah mutakhir | `user_version=2` | tanpa perubahan, tanpa backup | N/A |
| Migrasi rusak | `002` berisi SQL salah | `user_version` tetap 1, tabel dari `002` tidak ada | `migrate` melempar |
| Start dengan DB rusak migrasi | `user_version=999` | proses `main.ts` exit ≠ 0 | pesan ke stderr |
| Tx bersarang | `withWriteTx` di dalam `withWriteTx` | — | melempar Error |
| Lock dipegang koneksi lain | `busyTimeoutMs: 50` | — | `AppError` `database_busy`; HTTP 503 envelope |

</frozen-after-approval>

## Code Map

- `src/server/clock.ts` -- `Clock`, `createClock(env)`, `jakartaDateOf(instant)`; pakai ulang untuk `ctx.today` dan clock beku test (`createClock({ NODE_ENV: 'test', KELASKU_FAKE_NOW })`).
- `src/shared/errors.ts` -- `ERRORS` sudah memuat `database_busy` 503; tambah kelas `AppError(code, fields?)` tanpa mengubah API yang ada.
- `src/server/main.ts` -- kini hanya `buildApp` + listen; tambah DB/migrasi/clock/services; `main().catch` sudah exit 1.
- `src/server/http/app.ts` -- `buildApp({ clientDir, logger })`; tambah `services` + error handler `AppError` → envelope.
- `src/server/http/spa-fallback.ts` -- tanpa build klien semua path tak dikenal → 404 envelope; jangan diubah.
- `src/architecture.test.ts` -- fitness HP-3 memindai `src`, `scripts`, `e2e`, `test`; `test/` tidak boleh mengimpor `better-sqlite3`; migrasi tanpa fungsi waktu SQL. Tidak perlu diubah.
- `test/helpers/temp-dir.ts` -- dasar berkas DB sementara; `test/README.md` tabel helper menunjuk story 1.3.
- `vitest.config.ts` -- project `integration` (`pool: 'forks'`) mencakup `src/server/**`, `test/**`.
- `playwright.config.ts` -- `webServer.env` belum punya `DATABASE_PATH`.
- Worker tsx: 20 worker baru ±480 ms → 100 ronde ±50 s; harness wajib memakai ulang worker antar-panggilan.

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/errors.ts` + test -- `AppError extends Error { code; httpStatus; fields? }`.
- [x] `src/server/data/db.ts` -- `Db`, `Tx` (brand), `WriteCtx`, `createDb`, `migrate(db, { migrationsDir?, backupDir?, now? })`, `withWriteTx`.
- [x] `src/server/data/migrations/.gitkeep` -- direktori migrasi produksi (masih kosong).
- [x] `src/server/data/db.test.ts` -- seluruh matriks kecuali baris `main.ts`; `ctx` dibaca setelah lock; nilai kembali diteruskan; fn yang melempar → rollback.
- [x] `src/server/services/index.ts` + `services.test.ts` -- `createServices({ db, clock })` → `Services` (kosong); test graf impor `db.ts`/`services/index.ts` bebas `fastify`.
- [x] `src/server/http/app.ts` + `app.test.ts` -- `services` di opsi; `AppError` → status + envelope.
- [x] `src/server/main.ts` -- `DATABASE_PATH` (bawaan `./data/kelasku.db`) → `createDb` → `migrate` → `createServices` → `buildApp`; tutup DB saat shutdown.
- [x] `src/server/main.test.ts` -- spawn `main.ts` dengan `user_version=999` → exit ≠ 0.
- [x] `package.json` -- `build` menyalin migrasi; `playwright.config.ts` -- `DATABASE_PATH` e2e.
- [x] `test/helpers/test-db.ts` -- `TEST_NOW_ISO`, `fixedClock(iso)`, `createTestDb()` (berkas sementara + migrasi + services + `cleanup`).
- [x] `test/helpers/concurrency.ts` + `concurrency-worker.ts` -- `runConcurrently(n, task)`, `defineConcurrentTask`, `stopConcurrencyWorkers`, `repeatConcurrent`, `CONCURRENCY_REPEATS = 50`.
- [x] `test/helpers/test-server.ts` -- `startTestServer()` → `{ baseUrl, dbPath, close }` dengan `listen({ port: 0 })`.
- [x] `test/helpers/fixtures/` -- migrasi `001_bounded_items.sql` + task `checkOutsideTx` / `checkInsideWriteTx` (batas 5).
- [x] `test/helpers/concurrency.test.ts` -- kontrol negatif + positif 50×; `repeatConcurrent` melaporkan nomor ulangan; `startTestServer` 20 `fetch` serentak.
- [x] `test/README.md` -- dokumentasikan helper baru.

**Acceptance Criteria:**
- Given 20 worker dan tabel batas 5, when varian cek-di-luar-transaksi dijalankan hingga 50 ulangan, then jumlah > 5 terdeteksi setidaknya sekali; and varian `withWriteTx` menghasilkan tepat 5 baris di setiap 50 ulangan tanpa satu pun hasil error.
- Given `repeatConcurrent(times, scenario)`, when ulangan ke-k gagal, then error menyebut "ulangan k".
- Given `startTestServer()`, when 20 `fetch` serentak dikirim, then semua status terkumpul (404 envelope untuk `/api/*` tak dikenal).
- Given `npm test`, `npm run typecheck`, `npm run build && npm run test:e2e`, when dijalankan, then semuanya hijau.

## Implementation Notes

- Fixture migrasi runner (`db.test.ts`) ada di `test/helpers/fixtures/migrations-db/`; migrasi rusak disimpan sebagai `.sql.txt` dan disalin ke direktori sementara dengan nama `.sql`, agar tidak ada `CREATE TABLE` di kode test.
- Worker memuat `.ts` lewat `execArgv: ['--import', 'tsx']`. Task worker harus diekspor dari modul non-`*.test.ts`.
- `Atomics.waitAsync` diakses lewat cast lokal karena `lib` tsconfig masih ES2023 (tanpa mengubah tsconfig).
- Mutation check manual: `withWriteTx` diganti transaksi deferred → kontrol positif gagal di ulangan 1 (kembali dipulihkan). Kontrol negatif terdeteksi di ulangan 1 pada 3/3 run.
- E2E: hanya test API yang bisa diverifikasi lokal; test browser gagal karena `libnspr4.so` tidak terpasang di mesin ini (butuh `sudo npx playwright install-deps chromium`).

## Spec Change Log

## Review Triage Log

| # | Sumber | Temuan | Verdict | Bukti | Rute |
|---|--------|--------|---------|-------|------|
| 1 | blind, edge, VG-other | Error non-`AppError` (500, JSON rusak 400, 415) tidak memakai envelope AD-8 dan 500 bawaan Fastify membocorkan `message` | medium | `app.ts` meneruskan `reply.send(error)`; perilaku sama sudah ada sejak story 1.1 (tanpa handler), perbaikan butuh kode registri baru `internal_error` | defer |
| 2 | VG | Jalur fallback non-`AppError` di handler tanpa test | medium | Akar sama dengan #1; test dipasang bersama perbaikan envelope | defer (gabung #1) |
| 3 | blind | `SQLITE_BUSY` di luar `withWriteTx` tidak dipetakan 503 | low | WAL: pembaca tidak terblokir penulis; belum ada baca use-case; perbaikan menambah cabang | tolak |
| 4 | blind | Handler kustom tidak mencatat log | low | `reply.send(error)` untuk non-`AppError` jatuh ke handler bawaan yang tetap mencatat; hanya 503 `AppError` tak tercatat | tolak |
| 5 | blind, edge | `build` tidak menghapus migrasi basi di `dist` | low | `cpSync` tanpa `rmSync`; migrasi yang di-rename saat dev → duplikat nomor → start gagal; perbaikan satu panggilan | patch |
| 6 | blind, edge | Migrasi rebuild tabel (FK off) tidak bisa di dalam transaksi | low | AD-12 mewajibkan satu transaksi per berkas; `PRAGMA defer_foreign_keys` tersedia; menambah mekanisme = kompleksitas | tolak |
| 7 | blind, edge | Berkas `.SQL` huruf besar diabaikan diam-diam | low | `endsWith('.sql')` peka huruf; koreksi langsung | patch |
| 8 | blind | Migrasi yang sudah diterapkan lalu diedit tidak terdeteksi | low | Kebijakan AGENTS.md; checksum = fitur baru | tolak |
| 9 | blind, edge | `runConcurrently` tumpang-tindih menimpa `pending` | low | Nyata tetapi hanya bila test memanggil tanpa `await`; perbaikan = guard baru | tolak |
| 10 | blind | DB e2e dan backup e2e bertahan antar-run | low | Sudah tercatat di deferred-work (story `seed:demo`, B-2) | tolak (sudah tertunda) |
| 11 | blind | Status spec vs sprint-status berbeda; AC e2e belum hijau | false | Sinkronisasi sprint-status terjadi di langkah presentasi; e2e browser gagal karena `libnspr4.so` (lingkungan), 2 test API e2e lulus | tolak |
| 12 | blind | Jalur sukses `main.ts` tanpa test | low | Test API e2e menjalankan `node dist/server/main.js` dengan `DATABASE_PATH` dan lulus | tolak |
| 13 | blind | Contoh task di `test/README.md` tidak lolos typecheck | low | Callback mengembalikan `void` untuk tipe `string`; koreksi langsung | patch |
| 14 | edge | Dua proses `migrate` bersamaan menerapkan ulang migrasi | low | `user_version` dibaca di luar lock; skrip CLI story berikut bisa start saat server start; perbaikan: cek ulang di dalam `.immediate()` | patch |
| 15 | edge | Nama backup bentrok di bawah clock beku | low | Hanya mode test dengan `fromVersion` sama setelah migrasi gagal | tolak |
| 16 | edge | SQL migrasi berisi `BEGIN`/`COMMIT` | false | Gagal keras dan `user_version` tetap — perilaku benar | tolak |
| 17 | edge | Nilai task tak bisa di-clone membuat worker crash | low | Gagal keras di test; dokumentasi sudah menyebut syarat clone | tolak |
| 18 | edge | `repeatConcurrent(0)` lulus tanpa cek | low | Pemanggil memakai `CONCURRENCY_REPEATS`; guard baru | tolak |
| 19 | edge | Tx bersarang lewat handle kedua → `database_busy` menyesatkan | low | Satu koneksi per proses/worker by design | tolak |
| 20 | edge | `startTestServer` bocor bila `listen` gagal | low | Port 0 di loopback; jarang | tolak |
| 21 | edge | `DATABASE_PATH` berspasi tidak di-trim | low | Kesalahan operator, gagal terlihat | tolak |
| 22 | VG | Backup untuk DB bertabel dengan `user_version = 0` tanpa test | medium | Menghapus `|| hasUserTables(db)` tidak menggagalkan test apa pun | patch |

## Design Notes

Pool worker: `runConcurrently` memakai worker yang hidup di level modul (dibuat sekali, `unref`), sehingga 50 ulangan murah. Per panggilan: kirim `{ module, exportName, dbPath, nowIso, busyTimeoutMs, input, index, sync }` → worker membuka koneksi, `Atomics.add(sync,0,1)`, `Atomics.wait(sync,1,0)`, menjalankan task, menutup koneksi, mengirim `{ ok, value } | { ok: false, code, message }`. Induk menunggu `sync[0] === n` dengan `Atomics.waitAsync`, lalu `Atomics.store(sync,1,1)` + `notify`.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau termasuk kontrol konkurensi 50×
- `npm run build && npm run test:e2e` -- expected: smoke tetap hijau; `dist/server/data/migrations/` ada
