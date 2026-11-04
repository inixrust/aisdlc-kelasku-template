---
title: 'Story 1.6: Membuat kelas dan membagikan tautan pendaftaran'
type: 'feature'
created: '2026-11-04'
status: 'done'
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
- [x] `src/server/data/migrations/002_classes.sql` -- tabel `classes`, `class_sessions` sesuai AC.
- [x] `src/shared/format.ts` (+ tz test) -- `formatShortDate` "16 Nov 2026".
- [x] `src/server/domain/session-dates.ts`, `class-status.ts` -- fungsi murni; aktifkan test domain.
- [x] `src/shared/{schemas,dto,errors,glossary}.ts` -- `createClassRequestSchema`, DTO, `class_not_found`, `ELIGIBILITY_LABELS`.
- [x] `src/server/data/classes-repo.ts`, `src/server/services/classes.ts`, `services/index.ts` -- use-case `createClass`, `getClass`, `hasClassWithTitle`.
- [x] `src/server/http/routes/admin-classes.ts`, `admin-plugin.ts` -- rute; aktifkan `admin-classes.test.ts`.
- [x] `scripts/seed-demo.ts` -- kelas demo; aktifkan AC-9.
- [x] `src/client/components/{Badge,Toast,CopyLinkButton}.tsx`, `icons.tsx`, `components.css` -- aktifkan `Badge.test.ts`.
- [x] `src/client/api/classes.ts`, `pages/admin/{CreateClassPage,ClassPage,ClassesPage}.tsx`, `router.tsx` -- halaman; aktifkan e2e.
- [x] `test/README.md` -- catat spec e2e baru.

**Acceptance Criteria:**
- Given semua test ATDD story 1.6, when `npm test` dan `npm run test:e2e`, then semuanya aktif (tanpa `skip`) dan lulus di kedua project Playwright, termasuk axe.
- Given `npm run typecheck` dan `npm run build`, then exit 0; fitness test arsitektur hijau.

## Implementation Notes

- Implementasi awal ada di commit WIP `17eb855`; sesi lanjutan memverifikasi seluruhnya terhadap spec, lalu menambah: toast "Kelas tersimpan" dibaca sekali dan state riwayat dikosongkan (muat ulang tidak menampilkan toast lagi), catatan `test/README.md`, dan dua entri `deferred-work.md` (R-022 spine; cabang sekunder ATDD).
- `auth.test.ts` dan `services.test.ts` disesuaikan untuk rute/use-case baru (enumerasi rute admin, kunci `createServices`); bukan test ATDD story ini.

## Spec Change Log

## Review Triage Log

| # | Sumber | Temuan | Verdict | Rute | Bukti |
|---|--------|--------|---------|------|-------|
| 1 | blind, edge | `isCalendarDate` meloloskan tahun 0–99 (`Date.UTC` → 19xx) | low | patch | `calendarNoon` hanya membandingkan hari/bulan; `['0026-11-09','2026-11-16']` lolos `validateSessionDates` lalu tampil 1926. Koreksi langsung (cek tahun). |
| 2 | blind, edge | `sessionDates`/`quota` tanpa batas atas | low | reject | Rute khusus admin terautentikasi (±5 admin); perbaikan menambah parameter dan pesan baru; jarang terjadi dalam pemakaian wajar. |
| 3 | blind, edge | Error baris tanggal pindah ke baris lain setelah Hapus | medium | patch | `fields` berindeks posisi (`sessionDates.<i>`), baris di-render per `key`; `removeRow` tidak membersihkan error/ringkasan. |
| 4 | blind | Toast `role="status"` terpasang sudah berisi pesan → bisa tak diumumkan | low | patch | `Toast` diinisialisasi `useState(message)` dan dirender pada render pertama `ClassPage`; koreksi langsung: inisialisasi `null`. |
| 5 | blind | `navigate(..., state:null)` membuang `search`/`hash` | low | reject | Rute `/admin/kelas/:id` tidak memakai query/hash. |
| 6 | blind, edge | Klik ulang saat "Tautan disalin" tidak me-restart timer 3 detik | low | reject | Label tetap benar (tersalin), hanya kembali lebih awal; perbaikan menambah state. |
| 7 | blind | Pesan gagal salin tak pernah hilang; live region membungkus tombol | false | reject | Pesan gagal adalah instruksi salin manual yang harus tetap terlihat; live region pembungkus tombol adalah keputusan spec (Keputusan #6). |
| 8 | blind | `seed:demo`: clock terpisah, cek judul di luar transaksi, `addDays` pakai `Date` | false | reject | Kedua clock dari `createClock()` dengan env yang sama; seed hanya jalan saat server mati (AGENTS.md); larangan `new Date()` hanya untuk `domain/`/`services/`. |
| 9 | blind | Tautan bisa berisi `localhost` | low | reject | Admin membuka aplikasi lewat alamat server lokal yang sama dengan peserta (deployment satu server); di luar perubahan ini. |
| 10 | blind | Header `session-dates.test.ts` masih "fase merah" | low | patch | Baris 2 berkas; koreksi komentar langsung. |
| 11 | blind, edge | `auth.test.ts` jalur sesi valid kini hanya rute uji; ekspektasi 15 diubah | false | reject | Bukan test ATDD story ini; enumerasi 401 tetap mencakup rute produksi; rute produksi punya kontrak sendiri di `admin-classes.test.ts`. |
| 12 | blind | `getClass` membaca kelas dan sesi tanpa snapshot | low | reject | Belum ada jalur ubah kelas (Story 1.11/1.12); risiko hipotetis. |
| 13 | blind | Banyak jalur baru tanpa test | — | digabung | Diwakili temuan verification-gap #14–#21. |
| 14 | vgap | Test seed tidak membedakan tanggal relatif Clock | gap | patch | Test baru: tanggal persis kelas demo terhadap 2026-11-09. |
| 15 | vgap | Tanggal kalender tidak valid tak diuji lewat API | gap | patch | Test baru `2026-02-30` dan non-string → 400 `sessionDates.0`. |
| 16 | vgap | Validasi klien dan error daftar tanggal di form tak diuji | gap | patch | E2E baru `[P2] AC-5`. |
| 17 | vgap | `status` `finished` dari `GET :id` tak diuji | gap | patch | Test baru open/finished dengan clock berbeda. |
| 18 | vgap | Halaman "Kelas tidak ditemukan" tak diuji | gap | patch | E2E baru `/admin/kelas/987654`. |
| 19 | vgap | Jaminan `publicCode` tanpa digit diuji lemah | gap | patch | Test baru regex `/^[A-Za-z_-]{10}$/` atas beberapa kode. |
| 20 | vgap | Fallback clipboard ditolak tak diuji | gap | defer | Jalur sekunder; simulasi penolakan clipboard berbeda per browser. |
| 21 | vgap | Toast tidak muncul lagi setelah muat ulang tak diuji | gap | defer | Kosmetik; cukup `page.reload()` di AC-6 nanti. |

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau, 0 skip dari story 1.6
- `npm run test:e2e` -- expected: hijau (WSL: `LD_LIBRARY_PATH` pustaka lokal bila perlu)
