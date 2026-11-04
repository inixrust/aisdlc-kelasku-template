---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-identify-targets', 'step-03-generate-tests', 'step-03c-aggregate', 'step-04-validate-and-summarize']
lastStep: 'step-04-validate-and-summarize'
lastSaved: '2026-11-04'
story: '1.6'
inputDocuments:
  - _bmad-output/test-artifacts/test-design-epic-1.md
  - _bmad-output/test-artifacts/atdd-checklist-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md
  - _bmad-output/implementation-artifacts/spec-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md
  - _bmad-output/implementation-artifacts/deferred-work.md
  - playwright.config.ts
  - vitest.config.ts
  - test/README.md
  - resources/knowledge/{test-levels-framework,test-priorities-matrix,data-factories,selective-testing,ci-burn-in,test-quality,fixture-architecture,network-first,playwright-cli}.md
---

# Ringkasan Otomasi Test: Story 1.6 (Membuat kelas dan membagikan tautan pendaftaran)

**Tanggal:** 2026-11-04 · **Workflow:** `bmad-testarch-automate` (Create) · **Penulis:** Murat (TEA) untuk Rustan

## 1. Preflight dan konteks

| Hal | Nilai |
| --- | --- |
| Stack terdeteksi | `fullstack`: React + Vite (`vite.config.ts`, `playwright.config.ts`) dan Fastify + better-sqlite3 (Vitest `integration`) |
| Framework | Vitest 5 (project `unit`, `integration`, `tz-*`) dan Playwright 1.64 + `@axe-core/playwright` (project `admin-desktop`, `participant-mobile`) |
| Mode | BMad-Integrated: spec story 1.6 (`done`), checklist ATDD 1.6, `test-design-epic-1.md`, `deferred-work.md` |
| Flag TEA | `tea_use_playwright_utils: true`, tetapi `@seontechnologies/playwright-utils` tidak terpasang (A-6), jadi gate tidak terbuka dan dipakai pola tradisional (`fixture-architecture`, `network-first`). `tea_use_pactjs_utils: true`, tetapi tidak ada artefak Pact atau kebutuhan kontrak, jadi tidak relevan. `tea_browser_automation: auto` |
| Mode eksekusi | `auto` diresolusi menjadi `sequential`, karena subagen hanya dipakai atas permintaan pengguna |
| Fragmen dimuat | core (6) + `fixture-architecture`, `network-first`, `playwright-cli` |

## 2. Target dan rencana cakupan

### Yang sudah ada dan tidak diduplikasi

Test ATDD dan test hasil review sudah mencakup ID test-design 1.6 berikut. Semuanya tidak ditulis ulang:

| ID test-design | Prioritas | Lokasi yang sudah ada |
| --- | --- | --- |
| 1.6-UNIT-001 `validateSessionDates` | P1 | `src/server/domain/session-dates.test.ts` |
| 1.6-UNIT-002 `classStatus` `<=` | P1 | `src/server/domain/class-status.test.ts` |
| 1.6-API-001 / 1.6-API-002 POST 201/400 | P1 | `src/server/http/admin-classes.test.ts` |
| 1.6-API-003 GET 404 `class_not_found` | P2 | `src/server/http/admin-classes.test.ts` |
| 1.6-E2E-001 UJ-1 langkah 1–4 + axe | P1 | `e2e/admin-class-create.spec.ts` (AC-5, AC-6) |
| 1.6-E2E-002 Salin tautan (izin diberikan) | P2 | `e2e/admin-class-create.spec.ts` (AC-7) |
| 1.6-UNIT-003 Badge Daftar tunggu = `warning` | P3 | `src/client/components/Badge.test.ts` |
| Halaman `/admin/kelas/987654`, status `finished` dari GET, tanggal kalender tidak sah, alfabet `publicCode` (20 sampel), seed demo relatif Clock | P2 | test review vgap #14–#19 |

### Celah yang diotomasi (sumber: cabang sekunder ATDD, `deferred-work.md`, sisa 1.6-E2E-002)

| # | Target | Level | Prioritas | Alasan level |
| --- | --- | --- | --- | --- |
| 1 | Skema 002: CHECK kuota (0, negatif, pecahan, teks), judul 0/121, `public_code` panjang/karakter, `created_at`/`updated_at` bukan ISO-Z, tanpa default waktu SQL | Integrasi (data) | P2 | Jaring lapis DB di bawah zod. Hanya terlihat lewat SQL langsung |
| 2 | UNIQUE `public_code`, UNIQUE `(class_id, session_date)`, format `session_date`, FK sesi yatim | Integrasi (data) | P2 | Sama |
| 3 | `createClass` atomik: gagal di sesi kedua → tanpa baris kelas/sesi, koneksi tetap sehat | Integrasi (services) | P2 | AD-3. Tidak teramati dari HTTP |
| 4 | 1.000 `generatePublicCode` unik dan tanpa digit | Integrasi (services) | P2 | Test design AC-3 "1.000 publicCode unik". Test API hanya memakai 20 sampel alfabet |
| 5 | Tabrakan `public_code` dibuat ulang; 5 tabrakan → gagal tanpa baris | Integrasi (services) | P3 | Jalur langka, hanya bisa dipaksa lewat `randomBytes` terkendali |
| 6 | Clipboard ditolak → URL terpilih + "Tautan belum tersalin…" via live region + axe | E2E | P2 | Sisa 1.6-E2E-002 (deferred #20). Perilaku browser murni |
| 7 | Hapus baris tanggal membuang error per baris dan ringkasan yang sudah basi | E2E | P2 | Regresi patch review #3. Interaksi DOM murni |
| 8 | Urutan tanggal di DOM mengikuti server; toast "Kelas tersimpan" tidak muncul lagi setelah muat ulang; axe tanpa toast | E2E | P3 | Deferred #21 + cabang ATDD AC-6/AC-9 |

Cakupan: **selektif**. Hanya celah yang tercatat yang diisi. Validasi judul/kuota tidak diulang di E2E (panduan test-design §Automate butir 5).

## 3. Berkas yang dibuat/diubah

| Berkas | Status | Test |
| --- | --- | --- |
| `src/server/data/classes-schema.test.ts` | baru | 15 (P2) |
| `src/server/services/classes.test.ts` | baru | 2 (P2) |
| `src/server/services/classes.public-code.test.ts` | baru | 2 (P3) |
| `e2e/admin-class-create.spec.ts` | ditambah `describe` "cabang sekunder" | 3 × 2 project (2 P2, 1 P3) |
| `test/README.md` | tabel Story 1.6 diperbarui | — |

Total baru: **19 test Vitest + 3 test E2E** (6 eksekusi di dua project). Tidak ada fixture, helper, atau dependensi baru. Semua memakai `createTestDb`, `uniqueTitle`, fixture `adminLogin`/`uid`/`expectNoA11yViolations` yang sudah ada.

## 4. Validasi

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm test` | 30 berkas, **300/300 lulus** (termasuk fitness test arsitektur) |
| `npm run test:e2e` | **56/56 lulus** (admin-desktop + participant-mobile) |

**Mutation check (test benar-benar menjaga perilaku):** cabang produksi dirusak sementara lalu dipulihkan (`git status` bersih):

| Mutasi | Test yang gagal |
| --- | --- |
| Loop retry `publicCodeExists` dimatikan | kedua test `classes.public-code.test.ts` (UNIQUE bocor sebagai `SqliteError`) |
| `selectAllChildren` di `CopyLinkButton` dihapus | E2E clipboard ditolak |
| Pembersihan `fields`/`summary` di `removeRow` dihapus | E2E Hapus baris |
| `navigate(..., { state: null })` di `ClassPage` dimatikan | E2E toast setelah muat ulang (**setelah perbaikan**, lihat di bawah) |

Temuan dari mutation check: versi pertama test toast memakai `await expect(...).toHaveCount(0)`. Assertion itu lulus palsu karena terus mencoba ulang sampai toast hilang sendiri setelah 5 detik. Sekarang diganti dengan hitungan sekali-ambil setelah `<h1>` tampil. Toast dipasang saat mount, sebelum data kelas termuat, jadi urutan ini deterministik.

Checklist: framework siap ✓ · pemetaan cakupan tanpa duplikasi ✓ · tanpa jeda tetap/`waitForTimeout` ✓ · selector `getByRole`/`getByLabel` teks Indonesia ✓ · data ber-`uid`, kelas seed hanya dibaca ✓ · DB nyata, tanpa mock DB ✓ · tanpa sesi CLI browser yang tertinggal ✓ · artefak di `_bmad-output/test-artifacts/` ✓.

## 5. Asumsi dan risiko

- **A-1:** Test skema dan test atomisitas sengaja memakai SQL mentah lewat `testDb.db` (`INSERT` langsung dan `CREATE TEMP TRIGGER`). Ini menyimpang dari aturan README "builder memanggil use-case", dan dibenarkan karena yang diuji adalah skema/transaksi itu sendiri. Tidak ada impor `better-sqlite3` dan tidak ada `CREATE TABLE`. Trigger bersifat `TEMP` per koneksi dan di-drop di `finally`.
- **A-2:** Kuota teks `'20'` tidak diuji di lapis DB karena afinitas `INTEGER` SQLite mengubahnya menjadi 20 sebelum CHECK. Yang diuji adalah teks non-numerik. Penolakan `'20'` tetap dijaga zod (test API).
- **A-3:** `vi.mock('node:crypto')` hanya berlaku di `classes.public-code.test.ts`. Byte asli dipakai bila antrean kosong.
- **Belum diotomasi:** badge "Selesai" di halaman kelas (cabang ATDD AC-6). Kelas Selesai tidak bisa dibuat lewat POST di bawah clock e2e beku, dan e2e tidak boleh menulis DB langsung. Status `finished` sudah dijaga di API (`admin-classes.test.ts`) dan labelnya di `Badge.test.ts`. Usulan: tambah kelas demo "Selesai" di `seed:demo` (keputusan story, bukan TEA), atau tutup lewat Story 1.9 (tabel kelas).
- **Risiko terbuka (tidak berubah):** R-022 (spine AD-6/AD-19 belum diperbarui) tetap terbuka di `deferred-work.md`.

## 6. Langkah berikut

1. `/bmad-testarch-test-review` untuk `e2e/admin-class-create.spec.ts` (sekarang ±330 baris, masih di bawah batas H5).
2. `/bmad-testarch-atdd` untuk Story 1.7 (P0 R1/R2 + mutation check).
3. `/bmad-testarch-trace` di akhir Epik 1.
4. Entri `deferred-work.md` untuk cabang sekunder 1.6, clipboard ditolak, dan toast setelah muat ulang sudah tertutup oleh run ini dan bisa ditandai selesai saat retrospektif.

## Playwright Utils deviations

None. Paketnya tidak terpasang, jadi mandat tidak berlaku (A-6). Test baru memakai Playwright vanilla dan `e2e/support/fixtures.ts`, sesuai konvensi repo.
