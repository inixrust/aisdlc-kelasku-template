---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-11-04'
workflowType: 'testarch-atdd'
storyId: '1.6'
storyKey: '1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran'
storyFile: '_bmad-output/planning-artifacts/epics.md#story-16-membuat-kelas-dan-membagikan-tautan-pendaftaran'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md'
detectedStack: 'fullstack'
generationMode: 'ai-generation'
executionMode: 'sequential'
generatedTestFiles:
  - src/server/http/admin-classes.test.ts
  - scripts/scripts.test.ts
  - e2e/admin-class-create.spec.ts
  - src/server/domain/session-dates.test.ts
  - src/server/domain/class-status.test.ts
  - src/client/components/Badge.test.ts
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/test-artifacts/test-design-epic-1.md
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/EXPERIENCE.md
  - _bmad/tea/config.yaml
  - playwright.config.ts
  - vitest.config.ts
  - e2e/support/fixtures.ts
  - test/helpers/test-db.ts
  - knowledge: data-factories, component-tdd, test-quality, test-healing-patterns, selector-resilience, timing-debugging, playwright-cli, fixture-architecture, network-first, test-levels-framework, test-priorities-matrix, ci-burn-in
acceptanceCriteria:
  - { id: 'AC-1', idSource: 'generated', text: 'Migrasi classes + class_sessions; validateSessionDates(dates, today) menolak daftar kosong, tanggal ganda (pesan menyebut tanggal, kunci sessionDates.<index>), dan daftar tanpa tanggal > today; batas WIB [today] ditolak, [today, today+1] dan [today-7, today+1] diterima' }
  - { id: 'AC-2', idSource: 'generated', text: 'classStatus({ sessionDates, today }): Selesai bila max(session_date) <= today, selain itu Dibuka' }
  - { id: 'AC-3', idSource: 'generated', text: 'POST /api/admin/classes valid → satu withWriteTx simpan kelas + sesi, public_code acak, 201 DTO (id, publicCode, tanggal terurut, kuota, today); judul trim 1–120, kuota bulat ≥ 1, pelanggaran → 400 validation_error + fields' }
  - { id: 'AC-4', idSource: 'generated', text: 'Badge: ikon aria-hidden + teks Glosarium untuk semua varian, tidak interaktif, Daftar tunggu warning bukan danger' }
  - { id: 'AC-5', idSource: 'generated', text: '/admin/kelas/baru (tombol Buat kelas): Tambah tanggal/Hapus, validasi saat submit, error server di dekat kolom (termasuk baris tanggal ganda) dan ringkasan, nilai tetap, tombol Menyimpan… nonaktif selama request' }
  - { id: 'AC-6', idSource: 'generated', text: 'Setelah simpan → /admin/kelas/{id} + toast Kelas tersimpan (aria-live polite, 5 detik, tanpa curi fokus); kepala: h1 judul, badge Dibuka/Selesai, kuota, tanggal "Senin, 9 Nov 2026" + penanda Hari ini, tautan {origin}/daftar/{publicCode} sebagai teks' }
  - { id: 'AC-7', idSource: 'generated', text: 'Salin tautan: URL lengkap ke clipboard, label Tautan disalin 3 detik via aria-live polite; clipboard ditolak → URL tetap tersedia sebagai teks' }
  - { id: 'AC-8', idSource: 'generated', text: 'GET /api/admin/classes/:id id tak dikenal → 404 class_not_found + pesan Indonesia di halaman; id internal tidak pernah di tautan pendaftaran (P1-011)' }
  - { id: 'AC-9', idSource: 'generated', text: 'seed:demo menambah kelas contoh relatif ke today dari Clock; e2e UJ-1 langkah 1–4 lulus dengan axe tanpa pelanggaran' }
---

# ATDD Checklist - Epic 1, Story 1.6: Membuat kelas dan membagikan tautan pendaftaran

**Tanggal:** 2026-11-04
**Penulis:** Murat (TEA) untuk Rustan
**Fase TDD:** 🔴 RED (semua scaffold `skip`)

---

## Ringkasan Story

Sebagai admin (Rina), saya ingin membuat kelas dengan judul, tanggal sesi, dan kuota, lalu menyalin tautan pendaftarannya, sehingga saya bisa membuka kelas untuk pendaftaran dan membagikannya ke grup WhatsApp (FR2, FR6, UJ-1).

**Mencakup:** FR2, FR6, AD-3, AD-10, AD-19, UX-DR4, UX-DR7, UX-DR8, UX-DR12, P1-003, P1-004, P1-011.
**Status sprint:** `backlog` (belum ada berkas story terpisah; sumber AC adalah `epics.md` §Story 1.6).

---

## Acceptance Criteria → Scaffold

AC di `epics.md` tidak bernomor, jadi ID diberikan berurutan (AC-1..AC-9, `idSource: generated`). Setiap AC punya tepat satu leaf merah. Prioritas dari `test-design-epic-1.md`.

| AC | Test ID (test design) | Prioritas | Level | Berkas | Asersi inti (gagal pertama) |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 1.6-UNIT-001 | P1 | Unit | `src/server/domain/session-dates.test.ts` | `[today]` saja ditolak dengan kunci `sessionDates` |
| AC-2 | 1.6-UNIT-002 | P1 | Unit | `src/server/domain/class-status.test.ts` | sesi terakhir = hari ini → `finished` |
| AC-3 | 1.6-API-001 (+ 1.6-API-002 sebagai asersi sekunder) | P1 | API (`inject`) | `src/server/http/admin-classes.test.ts` | status 201 |
| AC-4 | 1.6-UNIT-003 | P3 | Unit (render statis) | `src/client/components/Badge.test.ts` | markup Daftar tunggu tidak memuat `danger` |
| AC-5 | 1.6-E2E-001 (bagian form/error) | P1 | E2E | `e2e/admin-class-create.spec.ts` | baris tanggal ke-2 punya deskripsi "Tanggal 16 Nov 2026 sudah ada di kelas ini" |
| AC-6 | 1.6-E2E-001 (bagian simpan/kepala) | P1 | E2E | `e2e/admin-class-create.spec.ts` | URL `/admin/kelas/{id}` + toast "Kelas tersimpan" |
| AC-7 | 1.6-E2E-002 | P2 | E2E | `e2e/admin-class-create.spec.ts` | isi clipboard = `{origin}/daftar/{publicCode}` |
| AC-8 | 1.6-API-003 | P2 | API (`inject`) | `src/server/http/admin-classes.test.ts` | `error.code === 'class_not_found'` |
| AC-9 | 1.6-E2E-001 (bagian seed) | P1 | Integrasi (skrip) | `scripts/scripts.test.ts` | `COUNT(*) FROM classes >= 1` setelah `seed:demo` |

**Catatan prioritas:** test design meminta scaffold P0/P1 saja; workflow ATDD mewajibkan satu leaf per AC. Jadi AC-4 (P3), AC-7 (P2), dan AC-8 (P2) tetap punya satu leaf merah masing-masing, tanpa cabang tambahan. Perluasan P2/P3 tetap untuk `bmad-testarch-automate`. Story 1.6 tidak punya test P0 (P0 Epik 1 ada di 1.7, 1.9, 1.11).

---

## Metadata Integrasi Story

- **Story key:** `1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran`
- **Story file:** belum ada. Saat `bmad-build`/dev membuat `_bmad-output/implementation-artifacts/spec-1-6-…md`, tambahkan di `## Dev Notes`:
  ```
  ### ATDD Artifacts
  - Checklist: _bmad-output/test-artifacts/atdd-checklist-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md
  - API tests: src/server/http/admin-classes.test.ts, scripts/scripts.test.ts (AC-9)
  - E2E tests: e2e/admin-class-create.spec.ts
  - Unit tests: src/server/domain/session-dates.test.ts, src/server/domain/class-status.test.ts, src/client/components/Badge.test.ts
  ```

---

## Scaffold Merah yang Dibuat

### E2E (3 test × 2 project Playwright = 6 entri)

**Berkas:** `e2e/admin-class-create.spec.ts`

- 🔴 `[P1] AC-5` error server di baris tanggal ganda + ringkasan, nilai tetap, "Menyimpan…" nonaktif; axe di formulir
- 🔴 `[P1] AC-6` simpan → halaman kelas, toast, `<title>`, `<h1>`, badge Dibuka, kuota, 3 tanggal berformat, "Hari ini", tautan; axe; toast hilang ≤ 8 detik
- 🔴 `[P2] AC-7` Salin tautan → clipboard, label "Tautan disalin", live region, URL sebagai teks; label kembali ≤ 6 detik

Setiap journey dibungkus satu `expect((async () => …)()).resolves.toBeUndefined()` sesuai aturan ATDD. Tag Playwright lewat `{ tag: '@P1' | '@P2' }`.

### API/Integrasi (3 test)

**Berkas:** `src/server/http/admin-classes.test.ts`

- 🔴 `[P1] AC-3` 201 + DTO + baris `classes`/`class_sessions` dengan `created_at = TEST_NOW_ISO`; lalu 8 kasus 400 (judul kosong/121 karakter, kuota 0/2.5/"20", tanpa tanggal, hanya hari ini, tanggal ganda) tanpa baris baru; judul 120 karakter diterima
- 🔴 `[P2] AC-8` 404 `class_not_found`; lalu GET kelas yang ada → 200 dan `publicCode` tidak memuat id

**Berkas:** `scripts/scripts.test.ts` (ditambah di `describe('seed:demo')`)

- 🔴 `[P1] AC-9` `seed:demo` membuat ≥ 1 kelas, idempoten, minimal satu kelas punya tanggal > 2026-11-09

### Unit (3 test)

- 🔴 `src/server/domain/session-dates.test.ts` — `[P1] AC-1`
- 🔴 `src/server/domain/class-status.test.ts` — `[P1] AC-2`
- 🔴 `src/client/components/Badge.test.ts` — `[P3] AC-4` (render `react-dom/server`, tanpa jsdom)

---

## Fixture dan Data

Tidak ada fixture atau factory baru. Yang dipakai:

- E2E: `adminLogin`, `uid`, `expectNoA11yViolations` dari `e2e/support/fixtures.ts`
- Vitest: `createTestDb`, `TEST_NOW_ISO`, `uniqueEmail`, `uniqueTitle`, `createTempDir`
- `@seontechnologies/playwright-utils` **tidak** dipasang (A-6), jadi `merged-fixtures.ts`, `apiRequest`, dan `interceptNetworkCall` tidak dibuat. Flag `tea_use_playwright_utils: true` tidak berlaku karena paketnya tidak ada di `package.json`.

### Deviasi Playwright Utils

| Berkas | Pola vanilla | Alasan |
| --- | --- | --- |
| `e2e/admin-class-create.spec.ts` (AC-5) | `page.route('**/api/admin/classes')` dengan gate | Paket tidak terpasang; pola sama dengan `admin-login.spec.ts` |
| `e2e/admin-class-create.spec.ts` (AC-7) | `page.request.post` untuk setup kelas | Sama; cookie sesi dari `adminLogin` berbagi konteks |

---

## Atribut `data-testid`

Tidak ada. Semua selector memakai role/label/teks Indonesia. Test design membatasi `data-testid` pada `class-row-{publicCode}` dan `registration-row-{registrationId}`, dan keduanya tidak dipakai di Story 1.6.

---

## Asumsi Kontrak (dibuat karena AC belum menetapkannya)

Dev boleh memilih bentuk lain; bila berbeda, sesuaikan test **saat aktivasi**, bukan perilakunya.

| # | Asumsi | Dipakai di |
| --- | --- | --- |
| A-1 | `src/server/domain/session-dates.ts` mengekspor `validateSessionDates(dates, today): Record<string,string>` (`{}` bila sah). Kunci `sessionDates` untuk daftar kosong/tanpa tanggal setelah hari ini, `sessionDates.<i>` untuk **kemunculan kedua** tanggal ganda. Pesan ganda memakai format "9 Nov 2026" tanpa nama hari | AC-1, AC-3, AC-5 |
| A-2 | `src/server/domain/class-status.ts` mengekspor `classStatus({ sessionDates, today }): ClassStatus` dengan batas `<=` (epics/PRD revisi). **Spine AD-6 baris 87 masih `<`, dan AD-19 masih "minimal satu ≥ today"**. Test mengikuti epics (asumsi 1 test design). R-022 tetap terbuka sampai spine diperbarui lewat `bmad-architecture`/`bmad-correct-course` | AC-1, AC-2 |
| A-3 | DTO `POST /api/admin/classes` persis `{ id, publicCode, title, sessionDates, quota, today }` (`toEqual`). Bila story menambah field turunan (mis. `status`), ganti ke `toMatchObject` atau tambahkan field-nya | AC-3 |
| A-4 | Kuota berbentuk string `"20"` ditolak (tanpa koersi zod) | AC-3 |
| A-5 | `Badge` diekspor bernama dari `src/client/components/Badge.tsx` dengan prop `variant` berkunci Inggris (`registered`, `waitlisted`, `cancelled`, `open`, `full`, `finished`, `eligible`, `not_eligible`, `cannot_be_eligible`). Tone muncul di markup sebagai kata `warning`/`danger` (kelas atau `var(--…)`). Label kelayakan ditambahkan ke `src/shared/glossary.ts` | AC-4, AC-6 |
| A-6 | Label formulir: "Judul kelas", "Kuota", dan baris "Tanggal sesi N" (Field menambah " (wajib)"). Formulir baru belum punya baris tanggal sampai "Tambah tanggal" ditekan | AC-5, AC-6 |
| A-7 | Klien tidak memvalidasi tanggal ganda sendiri, jadi POST terkirim dan error berasal dari server | AC-5 |
| A-8 | Kepala kelas menampilkan kuota sebagai teks "Kuota 20" / "Kuota: 20"; tautan ditampilkan persis sebagai `{origin}/daftar/{publicCode}` dalam satu elemen | AC-6, AC-7 |
| A-9 | `seed:demo` menambah kelas idempoten (jalan kedua tidak menambah baris) | AC-9 |
| A-10 | Kode `class_not_found` belum ada di `errors.ts`, jadi ditulis literal. Saat aktivasi, daftarkan kodenya lalu ganti dengan `getError('class_not_found')` | AC-8 |

---

## Implementation Checklist (aktivasi per tugas)

Urutan disarankan: domain → migrasi/use-case/rute → seed → UI.

### AC-1 / AC-2 — domain murni
- [ ] Migrasi baru `src/server/data/migrations/002_classes.sql`: `classes` (`public_code` UNIQUE, `title`, `quota CHECK >= 1`, `created_at`/`updated_at` CHECK GLOB, tanpa DEFAULT waktu) dan `class_sessions` (FK, `session_date` TEXT, UNIQUE `(class_id, session_date)`)
- [ ] `src/server/domain/session-dates.ts`, `src/server/domain/class-status.ts`
- [ ] Ganti impor dinamis di kedua test dengan impor statis; hapus `.skip`; `npx vitest run src/server/domain`
- [ ] Hijaukan; `src/architecture.test.ts` tetap hijau (tanpa `new Date()` di domain)

### AC-3 / AC-8 — use-case + rute
- [ ] Skema zod `createClassRequestSchema` di `src/shared/schemas.ts`; DTO di `src/shared/dto.ts`
- [ ] `classes-repo.ts` (SQL berparameter), use-case `services/classes.ts` dengan satu `withWriteTx`; `public_code` dari `crypto.randomBytes` (10 karakter base64url)
- [ ] Rute `POST /api/admin/classes`, `GET /api/admin/classes/:id` di plugin admin
- [ ] Daftarkan `class_not_found` (404) + pesan Indonesia di `errors.ts`; ganti literal di test (A-10)
- [ ] Hapus `.skip`; `npx vitest run src/server/http/admin-classes.test.ts`

### AC-9 — seed
- [ ] `scripts/seed-demo.ts` menambah kelas contoh relatif ke `clock.todayJakarta()` lewat use-case yang sama
- [ ] Hapus `.skip`; `npx vitest run scripts/scripts.test.ts`

### AC-4..AC-7 — UI
- [ ] `Badge.tsx`, `Toast`, `CopyLinkButton`, halaman `/admin/kelas/baru` dan `/admin/kelas/:id`; tombol "Buat kelas" di halaman Kelas; label status dari `glossary.ts`, tanggal dari `format.ts`, warna `var(--…)`
- [ ] Hapus `.skip` di `Badge.test.ts` dan di `e2e/admin-class-create.spec.ts`
- [ ] `npm run test:e2e -- e2e/admin-class-create.spec.ts` (lihat R-023 di bawah)

### Cabang sekunder untuk fase hijau / `automate` (bukan leaf merah)
- [ ] AC-1: test skema migrasi (CHECK kuota, GLOB waktu, UNIQUE sesi) di `src/server/data/`
- [ ] AC-3: satu transaksi (kegagalan insert sesi → tidak ada baris `classes`); 1.000 `publicCode` unik
- [ ] AC-5: tombol "Hapus" baris tanggal; validasi klien saat submit untuk kolom kosong
- [ ] AC-6: urutan daftar tanggal di DOM; badge "Selesai" untuk kelas bersesi terakhir hari ini (tidak bisa dibuat lewat POST, jadi butuh fixture repo)
- [ ] AC-7: clipboard ditolak (`grantPermissions([])` atau stub `navigator.clipboard.writeText` gagal) → URL tetap tampil sebagai teks
- [ ] AC-8: halaman `/admin/kelas/987654` menampilkan pesan Indonesia, bukan layar kosong
- [ ] AC-9: axe pada state halaman kelas setelah toast hilang

---

## Menjalankan Test

```bash
# Semua unit + integrasi (scaffold skip tetap hijau)
npm test

# Satu berkas setelah aktivasi
npx vitest run src/server/http/admin-classes.test.ts

# E2E story ini
npm run test:e2e -- e2e/admin-class-create.spec.ts

# Hanya prioritas P1
npm run test:e2e -- --grep @P1
```

---

## Bukti Eksekusi (RED)

**Typecheck:** `npm run typecheck` hijau.

**Suite penuh dengan scaffold skip:** `npm test` → 23 berkas lulus, 4 skip; 261 test lulus, 6 skip. Suite tetap hijau.

**Aktivasi sementara** (`.skip` dilepas, dijalankan, lalu dikembalikan). Keenam test Vitest gagal karena perilakunya memang belum ada, bukan karena error sintaks atau import statis:

| Test | Kegagalan |
| --- | --- |
| AC-1 | `Cannot find module '/src/server/domain/session-dates.js'` |
| AC-2 | `Cannot find module '/src/server/domain/class-status.js'` |
| AC-3 | `expected 404 to be 201` |
| AC-4 | `Cannot find module '/src/client/components/Badge'` |
| AC-8 | `expected 'not_found' to be 'class_not_found'` |
| AC-9 | `SqliteError: no such table: classes` |

**E2E:** `npx playwright test --list e2e/admin-class-create.spec.ts` berhasil memuat 6 entri. Run browser **belum** dilakukan karena **R-023**: Chromium tidak bisa start di mesin dev (`libnspr4` hilang). Sesuai mitigasi R-023, bukti merah/hijau E2E harus datang dari job E2E CI, atau dari mesin dev setelah `npx playwright install-deps chromium`.

**Sesi CLI browser:** tidak ada yang dibuka (mode rekam tidak dipakai), jadi tidak ada sesi yatim.

---

## Risiko dan Catatan

- **R-022 (skor 6, terbuka):** spine AD-6 (`<`) dan AD-19 (`≥ today`) bertentangan dengan epics (`<=`, "setelah today"). Scaffold mengunci versi epics. Perbarui spine sebelum build Story 1.6, karena AGENTS.md menyatakan AD mengikat dan agen dev cenderung mengikuti spine.
- **R-023 (skor 6, terbuka):** E2E story ini belum bisa dibuktikan lokal.
- `scripts/scripts.test.ts` diubah dengan menambah satu `it.skip`. Test lain di berkas itu tidak diubah.
- Workflow meminta berkas JSON sementara di `/tmp` untuk worker A/B. Mode sequential menulis berkas langsung tanpa JSON perantara, sehingga tidak ada artefak sementara di luar `{test_artifacts}`.

---

## Langkah Berikut

1. Selesaikan R-022 (update spine) dan R-023 (Chromium/CI gate).
2. Build Story 1.6 (`bmad-build`/`bmad-agent-dev`), aktifkan scaffold per tugas sesuai urutan di atas.
3. Setelah hijau: `bmad-testarch-automate` untuk cabang sekunder dan P2/P3.
4. Lanjut `/bmad-testarch-atdd` untuk Story 1.7 (P0 R1/R2 + mutation check).

---

## Referensi Knowledge Base

`data-factories`, `component-tdd`, `test-quality`, `test-healing-patterns`, `selector-resilience`, `timing-debugging`, `playwright-cli`, `fixture-architecture`, `network-first`, `test-levels-framework`, `test-priorities-matrix`, `ci-burn-in`. Fragmen Playwright Utils dan Pact tidak dimuat karena paketnya tidak terpasang dan tidak ada artefak kontrak.

---

**Dibuat oleh:** BMad TEA Agent (Murat) · **Workflow:** `bmad-testarch-atdd`
