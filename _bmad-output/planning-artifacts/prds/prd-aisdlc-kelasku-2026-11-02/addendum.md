---
title: "Addendum: PRD Kelasku"
created: 2026-11-02
updated: 2026-11-02
---

# Addendum — Detail untuk arsitektur, UX, dan test

Dokumen ini menyimpan detail yang dibutuhkan alur kerja berikutnya tetapi tidak termasuk kebutuhan produk di `prd.md`. Isinya bukan keputusan arsitektur final; `bmad-architecture` boleh memilih cara lain selama perilaku di PRD terpenuhi.

## 1. Catatan penegakan aturan bisnis (masukan untuk arsitektur)

| Aturan | FR | Usulan penegakan |
|---|---|---|
| R1 | FR-8 | Cek kuota dan insert dalam satu transaksi SQLite yang mengambil write lock sejak awal (`BEGIN IMMEDIATE`). Jumlah Terdaftar dihitung dengan `COUNT` di dalam transaksi, bukan dari counter tersimpan. |
| R2 | FR-9 | Email dinormalisasi (trim + huruf kecil) sebelum disimpan. Unique index parsial pada `(class_id, email)` untuk pendaftaran aktif sebagai jaring pengaman; pelanggaran index dipetakan ke respons "sudah terdaftar", bukan error 500. |
| R3 | FR-10 | Urut `created_at`, lalu `id` sebagai pemecah seri. Posisi antrean dihitung saat dibaca, tidak disimpan. |
| R4 | FR-13 | Batal + promosi dalam satu transaksi `BEGIN IMMEDIATE`. Hitung `kursi kosong = kuota − terdaftar` di dalam transaksi, promosikan `min(kursi kosong, panjang antrean)` teratas. Simpan `cancelled_by`, `cancelled_at`, `promoted_at`. |
| R5 | FR-16 | "Hari ini" dihitung di Asia/Jakarta di server; jangan mengandalkan jam browser. Simpan tanggal sesi sebagai tanggal kalender (`YYYY-MM-DD`), bukan timestamp. |
| R6 | FR-19 | `hadir * 5 >= totalSesi * 4` dengan bilangan bulat. Jangan `0.8 * n` (`0.8 * 3` = `2.4000000000000004`). |
| R7 | FR-3 | Cek `kuota baru >= COUNT(Terdaftar)` di dalam transaksi yang sama dengan update, agar pendaftaran yang masuk bersamaan ikut terhitung. |

Satu proses server yang memegang berkas SQLite sudah memadai untuk skala ini (±5 admin, ±400 peserta per bulan).

## 2. Alternatif yang ditolak (dari forge "promosi daftar tunggu otomatis")

- **Konfirmasi admin sebelum promosi.** Bertentangan dengan kata "otomatis" di R4, dan kursi dibiarkan kosong selama Rina sibuk mengajar.
- **Jendela terima/tolak bagi peserta yang naik.** Butuh notifikasi (non-goal) dan penjadwal.
- **Undo pembatalan.** Setelah promosi terjadi, mengembalikan peserta yang batal akan melanggar R1.

## 3. Daftar test aturan bisnis minimum

Nama test menyebut ID aturan (konvensi `AGENTS.md`).

- `R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered`
- `R2: email is normalized before the active-registration check`
- `R2: concurrent duplicate registrations create one row`
- `R3: waitlist is FIFO by registration time, id breaks ties`
- `R4: cancelling a registered participant promotes the head of the waitlist in the same transaction`
- `R4: concurrent cancellations never push registered count above quota`
- `R4: cancelling a waitlisted entry promotes nobody`
- `R5: attendance is accepted for today in Asia/Jakarta and rejected for tomorrow` (termasuk kasus 23.30 WIB dan 06.00 WIB)
- `R6: eligibility thresholds for 1, 3, 4, 5 sessions`
- `R7: lowering quota below registered count is rejected with the minimum in the message`

## 4. Data seed

- Satu akun admin (kredensial dari `.env` lokal, bukan di repositori).
- Kelas penuh tanpa daftar tunggu; kelas penuh dengan 3 peserta di daftar tunggu; kelas dengan sesi yang sudah lewat dan presensi sebagian; kelas dengan sesi hari ini (relatif terhadap tanggal seed dijalankan, WIB).

## 5. Catatan UX

- Tabel kelas admin padat: judul, sesi berikutnya, terisi/kuota, jumlah daftar tunggu. Penanda "Penuh" memakai teks + ikon.
- Halaman pendaftaran memperlakukan kelas penuh sebagai informasi, bukan error: nada netral, jelaskan bahwa peserta akan naik otomatis bila ada yang batal.
- Konfirmasi pembatalan dua langkah menyebut judul kelas dan sifat final tindakan.
- Promosi di halaman kelas admin terlihat sekilas (label "Naik dari daftar tunggu" + waktu) agar Rina bisa mengabari peserta secara manual.

## 6. Keputusan teknis yang ditunda

Package manager, cara akses SQLite, struktur repositori, mekanisme sesi admin, dan pencadangan berkas SQLite diputuskan lewat `bmad-architecture`.
