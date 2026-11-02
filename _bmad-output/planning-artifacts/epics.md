---
status: final
stepsCompleted: [1, 2, 3, 4]
updated: 2026-11-03
revision: "Diselaraskan dengan PRD revisi 2026-11-03 (C1, C2, H2–H6, NFR-6/NFR-8 HTTPS)"
inputDocuments:
  - docs/intent-kelasku.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/EXPERIENCE.md
  - _bmad-output/test-artifacts/test-design/aisdlc-kelasku-handoff.md
  - _bmad-output/test-artifacts/test-design-architecture.md
---

# Kelasku - Epic Breakdown

## Overview

Dokumen ini memecah kebutuhan dari PRD, UX (DESIGN.md + EXPERIENCE.md), Architecture Spine, dan handoff test design Kelasku menjadi epik dan story yang bisa diimplementasikan. Setiap story berukuran kecil: satu sesi `bmad-build` per story. Story dikerjakan berurutan; setiap story hanya bergantung pada story sebelumnya.

**Definition of Done bersama (berlaku untuk setiap story, tidak diulang di AC):**

- `npm test`, `npm run typecheck`, dan (bila sudah ada) `npm run test:e2e` hijau sebelum commit; commit Conventional Commits berbahasa Inggris lewat PR, tidak langsung ke `main`.
- Setiap test aturan bisnis menyebut ID aturannya di nama `describe`/`it` (mis. `it('R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered')`).
- **Pola bukti konkurensi (PRD FR-8, berlaku untuk R1, R2, R4, R7):** operasi benar-benar bersamaan lewat lebih dari satu koneksi ke berkas DB (harness `runConcurrently`, Story 1.3); tidak ada respons 5xx atau error; mutation check (varian tanpa atomisitas membuat test gagal); skenario serentak diulang 50 kali di setiap run CI dan semuanya lulus.
- Aturan lapisan, AD-1..AD-20, dan konvensi Architecture Spine dipatuhi; fitness test arsitektur (Story 1.1) tetap hijau.
- Kode error baru masuk `src/shared/errors.ts` lengkap dengan pesan Indonesia dan status HTTP; tipe request/response baru masuk `src/shared/dto.ts`.
- Story yang mengubah skema menambah berkas migrasi bernomor baru; berkas migrasi yang sudah di-merge tidak diedit.
- Story UI: teks Indonesia sesuai Glosarium dan Voice & Tone EXPERIENCE.md; hanya token `var(--…)`; komponen bersama dipakai ulang, tidak dibuat ulang; setiap permukaan baru punya test Playwright dengan pemeriksaan `@axe-core/playwright` tanpa pelanggaran; halaman peserta diuji di lebar 360 px tanpa gulir horizontal, halaman admin di 1366×768.
- Story UI menjalankan rangkaian `ui-consistency` (finding-patterns → planning → implementing → verifying) sebelum diserahkan.

**Asumsi yang diambil di dokumen ini (dry run; dikonfirmasi saat sprint planning):**

- A-1: Blocker Sprint 0 dari test design (B-1, B-2, HP-1, HP-2, HP-3, harness konkurensi) dijadikan story fondasi di awal Epik 1, bukan epik teknis terpisah.
- A-2: FR14 dibagi dua: status dan pembatalan di Epik 2, "Hadir x dari y sesi" + kelayakan di Epik 4 (setelah presensi dan fungsi R6 ada). Sampai Epik 4, kartu status hanya menampilkan status.
- A-3: Bagian FR3 yang bergantung pada presensi (tanggal berpresensi terkunci, `session_has_attendance`, konfirmasi `confirmation_required`) dikerjakan di Story 3.4, karena tabel presensi baru lahir di Story 3.1.
- A-4: Tautan "Lihat halaman status" di hasil pendaftaran disembunyikan sampai Story 2.2 (EXPERIENCE.md › Epik 1).
- A-5: FR SHOULD (FR17, FR18, FR20) menjadi story bertanda "(SHOULD)" di akhir epiknya (di Epik 4 sebelum story kesiapan rilis) agar mudah dipotong tanpa memutus story lain.
- A-6: E2E memakai Playwright vanilla; `@seontechnologies/playwright-utils` (HP-4) tidak ditambahkan karena tidak ada di tabel Stack spine.
- A-7: Keputusan siklus kelas di PRD §4.2 revisi dipakai apa adanya: pembatalan kapan saja selama Dibuka; kelas **Selesai sejak 00.00 WIB pada tanggal sesi terakhir** (`max(session_date) <= today`), sehingga pendaftaran, pembatalan, dan promosi ditutup sepanjang hari sesi terakhir, sedangkan presensi tetap terbuka. `[NOTE FOR PM]` PRD (termasuk akibat bagi kelas satu sesi) belum dikonfirmasi Rina.
- A-8: Status HTTP untuk kode error yang belum ditetapkan spine (HP-2): `validation_error` 400; `class_not_found`, `registration_not_found`, `session_not_found` 404; konflik aturan bisnis (`quota_below_registered`, `registration_closed`, `class_finished`, `session_has_attendance`, `session_not_yet_open`) 409, bersama `confirmation_required` dan `roster_changed` yang sudah 409 di spine.
- A-9: **PRD revisi 2026-11-03 menang atas dokumen hilir yang belum diperbarui** (memlog PRD: arsitektur dan UX sengaja tidak disentuh). Drift yang diketahui: (a) spine AD-6 "Selesai bila `max(session_date) < today`" → epics memakai `<=`; (b) DESIGN.md/EXPERIENCE.md "checkbox Hadir" → epics memakai kontrol tiga keadaan Hadir/Tidak hadir/Belum dicatat (grup radio); (c) EXPERIENCE.md "tanpa paginasi sampai 50 baris" → tampilan bawaan 30 hari + "Tampilkan semua kelas Selesai"; (d) handoff test design "burn-in ×20" → 50 ulangan per run CI; (e) spine "HTTPS bergantung jaringan lembaga" → HTTPS wajib di produksi. Tindak lanjut: perbarui spine dan UX (`bmad-correct-course`, atau mode update `bmad-architecture`/`bmad-ux`) sebelum Story 1.6, 3.3, dan 4.7 di-build.
- A-10: HTTPS (NFR-6/NFR-8) diterminasi oleh reverse proxy di server lembaga yang sama (mis. Caddy atau nginx), yang juga mengalihkan HTTP → HTTPS; proses Fastify tetap mendengar HTTP di `127.0.0.1` dan berjalan dengan `COOKIE_SECURE=true`. Ini opsi paling sederhana yang tidak menambah dependensi aplikasi dan sejalan dengan catatan spine ("aplikasi siap lewat `COOKIE_SECURE`"); konfirmasi di spine sebelum Story 4.7.
- A-11: Bukti konkurensi dua lapis: (1) test multi-koneksi `worker_threads` atas `createServices` (race nyata di SQLite), dan (2) 20 permintaan HTTP serentak ke server Fastify yang benar-benar `listen` di port acak (bukan `inject`), untuk membuktikan "tanpa 5xx" end-to-end. Mutation check dijalankan otomatis di setiap run: test menyuntik varian use-case yang memanggil tx-step di luar `withWriteTx` dan memastikan assertion R-nya gagal.
- A-12: Test sensitif waktu (clock dan R5) diberi akhiran `*.tz.test.ts` dan dijalankan `npm test` tiga kali, dengan `TZ=UTC`, `TZ=Asia/Jakarta`, dan `TZ=Asia/Jayapura`; test lain tetap `TZ=UTC` (HP-1).
- A-13: Di API presensi, entri `present: null` tidak menulis apa pun; catatan presensi yang sudah tersimpan tidak pernah dihapus (tidak bisa kembali ke Belum dicatat), sesuai asumsi PRD FR-15.
- A-14: Potongan cakupan PRD §7.1: potongan SHOULD = story bertanda "(SHOULD)"; potongan kedua ditandai "✂2" pada AC yang boleh ditunda (lihat bagian Potongan cakupan di bawah).

**Potongan cakupan (PRD §7.1).** Keputusan diambil di akhir hari ke-3: bila Story 1.1–1.12 belum selesai dengan test konkurensi R1 dan R2 hijau sesuai pola bukti, potongan SHOULD dan potongan kedua diterapkan sekaligus; bila Epik 1 selesai tetapi Story 2.1 belum dimulai, hanya potongan SHOULD. Keputusan dicatat di memlog proyek.

- Potongan SHOULD: Story 3.5, 3.6, 4.5.
- Potongan kedua (✂2): tampilan bagian Dibatalkan di Story 1.10 (data pembatalan tetap disimpan); dialog konfirmasi perubahan tanggal di Story 3.4 (penguncian tanggal berpresensi tetap); benchmark p95 di Story 4.6 diganti smoke test kinerja; axe otomatis dibatasi ke halaman pendaftaran, halaman status, pembatalan, dan formulir presensi + uji keyboard manual ketiga alur itu.
- Tidak pernah dipotong: R1–R7 beserta test-nya (NFR-1, NFR-9), HTTPS (Story 4.7), kontrol presensi tiga keadaan (Story 3.3).

## Requirements Inventory

### Functional Requirements

FR1: Admin masuk dengan email + password akun seed dan keluar; kredensial salah menampilkan "Email atau password salah" tanpa menyebut bagian yang salah; halaman admin tanpa sesi masuk dialihkan ke halaman masuk; aksi admin di API tanpa sesi masuk ditolak HTTP 401; setelah keluar halaman admin tidak bisa dibuka tanpa masuk ulang.
FR2: Admin membuat kelas dengan judul (1–120 karakter setelah trim), minimal satu tanggal sesi tanpa duplikat (pesan menyebut tanggalnya), kuota bilangan bulat ≥ 1, dan minimal satu tanggal **setelah** hari ini (WIB), karena kelas yang tanggal sesi terakhirnya hari ini atau lebih awal lahir Selesai; tanggal lain boleh hari ini atau di masa lalu; setelah tersimpan kelas muncul di tabel kelas dan punya tautan pendaftaran.
FR3: Admin mengubah judul, menambah/menghapus tanggal sesi, dan mengubah kuota. R7: kuota < jumlah Terdaftar ditolak dengan "Kuota minimal N (jumlah terdaftar saat ini)" (berlaku juga bila pendaftaran masuk di antara buka formulir dan simpan); validasi FR2 berlaku; kuota naik mempromosikan min(kuota baru − Terdaftar, panjang antrean) teratas dalam operasi atomik yang sama (R3); tanggal sesi yang sudah punya presensi tidak bisa dihapus/diubah; perubahan tanggal saat presensi sudah ada butuh konfirmasi; kelas Selesai hanya bisa diubah judulnya; kelas tidak bisa dihapus.
FR4: Tabel kelas admin: kolom judul, sesi berikutnya (tanggal terdekat ≥ hari ini; kelas Selesai, termasuk pada hari sesi terakhir, tampil "Selesai"), terisi/kuota ("18/20"), jumlah daftar tunggu; kelas Penuh ditandai teks "Penuh" + ikon; urutan sesi berikutnya terdekat di atas, kelas Selesai di bawah dengan yang paling baru selesai lebih dulu; tampilan bawaan = semua kelas Dibuka + kelas Selesai yang tanggal sesi terakhirnya dalam 30 hari terakhir; tautan "Tampilkan semua kelas Selesai" memuat semua kelas di tabel yang sama; tanpa paginasi di kedua tampilan; keduanya memenuhi NFR7 pada ±240 kelas; empat kolom terlihat tanpa gulir horizontal di 1366×768.
FR5: Halaman kelas admin: bagian Terdaftar (nama, email, waktu daftar, penanda "Naik dari daftar tunggu" + waktu promosi), bagian Daftar tunggu (posisi, nama, email, waktu daftar, urut posisi), bagian Dibatalkan yang bisa dilipat (nama, email, waktu batal, pembatal); titik masuk presensi, grid rekap, dan ekspor CSV.
FR6: Admin menyalin tautan pendaftaran kelas yang stabil (tidak berubah saat judul diubah); tombol "Salin tautan" memberi konfirmasi yang terbaca pembaca layar.
FR7: Peserta mendaftar lewat tautan dengan nama (1–100 karakter) dan email (format valid, disimpan ternormalisasi) tanpa akun; halaman menampilkan judul, tanggal sesi, dan alert "Kelas penuh — Anda akan masuk daftar tunggu" bila penuh; hasil "Terdaftar" atau "Daftar tunggu #N" tampil di halaman yang sama dengan tautan ke halaman status; kelas Selesai ditolak "Pendaftaran kelas ini sudah ditutup" di API dan halaman tanpa formulir; pendaftaran yang dikirim pada tanggal sesi terakhir (WIB), pukul berapa pun, ditolak dengan pesan yang sama, sedangkan yang dikirim sehari sebelumnya pukul 23.59 WIB diterima.
FR8: R1 — status pendaftaran baru Terdaftar hanya bila jumlah Terdaftar < kuota dan daftar tunggu kosong, selain itu Daftar tunggu; Terdaftar tidak pernah melebihi kuota; 20 permintaan HTTP serentak dengan email berbeda ke API yang sedang berjalan pada kelas kuota 5 → ke-20 berhasil tanpa 5xx, tepat 5 Terdaftar, tepat 15 Daftar tunggu dengan posisi 1–15 tanpa celah maupun duplikat; keputusan + simpan satu operasi atomik di lapisan data; saat lapisan data sibuk, permintaan menunggu/diulang otomatis sehingga pada beban setara 20 pendaftaran serentak tidak ada peserta yang menerima error; bukti mengikuti pola bukti konkurensi (multi-koneksi, mutation check, 50 ulangan per run CI).
FR9: R2 — satu pendaftaran aktif per email ternormalisasi per kelas; email yang sudah aktif melihat status yang ada ("Anda sudah terdaftar di kelas ini" / "Anda sudah di daftar tunggu #N"); "Budi@Mail.com " = "budi@mail.com"; dua permintaan identik bersamaan → satu pendaftaran, keduanya berhasil tanpa 5xx dan menampilkan status yang sama (pola bukti FR8); pendaftaran Dibatalkan boleh mendaftar lagi sebagai pendaftar baru.
FR10: R3 — daftar tunggu FIFO menurut waktu daftar dengan pemecah seri deterministik; posisi antrean sama di halaman kelas admin, status peserta, dan hasil pendaftaran; posisi bergeser maju saat yang di depan batal/naik; di kelas Selesai pendaftaran Daftar tunggu menampilkan "Kelas selesai — tidak naik dari daftar tunggu".
FR11: Peserta membatalkan pendaftaran aktif dari halaman status dengan dua langkah (konfirmasi menyebut judul kelas dan sifat final); tercatat waktu batal + pembatal = peserta; boleh kapan saja selama Dibuka; kelas Selesai, termasuk sepanjang tanggal sesi terakhir (WIB), ditolak "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan"; API pembatalan peserta mewajibkan kode rujukan pendaftaran + email yang cocok setelah dinormalisasi; email tidak cocok atau kode tidak dikenal → pesan sama "Pendaftaran tidak ditemukan" tanpa menyebut bagian yang salah dan tanpa perubahan data; kode rujukan publik acak dan tidak berurutan, ID internal tidak pernah di URL/API publik; tanpa rate limit di MVP; pembatalan ulang tidak mengubah apa pun dan tidak memicu promosi kedua.
FR12: Admin membatalkan pendaftaran aktif atas nama peserta dari halaman kelas admin dengan konfirmasi dua langkah dan aturan Selesai yang sama; pembatal = admin; efek promosi identik FR13.
FR13: R4 — pembatalan pendaftaran Terdaftar mempromosikan kepala daftar tunggu dalam operasi atomik yang sama, dengan waktu promosi; jumlah min(kuota − Terdaftar, panjang antrean); pembatalan bersamaan tidak melampaui kuota, tidak mempromosikan orang yang sama dua kali, dan keduanya berhasil tanpa 5xx (pola bukti FR8); membatalkan Daftar tunggu tidak mempromosikan siapa pun; di kelas Selesai, termasuk sepanjang tanggal sesi terakhir, tidak ada promosi; peserta yang naik melihat "Terdaftar (naik dari daftar tunggu)".
FR14: Peserta memasukkan email dan melihat semua pendaftaran aktifnya: judul, tanggal sesi, status, dan untuk Terdaftar "Hadir x dari y sesi" + kelayakan; email tanpa pendaftaran aktif → "Tidak ada pendaftaran aktif untuk email ini"; bisa dipakai penuh di lebar 360 px.
FR15: Admin mencatat dan mengoreksi presensi semua peserta Terdaftar untuk satu sesi dalam satu formulir dengan satu "Simpan"; setiap peserta punya kontrol pilihan tunggal tiga keadaan **Hadir / Tidak hadir / Belum dicatat** (grup radio, bukan checkbox); tanpa FR18 peserta tanpa catatan dibuka Belum dicatat; "Simpan" hanya membuat/mengubah catatan untuk peserta bernilai Hadir atau Tidak hadir, sehingga peserta yang dibiarkan Belum dicatat tetap tanpa catatan, tampil "—" di grid/CSV, dan tidak dihitung Tidak hadir di FR19/FR20; catatan tersimpan bisa dikoreksi Hadir ↔ Tidak hadir tetapi tidak bisa kembali ke Belum dicatat (pilihan itu tidak tersedia untuk peserta bercatatan); formulir bisa dioperasikan penuh dengan keyboard; pendaftaran Dibatalkan tidak tampil (presensinya tetap tersimpan); peserta yang naik setelah sesi disimpan tampil Belum dicatat, termasuk bila FR18 aktif.
FR16: R5 — presensi ditolak di API untuk sesi bertanggal setelah hari ini (WIB); kasus tepi wajib: 00.30 WIB tanggal D pada proses UTC → sesi D diterima, D+1 ditolak; 06.59 WIB tanggal D pada proses UTC → sesi D diterima; 23.30 WIB tanggal D pada proses Asia/Jayapura → sesi D+1 ditolak; test dijalankan dengan zona proses minimal UTC, Asia/Jakarta, Asia/Jayapura dan waktu "sekarang" yang dikendalikan test; UI menampilkan "Bisa diisi mulai {tanggal}".
FR17 (SHOULD): Beranda "Sesi hari ini" setelah masuk: sesi bertanggal hari ini di semua kelas, urut judul kelas, satu klik ke formulir presensi; kosong → "Tidak ada sesi hari ini".
FR18 (SHOULD): Formulir presensi yang belum pernah disimpan dibuka dengan semua peserta dalam keadaan Hadir; pilihan bawaan ini dihitung sebagai pilihan admin, sehingga "Simpan" membuat catatan Hadir untuk peserta yang tidak diubah; pengecualian: peserta hasil promosi pada sesi yang sudah pernah disimpan tetap Belum dicatat.
FR19: R6 — "Layak" bila `hadir × 5 ≥ total sesi × 4`, selain itu "Belum layak"; bilangan bulat saja; status langsung berubah setelah presensi disimpan/dikoreksi dan setelah tanggal sesi berubah.
FR20 (SHOULD): "Tidak mungkin layak" menggantikan "Belum layak" bila `(hadir + sesi Belum dicatat) × 5 < total sesi × 4`; sesi Belum dicatat = sesi tanpa catatan untuk pendaftaran itu (belum tiba atau lampau belum diisi); hanya catatan Tidak hadir yang mengurangi peluang layak.
FR21: Grid rekap satu kelas: baris per peserta Terdaftar, kolom per sesi berisi "Hadir"/"Tidak hadir"/"—" (Belum dicatat), lalu jumlah hadir "x/y" dan kelayakan; nilai dibedakan dengan teks.
FR22: Ekspor rekap CSV: nama, email, kolom per tanggal sesi, jumlah hadir, total sesi, kelayakan; header Indonesia; UTF-8 + BOM; aman untuk koma/kutip/non-ASCII; sel diawali `= + - @` diberi awalan `'`; nama berkas berisi judul kelas + tanggal ekspor WIB dengan karakter tidak sah diganti tanda hubung.

### NonFunctional Requirements

NFR1: Konsistensi data — R1, R2, R4 (dan R7) ditegakkan di lapisan data dalam satu transaksi per operasi; test serentak FR8, FR9, FR13 (dan R7) memenuhi pola bukti konkurensi: operasi benar-benar bersamaan lewat > 1 koneksi, tanpa respons 5xx, mutation check gagal tanpa atomisitas, 50 ulangan per run CI yang semuanya lulus.
NFR2: Zona waktu — semua "hari ini" dan tanggal sesi memakai Asia/Jakarta, lepas dari zona server/browser.
NFR3: Aksesibilitas — WCAG 2.1 AA: kontras ≥ 4,5:1, semua aksi bisa dengan keyboard, fokus terlihat, setiap input berlabel, status tidak hanya warna, hasil aksi diumumkan ke pembaca layar.
NFR4: Tata letak — halaman peserta penuh pada lebar 360 px tanpa gulir horizontal; halaman admin dioptimalkan untuk 1366×768 bergaya panel admin, tabel utama tanpa gulir horizontal.
NFR5: Bahasa — semua teks UI, pesan validasi, header CSV berbahasa Indonesia; tanggal format "Senin, 9 Nov 2026"; identifier kode dan nama berkas Inggris.
NFR6: Data lokal — satu berkas SQLite lokal; tanpa layanan cloud untuk DB, hosting, atau auth; produksi = satu instance di satu server kecil milik lembaga yang terjangkau dari internet lewat HTTPS (peserta mendaftar dari ponsel di luar kantor); laptop lokal hanya untuk pengembangan dan demo.
NFR7: Kinerja — data satu tahun (±240 kelas, ±5.000 pendaftaran): p95 respons < 1 s per halaman/aksi, ekspor CSV satu kelas < 2 s, diukur di satu inti CPU.
NFR8: Keamanan minimum — di produksi semua lalu lintas browser ↔ Kelasku memakai HTTPS dan HTTP biasa dialihkan ke HTTPS; password admin di-hash; aksi admin di API selalu memeriksa sesi masuk; semua input divalidasi di server; nilai rahasia hanya di `.env` lokal.
NFR9: Kemampuan uji — setiap aturan R1–R7 punya test otomatis yang menyebut ID aturan di nama test; data seed untuk demo dan e2e (admin, kelas Penuh tanpa antrean, kelas Penuh dengan antrean, kelas dengan sesi lampau + presensi sebagian, kelas dengan sesi hari ini).

### Additional Requirements

Dari Architecture Spine (dan blocker Sprint 0 dari test design yang disetujui sebagai bagian fondasi):

- **Tidak ada starter template.** Scaffolding manual: satu `package.json` di root (npm, `package-lock.json`), `.nvmrc` (Node 24.22.2, `engines >=22.22.0`), `tsconfig.json` + `tsconfig.server.json`, `vite.config.ts` (root `src/client`, outDir `dist/client`, proxy `/api`), `playwright.config.ts`, `.env.example`; versi stack persis seperti tabel Stack spine (TS 6.0.3, React 19.3.1, Vite 8.3.5, React Router 8.5.1, Fastify 5.12.8, better-sqlite3 13.0.3, zod 4.6.7, Vitest 5.0.5, Playwright 1.64.1, @axe-core/playwright 4.14.0, tsx 4.23.15). → Epic 1 Story 1.
- Skrip `package.json` minimum: `dev`, `build`, `start`, `test`, `test:e2e`, `typecheck`, `admin:create`, `seed:demo`, `backup`.
- Pohon sumber dan aturan lapisan (shared → domain → data → services → http; client hanya ke shared + HTTP) sesuai spine; panah dependensi satu arah.
- AD-1: satu proses Fastify melayani `/api/*` dan statis `dist/client`; SQLite `DATABASE_PATH` (bawaan `./data/kelasku.db`) dengan `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`.
- AD-2: hanya `src/server/data/` mengimpor `better-sqlite3`; SQL berparameter di repository bertipe; tanpa ORM.
- AD-3: setiap operasi tulis = satu `withWriteTx` (`BEGIN IMMEDIATE`) yang dibuka use-case; tx-step tidak membuka transaksi; semua baca keputusan di dalam `fn` sinkron; tanpa kolom counter; `SQLITE_BUSY` → HTTP 503 `database_busy`.
- AD-4: satu jalur promosi `promoteFromWaitlist(tx, ctx, classId)` → `promotedCount`, memanggil `assertClassOpen` dulu.
- AD-5: keputusan pendaftaran + R2 dua lapis (cek aktif di transaksi + unique index parsial; `SQLITE_CONSTRAINT_UNIQUE` → baca ulang → `alreadyActive`); `normalizeEmail` hanya di `src/shared/`.
- AD-6/AD-20: nilai turunan (status kelas — Selesai bila `max(session_date) <= today` mengikuti PRD revisi, lihat A-9; posisi antrean, sesi berikutnya, kelayakan) dihitung di `domain/` saat baca, dikirim siap tampil lewat DTO di `src/shared/dto.ts`; setiap respons baca menyertakan `today`; klien tidak menghitung aturan.
- AD-7: `Clock { now(); todayJakarta() }` di `src/server/clock.ts`; `ctx = { nowIso, today }` dibaca setelah `BEGIN IMMEDIATE`; `new Date()`/`Date.now()` dilarang di `domain/` dan `services/`; `KELASKU_FAKE_NOW` hanya saat `NODE_ENV=test` (instan ISO UTC beku, dibaca sekali saat start — B-2a).
- AD-8: ruang rute `/api/admin/*` (plugin dengan hook auth → 401), `/api/public/*`, `/api/auth/*`; envelope error `{ error: { code, message, fields? } }`; registri kode → pesan Indonesia → status HTTP di `src/shared/errors.ts` (HP-2); hasil bisnis sah = 200; `/api/*` tidak dikenal → 404 envelope; selainnya → `index.html`; fetch wrapper klien satu-satunya pemanggil `fetch` (`network_error`, `unexpected_response`, 401 → `/admin/masuk?next=`).
- AD-9: sesi admin cookie `kelasku_session` (HttpOnly, SameSite=Lax, Secure bila `COOKIE_SECURE=true`), token acak 32 byte, hash SHA-256 di `admin_sessions`, kedaluwarsa 12 jam; password `scrypt` dengan salt per akun; endpoint tulis menolak Content-Type selain JSON; akun hanya dibuat oleh `npm run admin:create` (idempoten).
- AD-10: PK integer autoincrement; `classes.public_code` dan `registrations.public_ref` 10 karakter base64url acak, unik, tidak pernah berubah; ID internal dan email tidak muncul di URL publik; tanggal sesi `TEXT 'YYYY-MM-DD'`; timestamp ISO-8601 UTC milidetik; status `'registered'|'waitlisted'|'cancelled'`.
- AD-12: skema hanya lewat migrasi `NNN_description.sql` bernomor, maju saja, `PRAGMA user_version`, backup pra-migrasi otomatis, gagal → exit bukan nol; berkas migrasi yang sudah di-merge tidak diedit.
- AD-15: tanpa fungsi waktu SQL/`DEFAULT` waktu; kolom `*_at` dari `ctx.nowIso` dengan `CHECK` GLOB; urutan antrean = `registrations.id`.
- AD-17: hanya `registrations-repo.ts` yang menulis `registrations`; setiap `UPDATE` status berpenjaga `AND status=@expected` + cek `changes === 1`; `CHECK` status dan konsistensi pembatalan; tanpa `DELETE`.
- AD-18: `assertClassOpen(tx, ctx, classId, action)` adalah baca pertama di use-case daftar, batal, ubah kuota, ubah tanggal, dan promosi; Selesai → `registration_closed` / `class_finished`.
- AD-19: validasi tanggal sesi satu fungsi domain untuk buat & ubah; ubah tanggal = diff (insert/delete, tidak pernah hapus-semua); `session_has_attendance`; `confirmSessionChange: true` wajib bila kelas punya presensi dan diff tidak kosong (409 `confirmation_required`); R7 dan promosi kuota naik dalam transaksi yang sama.
- AD-11 dan AD-16 (presensi; pembatalan idempoten via `cancelRegistration`) dipakai di epik berikutnya.
- AD-13: tanpa UI library/framework CSS; token DESIGN.md → `src/client/styles/tokens.css` 1:1; komponen bersama sekali di `src/client/components/`; label dari `src/shared/glossary.ts`, format tanggal dari `src/shared/format.ts`; React Router data mode, `useBlocker` + `beforeunload`.
- AD-14: Vitest domain murni; services/data terhadap berkas SQLite sementara nyata; HTTP via `fastify.inject()`; test konkurensi R1/R2/R4/R7 dengan ≥ 2 koneksi dari `worker_threads`; Playwright atas build produksi dengan `NODE_ENV=test`, `KELASKU_FAKE_NOW`, DB baru dari `seed:demo`, dan `@axe-core/playwright` di setiap permukaan IA.
- B-1 (test design): `createDb(path, { busyTimeoutMs? })` dan `createServices({ db, clock })` bisa diimpor dari worker tanpa Fastify.
- B-2 (test design): `seed:demo` menyertakan kelas Selesai dengan Terdaftar + Daftar tunggu; kredensial admin seed non-interaktif dari `.env` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, nama ada di `.env.example` tanpa nilai).
- HP-1: Vitest dijalankan dengan `TZ=UTC`; Playwright `timezoneId: 'UTC'`. Tambahan PRD FR-16: test `*.tz.test.ts` juga dijalankan dengan `TZ=Asia/Jakarta` dan `TZ=Asia/Jayapura` (A-12).
- Produksi HTTPS (NFR-6/NFR-8): reverse proxy TLS di server lembaga + alih HTTP → HTTPS, Fastify di `127.0.0.1`, `COOKIE_SECURE=true` (A-10); prosedur dicatat di runbook deployment.
- HP-3: fitness test arsitektur statis (hanya `data/` impor `better-sqlite3`; tanpa `new Date()`/`Date.now()` di `domain/`/`services/`; tanpa fungsi waktu SQL di migrasi; `client/` tidak mengimpor `src/server`).
- Harness konkurensi `runConcurrently(n, task)` dengan barrier `SharedArrayBuffer` + `Atomics.wait`, plus kontrol negatif (varian cek-di-luar-transaksi harus gagal); skenario serentak diulang 50 kali per run CI (PRD FR-8, menggantikan burn-in ×20 di handoff).
- Konvensi: berkas `kebab-case.ts`, komponen `PascalCase.tsx`, tabel `snake_case` jamak, DTO `camelCase`; logging pino tanpa email/nama/password/token; konfigurasi hanya env (`PORT`, `DATABASE_PATH`, `COOKIE_SECURE`, `NODE_ENV`, `KELASKU_FAKE_NOW`; `HOST` ditambahkan di Story 4.7); `.env` di `.gitignore`.
- Indeks minimum: `registrations(class_id, status, id)`, `registrations(email)`, `class_sessions(class_id, session_date)` unik, `attendance(class_session_id)`; tanpa N+1.
- Operasi: `npm run backup` (`db.backup`), prosedur upgrade/pemulihan sesuai spine; `seed:perf` + skrip ukur p95 (HP-5) sebelum rilis.
- `data-testid` hanya untuk baris tabel tanpa nama aksesibel unik: `class-row-{publicCode}`, `registration-row-{registrationId}`, `attendance-row-{registrationId}`, `recap-cell-{registrationId}-{YYYY-MM-DD}`, `recap-eligibility-{registrationId}`.

### UX Design Requirements

UX-DR1: Implementasikan semua token DESIGN.md (warna, tipografi, rounded, spacing, ukuran komponen) sebagai custom properties di `src/client/styles/tokens.css`; tidak ada hex di luar berkas itu; system font stack tanpa web font; `font-variant-numeric: tabular-nums` di tabel.
UX-DR2: Komponen `PageLayout`: landmark `header`/`nav`/`main`, satu `<h1>`, tautan "Lewati ke konten utama" pertama di urutan fokus, fokus pindah ke `<h1>` saat ganti rute, `<title>` "{Halaman} — Kelasku"; varian peserta (kolom tengah maks 560 px, margin 16 px, kepala "Kelasku" tanpa navigasi global) dan admin.
UX-DR3: Komponen `AdminLayout`: top bar 48 px ("Kelasku", tautan "Sesi hari ini" bila FR17 aktif dan "Kelas" dengan indikator aktif 2 px, email admin, tombol "Keluar"); cek `GET /api/auth/session`; tanpa sesi → alihkan ke `/admin/masuk?next=`; breadcrumb "Kelas › {judul} › {halaman}" di halaman bawah kelas.
UX-DR4: Komponen `Badge` status dengan ikon dekoratif (`aria-hidden`) + teks Glosarium untuk varian Terdaftar, Daftar tunggu, Dibatalkan, Penuh, Selesai, Layak, Belum layak, Tidak mungkin layak; non-interaktif; warna sesuai DESIGN.md (Daftar tunggu kuning, bukan merah).
UX-DR5: Komponen `DataTable`: `<table>` semantik dengan `<caption>` (boleh tersembunyi visual), `<th scope>`, baris bisa diklik dengan tautan nyata di sel judul, angka rata kanan tabular, hover `surface`, tanpa zebra, tanpa paginasi (PRD FR-4 revisi; menggantikan "sampai 50 baris"), tanpa sort per kolom; wadah bergulir horizontal di bawah 1024 px.
UX-DR6: Komponen `Field` + `ErrorSummary`: label terlihat di atas input, penanda "(wajib)" berupa teks, validasi saat submit, error server di bawah kolom dengan `aria-describedby` + `aria-invalid`, ringkasan error `role="alert"` di atas formulir dengan tautan ke setiap kolom dan fokus pindah ke ringkasan; nilai yang sudah diisi tetap ada saat error; tombol submit nonaktif dengan label "…ing" selama request.
UX-DR7: Komponen `Toast`: latar `text`, kanan bawah (admin) / bawah tengah (peserta), `aria-live="polite"`, hilang 5 detik, tidak mencuri fokus, hanya untuk sukses (tidak pernah untuk error).
UX-DR8: Komponen `CopyLinkButton`: menyalin URL lengkap (`window.location.origin + /daftar/ + publicCode`), label berubah "Tautan disalin" selama 3 detik diumumkan `aria-live="polite"`, URL juga tampil sebagai teks yang bisa dipilih sebagai cadangan.
UX-DR9: Komponen `ResultPanel`: menggantikan formulir pendaftaran di posisi yang sama, garis kiri 4 px berwarna status, judul `status-hero` 24/700, satu kalimat apa yang terjadi berikutnya, fokus pindah ke judul, `role="status"`; varian Terdaftar (success), Daftar tunggu (warning), dan sudah aktif R2.
UX-DR10: Komponen `ConfirmDialog`: maks 440 px, backdrop gelap, fokus awal di tombol aman "Kembali", `Esc`/klik latar menutup tanpa aksi, fokus kembali ke pemicu, tidak bertumpuk, selebar layar dikurangi margin di ponsel; tombol bahaya hanya di langkah kedua.
UX-DR11: Komponen `Alert` sebaris (info/success/warning/danger, ikon + teks) untuk pesan tingkat halaman; state "Gagal memuat" dengan tombol "Coba lagi"; state "Memuat…" setelah 300 ms tanpa skeleton.
UX-DR12: Komponen pengisi tanggal sesi: baris `type="date"` dengan "Tambah tanggal" dan "Hapus" per baris, diurutkan saat simpan; tanggal berpresensi terkunci dengan teks "Sudah ada presensi — tidak bisa diubah"; kelas Selesai menampilkan tanggal + kuota hanya-baca dengan "Kelas sudah selesai; hanya judul yang bisa diubah"; error duplikat di baris tanggal ("Tanggal 9 Nov 2026 sudah ada di kelas ini").
UX-DR13: Penanda promosi: label `info` "Naik dari daftar tunggu · {9 Nov 2026, 14.32 WIB}" di bagian Terdaftar halaman kelas admin.
UX-DR14: Bagian Dibatalkan memakai `<details>` tertutup bawaan dengan ringkasan "Dibatalkan (N)"; bagian Terdaftar dan Daftar tunggu selalu tampil dengan teks kosong ("Belum ada peserta terdaftar. Bagikan tautan pendaftaran untuk mulai menerima peserta." / "Tidak ada daftar tunggu").
UX-DR15: Daftar sesi di halaman kelas admin: satu baris per tanggal dengan status presensi ("Tersimpan", "Belum diisi", "Bisa diisi mulai {tanggal}"), penanda "Hari ini", tautan "Isi presensi"/"Ubah presensi" hanya untuk sesi yang sudah tiba (dipakai penuh di epik presensi; Epik 1 menampilkan tanggal + penanda saja).
UX-DR16: Kartu peserta di halaman status: satu kartu per pendaftaran aktif urut tanggal sesi pertama, badge status, "Hadir x dari y sesi", badge kelayakan, tombol "Batalkan pendaftaran" hanya bila Dibuka, teks pengganti untuk Selesai.
UX-DR17: Kontrol presensi (menggantikan checkbox di DESIGN.md/EXPERIENCE.md, lihat A-9): per peserta satu `fieldset` grup radio dengan `legend` nama peserta dan opsi "Hadir", "Tidak hadir", dan "Belum dicatat" (opsi terakhir hanya untuk peserta tanpa catatan tersimpan); radio 20 px dengan area klik ≥ 32 px, `{rounded.full}`, batas `{colors.border-strong}`; `Tab` berpindah antargrup, panah memilih opsi; nilai dibedakan teks, bukan warna saja; penghitung langsung "Hadir: x · Tidak hadir: y · Belum dicatat: z"; teks bawaan FR18.
UX-DR18: Halaman peserta: teks 16 px, target sentuh ≥ 44 px, tombol selebar penuh di < 640 px, tanpa gulir horizontal di 360 px, reflow 320 px CSS dan zoom 200%, zoom tidak dinonaktifkan.
UX-DR19: Halaman admin: kontainer maks 1280 px, margin 24 px; tabel Kelas empat kolom tanpa gulir horizontal di 1366×768; grid rekap 5 sesi tanpa gulir, > ±8 sesi bergulir dengan kolom nama menempel.
UX-DR20: Peringatan perubahan belum tersimpan (`useBlocker` + `beforeunload`) di Ubah kelas dan Presensi sesi.
UX-DR21: State sesi masuk habis saat submit: 401 → alihkan ke Masuk dengan alert info "Sesi masuk Anda berakhir. Silakan masuk lagi."
UX-DR22: Email tidak pernah masuk URL; tautan dari hasil pendaftaran ke `/status` membawa email lewat state navigasi; selama halaman status belum ada (Epik 1), tautan disembunyikan.
UX-DR23: Pemeriksaan `@axe-core/playwright` di setiap permukaan IA sebagai bagian Definition of Done story UI; uji manual keyboard + pembaca layar sekali sebelum rilis MVP.

### FR Coverage Map

FR1: Epic 1 — Masuk/keluar admin, proteksi `/api/admin/*`
FR2: Epic 1 — Buat kelas
FR3: Epic 1 — Ubah kelas, R7, promosi saat kuota naik, diff tanggal sesi (penguncian tanggal berpresensi aktif setelah Epic 3 membuat tabel presensi)
FR4: Epic 1 — Tabel kelas admin
FR5: Epic 1 — Halaman kelas admin (Terdaftar/Daftar tunggu/Dibatalkan); entri presensi di Epic 3, entri rekap/CSV di Epic 4
FR6: Epic 1 — Tautan pendaftaran + salin tautan
FR7: Epic 1 — Pendaftaran mandiri
FR8: Epic 1 — R1 kuota tidak pernah terlampaui
FR9: Epic 1 — R2 satu pendaftaran aktif per email
FR10: Epic 1 — R3 daftar tunggu FIFO
FR11: Epic 2 — Peserta membatalkan
FR12: Epic 2 — Admin membatalkan atas nama peserta
FR13: Epic 2 — R4 promosi otomatis
FR14: Epic 2 — Halaman status peserta (status + pembatalan); Epic 4 menambah "Hadir x dari y sesi" + kelayakan
FR15: Epic 3 — Formulir presensi per sesi
FR16: Epic 3 — R5 presensi hanya untuk sesi yang sudah tiba
FR17: Epic 3 — Beranda "Sesi hari ini" (SHOULD)
FR18: Epic 3 — Bawaan "semua hadir" (SHOULD)
FR19: Epic 4 — R6 kelayakan sertifikat
FR20: Epic 4 — "Tidak mungkin layak" (SHOULD)
FR21: Epic 4 — Grid rekap
FR22: Epic 4 — Ekspor rekap CSV

NFR1: Epic 1 (harness konkurensi, R1/R2/R7) dan Epic 2 (R4)
NFR2: Epic 1 (Clock), Epic 3 (R5)
NFR3, NFR4, NFR5: semua story UI (Definition of Done + axe)
NFR6: Epic 1 Story 1.1 (SQLite lokal), Epic 4 Story 4.7 (produksi satu server lewat HTTPS)
NFR7: Epic 1 Story 1.9 (tabel kelas pada ±240 kelas), Epic 4 Story 4.6 (bukti kinerja)
NFR8: Epic 1 (auth, validasi zod, `.env`), Epic 4 Story 4.7 (HTTPS + alih HTTP)
NFR9: semua story (test berlabel ID aturan); seed di Epic 1, diperluas di Epic 3

## Epic List

### Epic 1: Kelas & Pendaftaran Berkuota (R1–R3, R7)
Admin bisa masuk, membuat dan mengubah kelas berkuota, melihat tabel kelas dan isi setiap kelas, serta membagikan tautan pendaftaran. Peserta bisa mendaftar sendiri dari ponsel tanpa akun dan langsung tahu statusnya: Terdaftar atau Daftar tunggu #N. Sistem menjamin kuota tidak pernah terlampaui (R1), satu pendaftaran aktif per email (R2), antrean FIFO (R3), dan kuota tidak bisa diturunkan di bawah jumlah Terdaftar (R7), termasuk saat permintaan datang bersamaan. Epik ini juga meletakkan fondasi repo, data, waktu, dan test yang dipakai semua epik berikutnya.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10
**Catatan:** Story fondasi (scaffold, data & clock, harness konkurensi, kerangka UI, seed e2e) mengikuti blocker Sprint 0 test design (B-1, B-2, HP-1..HP-3) dan dikerjakan pertama di epik ini. Risiko utama: R-001, R-002 (P0). Epik ini adalah tolok ukur keputusan potong di akhir hari ke-3 (lihat Potongan cakupan).

### Epic 2: Pembatalan, Promosi Otomatis & Status Peserta (R4)
Peserta bisa memeriksa status semua pendaftaran aktifnya lewat email dan membatalkan sendiri; admin bisa membatalkan atas nama peserta. Saat peserta Terdaftar batal, kepala daftar tunggu naik otomatis dalam transaksi yang sama, tanpa campur tangan admin.
**FRs covered:** FR11, FR12, FR13, FR14 (bagian status dan pembatalan)
**Catatan:** Memakai `promoteFromWaitlist` dari Epic 1. Risiko utama: R-003 (P0).

### Epic 3: Presensi per Sesi (R5)
Admin mencatat dan mengoreksi kehadiran satu sesi dengan satu kali simpan, hanya untuk sesi yang tanggalnya sudah tiba (WIB). Admin juga melihat sesi hari ini di semua kelas sebagai beranda (SHOULD).
**FRs covered:** FR15, FR16, FR17, FR18
**Catatan:** Mengaktifkan penguncian tanggal berpresensi dan konfirmasi perubahan tanggal di Ubah kelas (FR3, AD-19). Risiko utama: R-005 (P0), R-021.

### Epic 4: Kelayakan Sertifikat, Rekap & Ekspor CSV (R6)
Admin melihat grid rekap kehadiran dan status kelayakan sertifikat setiap peserta, lalu mengekspornya ke CSV pada hari sesi terakhir. Peserta melihat jumlah kehadiran dan kelayakannya sendiri di halaman status.
**FRs covered:** FR19, FR20, FR21, FR22, FR14 (bagian kehadiran dan kelayakan)
**NFRs ditutup:** NFR6 dan NFR8 (produksi HTTPS, Story 4.7), NFR7 (Story 4.6).
**Catatan:** Satu fungsi domain kelayakan dipakai grid, status peserta, dan CSV (AD-6). Ditutup dengan bukti kinerja NFR7 dan penyajian produksi lewat HTTPS. Risiko utama: R-006, R-012, R-014.

## Epic 1: Kelas & Pendaftaran Berkuota (R1–R3, R7)

Admin bisa masuk, membuat dan mengubah kelas berkuota, melihat tabel kelas dan isi setiap kelas, serta membagikan tautan pendaftaran. Peserta bisa mendaftar sendiri tanpa akun dan langsung tahu statusnya. Sistem menjamin R1, R2, R3, dan R7 di lapisan data, termasuk saat permintaan datang bersamaan.

### Story 1.1: Kerangka repositori yang bisa dijalankan dan diuji

Sebagai pengembang Kelasku,
Saya ingin satu repositori TypeScript dengan server Fastify, SPA React + Vite, Vitest, dan Playwright yang sudah tersambung,
Sehingga setiap story berikutnya bisa langsung menulis kode dan test di struktur yang disepakati arsitektur.

**Mencakup:** Additional Requirements (scaffold, skrip, pohon sumber, konfigurasi env), AD-1, AD-8 (fallback), HP-1, HP-3, NFR6.

**Acceptance Criteria:**

**Given** repositori kosong selain dokumen perencanaan
**When** story selesai
**Then** ada satu `package.json` di root dengan dependensi pada versi persis tabel Stack spine, `package-lock.json`, `.nvmrc` berisi `24.22.2`, `engines.node` `>=22.22.0`, `tsconfig.json` + `tsconfig.server.json`, `vite.config.ts` (root `src/client`, outDir `dist/client`, proxy `/api`), `playwright.config.ts`, dan pohon direktori `src/shared`, `src/server/{domain,data,services,http}`, `src/client`, `scripts`, `e2e` sesuai spine
**And** `.gitignore` memuat `.env`, `data/`, `backups/`, `dist/`, dan `node_modules/`; `.env.example` dikomit dengan `PORT`, `DATABASE_PATH`, `COOKIE_SECURE`, `NODE_ENV`, `KELASKU_FAKE_NOW`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` tanpa nilai rahasia

**Given** dependensi terpasang
**When** pengembang menjalankan `npm run dev`
**Then** Vite dev server dan `tsx watch src/server/main.ts` berjalan, dan membuka `/` di browser menampilkan halaman React berbahasa Indonesia yang memuat judul "Kelasku"

**Given** `npm run build` lalu `npm start`
**When** browser meminta path non-API apa pun (mis. `/admin/kelas`)
**Then** server mengembalikan `index.html` dari `dist/client`
**And** permintaan ke `/api/tidak-ada` mengembalikan HTTP 404 dengan envelope `{ "error": { "code": "not_found", "message": "<pesan Indonesia>" } }`

**Given** skrip `test`
**When** `npm test` dijalankan
**Then** Vitest berjalan dengan `TZ=UTC` (HP-1) dan menjalankan fitness test arsitektur yang gagal bila: berkas di luar `src/server/data/` mengimpor `better-sqlite3`; `new Date(`, `Date.now(` atau `toISOString().slice(0, 10)` muncul di `src/server/domain/` atau `src/server/services/`; berkas migrasi memuat `CURRENT_TIMESTAMP`, `datetime('now')` atau `strftime(` dengan `'now'`; berkas di `src/client/` mengimpor dari `src/server/`; `src/shared/` mengimpor dari luar `src/shared/`
**And** fitness test dibuktikan dengan satu kasus negatif per aturan (fixture string) agar tidak lulus kosong

**Given** skrip `typecheck` dan `test:e2e`
**When** keduanya dijalankan
**Then** `tsc --noEmit` lulus untuk server dan klien, dan Playwright menjalankan satu smoke test yang membuka `/` pada build produksi dengan `timezoneId: 'UTC'` serta pemeriksaan axe tanpa pelanggaran

### Story 1.2: Waktu Jakarta, format tanggal, glosarium, dan registri error bersama

Sebagai pengembang Kelasku,
Saya ingin satu sumber untuk "hari ini" WIB, format tanggal Indonesia, label status, dan kode error,
Sehingga semua story berikutnya menghitung tanggal dan menampilkan pesan dengan cara yang sama (NFR2, NFR5).

**Mencakup:** AD-7, AD-8 (registri error), AD-10 (format), AD-13 (glossary/format), HP-2, B-2(a), NFR2, NFR5.

**Acceptance Criteria:**

**Given** `src/server/clock.ts`
**When** `createClock()` dipanggil dan `todayJakarta()` dibaca
**Then** hasilnya tanggal kalender Asia/Jakarta `YYYY-MM-DD` lewat `Intl.DateTimeFormat`, terlepas dari zona proses
**And** test `clock.tz.test.ts` membuktikan: `2026-11-09T17:30:00.000Z` (00.30 WIB 10 Nov, UTC masih 9 Nov) → `2026-11-10`; `2026-11-09T23:59:00.000Z` (06.59 WIB 10 Nov) → `2026-11-10`; `2026-11-10T16:30:00.000Z` (23.30 WIB 10 Nov, Asia/Jayapura sudah 11 Nov) → `2026-11-10`; `2026-11-09T17:00:00.000Z` (00.00 WIB) → `2026-11-10`

**Given** skrip `npm test`
**When** dijalankan
**Then** semua berkas `*.tz.test.ts` dijalankan tiga kali, masing-masing dengan `TZ=UTC`, `TZ=Asia/Jakarta`, dan `TZ=Asia/Jayapura`, dan hasilnya identik di ketiga zona (A-12); test lain tetap `TZ=UTC`

**Given** `NODE_ENV=test` dan `KELASKU_FAKE_NOW=2026-11-09T03:00:00.000Z`
**When** `createClock()` dipanggil lalu `now()` dibaca dua kali dengan jeda
**Then** keduanya mengembalikan instan beku yang sama (dibaca sekali saat dibuat)
**And** dengan `NODE_ENV` selain `test`, `KELASKU_FAKE_NOW` diabaikan dan jam nyata dipakai

**Given** `src/shared/format.ts`
**When** tanggal sesi `2026-11-09` dan instan `2026-11-09T07:32:00.000Z` diformat
**Then** hasilnya "Senin, 9 Nov 2026" dan "9 Nov 2026, 14.32 WIB" (`Intl`, `id-ID`, `Asia/Jakarta`)

**Given** `src/shared/glossary.ts`
**When** label status diminta untuk `registered`, `waitlisted`, `cancelled` dan status kelas Dibuka/Penuh/Selesai
**Then** label yang dikembalikan persis istilah Glosarium PRD §3 ("Terdaftar", "Daftar tunggu", "Dibatalkan", "Dibuka", "Penuh", "Selesai")

**Given** `src/shared/errors.ts`
**When** registri error dibaca
**Then** setiap entri berbentuk `{ code, httpStatus, message }` dan minimal memuat `not_found` 404, `validation_error` 400, `unauthorized` 401, `invalid_credentials` 401, `unsupported_media_type` 415, `database_busy` 503, `network_error`, dan `unexpected_response` dengan pesan Indonesia
**And** fungsi `toErrorEnvelope(code, fields?)` menghasilkan `{ error: { code, message, fields? } }`, dan test memastikan setiap kode punya pesan non-kosong dan status HTTP

### Story 1.3: Fondasi data: koneksi SQLite, migrasi, transaksi tulis, dan harness konkurensi

Sebagai pengembang Kelasku,
Saya ingin koneksi SQLite, runner migrasi, `withWriteTx`, komposisi service tanpa Fastify, dan harness konkurensi yang terbukti bisa menangkap race,
Sehingga aturan R1, R2, R4, dan R7 di story berikutnya bisa ditegakkan dan diuji dari beberapa koneksi nyata (NFR1).

**Mencakup:** AD-1, AD-2, AD-3, AD-12, AD-14, AD-15, B-1, R-008, R-020, NFR1.

**Acceptance Criteria:**

**Given** `createDb(path, { busyTimeoutMs? })` di `src/server/data/db.ts`
**When** koneksi dibuka
**Then** `journal_mode=WAL`, `foreign_keys=ON`, dan `busy_timeout` = `busyTimeoutMs` (bawaan 5000) aktif, dan modul dapat diimpor dari `worker_threads` tanpa memuat Fastify

**Given** direktori `src/server/data/migrations/` berisi berkas `NNN_description.sql`
**When** server start atau `migrate(db)` dipanggil
**Then** migrasi tertunda diterapkan berurutan, masing-masing dalam satu transaksi, dan `PRAGMA user_version` naik ke nomor terakhir
**And** pada DB yang sudah berisi dengan migrasi tertunda, salinan `backups/pre-migration-<user_version>-<timestamp>.db` dibuat sebelum migrasi diterapkan
**And** migrasi yang gagal membuat proses berhenti dengan exit code bukan nol dan `user_version` tidak berubah

**Given** `withWriteTx(db, clock, (tx, ctx) => …)`
**When** dipanggil
**Then** fungsi dijalankan di `BEGIN IMMEDIATE`, `ctx = { nowIso, today }` dibaca dari `clock` setelah lock diperoleh, dan nilai kembali `fn` diteruskan
**And** memanggil `withWriteTx` saat `db.inTransaction` sudah benar melempar error (tanpa transaksi bersarang)
**And** `SQLITE_BUSY` dari dalam `withWriteTx` dipetakan ke error `database_busy` (HTTP 503) dan dibuktikan dengan test yang memakai `busyTimeoutMs` kecil

**Given** `createServices({ db, clock })` di `src/server/services/`
**When** dipanggil dari test atau worker
**Then** ia mengembalikan objek use-case (boleh kosong di story ini) tanpa bergantung pada Fastify, dan `main.ts` membangun Fastify di atasnya

**Given** helper test `runConcurrently(n, task)` yang menjalankan `n` worker dengan koneksi sendiri ke berkas DB yang sama dan memulai serentak lewat barrier `SharedArrayBuffer` + `Atomics.wait`
**When** kontrol negatif dijalankan: tabel uji lokal dengan batas 5, varian yang mengecek jumlah di luar transaksi lalu menulis, 20 worker
**Then** harness mendeteksi pelanggaran batas (jumlah > 5) setidaknya sekali dalam 50 ulangan, membuktikan harness memang menangkap race
**And** varian yang sama di dalam `withWriteTx` menghasilkan tepat 5 baris di setiap ulangan dari 50 ulangan, tanpa satu pun worker menerima error (termasuk `database_busy`) dengan `busy_timeout` bawaan

**Given** helper `repeatConcurrent(times, scenario)` dan konstanta `CONCURRENCY_REPEATS = 50`
**When** dipakai oleh test R1/R2/R4/R7 di story berikutnya
**Then** setiap skenario serentak dijalankan 50 kali dalam satu run `npm test` (dan CI), dan kegagalan satu ulangan menggagalkan test dengan nomor ulangannya

**Given** helper `startTestServer()` yang menjalankan Fastify sungguhan pada port acak (`listen({ port: 0 })`) di atas berkas DB sementara
**When** dipakai test HTTP serentak
**Then** test bisa mengirim N permintaan `fetch` sekaligus ke API yang sedang berjalan dan mengumpulkan semua status HTTP (A-11)

### Story 1.4: API masuk dan keluar admin

Sebagai admin (Rina),
Saya ingin masuk dengan email dan password akun yang dibuat lewat skrip, lalu keluar,
Sehingga hanya admin yang bisa mengakses aksi admin (FR1, NFR8).

**Mencakup:** FR1 (API), AD-8, AD-9, B-2(c), R-011, P0-008, P1-021, P1-022.

**Acceptance Criteria:**

**Given** migrasi baru membuat tabel `admins` (email ternormalisasi unik, hash password scrypt + salt per akun) dan `admin_sessions` (hash SHA-256 token, `expires_at`, kolom waktu dengan `CHECK` GLOB AD-15)
**When** `npm run admin:create -- --email rina@lembaga.id` dijalankan dan password dimasukkan secara interaktif
**Then** akun dibuat; menjalankan lagi untuk email yang sama memperbarui password tanpa membuat baris kedua (idempoten)

**Given** akun admin ada
**When** `POST /api/auth/login` dengan email (dinormalisasi) dan password benar
**Then** respons 200 berisi email admin dan cookie `kelasku_session` dengan `HttpOnly`, `SameSite=Lax`, `Path=/`, dan `Secure` hanya bila `COOKIE_SECURE=true`
**And** token acak 32 byte; yang tersimpan di DB hanya hash SHA-256-nya dengan `expires_at = login + 12 jam` dari `ctx.nowIso`

**Given** email tidak dikenal atau password salah
**When** login dicoba
**Then** respons 401 `invalid_credentials` dengan pesan "Email atau password salah" yang identik untuk kedua kasus

**Given** sesi masuk valid
**When** `GET /api/auth/session` dipanggil
**Then** respons 200 berisi email admin; tanpa cookie, dengan cookie tidak dikenal, atau sesi kedaluwarsa (diuji dengan clock palsu) respons 401 `unauthorized`

**Given** plugin Fastify `/api/admin/*` dengan hook auth
**When** rute admin apa pun dipanggil tanpa sesi valid
**Then** respons 401 `unauthorized` dalam envelope AD-8 (test mendaftar rute admin uji dan memeriksa semua rute di bawah prefiks)

**Given** sesi masuk valid
**When** `POST /api/auth/logout` dipanggil
**Then** baris `admin_sessions` dihapus, cookie dikosongkan, dan permintaan berikutnya dengan token lama mendapat 401

**Given** endpoint tulis mana pun (`POST`/`PATCH`/`PUT`)
**When** `Content-Type` bukan `application/json`
**Then** respons 415 `unsupported_media_type`

**Given** `NODE_ENV=test` atau seed demo
**When** `npm run seed:demo` dijalankan dengan `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` di env
**Then** akun admin seed dibuat non-interaktif lewat use-case yang sama dengan `admin:create`; skrip ini hanya menolak berjalan bila variabel itu kosong
**And** log pino tidak pernah memuat password, token, atau isi cookie

### Story 1.5: Halaman masuk admin dan kerangka UI bersama

Sebagai admin (Rina),
Saya ingin halaman masuk berbahasa Indonesia dan panel admin dengan top bar yang jelas,
Sehingga saya bisa masuk, berpindah halaman, dan keluar dengan keyboard maupun mouse (FR1, NFR3).

**Mencakup:** FR1 (UI), UX-DR1, UX-DR2, UX-DR3, UX-DR6, UX-DR11, UX-DR21, AD-8 (fetch wrapper), AD-13.

**Acceptance Criteria:**

**Given** `src/client/styles/tokens.css`
**When** dibandingkan dengan frontmatter DESIGN.md
**Then** setiap token warna, tipografi, rounded, spacing, dan ukuran komponen punya custom property 1:1, dan tidak ada nilai hex di berkas klien lain (dicek oleh fitness test atau test statis)

**Given** komponen `PageLayout`, `AdminLayout`, `Field`, `ErrorSummary`, dan `Alert` di `src/client/components/`
**When** halaman memakainya
**Then** setiap halaman punya satu `<h1>`, landmark `header`/`nav`/`main`, tautan "Lewati ke konten utama" sebagai fokus pertama, `<title>` "{Halaman} — Kelasku", dan fokus pindah ke `<h1>` setiap kali rute berubah
**And** `Field` menampilkan label terlihat di atas input dengan teks "(wajib)", serta mengaitkan pesan error lewat `aria-describedby` + `aria-invalid="true"`; `ErrorSummary` memakai `role="alert"`, menautkan ke setiap kolom, dan menerima fokus

**Given** fetch wrapper `src/client/api/`
**When** server tidak terjangkau, respons tanpa envelope, atau respons 401 diterima
**Then** wrapper menghasilkan `network_error` / `unexpected_response` dengan pesan dari `errors.ts`, dan 401 mengalihkan ke `/admin/masuk?next=<path same-origin>` dengan alert info "Sesi masuk Anda berakhir. Silakan masuk lagi." (UX-DR21)
**And** `next` yang bukan path same-origin diabaikan (kembali ke `/admin`)

**Given** pengguna belum masuk
**When** membuka `/admin/kelas`
**Then** ia dialihkan ke `/admin/masuk?next=/admin/kelas`; setelah masuk berhasil ia kembali ke `/admin/kelas`

**Given** halaman Masuk
**When** kredensial salah dikirim
**Then** alert danger "Email atau password salah" tampil di atas formulir, password dikosongkan, email tetap terisi, dan tombol berlabel "Masuk…" serta nonaktif selama request berjalan

**Given** admin sudah masuk
**When** halaman admin mana pun terbuka
**Then** top bar 48 px menampilkan "Kelasku", tautan "Kelas" dengan indikator aktif, email admin, dan tombol "Keluar"; tautan "Sesi hari ini" belum tampil dan `/admin` mengalihkan ke `/admin/kelas` (FR17 belum dibangun)
**And** halaman `/admin/kelas` sementara menampilkan `<h1>` "Kelas" dengan state memuat "Memuat…" setelah 300 ms dan state gagal memuat "Tidak dapat memuat data. Periksa koneksi lalu coba lagi." + tombol "Coba lagi"

**Given** admin menekan "Keluar"
**When** logout selesai
**Then** ia berada di `/admin/masuk`, dan tombol Back browser tidak menampilkan data admin tanpa masuk ulang

**Given** fixture Playwright: `npm run build`, DB baru `./data/e2e.db`, `seed:demo` (admin dari `SEED_ADMIN_*`), server dengan `NODE_ENV=test` + `KELASKU_FAKE_NOW`
**When** e2e masuk → buka Kelas → keluar dijalankan
**Then** alurnya lulus dengan keyboard saja, dan pemeriksaan axe di Masuk dan Kelas tanpa pelanggaran

### Story 1.6: Membuat kelas dan membagikan tautan pendaftaran

Sebagai admin (Rina),
Saya ingin membuat kelas dengan judul, tanggal sesi, dan kuota, lalu menyalin tautan pendaftarannya,
Sehingga saya bisa membuka kelas untuk pendaftaran dan membagikannya ke grup WhatsApp (FR2, FR6, UJ-1).

**Mencakup:** FR2, FR6, AD-3, AD-10, AD-19 (validasi tanggal), UX-DR4, UX-DR7, UX-DR8, UX-DR12, P1-003, P1-004, P1-011.

**Acceptance Criteria:**

**Given** migrasi baru membuat `classes` (`public_code` unik 10 karakter base64url, `title`, `quota` dengan `CHECK quota >= 1`, `created_at`/`updated_at` ber-`CHECK` GLOB) dan `class_sessions` (`class_id` FK, `session_date TEXT YYYY-MM-DD`, unik `(class_id, session_date)`)
**When** fungsi domain `validateSessionDates(dates, today)` dipanggil
**Then** ia menolak daftar kosong, tanggal ganda (menyebut tanggalnya, mis. "Tanggal 9 Nov 2026 sudah ada di kelas ini" dengan kunci `fields` `sessionDates.<index>`), dan daftar tanpa satu pun tanggal **setelah** `today` (kelas seperti itu lahir Selesai); tanggal hari ini dan tanggal lampau lain diterima selama ada satu tanggal > `today`
**And** test unit mencakup batas `today` WIB: `[today]` saja ditolak; `[today, today+1]` diterima; `[today-7, today+1]` diterima

**Given** fungsi domain murni `classStatus({ sessionDates, today })`
**When** diuji
**Then** kelas Selesai bila `max(session_date) <= today` (termasuk sepanjang tanggal sesi terakhir), selain itu Dibuka (Penuh ditambahkan di Story 1.7)

**Given** admin masuk
**When** `POST /api/admin/classes` dengan judul, tanggal sesi, dan kuota valid
**Then** satu `withWriteTx` menyimpan kelas + sesi, `public_code` acak dari `crypto.randomBytes`, dan respons 201 mengembalikan DTO kelas dengan `id`, `publicCode`, tanggal sesi terurut, kuota, dan `today`
**And** judul di-trim dan harus 1–120 karakter; kuota harus bilangan bulat ≥ 1; pelanggaran → 400 `validation_error` dengan `fields` per kolom dan pesan Indonesia

**Given** komponen `Badge` di `src/client/components/`
**When** dipakai
**Then** ia menampilkan ikon dekoratif `aria-hidden` + teks Glosarium untuk semua varian DESIGN.md (Terdaftar, Daftar tunggu, Dibatalkan, Penuh, Selesai, Layak, Belum layak, Tidak mungkin layak), tidak interaktif, dan Daftar tunggu memakai warna `warning`, bukan `danger`

**Given** halaman `/admin/kelas/baru` (tombol "Buat kelas" di halaman Kelas)
**When** admin mengisi judul, menambah tanggal lewat "Tambah tanggal" (baris `type="date"` dengan tombol "Hapus"), mengisi kuota, lalu menekan "Simpan kelas"
**Then** validasi dijalankan saat submit; error server tampil di dekat kolom (termasuk di baris tanggal yang ganda) dan di ringkasan error, nilai yang diisi tetap ada, dan tombol berlabel "Menyimpan…" serta nonaktif selama request

**Given** kelas berhasil disimpan
**When** respons diterima
**Then** admin dibawa ke `/admin/kelas/{id}` dengan toast "Kelas tersimpan" (`aria-live="polite"`, hilang 5 detik, tidak mencuri fokus)
**And** kepala kelas menampilkan judul sebagai `<h1>`, badge status kelas (Dibuka/Selesai dari `classStatus`), kuota, daftar tanggal sesi berformat "Senin, 9 Nov 2026" dengan penanda "Hari ini" untuk sesi hari ini, dan tautan pendaftaran `{origin}/daftar/{publicCode}` sebagai teks yang bisa dipilih

**Given** tombol "Salin tautan"
**When** ditekan
**Then** URL lengkap tersalin ke clipboard, label berubah "Tautan disalin" selama 3 detik dan diumumkan lewat `aria-live="polite"`; bila clipboard ditolak, URL tetap tersedia sebagai teks

**Given** `GET /api/admin/classes/:id`
**When** id tidak ada
**Then** respons 404 `class_not_found` dan halaman menampilkan pesan Indonesia, bukan layar kosong
**And** id internal tidak pernah muncul di tautan pendaftaran (P1-011)

**Given** `seed:demo`
**When** dijalankan
**Then** seed menambahkan kelas contoh (relatif terhadap `today` dari `Clock`) yang dipakai e2e; e2e UJ-1 langkah 1–4 (buat kelas, toast, salin tautan) lulus dengan axe tanpa pelanggaran

### Story 1.7: API pendaftaran berkuota dengan daftar tunggu FIFO (R1, R2, R3)

Sebagai peserta pelatihan,
Saya ingin mendaftar dengan nama dan email lalu langsung mendapat status Terdaftar atau Daftar tunggu,
Sehingga saya tahu posisi saya, dan kelas tidak pernah melebihi kuota walaupun banyak orang mendaftar bersamaan (FR7–FR10).

**Mencakup:** FR7 (API), FR8, FR9, FR10, AD-5, AD-6, AD-10, AD-15, AD-17, AD-18, R-001, R-002, R-009, P0-001, P0-002, P1-014, P1-018.

**Acceptance Criteria:**

**Given** migrasi baru membuat `registrations` (`public_ref` unik, `class_id` FK, `email`, `name`, `status` dengan `CHECK IN ('registered','waitlisted','cancelled')`, `created_at`, `promoted_at`, `cancelled_at`, `cancelled_by`, `CHECK` konsistensi pembatalan AD-17, `CHECK` GLOB waktu) dengan unique index parsial `(class_id, email) WHERE status IN ('registered','waitlisted')` dan indeks `registrations(class_id, status, id)` serta `registrations(email)`
**When** skema diperiksa
**Then** tidak ada `DEFAULT` waktu, dan hanya `registrations-repo.ts` yang berisi `INSERT`/`UPDATE` ke `registrations`

**Given** fungsi domain murni `classStatus` (diperluas dengan Penuh), keputusan pendaftaran, dan posisi antrean
**When** diuji sebagai unit
**Then** status kelas Selesai bila `max(session_date) <= today`, Penuh bila Dibuka dan Terdaftar = kuota, selain itu Dibuka; keputusan = Terdaftar hanya bila `registered < quota` dan antrean kosong; posisi antrean 1-based menurut `id` naik

**Given** `GET /api/public/classes/:code`
**When** kode dikenal
**Then** respons memuat judul, tanggal sesi, status kelas (`open`/`full`/`finished`), dan `today`, tanpa id internal, kuota, atau data peserta; kode tidak dikenal → 404 `class_not_found`

**Given** `POST /api/public/classes/:code/registrations` dengan `{ name, email }`
**When** nama 1–100 karakter dan email berformat valid
**Then** dalam satu `withWriteTx`: `assertClassOpen` → cari pendaftaran aktif `(class_id, normalizeEmail(email))` → keputusan Terdaftar/Daftar tunggu → insert dengan `created_at = ctx.nowIso` dan `public_ref` 10 karakter base64url dari `crypto.randomBytes`; respons 200 `{ status, waitlistPosition?, nextSessionDate?, alreadyActive: false, registrationRef }`
**And** input tidak valid → 400 `validation_error` dengan `fields`
**And** respons publik tidak pernah memuat ID internal pendaftaran atau kelas; `registrationRef` acak dan tidak berurutan (test: 1.000 ref unik, tidak ada yang bisa diturunkan dari ref sebelumnya secara berurutan)

**Given** kelas kuota 5 dan 20 email berbeda
**When** 20 pendaftaran dijalankan bersamaan lewat `runConcurrently` (koneksi terpisah), diulang 50 kali
**Then** di setiap ulangan: tepat 5 Terdaftar, tepat 15 Daftar tunggu dengan posisi 1–15 tanpa celah maupun duplikat, dan tidak ada worker yang menerima error — test `R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered`

**Given** server berjalan dari `startTestServer()` dan kelas kuota 5
**When** 20 permintaan `POST /api/public/classes/:code/registrations` dengan email berbeda dikirim serentak lewat HTTP, diulang 50 kali
**Then** ke-20 respons berstatus 200 (tidak ada 5xx, termasuk 503 `database_busy`), tepat 5 berstatus Terdaftar dan 15 Daftar tunggu dengan `waitlistPosition` 1–15 tanpa celah maupun duplikat — test `R1: 20 concurrent HTTP registrations all succeed without 5xx and fill the quota exactly`

**Given** mutation check R1 (A-11)
**When** test yang sama dijalankan terhadap varian use-case yang membaca jumlah Terdaftar di luar `withWriteTx` lalu menulis di transaksi terpisah
**Then** assertion R1 gagal setidaknya sekali dalam 50 ulangan — test `R1: mutation check — non-atomic quota check is caught by the concurrency test`

**Given** email "Budi@Mail.com " sudah aktif di kelas
**When** "budi@mail.com" mendaftar lagi
**Then** tidak ada baris baru; respons 200 berisi status yang ada dengan `alreadyActive: true` dan posisi antrean bila Daftar tunggu — test `R2: email is normalized before the active-registration check`

**Given** dua permintaan identik dikirim bersamaan
**When** keduanya diproses dari koneksi berbeda
**Then** hanya satu baris aktif tercipta, keduanya mendapat 200 dengan status yang sama (satu `alreadyActive: false`, satu `alreadyActive: true`), dan `SQLITE_CONSTRAINT_UNIQUE` (bila terjadi) dipetakan ke bentuk `alreadyActive`, bukan 5xx; dibuktikan lewat worker dan lewat HTTP ke `startTestServer()`, masing-masing 50 ulangan — test `R2: concurrent duplicate registrations create one row`
**And** mutation check: varian tanpa cek aktif di transaksi dan tanpa unique index parsial membuat test gagal — test `R2: mutation check — removing the in-transaction check and partial unique index is caught`

**Given** kelas Penuh dengan daftar tunggu tidak kosong, atau kuota belum penuh tetapi antrean masih ada
**When** pendaftar baru datang
**Then** ia masuk ekor daftar tunggu — test `R3: a new registration is waitlisted while the waitlist is non-empty` dan `R3: waitlist is FIFO by registration time, id breaks ties`

**Given** kelas Selesai (tanggal sesi terakhir ≤ `today` WIB, diuji dengan clock palsu)
**When** pendaftaran dikirim
**Then** respons 409 `registration_closed` dengan pesan "Pendaftaran kelas ini sudah ditutup" dan tidak ada baris tercipta
**And** test `FR7: registration closes at 00.00 WIB on the last session date` (`*.tz.test.ts`) dengan sesi terakhir 10 Nov: `2026-11-09T16:59:00.000Z` (23.59 WIB 9 Nov) diterima; `2026-11-09T17:00:00.000Z` (00.00 WIB 10 Nov) dan `2026-11-10T16:30:00.000Z` (23.30 WIB 10 Nov) ditolak

**Given** `seed:demo`
**When** dijalankan
**Then** seed memuat kelas Penuh tanpa daftar tunggu, kelas Penuh dengan 3 Daftar tunggu, dan kelas Selesai yang punya Terdaftar + Daftar tunggu (B-2b), semuanya relatif terhadap `today` dari `Clock`

### Story 1.8: Halaman pendaftaran peserta yang ramah ponsel

Sebagai peserta pelatihan di ponsel (Dimas),
Saya ingin membuka tautan kelas, mengisi nama dan email, lalu melihat hasilnya di halaman yang sama,
Sehingga saya mendaftar dalam satu menit dan tahu persis status saya tanpa bertanya lewat WhatsApp (FR7, FR9, FR10, UJ-2).

**Mencakup:** FR7 (UI), FR9 (UI), FR10 (tampilan), UX-DR9, UX-DR18, UX-DR22, P1-025.

**Acceptance Criteria:**

**Given** `/daftar/{kode}` untuk kelas Dibuka belum penuh
**When** halaman dibuka di lebar 360 px
**Then** tampil judul kelas (`<h1>`), daftar tanggal sesi berformat Indonesia, kolom "Nama (wajib)" dan "Email (wajib)" setinggi ≥ 44 px dengan teks 16 px, tombol "Daftar" selebar penuh, dan tautan kaki "Cek status pendaftaran" disembunyikan (A-4); tidak ada gulir horizontal

**Given** kelas Penuh
**When** halaman dibuka
**Then** alert warning "Kelas penuh — Anda akan masuk daftar tunggu" tampil di atas formulir, formulir tetap ada, dan label tombol tetap "Daftar"

**Given** kelas Selesai atau kode tidak dikenal
**When** halaman dibuka
**Then** kelas Selesai menampilkan info kelas + alert info "Pendaftaran kelas ini sudah ditutup" tanpa formulir; kode tidak dikenal menampilkan "Kelas tidak ditemukan. Periksa kembali tautan dari penyelenggara."

**Given** peserta menekan "Daftar"
**When** request berjalan
**Then** tombol berlabel "Mendaftar…" dan nonaktif sehingga klik ganda tidak mengirim dua kali (P1-025)

**Given** respons Terdaftar
**When** diterima
**Then** formulir digantikan `ResultPanel` success di posisi yang sama: judul "Terdaftar" + "Sesi berikutnya: {tanggal}", fokus pindah ke judul panel, dan isinya diumumkan lewat `role="status"`

**Given** respons Daftar tunggu
**When** diterima
**Then** `ResultPanel` warning menampilkan "Daftar tunggu #N" dan "Anda akan otomatis menjadi Terdaftar bila ada peserta yang batal. Tidak ada pemberitahuan; cek halaman status untuk melihat perubahan." tanpa kata "gagal" atau warna merah

**Given** respons `alreadyActive: true`
**When** diterima
**Then** panel yang sama berjudul "Anda sudah terdaftar di kelas ini" atau "Anda sudah di daftar tunggu #N"

**Given** email tidak valid atau server tak terjangkau
**When** submit
**Then** error tampil di kolom email (nama tetap terisi) atau alert "Tidak dapat menghubungi server. Coba lagi." dengan isi formulir utuh

**Given** e2e di viewport 360×740
**When** UJ-2 dijalankan terhadap kelas seed yang tinggal satu kursi lalu diisi oleh peserta lain sebelum submit
**Then** peserta melihat "Daftar tunggu #N", tidak ada gulir horizontal (`scrollWidth <= clientWidth`), dan axe tanpa pelanggaran di semua state halaman pendaftaran

### Story 1.9: Tabel kelas admin

Sebagai admin (Rina),
Saya ingin melihat semua kelas dalam satu tabel padat,
Sehingga dalam sekilas saya tahu kelas mana yang penuh, berapa yang antre, dan kapan sesi berikutnya (FR4).

**Mencakup:** FR4 (revisi: tampilan 30 hari + "Tampilkan semua kelas Selesai"), NFR7 (smoke), AD-6, AD-20, UX-DR5, UX-DR19, P1-010, P2-007, P0-009, konvensi Kinerja (tanpa N+1).

**Acceptance Criteria:**

**Given** `GET /api/admin/classes`
**When** dipanggil
**Then** respons memuat per kelas: `id`, `publicCode`, judul, `nextSessionDate` (tanggal sesi terdekat ≥ `today`; null untuk kelas Selesai, termasuk pada hari sesi terakhirnya), `lastSessionDate`, status kelas, jumlah Terdaftar, kuota, jumlah Daftar tunggu, plus `today` dan `hiddenFinishedCount`, yang semuanya dihitung oleh fungsi domain AD-6
**And** tampilan bawaan memuat semua kelas Dibuka ditambah kelas Selesai yang `lastSessionDate` dalam 30 hari terakhir (`today − 30 ≤ lastSessionDate ≤ today`); `GET /api/admin/classes?finished=all` memuat semua kelas
**And** urutan dari server: kelas dengan sesi berikutnya paling dekat di atas, lalu kelas Selesai dengan `lastSessionDate` terbaru lebih dulu; data diambil dengan jumlah query tetap per request (tanpa N+1), dibuktikan oleh test yang menghitung query untuk 240 kelas

**Given** komponen `DataTable`
**When** halaman `/admin/kelas` menampilkan kelas
**Then** tabel `<table>` dengan `<caption>`, `<th scope="col">`, kolom Judul (tautan nyata ke `/admin/kelas/{id}`), Sesi berikutnya ("Senin, 9 Nov 2026" atau badge "Selesai"), Terisi/kuota ("18/20", rata kanan, angka tabular), dan Daftar tunggu (rata kanan); baris memakai `data-testid="class-row-{publicCode}"`
**And** kelas Penuh menampilkan badge "Penuh" (ikon + teks) di sel terisi/kuota, bukan warna saja

**Given** belum ada kelas
**When** halaman dibuka
**Then** tampil "Belum ada kelas." dengan tombol utama "Buat kelas"

**Given** ada kelas Selesai yang tersembunyi dari tampilan bawaan
**When** halaman dibuka
**Then** di bawah tabel tampil tautan "Tampilkan semua kelas Selesai ({hiddenFinishedCount})"; menekannya memuat semua kelas di tabel yang sama tanpa paginasi, fokus tetap di area tabel, dan tidak ada kelas yang hilang dari UI

**Given** kelas yang tanggal sesi terakhirnya hari ini
**When** tabel ditampilkan
**Then** kolom Sesi berikutnya menampilkan badge "Selesai" (PRD FR-4)

**Given** 240 kelas di DB uji (sebagian besar Selesai)
**When** kedua tampilan dibuka di 1366×768
**Then** keempat kolom terlihat tanpa gulir horizontal dan tanpa paginasi, dan test integrasi mencatat waktu respons server kedua tampilan di bawah 1 detik (smoke NFR7; bukti p95 penuh di Story 4.6)

**Given** e2e smoke UJ-1 + UJ-2 (P0-009)
**When** admin membuat kelas kuota 2, dua peserta mendaftar lewat tautan, lalu admin kembali ke Kelas
**Then** baris kelas menampilkan "2/2" dengan badge "Penuh"; peserta ketiga mendapat "Daftar tunggu #1" dan kolom Daftar tunggu menjadi 1 setelah halaman dimuat ulang; axe tanpa pelanggaran

### Story 1.10: Daftar pendaftaran di halaman kelas admin

Sebagai admin (Rina),
Saya ingin melihat siapa yang Terdaftar, siapa yang antre, dan siapa yang batal di satu kelas,
Sehingga saya tidak perlu menghitung dari chat dan bisa mengabari peserta yang naik secara manual (FR5, FR10).

**Mencakup:** FR5 (tanpa aksi pembatalan, presensi, rekap), FR10 (posisi konsisten), UX-DR13, UX-DR14, UX-DR15 (dasar), UX-DR3 (breadcrumb).

**Acceptance Criteria:**

**Given** `GET /api/admin/classes/:id`
**When** dipanggil
**Then** respons diperluas dengan daftar `registered` (nama, email, `createdAt`, `promoted`, `promotedAt`), `waitlisted` (posisi dari domain, nama, email, `createdAt`), dan `cancelled` (nama, email, `cancelledAt`, `cancelledBy`), masing-masing sudah terurut dari server, dengan satu query per tabel

**Given** halaman `/admin/kelas/{id}`
**When** dibuka
**Then** di bawah kepala kelas dari Story 1.6 tampil breadcrumb "Kelas › {judul}", daftar sesi (tanggal + penanda "Hari ini"), lalu bagian "Terdaftar", "Daftar tunggu", dan "Dibatalkan (N)" berurutan; setiap bagian adalah tabel dengan `<caption>` dan baris ber-`data-testid="registration-row-{registrationId}"`
**And** waktu tampil berformat "9 Nov 2026, 14.32 WIB"

**Given** pendaftaran hasil promosi (dibuat lewat fixture DB)
**When** bagian Terdaftar ditampilkan
**Then** baris itu memuat penanda `info` "Naik dari daftar tunggu · {waktu promosi}"

**Given** bagian Dibatalkan (✂2: boleh ditunda bila potongan kedua diterapkan; respons API tetap memuat `cancelled`)
**When** halaman dibuka
**Then** bagian memakai `<details>` tertutup bawaan dengan ringkasan "Dibatalkan (N)", dan pembatal tampil "peserta" atau "admin"

**Given** kelas tanpa pendaftaran
**When** halaman dibuka
**Then** bagian Terdaftar menampilkan "Belum ada peserta terdaftar. Bagikan tautan pendaftaran untuk mulai menerima peserta." dan bagian Daftar tunggu menampilkan "Tidak ada daftar tunggu"

**Given** pendaftaran Daftar tunggu yang sama
**When** posisinya dibaca dari respons pendaftaran (Story 1.7) dan dari halaman kelas admin
**Then** nomor posisinya sama — test `R3: waitlist position is identical on the registration result and the admin class page`
**And** axe tanpa pelanggaran pada halaman kelas admin dengan ketiga bagian terisi

### Story 1.11: API ubah kelas dengan batas kuota (R7) dan promosi saat kuota naik

Sebagai admin (Rina),
Saya ingin mengubah judul, tanggal sesi, dan kuota kelas dengan aman,
Sehingga kuota tidak pernah turun di bawah jumlah Terdaftar dan kursi baru langsung diisi antrean teratas, bukan pendaftar yang datang belakangan (FR3, R3, R7).

**Mencakup:** FR3 (tanpa bagian presensi, lihat A-3), AD-3, AD-4, AD-18, AD-19, R-004, R-007, R-010, P1-001, P1-002, P1-008, P0-005.

**Acceptance Criteria:**

**Given** `PATCH /api/admin/classes/:id` dengan sebagian dari `{ title, sessionDates, quota }`
**When** dipanggil
**Then** satu `withWriteTx` menjalankan `assertClassOpen` (kecuali bila hanya judul yang berubah), validasi FR2 lewat `validateSessionDates` yang sama dengan buat kelas, diff tanggal sesi (insert tanggal baru, delete tanggal yang hilang, tidak pernah hapus-semua), dan cek kuota, lalu mengembalikan DTO kelas terbaru dengan `promotedCount`

**Given** kelas dengan 14 Terdaftar
**When** kuota diubah menjadi 12
**Then** respons 409 `quota_below_registered` dengan pesan "Kuota minimal 14 (jumlah terdaftar saat ini)" (N sebenarnya) di `fields.quota`, dan tidak ada perubahan tersimpan — test `R7: lowering quota below registered count is rejected with the minimum in the message`

**Given** kuota sedang diturunkan sementara pendaftaran baru masuk bersamaan
**When** keduanya dijalankan lewat `runConcurrently`, diulang 50 kali
**Then** di setiap ulangan jumlah Terdaftar tidak pernah melebihi kuota akhir dan tidak ada respons 5xx — test `R7: concurrent quota decrease and registration never leave registered above quota` (P0-005)
**And** mutation check: varian yang membaca `COUNT(Terdaftar)` di luar transaksi ubah kuota membuat test gagal

**Given** tx-step `promoteFromWaitlist(tx, ctx, classId)` di `src/server/services/`
**When** kuota dinaikkan dari 5 ke 8 pada kelas dengan 5 Terdaftar dan 2 Daftar tunggu
**Then** kedua kepala antrean (urut `id`) menjadi Terdaftar dengan `promoted_at = ctx.nowIso` dalam transaksi yang sama, `promotedCount = 2`, dan update status berpenjaga `AND status='waitlisted'` dengan cek `changes === 1` — test `R3: raising quota promotes the head of the waitlist in the same transaction`
**And** `promoteFromWaitlist` memanggil `assertClassOpen` lebih dulu dan mempromosikan `min(kuota − Terdaftar, panjang antrean)`

**Given** kelas Selesai, termasuk pada tanggal sesi terakhirnya
**When** kuota atau tanggal sesi diubah
**Then** respons 409 `class_finished` tanpa perubahan dan tanpa promosi; mengubah judul saja tetap berhasil (P1-008)

**Given** perubahan judul
**When** disimpan
**Then** `public_code` tidak berubah, sehingga tautan pendaftaran tetap sama (FR6)

**Given** perubahan tanggal yang menghapus satu-satunya tanggal, membuat tanggal ganda, atau menyisakan nol tanggal setelah `today`
**When** disimpan
**Then** respons 400 `validation_error` dengan pesan yang sama seperti buat kelas

### Story 1.12: Halaman ubah kelas

Sebagai admin (Rina),
Saya ingin formulir ubah kelas yang menjelaskan batasnya dengan angka sebenarnya,
Sehingga saya bisa memperbaiki kelas tanpa menebak kenapa perubahan ditolak (FR3, UJ-1 kegagalan R7).

**Mencakup:** FR3 (UI), UX-DR7, UX-DR12, UX-DR20.

**Acceptance Criteria:**

**Given** tombol "Ubah kelas" di halaman kelas admin
**When** ditekan
**Then** `/admin/kelas/{id}/ubah` terbuka dengan breadcrumb "Kelas › {judul} › Ubah kelas" dan formulir yang sama dengan Buat kelas, terisi nilai saat ini

**Given** admin mengisi kuota 12 pada kelas dengan 14 Terdaftar
**When** menekan "Simpan kelas"
**Then** kolom kuota menampilkan "Kuota minimal 14 (jumlah terdaftar saat ini)" dari server, ringkasan error menerima fokus, dan nilai lain di formulir tetap ada

**Given** kuota dinaikkan pada kelas dengan daftar tunggu
**When** simpan berhasil
**Then** admin kembali ke halaman kelas admin dengan toast "Kelas tersimpan. N peserta naik dari daftar tunggu." (N = `promotedCount`) dan peserta itu tampil di bagian Terdaftar dengan penanda promosi; bila `promotedCount = 0` toast berbunyi "Kelas tersimpan"

**Given** kelas Selesai
**When** halaman ubah dibuka
**Then** tanggal sesi dan kuota tampil hanya-baca dengan teks "Kelas sudah selesai; hanya judul yang bisa diubah", dan hanya judul yang bisa disimpan

**Given** formulir punya perubahan belum tersimpan
**When** admin berpindah rute atau menutup tab
**Then** `useBlocker` menampilkan konfirmasi dan `beforeunload` memicu dialog bawaan browser; setelah simpan berhasil tidak ada peringatan

**Given** e2e kegagalan R7 dan kenaikan kuota
**When** dijalankan pada kelas seed Penuh dengan 3 Daftar tunggu
**Then** penolakan R7 dan promosi tampil seperti AC di atas, dan axe tanpa pelanggaran di halaman ubah kelas (termasuk state error dan state Selesai)

## Epic 2: Pembatalan, Promosi Otomatis & Status Peserta (R4)

Peserta bisa memeriksa status semua pendaftaran aktifnya lewat email dan membatalkan sendiri; admin bisa membatalkan atas nama peserta. Saat peserta Terdaftar batal, kepala daftar tunggu naik otomatis dalam transaksi yang sama.

### Story 2.1: API pembatalan idempoten dengan promosi otomatis (R4)

Sebagai peserta atau admin,
Saya ingin membatalkan pendaftaran aktif dan sistem langsung menaikkan antrean teratas,
Sehingga kursi kosong terisi tanpa campur tangan admin dan kuota tetap terjaga (FR11, FR12, FR13).

**Mencakup:** FR11 (API), FR12 (API), FR13, AD-3, AD-4, AD-16, AD-17, AD-18, R-003, R-009, R-013, P0-003, P0-004, P1-028, P1-029.

**Acceptance Criteria:**

**Given** tx-step `cancelRegistration(tx, ctx, { registrationId, by })`
**When** dipanggil untuk pendaftaran aktif setelah `assertClassOpen`
**Then** `UPDATE … SET status='cancelled', cancelled_at=@now, cancelled_by=@by WHERE id=@id AND status=@expected` dijalankan lewat `registrations-repo.ts` dengan cek `changes === 1`, dan `promoteFromWaitlist` (Story 1.11) dipanggil hanya bila status sebelumnya `registered`

**Given** `POST /api/public/cancellations` dengan `{ registrationRef, email }`
**When** keduanya cocok dengan satu pendaftaran (email dinormalisasi)
**Then** pembatalan tercatat dengan `cancelled_by = 'participant'` dan respons 200 DTO `CancellationResult` `{ alreadyCancelled, classTitle, promotedCount }`
**And** kedua masukan wajib; email dibandingkan setelah `normalizeEmail`; email tidak cocok **atau** `registrationRef` tidak dikenal → 404 `registration_not_found` dengan pesan identik "Pendaftaran tidak ditemukan" yang tidak menyebut bagian mana yang salah, tanpa perubahan data dan tanpa promosi — test `FR11: wrong email and unknown ref are indistinguishable and change nothing`
**And** email tidak pernah ada di URL; ID internal tidak diterima maupun dikembalikan oleh rute publik; tanpa rate limit (PRD §9)

**Given** `POST /api/admin/registrations/:id/cancellation` dengan sesi admin
**When** dipanggil
**Then** jalurnya memakai `cancelRegistration` yang sama dengan `cancelled_by = 'admin'` dan mengembalikan DTO `CancellationResult` yang sama; tanpa sesi → 401

**Given** kelas berkuota 5 dengan 5 Terdaftar dan 2 Daftar tunggu
**When** satu Terdaftar dibatalkan
**Then** kepala antrean menjadi Terdaftar dengan `promoted_at = ctx.nowIso` dalam transaksi yang sama, dan antrean yang tersisa bergeser ke posisi 1 — test `R4: cancelling a registered participant promotes the head of the waitlist in the same transaction`

**Given** pendaftaran Daftar tunggu
**When** dibatalkan
**Then** tidak ada promosi dan posisi antrean di belakangnya bergeser maju — test `R4: cancelling a waitlisted entry promotes nobody`

**Given** pendaftaran yang sudah Dibatalkan
**When** dibatalkan lagi oleh peserta atau admin
**Then** respons 200 `{ alreadyCancelled: true, promotedCount: 0 }` tanpa tulis, dan `cancelled_at`/`cancelled_by` tetap milik pembatalan pertama — test `R4: cancelling an already-cancelled registration is a no-op and promotes nobody`

**Given** beberapa pembatalan Terdaftar berbeda, serta peserta + admin membatalkan pendaftaran yang sama, dijalankan bersamaan lewat `runConcurrently` dan lewat HTTP ke `startTestServer()`
**When** masing-masing diulang 50 kali
**Then** jumlah Terdaftar tidak pernah melebihi kuota, tidak ada peserta yang dipromosikan dua kali, pembatalan ganda hanya memicu satu promosi, dan semua permintaan berhasil tanpa 5xx — test `R4: concurrent cancellations never push registered count above quota` (P0-003, P0-004)
**And** mutation check: varian yang memanggil `promoteFromWaitlist` di transaksi terpisah setelah pembatalan membuat test gagal — test `R4: mutation check — promotion outside the cancellation transaction is caught`

**Given** kelas Selesai, termasuk sepanjang tanggal sesi terakhirnya (clock palsu, `*.tz.test.ts`)
**When** pembatalan dikirim lewat rute publik atau admin
**Then** respons 409 `class_finished` dengan pesan "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan", tanpa perubahan dan tanpa promosi; pembatalan pukul 23.59 WIB sehari sebelumnya diterima

### Story 2.2: Halaman status peserta lewat email

Sebagai peserta pelatihan,
Saya ingin memasukkan email dan melihat semua pendaftaran aktif saya,
Sehingga saya tahu status dan posisi antrean saya tanpa bertanya ke koordinator (FR14, FR10, UJ-2, UJ-3).

**Mencakup:** FR14 (status, lihat A-2), FR10 (posisi konsisten, kelas Selesai), AD-6, AD-10, AD-20, UX-DR16 (tanpa kehadiran), UX-DR18, UX-DR22, R-006, P1-033, P1-034.

**Acceptance Criteria:**

**Given** `POST /api/public/status` dengan `{ email }`
**When** email punya pendaftaran aktif
**Then** respons 200 berisi daftar per pendaftaran aktif: `registrationRef`, judul kelas, tanggal sesi, status kelas, status pendaftaran, `promoted`, dan `waitlistPosition` dari fungsi domain yang sama dengan halaman admin, urut tanggal sesi pertama, plus `today`
**And** pendaftaran Daftar tunggu di kelas Selesai tidak punya posisi dan ditandai `waitlistFrozen: true`

**Given** email tanpa pendaftaran aktif
**When** dikirim
**Then** respons 200 dengan daftar kosong, dan halaman menampilkan "Tidak ada pendaftaran aktif untuk email ini." sebagai teks biasa

**Given** halaman `/status` di lebar 360 px
**When** peserta mengisi email lalu menekan "Lihat status"
**Then** tampil satu kartu peserta per pendaftaran: judul kelas, tanggal sesi, badge status ("Terdaftar", "Terdaftar (naik dari daftar tunggu)", atau "Daftar tunggu #N"); tanpa gulir horizontal dan target sentuh ≥ 44 px
**And** kartu Daftar tunggu di kelas Selesai menampilkan "Kelas selesai — tidak naik dari daftar tunggu"

**Given** email peserta
**When** halaman status dipakai
**Then** email tidak pernah masuk URL atau query string (dikirim lewat POST)

**Given** hasil pendaftaran di `/daftar/{kode}` (Story 1.8)
**When** story ini selesai
**Then** tautan "Lihat halaman status" di `ResultPanel` dan tautan kaki "Cek status pendaftaran" ditampilkan; tautan dari hasil membawa email lewat state navigasi sehingga formulir status langsung terisi dan dimuat

**Given** e2e
**When** peserta mendaftar, membuka halaman status dari panel hasil, dan membandingkan posisi antrean
**Then** posisinya sama dengan hasil pendaftaran dan halaman kelas admin, dan axe tanpa pelanggaran di semua state halaman status

### Story 2.3: Peserta membatalkan dari halaman status

Sebagai peserta pelatihan (Sari),
Saya ingin membatalkan pendaftaran saya sendiri dengan konfirmasi yang jelas,
Sehingga kursi saya bisa dipakai orang lain tanpa harus menghubungi koordinator (FR11, UJ-3).

**Mencakup:** FR11 (UI), FR13 (tampilan), UX-DR10, UX-DR16, P1-032.

**Acceptance Criteria:**

**Given** komponen `ConfirmDialog` di `src/client/components/`
**When** dibuka
**Then** lebar maks 440 px (selebar layar dikurangi margin di ponsel), fokus awal di tombol "Kembali", `Esc` dan klik latar menutup tanpa aksi, fokus kembali ke tombol pemicu, dan dialog tidak bisa bertumpuk

**Given** kartu pendaftaran aktif di kelas Dibuka
**When** peserta menekan "Batalkan pendaftaran"
**Then** dialog menampilkan "Batalkan pendaftaran di kelas {judul}? Tindakan ini tidak bisa dibatalkan." dengan tombol "Kembali" dan tombol bahaya "Ya, batalkan"; tombol bahaya tidak pernah muncul di langkah pertama

**Given** peserta memilih "Ya, batalkan"
**When** klien mengirim `POST /api/public/cancellations` dengan `registrationRef` kartu itu dan email yang dipakai untuk memuat halaman status
**And** pembatalan berhasil
**Then** kartu itu hilang dari daftar, alert success "Pendaftaran di {judul} dibatalkan." tampil di atas daftar, menerima fokus, dan diumumkan pembaca layar

**Given** kelas Selesai, termasuk pada tanggal sesi terakhirnya
**When** kartu ditampilkan
**Then** tombol "Batalkan pendaftaran" tidak ada dan diganti teks "Kelas sudah selesai"; bila API tetap mengembalikan `class_finished`, alert danger "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan" tampil

**Given** respons `alreadyCancelled: true`
**When** diterima (klik ganda atau admin sudah membatalkan)
**Then** halaman menampilkan hasil yang sama dengan pembatalan berhasil dan daftar dimuat ulang

**Given** e2e UJ-3 (P1-032)
**When** Sari (Terdaftar) membatalkan dari halaman status, lalu Dimas (Daftar tunggu #1) membuka halaman statusnya
**Then** kartu Dimas menampilkan "Terdaftar (naik dari daftar tunggu)", dan axe tanpa pelanggaran pada dialog dan alert

### Story 2.4: Admin membatalkan atas nama peserta

Sebagai admin (Rina),
Saya ingin membatalkan pendaftaran peserta dari halaman kelas admin,
Sehingga saya bisa menindaklanjuti peserta yang mengabari lewat telepon atau chat (FR12, FR13).

**Mencakup:** FR12 (UI), FR5 (bagian Dibatalkan oleh admin), UX-DR10, UX-DR13.

**Acceptance Criteria:**

**Given** halaman kelas admin untuk kelas Dibuka
**When** ditampilkan
**Then** setiap baris di bagian Terdaftar dan Daftar tunggu punya tombol "Batalkan" dengan nama aksesibel yang memuat nama peserta (mis. "Batalkan — Dimas Pratama")

**Given** admin menekan "Batalkan" pada satu baris
**When** dialog konfirmasi muncul
**Then** isinya menyebut nama peserta dan judul kelas serta bahwa tindakan tidak bisa dibatalkan, dengan fokus awal di "Kembali"

**Given** admin mengonfirmasi pembatalan pendaftaran Terdaftar di kelas dengan daftar tunggu
**When** berhasil
**Then** halaman dimuat ulang: pendaftaran itu pindah ke bagian Dibatalkan dengan pembatal "admin", kepala antrean tampil di bagian Terdaftar dengan penanda "Naik dari daftar tunggu · {waktu}", dan toast "Pendaftaran dibatalkan. 1 peserta naik dari daftar tunggu." muncul

**Given** kelas Selesai, termasuk pada tanggal sesi terakhirnya
**When** halaman ditampilkan
**Then** tombol "Batalkan" tidak tampil; bila API mengembalikan `class_finished`, alert danger "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan" tampil sebaris

**Given** e2e
**When** admin membatalkan satu peserta di kelas seed Penuh dengan 3 Daftar tunggu
**Then** hasil seperti AC di atas terlihat di halaman kelas admin dan di tabel Kelas (Daftar tunggu berkurang 1), dan axe tanpa pelanggaran

## Epic 3: Presensi per Sesi (R5)

Admin mencatat dan mengoreksi kehadiran satu sesi dengan satu kali simpan, hanya untuk sesi yang tanggalnya sudah tiba (WIB), dan melihat sesi hari ini di semua kelas sebagai beranda (SHOULD).

### Story 3.1: API presensi per sesi dengan penjaga tanggal (R5)

Sebagai admin (Rina),
Saya ingin menyimpan presensi semua peserta Terdaftar untuk satu sesi dalam satu permintaan,
Sehingga kehadiran tercatat utuh dan sesi yang belum tiba tidak bisa diisi, termasuk lewat API langsung (FR15, FR16).

**Mencakup:** FR15 (API), FR16, AD-7, AD-11, R-005, R-021, P0-006, P1-036, P1-038.

**Acceptance Criteria:**

**Given** migrasi baru membuat `attendance` (`registration_id` FK, `class_session_id` FK `ON DELETE RESTRICT`, `present INTEGER CHECK (present IN (0,1))`, `UNIQUE(registration_id, class_session_id)`, kolom waktu ber-`CHECK` GLOB) dan indeks `attendance(class_session_id)`
**When** skema diperiksa
**Then** tidak ada `DEFAULT` waktu dan presensi melekat pada pendaftaran, bukan email

**Given** `GET /api/admin/classes/:id/sessions/:date/attendance`
**When** dipanggil untuk tanggal sesi kelas itu
**Then** respons memuat tanggal, state sesi (`saved | open | today | upcoming`), `sessionSaved`, dan daftar peserta Terdaftar (urut dari server) dengan `registrationId`, nama, email, dan `present: boolean | null`, plus `today`
**And** tanggal yang bukan sesi kelas itu → 404 `session_not_found`; pendaftaran Dibatalkan tidak tampil walaupun barisnya ada

**Given** `PUT /api/admin/classes/:id/sessions/:date/attendance` dengan `{ entries: [{ registrationId, present }] }`
**When** tanggal sesi ≤ `ctx.today`
**Then** dalam satu `withWriteTx` tanggal di-resolve ke `class_sessions`, entri `present: true` (Hadir) dan `present: false` (Tidak hadir) di-upsert, entri `present: null` (Belum dicatat) tidak menulis apa pun, dan respons mengembalikan state formulir terbaru
**And** catatan yang sudah tersimpan tidak pernah dihapus: entri `null` untuk peserta yang sudah punya catatan membiarkan catatannya tetap (A-13); koreksi `true ↔ false` diperbolehkan — test `FR15: saving leaves unrecorded participants without a record`

**Given** tanggal sesi > `ctx.today`
**When** PUT dikirim
**Then** respons 409 `session_not_yet_open` dengan pesan "Bisa diisi mulai {Senin, 16 Nov 2026}" dan tidak ada baris tertulis
**And** test `R5: attendance is accepted for today in Asia/Jakarta and rejected for tomorrow` (`attendance.tz.test.ts`, dijalankan dengan `TZ=UTC`, `Asia/Jakarta`, `Asia/Jayapura`, clock palsu) mencakup: 00.30 WIB 10 Nov (`2026-11-09T17:30:00.000Z`, UTC masih 9 Nov) → sesi 10 Nov diterima, sesi 11 Nov ditolak; 06.59 WIB 10 Nov (`2026-11-09T23:59:00.000Z`) → sesi 10 Nov diterima; 23.30 WIB 10 Nov (`2026-11-10T16:30:00.000Z`, Asia/Jayapura sudah 11 Nov) → sesi 11 Nov ditolak (P0-006)

**Given** batch yang memuat `registrationId` yang tidak lagi Terdaftar di kelas itu (dibatalkan saat formulir terbuka)
**When** PUT dikirim
**Then** seluruh batch ditolak 409 `roster_changed` tanpa tulis apa pun (P1-036)

**Given** peserta yang naik dari daftar tunggu setelah sesi disimpan
**When** GET dipanggil
**Then** ia tampil dengan `present: null` (Belum dicatat), tanpa nilai bawaan (P1-038)

**Given** kelas Selesai, termasuk kelas yang sesi terakhirnya hari ini
**When** presensi sesi terakhir dicatat atau presensi lama dikoreksi
**Then** penyimpanan tetap berhasil (presensi tidak memakai `assertClassOpen`, AD-11, PRD §4.2)

**Given** `seed:demo`
**When** dijalankan
**Then** seed menambahkan kelas dengan sesi lampau + presensi sebagian (termasuk peserta Belum dicatat), kelas Dibuka dengan sesi hari ini, dan kelas yang sesi terakhirnya hari ini (Selesai, presensi masih bisa diisi) untuk UJ-4 (NFR9)

### Story 3.2: Daftar sesi dengan status presensi di halaman kelas admin

Sebagai admin (Rina),
Saya ingin melihat sesi mana yang sudah diisi, belum diisi, atau belum bisa diisi,
Sehingga saya langsung tahu presensi mana yang harus saya kerjakan (FR5, FR16).

**Mencakup:** FR5 (entri presensi), FR16 (UI daftar sesi), AD-20, UX-DR15.

**Acceptance Criteria:**

**Given** `GET /api/admin/classes/:id`
**When** dipanggil
**Then** setiap sesi di respons membawa `state` (`saved | open | today | upcoming`) dan `hasAttendance` yang dihitung server

**Given** daftar sesi di halaman kelas admin
**When** ditampilkan
**Then** setiap baris memuat tanggal, penanda "Hari ini" bila relevan, status presensi ("Tersimpan", "Belum diisi", atau "Bisa diisi mulai {tanggal}"), dan aksi
**And** sesi yang sudah tiba punya tautan "Isi presensi" (belum diisi) atau "Ubah presensi" (tersimpan) ke `/admin/kelas/{id}/sesi/{tanggal}`; sesi mendatang tidak punya tautan, hanya teks

**Given** e2e dengan kelas seed bersesi lampau, hari ini, dan mendatang
**When** halaman kelas admin dibuka
**Then** ketiga state tampil benar sesuai `today` dari clock palsu, dan axe tanpa pelanggaran

### Story 3.3: Formulir presensi sesi

Sebagai admin (Rina),
Saya ingin menandai setiap peserta Hadir atau Tidak hadir dalam satu formulir lalu menekan "Simpan" sekali,
Sehingga presensi satu sesi selesai dalam hitungan detik di akhir kelas tanpa mencampur "absen" dengan "belum dicatat" (FR15, FR16, UJ-4).

**Mencakup:** FR15 (UI, kontrol tiga keadaan — tidak pernah dipotong), FR16 (UI rute langsung), UX-DR7, UX-DR17, UX-DR20, NFR3.

**Acceptance Criteria:**

**Given** `/admin/kelas/{id}/sesi/{tanggal}` untuk sesi yang sudah tiba
**When** dibuka
**Then** tampil breadcrumb "Kelas › {judul} › Sesi {tanggal}", satu baris per peserta Terdaftar (`data-testid="attendance-row-{registrationId}"`) berisi nama, email, dan satu grup radio (`fieldset` dengan `legend` nama peserta) beropsi "Hadir", "Tidak hadir", dan "Belum dicatat", serta penghitung langsung "Hadir: x · Tidak hadir: y · Belum dicatat: z"
**And** tanpa FR18, peserta tanpa catatan dibuka dengan "Belum dicatat" terpilih; peserta yang sudah punya catatan menampilkan nilai tersimpannya dan opsi "Belum dicatat" tidak tersedia untuknya
**And** kontrolnya pilihan tunggal (radio), bukan checkbox, dan nilainya dibedakan dengan teks, bukan warna saja

**Given** formulir
**When** dioperasikan hanya dengan keyboard
**Then** `Tab` berpindah antargrup peserta, tombol panah memilih opsi di dalam grup, dan tombol "Simpan" bisa dicapai dan ditekan

**Given** admin memilih Hadir untuk A, Tidak hadir untuk B, dan membiarkan C Belum dicatat
**When** menekan "Simpan"
**Then** hanya A dan B yang punya catatan; C tetap Belum dicatat, dan saat formulir dibuka ulang C masih menampilkan "Belum dicatat" terpilih

**Given** admin menekan "Simpan"
**When** berhasil
**Then** tombol berlabel "Menyimpan…" dan nonaktif selama request, lalu admin kembali ke halaman kelas admin dengan toast "Presensi tersimpan" dan status sesi menjadi "Tersimpan"

**Given** simpan gagal (jaringan atau `roster_changed`)
**When** respons diterima
**Then** alert danger sebaris di atas tombol "Simpan" menampilkan "Presensi belum tersimpan. Coba lagi." (atau pesan `roster_changed` yang meminta muat ulang), dan semua pilihan tetap seperti sebelum simpan

**Given** sesi mendatang dibuka langsung lewat URL
**When** halaman dimuat
**Then** tampil "Bisa diisi mulai {tanggal}" tanpa formulir

**Given** kelas tanpa peserta Terdaftar
**When** halaman dibuka
**Then** tampil "Belum ada peserta terdaftar di kelas ini." tanpa tombol "Simpan"

**Given** perubahan belum tersimpan
**When** admin meninggalkan halaman
**Then** `useBlocker` + `beforeunload` memperingatkan

**Given** e2e
**When** admin mengisi presensi sesi hari ini (sebagian peserta dibiarkan Belum dicatat), menyimpan, lalu membuka ulang untuk koreksi Hadir ↔ Tidak hadir
**Then** nilai tersimpan tampil dan bisa dikoreksi, peserta yang dibiarkan tetap Belum dicatat, dan axe tanpa pelanggaran di semua state (formulir presensi termasuk cakupan axe minimum ✂2)

### Story 3.4: Penguncian tanggal sesi berpresensi dan konfirmasi perubahan tanggal

Sebagai admin (Rina),
Saya ingin sistem mencegah saya menghapus tanggal yang sudah berpresensi dan memperingatkan saya sebelum mengubah total sesi,
Sehingga data kehadiran dan kelayakan sertifikat tidak berubah diam-diam (FR3 bagian presensi, A-3).

**Mencakup:** FR3 (sisa), AD-11, AD-19, UX-DR10, UX-DR12, P1-005, P1-006, P1-007.

**Acceptance Criteria:**

**Given** kelas dengan presensi di tanggal X
**When** `PATCH /api/admin/classes/:id` menghapus atau mengubah tanggal X
**Then** respons 409 `session_has_attendance` dengan `fields` di baris tanggal itu, tanpa perubahan

**Given** kelas yang sudah punya presensi dan diff tanggal tidak kosong
**When** PATCH dikirim tanpa `confirmSessionChange: true`
**Then** respons 409 `confirmation_required` tanpa perubahan; dengan `confirmSessionChange: true` perubahan disimpan dalam satu transaksi

**Given** kelas tanpa presensi
**When** tanggal diubah
**Then** tidak diperlukan konfirmasi (perilaku Story 1.11 tetap)

**Given** halaman Ubah kelas untuk kelas berpresensi
**When** dibuka
**Then** tanggal berpresensi tampil terkunci tanpa tombol "Hapus" dengan teks "Sudah ada presensi — tidak bisa diubah"

**Given** (✂2: dialog ini boleh ditunda bila potongan kedua diterapkan; penguncian tanggal berpresensi di atas tetap wajib, dan selama dialog ditunda klien selalu mengirim `confirmSessionChange: true` setelah teks peringatan sebaris tampil di formulir) admin menyimpan perubahan tanggal dan server menjawab `confirmation_required`
**When** respons diterima
**Then** `ConfirmDialog` menampilkan "Mengubah tanggal sesi akan mengubah total sesi dan kelayakan sertifikat semua peserta. Lanjutkan?" dengan tombol "Kembali" / "Simpan perubahan"; "Simpan perubahan" mengirim ulang dengan `confirmSessionChange: true`

**Given** e2e
**When** admin menambah tanggal pada kelas seed berpresensi sebagian
**Then** dialog konfirmasi muncul, simpan berhasil setelah konfirmasi, dan axe tanpa pelanggaran pada dialog

### Story 3.5 (SHOULD): Bawaan "semua hadir" di formulir presensi baru

Sebagai admin (Rina),
Saya ingin formulir presensi yang belum pernah disimpan dibuka dengan semua peserta dalam keadaan Hadir,
Sehingga saya cukup mengubah peserta yang absen menjadi Tidak hadir (FR18).

**Mencakup:** FR18, UX-DR17, SM-C1.

**Acceptance Criteria:**

**Given** sesi yang belum pernah disimpan (`sessionSaved: false`)
**When** formulir dibuka
**Then** semua peserta terpilih "Hadir", penghitung menampilkan "Hadir: y · Tidak hadir: 0 · Belum dicatat: 0", dan teks di atas formulir berbunyi "Semua peserta ditandai Hadir. Ubah menjadi Tidak hadir untuk peserta yang tidak datang."
**And** pilihan Hadir bawaan dihitung sebagai pilihan admin: "Simpan" membuat catatan Hadir untuk setiap peserta yang tidak diubah

**Given** sesi yang sudah pernah disimpan
**When** formulir dibuka
**Then** bawaan tidak diterapkan: nilai tersimpan tampil dan peserta tanpa catatan (mis. hasil promosi setelah sesi disimpan) tetap "Belum dicatat" (FR15 menang atas FR18)

**Given** e2e UJ-4 langkah 1–3
**When** admin mengubah tiga dari 20 peserta menjadi Tidak hadir lalu menyimpan
**Then** penghitung menunjukkan "Hadir: 17 · Tidak hadir: 3 · Belum dicatat: 0" sebelum simpan dan 20 catatan tersimpan sesuai

### Story 3.6 (SHOULD): Beranda "Sesi hari ini"

Sebagai admin (Rina),
Saya ingin melihat semua sesi hari ini di semua kelas begitu saya masuk,
Sehingga saya membuka formulir presensi yang tepat dengan satu klik (FR17).

**Mencakup:** FR17, AD-7, AD-20, UX-DR3, UX-DR5.

**Acceptance Criteria:**

**Given** `GET /api/admin/today`
**When** dipanggil
**Then** respons memuat sesi bertanggal `today` (WIB) di semua kelas, urut judul kelas, dengan judul kelas, tanggal, state presensi, dan jumlah Terdaftar, plus `today`

**Given** admin masuk
**When** membuka `/admin`
**Then** halaman "Sesi hari ini" tampil sebagai tabel (tidak lagi mengalihkan ke Kelas), setiap baris menautkan ke formulir presensinya, dan top bar menampilkan tautan "Sesi hari ini" dengan indikator aktif

**Given** tidak ada sesi hari ini
**When** halaman dibuka
**Then** tampil "Tidak ada sesi hari ini" dengan tautan "Lihat semua kelas"

**Given** e2e dengan clock palsu
**When** halaman dibuka dengan `timezoneId: 'UTC'` pada 23.30 WIB
**Then** sesi yang ditampilkan adalah sesi bertanggal WIB hari itu, dan axe tanpa pelanggaran

## Epic 4: Kelayakan Sertifikat, Rekap & Ekspor CSV (R6)

Admin melihat grid rekap kehadiran dan status kelayakan sertifikat setiap peserta, lalu mengekspornya ke CSV pada hari sesi terakhir. Peserta melihat jumlah kehadiran dan kelayakannya sendiri.

### Story 4.1: Kelayakan sertifikat dan API rekap kelas (R6)

Sebagai admin (Rina),
Saya ingin sistem menghitung kehadiran dan kelayakan sertifikat setiap peserta Terdaftar dengan satu rumus,
Sehingga grid, halaman status, dan CSV selalu sepakat (FR19, FR21 API).

**Mencakup:** FR19, FR21 (API), AD-6, AD-20, R-006, P0-007.

**Acceptance Criteria:**

**Given** fungsi domain murni `computeEligibility({ present, totalSessions })`
**When** diuji
**Then** "Layak" bila `present * 5 >= totalSessions * 4`, selain itu "Belum layak", hanya dengan bilangan bulat — test `R6: eligibility thresholds for 1, 3, 4, 5 sessions` mencakup 5 sesi → 4 hadir Layak dan 3 tidak; 4 → 4; 3 → 3 (2 tidak); 1 → 1
**And** fitness test atau test unit memastikan tidak ada literal `0.8` di modul kelayakan

**Given** `GET /api/admin/classes/:id/recap`
**When** dipanggil
**Then** respons memuat tanggal sesi (kolom), dan per peserta Terdaftar: `registrationId`, nama, email, sel per sesi (`present | absent | unrecorded`), jumlah hadir, total sesi (termasuk sesi mendatang), dan kelayakan dari `computeEligibility`, plus `today`; pendaftaran Dibatalkan tidak ikut walaupun punya presensi
**And** sel `unrecorded` (Belum dicatat, tanpa baris `attendance`) tidak pernah dihitung sebagai Tidak hadir — test `R6: unrecorded sessions are not counted as absent`
**And** data diambil dengan satu query per tabel (tanpa N+1)

**Given** presensi dikoreksi atau tanggal sesi ditambah/dihapus
**When** rekap dibaca lagi
**Then** jumlah hadir, total sesi, dan kelayakan langsung mencerminkan perubahan

### Story 4.2: Grid rekap kehadiran

Sebagai admin (Rina),
Saya ingin melihat tabel peserta × sesi dengan jumlah hadir dan kelayakan,
Sehingga saya tahu siapa yang layak sertifikat tanpa menyusun rekap dengan tangan (FR21, UJ-4).

**Mencakup:** FR21 (UI), FR5 (entri rekap), UX-DR5, UX-DR19.

**Acceptance Criteria:**

**Given** tombol "Lihat rekap" di halaman kelas admin
**When** ditekan
**Then** `/admin/kelas/{id}/rekap` terbuka dengan breadcrumb "Kelas › {judul} › Rekap"

**Given** grid rekap
**When** ditampilkan
**Then** `<table>` dengan `<caption>`, nama peserta sebagai `<th scope="row">`, satu kolom per tanggal sesi berisi "Hadir", "Tidak hadir", atau "—" (`data-testid="recap-cell-{registrationId}-{YYYY-MM-DD}"`), kolom jumlah hadir "x/y" rata kanan tabular, dan badge kelayakan (`data-testid="recap-eligibility-{registrationId}"`); nilai dibedakan dengan teks, bukan warna saja

**Given** kelas 5 sesi di 1366×768
**When** grid dibuka
**Then** grid muat tanpa gulir horizontal; kelas dengan lebih dari ±8 sesi bergulir di dalam wadahnya dengan kolom nama menempel di kiri

**Given** kelas tanpa peserta Terdaftar
**When** grid dibuka
**Then** tampil "Belum ada peserta terdaftar di kelas ini." tanpa tombol "Ekspor CSV"

**Given** e2e
**When** admin menyimpan presensi lalu membuka rekap
**Then** sel dan kelayakan mencerminkan presensi yang baru disimpan, dan axe tanpa pelanggaran

### Story 4.3: Ekspor rekap CSV

Sebagai admin (Rina),
Saya ingin mengunduh rekap satu kelas sebagai CSV yang terbuka rapi di Excel,
Sehingga saya bisa mengirim daftar sertifikat ke bagian sertifikat pada hari sesi terakhir (FR22, SM-2, SM-3).

**Mencakup:** FR22, konvensi CSV spine, R-012, P1-043, P1-044, P1-045.

**Acceptance Criteria:**

**Given** `GET /api/admin/classes/:id/recap.csv`
**When** dipanggil
**Then** berkas dibangun dari data dan label yang sama dengan Story 4.1 (`glossary.ts`): header Indonesia (Nama, Email, satu kolom per tanggal sesi, Jumlah hadir, Total sesi, Status kelayakan), UTF-8 dengan BOM, baris CRLF, dan kutip RFC 4180

**Given** nama dengan koma, tanda kutip, atau huruf non-ASCII (mis. `Nur "Ani", S.Kom`, `Ñoño`)
**When** diekspor
**Then** nilai tetap utuh saat di-parse ulang oleh test parser CSV

**Given** sel yang diawali `=`, `+`, `-`, atau `@`
**When** diekspor
**Then** sel itu diberi awalan `'` — test unit per karakter (P1-043)

**Given** judul kelas `Excel/Keuangan: "Dasar"` dan `today` 2026-11-30
**When** diekspor
**Then** `Content-Disposition` berisi `filename` ASCII dengan karakter `/ \ : * ? " < > |` diganti tanda hubung dan `filename*` UTF-8 (RFC 6266), berpola `<judul-aman> - 2026-11-30.csv`

**Given** tombol "Ekspor CSV" di grid rekap
**When** ditekan
**Then** unduhan berjalan lewat tautan unduhan biasa tanpa membuka halaman baru

**Given** e2e UJ-4 (P1-045) dengan clock palsu pada tanggal sesi terakhir kelas seed
**When** admin mengisi presensi sesi terakhir, membuka rekap, lalu menekan "Ekspor CSV"
**Then** berkas terunduh dengan nama yang benar dan isinya sama dengan grid
**And** pada hari yang sama, pendaftaran baru ke kelas itu ditolak "Pendaftaran kelas ini sudah ditutup" dan pembatalan ditolak `class_finished`, sehingga daftar peserta di CSV sudah final (PRD §4.2, SM-3); hanya koreksi presensi yang masih mengubah isinya

### Story 4.4: Kehadiran dan kelayakan di halaman status peserta

Sebagai peserta pelatihan,
Saya ingin melihat jumlah kehadiran dan apakah saya layak sertifikat,
Sehingga saya tidak perlu bertanya ke koordinator (FR14 sisa, FR19, A-2).

**Mencakup:** FR14 (kehadiran + kelayakan), FR19, AD-6, UX-DR16, P1-042.

**Acceptance Criteria:**

**Given** `POST /api/public/status`
**When** email punya pendaftaran Terdaftar
**Then** setiap pendaftaran Terdaftar membawa jumlah hadir, total sesi, dan kelayakan dari `computeEligibility` yang sama dengan rekap; pendaftaran Daftar tunggu tidak membawanya

**Given** kartu peserta Terdaftar
**When** ditampilkan
**Then** kartu memuat "Hadir x dari y sesi" (y = total sesi) dan badge kelayakan

**Given** satu peserta dengan presensi sebagian
**When** kelayakannya dibandingkan di grid rekap, CSV, dan halaman status
**Then** ketiganya sama — test integrasi konsistensi antar-permukaan (P1-042)

**Given** e2e di 360 px
**When** peserta seed dengan presensi sebagian membuka halaman status
**Then** kehadiran dan kelayakan tampil tanpa gulir horizontal, dan axe tanpa pelanggaran

### Story 4.5 (SHOULD): Status "Tidak mungkin layak"

Sebagai admin dan peserta,
Saya ingin melihat lebih awal bila seorang peserta sudah tidak mungkin mencapai ambang kelayakan,
Sehingga tidak ada yang berharap pada sertifikat yang mustahil (FR20).

**Mencakup:** FR20, AD-6.

**Acceptance Criteria:**

**Given** `computeEligibility` diperluas dengan `unrecordedSessions` (jumlah sesi Belum dicatat untuk pendaftaran itu)
**When** `(present + unrecordedSessions) * 5 < totalSessions * 4`
**Then** hasilnya "Tidak mungkin layak" menggantikan "Belum layak" — test `R6: impossible-eligibility thresholds` mencakup: 5 sesi + 2 "Tidak hadir" tercatat → Tidak mungkin layak; 5 sesi + 1 "Tidak hadir" → Belum layak; 3 sesi + 1 "Tidak hadir" → Tidak mungkin layak
**And** sesi Belum dicatat mencakup sesi mendatang dan sesi lampau yang belum diisi; hanya catatan Tidak hadir yang mengurangi peluang layak (5 sesi lampau semuanya Belum dicatat → Belum layak, bukan Tidak mungkin layak)

**Given** grid rekap, CSV, dan halaman status
**When** status ini berlaku
**Then** ketiganya menampilkan badge/teks "Tidak mungkin layak" dari `glossary.ts` dengan varian badge `danger`

### Story 4.6: Kesiapan rilis: bukti kinerja dan pencadangan

Sebagai tim pengembang Kelasku,
Saya ingin bukti kinerja pada data satu tahun dan skrip pencadangan yang teruji,
Sehingga MVP bisa dipakai lembaga dengan keyakinan bahwa ia cepat dan datanya bisa dipulihkan (NFR7, AD-1, AD-12).

**Mencakup:** NFR7, HP-5, R-014, R-015, UX-DR23 (uji manual), Stack Seed operasi.

**Acceptance Criteria:**

**Given** `npm run seed:perf`
**When** dijalankan pada DB kosong
**Then** DB berisi ±240 kelas, ±5.000 pendaftaran, dan presensi realistis, dibuat lewat use-case yang sama dengan aplikasi

**Given** skrip ukur kinerja dijalankan di bawah `taskset -c 0` terhadap build produksi
**When** setiap halaman/aksi utama (termasuk kedua tampilan tabel kelas) dan ekspor CSV satu kelas diukur
**Then** p95 < 1 s untuk halaman/aksi dan < 2 s untuk CSV, dan hasilnya dicatat di `_bmad-output/test-artifacts/` sebagai bukti NFR7
**And** ✂2: bila potongan kedua diterapkan, benchmark p95 diganti smoke test — tabel kelas, halaman kelas, dan ekspor CSV pada data seed satu tahun dimuat masing-masing satu kali di bawah target waktunya, hasil dicatat di tempat yang sama

**Given** `npm run backup`
**When** dijalankan saat server berjalan
**Then** `db.backup` membuat `backups/kelasku-YYYYMMDD.db` (tanggal WIB dari `Clock`) yang lulus `PRAGMA integrity_check`, dan drill pemulihan sesuai prosedur spine berhasil membuka data yang sama

**Given** checklist rilis MVP
**When** disusun
**Then** memuat uji manual keyboard saja + pembaca layar (NVDA atau TalkBack) di setiap permukaan IA, dan hasilnya dicatat sebelum go-live
**And** ✂2: bila potongan kedua diterapkan, uji keyboard manual wajib untuk alur pendaftaran, status + pembatalan, dan presensi; halaman admin lain diperiksa best-effort

### Story 4.7: Penyajian produksi lewat HTTPS

Sebagai koordinator lembaga,
Saya ingin Kelasku berjalan di satu server lembaga yang bisa dibuka peserta dari ponsel di luar kantor lewat HTTPS,
Sehingga peserta bisa mendaftar dari mana saja dan password admin, cookie sesi, serta nama dan email peserta tidak melintas jaringan publik tanpa enkripsi (NFR6, NFR8, UJ-2).

**Mencakup:** NFR6 (produksi satu server), NFR8 (HTTPS + alih HTTP), AD-1, AD-9 (`COOKIE_SECURE`), A-10, risiko PRD §9 "server harus terjangkau lewat HTTPS". Tidak pernah dipotong.

**Acceptance Criteria:**

**Given** spine arsitektur
**When** story dimulai
**Then** keputusan terminasi TLS (A-10: reverse proxy di server yang sama, Fastify di `127.0.0.1`) sudah tercatat di spine lewat mode update `bmad-architecture` atau `bmad-correct-course`; bila spine memutuskan lain, story mengikuti spine

**Given** konfigurasi produksi
**When** Kelasku dijalankan dengan `NODE_ENV=production`
**Then** Fastify mendengar di `127.0.0.1:{PORT}` (alamat bisa diatur lewat env baru `HOST`, ditambahkan ke `.env.example` tanpa nilai rahasia), `COOKIE_SECURE=true`, dan `trustProxy` aktif hanya untuk proxy lokal sehingga log dan pemeriksaan skema memakai protokol asli
**And** proses menolak start di `NODE_ENV=production` bila `COOKIE_SECURE` bukan `true`, dengan pesan error yang jelas

**Given** contoh konfigurasi reverse proxy di `deploy/` (mis. `Caddyfile`) dan runbook `docs/deployment.md`
**When** diikuti di server lembaga
**Then** permintaan `http://{domain}/…` dialihkan 301/308 ke `https://{domain}/…`, `https://{domain}/daftar/{kode}` menyajikan aplikasi, dan cookie `kelasku_session` dikirim dengan atribut `Secure`
**And** runbook mencatat prasyarat (alamat publik, nama domain, sertifikat — risiko PRD §9) beserta prosedur backup, upgrade, dan pemulihan dari spine; tidak ada layanan cloud untuk DB, hosting, atau auth

**Given** test integrasi
**When** server dibangun dengan konfigurasi produksi
**Then** test memastikan respons login memuat `Set-Cookie` dengan `Secure`, dan bahwa start dengan `COOKIE_SECURE=false` di produksi gagal

**Given** checklist rilis MVP (Story 4.6)
**When** go-live disiapkan
**Then** checklist memuat verifikasi manual dari ponsel di luar jaringan kantor: buka tautan pendaftaran lewat HTTPS, mendaftar, dan memastikan `http://` dialihkan
