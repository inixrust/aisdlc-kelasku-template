---
title: "Product Brief: Kelasku"
status: final
created: 2026-11-02
updated: 2026-11-02
sources:
  - docs/intent-kelasku.md
  - _bmad-output/brainstorming/brainstorm-kuota-rekap-kehadiran-2026-11-02/brainstorm-intent.md
  - _bmad-output/forge/auto-promote-waitlist/forged-idea.md
---

# Product Brief: Kelasku

## Ringkasan

Kelasku adalah aplikasi web internal untuk satu lembaga pelatihan. Aplikasi ini mengelola pendaftaran kelas berkuota, daftar tunggu, kehadiran per sesi, dan kelayakan sertifikat. Kelasku menggantikan gabungan spreadsheet, grup WhatsApp, dan Google Form yang sekarang membuat 2–3 kelas per bulan melebihi kuota dan menghabiskan ±1 jam untuk merekap kehadiran satu kelas.

Ada dua gagasan pokok. Pertama, kuota dijaga oleh sistem, bukan oleh ketelitian koordinator: peserta mendaftar sendiri lewat tautan kelas, dan sistem menolak kelebihan kuota meskipun dua orang mendaftar pada saat yang sama. Kedua, rekap muncul sebagai hasil pencatatan presensi, bukan sebagai pekerjaan terpisah: begitu kehadiran sesi disimpan, grid kehadiran, status kelayakan, dan berkas CSV langsung ikut diperbarui.

MVP dibangun oleh tim 3 orang dalam 1 minggu. Data disimpan di berkas SQLite lokal, tanpa layanan cloud.

## Masalah

Rina adalah koordinator pelatihan. Ia mengelola ±20 kelas per bulan, masing-masing 3–5 sesi, dan sering bekerja di laptop di sela jam mengajar. Pendaftaran masuk lewat chat dan formulir, lalu Rina menyalinnya ke spreadsheet dengan tangan. Akibatnya:

- **Kelas melebihi kuota.** Dua atau tiga kali sebulan, pendaftar terakhir sudah dijanjikan kursi sebelum Rina sadar kelasnya penuh. Membatalkan janji itu merepotkan Rina dan merugikan peserta.
- **Rekap memakan waktu.** Menggabungkan absensi dari beberapa sesi menjadi satu rekap per kelas butuh ±1 jam.
- **Daftar sertifikat terlambat.** Peserta yang berhak sertifikat baru diketahui beberapa hari setelah sesi terakhir.
- **Peserta bertanya lewat WhatsApp.** "Saya sudah terdaftar?" dan "Saya nomor berapa di antrean?" dijawab satu per satu.

## Solusi

- **Admin** membuat dan mengubah kelas: judul, daftar tanggal sesi, dan kuota. Kuota tidak bisa diturunkan di bawah jumlah peserta yang sudah terdaftar. Sistem menolaknya dengan pesan yang menyebut angka, misalnya "Kuota minimal 14 (jumlah terdaftar saat ini)".
- **Peserta** mendaftar dengan nama dan email lewat tautan kelas yang bisa dibagikan. Halaman ini nyaman dipakai di ponsel. Hasilnya langsung jelas: "Terdaftar" atau "Daftar tunggu #N". Kelas yang penuh bukan kondisi error.
- **Daftar tunggu** berjalan sendiri. Antrean diurutkan menurut waktu mendaftar. Bila peserta terdaftar membatalkan, peserta teratas antrean otomatis naik tanpa campur tangan admin.
- **Presensi** dicatat per sesi dalam satu formulir untuk semua peserta. Formulir hanya bisa diisi untuk sesi yang tanggalnya sudah tiba.
- **Kelayakan sertifikat** (hadir ≥ 80% sesi) tampil per peserta, dan rekap satu kelas bisa diekspor ke CSV.

Antarmuka admin dibuat bersih dan padat informasi seperti panel admin, dioptimalkan untuk laptop. Halaman peserta responsif untuk ponsel dan laptop. Semua teks antarmuka berbahasa Indonesia dan memenuhi WCAG 2.1 AA.

## Mengapa pendekatan ini

Pembanding utama Kelasku adalah cara kerja sekarang (spreadsheet + WhatsApp + Google Form), bukan produk komersial. Google Form tidak memahami kuota per kelas, daftar tunggu FIFO, atau kehadiran per sesi. Spreadsheet bergantung pada ketelitian manusia saat menyalin data. Kelasku tidak menawarkan keunggulan teknologi. Nilainya ada pada kecocokan dengan alur kerja satu lembaga, bahasa Indonesia, data yang tetap di server sendiri, dan cakupan yang cukup kecil untuk diselesaikan dalam seminggu.

**Belum terjawab:** apakah alat gratis yang bisa di-host sendiri (misalnya pretix atau Moodle dengan plugin Attendance) sudah memenuhi kebutuhan ini. Prompt riset kompetitif untuk menjawabnya sudah disiapkan, tetapi belum dijalankan. Lihat Pertanyaan terbuka.

## Pengguna

- **Koordinator/admin pelatihan** (±5 orang, persona Rina). Bekerja di laptop dengan waktu yang terbatas. Mereka butuh daftar kelas yang bisa dipahami sekilas (terisi/kuota, jumlah daftar tunggu, sesi berikutnya), layar presensi yang selesai dengan satu kali simpan, dan rekap yang siap tanpa perlu disusun.
- **Peserta pelatihan** (±400 per bulan). Membuka Kelasku dari ponsel atau laptop. Mereka butuh cara mendaftar yang cepat tanpa membuat akun, serta status yang jelas: terdaftar, posisi antrean, jumlah kehadiran, dan kelayakan sertifikat.

## Kriteria keberhasilan

| Metrik | Sekarang | Target MVP |
|---|---|---|
| Kelas yang melebihi kuota | 2–3 per bulan | **0**, termasuk saat pendaftaran terjadi bersamaan |
| Waktu rekap kehadiran satu kelas | ±1 jam | **< 5 menit** |
| Daftar peserta layak sertifikat siap | beberapa hari setelah sesi terakhir | **hari yang sama** dengan sesi terakhir |

Bukti teknis yang diharapkan:

- Test otomatis yang menembakkan ±20 pendaftaran paralel ke kelas berkuota 5 tidak pernah menghasilkan lebih dari 5 peserta terdaftar.
- Setiap aturan bisnis R1–R7 punya test yang menyebut ID aturannya.

## Cakupan MVP

**Epik 1 — Kelas & Pendaftaran Berkuota (R1–R3, R7):** membuat dan mengubah kelas, menolak penurunan kuota di bawah jumlah terdaftar, pendaftaran mandiri lewat tautan, kuota yang ditegakkan di lapisan data, satu pendaftaran aktif per email per kelas, daftar tunggu FIFO, tabel kelas admin, dan halaman kelas admin yang menampilkan peserta terdaftar dan antrean.

**Epik berikutnya (tetap wajib di MVP):**

- Pembatalan dan promosi daftar tunggu otomatis (R4).
- Presensi per sesi (R5).
- Status kelayakan sertifikat (R6).
- Ekspor CSV satu kelas.

**Di luar cakupan:** pembayaran, login SSO, notifikasi email/WhatsApp, aplikasi mobile native, multi-lembaga (multi-tenant), berkas sertifikat PDF, dan penilaian/ujian. Autentikasi sengaja dibuat sederhana: admin masuk dengan akun seed, peserta cukup memasukkan email dan nama.

Rincian prioritas SHOULD/COULD dan catatan teknis untuk PRD dan arsitektur ada di `addendum.md`.

## Asumsi

- [ASSUMPTION] Admin boleh membatalkan pendaftaran atas nama peserta. Promosi daftar tunggu berjalan sama seperti saat peserta membatalkan sendiri.
- [ASSUMPTION] Kuota yang dinaikkan **tidak** otomatis menaikkan peserta dari daftar tunggu di MVP. Fitur ini dimasukkan ke prioritas COULD karena tidak tertulis di intent.
- [ASSUMPTION] Tanggal sesi yang sudah punya catatan kehadiran tidak bisa diubah atau dihapus.
- [ASSUMPTION] Halaman status peserta dicari berdasarkan email, tanpa password. Tidak ada batas waktu untuk membatalkan.
- [ASSUMPTION] Kelasku berjalan di laptop lokal atau satu server kecil milik lembaga.

## Risiko dan pertanyaan terbuka

- **Bangun atau pakai alat yang sudah ada?** Riset kompetitif belum dijalankan. Bila alat self-hosted gratis ternyata sudah memenuhi R1–R7 dan berbahasa Indonesia, keputusan membangun perlu ditinjau ulang. Konteks studi kasus ini mengarah ke membangun.
- **Peserta yang naik dari daftar tunggu tidak diberi tahu**, karena notifikasi termasuk non-goal. Mereka baru tahu saat membuka halaman status, jadi kursi bisa terbuang.
- **Siapa pun yang tahu email seorang peserta bisa membatalkan pendaftarannya**, dan promosi yang terpicu tidak bisa dibalik. Risiko ini diterima karena keamanan penuh adalah non-goal MVP.
- **Peserta yang naik di tengah kelas bisa mustahil layak sertifikat.** Status "Tidak mungkin layak" diusulkan sebagai SHOULD.
- **Target satu minggu ketat** untuk empat area (pendaftaran, pembatalan, presensi, rekap). Prioritas SHOULD/COULD adalah yang pertama dipotong bila waktu tidak cukup.

## Arah ke depan

Bila MVP berhasil, Kelasku menjadi tempat utama untuk seluruh siklus kelas di lembaga ini: dari tautan pendaftaran sampai daftar sertifikat. Perluasan yang wajar meliputi riwayat perubahan status untuk menyelesaikan sengketa, beranda "Sesi hari ini", dan halaman status peserta yang lebih lengkap. Fitur yang sekarang ditetapkan sebagai non-goal (notifikasi, sertifikat PDF) baru dipertimbangkan setelah MVP terbukti dipakai.
