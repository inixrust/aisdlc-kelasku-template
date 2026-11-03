---
title: 'Story 1.2: Waktu Jakarta, format tanggal, glosarium, dan registri error bersama'
type: 'feature'
created: '2026-11-03'
status: 'done'
baseline_commit: '6f9434f2ad171b9a40617b7d816e36825bc17c95'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story berikutnya butuh satu sumber "hari ini" WIB, format tanggal Indonesia, label status, dan kode error; tanpa itu tiap story menghitung tanggal dan menulis pesan sendiri-sendiri (NFR2, NFR5).

**Approach:** Tambah `src/server/clock.ts` (AD-7, B-2a), `src/shared/format.ts` dan `src/shared/glossary.ts` (AD-10, AD-13), lengkapi `src/shared/errors.ts` (AD-8, HP-2, A-8), dan jalankan `*.tz.test.ts` di tiga zona proses lewat `npm test` (A-12).

## Boundaries & Constraints

**Always:** `Clock { now(): Date; todayJakarta(): string }` dari `createClock(env = process.env)`; "hari ini" lewat `Intl.DateTimeFormat` `timeZone: 'Asia/Jakarta'`, tidak bergantung zona proses. `KELASKU_FAKE_NOW` dipakai hanya bila `NODE_ENV === 'test'`, di-parse sekali saat `createClock`, beku; nilai yang bukan instan valid → `createClock` melempar. Format memakai `Intl`, `id-ID`, `Asia/Jakarta`. `src/shared/` tidak mengimpor apa pun di luar `src/shared/`. Bentuk registri tetap `{ code, httpStatus, message }` + `toErrorEnvelope(code, fields?)` dari Story 1.1.

**Never:** Tanpa `ctx`/`withWriteTx`/DB (Story 1.3); tanpa fetch wrapper klien (Story 1.5); tanpa kode error di luar daftar AC + yang sudah ada; tanpa dependensi baru; tanpa memasang `Clock` ke `main.ts` (belum ada pemakai; Story 1.3).

**Keputusan (asumsi dry run, tidak terlihat pengguna kecuali pesan):**
- Status HTTP kode sintetis klien: `network_error` 503, `unexpected_response` 502 (registri mensyaratkan status untuk setiap kode; klien tidak pernah menerimanya dari server).
- Pesan diambil dari EXPERIENCE.md bila ada: `unauthorized` "Sesi masuk Anda berakhir. Silakan masuk lagi.", `invalid_credentials` "Email atau password salah", `network_error` "Tidak dapat menghubungi server. Coba lagi.", `database_busy` "Server sedang sibuk, coba lagi."; lainnya: `validation_error` "Periksa kembali isian yang ditandai.", `unsupported_media_type` "Format permintaan tidak didukung.", `unexpected_response` "Server memberi jawaban yang tidak terduga. Coba lagi.".
- Kunci status kelas: `'open' | 'full' | 'finished'` → Dibuka/Penuh/Selesai.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| WIB lewat tengah malam | instan `2026-11-09T17:30:00.000Z` | `todayJakarta()` = `2026-11-10` | N/A |
| Pagi WIB | `2026-11-09T23:59:00.000Z` | `2026-11-10` | N/A |
| Jayapura sudah besok | `2026-11-10T16:30:00.000Z` | `2026-11-10` | N/A |
| Tepat 00.00 WIB | `2026-11-09T17:00:00.000Z` | `2026-11-10` | N/A |
| Clock palsu beku | `NODE_ENV=test`, `KELASKU_FAKE_NOW=2026-11-09T03:00:00.000Z` | `now()` dua kali berjeda → instan sama | N/A |
| Clock palsu di luar test | `NODE_ENV=production` + `KELASKU_FAKE_NOW` | jam nyata dipakai | variabel diabaikan |
| Clock palsu rusak | `NODE_ENV=test`, `KELASKU_FAKE_NOW=besok` | — | `createClock` melempar Error berpesan jelas |
| Format tanggal sesi | `'2026-11-09'` | "Senin, 9 Nov 2026" | N/A |
| Format instan | `'2026-11-09T07:32:00.000Z'` | "9 Nov 2026, 14.32 WIB" | N/A |
| Envelope dengan fields | `toErrorEnvelope('validation_error', { title: '…' })` | `{ error: { code, message, fields } }` | N/A |

</frozen-after-approval>

## Code Map

- `src/shared/errors.ts` -- registri `ERRORS` (`as const satisfies Record<…>`), `getError`, `toErrorEnvelope`; perluas entri saja, jangan ubah bentuk API. Dipakai `src/server/http/app.ts` (`not_found`).
- `src/shared/errors.test.ts` -- sudah memeriksa pesan non-kosong + status ≥ 400 untuk semua kode; tambah test daftar kode minimum + status yang diharapkan.
- `vitest.config.ts` -- dua project `unit`/`integration`; `process.env.TZ='UTC'` di atas. Tambah tiga project tz; keluarkan `**/*.tz.test.ts` dari `unit`/`integration`.
- `src/test-environment.test.ts` -- test HP-1 (zona UTC); jangan diubah.
- `src/architecture.test.ts` -- fitness test HP-3: `src/server/clock.ts` boleh `new Date()`; `src/shared/` tak boleh impor ke luar; `domain/` tak boleh impor `clock.ts`. Tidak perlu diubah.
- `test/README.md` -- tabel "Menjalankan"; tambah baris project tz.
- PRD §3 Glosarium: label "Terdaftar", "Daftar tunggu", "Dibatalkan", "Dibuka", "Penuh", "Selesai".
- Intl `id-ID` Node 24 sudah menghasilkan "Senin, 9 Nov 2026" (`weekday long, day numeric, month short`) dan "9 Nov 2026, 14.32" (`hourCycle h23`).

## Tasks & Acceptance

**Execution:**
- [x] `src/server/clock.ts` -- `Clock`, `createClock(env)`, `jakartaDateOf(instant: Date): string` (YYYY-MM-DD via `formatToParts`); `now()` mengembalikan salinan `Date` -- AD-7, B-2a.
- [x] `src/server/clock.tz.test.ts` -- empat instan matriks lewat clock palsu; beku (dua `now()` berjeda sama); `NODE_ENV` ≠ test → jam nyata (selisih dengan `Date.now()` kecil); nilai rusak melempar; satu test memastikan zona proses = `process.env.TZ` (bukti run tiga zona).
- [x] `src/shared/format.ts` -- `formatSessionDate(date: string)` dan `formatDateTime(iso: string)` (akhiran " WIB") -- AD-10.
- [x] `src/shared/format.tz.test.ts` -- dua contoh AC + satu instan yang melewati tengah malam WIB (`2026-11-09T17:30:00.000Z` → "10 Nov 2026, 00.30 WIB").
- [x] `src/shared/glossary.ts` + `glossary.test.ts` -- tipe `RegistrationStatus`, `ClassStatus`; peta label + `registrationStatusLabel`, `classStatusLabel`; test persis enam istilah.
- [x] `src/shared/errors.ts` + `errors.test.ts` -- tambah tujuh kode dengan status/pesan di atas.
- [x] `vitest.config.ts` -- project `tz-utc`, `tz-jakarta`, `tz-jayapura` (`env.TZ` per project, `include: ['src/**/*.tz.test.ts']`).
- [x] `test/README.md` -- dokumentasikan project tz dan konvensi `*.tz.test.ts`.

**Acceptance Criteria:**
- Given `npm test`, when dijalankan, then setiap `*.tz.test.ts` lulus di project `tz-utc`, `tz-jakarta`, `tz-jayapura` dengan zona proses yang berbeda, dan test lain tetap berjalan dengan `TZ=UTC`.
- Given registri error, when dibaca, then memuat minimal `not_found` 404, `validation_error` 400, `unauthorized` 401, `invalid_credentials` 401, `unsupported_media_type` 415, `database_busy` 503, `network_error`, `unexpected_response`, semuanya dengan pesan Indonesia non-kosong.
- Given `npm run typecheck` dan fitness test, when dijalankan, then lulus.

## Implementation Notes

- Diimplementasikan langsung di sesi ini (tanpa subagen implementasi), mengikuti preseden Story 1.1; review memakai tiga subagen.
- Spec ±1.800 token (di atas 1.600); dry run memilih "Keep full spec" dan "Approve and continue" tanpa jeda checkpoint.
- Bukti tiga zona: test `runs under the process time zone chosen by the Vitest project (A-12)` membaca `task.file.projectName`; uji mutasi (menghapus `env.TZ` per project) membuat test itu gagal di `tz-jakarta` dan `tz-jayapura`.
- Pola tz menjadi `**/*.tz.test.{ts,tsx}` (bukan hanya `src/`) agar `scripts/`/`test/` dan test klien `.tsx` ikut tiga zona.
- `KELASKU_FAKE_NOW` divalidasi bolak-balik (`toISOString().slice(0,16)`) agar 30 Feb atau 24.00 ditolak, bukan digulirkan.
- `formatDateTime` menolak instan tanpa zona (`Z`/`±HH:MM`) karena `Date` membacanya di zona proses/browser.
- `Clock` belum dipasang di `main.ts` (pemakai pertama di Story 1.3).
- Verifikasi: `npm run typecheck` exit 0; `npm test` 129/129 (tz: 27 test × 3 zona); `npm run build && npm run test:e2e` 6/6 (WSL dengan `LD_LIBRARY_PATH` pustaka lokal seperti Story 1.1).

## Spec Change Log

## Review Triage Log

| # | Sumber | Temuan | Verdict | Bukti | Rute |
|---|--------|--------|---------|-------|------|
| 1 | blind, edge | Paragraf di tengah tabel README memutus tabel | low | Baris `-t "R3"` dst. setelah paragraf tanpa header | patch |
| 2 | blind, edge, verif | `formatDateTime` menerima instan tanpa zona → hasil bergantung TZ | medium | `2026-11-09T14:32` → 21.32 WIB (UTC) vs 12.32 WIB (Jayapura) | patch |
| 3 | blind, edge, verif | `KELASKU_FAKE_NOW` 30 Feb/24.00 digulirkan, tidak ditolak | medium | `new Date('2026-02-30T03:00:00.000Z')` → 2 Mar; melanggar matriks "rusak → melempar" | patch |
| 4 | blind, edge | `TZ_TEST` hanya `src/**/*.ts`; `scripts/`/`test/`/`.tsx` lolos tiga zona | low | Pola glob; integrasi meng-include `scripts/`, `test/` | patch |
| 5 | blind | Komentar `vitest.config.ts` "Dua project" basi | low | Kini lima project | patch |
| 6 | blind | Keluaran `Intl id-ID` di browser bisa berbeda | maybe-false | Perlu e2e yang merender tanggal (mulai Story 1.6+); paling banter low | tolak |
| 7 | blind | Tidak ada test batas bulan/tahun | low | Logika sama dengan kasus tengah malam yang sudah diuji; tanpa kerugian bernama | tolak |
| 8 | blind, edge | Label glossary `undefined` untuk status tak dikenal; tipe kembali `string` | low | Status hanya dari server sendiri lewat tipe/zod; jarang; butuh cabang baru | tolak |
| 9 | blind | `invalid_credentials` tanpa titik | false | Teks persis EXPERIENCE.md §Masuk gagal | tolak |
| 10 | blind | Kode klien (`network_error`, `unexpected_response`) bisa dikirim server | low | Registri tunggal ditetapkan AD-8; butuh tipe baru | tolak |
| 11 | blind | Test "abaikan fake now" membandingkan jalur kode yang sama; flake tengah malam | low | Pemeriksaan `now()` ±5 s yang membuktikan; flake hanya pada milidetik pergantian hari | tolak |
| 12 | blind | Diff tanpa spec/sprint-status | false | Sengaja: diff review hanya kode | tolak |
| 13 | edge | Tahun 0000–0099 dipetakan ke 19xx | low | Tanggal sesi divalidasi sebelum disimpan (Story 1.6); butuh guard baru | tolak |
| 14 | edge | `jakartaDateOf(Invalid Date)` melempar error generik | false | Gagal keras; tidak ada pemanggil yang mengirim Invalid Date | tolak |

## Design Notes

- Tanggal sesi diformat sebagai tanggal kalender: parse `YYYY-MM-DD` ke `Date.UTC(y, m-1, d, 12)` lalu format dengan `timeZone: 'Asia/Jakarta'` (siang UTC = 19.00 WIB, tanggal sama) sehingga tidak bergeser oleh zona proses.
- `env.TZ` per project Vitest diterapkan ke `process.env` worker; Node membaca ulang TZ saat diubah, jadi `Intl.DateTimeFormat().resolvedOptions().timeZone` mengikuti project.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau; output menampilkan project `tz-utc`, `tz-jakarta`, `tz-jayapura`
- `npm run build && npm run test:e2e` -- expected: smoke tetap hijau
