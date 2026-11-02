# Forged idea: promosi daftar tunggu otomatis (R4)

Hasil: **BERTAHAN (hardened)**. Ide ini sama dengan R4 di `docs/intent-kelasku.md`. Tempatnya di epik Pembatalan, bukan Epik 1.

## Dikunci
- Promosi berjalan di lapisan data, dalam transaksi yang sama dengan pembatalan (`BEGIN IMMEDIATE`). Sistem menghitung `kursi kosong = kuota − terdaftar`, lalu menaikkan `min(kursi kosong, panjang antrean)` peserta teratas secara FIFO (`created_at`, lalu `id`). Dengan cara ini dua pembatalan bersamaan tetap aman dan jumlah terdaftar tidak pernah melebihi kuota (R1).
- Tidak ada konfirmasi dari admin maupun peserta. Pembatalan bersifat final.
- Bila admin membatalkan atas nama peserta, promosinya sama.
- Bila peserta di daftar tunggu membatalkan, ia hanya keluar dari antrean. Tidak ada promosi.
- Peserta yang batal lalu ingin kembali harus mendaftar ulang dan masuk ke ekor antrean (R2, R3).
- Hasil promosi hanya tampil di layar, tanpa notifikasi. Status peserta: "Terdaftar (naik dari daftar tunggu)". Halaman kelas admin menandai siapa yang dipromosikan beserta waktunya.
- Setiap pembatalan mencatat `cancelled_by` (peserta/admin) dan `cancelled_at`.

## Ditolak
- Konfirmasi admin sebelum promosi. Ini melanggar kata "otomatis" di R4, dan kursi dibiarkan kosong selama Rina sibuk mengajar.
- Jendela terima/tolak bagi peserta yang dipromosikan. Fitur ini butuh notifikasi (non-goal) dan penjadwal.
- Undo pembatalan. Setelah promosi terjadi, mengembalikan peserta yang batal akan melanggar R1.

## Asumsi (belum dikonfirmasi PM)
- Tidak ada batas waktu untuk pembatalan/promosi, karena intent tidak menyebutnya.
- Pembatalan cukup dengan email, tanpa autentikasi tambahan. Keamanan penuh adalah non-goal.

## Titik lemah yang masih ada
- Peserta yang naik baru tahu statusnya bila membuka halaman status. Akibatnya kursi bisa terbuang.
- Siapa pun yang tahu email seorang peserta bisa membatalkan pendaftarannya, dan promosi yang terpicu tidak bisa dibalik.
- Peserta yang naik di tengah kelas bisa mustahil layak sertifikat. Contoh: kelas 5 sesi, ia sudah absen 2, jadi paling banyak hadir 3 dari minimal 4.

## Test yang harus ada
- `R4: cancelling a registered participant promotes the head of the waitlist in the same transaction`
- `R4: concurrent cancellations never push registered count above quota`
- `R4: cancelling a waitlisted entry promotes nobody`
