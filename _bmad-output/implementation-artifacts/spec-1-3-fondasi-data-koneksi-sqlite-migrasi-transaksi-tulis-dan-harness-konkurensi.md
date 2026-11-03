---
title: 'Story 1.3: Fondasi data: koneksi SQLite, migrasi, transaksi tulis, dan harness konkurensi'
type: 'feature'
created: '2026-11-03'
status: 'in-progress'
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
- [ ] `src/shared/errors.ts` + test -- `AppError extends Error { code; httpStatus; fields? }`.
- [ ] `src/server/data/db.ts` -- `Db`, `Tx` (brand), `WriteCtx`, `createDb`, `migrate(db, { migrationsDir?, backupDir?, now? })`, `withWriteTx`.
- [ ] `src/server/data/migrations/.gitkeep` -- direktori migrasi produksi (masih kosong).
- [ ] `src/server/data/db.test.ts` -- seluruh matriks kecuali baris `main.ts`; `ctx` dibaca setelah lock; nilai kembali diteruskan; fn yang melempar → rollback.
- [ ] `src/server/services/index.ts` + `services.test.ts` -- `createServices({ db, clock })` → `Services` (kosong); test graf impor `db.ts`/`services/index.ts` bebas `fastify`.
- [ ] `src/server/http/app.ts` + `app.test.ts` -- `services` di opsi; `AppError` → status + envelope.
- [ ] `src/server/main.ts` -- `DATABASE_PATH` (bawaan `./data/kelasku.db`) → `createDb` → `migrate` → `createServices` → `buildApp`; tutup DB saat shutdown.
- [ ] `src/server/main.test.ts` -- spawn `main.ts` dengan `user_version=999` → exit ≠ 0.
- [ ] `package.json` -- `build` menyalin migrasi; `playwright.config.ts` -- `DATABASE_PATH` e2e.
- [ ] `test/helpers/test-db.ts` -- `TEST_NOW_ISO`, `fixedClock(iso)`, `createTestDb()` (berkas sementara + migrasi + services + `cleanup`).
- [ ] `test/helpers/concurrency.ts` + `concurrency-worker.ts` -- `runConcurrently(n, task)`, `defineConcurrentTask`, `stopConcurrencyWorkers`, `repeatConcurrent`, `CONCURRENCY_REPEATS = 50`.
- [ ] `test/helpers/test-server.ts` -- `startTestServer()` → `{ baseUrl, dbPath, close }` dengan `listen({ port: 0 })`.
- [ ] `test/helpers/fixtures/` -- migrasi `001_bounded_items.sql` + task `checkOutsideTx` / `checkInsideWriteTx` (batas 5).
- [ ] `test/helpers/concurrency.test.ts` -- kontrol negatif + positif 50×; `repeatConcurrent` melaporkan nomor ulangan; `startTestServer` 20 `fetch` serentak.
- [ ] `test/README.md` -- dokumentasikan helper baru.

**Acceptance Criteria:**
- Given 20 worker dan tabel batas 5, when varian cek-di-luar-transaksi dijalankan hingga 50 ulangan, then jumlah > 5 terdeteksi setidaknya sekali; and varian `withWriteTx` menghasilkan tepat 5 baris di setiap 50 ulangan tanpa satu pun hasil error.
- Given `repeatConcurrent(times, scenario)`, when ulangan ke-k gagal, then error menyebut "ulangan k".
- Given `startTestServer()`, when 20 `fetch` serentak dikirim, then semua status terkumpul (404 envelope untuk `/api/*` tak dikenal).
- Given `npm test`, `npm run typecheck`, `npm run build && npm run test:e2e`, when dijalankan, then semuanya hijau.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Pool worker: `runConcurrently` memakai worker yang hidup di level modul (dibuat sekali, `unref`), sehingga 50 ulangan murah. Per panggilan: kirim `{ module, exportName, dbPath, nowIso, busyTimeoutMs, input, index, sync }` → worker membuka koneksi, `Atomics.add(sync,0,1)`, `Atomics.wait(sync,1,0)`, menjalankan task, menutup koneksi, mengirim `{ ok, value } | { ok: false, code, message }`. Induk menunggu `sync[0] === n` dengan `Atomics.waitAsync`, lalu `Atomics.store(sync,1,1)` + `notify`.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau termasuk kontrol konkurensi 50×
- `npm run build && npm run test:e2e` -- expected: smoke tetap hijau; `dist/server/data/migrations/` ada
