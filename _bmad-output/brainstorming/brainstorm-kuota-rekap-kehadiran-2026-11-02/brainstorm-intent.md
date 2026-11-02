# Brainstorm Intent — Kelasku: kuota tepat & rekap kehadiran dalam menit

Sumber: `.memlog.md` (sesi 2026-11-02, mode Creative Partner, berjalan non-interaktif). Acuan aturan: `docs/intent-kelasku.md` (R1–R7).

## Masalah & target

Rina (koordinator, ±20 kelas/bulan, 3–5 sesi per kelas) kini memakai spreadsheet + WhatsApp + Google Form. Akibatnya 2–3 kelas lewat kuota per bulan dan rekap kehadiran memakan ±1 jam per kelas.

Target:
- Nol kelas melebihi kuota.
- Rekap satu kelas < 5 menit.
- Daftar layak sertifikat siap pada hari sesi terakhir.

## Wawasan kunci

1. **Kuota ditegakkan di lapisan data, UI hanya menampilkannya.** Cek kuota dan insert berjalan dalam satu transaksi SQLite. Hitungan terisi diambil dari `COUNT` di dalam transaksi, bukan dari counter yang bisa melenceng.
2. **Rekap adalah efek samping presensi, bukan pekerjaan terpisah.** Presensi massal per sesi langsung memperbarui grid peserta × sesi, status kelayakan, dan CSV.
3. **Pendaftaran mandiri lewat tautan kelas menghapus sumber utama salah kuota**, yaitu menyalin pendaftar dari chat secara manual. Status peserta yang jelas menggantikan pertanyaan lewat WhatsApp.

## Epik 1 — Kelas & Pendaftaran Berkuota (MUST)

| Kemampuan | Aturan |
|---|---|
| Admin membuat dan mengubah kelas (judul, daftar tanggal sesi, kuota) | — |
| Penurunan kuota di bawah jumlah terdaftar ditolak dengan pesan berangka ("Kuota minimal 14 (jumlah terdaftar saat ini)") | R7 |
| Peserta mendaftar dengan nama + email lewat tautan kelas yang bisa dibagikan, tampil nyaman di ponsel | — |
| Cek kuota + insert dalam satu transaksi (`BEGIN IMMEDIATE`). Bila penuh, peserta masuk daftar tunggu | R1 |
| Satu pendaftaran aktif per email per kelas. Email dinormalisasi (trim + huruf kecil), dengan unique index parsial sebagai jaring pengaman. Klik ganda tidak membuat baris ganda | R2 |
| Daftar tunggu FIFO menurut `created_at`, dengan `id` sebagai pemecah seri | R3 |
| Hasil pendaftaran menampilkan status yang jelas: "Terdaftar" atau "Daftar tunggu #N". Kelas penuh bukan error 500 | R1, R3 |
| Daftar kelas admin berupa tabel padat: judul, sesi berikutnya, terisi/kuota, jumlah daftar tunggu. Penanda penuh memakai teks + ikon, bukan warna saja | — |
| Halaman kelas admin menampilkan peserta terdaftar dan daftar tunggu berurutan beserta waktu daftar | R3 |

Bukti test: test Vitest menembak ±20 pendaftaran paralel ke kelas berkuota 5 (`R1: ...`). Seed berisi contoh kelas penuh, kelas dengan daftar tunggu, dan sesi yang sudah lewat, untuk demo dan Playwright.

## Epik berikutnya (MUST MVP)

- Pembatalan oleh peserta atau admin, sekaligus promosi antrean teratas, dalam satu transaksi. Pembatalan dikonfirmasi dua langkah. (R4)
- Layar presensi per sesi: semua peserta dalam satu formulir, satu kali simpan. Sesi yang belum tiba dinonaktifkan, dengan "hari ini" dihitung di zona Asia/Jakarta. (R5)
- Status kelayakan dihitung dengan bilangan bulat `hadir * 5 >= totalSesi * 4`. (R6)
- Ekspor CSV satu kelas: kolom per sesi + kolom Layak.

## SHOULD

- Beranda admin "Sesi hari ini" yang satu klik membuka presensi.
- Presensi default "semua hadir", lalu admin menghapus centang yang absen.
- Halaman status peserta via email: posisi antrean, hadir x dari y, status kelayakan.
- Status "Tidak mungkin layak" ketika sisa sesi tak lagi cukup untuk mencapai 80%.
- CSV ramah Excel: UTF-8 BOM, header berbahasa Indonesia.

## COULD

Riwayat perubahan status pendaftaran untuk menjawab sengketa. Pintasan keyboard di layar presensi. Filter peserta. Ringkasan dashboard. Indikator "Sisa N kursi" di halaman daftar.

## WON'T (MVP)

Notifikasi WA/email (peserta melihat promosi di halaman statusnya). Pembayaran. SSO. Multi-lembaga. Sertifikat PDF. Ujian.

## Asumsi & pertanyaan terbuka (perlu konfirmasi PM)

- **A1** Saat kuota dinaikkan, antrean teratas dipromosikan otomatis sebanyak kursi baru. Ini turunan semangat R4 dan tidak tertulis di intent. Opsi paling sederhana: masuk COULD dulu.
- **A2** Admin boleh membatalkan atas nama peserta, dengan promosi yang sama seperti R4.
- **A3** Menghapus atau mengubah tanggal sesi yang sudah punya catatan kehadiran ditolak.
- **A4** Peserta diidentifikasi dengan email + nama tanpa password, sesuai intent. Halaman status cukup mencari berdasarkan email, karena keamanan penuh adalah non-goal.

## Konteks pembatas

Alat internal satu lembaga: ±5 admin, ±400 peserta per bulan, tim 3 orang, MVP 1 minggu. Admin memakai laptop, peserta memakai ponsel dan laptop (responsif). UI padat ala panel admin, memenuhi WCAG 2.1 AA, berbahasa Indonesia. SQLite lokal tanpa cloud.
