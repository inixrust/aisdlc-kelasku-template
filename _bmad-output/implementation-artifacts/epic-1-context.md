# Epic 1 Context: Kelas & Pendaftaran Berkuota (R1–R3, R7)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Admin bisa masuk, membuat dan mengubah kelas berkuota, melihat tabel kelas dan isi setiap kelas, serta membagikan tautan pendaftaran. Peserta mendaftar sendiri dari ponsel tanpa akun dan langsung tahu statusnya (Terdaftar atau Daftar tunggu #N). Sistem menjamin kuota tidak pernah terlampaui (R1), satu pendaftaran aktif per email (R2), antrean FIFO (R3), dan kuota tidak bisa diturunkan di bawah jumlah Terdaftar (R7), termasuk saat permintaan bersamaan. Epik ini juga meletakkan fondasi repo, data, waktu, dan test untuk semua epik berikutnya.

## Stories

- Story 1.1: Kerangka repositori yang bisa dijalankan dan diuji
- Story 1.2: Waktu Jakarta, format tanggal, glosarium, dan registri error bersama
- Story 1.3: Fondasi data: koneksi SQLite, migrasi, transaksi tulis, dan harness konkurensi
- Story 1.4: API masuk dan keluar admin
- Story 1.5: Halaman masuk admin dan kerangka UI bersama
- Story 1.6: Membuat kelas dan membagikan tautan pendaftaran
- Story 1.7: API pendaftaran berkuota dengan daftar tunggu FIFO (R1, R2, R3)
- Story 1.8: Halaman pendaftaran peserta yang ramah ponsel
- Story 1.9: Tabel kelas admin
- Story 1.10: Daftar pendaftaran di halaman kelas admin
- Story 1.11: API ubah kelas dengan batas kuota (R7) dan promosi saat kuota naik
- Story 1.12: Halaman ubah kelas

## Requirements & Constraints

- Satu berkas SQLite lokal; tanpa layanan cloud (DB, hosting, auth). Produksi = satu instance di server kecil lembaga.
- R1: Terdaftar hanya bila jumlah Terdaftar < kuota **dan** antrean kosong; 20 permintaan HTTP serentak ke kelas kuota 5 → tepat 5 Terdaftar, 15 Daftar tunggu posisi 1–15, tanpa 5xx.
- R2: satu pendaftaran aktif per email ternormalisasi (trim + lowercase) per kelas; duplikat bersamaan → satu baris, keduanya 200.
- R3: antrean FIFO berdasarkan `registrations.id`; posisi konsisten di semua tampilan.
- R7: kuota < jumlah Terdaftar ditolak "Kuota minimal N (jumlah terdaftar saat ini)"; kuota naik mempromosikan kepala antrean secara atomik.
- Kelas Selesai sejak 00.00 WIB pada tanggal sesi terakhir (`max(session_date) <= today`) — PRD revisi menang atas spine (`<`).
- Pola bukti konkurensi: > 1 koneksi (`worker_threads`), tanpa 5xx, mutation check, 50 ulangan per run.
- "Hari ini" selalu Asia/Jakarta, lepas dari zona server/browser.
- Aksesibilitas WCAG 2.1 AA; teks UI Indonesia; halaman peserta 360 px tanpa gulir horizontal; admin 1366×768.
- Setiap test aturan bisnis menyebut ID aturan di nama `describe`/`it`.

## Technical Decisions

- Stack versi persis: Node 24.22.2 (`.nvmrc`, `engines >=22.22.0`), TS 6.0.3, React 19.3.1, Vite 8.3.5, @vitejs/plugin-react 6.2.1, React Router 8.5.1, Fastify 5.12.8, @fastify/static 10.1.8, @fastify/cookie 11.1.5, better-sqlite3 13.0.3, zod 4.6.7, tsx 4.23.15, Vitest 5.0.5, @playwright/test 1.64.1, @axe-core/playwright 4.14.0. Hanya npm.
- Lapisan satu arah: client → shared (+HTTP); http → services, shared; services → domain, data, shared; domain, data → shared; shared tidak mengimpor apa pun.
- Satu proses Fastify melayani `/api/*` dan statis `dist/client`; `/api/*` tak dikenal → 404 envelope `{ error: { code, message, fields? } }`; path lain → `index.html`.
- Hanya `src/server/data/` mengimpor `better-sqlite3`; SQL berparameter; tanpa ORM. DB: WAL, `foreign_keys=ON`, `busy_timeout=5000`.
- Tulis = satu `withWriteTx` (`BEGIN IMMEDIATE`) dibuka use-case; `ctx = { nowIso, today }` dibaca setelah lock; `SQLITE_BUSY` → 503 `database_busy`.
- Waktu hanya dari `Clock` (`src/server/clock.ts`); `new Date()`/`Date.now()` dilarang di `domain/` dan `services/`; `KELASKU_FAKE_NOW` hanya saat `NODE_ENV=test`.
- Skema hanya lewat migrasi `NNN_description.sql`; tanpa fungsi waktu SQL; `*_at` dari `ctx.nowIso`.
- Kode error + pesan Indonesia + status HTTP di `src/shared/errors.ts`; DTO di `src/shared/dto.ts`; nilai turunan dihitung di `domain/`, klien hanya memformat.
- Konfigurasi hanya env (`PORT`, `DATABASE_PATH`, `COOKIE_SECURE`, `NODE_ENV`, `KELASKU_FAKE_NOW`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) via `node --env-file-if-exists=.env`.
- Test: Vitest `TZ=UTC` (berkas `*.tz.test.ts` juga di Asia/Jakarta & Asia/Jayapura); services/data atas berkas SQLite nyata; HTTP lewat `fastify.inject()`; Playwright atas build produksi, `timezoneId: 'UTC'`, axe di setiap permukaan.
- Fitness test arsitektur statis (HP-3) menjaga aturan impor dan larangan waktu.

## UX & Interaction Patterns

- Tanpa UI library/framework CSS; token DESIGN.md → `src/client/styles/tokens.css`, hanya `var(--…)`.
- Komponen bersama sekali di `src/client/components/` (PageLayout, AdminLayout, Badge, ResultPanel, DataTable, ConfirmDialog, Toast, Field, ErrorSummary, CopyLinkButton).
- Label status dari `src/shared/glossary.ts`; tanggal dari `src/shared/format.ts` ("Senin, 9 Nov 2026").
- React Router data mode (`createBrowserRouter`); data via `src/client/api` (fetch wrapper satu-satunya pemanggil `fetch`).

## Cross-Story Dependencies

- Story berurutan; tiap story hanya bergantung pada story sebelumnya. 1.1–1.3 adalah fondasi (scaffold, clock/format/errors, data + harness konkurensi) untuk semua story lain.
- Pembaruan spine (AD-6 `<=`) dijadwalkan sebelum Story 1.6.
- Epik 2 memakai `promoteFromWaitlist` dari Story 1.11.
