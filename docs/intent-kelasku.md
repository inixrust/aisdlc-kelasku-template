# Intent Studi Kasus — Kelasku

Aplikasi web pendaftaran dan kehadiran kelas pelatihan.
Ditulis oleh tim produk sebagai masukan untuk perencanaan.

## Who — untuk siapa

- **Rina, koordinator pelatihan** di sebuah lembaga training. Mengelola ±20 kelas per bulan,
  masing-masing 3–5 sesi. Saat ini memakai spreadsheet dan grup WhatsApp. Bekerja di laptop,
  sering di sela mengajar; butuh layar yang ringkas dan cepat dibaca.
- **Peserta pelatihan** (pengguna sekunder): mendaftar ke kelas dan melihat status pendaftaran
  serta kelayakan sertifikatnya. Mengakses dari ponsel maupun laptop.

## Why — mengapa dibangun (metrik keberhasilan)

- Rekap kehadiran satu kelas selesai **< 5 menit** (saat ini ±1 jam merekap dari spreadsheet).
- **Nol kelas melebihi kuota** (saat ini 2–3 kasus per bulan karena pendaftaran lewat chat).
- Daftar peserta yang berhak sertifikat siap **pada hari yang sama** dengan sesi terakhir.

## What — yang dibangun (MVP)

1. Admin membuat dan mengubah kelas: judul, daftar tanggal sesi, kuota.
2. Peserta mendaftar ke kelas; bila kuota penuh, masuk **daftar tunggu**.
3. Pembatalan oleh peserta terdaftar otomatis menaikkan antrean teratas daftar tunggu.
4. Admin mencatat kehadiran per sesi.
5. Sistem menampilkan status kelayakan sertifikat per peserta.
6. Admin mengekspor rekap kehadiran satu kelas ke CSV.

## Aturan bisnis

| ID | Aturan |
|---|---|
| R1 | Jumlah peserta terdaftar tidak pernah melebihi kuota, termasuk saat dua pendaftaran terjadi bersamaan. |
| R2 | Satu peserta (diidentifikasi email) hanya boleh memiliki satu pendaftaran aktif per kelas. |
| R3 | Daftar tunggu berurutan FIFO berdasarkan waktu mendaftar. |
| R4 | Bila peserta terdaftar membatalkan, peserta teratas daftar tunggu otomatis menjadi terdaftar. |
| R5 | Kehadiran hanya dapat dicatat untuk sesi yang tanggalnya sudah tiba. |
| R6 | Layak sertifikat bila hadir ≥ 80% sesi kelas (contoh: 5 sesi → minimal 4 hadir; 3 sesi → 3 hadir). |
| R7 | Kuota tidak boleh diturunkan di bawah jumlah peserta terdaftar saat ini. |

## Non-goals (di luar cakupan MVP)

Pembayaran; login SSO; notifikasi email/WhatsApp; aplikasi mobile native; multi-lembaga
(multi-tenant); penerbitan file sertifikat PDF; penilaian/ujian.

## Batasan teknologi (standar kelas — WAJIB)

- TypeScript di seluruh kode; Node.js 22 atau lebih baru.
- Frontend React + Vite; backend HTTP API Node.js; satu repositori.
- Basis data SQLite (berkas lokal) — tanpa layanan cloud.
- Test: Vitest untuk unit/integrasi, Playwright untuk end-to-end.
- Teks antarmuka berbahasa Indonesia; identifier kode berbahasa Inggris.
- Autentikasi MVP sederhana: admin login dengan akun seed; peserta cukup email + nama
  (tanpa password) — keamanan penuh adalah non-goal MVP.
