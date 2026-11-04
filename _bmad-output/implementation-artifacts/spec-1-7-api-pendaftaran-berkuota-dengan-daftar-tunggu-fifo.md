---
title: 'Story 1.7: API pendaftaran berkuota dengan daftar tunggu FIFO (R1, R2, R3)'
type: 'feature'
created: '2026-11-04'
status: 'in-progress'
baseline_commit: 'ebf456cb34c96ecb380a0c96469bf87d0bbecdf7'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/test-artifacts/atdd-checklist-1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Peserta belum bisa mendaftar ke kelas lewat tautan publik, sehingga R1 (kuota), R2 (satu aktif per email), dan R3 (antrean FIFO) belum dijaga (FR7–FR10). Acceptance test ATDD story ini masih `it.skip`/`it.fails`.

**Approach:** Migrasi `003_registrations.sql`, domain murni (`classStatus` + Penuh, `decideRegistration`, `waitlistPosition`), repository penulis tunggal, tx-step `assertClassOpen` + `planRegistration`/`applyRegistration` dalam satu `withWriteTx`, rute publik `GET /api/public/classes/:code` dan `POST …/registrations`, serta kelas B-2b di `seed:demo`. Semua test ATDD diaktifkan (`it.fails`/`it.skip` → `it`) dan lulus tanpa mengubah ekspektasinya.

## Boundaries & Constraints

**Always:** Aturan AGENTS.md (SQL berparameter hanya di `data/`; `withWriteTx` hanya di use-case; callback sinkron, semua baca keputusan di dalamnya; `ctx.nowIso`/`ctx.today`; `normalizeEmail` sebelum simpan/cari; urutan antrean menurut `registrations.id`; tanpa kolom turunan; hanya `registrations-repo.ts` menulis `registrations`, tanpa `DELETE`). Respons publik tanpa id internal, kuota, atau data peserta. Email/nama tidak masuk log. Ekspektasi test ATDD tidak diubah (hanya penanda dilepas, impor dinamis → statis, literal → `getError('registration_closed')`, cast dibuang).

**Never:** Dependensi baru; halaman pendaftaran (1.8); pembatalan/promosi (Epik 2, 1.11); rute status/pembatalan publik; flag mutan di kode produksi.

**Keputusan (asumsi dry run, mengikuti asumsi kontrak ATDD A-1..A-10):**
- `classStatus({ sessionDates, today, quota, registeredCount })` dengan parameter wajib; `getClass` admin ikut menghitung Terdaftar sehingga bisa `full`. Pemanggil test 1.6 (`class-status.test.ts`) ditambah `quota`/`registeredCount` tanpa mengubah ekspektasi.
- `registration_closed`: 409, "Pendaftaran kelas ini sudah ditutup" (tanpa titik, persis test).
- `cancelled_by` di-CHECK `IN ('participant','admin')`; `promoted_at` nullable dengan CHECK GLOB.
- `public_ref` 10 karakter base64url penuh (boleh digit) dari `randomBytes`; respons 200 hanya `status`, `waitlistPosition?` (hanya Daftar tunggu), `nextSessionDate?` (sesi pertama ≥ today), `alreadyActive`, `registrationRef`.
- GET publik mengembalikan `publicCode`, `title`, `sessionDates` terurut, `status`, `today`.
- Nama 1–100 karakter di-trim; email di-trim lalu format `^[^\s@]+@[^\s@]+$`.
- Kode tak dikenal (GET/POST) → 404 `class_not_found`.
- Seed: kelas Penuh tanpa antrean, kelas Penuh + 3 Daftar tunggu, dan kelas Selesai (dibuat + diisi dengan clock today−10) berisi Terdaftar + Daftar tunggu; idempoten per judul. Test 1.6 "dates follow the Clock today exactly" disaring ke dua judul demo 1.6.
- Spec > 1600 token dipertahankan utuh (satu tujuan pengguna lintas lapisan).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Daftar ada kursi, antrean kosong | kuota 2, 0 Terdaftar | 200 `registered`, `nextSessionDate` | N/A |
| Penuh / antrean ada | Terdaftar = kuota, atau antrean tidak kosong | 200 `waitlisted`, posisi ekor | N/A |
| Email sudah aktif | `"Budi@Mail.com "` lalu `"budi@mail.com"` | 200 status sama, `alreadyActive: true`, tanpa baris baru | unique constraint → baca ulang → `alreadyActive` |
| Input tidak valid | nama kosong/101 karakter/hilang; email tanpa `@`/hilang | 400 `validation_error` + `fields.name`/`fields.email` | tanpa baris |
| Kelas Selesai | `max(session_date) <= today` | 409 `registration_closed` | tanpa baris |
| Kode tak dikenal | `TidakAdaKo` | 404 `class_not_found` | N/A |

</frozen-after-approval>

## Code Map

- `src/server/data/db.ts` -- `withWriteTx`, `Tx`, `WriteCtx`; pakai ulang, jangan diubah. Migrasi berurutan wajib → `003_registrations.sql`.
- `src/server/data/classes-repo.ts` -- pola repo; tambah `findClassByPublicCode`.
- `src/server/domain/class-status.ts` -- perluas dengan Penuh. Pemanggil: `services/classes.ts` `getClass`, `class-status.test.ts`.
- `src/server/services/{classes,index}.ts` -- pola use-case; `createServices` tambah `registrations`. `services.test.ts` mungkin memeriksa kunci services.
- `src/server/http/app.ts` -- daftarkan plugin rute publik `/api/public`; `preParsing` sudah memberi 415 untuk non-JSON. Pola rute: `routes/admin-classes.ts`.
- `src/shared/{errors,schemas,dto}.ts` -- `registration_closed`, `registrationRequestSchema`, `RegistrationResult`/`PublicClassResponse`.
- `scripts/{seed-demo,cli}.ts` -- `withServices` hanya memberi `services`; perlu akses `db`/`clock` untuk services dengan clock lampau.
- Test helper siap pakai: `test/helpers/registrations.ts` (`registrationsOf`), `test/tasks/registration-tasks.ts` (mutan memanggil `planRegistration(db as Tx, readCtx, input)` lalu `applyRegistration` di transaksi lain — `applyRegistration` harus menulis berdasar `plan` tanpa memutuskan ulang).
- Test ATDD: `src/server/domain/registration-rules.test.ts`, `src/server/data/registrations-schema.test.ts`, `src/server/services/registrations{,.concurrency}.test.ts`, `src/server/http/{public-registrations,registrations.tz}.test.ts`, `scripts/scripts.test.ts` (AC-15).

## Tasks & Acceptance

**Execution:**
- [x] `src/server/domain/{class-status,registration-rules}.ts` -- fungsi murni; aktifkan AC-2.
- [x] `src/server/data/migrations/003_registrations.sql`, `src/server/data/registrations-repo.ts` -- skema + repo; aktifkan AC-1.
- [x] `src/shared/{errors,schemas,dto}.ts` -- kode error, skema, DTO.
- [x] `src/server/services/{class-guard,registrations,classes,index}.ts` -- `assertClassOpen`, `planRegistration`/`applyRegistration`, `register`, `getPublicClass`.
- [x] `src/server/http/routes/public-registrations.ts`, `app.ts` -- rute publik; aktifkan AC-3/4/8/13/14, AC-11/12.
- [x] Konkurensi -- aktifkan AC-5/6/7/9/10; catat durasi.
- [x] `scripts/{seed-demo,cli}.ts`, `scripts/scripts.test.ts` -- seed B-2b; aktifkan AC-15; saring test 1.6.
- [x] `test/README.md` bila perlu -- catat berkas test baru.

**Acceptance Criteria:**
- Given semua test ATDD story 1.7, when `npm test`, then tidak ada `it.skip`/`it.fails` tersisa di berkas story ini dan seluruh suite lulus.
- Given `npm run typecheck` dan `npm run build`, then exit 0; fitness test arsitektur hijau.

## Implementation Notes

### ATDD Artifacts
- Checklist: _bmad-output/test-artifacts/atdd-checklist-1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo.md
- API tests: src/server/http/public-registrations.test.ts, src/server/http/registrations.tz.test.ts
- Concurrency (P0): src/server/services/registrations.concurrency.test.ts (+ test/tasks/registration-tasks.ts)
- Integration: src/server/services/registrations.test.ts, src/server/data/registrations-schema.test.ts, scripts/scripts.test.ts (AC-15)
- Unit: src/server/domain/registration-rules.test.ts
- E2E: tidak ada (story API; E2E pendaftaran ada di 1.8/1.9)

### Catatan implementasi
- Diimplementasikan langsung di sesi utama (tanpa subagen) karena seluruh investigasi sudah ada di konteks.
- `assertClassOpen(tx, ctx, classId, 'register')` di `services/class-guard.ts` membaca kelas + sesi di dalam transaksi; sebelum itu hanya resolusi `publicCode → id` (bukan baca keputusan).
- `register` menangkap `SQLITE_CONSTRAINT_UNIQUE` di luar transaksi dan menjalankan ulang plan+apply dalam `withWriteTx` baru (baca ulang → `alreadyActive`), sesuai AD-5.
- `withServices` di `scripts/cli.ts` kini juga memberi `{ db, clock }` agar seed bisa merakit services dengan clock 10 hari lalu untuk kelas Selesai.
- Penyesuaian test di luar ATDD 1.7 (tanpa mengubah ekspektasi): `class-status.test.ts` menambah argumen `quota`/`registeredCount`; `services.test.ts` menambah kunci `registrations`; test seed 1.6 "dates follow the Clock today exactly" disaring ke dua judul 1.6.
- Literal `409` di test AC-13/AC-14 dipertahankan (lebih ketat daripada `getError`, menyimpang dari saran A-8).
- Durasi `registrations.concurrency.test.ts` ±14 detik; `npm test` penuh ±12 detik (paralel); e2e 56/56 lulus.

## Spec Change Log

## Review Triage Log

Review dijalankan inline di sesi utama (tanpa subagen; sesi non-interaktif tanpa instruksi eksplisit untuk subagen), mencakup lensa adversarial, edge case, dan celah verifikasi atas diff `ebf456c..HEAD`.

| # | Temuan | Verdict | Rute | Bukti |
|---|--------|---------|------|-------|
| 1 | Email >254 karakter lolos `registrationRequestSchema` lalu ditolak CHECK `length(email) BETWEEN 3 AND 254` → `SQLITE_CONSTRAINT_CHECK` → 500, bukan 400 | medium | patch | `requiredEmail` tanpa `.max`; ditambah `EMAIL_MAX_LENGTH = 254` + `SCHEMA_MESSAGES.emailTooLong`; test regresi di `src/shared/schemas.test.ts` merah lalu hijau |
| 2 | `planRegistration` membaca `findClassByPublicCode` sebelum `assertClassOpen` (aturan "assertClassOpen baca pertama") | false | tolak | Itu hanya resolusi `publicCode → id`, bukan baca keputusan; status, sesi, kuota dibaca ulang di `assertClassOpen` dalam tx yang sama |
| 3 | Ekspektasi test ATDD diubah | false | tolak | `git diff ebf456c HEAD -- '*.test.ts'`: hanya penanda `it.skip`/`it.fails` → `it`, impor statis, argumen wajib `quota`/`registeredCount`, dan penyaringan test seed 1.6 per judul |
| 4 | Email/nama bocor ke log | false | tolak | Fastify hanya mencatat URL (kode publik); handler error mencatat `err` SQLite tanpa nilai baris |
| 5 | Retry unique violation bisa gagal lagi | false | tolak | Percobaan kedua membaca ulang di tx `BEGIN IMMEDIATE` baru sehingga baris aktif terlihat → `alreadyActive`; AC-9 ×50 hijau |

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau, 0 skip/expected-fail dari story 1.7
- `npm run build` -- expected: exit 0

**Hasil (2026-11-04):** typecheck exit 0; `npm test` 38 berkas / 318 test lulus, 0 skip; build exit 0.

### Review Findings

Code review `bmad-code-review` (2026-11-04), diff `ebf456c..35d86c7`, mode `full`. Empat lensa (blind, edge case, verification gap, acceptance) dijalankan inline oleh satu reviewer, tanpa subagen. Typecheck dan `npm test` hijau saat review (39 berkas, 355 test). Sesuai AC 1–15 dan batas "Never" spec: tidak ada dependensi baru, flag mutan, atau rute pembatalan/status.

- [ ] [Review][Patch] Email dengan karakter yang membesar saat `toLowerCase()` lolos batas 254 lalu gagal di CHECK SQLite → 500 [src/shared/schemas.ts:645, src/server/services/registrations.ts:64] — `registrationRequestSchema` membatasi `email` pada 254 unit sebelum `normalizeEmail`. `'İ'.repeat(120) + 'a'.repeat(30) + '@x.id'` (155 karakter) menjadi 275 karakter setelah dinormalisasi, sehingga CHECK `length(email) BETWEEN 3 AND 254` menolak insert. Error bukan `SQLITE_CONSTRAINT_UNIQUE`, jadi dilempar ulang sebagai 500 `internal_error` (sisa akar masalah yang sama dengan temuan #1 di Review Triage Log). Perbaikan: terapkan batas panjang pada hasil `normalizeEmail` (mis. `.refine` pada nilai ternormalisasi) dengan pesan `emailTooLong`, plus test regresi.
- [x] [Review][Defer] `alreadyActive: true` mengembalikan `registrationRef` dan status/posisi antrean milik pemilik email kepada siapa pun yang mengirim email itu [src/server/services/registrations.ts:90] — deferred: perilaku ini diwajibkan epics Story 1.7 dan AD-5/AD-10 (email adalah satu-satunya faktor identitas; status publik FR14 juga membuka ref lewat email), bukan cacat implementasi. Pihak ketiga yang tahu email korban dapat membaca ref lalu membatalkan lewat `POST /api/public/cancellations` (Story 1.11). Putusan produk: terima risiko (alat internal) atau minta konfirmasi lewat tautan email, yang non-goal notifikasi MVP.

#### Rejected

- `false` — `planRegistration` membaca `findClassByPublicCode` sebelum `assertClassOpen`: hanya resolusi kode → id; status, sesi, dan kuota dibaca ulang di `assertClassOpen` dalam transaksi yang sama (sudah ada di Review Triage Log #2).
- `false` — Retry `SQLITE_CONSTRAINT_UNIQUE` bisa gagal lagi: percobaan kedua berjalan di transaksi `BEGIN IMMEDIATE` baru dan melihat baris aktif; AC-9 ×50 lulus.
- `false` — Ekspektasi ATDD diubah: hanya penanda `skip`/`fails`, impor statis, argumen wajib `quota`/`registeredCount`, dan filter judul pada test seed 1.6.
- `false` — Nama/email bocor ke log: handler tidak mencatat body, dan `err` SQLite tidak memuat nilai baris.
- `low` — Pembacaan `getPublicClass` (kelas, sesi, COUNT) tidak dalam satu transaksi: hanya untuk tampilan; pendaftaran tetap diputuskan di `withWriteTx`, jadi kuota tidak bisa terlampaui. Tidak sebanding dengan tambahan transaksi baca.
- `low` — Seed gagal di tengah pendaftaran meninggalkan kelas setengah terisi karena idempotensi per judul: alat demo, mudah diulang dengan DB baru; memperbaikinya butuh transaksi lintas use-case.
- `low` — Regex fitness `registrations-single-writer` bisa dilewati dengan nama tabel dikutip (`"registrations"`): tidak ada kode yang menulis begitu, dan pengaman ini heuristik.
