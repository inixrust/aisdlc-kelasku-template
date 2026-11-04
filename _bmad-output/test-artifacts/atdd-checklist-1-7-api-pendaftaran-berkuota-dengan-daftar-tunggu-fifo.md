---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-11-04'
workflowType: 'testarch-atdd'
storyId: '1.7'
storyKey: '1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo'
storyFile: '_bmad-output/planning-artifacts/epics.md#story-17-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo-r1-r2-r3'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo.md'
detectedStack: 'fullstack'
generationMode: 'ai-generation'
executionMode: 'sequential'
generatedTestFiles:
  - src/server/http/public-registrations.test.ts
  - src/server/http/registrations.tz.test.ts
  - src/server/services/registrations.concurrency.test.ts
  - src/server/services/registrations.test.ts
  - src/server/data/registrations-schema.test.ts
  - scripts/scripts.test.ts
  - src/server/domain/registration-rules.test.ts
supportFiles:
  - test/helpers/registrations.ts
  - test/tasks/registration-tasks.ts
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/test-artifacts/test-design-epic-1.md
  - _bmad-output/test-artifacts/atdd-checklist-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md
  - _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad/tea/config.yaml
  - vitest.config.ts
  - test/README.md
  - test/helpers/concurrency.ts
  - test/helpers/test-db.ts
  - test/helpers/test-server.ts
  - knowledge: data-factories, component-tdd, test-quality, test-healing-patterns, selector-resilience, timing-debugging, playwright-cli, fixture-architecture, network-first, test-levels-framework, test-priorities-matrix, ci-burn-in
acceptanceCriteria:
  - { id: 'AC-1', idSource: 'generated', text: 'Migrasi baru registrations (public_ref unik, class_id FK, email, name, status CHECK, created_at, promoted_at, cancelled_at, cancelled_by, CHECK pembatalan AD-17, CHECK GLOB waktu), unique index parsial (class_id, email) WHERE status aktif, indeks (class_id, status, id) dan (email); tanpa DEFAULT waktu; hanya registrations-repo.ts yang INSERT/UPDATE registrations' }
  - { id: 'AC-2', idSource: 'generated', text: 'Domain murni: classStatus Selesai bila max(session_date) <= today, Penuh bila Dibuka dan Terdaftar = kuota, selain itu Dibuka; keputusan Terdaftar hanya bila registered < quota dan antrean kosong; posisi antrean 1-based menurut id naik' }
  - { id: 'AC-3', idSource: 'generated', text: 'GET /api/public/classes/:code: judul, tanggal sesi, status open/full/finished, today, tanpa id internal, kuota, atau data peserta; kode tak dikenal → 404 class_not_found' }
  - { id: 'AC-4', idSource: 'generated', text: 'POST /api/public/classes/:code/registrations {name, email} valid → satu withWriteTx (assertClassOpen → cari aktif → keputusan → insert created_at = ctx.nowIso, public_ref 10 karakter base64url); 200 {status, waitlistPosition?, nextSessionDate?, alreadyActive: false, registrationRef}; input tidak valid → 400 validation_error + fields; tanpa ID internal; 1.000 ref unik tidak berurutan' }
  - { id: 'AC-5', idSource: 'generated', text: 'R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered (runConcurrently, ×50, 5/15, posisi 1–15, tanpa error)' }
  - { id: 'AC-6', idSource: 'generated', text: 'R1: 20 concurrent HTTP registrations all succeed without 5xx and fill the quota exactly (startTestServer, ×50)' }
  - { id: 'AC-7', idSource: 'generated', text: 'R1: mutation check — non-atomic quota check is caught by the concurrency test (gagal ≥ 1× dari 50)' }
  - { id: 'AC-8', idSource: 'generated', text: 'R2: email is normalized before the active-registration check ("Budi@Mail.com " aktif, "budi@mail.com" → tanpa baris baru, 200 alreadyActive: true + posisi bila Daftar tunggu)' }
  - { id: 'AC-9', idSource: 'generated', text: 'R2: concurrent duplicate registrations create one row (satu baris aktif, keduanya 200 status sama, satu alreadyActive false/satu true, SQLITE_CONSTRAINT_UNIQUE → alreadyActive; worker dan HTTP, masing-masing ×50)' }
  - { id: 'AC-10', idSource: 'generated', text: 'R2: mutation check — removing the in-transaction check and partial unique index is caught' }
  - { id: 'AC-11', idSource: 'generated', text: 'R3: a new registration is waitlisted while the waitlist is non-empty (kelas Penuh dengan antrean, atau kuota belum penuh tetapi antrean ada)' }
  - { id: 'AC-12', idSource: 'generated', text: 'R3: waitlist is FIFO by registration time, id breaks ties' }
  - { id: 'AC-13', idSource: 'generated', text: 'Kelas Selesai (tanggal sesi terakhir <= today WIB) → 409 registration_closed "Pendaftaran kelas ini sudah ditutup", tanpa baris' }
  - { id: 'AC-14', idSource: 'generated', text: 'FR7: registration closes at 00.00 WIB on the last session date (*.tz.test.ts; sesi terakhir 10 Nov: 2026-11-09T16:59Z diterima; 2026-11-09T17:00Z dan 2026-11-10T16:30Z ditolak)' }
  - { id: 'AC-15', idSource: 'generated', text: 'seed:demo memuat kelas Penuh tanpa daftar tunggu, kelas Penuh dengan 3 Daftar tunggu, dan kelas Selesai dengan Terdaftar + Daftar tunggu (B-2b), relatif ke today dari Clock' }
---

# ATDD Checklist - Epic 1, Story 1.7: API pendaftaran berkuota dengan daftar tunggu FIFO (R1, R2, R3)

**Tanggal:** 2026-11-04
**Penulis:** Murat (TEA) untuk Rustan
**Fase TDD:** 🔴 RED (test R1–R3 sebagai `it.fails`, sisanya `it.skip`)

---

## Ringkasan Story

Sebagai peserta pelatihan, saya ingin mendaftar dengan nama dan email lalu langsung mendapat status Terdaftar atau Daftar tunggu, sehingga saya tahu posisi saya dan kelas tidak pernah melebihi kuota walaupun banyak orang mendaftar bersamaan (FR7–FR10).

**Mencakup:** FR7 (API), FR8, FR9, FR10, AD-5, AD-6, AD-10, AD-15, AD-17, AD-18, R-001, R-002, R-009, P0-001, P0-002, P1-014, P1-018.
**Status sprint:** `backlog`. Belum ada berkas story terpisah, jadi sumber AC adalah `epics.md` §Story 1.7.

---

## Acceptance Criteria → Scaffold

AC di `epics.md` tidak bernomor, jadi ID diberikan berurutan (AC-1..AC-15, `idSource: generated`). Aturan pemecahan: setiap blok Given/When/Then menjadi satu AC. Bila blok itu menamai lebih dari satu test (R2 "And mutation check", R3 dengan dua nama, FR7 dengan test `*.tz.test.ts`), setiap nama test menjadi AC tersendiri. Dengan begitu nama test wajib dari epics tetap punya leaf masing-masing. Setiap AC punya tepat satu leaf merah. Prioritas diambil dari `test-design-epic-1.md`.

| AC | Test ID (test design) | Prioritas | Level | Berkas | Penanda | Asersi inti (gagal pertama) |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 1.7-INT-010 | P2 | Integrasi + statis | `src/server/data/registrations-schema.test.ts` | `it.skip` | kolom `registrations` = 10 kolom yang disepakati |
| AC-2 | 1.7-UNIT-001 (P1-012) | P1 | Unit | `src/server/domain/registration-rules.test.ts` | `it.fails` | `classStatus(… quota 5, registered 5)` → `full` |
| AC-3 | 1.7-API-007 (bagian kelas publik) + 1.7-API-008 | P1 | API (`inject`) | `src/server/http/public-registrations.test.ts` | `it.skip` | status 200 |
| AC-4 | 1.7-API-006 + 1.7-API-007 | P1 | API (`inject`) | `src/server/http/public-registrations.test.ts` | `it.skip` | status 200 |
| AC-5 | 1.7-INT-001 (P0-001) | **P0** | Integrasi (worker) | `src/server/services/registrations.concurrency.test.ts` | `it.fails` | tepat 5 hasil `registered` |
| AC-6 | 1.7-API-001 | **P0** | API (HTTP nyata) | `src/server/services/registrations.concurrency.test.ts` | `it.fails` | 20 × HTTP 200 |
| AC-7 | 1.7-INT-001 (mutation) | **P0** | Integrasi (worker) | `src/server/services/registrations.concurrency.test.ts` | `it.fails` | mutan terdeteksi (`detectedAt` ≠ null) |
| AC-8 | 1.7-API-004 (P1-016) | P1 | API (`inject`) | `src/server/http/public-registrations.test.ts` | `it.fails` | `alreadyActive === true` |
| AC-9 | 1.7-INT-003 + 1.7-API-002 (P0-002) | **P0** | Integrasi (worker) + HTTP nyata | `src/server/services/registrations.concurrency.test.ts` | `it.fails` | satu baris aktif |
| AC-10 | 1.7-INT-003 (mutation) | **P0** | Integrasi (worker) | `src/server/services/registrations.concurrency.test.ts` | `it.fails` | mutan terdeteksi |
| AC-11 | 1.7-INT-005 (P1-013) | P1 | Integrasi | `src/server/services/registrations.test.ts` | `it.fails` | pendaftar D → `waitlisted` walau ada kursi |
| AC-12 | 1.7-INT-006 (P1-014) | P1 | Integrasi | `src/server/services/registrations.test.ts` | `it.fails` | posisi `[null, 1, 2, 3]` |
| AC-13 | 1.7-API-005 (bagian 409) | P1 | API (`inject`) | `src/server/http/public-registrations.test.ts` | `it.skip` | status 409 |
| AC-14 | 1.7-API-005 (bagian tz, P1-018) | P1 | API (`inject`), 3 zona | `src/server/http/registrations.tz.test.ts` | `it.skip` | 00.00 WIB 10 Nov → 409 |
| AC-15 | 1.7-INT-009 | P1 | Integrasi (skrip) | `scripts/scripts.test.ts` | `it.skip` | ≥ 1 kelas Penuh tanpa antrean |

**Catatan prioritas:** test design meminta scaffold untuk semua P0 1.7, 1.7-UNIT-001, 1.7-INT-005..007, 1.7-INT-009, dan 1.7-API-004..007. Semuanya tercakup, kecuali **1.7-INT-007** (P1, `SQLITE_CONSTRAINT_UNIQUE` dipaksa lewat repository). Test itu bukan AC tersendiri di epics; ia bagian AC-9. Aturan satu-leaf-per-AC membuatnya masuk cabang sekunder hijau (lihat di bawah). AC-9 HTTP tetap membuktikan pemetaan constraint → 200 pada beban nyata. AC-1 (P2) tetap punya satu leaf karena setiap AC wajib punya scaffold.

---

## Keputusan Penanda Merah: `it.fails` untuk R1–R3

Workflow ATDD meminta `test.skip()`. Namun `test/README.md` ("jangan `.skip` test R1–R7") dan `test-design-epic-1.md` §Aturan scaffold ("Jangan pakai `it.skip` untuk test R1–R7") melarangnya untuk test aturan bisnis. Di sisi lain, AGENTS.md mewajibkan suite hijau sebelum commit. Jalan tengah yang memenuhi ketiganya:

- **Leaf R1/R2/R3 (AC-2, AC-5..AC-12) memakai `it.fails`.** Test **benar-benar dijalankan** di setiap `npm test`. Vitest menghitungnya lulus selama test itu gagal (laporan: `9 expected fail`). Begitu use-case benar, `it.fails` otomatis **merah**, jadi dev tidak bisa lupa mengaktifkannya. Aktivasinya cukup mengganti `it.fails` → `it`.
- **Leaf lain (AC-1, AC-3, AC-4, AC-13, AC-14, AC-15) memakai `it.skip`**, sesuai workflow dan pola Story 1.6.

Risiko `it.fails`: selama fase merah, test bisa gagal karena alasan yang salah tanpa terlihat. Mitigasinya: bukti aktivasi di bawah, plus aturan "ganti ke `it` per tugas lalu lihat sendiri gagal → hijau".

---

## Metadata Integrasi Story

- **Story key:** `1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo`
- **Story file:** belum ada. Saat `bmad-build`/dev membuat `_bmad-output/implementation-artifacts/spec-1-7-…md`, tambahkan ini di `## Dev Notes`:
  ```
  ### ATDD Artifacts
  - Checklist: _bmad-output/test-artifacts/atdd-checklist-1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo.md
  - API tests: src/server/http/public-registrations.test.ts, src/server/http/registrations.tz.test.ts
  - Concurrency (P0): src/server/services/registrations.concurrency.test.ts (+ test/tasks/registration-tasks.ts)
  - Integration: src/server/services/registrations.test.ts, src/server/data/registrations-schema.test.ts, scripts/scripts.test.ts (AC-15)
  - Unit: src/server/domain/registration-rules.test.ts
  - E2E: tidak ada (story API; E2E pendaftaran ada di 1.8/1.9)
  ```

---

## Scaffold Merah yang Dibuat

### Konkurensi P0 (5 test, `it.fails`)

**Berkas:** `src/server/services/registrations.concurrency.test.ts`

- 🔴 `[P0] AC-5 R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered`. Memakai `runConcurrently(20, registerAtomic)` dengan DB baru per ulangan, ×50. Asersi: 5 Terdaftar, tanpa error, posisi 1–15, dan baris DB 5/15.
- 🔴 `[P0] AC-6 R1: 20 concurrent HTTP registrations all succeed without 5xx and fill the quota exactly`. Satu `startTestServer()`, kelas baru per ulangan lewat koneksi kedua, 20 `fetch` serentak, ×50.
- 🔴 `[P0] AC-7 R1: mutation check — non-atomic quota check is caught by the concurrency test`. Menjalankan `registerNonAtomic` (keputusan dibaca tanpa write lock, ditulis di `withWriteTx` lain). Lulus bila Terdaftar > 5 terjadi minimal sekali dalam 50 ulangan.
- 🔴 `[P0] AC-9 R2: concurrent duplicate registrations create one row`. Bagian worker (2 koneksi, `"Budi@Mail.com "` vs `"budi@mail.com"`, ×50) dan bagian HTTP (×50) dalam satu leaf.
- 🔴 `[P0] AC-10 R2: mutation check — removing the in-transaction check and partial unique index is caught`. Unique index pada `registrations` dibuang di DB test, lalu `registerNonAtomic` dijalankan. Lulus bila muncul baris aktif ganda; juga memastikan index memang ada lalu dibuang.

### API (4 test di `public-registrations.test.ts` + 1 tz)

- 🔴 `[P1] AC-3`: GET 200 + kunci terbatas (`title`, `sessionDates`, `status`, `today`, opsional `publicCode`), tanpa `id`/`quota`/data peserta; status `full` dan `finished`; kode tak dikenal → 404 `class_not_found`.
- 🔴 `[P1] AC-4`: POST 200 `registered` dengan `nextSessionDate` dan `registrationRef` 10 karakter. Baris DB memuat email ternormalisasi dan `created_at = TEST_NOW_ISO`. 5 kasus 400 tanpa baris baru, nama 100 karakter masih diterima, dan 1.000 ref unik dengan rasio pasangan naik 35–65% (acak, bukan counter).
- 🔴 `[P1] AC-8 R2` (`it.fails`): normalisasi serial, untuk cabang Daftar tunggu (posisi 1) dan cabang Terdaftar (tanpa posisi).
- 🔴 `[P1] AC-13`: kelas Selesai (dibuat sah lewat use-case dengan clock 5 Nov) → 409 `registration_closed` + pesan persis, tanpa baris. Sesi terakhir = hari ini juga tertutup. Kode tak dikenal → 404.
- 🔴 `[P1] AC-14` (`registrations.tz.test.ts`, 3 zona): `2026-11-09T17:00Z` dan `2026-11-10T16:30Z` → 409; `2026-11-09T16:59Z` → 200 `registered`.

### Integrasi use-case (2 test, `it.fails`)

**Berkas:** `src/server/services/registrations.test.ts`

- 🔴 `[P1] AC-11 R3`: kuota 2, A/B Terdaftar, C antre. A dibatalkan lewat SQL fixture tanpa promosi, lalu D → `waitlisted` #2. Ditambah cabang Penuh + antrean → ekor.
- 🔴 `[P1] AC-12 R3`: 4 pendaftar dengan clock beku → posisi `[null, 1, 2, 3]`, `created_at` identik, urut `id`. Baca ulang lewat `alreadyActive` mempertahankan posisi.

### Skema + statis, unit, seed

- 🔴 `[P2] AC-1` (`registrations-schema.test.ts`): kolom, tanpa DEFAULT/fungsi waktu SQL, tiga indeks, CHECK status/pembatalan/GLOB, UNIQUE parsial (baris Dibatalkan boleh ganda), FK. Juga pindai `src/` (selain `*.test.ts`): `INSERT/UPDATE registrations` hanya di `registrations-repo.ts`, tanpa `DELETE`.
- 🔴 `[P1] AC-2` (`registration-rules.test.ts`, project `unit`, `it.fails`): Penuh, Selesai menang atas Penuh, tabel keputusan 6 kasus termasuk R3 "ada kursi + antrean", dan posisi menurut id naik.
- 🔴 `[P1] AC-15` (`scripts/scripts.test.ts`): tiga bentuk kelas B-2b relatif ke 2026-11-09, tanpa kelas yang melanggar R1, dan idempoten (snapshot identik setelah jalan kedua).

---

## Fixture dan Helper Baru

| Berkas | Isi |
| --- | --- |
| `test/helpers/registrations.ts` | `RegistrationResult`, `registrationsOf(services)` (akses `services.registrations` yang belum bertipe), builder `givenClass(db, opts)` / `givenClassInFile(dbPath, opts)` yang memanggil `services.classes.createClass` (opsi `nowIso` untuk membuat kelas Selesai secara sah), `statusCounts`, `activeCount`, `oneTo(n)` |
| `test/tasks/registration-tasks.ts` | Task worker `registerAtomic` (jalur produksi) dan `registerNonAtomic` (mutan A-11 dari seam tx-step). Diletakkan di luar `*.test.ts` karena worker mengimpor ulang modulnya |

Tanpa faker (tidak ada di stack). Data unik memakai `uniqueEmail()`/`uniqueTitle()`. `@seontechnologies/playwright-utils` dan Pact tidak terpasang, jadi tidak ada `merged-fixtures.ts` dan tidak ada deviasi Playwright Utils. Story ini tidak punya spec Playwright.

---

## Asumsi Kontrak (dibuat karena AC belum menetapkannya)

Dev boleh memilih bentuk lain. Bila berbeda, sesuaikan test **saat aktivasi**, bukan perilakunya.

| # | Asumsi | Dipakai di |
| --- | --- | --- |
| A-1 | `classStatus({ sessionDates, today, quota, registeredCount })`. `src/server/domain/registration-rules.ts` mengekspor `decideRegistration({ registeredCount, quota, waitlistLength })` → `'registered' \| 'waitlisted'` dan `waitlistPosition(waitlistIds, registrationId)` → 1-based menurut id naik | AC-2 |
| A-2 | Use-case `services.registrations.register(publicCode, input: unknown)` mengembalikan `RegistrationResult` (sinkron atau async). Pemanggil lain `classStatus` (`services/classes.ts`) ikut diperbarui | AC-5, AC-9, AC-11, AC-12 |
| A-3 | **Seam mutation check** (asumsi 2 test design, dikonfirmasi di sini): `src/server/services/registrations.ts` mengekspor tx-step `planRegistration(tx, ctx, { publicCode, name, email })` (assertClassOpen → cari aktif → COUNT/antrean → keputusan, tanpa tulis) dan `applyRegistration(tx, ctx, plan)` (insert + hasil). Produksi: `withWriteTx(db, clock, (tx, ctx) => applyRegistration(tx, ctx, planRegistration(tx, ctx, input)))`. Tanpa flag mutan di kode produksi | AC-7, AC-10 |
| A-4 | Respons 200 hanya berisi kunci `status`, `waitlistPosition?`, `nextSessionDate?`, `alreadyActive`, `registrationRef`. `waitlistPosition` tidak ada untuk Terdaftar. `nextSessionDate` = sesi pertama ≥ today (kelas 16/23 Nov → `2026-11-16`) | AC-4, AC-8 |
| A-5 | Respons GET publik hanya berisi kunci `title`, `sessionDates` (terurut), `status`, `today`, dan opsional `publicCode` | AC-3 |
| A-6 | `fields` validasi memakai kunci `name` dan `email`; nama tidak di-trim sampai kosong (kasus `''`). Email tanpa `@` ditolak | AC-4 |
| A-7 | Kode tak dikenal di POST → 404 `class_not_found` (bukan 409) | AC-13 |
| A-8 | `registration_closed` (409, "Pendaftaran kelas ini sudah ditutup") belum ada di `errors.ts`, jadi ditulis literal. Saat aktivasi: daftarkan, lalu ganti dengan `getError('registration_closed')` | AC-13, AC-14 |
| A-9 | Ada tepat satu unique index pada `registrations` (index parsial). `public_ref` juga UNIQUE; bila diwujudkan sebagai index terpisah, `dropUniqueIndexesOnRegistrations` di AC-10 ikut membuangnya. Itu tidak masalah untuk mutan, karena ref tetap acak | AC-1, AC-10 |
| A-10 | `seed:demo` membuat state B-2b lewat use-case yang sama: kelas Selesai dibuat dan diisi dengan clock masa lalu, bukan dengan SQL mentah | AC-15 |

---

## Implementation Checklist (aktivasi per tugas)

Urutan disarankan: domain → migrasi/repo → use-case + tx-step → rute → konkurensi → seed. Di setiap langkah: ganti penanda (`it.fails`/`it.skip` → `it`), lihat test gagal, implementasikan, lalu lihat hijau.

### AC-2 — domain murni
- [ ] `src/server/domain/registration-rules.ts`; perluas `classStatus` dengan `quota`/`registeredCount`
- [ ] Ganti impor dinamis dengan impor statis, buang cast `classStatusWithQuota`, `it.fails` → `it`; `npx vitest run src/server/domain`

### AC-1 — migrasi + repository
- [ ] `src/server/data/migrations/003_registrations.sql`: kolom, CHECK status, CHECK `(status = 'cancelled') = (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL)`, CHECK GLOB untuk setiap `*_at` (nullable), `public_ref` UNIQUE, FK `class_id`, unique index parsial, indeks `(class_id, status, id)` dan `(email)`; tanpa DEFAULT waktu
- [ ] `src/server/data/registrations-repo.ts` (satu-satunya penulis, SQL berparameter)
- [ ] `.skip` dihapus; `npx vitest run src/server/data/registrations-schema.test.ts`

### AC-3, AC-4, AC-8, AC-11..AC-14 — use-case + rute
- [ ] Skema zod `registrationRequestSchema` (nama 1–100, format email) di `src/shared/schemas.ts`; DTO `RegistrationResult`/`PublicClassResponse` di `src/shared/dto.ts`
- [ ] `registration_closed` (409) di `errors.ts`; ganti literal di test (A-8)
- [ ] Tx-step `assertClassOpen` (`services/class-guard.ts`) sebagai baca pertama
- [ ] `services/registrations.ts`: `planRegistration` + `applyRegistration` (A-3), use-case `register` (satu `withWriteTx`; tangkap `SQLITE_CONSTRAINT_UNIQUE` di luar transaksi → baca ulang → `alreadyActive`), `getPublicClass`; daftarkan di `services/index.ts`
- [ ] `public_ref` 10 karakter base64url dari `crypto.randomBytes`
- [ ] Rute `/api/public/classes/:code` dan `/api/public/classes/:code/registrations` (handler tidak memanggil repository)
- [ ] Aktifkan AC-3, AC-4, AC-13, AC-14 (`.skip` dihapus) serta AC-8, AC-11, AC-12 (`it.fails` → `it`)

### AC-5, AC-6, AC-7, AC-9, AC-10 — konkurensi P0
- [ ] `it.fails` → `it` untuk kelima test; `npx vitest run src/server/services/registrations.concurrency.test.ts`
- [ ] Mutation check (AC-7, AC-10) hijau berarti mutan **tertangkap**. Bila AC-10 jarang mendeteksi dengan 2 worker, naikkan jumlah duplikat (mis. 4 salinan email yang sama) dan catat alasannya. Jangan menurunkan jumlah ulangan
- [ ] Catat durasi run (R-028: anggaran `npm test`)

### AC-15 — seed
- [ ] `scripts/seed-demo.ts` menambah tiga kelas B-2b, idempoten per judul
- [ ] **Perbarui test AC-9 Story 1.6** (`demo class session dates follow the Clock today exactly`): `toEqual` dua baris akan gagal karena kelas demo bertambah. Saring per judul 1.6
- [ ] `.skip` dihapus; `npx vitest run scripts/scripts.test.ts`

### Cabang sekunder untuk fase hijau / `automate` (bukan leaf merah)
- [ ] 1.7-INT-007 (P1): paksa `SQLITE_CONSTRAINT_UNIQUE`. Contoh caranya: sisipkan baris aktif lewat repository di antara `planRegistration` dan `applyRegistration`, lalu pastikan use-case mengembalikan 200 `alreadyActive`, bukan 5xx
- [ ] 1.7-INT-011 (P2): pendaftaran Dibatalkan boleh mendaftar ulang sebagai baris baru di ekor antrean
- [ ] 1.7-INT-012 (P2): log Fastify saat pendaftaran tidak memuat email/nama (pola test log privacy Story 1.4)
- [ ] AC-1: pindahkan aturan "penulis tunggal `registrations`" ke fitness test HP-3 `src/architecture.test.ts` (rekomendasi test design)
- [ ] AC-4: `Content-Type` bukan JSON → 415; body bukan objek → 400
- [ ] AC-13: `registration_closed` tidak menulis baris walau email sudah aktif di kelas itu
- [ ] AC-3: `today` dan status bergeser saat clock melewati 00.00 WIB (bisa dijadikan kasus tambahan di berkas tz)

---

## Menjalankan Test

```bash
# Semua Vitest (scaffold merah tetap hijau: 9 expected fail + 8 skip)
npm test

# Hanya test aturan R1/R2/R3
npx vitest run -t "R1"
npx vitest run -t "R2"
npx vitest run -t "R3"

# P0 konkurensi story ini
npx vitest run src/server/services/registrations.concurrency.test.ts

# Batas waktu di tiga zona
npx vitest run --project 'tz-*' src/server/http/registrations.tz.test.ts
```

---

## Bukti Eksekusi (RED)

**Typecheck:** `npm run typecheck` hijau.

**Suite penuh dengan penanda merah:** `npx vitest run` → 34 berkas lulus, 4 skip; **300 lulus, 9 expected fail, 8 skip** (317). Suite tetap hijau.

**Aktivasi sementara** (semua `it.fails`/`it.skip` story ini diganti `it`, dijalankan di project `unit`, `integration`, `tz-utc`, lalu dikembalikan). Ke-15 leaf gagal karena perilakunya belum ada, bukan karena error sintaks:

| AC | Kegagalan |
| --- | --- |
| AC-1 | `expected [] to deeply equal [ Array(10) ]` (tabel belum ada) |
| AC-2 | `expected 'open' to be 'full'` |
| AC-3 | `expected 404 to be 200` |
| AC-4 | `expected 404 to be 200` |
| AC-5 | `ulangan 1 dari 50: expected [] to have a length of 5` |
| AC-6 | `ulangan 1 dari 50: expected [404, …] to deeply equal [200, …]` |
| AC-7 | `SqliteError: no such table: registrations` |
| AC-8 | `expected undefined to be true` |
| AC-9 | `ulangan 1 dari 50: no such table: registrations` |
| AC-10 | `SqliteError: no such table: registrations` |
| AC-11 | `services.registrations belum ada (Story 1.7).` |
| AC-12 | `services.registrations belum ada (Story 1.7).` |
| AC-13 | `expected 404 to be 409` |
| AC-14 | `expected 404 to be 409` (tz-utc) |
| AC-15 | `SqliteError: no such table: registrations` |

AC-7, AC-9, AC-10, AC-11, AC-12, dan AC-15 gagal di setup (tabel/use-case belum ada) sebelum asersi inti. Ini setara dengan pola Story 1.6 yang menerima `Cannot find module` dan `no such table`. Tabel dan use-case itu sendiri dibuat oleh story ini.

**Sesi CLI browser:** tidak ada (story API, mode rekam tidak dipakai). **Artefak sementara:** tidak ada di `/tmp`. Mode sequential menulis berkas langsung tanpa JSON perantara.

---

## Risiko dan Catatan

- **R-001 / R-002 (skor 6):** gate story ini adalah AC-5, AC-6, AC-9 hijau 50/50 **dan** AC-7, AC-10 hijau (mutan tertangkap).
- **R-022 (terbuka):** spine AD-6 masih `max(session_date) < today`; test mengikuti epics (`<=`), sama seperti Story 1.6.
- **R-028:** test P0 HTTP memakai satu server dengan kelas baru per ulangan agar murah. Test worker memakai DB baru per ulangan sesuai `test/README.md`.
- AC-11 menulis `registrations` dengan SQL mentah sebagai fixture state tak sah, satu-satunya pengecualian, dan hanya di test. Pemindaian AC-1 mengecualikan `*.test.ts`.
- `scripts/scripts.test.ts` diubah dengan menambah satu `it.skip`. Test lain di berkas itu tidak diubah, tetapi test 1.6 "dates follow the Clock today exactly" perlu disesuaikan saat seed B-2b dibuat (lihat checklist AC-15).

---

## Langkah Berikut

1. Build Story 1.7 (`bmad-build`/`bmad-agent-dev`) dan aktifkan scaffold per tugas sesuai urutan di atas.
2. Setelah hijau: `bmad-testarch-automate` untuk cabang sekunder (1.7-INT-007, -011, -012) dan P2.
3. Lanjut `/bmad-testarch-atdd` untuk Story 1.8 (E2E halaman pendaftaran, butuh seed B-2b dari AC-15).

---

## Referensi Knowledge Base

`data-factories`, `component-tdd`, `test-quality`, `test-healing-patterns`, `selector-resilience`, `timing-debugging`, `playwright-cli`, `fixture-architecture`, `network-first`, `test-levels-framework`, `test-priorities-matrix`, `ci-burn-in`. Fragmen Playwright Utils dan Pact tidak dimuat karena paketnya tidak terpasang dan tidak ada artefak kontrak.

---

**Dibuat oleh:** BMad TEA Agent (Murat) · **Workflow:** `bmad-testarch-atdd`
