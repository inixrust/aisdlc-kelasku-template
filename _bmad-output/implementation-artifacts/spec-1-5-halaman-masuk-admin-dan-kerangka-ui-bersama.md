---
title: 'Story 1.5: Halaman masuk admin dan kerangka UI bersama'
type: 'feature'
created: '2026-11-03'
status: 'in-review'
baseline_commit: '87a181354f47aa89ff5a67c909e9158f6937fd10'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/EXPERIENCE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** API auth (Story 1.4) sudah ada, tetapi klien belum punya token, komponen bersama, fetch wrapper, maupun halaman Masuk dan panel admin, sehingga admin belum bisa masuk/keluar lewat UI dan story UI berikutnya tidak punya kerangka (FR1, NFR3, UX-DR1/2/3/6/11/21, AD-8, AD-13).

**Approach:** `tokens.css` 1:1 dari frontmatter DESIGN.md (dijaga test statis), komponen `PageLayout`, `AdminLayout`, `Field`, `ErrorSummary`, `Alert`, `LoadState`, fetch wrapper `src/client/api/` (satu-satunya pemanggil `fetch`), halaman `/admin/masuk` dan `/admin/kelas` sementara, serta rute `/admin` → `/admin/kelas`.

## Boundaries & Constraints

**Always:** Hanya `var(--…)` di luar `tokens.css` (tanpa hex/`rgb(`); teks UI Indonesia; pesan error dari `src/shared/errors.ts`/`SCHEMA_MESSAGES`; client hanya mengimpor `src/shared/`; setiap halaman memakai `PageLayout` (satu `<h1>`, skip link "Lewati ke konten utama" pertama, `<title>` "{Halaman} — Kelasku", fokus ke `<h1>` saat rute berubah tetapi tidak pada muat pertama); fetch `credentials: 'same-origin'`, `cache: 'no-store'`, tulis selalu `Content-Type: application/json` (logout mengirim `{}`); anak `AdminLayout` tidak dirender sebelum `GET /api/auth/session` 200.

**Never:** Tanpa dependensi baru (tanpa jsdom/testing-library/UI library); tanpa API server baru; tanpa tabel kelas (Story 1.9), breadcrumb, tautan "Sesi hari ini", `Badge`/`DataTable`/`Toast`/dialog; tanpa loader/action React Router; email tidak masuk URL/log.

**Keputusan (asumsi dry run):**
- 401 `unauthorized` dari request apa pun → alihkan ke `/admin/masuk?next=<path+search saat ini>` dengan state navigasi `sessionExpired` → alert info "Sesi masuk Anda berakhir. Silakan masuk lagi." Request yang memakai opsi `on401: 'throw'` (login, cek sesi `AdminLayout`) tidak dialihkan wrapper; `AdminLayout` mengalihkan sendiri tanpa alert (belum masuk ≠ sesi habis).
- `next` sah hanya bila diawali `/` tunggal (bukan `//`, `/\`), dan `new URL(next, origin).origin === origin`; selain itu (termasuk kosong) → `/admin`.
- Halaman non-admin (Masuk, beranda, 404) punya `header` (teks "Kelasku") + `main` tanpa `nav` kosong (UX-DR2 "tanpa navigasi global"); landmark `nav` ada di top bar admin.
- `/admin/kelas` sementara memuat `GET /api/auth/session` sebagai sumber data pengganti (diganti `GET /api/admin/classes` di Story 1.9); sukses hanya menampilkan `<h1>` "Kelas".
- Masuk: validasi klien saat submit memakai `loginRequestSchema`; error kolom → `Field` + `ErrorSummary` (fokus ke ringkasan). `invalid_credentials` → alert danger `role="alert"` di atas formulir, password dikosongkan, fokus ke kolom password. Error lain (jaringan, 5xx) → alert danger dengan pesan registri; isian tetap.
- Keluar gagal (jaringan) → alert danger di atas konten admin; tetap di halaman.
- Gagal memuat `LoadState`: alert danger "Tidak dapat memuat data. Periksa koneksi lalu coba lagi." + tombol sekunder "Coba lagi"; "Memuat…" baru tampil bila request > 300 ms.
- Penamaan custom property: `--color-*`, `--font-{peran}-{family|size|weight|line-height}`, `--radius-*`, `--space-*`, `--{komponen}-{properti}`; referensi `{colors.x}` → `var(--color-x)`. Test 1:1 mencakup semua token colors/typography/rounded/spacing dan properti komponen bernama `height*`, `*width`, `size`, `hit-area`.
- Spec > 1600 token dipertahankan utuh (satu tujuan pengguna; dry run tanpa split).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Wrapper sukses | 2xx JSON | resolve data | N/A |
| Jaringan putus | `fetch` reject | `ApiError` `network_error` | pesan registri |
| Tanpa envelope | 500 HTML / 200 bukan JSON / kode tak dikenal | `ApiError` `unexpected_response` | pesan registri |
| Envelope | 400 `validation_error` + `fields` | `ApiError` membawa `code`, `message`, `fields` | N/A |
| 401 | `unauthorized`, opsi bawaan | navigate `/admin/masuk?next=/admin/kelas` + `sessionExpired` | tetap reject |
| `next` | `/admin/kelas?x=1` / `//evil.example` / `https://evil.example` / `/\evil` / `javascript:x` / kosong | `/admin/kelas?x=1` / `/admin` ×5 | N/A |
| Belum masuk | buka `/admin/kelas` | `/admin/masuk?next=/admin/kelas`, setelah masuk kembali ke `/admin/kelas` | N/A |
| Keluar | klik "Keluar", lalu Back | di `/admin/masuk`; Back → dialihkan lagi ke Masuk tanpa data admin | N/A |

</frozen-after-approval>

## Code Map

- `src/shared/errors.ts` -- `ERRORS`, `ErrorCode`, `ErrorEnvelope`; pakai ulang (sudah punya `network_error`, `unexpected_response`, `unauthorized`, `invalid_credentials`), jangan tambah kode.
- `src/shared/schemas.ts` -- `loginRequestSchema`, `SCHEMA_MESSAGES`; `src/shared/dto.ts` -- `AdminSessionResponse`, `LoginRequest`, `LogoutResponse`.
- `src/server/http/routes/auth.ts` -- kontrak `/api/auth/{login,session,logout}`; tidak diubah.
- `src/client/router.tsx`, `main.tsx`, `pages/HomePage.tsx`, `pages/NotFoundPage.tsx` -- router `createBrowserRouter`; halaman lama diubah memakai `PageLayout`.
- `src/client/index.html` -- tetap; `#root` bukan hex.
- `src/architecture.test.ts` -- fitness test lapisan (client → shared saja); tidak diubah.
- `vitest.config.ts` -- project `unit` sudah mencakup `src/client/**/*.test.{ts,tsx}` (environment node: test klien hanya logika murni + `fetch` disuntik).
- `e2e/support/fixtures.ts` (`adminLogin`, `expectNoA11yViolations`), `e2e/support/admin.ts` (`E2E_ADMIN`) -- pakai ulang.
- `e2e/smoke.spec.ts` -- test deep link `/admin/kelas` → 404 harus diganti (kini dialihkan ke Masuk).
- DESIGN.md frontmatter -- sumber token; formatnya YAML sederhana dua/tiga tingkat (dibaca test dengan parser kecil, tanpa dependensi YAML).

## Tasks & Acceptance

**Execution:**
- [x] `src/client/styles/tokens.css` -- semua token DESIGN.md sebagai custom property di `:root` -- AD-13, UX-DR1.
- [x] `src/client/styles/base.css` -- reset ringan, tipografi system font, tombol primer/sekunder, input, fokus 2 px, `.visually-hidden`, skip link, `tabular-nums` untuk `table` -- dasar semua halaman.
- [x] `src/client/styles/tokens.test.ts` -- test statis 1:1 token↔property (nilai literal sama, referensi → `var()`), dan tidak ada hex/`rgb(`/`rgba(` di `src/client/**` selain `tokens.css`; masing-masing dengan fixture negatif.
- [x] `src/client/api/client.ts` (+ `client.test.ts`) -- `apiRequest`, `ApiError`, `configureApi({ fetch, navigate, currentPath })`, `safeNextPath`, `loginPath(next)`; test seluruh matriks wrapper/`next` (nama test memuat `P2-012`).
- [x] `src/client/api/auth.ts` -- `login`, `getSession`, `logout`.
- [x] `src/client/api/useResource.ts` -- hook muat data: `{ state: 'loading'|'ok'|'error', data, showLoading (≥ 300 ms), retry }`.
- [x] `src/client/components/{PageLayout,AdminLayout,Field,ErrorSummary,Alert,LoadState}.tsx` (+ CSS bersama di `components.css`) -- perilaku sesuai Boundaries; top bar 48 px: "Kelasku", `NavLink` "Kelas" (aktif: warna primer + garis bawah 2 px, `aria-current`), email admin, tombol "Keluar"; flex-wrap < 640 px.
- [x] `src/client/pages/admin/LoginPage.tsx`, `pages/admin/ClassesPage.tsx` -- halaman Masuk ("Masuk", tombol "Masuk"/"Masuk…") dan Kelas sementara.
- [x] `src/client/router.tsx`, `main.tsx` -- rute `/admin/masuk`, `/admin` (`AdminLayout`; index → `Navigate` `/admin/kelas`; `kelas`); impor CSS; `configureApi({ navigate: router.navigate })`.
- [x] `src/client/pages/HomePage.tsx`, `NotFoundPage.tsx` -- pakai `PageLayout` (judul dokumen beranda tetap "Kelasku").
- [x] `e2e/admin-login.spec.ts`, `e2e/smoke.spec.ts` -- alur AC di kedua project + axe di Masuk, Kelas, state gagal; perbarui smoke deep link ke rute tak dikenal.
- [x] `test/README.md` -- catat spec e2e baru.

**Acceptance Criteria:**
- Given halaman Masuk, when kredensial salah dikirim, then alert danger "Email atau password salah" di atas formulir, password kosong, email tetap, dan tombol "Masuk…" nonaktif selama request.
- Given formulir Masuk kosong, when "Masuk" ditekan, then `ErrorSummary` `role="alert"` menerima fokus dan menautkan ke kolom; input ber-`aria-invalid="true"` dan `aria-describedby` ke pesannya; label memuat "(wajib)".
- Given admin masuk, when halaman admin terbuka, then top bar 48 px berisi "Kelasku", "Kelas" aktif, email admin, "Keluar"; tanpa "Sesi hari ini"; `/admin` → `/admin/kelas`; `<title>` "Kelas — Kelasku".
- Given request `/admin/kelas` lambat > 300 ms / gagal, then "Memuat…" / alert gagal + "Coba lagi" yang memuat ulang.
- Given sesi habis saat memuat data, then dialihkan ke Masuk dengan alert info "Sesi masuk Anda berakhir. Silakan masuk lagi." dan kembali ke path asal setelah masuk.
- Given halaman mana pun, when Tab pertama, then fokus di "Lewati ke konten utama"; setelah pindah rute fokus di `<h1>`.
- Given `npm test`, `npm run typecheck`, `npm run build`, then hijau; axe tanpa pelanggaran di Masuk dan Kelas.

## Implementation Notes

- `PageLayout` punya dua mode lewat `AdminChromeContext`: di luar admin ia merender skip link + `header` "Kelasku" + `main`; di dalam `AdminLayout` hanya `<h1>` + isi (skip link, `header`/`nav`, `main` milik top bar). Fokus `<h1>` memakai kunci lokasi tingkat modul: lokasi pertama yang dilihat `PageLayout` tidak memindahkan fokus. `AdminLayout` tidak memakai `PageLayout` selama cek sesi, sehingga redirect awal ke Masuk dihitung sebagai muat pertama.
- Tautan di `ErrorSummary` dan skip link memakai `preventDefault` + `focus()` agar perubahan hash tidak dianggap pindah rute oleh router.
- `loginPath` tidak meng-encode `/` (`/admin/masuk?next=/admin/kelas`); `?`/`=`/`&` di-encode. Wrapper tidak mengalihkan bila sudah di `/admin/masuk`.
- Teks gagal muat "Tidak dapat memuat data. Periksa koneksi lalu coba lagi." adalah copy UI state di `LoadState.tsx` (bukan kode error baru di registri), sesuai larangan menambah kode.
- `tokens.css` juga memuat properti komponen non-wajib yang nilainya nilai CSS (warna, radius, border, padding); test memeriksa semuanya sama dengan DESIGN.md dan menolak properti yang tidak ada di DESIGN.md. Properti teks bebas (`icon`, `variants`, `position`, `typography`, `border-left`, `active-link-indicator`) tidak dipetakan.
- Tombol "Keluar" hanya dinonaktifkan selama request (label tetap).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau
- `npm run build` -- expected: exit 0
- `npx playwright test` -- expected: hijau di kedua project (bila Chromium bisa start; di mesin ini `libnspr4` hilang → coba pustaka lokal lewat `LD_LIBRARY_PATH`, bila tetap gagal catat sebagai defer CI)
