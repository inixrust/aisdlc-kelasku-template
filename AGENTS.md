<!-- bmad:context -->
<!-- Diverifikasi 2026-11-03 terhadap cce6f6a. Dikelola oleh bmad-project-context; isi di dalam block ini diganti saat refresh. Simpan apa pun yang ingin dipertahankan di luar penanda. -->

## Kelasku

Aplikasi web pendaftaran dan kehadiran kelas pelatihan untuk satu lembaga. Stack: TypeScript, Node.js, React + Vite, Fastify, better-sqlite3 (satu berkas SQLite lokal), Vitest + Playwright, satu package npm. Belum ada kode. Intent produk di `docs/intent-kelasku.md`, arsitektur di `_bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md`, epik dan cerita di `_bmad-output/planning-artifacts/epics.md`.

## Kebijakan

- Semua perubahan masuk ke `main` lewat pull request; jangan push langsung ke `main`.
- Pesan commit wajib Conventional Commits berbahasa Inggris, mis. `feat: promote waitlist on cancellation`.
- Jangan pernah commit berkas `.env` atau kredensial; simpan nilai rahasia hanya di `.env` lokal.
- Jalankan seluruh test dan pastikan hijau sebelum commit.
- Jangan ubah `_bmad/` atau `.claude/skills/` secara langsung; kustomisasi BMad hanya lewat `_bmad/custom/`.
- Jangan ubah `docs/intent-kelasku.md` karena sudah dibekukan; perubahan requirement lewat dokumen perencanaan BMad di `_bmad-output/planning-artifacts/`.
- Jangan tambahkan layanan cloud (DB, hosting, auth eksternal); data hanya di berkas SQLite lokal.
- Teks antarmuka berbahasa Indonesia; identifier kode dan nama berkas berbahasa Inggris.
- Jangan bangun fitur non-goal MVP (pembayaran, SSO, notifikasi, multi-tenant, PDF sertifikat, ujian); daftarnya di `docs/intent-kelasku.md`.

## Letak sesuatu

- Aturan bisnis R1–R7 dan non-goals: `docs/intent-kelasku.md`.
- Sebelum menulis berkas di `src/`, `scripts/`, atau `e2e/`, baca `ARCHITECTURE-SPINE.md` (path di atas); AD-1–AD-20 mengikat. Jangan memilih library, struktur, atau pola lain; perubahan arsitektur lewat skill `bmad-architecture`.
- Halaman dan komponen di `src/client/`: ikuti `DESIGN.md` dan `EXPERIENCE.md` di `_bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/`.

## Menjalankan dan memverifikasi

- TODO (verifikasi saat refresh setelah scaffolding): `package.json` dan `.nvmrc` belum ada. Pakai npm saja (satu `package-lock.json`), jangan pnpm/yarn/bun. Node target 24 LTS lewat `.nvmrc` (`engines` ≥ 22.22.0); baca versinya dari berkas itu, bukan dari `node -v`. Skrip yang diputuskan: `dev`, `build`, `start`, `test`, `test:e2e`, `typecheck`, `admin:create`, `seed:demo`, `backup`; baca bentuk persisnya di `package.json`, jangan menebak.
- Jalankan `seed:demo` hanya saat server mati; skrip CLI lain menulis hanya lewat use-case yang sama dengan server.

## Konvensi yang berbeda dari default

- Setiap test aturan bisnis menyebut ID aturannya di nama `describe`/`it`, mis. `it('R3: waitlist is FIFO by registration order')`.
- Impor hanya mengikuti arah client → shared; http → services, shared; services → domain, data, shared; domain, data → shared. Klien ke server hanya lewat HTTP. `domain/` murni tanpa I/O dan jam. Hanya `src/server/data/` yang mengimpor `better-sqlite3`; jangan pakai ORM atau query builder, tulis SQL berparameter (`?`/`@name`) di repository.
- R1, R2, R4, dan R7 dijaga dalam satu transaksi `withWriteTx` (`BEGIN IMMEDIATE`) yang dibuka hanya oleh use-case di `src/server/services/`. Tx-step menerima `tx` dan tidak membuka transaksi. Semua baca yang mendasari keputusan (status kelas, kuota, `COUNT(*)` Terdaftar, antrean) dilakukan di dalam callback sinkron tanpa `await`. Handler tidak memanggil repository. Validasi di UI atau handler saja masih meloloskan dua pendaftaran yang bersamaan.
- Satu jalur per aturan: promosi hanya lewat `promoteFromWaitlist`, pembatalan hanya lewat `cancelRegistration`, dan `assertClassOpen` jadi baca pertama di setiap use-case tulis. Hanya `registrations-repo.ts` yang menulis tabel `registrations`; setiap `UPDATE` status memakai `AND status = @expected` dan memeriksa `changes === 1`; jangan `DELETE`.
- "Hari ini" (R5, status Selesai, tanggal sesi) hanya dari `Clock` / `ctx.today` di zona Asia/Jakarta. Jangan pakai `new Date()`, `Date.now()`, atau `toISOString().slice(0,10)` di `domain/` dan `services/`; klien memakai `today` dari respons API.
- Kolom `*_at` diisi dari `ctx.nowIso`; jangan pakai `CURRENT_TIMESTAMP`, `datetime('now')`, atau `DEFAULT` waktu di SQL. Urutan antrean (R3) dan promosi memakai `registrations.id`, bukan `created_at`.
- Status kelas, terisi/kuota, posisi antrean, dan kelayakan dihitung saat baca oleh `src/server/domain/`; jangan simpan nilai turunan atau kolom counter. Klien tidak menghitung aturan atau mengurutkan ulang, hanya memformat nilai dari server.
- R6 dihitung dengan bilangan bulat: layak bila `hadir * 5 >= totalSesi * 4` (4 sesi → 4 hadir, 5 sesi → 4 hadir). Jangan pakai `0.8 * n`, karena `0.8 * 3` menghasilkan `2.4000000000000004`.
- Normalisasi email dengan `normalizeEmail` dari `src/shared/` sebelum setiap simpan dan cari. Email tidak pernah muncul di URL, query string, atau log; nama peserta, password, dan token juga tidak masuk log.
- Ubah skema hanya dengan berkas migrasi baru `src/server/data/migrations/NNN_description.sql`; jangan edit migrasi yang sudah di-merge ke `main` dan jangan `CREATE TABLE` di luar migrasi.
- Daftarkan kode error baru beserta pesan Indonesianya di `src/shared/errors.ts`, bukan string bebas di handler. Hasil bisnis sah (Daftar tunggu, sudah aktif, sudah dibatalkan) adalah HTTP 200.
- Di `src/client/`: label status dari `src/shared/glossary.ts`, format tanggal dari `src/shared/format.ts`, warna hanya `var(--…)` dari `src/client/styles/tokens.css`; jangan pakai UI library komponen atau framework CSS.
- Test `services/` dan `data/` memakai berkas SQLite sementara yang nyata, jangan mock DB. Test konkurensi R1, R2, R4, R7 membuka minimal dua koneksi dari `worker_threads`.

<!-- /bmad:context -->
