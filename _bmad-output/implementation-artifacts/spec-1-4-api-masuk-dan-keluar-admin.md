---
title: 'Story 1.4: API masuk dan keluar admin'
type: 'feature'
created: '2026-11-03'
status: 'done'
baseline_commit: '8773c926909dfb4dd43e6609f05f34ecf8be09c0'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Belum ada akun admin, sesi masuk, maupun penjaga rute `/api/admin/*`, sehingga story admin berikutnya tidak punya auth (FR1, NFR8, R-011); error non-`AppError` juga masih keluar tanpa envelope AD-8 (deferred dari 1.3).

**Approach:** Migrasi `001` (`admins`, `admin_sessions`), use-case `auth` (upsert admin scrypt, login, baca sesi, logout), rute `/api/auth/{login,session,logout}`, plugin `/api/admin` ber-hook auth, penolakan 415 untuk tulis non-JSON, envelope untuk semua error, serta skrip `admin:create` (interaktif) dan `seed:demo` (dari env) yang memakai use-case yang sama (AD-8, AD-9, B-2(c)).

## Boundaries & Constraints

**Always:** Password `scrypt` (`node:crypto`, salt acak 16 byte per akun, keylen 64, bandingkan `timingSafeEqual`); email unik dan tak dikenal juga menjalankan scrypt (waktu setara). Token `randomBytes(32)` base64url; DB hanya menyimpan SHA-256 hex; `expires_at = ctx.nowIso + 12 jam`, sesi valid bila `expires_at > now`. Cookie `kelasku_session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` hanya bila `COOKIE_SECURE=true`. Semua tulis lewat `withWriteTx` di `services/`; scrypt dihitung di luar transaksi. `normalizeEmail` (trim + lowercase) sebelum simpan/cari. Kolom `*_at` dengan `CHECK` GLOB AD-15. Log, stdout skrip, dan body error tidak memuat email, password, token, atau isi cookie.

**Never:** Tanpa UI (Story 1.5); tanpa dependensi baru; tanpa rate limiting, lupa password, peran admin, atau rute pendaftaran admin; tanpa mengubah migrasi/berkas fixture story 1.3.

**Keputusan (asumsi dry run):**
- Body login tidak valid (bukan objek, email/password kosong) → 400 `validation_error` dengan `fields` (pesan di `src/shared/schemas.ts`); bukan 401.
- `POST/PATCH/PUT` ke rute `/api/*` yang ada tanpa `Content-Type: application/json` (parameter `charset` boleh, header kosong ditolak) → 415; rute tak dikenal tetap 404.
- Error non-`AppError`: 415 Fastify → `unsupported_media_type`; 404 → `not_found`; 4xx lain → 400 `validation_error`; selainnya → 500 `internal_error` "Terjadi kesalahan di server. Coba lagi." (dicatat di log, pesan mentah tidak dikirim).
- Logout selalu 200 `{ loggedOut: true }` dan mengosongkan cookie, juga tanpa sesi valid (idempoten). Login menghapus sesi kedaluwarsa semua admin di transaksi yang sama.
- `admin:create`: password minimal 8 karakter, diminta sekali; TTY → input disembunyikan; non-TTY → baris pertama stdin. Keluaran tanpa email: "Akun admin dibuat." / "Password akun admin diperbarui.".
- `seed:demo` pada story ini hanya membuat/memperbarui admin seed (kelas demo menyusul Story 1.7); menolak (exit 1) bila `SEED_ADMIN_EMAIL` atau `SEED_ADMIN_PASSWORD` kosong. E2E memakai kredensial uji tetap di `e2e/support/admin.ts` (bukan rahasia; DB e2e dibuang).
- Skrip berjalan via `node --env-file-if-exists=.env --import tsx scripts/<nama>.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login sukses | `{ email: " Rina@Lembaga.id ", password }` benar | 200 `{ email: "rina@lembaga.id" }` + `Set-Cookie`; satu baris sesi berisi hash | N/A |
| Kredensial salah | email tak dikenal / password salah | 401 envelope identik `invalid_credentials` | tanpa baris sesi |
| Sesi | cookie valid / tanpa / tak dikenal / `now ≥ expires_at` | 200 `{ email }` / 401 `unauthorized` ×3 | envelope AD-8 |
| Rute admin | tanpa sesi valid | 401 `unauthorized` | handler tidak jalan |
| Logout | cookie valid lalu token lama dipakai | 200, baris terhapus, cookie dikosongkan; berikutnya 401 | N/A |
| Tulis non-JSON | `POST /api/auth/login` `text/plain` / tanpa header | 415 `unsupported_media_type` | N/A |
| JSON rusak | `{` dengan `application/json` | 400 `validation_error` | envelope |
| Throw tak terduga | handler melempar `Error('SELECT secret')` | 500 `internal_error` | teks mentah tidak di body |
| `admin:create` ulang | email sama, password baru | satu baris; password lama ditolak, baru diterima | N/A |

</frozen-after-approval>

## Code Map

- `src/server/data/db.ts` -- `withWriteTx(db, clock, fn)`, `Tx`, `WriteCtx`, `createDb`, `migrate`; pakai ulang, jangan ubah.
- `src/server/clock.ts` -- tambah helper `addHoursIso(iso, hours)` di sini (fitness test melarang `new Date(` di `services/`/`domain/`).
- `src/shared/errors.ts` -- `invalid_credentials`, `unauthorized`, `unsupported_media_type`, `validation_error` sudah ada; tambah `internal_error` 500.
- `src/server/services/index.ts` -- `Services` kini `Record<never, never>`; jadi `{ auth: AuthService }`.
- `src/server/http/app.ts` -- error handler hanya `AppError`; tambah cookie, hook 415, rute auth, plugin admin, fallback envelope.
- `src/server/http/app.test.ts` -- POST `/api/tidak-ada` tanpa content-type harus tetap 404 (hook 415 memakai `request.is404`).
- `src/server/main.ts` -- baca `COOKIE_SECURE` lalu teruskan ke `buildApp`.
- `test/helpers/test-db.ts`, `test-server.ts` -- `createTestDb()` kini menerapkan migrasi `001`; pakai untuk test services/HTTP.
- `src/server/main.test.ts` -- pola spawn `tsx` (contoh untuk test skrip).
- `playwright.config.ts` -- TODO B-2 di `webServer.command`; `e2e/support/fixtures.ts` -- tempat fixture `adminLogin`.
- `src/architecture.test.ts` -- tidak diubah; `scripts/` tidak boleh mengimpor `better-sqlite3`.

## Tasks & Acceptance

**Execution:**
- [x] `src/server/data/migrations/001_admin_auth.sql` -- `admins(id, email UNIQUE, password_hash, password_salt, created_at, updated_at)`, `admin_sessions(id, admin_id FK CASCADE, token_hash UNIQUE, created_at, expires_at)` + indeks `admin_id`; CHECK GLOB AD-15.
- [x] `src/shared/email.ts`, `schemas.ts`, `dto.ts`, `errors.ts` (+ test) -- `normalizeEmail`, `loginRequestSchema`, `AdminSessionResponse`, `LogoutResponse`, `internal_error`.
- [x] `src/server/clock.ts` -- `addHoursIso`.
- [x] `src/server/data/admins-repo.ts` -- SQL berparameter untuk admin dan sesi.
- [x] `src/server/services/auth.ts` + `index.ts` + `auth.test.ts` -- use-case `upsertAdmin`, `login`, `getSession`, `logout`; test DB nyata (salt beda per akun, idempoten, kedaluwarsa via clock palsu).
- [x] `src/server/http/{validation.ts,admin-plugin.ts,routes/auth.ts,app.ts}` + `main.ts` -- parse zod → `validation_error`, plugin auth `/api/admin` (dekorasi `request.admin`), rute auth, hook 415, fallback envelope, `cookieSecure`.
- [x] `src/server/http/auth.test.ts` -- seluruh matriks via `inject`; rute admin uji didaftarkan, daftar rute dari hook `onRoute` (P0-008); log tertangkap tanpa password/token/cookie.
- [x] `scripts/cli.ts`, `scripts/admin-create.ts`, `scripts/seed-demo.ts` + `scripts/*.test.ts` -- buka DB + migrasi + services; test spawn dengan stdin/env.
- [x] `package.json` -- skrip `admin:create`, `seed:demo`.
- [x] `playwright.config.ts`, `e2e/support/{admin.ts,fixtures.ts}`, `e2e/auth-api.spec.ts` -- hapus DB e2e → seed → start; fixture `adminLogin`; test API login/sesi/logout.
- [x] `test/README.md` -- perbarui baris helper `adminLogin`/`seed:demo`.

**Acceptance Criteria:**
- Given rute admin uji di bawah `/api/admin`, when setiap rute hasil `onRoute` dipanggil tanpa sesi valid, then semuanya 401 envelope dan handler tidak dijalankan.
- Given `npm run admin:create -- --email rina@lembaga.id` dengan password di stdin dua kali (berbeda), then `admins` berisi satu baris dan hanya password terakhir yang bisa login.
- Given `SEED_ADMIN_*` kosong, when `seed:demo`, then exit ≠ 0 tanpa menyentuh DB; terisi → admin bisa login.
- Given `npm test`, `npm run typecheck`, `npm run build && npm run test:e2e` (test API), then hijau.

## Implementation Notes

- `src/server/config.ts` (baru): `readDatabasePath` / `readCookieSecure` dipakai bersama `main.ts` dan `scripts/cli.ts` agar skrip dan server selalu membuka DB yang sama.
- `src/server/http/session-cookie.ts` (baru): nama dan atribut cookie di satu tempat. Cookie tanpa `Expires`/`Max-Age` (cookie sesi browser); kedaluwarsa 12 jam ditegakkan server. Alasan: `expires_at` mengikuti clock palsu di e2e, sehingga `Expires` absolut bisa langsung basi di browser.
- Hook 415 dipasang sebagai `preParsing` (bukan `onRequest`) agar hook auth `onRequest` plugin admin berjalan lebih dulu: tulis non-JSON tanpa sesi ke `/api/admin/*` tetap 401. Logout pun wajib `Content-Type: application/json` dengan body `{}` (body JSON kosong → 400 dari parser Fastify).
- `buildApp` mendapat opsi `adminRoutes` (rute uji di dalam plugin auth) dan `onRoute` (inventaris rute P0-008). Rute admin produksi didaftarkan lewat `ADMIN_ROUTES` di `admin-plugin.ts`.
- `upsertAdmin` memvalidasi dengan `adminCredentialsSchema` (password ≥ 8, email berbentuk `x@y`) dan, saat memperbarui password, menghapus semua sesi admin itu. `login` membaca ulang `password_hash` di dalam transaksi sebelum membuat sesi.
- Body login bukan objek dipraproses menjadi `{}` sehingga `fields` selalu menyebut `email`/`password`; isu tanpa path (bila ada) memakai kunci `body`.
- Test fixture `adminLogin` berbasis browser dipisah ke `e2e/admin-session.spec.ts` agar `-g "API|auth"` tidak meluncurkan Chromium (terblokir `libnspr4` di mesin ini); akan jalan di CI.
- Test lama yang disesuaikan: `app.test.ts` (POST uji kini mengirim JSON karena aturan 415), `services.test.ts` (`Services` kini `{ auth }`), judul satu test `db.test.ts`.

## Spec Change Log

## Review Triage Log

| # | Sumber | Temuan | Verdict | Bukti | Rute |
|---|--------|--------|---------|-------|------|
| 1 | blind | `admin:create`/`seed:demo` butuh `tsx` (devDependency) di produksi | false | Spine §Deployment: produksi `npm ci && npm run build` (devDependency ikut terpasang); tabel versi menetapkan tsx untuk skrip. | tolak |
| 2 | blind | Logout tanpa body / body JSON kosong → 415/400, cookie tak dikosongkan | low | Keputusan beku: tulis tanpa `Content-Type` → 415; klien Story 1.5 selalu mengirim `{}`. Jarang ditemui, perbaikan menambah cabang. | tolak |
| 3 | blind, edge, vgap | 4xx lain (mis. 413) → 400 `validation_error` | false | Persis keputusan beku "4xx lain → 400 `validation_error`". | tolak |
| 4 | edge | 5xx non-`AppError` diringkas jadi 500 | false | `database_busy` adalah `AppError` dan lolos utuh; keputusan beku "selainnya → 500 `internal_error`". | tolak |
| 5 | blind, edge | `DELETE` tidak masuk penjaga 415 | false | Keputusan beku membatasi ke `POST/PATCH/PUT`; DELETE tanpa body. | tolak |
| 6 | vgap | Tidak ada test 415 untuk PUT/PATCH (dan tulis non-JSON bersesi) | medium | Pre-verified: `WRITE_METHODS` bisa menyusut ke POST tanpa test gagal. | patch — `it.each(['POST','PUT','PATCH'])` di `auth.test.ts` |
| 7 | blind, vgap | `readCookieSecure`/`addHoursIso` tanpa unit test | medium | Pre-verified: `main.ts`/parsing `COOKIE_SECURE` bisa rusak tanpa test gagal. | patch — `src/server/config.test.ts`; jalur `main.ts` → Story 4.7 |
| 8 | blind | Cek privasi log email peka huruf besar | low | Login pertama mengirim email huruf besar; `not.toContain(lowercase)` bisa lolos. Perbaikan langsung. | patch — banding lowercase |
| 9 | blind | `seed:demo` tidak menolak DB produksi | low | Butuh `SEED_ADMIN_*` diisi eksplisit (kosong di `.env.example`); jarang, perbaikan menambah guard. | tolak |
| 10 | blind | Parameter scrypt tak tercatat; panjang password login tanpa batas | low | Belum ada kebutuhan rotasi parameter; scrypt atas 1 MB tetap murah (pra-hash PBKDF2). | tolak |
| 11 | blind, edge | Prompt tersembunyi `admin:create`: escape sequence/surrogate ikut tersimpan, tanpa konfirmasi | low | Konfirmasi: keputusan beku "diminta sekali". Tombol panah di prompt password jarang; perbaikan menambah guard. | tolak |
| 12 | blind | Spine §Konfigurasi belum memuat `SEED_ADMIN_*` dan kredensial e2e tetap | medium | Spine baris Konfigurasi hanya 5 env; perubahan arsitektur wajib lewat `bmad-architecture`. | defer |
| 13 | blind | Login tak merotasi cookie lama; 401 sesi tak menghapus cookie basi | low | Banyak sesi per admin sah; sesi lama tetap kedaluwarsa 12 jam. | tolak |
| 14 | blind | AC e2e penuh belum jalan (Chromium terblokir `libnspr4`) | medium | `e2e/admin-session.spec.ts` belum pernah dijalankan di mesin ini; test API lulus. | defer (CI) |
| 15 | blind | `login` di service tanpa validasi input | false | Satu-satunya pemanggil (handler) mem-parse `loginRequestSchema`; tidak ada jalur lain yang tertunjuk. | tolak |
| 16 | blind | `request.admin` bertipe nullable | low | Tidak ada handler produksi; tanpa kerugian bernama. | tolak |
| 17 | edge | `SEED_ADMIN_PASSWORD` spasi saja diterima | low | Nilai dari operator; ≥ 8 karakter tetap ditegakkan. | tolak |
| 18 | edge | Email tanpa normalisasi Unicode NFC | low | `normalizeEmail` = trim + lowercase sesuai AD-5/AGENTS.md. | tolak |
| 19 | edge | Logout `database_busy` → cookie tak dikosongkan | low | Butuh kontensi tulis saat logout; klien bisa ulang. | tolak |
| 20 | vgap | Pengecekan ulang password di dalam transaksi login tanpa test | medium | Pre-verified; butuh seam/barrier `worker_threads`. | defer |
| 21 | vgap | `readHiddenLine` (TTY) tanpa test | medium | Pre-verified; butuh harness pseudo-terminal yang tidak ada di arsitektur. | defer |

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau
- `npm run build && npx playwright test e2e/auth-api.spec.ts e2e/smoke.spec.ts -g "API|auth"` -- expected: test API hijau (browser terblokir `libnspr4` di mesin ini)
