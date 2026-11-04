---
title: 'Story 1.6: Membuat kelas dan membagikan tautan pendaftaran'
type: 'feature'
created: '2026-11-04'
status: 'in-progress'
baseline_commit: 'c5f9c5439a20000f5e82a5b079b9fc605b117551'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/EXPERIENCE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/test-artifacts/atdd-checklist-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Admin sudah bisa masuk, tetapi belum bisa membuat kelas berkuota maupun mendapatkan tautan pendaftaran untuk dibagikan ke WhatsApp (FR2, FR6, UJ-1 langkah 1–4). Acceptance test ATDD story ini masih `skip`.

**Approach:** Migrasi `classes` + `class_sessions`, fungsi domain `validateSessionDates` dan `classStatus`, use-case `createClass`/`getClass` di satu `withWriteTx`, rute `POST /api/admin/classes` dan `GET /api/admin/classes/:id`, kelas demo di `seed:demo`, serta UI `/admin/kelas/baru` dan `/admin/kelas/:id` dengan `Badge`, `Toast`, dan `CopyLinkButton`. Semua test ATDD diaktifkan dan lulus tanpa mengubah ekspektasinya.

## Boundaries & Constraints

**Always:** Lapisan dan aturan AGENTS.md (SQL berparameter hanya di `data/`, `withWriteTx` hanya di use-case, `ctx.nowIso`/`ctx.today`, tanpa `new Date()` di domain/services); teks UI Indonesia; label dari `glossary.ts`, tanggal dari `format.ts`, warna `var(--…)`; ekspektasi test ATDD tidak diubah (hanya `.skip` dilepas, impor dinamis diganti statis, literal `class_not_found` diganti `getError`).

**Never:** Tanpa dependensi baru; tanpa daftar/tabel kelas (Story 1.9), ubah kelas (1.11/1.12), pendaftaran (1.7/1.8), breadcrumb; tanpa kolom turunan (status) di DB.

**Keputusan (asumsi dry run):**
- Batas Selesai mengikuti epics/PRD revisi: `max(session_date) <= today`, dan validasi tanggal mewajibkan minimal satu tanggal **setelah** `today`. Spine AD-6 (`<`) / AD-19 (`≥ today`) belum diperbarui (R-022); dicatat di `deferred-work.md` untuk `bmad-architecture`.
- `POST` mengembalikan persis `{ id, publicCode, title, sessionDates, quota, today }` (A-3); `GET :id` menambah `status` (`open`|`finished`, dari `classStatus`). Penanda "Hari ini" di klien = `date === today` dari respons (pemformatan, bukan aturan).
- `public_code` 10 karakter dari `crypto.randomBytes` dengan alfabet base64url tanpa digit (`A–Z a–z - _`), sehingga id numerik internal tidak pernah bisa muncul di tautan (P1-011, test `not.toContain(String(id))` deterministik).
- Kuota string (`"20"`) ditolak (A-4). Kode error baru `class_not_found` (404, "Kelas tidak ditemukan.").
- `seed:demo` menambah dua kelas demo (satu berjalan: today−7, today, today+7; satu mendatang: today+7/+14/+21) bila judulnya belum ada (idempoten).
- Toast "Kelas tersimpan" dibawa lewat state navigasi; "Tautan disalin" diumumkan oleh live region yang membungkus tombol. Clipboard ditolak → teks URL dipilih otomatis + pesan "Tautan belum tersalin. Salin tautan di atas secara manual."
- Spec > 1600 token dipertahankan utuh (satu tujuan pengguna, lintas lapisan).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Buat valid | judul `"  X  "`, tanggal acak urutan, kuota 20 | 201, judul ter-trim, tanggal terurut, `today` | N/A |
| Judul | kosong setelah trim / 121 karakter | 400 `fields.title` | tanpa baris baru |
| Kuota | 0 / 2.5 / `"20"` | 400 `fields.quota` | tanpa baris baru |
| Tanggal | `[]` / `[today]` / `[today-7]` | 400 `fields.sessionDates` | tanpa baris baru |
| Tanggal ganda | `['2026-11-16','2026-11-16']` | 400 `fields['sessionDates.1']` = "Tanggal 16 Nov 2026 sudah ada di kelas ini" | tanpa baris baru |
| Baca | `GET /api/admin/classes/987654` / `abc` | 404 `class_not_found` | halaman: alert pesan Indonesia |

</frozen-after-approval>

## Code Map

- `src/server/data/db.ts` -- `withWriteTx`, `Tx`, `WriteCtx`; pakai ulang, tidak diubah. Migrasi baru `002_classes.sql` (penomoran berurutan wajib).
- `src/server/data/admins-repo.ts` -- pola repository (baca `Db`, tulis `Tx`, alias kolom camelCase).
- `src/server/services/{index,auth}.ts` -- pola use-case + `createServices`; tambah `classes`.
- `src/server/http/admin-plugin.ts` -- `ADMIN_ROUTES` kosong; daftarkan rute kelas. `validation.ts` `parseWith`. `auth.test.ts` mengenumerasi rute admin otomatis (401).
- `src/shared/{schemas,dto,errors,glossary,format}.ts` -- tambah skema, DTO, `class_not_found`, label kelayakan, `formatShortDate`.
- `scripts/seed-demo.ts`, `scripts/cli.ts` (`withServices`).
- `src/client/{router.tsx, api/client.ts, api/useResource.ts}`, `components/{PageLayout,Field,ErrorSummary,Alert,LoadState,icons}.tsx`, `components.css`, `pages/admin/{ClassesPage,LoginPage}.tsx` -- pola halaman/form (LoginPage).
- `tokens.css` sudah punya `--status-badge-*`, `--toast-*`; `tokens.test.ts` menolak `var()` tak terdefinisi dan warna literal.
- Test ATDD: `src/server/domain/{session-dates,class-status}.test.ts`, `src/client/components/Badge.test.ts`, `src/server/http/admin-classes.test.ts`, `scripts/scripts.test.ts` (AC-9), `e2e/admin-class-create.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/server/data/migrations/002_classes.sql` -- tabel `classes`, `class_sessions` sesuai AC.
- [ ] `src/shared/format.ts` (+ tz test) -- `formatShortDate` "16 Nov 2026".
- [ ] `src/server/domain/session-dates.ts`, `class-status.ts` -- fungsi murni; aktifkan test domain.
- [ ] `src/shared/{schemas,dto,errors,glossary}.ts` -- `createClassRequestSchema`, DTO, `class_not_found`, `ELIGIBILITY_LABELS`.
- [ ] `src/server/data/classes-repo.ts`, `src/server/services/classes.ts`, `services/index.ts` -- use-case `createClass`, `getClass`, `hasClassWithTitle`.
- [ ] `src/server/http/routes/admin-classes.ts`, `admin-plugin.ts` -- rute; aktifkan `admin-classes.test.ts`.
- [ ] `scripts/seed-demo.ts` -- kelas demo; aktifkan AC-9.
- [ ] `src/client/components/{Badge,Toast,CopyLinkButton}.tsx`, `icons.tsx`, `components.css` -- aktifkan `Badge.test.ts`.
- [ ] `src/client/api/classes.ts`, `pages/admin/{CreateClassPage,ClassPage,ClassesPage}.tsx`, `router.tsx` -- halaman; aktifkan e2e.
- [ ] `test/README.md` -- catat spec e2e baru.

**Acceptance Criteria:**
- Given semua test ATDD story 1.6, when `npm test` dan `npm run test:e2e`, then semuanya aktif (tanpa `skip`) dan lulus di kedua project Playwright, termasuk axe.
- Given `npm run typecheck` dan `npm run build`, then exit 0; fitness test arsitektur hijau.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau, 0 skip dari story 1.6
- `npm run test:e2e` -- expected: hijau (WSL: `LD_LIBRARY_PATH` pustaka lokal bila perlu)
