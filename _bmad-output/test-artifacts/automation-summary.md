---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-identify-targets', 'step-03-generate-tests', 'step-03c-aggregate', 'step-04-validate-and-summarize']
lastStep: 'step-04-validate-and-summarize'
lastSaved: '2026-11-04'
story: '1.7'
previousSummary: _bmad-output/test-artifacts/automation-summary-1-6.md
inputDocuments:
  - _bmad-output/test-artifacts/test-design-epic-1.md
  - _bmad-output/test-artifacts/atdd-checklist-1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo.md
  - _bmad-output/implementation-artifacts/spec-1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo.md
  - _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md (AD-17)
  - playwright.config.ts
  - vitest.config.ts
  - test/README.md
  - resources/knowledge/{test-levels-framework,test-priorities-matrix,data-factories,selective-testing,ci-burn-in,test-quality,fixture-architecture,network-first,playwright-cli}.md
---

# Ringkasan Otomasi Test: Story 1.7 (API pendaftaran berkuota dengan daftar tunggu FIFO, R1–R3)

**Tanggal:** 2026-11-04 · **Workflow:** `bmad-testarch-automate` (Create) · **Penulis:** Murat (TEA) untuk Rustan

Ringkasan run sebelumnya (Story 1.6) dipindahkan ke `automation-summary-1-6.md` supaya tidak tertimpa.

## 1. Preflight dan konteks

| Hal | Nilai |
| --- | --- |
| Stack terdeteksi | `fullstack`: React + Vite (`vite.config.ts`, `playwright.config.ts`) dan Fastify + better-sqlite3 (Vitest `integration`) |
| Framework | Vitest 5 (project `unit`, `integration`, `tz-*`) dan Playwright + `@axe-core/playwright` (project `admin-desktop`, `participant-mobile`) |
| Mode | BMad-Integrated: spec story 1.7 (`done`), checklist ATDD 1.7 (bagian "Cabang sekunder"), `test-design-epic-1.md` (ID 1.7-*) |
| Flag TEA | `tea_use_playwright_utils: true`, tetapi `@seontechnologies/playwright-utils` tidak terpasang, jadi gate tidak terbuka. `tea_use_pactjs_utils: true`, tetapi tidak ada artefak Pact atau kebutuhan kontrak. `tea_browser_automation: auto` |
| Mode eksekusi | `auto` diresolusi menjadi `sequential`, karena subagen hanya dipakai atas permintaan pengguna |
| Fragmen dimuat | core (6) + `fixture-architecture`, `network-first`, `playwright-cli` (sama dengan run 1.6) |
| Baseline | `npm test` 38 berkas, 318/318 lulus sebelum perubahan |

Eksplorasi browser tidak dilakukan. Story 1.7 hanya API; halaman pendaftaran baru ada di Story 1.8.

## 2. Target dan rencana cakupan

### Yang sudah ada dan tidak diduplikasi

| ID test-design | Prioritas | Lokasi yang sudah ada |
| --- | --- | --- |
| 1.7-INT-001 R1 worker ×50 + mutation check | P0 | `src/server/services/registrations.concurrency.test.ts` (AC-5, AC-7) |
| 1.7-API-001 R1 HTTP ×50 | P0 | idem (AC-6) |
| 1.7-INT-003 / 1.7-API-002 R2 serentak + mutation check | P0 | idem (AC-9, AC-10) |
| 1.7-UNIT-001 keputusan + posisi | P1 | `src/server/domain/registration-rules.test.ts` (AC-2) |
| 1.7-INT-005 / 1.7-INT-006 R3 ekor antrean, FIFO menurut `id` | P1 | `src/server/services/registrations.test.ts` (AC-11, AC-12) |
| 1.7-API-004 R2 serial | P1 | `src/server/http/public-registrations.test.ts` (AC-8) |
| 1.7-API-005 409 + batas 00.00 WIB di 3 zona | P1 | `public-registrations.test.ts` (AC-13), `registrations.tz.test.ts` (AC-14) |
| 1.7-API-006 / 1.7-API-007 / 1.7-API-008 validasi, DTO publik, 1.000 ref, 404 | P1/P2 | `public-registrations.test.ts` (AC-3, AC-4) |
| 1.7-INT-009 seed B-2b | P1 | `scripts/scripts.test.ts` (AC-15) |
| 1.7-INT-010 kolom/indeks/CHECK utama | P2 | `src/server/data/registrations-schema.test.ts` (AC-1) |
| Email > 254 karakter → 400 | P2 | `src/shared/schemas.test.ts` (patch review story 1.7) |
| 415 untuk tulis non-JSON (generik) | P2 | `src/server/http/auth.test.ts` (hanya rute login/admin; rute publik belum) |

### Celah yang diotomasi

Sumber: daftar "Cabang sekunder" di checklist ATDD 1.7, ID test-design 1.7 yang belum punya test, dan perilaku baru story 1.7 yang belum terjaga.

| # | Target | Level | Prioritas | Alasan level |
| --- | --- | --- | --- | --- |
| 1 | **1.7-INT-007** `SQLITE_CONSTRAINT_UNIQUE` → baca ulang → 200 `alreadyActive` (Terdaftar dan Daftar tunggu), tanpa baris tambahan | Integrasi (services) | P1 | AD-5. Jalur balapan tidak bisa dipicu secara deterministik dari HTTP. Dipaksa lewat cek aktif "basi" satu kali |
| 2 | **1.7-INT-011** daftar ulang setelah Dibatalkan = baris baru di ekor antrean, ref baru | Integrasi (services) | P2 | State Dibatalkan hanya bisa dibuat lewat fixture SQL (pembatalan baru ada di Epik 2) |
| 3 | R2 per kelas: email sama aktif di dua kelas, hitungan per kelas | Integrasi (services) | P2 | Unique index `(class_id, email)`. Belum ada test lintas kelas |
| 4 | AD-18: kelas Selesai menolak `registration_closed` walau email sudah aktif, tanpa mengubah baris | Integrasi (services) | P2 | Cabang ATDD AC-13. Membuktikan `assertClassOpen` mendahului cek aktif |
| 5 | Tabrakan `public_ref` dibuat ulang; 5 tabrakan → gagal tanpa baris | Integrasi (services) | P3 | Jalur langka, hanya bisa dipaksa lewat `randomBytes` terkendali (pola 1.6 `classes.public-code.test.ts`) |
| 6 | Rute publik: `text/plain`, form-urlencoded, tanpa Content-Type → 415, tanpa baris | API (`inject`) | P2 | Cabang ATDD AC-4. Hook `preParsing` belum diuji di prefix `/api/public` |
| 7 | **1.7-INT-012** NFR8: log level `trace` di 6 jalur (Terdaftar, Daftar tunggu, sudah aktif, 400, 409, GET) tanpa email/nama | API (`inject` + stream log) | P2 | Pola test privasi log Story 1.4 |
| 8 | GET publik: `today` dan status bergeser tepat 00.00 WIB, di 3 zona proses | API (`*.tz.test.ts`) | P2 | Cabang ATDD AC-3. Klien memakai `today` dari respons |
| 9 | GET admin `full` saat Terdaftar = kuota, tetap `full` saat ada antrean | API (`inject`) | P2 | Perubahan story 1.7 pada `getClass`. Sebelumnya hanya `open`/`finished` yang diuji |
| 10 | `registrationRequestSchema`: trim nama/email, nama spasi saja, email berspasi di tengah, nama bukan string, body array/string/null → `fields` nama + email | Unit | P2 | Logika zod murni. Kasus API (`''`, 101, hilang) tidak diulang |
| 11 | `nextSessionDate`: hari ini termasuk, urutan masukan, tanggal lampau dilewati, semua lampau → `undefined` | Unit | P2 | Fungsi domain murni. Batas `>=` (asumsi ATDD A-4) |
| 12 | Skema 003: nama 0/101, email 2/255, `public_ref` 9 karakter / di luar base64url, `cancelled_by` tak dikenal, Dibatalkan tanpa `cancelled_by`, `cancelled_at` bukan ISO-Z; nilai batas sah | Integrasi (data) | P2 | Jaring lapis DB di bawah zod, hanya terlihat lewat SQL langsung |
| 13 | **1.7-INT-010** bagian statis: aturan `registrations-single-writer` dipindahkan ke fitness test HP-3 dengan fixture negatif/positif | Unit (statis) | P2 | Rekomendasi test design. Pemindaian di AC-1 dihapus agar tidak ganda |

Cakupan: **selektif**. Hanya celah yang tercatat yang diisi. Tidak ada E2E baru karena story 1.7 tidak punya UI. **1.7-EXP-001** (matikan server di tengah ledakan pendaftaran) tetap manual, P3.

## 3. Berkas yang dibuat/diubah

| Berkas | Status | Test baru |
| --- | --- | --- |
| `src/server/services/registrations.recovery.test.ts` | baru | 2 (#1 P1, #5 P3) |
| `src/server/services/registrations.test.ts` | `describe` baru "secondary branches" | 3 (#2–#4) |
| `src/server/http/public-registrations.test.ts` | `describe` baru "secondary branches" | 4 (#6 ×3, #7) |
| `src/server/http/registrations.tz.test.ts` | ditambah satu `it` | 1 × 3 zona (#8) |
| `src/server/http/admin-classes.test.ts` | ditambah satu `it` | 1 (#9) |
| `src/shared/schemas.test.ts` | ditambah | 4 (#10) |
| `src/server/domain/class-status.test.ts` | `describe` baru `nextSessionDate` | 4 (#11) |
| `src/server/data/registrations-schema.test.ts` | ditambah; pemindaian statis AC-1 dihapus (pindah ke HP-3), judul AC-1 disesuaikan | 10 (#12) |
| `src/architecture.test.ts` | aturan `registrations-single-writer` + fixture | 6 (#13) |
| `test/README.md` | tabel Story 1.7 diperbarui | — |
| `_bmad-output/test-artifacts/automation-summary-1-6.md` | ringkasan 1.6 dipindahkan (`git mv`) | — |

Total baru: **35 test** (37 eksekusi Vitest karena satu test tz berjalan di 3 zona). Tidak ada fixture, helper, atau dependensi baru. Semua memakai `createTestDb`, `givenClass`, `statusCounts`, `uniqueEmail`, `fixedClock` yang sudah ada. Kode produksi tidak diubah.

## 4. Validasi

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm test` | 39 berkas, **355/355 lulus** (sebelumnya 318) |
| `npm run test:e2e` | **56/56 lulus** (admin-desktop + participant-mobile; regresi, tanpa spec baru) |

**Mutation check.** Setiap cabang produksi dirusak sementara lalu dipulihkan dengan `git checkout`. Setelah itu tidak ada berkas produksi yang berubah.

| Mutasi | Test yang gagal |
| --- | --- |
| `catch` `isUniqueViolation` → retry dihapus | 1.7-INT-007 (`SqliteError` bocor) |
| Cek aktif dijalankan sebelum `assertClassOpen` | AD-18 kelas Selesai + email aktif (memberi 200 `alreadyActive`, bukan 409) |
| Loop `publicRefExists` dimatikan | tabrakan `public_ref` |
| `findActiveRegistration` tanpa filter `class_id` | R2 email sama di kelas berbeda |
| `UPDATE registrations` ditaruh di `services/class-guard.ts` | HP-3 `repository source files satisfy every rule` |
| `nextSessionDate` memakai `>` | `nextSessionDate` "today itself" |
| `getClass` admin dengan `registeredCount = 0` | GET admin `full` |
| `request.log.info({ body })` di rute pendaftaran | 1.7-INT-012 privasi log |

Checklist: framework siap ✓ · pemetaan cakupan tanpa duplikasi (pemindaian AC-1 dipindah, bukan disalin) ✓ · tanpa jeda tetap ✓ · nama test menyebut ID aturan (`R2:`, `AD-17:`, `FR7:`, `NFR8:`) ✓ · data ber-`uniqueEmail`/`uniqueTitle`, satu DB per berkas ✓ · DB nyata, tanpa mock DB (seam `vi.mock` hanya pada fungsi baca dan `randomBytes`) ✓ · tanpa sesi CLI browser ✓ · artefak di `_bmad-output/test-artifacts/` ✓.

## 5. Temuan, asumsi, dan risiko

- **F-1 (temuan, P3): CHECK pembatalan AD-17 meloloskan setengah-state pada baris aktif.** `CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))` menerima baris `registered` yang punya `cancelled_by = 'admin'` tetapi `cancelled_at` NULL, atau sebaliknya. Migrasi 003 mengikuti rumusan spine AD-17 kata per kata, jadi ini celah di spine, bukan bug implementasi. Risiko sekarang rendah karena hanya `registrations-repo.ts` yang menulis dan belum ada jalur pembatalan. Saya tidak menulis test yang mengunci perilaku longgar itu, dan migrasi tidak diubah (perubahan skema/arsitektur di luar wewenang automate). **Usulan:** sebelum Story pembatalan Epik 2, putuskan lewat `bmad-architecture` apakah perlu migrasi baru `004_…` dengan tambahan `CHECK ((cancelled_at IS NULL) = (cancelled_by IS NULL))`. Bila ya, tambahkan kasus "cancelled_by on an active row" ke `registrations-schema.test.ts`.
- **A-1:** 1.7-INT-007 memakai `vi.mock` parsial pada `registrations-repo.js`. Hanya `findActiveRegistration` yang dibuat basi satu kali per test; penghitung harus kembali ke 0, jadi jalurnya terbukti dilewati. DB, unique index, dan transaksi tetap asli. Ini lebih dekat ke balapan nyata daripada menyisipkan baris di antara `planRegistration`/`applyRegistration` (saran checklist ATDD), karena pemetaan constraint ada di `register`, bukan di tx-step.
- **A-2:** Fixture SQL `UPDATE registrations … 'cancelled'` di `registrations.test.ts` (#2) mengikuti pengecualian AC-11. Aturan HP-3 baru sengaja mengecualikan `*.test.ts` dan tetap memindai helper di `test/`.
- **A-3:** Test 415 rute publik tidak menduplikasi `auth.test.ts`. Yang diuji adalah prefix `/api/public` dan "tanpa baris", bukan hook-nya secara umum.
- **A-4:** Durasi `npm test` naik sekitar 1 detik (dari ±18–19 s menjadi ±19–22 s). Penyumbang terbesar tetap `registrations.concurrency.test.ts` (R-028, tidak berubah).
- **Risiko terbuka (tidak berubah):** R-022 (spine AD-6/AD-18 belum diperbarui ke `<=`) tetap terbuka di `deferred-work.md`.

## 6. Langkah berikut

1. `/bmad-testarch-test-review` untuk `src/server/http/public-registrations.test.ts` (261 baris) dan `registrations.recovery.test.ts` (pola `vi.mock` parsial yang baru).
2. Putuskan F-1 lewat `bmad-architecture` sebelum Epik 2 (pembatalan).
3. `/bmad-testarch-atdd` untuk Story 1.8 (E2E halaman pendaftaran memakai seed B-2b).
4. `/bmad-testarch-trace` di akhir Epik 1. Cabang sekunder checklist ATDD 1.7 sudah tertutup semua oleh run ini.

## Playwright Utils deviations

None. Paketnya tidak terpasang, jadi mandat tidak berlaku. Run ini tidak membuat atau mengubah spec Playwright.
