---
title: "Review: Kesetiaan PRD Kelasku terhadap Intent"
created: 2026-11-02
reviewed:
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/addendum.md
sources:
  - docs/intent-kelasku.md (dibekukan)
  - AGENTS.md
  - _bmad-output/planning-artifacts/briefs/brief-aisdlc-kelasku-2026-11-02/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-aisdlc-kelasku-2026-11-02/addendum.md
---

# Review kesetiaan PRD terhadap intent

## Verdict

PRD **setia** terhadap intent. Ketujuh aturan R1–R7 dan ketujuh non-goal ada di PRD dengan semantik yang sama. Konvensi `AGENTS.md` juga ikut terbawa: transaksi di lapisan data untuk R1/R2/R4 (NFR-1), "hari ini" di Asia/Jakarta (glosarium, NFR-2, FR-16), rumus bilangan bulat R6 (FR-19), UI berbahasa Indonesia (NFR-5), dan SQLite lokal tanpa cloud (NFR-6). Tidak ada temuan critical atau high. Temuan yang ada berupa penambahan perilaku yang tidak diminta intent, yaitu promosi saat kuota naik dan siklus kelas "Selesai", serta satu metrik keberhasilan yang targetnya diturunkan. Semuanya perlu dikonfirmasi PM sebelum `bmad-create-epics-and-stories`.

## Tabel cakupan

Legenda: **Setia** = semantik sama dengan intent. **Setia+** = setia, ditambah perilaku atau batasan baru yang perlu dikonfirmasi. **Dilemahkan / Diubah / Hilang** = tidak ditemukan untuk aturan; lihat temuan untuk metrik.

### Aturan bisnis

| ID | Intent (ringkas) | FR / NFR di PRD | Status | Catatan |
|---|---|---|---|---|
| R1 | Terdaftar ≤ kuota, termasuk saat bersamaan | FR-8, NFR-1, FR-13 (min(...)), FR-3; addendum §1, §3 | Setia+ | Atomik di lapisan data, ada test 20 paralel → 5. FR-8 menambah syarat "daftar tunggu kosong" (M1, L1). |
| R2 | Satu pendaftaran aktif per email per kelas | FR-9, NFR-1, glosarium "Peserta"; addendum §1 | Setia | Normalisasi trim + huruf kecil, klik ganda menghasilkan satu baris, unique index parsial sebagai jaring pengaman. |
| R3 | Daftar tunggu FIFO menurut waktu daftar | FR-10, FR-8, FR-9 (daftar ulang masuk ke ekor), glosarium "Waktu daftar" | Setia+ | Pemecah seri `id` deterministik. ID R3 dipakai juga untuk promosi saat kuota naik (M1). |
| R4 | Batal oleh Terdaftar → teratas daftar tunggu otomatis Terdaftar | FR-13, FR-11, FR-12, NFR-1; addendum §1–§3 | Setia+ | Satu transaksi, idempoten, aman untuk pembatalan bersamaan. Ditambah: pembatalan oleh admin (L2) dan larangan batal/promosi di kelas Selesai (M2). |
| R5 | Presensi hanya untuk sesi yang tanggalnya sudah tiba | FR-16, FR-15, NFR-2, glosarium "Hari ini"; addendum §1 | Setia | WIB eksplisit, termasuk kasus tepi 23.30 dan 06.00 WIB vs UTC. Ditegakkan di API. |
| R6 | Layak bila hadir ≥ 80% sesi (5→4, 3→3) | FR-19, glosarium "Kelayakan sertifikat", "Total sesi"; addendum §1 | Setia | `hadir × 5 ≥ total sesi × 4`, larangan eksplisit atas 0,8. Contoh 1/3/4/5 sesi benar. Lihat L7 untuk risiko data masukan. |
| R7 | Kuota tidak boleh < jumlah Terdaftar | FR-3, UJ-1; addendum §1 | Setia | Pesan menyebut angka minimum, dicek di transaksi yang sama. Tidak tercantum di NFR-1 (L3). |

### Non-goals

| Non-goal intent | Lokasi di PRD | Status | Catatan |
|---|---|---|---|
| Pembayaran | §6 | Setia | — |
| Login SSO | §6, FR-1 "Di luar cakupan" | Setia | Diperluas menjadi "akun peserta dengan password", sejalan dengan batasan autentikasi intent. |
| Notifikasi email/WhatsApp | §6 (ditambah push dan pemberitahuan promosi), §4.4, FR-13 "Di luar cakupan", addendum §2 | Setia | Mitigasi lewat penanda promosi di layar admin (FR-5), bukan lewat notifikasi. |
| Aplikasi mobile native | §6, NFR-4 (web responsif 360 px) | Setia | — |
| Multi-lembaga (multi-tenant) | §6, §2.2 | Setia | — |
| Penerbitan file sertifikat PDF | §6 ("hanya menentukan siapa yang layak"), FR-22 hanya CSV | Setia | — |
| Penilaian/ujian | §6 | Setia | — |

### Batasan teknologi dan konvensi AGENTS.md

| Butir | Lokasi | Status |
|---|---|---|
| SQLite lokal, tanpa cloud | NFR-6 | Setia |
| UI berbahasa Indonesia, identifier berbahasa Inggris | NFR-5, FR-22 (header CSV) | Setia |
| Admin dengan akun seed; peserta email + nama tanpa password | FR-1, FR-7, glosarium, addendum §4 | Setia |
| R1/R2/R4 dalam satu transaksi di lapisan data | NFR-1, FR-8, FR-13; addendum §1 | Setia |
| "Hari ini" di Asia/Jakarta | glosarium, NFR-2, FR-16, FR-22 | Setia |
| R6 dengan bilangan bulat | FR-19; addendum §1 | Setia |
| Nama test menyebut ID aturan | NFR-9; addendum §3 | Setia |
| `.env` tidak masuk repositori | NFR-8; addendum §4 | Setia |

## Ringkasan per tingkat

| Tingkat | Jumlah |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 3 |
| Low | 7 |

## Temuan

### Medium

**M1 — Promosi saat kuota naik dinaikkan dari COULD menjadi MUST dan dicatat sebagai R3.**
Lokasi: §4.2 FR-3; §11; addendum §1 (baris R7), addendum §3.
Kutipan: "R3: kuota yang dinaikkan langsung mempromosikan min(kuota baru − jumlah Terdaftar, panjang daftar tunggu) pendaftaran teratas daftar tunggu … [ASSUMPTION: mengubah asumsi brief yang menunda promosi saat kuota naik ke COULD.]". Nama test: "`R3: raising quota promotes the head of the waitlist in the same transaction`".
Masalah: R4 di intent hanya menyebut promosi karena pembatalan. Brief sengaja menaruh promosi saat kuota naik di COULD karena "tidak tertulis di intent". PRD menjadikannya MUST dan memberinya label R3. Perilaku ini memang masuk akal, karena tanpanya syarat "daftar tunggu kosong" di FR-8 membuat kursi baru tidak pernah terisi. Namun ini tetap perilaku baru, bukan bunyi R3. Memakai ID aturan yang dibekukan untuk perilaku baru mengaburkan ketertelusuran: test "R3: …" tampak seperti menguji intent padahal menguji keputusan PRD.
Rekomendasi: konfirmasi ke PM/Rina. Beri ID turunan, misalnya "FR-3 (diturunkan dari R1+R3)", atau catat eksplisit di §11 bahwa ini perluasan. Ganti nama test agar tidak mengklaim bunyi R3, misalnya `FR-3/R3-derived: …`.

**M2 — Siklus kelas "Selesai" menambah aturan bisnis baru yang membatasi pendaftaran, pembatalan, dan promosi.**
Lokasi: §3 "Status kelas"; §4.2 paragraf "Siklus kelas" dan [NOTE FOR PM]; FR-2, FR-3, FR-7, FR-10, FR-11; addendum §3 baris terakhir.
Kutipan: "Kelas Selesai menolak pendaftaran baru, pembatalan, dan promosi." dan "[NOTE FOR PM] Keputusan siklus kelas … diambil sebagai opsi paling sederhana, tanpa konfirmasi langsung dari Rina."
Masalah: intent tidak punya konsep status kelas. Aturan ini tidak melanggar R1–R7, karena pembatalan yang ditolak tidak memicu R4. Tetapi aturan ini mempersempit What #2 dan #3 serta menambah kasus status ("Kelas selesai — tidak naik dari daftar tunggu"). PRD berstatus `final` padahal NOTE FOR PM masih terbuka.
Rekomendasi: selesaikan konfirmasi sebelum `bmad-create-epics-and-stories`. Selama belum dikonfirmasi, ubah status PRD atau pindahkan keputusan ini ke §10 Pertanyaan terbuka.

**M3 — Target metrik "daftar sertifikat siap di hari yang sama" diturunkan menjadi ≥ 90%.**
Lokasi: §8 SM-3.
Kutipan: "Target: ≥ 90% kelas pada bulan pertama pemakaian".
Masalah: metrik di intent berbunyi "Daftar peserta yang berhak sertifikat siap **pada hari yang sama** dengan sesi terakhir", tanpa persentase. Brief juga menulis "hari yang sama" tanpa persentase. PRD menambahkan ambang 90% dan membatasinya ke bulan pertama. Ini melemahkan metrik keberhasilan. Selain itu, ukurannya (CSV diekspor pada tanggal sesi terakhir) adalah proksi, bukan bukti bahwa daftar sudah siap.
Rekomendasi: jadikan target 100% kelas, atau tandai 90% sebagai `[ASSUMPTION]` yang perlu persetujuan PM. Bedakan "sistem siap" (FR-19 langsung terhitung setelah presensi disimpan) dari "admin menyerahkan".

### Low

**L1 — FR-8 menambah syarat "daftar tunggu kosong" untuk status Terdaftar.**
Lokasi: §4.3 FR-8. Kutipan: "Terdaftar bila jumlah Terdaftar < kuota dan daftar tunggu kosong".
Syarat ini memperketat R1/R3 dan tidak melanggarnya. Namun ia membuat invarian baru ("daftar tunggu tidak kosong ⇒ kelas penuh") yang hanya terjaga bila M1 (promosi saat kuota naik) dibangun. Bila M1 dipotong, kursi baru akan kosong selamanya. Tuliskan invarian ini secara eksplisit dan kaitkan FR-8 dengan FR-3.

**L2 — Pembatalan oleh admin (FR-12) memperluas What #3.**
Lokasi: §4.4 FR-12. Kutipan: "Admin dapat membatalkan pendaftaran aktif mana pun … [ASSUMPTION: asumsi yang dibawa dari brief.]"
Intent What #3 dan R4 menyebut "pembatalan oleh peserta terdaftar". Perluasan ini sudah ditandai asumsi dan konsisten dengan R4. Cukup dikonfirmasi.

**L3 — NFR-1 tidak mencantumkan R7 dan promosi saat kuota naik.**
Lokasi: §5 NFR-1. Kutipan: "R1, R2, dan R4 ditegakkan di lapisan data dalam satu transaksi … Bukti: test paralel di FR-8, FR-9, FR-13".
FR-3 dan addendum §1 sudah menuntut cek R7 dan promosi dalam transaksi yang sama, tetapi NFR lintas fitur dan bukti test paralelnya tidak menyebut FR-3. Tambahkan R7/FR-3 ke NFR-1, serta test paralel "ubah kuota bersamaan dengan pendaftaran".

**L4 — §6 menambah non-goal yang tidak ada di intent.**
Lokasi: §6. Kutipan: "Katalog kelas publik atau pencarian kelas." dan "Penjadwalan jam sesi, ruangan, atau instruktur."
Tambahan ini tidak bertentangan dengan intent dan justru mempersempit cakupan. Tandai sebagai keputusan PRD, bukan bagian dari daftar intent, agar daftar non-goal yang dibekukan tetap bisa dibedakan.

**L5 — Batasan baru saat mengubah kelas mempersempit What #1.**
Lokasi: §4.2 FR-2, FR-3. Kutipan: "Minimal satu tanggal sesi harus ≥ hari ini (WIB)", "Tanggal sesi yang sudah punya presensi tidak bisa dihapus atau diubah", "Kelas Selesai hanya bisa diubah judulnya", "Kelas tidak bisa dihapus di MVP."
Intent hanya menyebut "membuat dan mengubah kelas: judul, daftar tanggal sesi, kuota". Batasan ini wajar dan sudah ditandai `[ASSUMPTION]`. Cukup dikonfirmasi bersama M2.

**L6 — Daftar status di FR-14 tidak memuat status kelas Selesai dari FR-10.**
Lokasi: §4.5 FR-14 vs §4.3 FR-10. Kutipan FR-14: "status ("Terdaftar", "Terdaftar (naik dari daftar tunggu)", atau "Daftar tunggu #N")". Kutipan FR-10: "Halaman status peserta menampilkan "Kelas selesai — tidak naik dari daftar tunggu"".
Ini inkonsistensi kecil di dalam PRD. Tambahkan status keempat ke FR-14.

**L7 — Bawaan "semua hadir" (FR-18) berisiko membuat R6 bernilai "Layak" palsu.**
Lokasi: §4.6 FR-18. Kutipan: "Formulir presensi yang belum pernah disimpan dibuka dengan semua peserta tercentang hadir".
Rumus R6 tetap benar, tetapi data masukannya bisa salah. Risiko ini sudah diakui lewat SM-C1, dan FR-18 berstatus SHOULD. Pertimbangkan agar FR-18 dipotong lebih dulu bila SM-C1 tidak bisa diukur.

## Hal yang sudah benar dan perlu dipertahankan

- R6 ditulis dengan bilangan bulat dan secara eksplisit melarang 0,8 (FR-19, addendum §1).
- Zona waktu WIB disebut di glosarium, NFR-2, FR-16, dan FR-22, lengkap dengan kasus tepi UTC.
- Konkurensi R1/R2/R4 dinyatakan sebagai konsekuensi yang dapat diuji, bukan hanya sebagai catatan implementasi.
- Semua non-goal intent ada di §6, dan tidak ada FR yang bertentangan dengannya (FR-6 hanya menyalin tautan, bukan mengirim notifikasi; FR-22 berupa CSV, bukan PDF).
