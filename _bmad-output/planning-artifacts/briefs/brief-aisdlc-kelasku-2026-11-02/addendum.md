---
title: "Addendum: Product Brief Kelasku"
created: 2026-11-02
updated: 2026-11-02
---

# Addendum — Detail untuk PRD dan Arsitektur

Dokumen ini menyimpan detail yang perlu dibawa ke PRD dan arsitektur, tetapi terlalu rinci untuk brief.

## Aturan bisnis (acuan: `docs/intent-kelasku.md`)

| ID | Aturan | Catatan penegakan |
|---|---|---|
| R1 | Jumlah terdaftar ≤ kuota, termasuk saat ada pendaftaran bersamaan | Cek kuota dan insert berjalan dalam satu transaksi SQLite (`BEGIN IMMEDIATE`). Jumlah terisi dihitung dengan `COUNT` di dalam transaksi, bukan dari counter tersimpan. |
| R2 | Satu pendaftaran aktif per email per kelas | Email dinormalisasi (trim + huruf kecil). Unique index parsial pada pendaftaran aktif menjadi jaring pengaman. Klik ganda tidak boleh membuat baris ganda. |
| R3 | Daftar tunggu FIFO | Urut menurut `created_at`, dengan `id` sebagai pemecah seri. |
| R4 | Pembatalan oleh peserta terdaftar menaikkan antrean teratas | Pembatalan dan promosi berjalan dalam satu transaksi. Jumlah yang dinaikkan adalah `min(kuota − terdaftar, panjang antrean)`. Pembatalan oleh peserta di daftar tunggu tidak memicu promosi. Kolom `cancelled_by` dan `cancelled_at` dicatat. |
| R5 | Kehadiran hanya untuk sesi yang tanggalnya sudah tiba | "Hari ini" dihitung di zona Asia/Jakarta. |
| R6 | Layak sertifikat bila hadir ≥ 80% | Pakai bilangan bulat `hadir * 5 >= totalSesi * 4`, bukan `0.8 * n`. |
| R7 | Kuota tidak boleh di bawah jumlah terdaftar | Ditolak dengan pesan yang menyebut angka minimum. |

## Keputusan dari forge "promosi daftar tunggu otomatis"

- Pembatalan bersifat final. Tidak ada undo dan tidak ada konfirmasi dari admin maupun peserta sebelum promosi.
- Peserta yang batal lalu ingin kembali harus mendaftar ulang dan masuk ke ekor antrean.
- Peserta yang naik melihat status "Terdaftar (naik dari daftar tunggu)". Halaman kelas admin menandai siapa yang dipromosikan beserta waktunya.
- Pembatalan dikonfirmasi dalam dua langkah di UI.
- **Ditolak:** konfirmasi admin sebelum promosi (bertentangan dengan kata "otomatis" di R4); jendela terima/tolak bagi peserta yang naik (butuh notifikasi dan penjadwal); undo pembatalan (melanggar R1 setelah promosi).

## Prioritas di luar MUST

**SHOULD**
- Beranda admin "Sesi hari ini" yang membuka presensi dengan satu klik.
- Presensi dengan default "semua hadir", lalu admin menghapus centang peserta yang absen.
- Halaman status peserta via email: posisi antrean, hadir x dari y, dan status kelayakan.
- Status "Tidak mungkin layak" bila sisa sesi tidak lagi cukup untuk mencapai 80%.
- CSV ramah Excel: UTF-8 BOM dan header berbahasa Indonesia.

**COULD**
- Riwayat perubahan status pendaftaran.
- Pintasan keyboard di layar presensi.
- Filter peserta.
- Ringkasan dashboard.
- Indikator "Sisa N kursi" di halaman pendaftaran.
- Promosi otomatis saat kuota dinaikkan (asumsi A1).

## Catatan UI

- Daftar kelas admin berupa tabel padat dengan kolom judul, sesi berikutnya, terisi/kuota, dan jumlah daftar tunggu.
- Penanda kelas penuh memakai teks dan ikon, bukan warna saja (WCAG 2.1 AA).
- Halaman kelas admin menampilkan peserta terdaftar dan daftar tunggu berurutan, lengkap dengan waktu daftar.

## Test dan data seed

- `R1: ...` — ±20 pendaftaran paralel ke kelas berkuota 5.
- `R4: cancelling a registered participant promotes the head of the waitlist in the same transaction`
- `R4: concurrent cancellations never push registered count above quota`
- `R4: cancelling a waitlisted entry promotes nobody`
- Seed berisi contoh kelas penuh, kelas dengan daftar tunggu, dan sesi yang sudah lewat, untuk demo dan Playwright.

## Keputusan teknis yang ditunda

Package manager, cara akses SQLite, dan struktur repositori belum dipilih. Ketiganya diputuskan lewat `bmad-architecture`.

## Riset kompetitif

Prompt riset sudah disiapkan di `_bmad-output/planning-artifacts/research/competitive-aplikasi-pendaftaran-dan-kehadiran-kelas-2026-11-02/brief.md` dengan status *brief-drafted*. Kandidat yang akan diteliti: Google Forms + Sheets, Loket, Goers, Eventbrite, pretix, Indico, Moodle Attendance, dan SaaS/HRIS lokal. Hasil riset ini dibutuhkan untuk menjawab pertanyaan bangun-atau-pakai.
