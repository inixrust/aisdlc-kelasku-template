---
title: "Review adversarial: PRD Kelasku"
created: 2026-11-02
reviewed:
  - prd.md
  - addendum.md
reference: docs/intent-kelasku.md
---

# Review adversarial: PRD Kelasku

## Verdict

PRD ini rapi dan jauh di atas rata-rata, tetapi **belum siap diteruskan ke `bmad-create-epics-and-stories`**. Ada dua lubang yang langsung merusak janji inti produk: formulir presensi tidak bisa membedakan "tidak hadir" dari "belum dicatat", dan daftar sertifikat masih bisa berubah pada hari sesi terakhir, setelah CSV diserahkan. Selain itu, satu contoh test R5 mustahil secara faktual, AC test konkurensi bisa lulus tanpa membuktikan apa pun, cara otorisasi pembatalan publik tidak ditentukan, dan cakupannya tidak muat dalam satu minggu untuk tim berisi 3 orang. Status `final` di frontmatter tidak jujur selama `[NOTE FOR PM]` di §4.2 belum dijawab.

| Tingkat | Jumlah |
|---|---|
| Critical | 2 |
| High | 5 |
| Medium | 15 |
| Low | 9 |

---

## Critical

### C1. Formulir presensi biner tidak bisa menyatakan "belum dicatat", sehingga hasil R6/FR-20 bergantung pada tafsiran engineer

- **Lokasi:** §4.6 FR-15, FR-18; §4.7 FR-20; §4.8 FR-21
- **Kutipan:** FR-15: "pilihan hadir/tidak hadir; satu tombol "Simpan" menyimpan semuanya" dan "tampil di formulir sesi itu dengan status "belum dicatat", tanpa centang bawaan. Catatan presensinya baru dibuat saat admin menyimpan pilihan untuknya." FR-18: "semua peserta tercentang hadir; admin menghapus centang".
- **Masalah:** Kata "centang" menyiratkan checkbox, padahal checkbox hanya punya dua keadaan. Bila admin menekan "Simpan" dan peserta hasil promosi tidak ia sentuh, ada dua implementasi yang sama-sama sah menurut teks: (a) checkbox kosong disimpan sebagai "Tidak hadir", atau (b) tidak ada catatan yang dibuat. Hasil FR-20 berbeda di antara keduanya: (a) bisa langsung memicu "Tidak mungkin layak", sedangkan (b) tetap "Belum layak". Kasus yang sama muncul bila FR-18 (SHOULD) dipotong: pada formulir baru, semua checkbox kosong lalu disimpan, sehingga entah semua peserta tercatat "Tidak hadir" atau tidak ada catatan sama sekali. Grid FR-21 membedakan "Tidak hadir" dari "—", tetapi formulir tidak punya cara untuk menghasilkan keduanya dengan pasti.
- **Perbaikan:** Tetapkan kontrol tiga keadaan per peserta (Hadir / Tidak hadir / Belum dicatat), misalnya radio group. Tulis aturannya: "Simpan hanya membuat atau mengubah catatan untuk peserta yang bernilai Hadir atau Tidak hadir; Belum dicatat tidak membuat catatan." Tentukan juga apakah admin boleh mengembalikan catatan menjadi "Belum dicatat" (lihat M6). Tambahkan AC: "Menyimpan formulir tanpa menyentuh peserta X tidak membuat catatan untuk X."

### C2. Kelas masih Dibuka pada hari sesi terakhir, jadi daftar sertifikat yang sudah diekspor bisa berubah pada hari itu juga

- **Lokasi:** §3 Status kelas; §4.2 Siklus kelas; UJ-4; §8 SM-3; §1 Visi
- **Kutipan:** "**Dibuka**: tanggal sesi terakhir ≥ hari ini." / "Setelah Selesai, daftar Terdaftar dibekukan" / UJ-4: "di akhir sesi ke-4 (sesi terakhir) ... menekan "Ekspor CSV" dan mengirim berkasnya ke bagian sertifikat."
- **Masalah:** Kelas baru menjadi Selesai pada pukul 00.00 WIB keesokan harinya. Sepanjang hari sesi terakhir, setelah Rina mengekspor CSV, peserta masih bisa membatalkan, promosi masih bisa terjadi, dan pendaftar baru masih bisa masuk. CSV yang sudah diserahkan ke bagian sertifikat jadi basi tanpa ada yang tahu. Peserta yang naik pada hari terakhir otomatis "Belum layak" padahal ia baru saja "Terdaftar". Ini bertabrakan langsung dengan klaim Visi ("daftar ... siap pada hari sesi terakhir") dan dengan SM-3.
- **Perbaikan:** Pilih salah satu dan tulis secara eksplisit: (a) pendaftaran, pembatalan, dan promosi ditutup sejak hari sesi terakhir (`tanggal sesi terakhir ≤ hari ini` → Selesai untuk pendaftaran), sementara presensi hari itu tetap bisa diisi; atau (b) pendaftaran ditutup saat sesi pertama dimulai (lihat M10). Tambahkan AC: "Pada tanggal sesi terakhir (WIB), pendaftaran baru dan pembatalan ditolak." Kalau opsi ini butuh konfirmasi Rina, masukkan ke `[NOTE FOR PM]`.

---

## High

### H1. Contoh test R5 "23.30 WIB saat UTC sudah hari berikutnya" mustahil secara faktual

- **Lokasi:** §4.6 FR-16; addendum §3 (test R5)
- **Kutipan:** "termasuk pukul 23.30 WIB saat jam server UTC sudah menunjukkan hari berikutnya, dan pukul 06.00 WIB saat UTC masih hari sebelumnya."
- **Masalah:** WIB adalah UTC+7, jadi UTC selalu tertinggal dari WIB. Pukul 23.30 WIB sama dengan 16.30 UTC **pada hari yang sama**. UTC tidak pernah "sudah hari berikutnya" dibanding WIB. Test yang ditulis persis dari AC ini tidak bisa dibuat, atau dibuat tetapi tidak menguji apa pun. Jendela yang benar-benar berbahaya untuk server UTC adalah 00.00–06.59 WIB, ketika UTC masih menunjukkan hari sebelumnya, sehingga sesi hari ini ditolak secara keliru. Kasus "zona server di depan WIB" hanya terjadi bila server atau browser memakai zona seperti WITA/WIT (Asia/Makassar, Asia/Jayapura), yang realistis di Indonesia.
- **Perbaikan:** Ganti kasusnya menjadi: (1) 00.30 WIB tanggal D, server UTC (UTC = D−1 17.30): sesi tanggal D **diterima**; (2) 23.30 WIB tanggal D, zona proses Asia/Jayapura (sudah D+1 00.30 WIT): sesi tanggal D+1 **ditolak**; (3) 06.59 WIB sebagai batas atas jendela. Wajibkan test menjalankan proses dengan `TZ` yang berbeda-beda.

### H2. AC konkurensi (FR-8, FR-9, FR-13, NFR-1) bisa lulus tanpa membuktikan apa pun, atau gagal dengan cara yang tidak didefinisikan

- **Lokasi:** §4.3 FR-8, FR-9; §4.4 FR-13; §5 NFR-1; addendum §1, §3
- **Kutipan:** "20 pendaftaran dengan email berbeda yang dikirim paralel ... menghasilkan tepat 5 Terdaftar dan 15 Daftar tunggu." / "lulus berulang kali tanpa flake."
- **Masalah:** (1) Tidak disebut di level mana paralelismenya terjadi. Dengan driver SQLite sinkron di satu proses Node, 20 panggilan fungsi "paralel" selalu berjalan serial, sehingga test lulus walaupun tanpa transaksi sama sekali. AC seperti ini tidak membedakan implementasi yang benar dari yang salah. (2) Sebaliknya, dengan driver async dan satu koneksi bersama, dua `BEGIN IMMEDIATE` yang saling tumpang-tindih menghasilkan error "cannot start a transaction within a transaction" atau `SQLITE_BUSY`. AC tidak menyebut bahwa ke-20 permintaan harus **berhasil**, bukan sebagian 500 atau 409. (3) "Berulang kali tanpa flake" tidak bisa diuji karena jumlah ulangannya tidak disebut.
- **Perbaikan:** Tulis AC: "20 request HTTP serentak ke API yang sedang berjalan: semuanya mendapat respons sukses (bukan 5xx), tepat 5 Terdaftar, 15 Daftar tunggu dengan posisi 1–15 tanpa celah atau duplikat." Tambahkan test negatif (mutation check): versi tanpa transaksi harus **gagal** di test ini. Tetapkan angka, misalnya "lulus 50 kali berturut-turut di CI". Tambahkan perilaku `SQLITE_BUSY` (retry atau busy_timeout) sebagai kebutuhan, dengan detailnya diputuskan oleh arsitektur.

### H3. Otorisasi pembatalan publik tidak didefinisikan, sehingga endpoint pembatalan bisa dipanggil hanya dengan ID

- **Lokasi:** §4.4 FR-11; §4.5 FR-14 Catatan; §9
- **Kutipan:** "siapa pun yang tahu email seorang peserta bisa melihat dan membatalkan pendaftarannya. Risiko ini diterima"
- **Masalah:** Risiko yang diterima adalah "harus tahu email". Namun PRD tidak menyatakan bahwa API pembatalan **mewajibkan** email yang cocok. Engineer yang wajar bisa membuat `POST /registrations/:id/cancel` tanpa parameter lain. Bila ID berurutan, siapa pun bisa membatalkan seluruh peserta lembaga dengan satu loop, dan promosi yang terpicu tidak bisa dibalik. Ini jauh lebih besar daripada risiko yang diterima di §9.
- **Perbaikan:** Tambahkan AC di FR-11: "API pembatalan peserta menerima ID pendaftaran **dan** email; ditolak bila email ternormalisasi tidak cocok dengan pendaftaran itu. ID pendaftaran dan kelas di URL publik tidak berurutan (tidak bisa ditebak)." Pertimbangkan pembatasan laju sederhana pada endpoint status dan pembatalan.

### H4. Cakupan tidak muat dalam 1 minggu untuk 3 orang

- **Lokasi:** §7.1; §5 NFR-3, NFR-7, NFR-9; §9 "Target satu minggu ketat"
- **Kutipan:** "Epik berikutnya (tetap wajib di MVP)" dan NFR-3 "Semua halaman memenuhi WCAG 2.1 AA"
- **Masalah:** Ada 19 FR MUST dan 9 NFR, termasuk WCAG 2.1 AA di **semua** halaman, benchmark p95 dengan seed satu tahun pada satu inti CPU, test konkurensi yang benar (H2), test zona waktu multi-TZ (H1), CSV yang aman untuk Excel, autentikasi, seed, dan e2e Playwright. Repo masih kosong, dan package manager, akses SQLite, serta struktur repo belum diputuskan. Satu-satunya katup pengaman adalah tiga FR SHOULD yang kecil. Itu tidak cukup. Satu minggu kerja untuk 3 orang sekitar 15 hari-orang, dikurangi setup, arsitektur, dan review PR.
- **Perbaikan:** Buat daftar potong kedua yang eksplisit: bagian Dibatalkan di FR-5, dialog peringatan FR-3 (ganti dengan teks statis), NFR-7 (turunkan menjadi smoke test), dan NFR-3 (batasi ke alur peserta + presensi dengan cek otomatis axe). Pertimbangkan juga mengganti ubah tanggal sesi pada FR-3 dengan "hapus + tambah" saja. Tetapkan kriteria keputusan potong pada hari ke-3.

### H5. Tabel kelas dibatasi 50 baris tanpa paginasi, padahal kelas tidak bisa dihapus dan volumenya 240 per tahun

- **Lokasi:** §4.2 FR-4; FR-3 "Kelas tidak bisa dihapus"; §5 NFR-7
- **Kutipan:** "Tabel memuat 50 kelas tanpa paginasi." / NFR-7: "±240 kelas"
- **Masalah:** Dengan ±20 kelas per bulan, batas 50 terlampaui pada bulan ketiga. PRD tidak menyebut apa yang terjadi pada kelas ke-51: dipotong, digulir, atau dipaginasi. Tidak ada arsip, filter (COULD), atau penghapusan. Engineer A akan menampilkan semua baris, engineer B akan memotong di 50, dan kelas Selesai terlama hilang dari UI.
- **Perbaikan:** Tetapkan perilakunya: "Bawaan: tampilkan kelas Dibuka + kelas Selesai 30 hari terakhir; tautan 'Tampilkan semua kelas Selesai'." Atau "tampilkan semua, tetap tanpa paginasi, ≤ 300 baris". Sesuaikan AC kinerja dengan pilihan itu.

---

## Medium

### M1. Jumlah promosi FR-13 tidak menyebut apakah dihitung sebelum atau sesudah pembatalan

- **Lokasi:** §4.4 FR-13; addendum §1 R4
- **Kutipan:** "jumlah yang dipromosikan adalah min(kuota − jumlah Terdaftar, panjang daftar tunggu)"
- **Masalah:** Bila jumlah Terdaftar dihitung sebelum status diubah menjadi Dibatalkan, hasilnya 0 dan tidak ada yang naik. Bullet pertama FR-13 ("posisi antrean 1") dan rumus ini juga tampak mengatakan dua hal berbeda.
- **Perbaikan:** "dihitung setelah status pendaftaran yang batal menjadi Dibatalkan, di dalam transaksi yang sama." Tambahkan AC: "kuota 5, Terdaftar 5, antrean 3; satu batal → Terdaftar 5, antrean 2."

### M2. Invarian "kursi kosong ⇒ daftar tunggu kosong" tersirat, tidak dinyatakan, dan tidak diuji

- **Lokasi:** §4.3 FR-8
- **Kutipan:** "Terdaftar bila jumlah Terdaftar < kuota dan daftar tunggu kosong, selain itu Daftar tunggu."
- **Masalah:** Bila keadaan "Terdaftar < kuota dan antrean tidak kosong" pernah terjadi (bug, perbaikan data manual, atau jalur yang terlewat seperti hapus tanggal), FR-8 membuat kursi itu kosong selamanya: pendaftar baru masuk antrean dan tidak ada pemicu promosi.
- **Perbaikan:** Nyatakan invarian I1: "Setiap saat, bila Terdaftar < kuota maka daftar tunggu kosong (kecuali kelas Selesai)." Tambahkan test properti setelah setiap operasi tulis. Sebagai alternatif, ubah FR-8 menjadi "pendaftaran baru selalu masuk ekor, lalu jalankan promosi".

### M3. Kelas Selesai "hanya bisa diubah judulnya" bertabrakan dengan "semua validasi FR-2 berlaku"

- **Lokasi:** §4.2 FR-3 vs FR-2
- **Kutipan:** "Semua validasi FR-2 berlaku saat mengubah kelas." / FR-2: "Minimal satu tanggal sesi harus ≥ hari ini"
- **Masalah:** Kelas Selesai sudah pasti tidak punya tanggal ≥ hari ini, jadi menyimpan perubahan judul gagal validasi bila FR-2 diterapkan utuh. Hasilnya dua implementasi: judul kelas Selesai bisa diubah, atau tidak bisa.
- **Perbaikan:** "Validasi tanggal FR-2 hanya berlaku bila daftar tanggal berubah. Pada kelas Selesai, hanya validasi judul yang berlaku."

### M4. Admin tidak bisa menutup atau menyembunyikan kelas yang salah dibuat atau batal diselenggarakan

- **Lokasi:** §4.2 FR-3 "Kelas tidak bisa dihapus di MVP"
- **Masalah:** Kelas yang dibuat ganda, berisi typo tanggal, atau dibatalkan lembaga tetap Dibuka dan tautannya tetap menerima pendaftaran sampai tanggal terakhir lewat. Satu-satunya cara "menutup" kelas adalah memajukan tanggal, dan itu diblokir oleh FR-2. Rina tidak punya jalan keluar.
- **Perbaikan:** Tambahkan aksi "Tutup pendaftaran" (status Ditutup, ditolak seperti Selesai), atau izinkan penghapusan kelas yang belum punya pendaftaran sama sekali. Ini murah dan menutup kasus yang paling sering.

### M5. Tanggal sesi terkunci oleh presensi yang tidak terlihat milik pendaftaran yang dibatalkan

- **Lokasi:** §3 Presensi; §4.2 FR-3; §4.6 FR-15
- **Kutipan:** "Bila pendaftaran dibatalkan, presensinya tetap tersimpan tetapi tidak ditampilkan." / "Tanggal sesi yang sudah punya presensi tidak bisa dihapus atau diubah"
- **Masalah:** Sesi yang presensinya hanya milik peserta yang kemudian batal tampak kosong di grid, tetapi tanggalnya tidak bisa diubah, dan UI "menjelaskan alasannya" dengan merujuk data yang tidak bisa dilihat admin. Pertanyaan "presensi" mana yang dihitung juga ambigu: semua catatan, hanya yang hadir, atau hanya milik pendaftaran aktif.
- **Perbaikan:** "Tanggal dikunci bila ada catatan presensi milik pendaftaran yang **saat ini Terdaftar**." Atau tampilkan jumlah catatan tersembunyi di pesan penolakan.

### M6. Tanggal sesi yang salah tetapi sudah berisi presensi tidak bisa diperbaiki selamanya

- **Lokasi:** §4.2 FR-3; §4.6 FR-15
- **Masalah:** Tidak ada aksi untuk menghapus catatan presensi atau mengembalikannya ke "belum dicatat". Bila Rina mengisi presensi pada tanggal yang keliru (misalnya 9 Nov yang seharusnya 10 Nov), tanggal itu terkunci permanen dan total sesi R6 salah untuk semua peserta.
- **Perbaikan:** Izinkan "Kosongkan presensi sesi ini" (dengan konfirmasi dua langkah), sehingga tanggalnya terbuka lagi. Atau izinkan memindahkan tanggal beserta presensinya, selama tanggal tujuan ≤ hari ini (R5).

### M7. Simpan presensi yang bersamaan dengan pembatalan atau penyimpanan admin lain tidak didefinisikan

- **Lokasi:** §4.6 FR-15; §5 NFR-1
- **Masalah:** Ada tiga kasus. (1) Admin membuka formulir, peserta X batal, lalu admin menyimpan: apakah catatan untuk X ditolak, diabaikan diam-diam, atau disimpan untuk pendaftaran Dibatalkan? (2) Dua admin menyimpan sesi yang sama: last-write-wins per peserta atau per formulir? (3) Tanggal sesi dihapus saat formulirnya sedang terbuka.
- **Perbaikan:** "Simpan presensi hanya menulis untuk pendaftaran yang Terdaftar saat disimpan; entri lain diabaikan dan disebut di pesan hasil. Penyimpanan bersamaan: last-write-wins per peserta. Simpan ke sesi yang sudah dihapus ditolak dengan pesan."

### M8. Halaman status menyembunyikan pendaftaran Dibatalkan, padahal pembatalan oleh orang lain adalah risiko yang diakui

- **Lokasi:** §4.5 FR-14; §9 "Pembatalan oleh orang lain"
- **Kutipan:** "Email yang tidak punya pendaftaran aktif menampilkan "Tidak ada pendaftaran aktif untuk email ini""
- **Masalah:** Peserta yang dibatalkan admin atau orang iseng hanya melihat "tidak ada pendaftaran", tanpa jejak. Akibatnya ia kembali bertanya lewat WhatsApp, dan itu melawan SM-4.
- **Perbaikan:** Tampilkan juga pendaftaran Dibatalkan dalam 30 hari terakhir, dengan waktu batal dan pembatal (peserta/admin).

### M9. Pernyataan "5 admin" bertabrakan dengan seed yang hanya berisi satu akun admin dan tidak adanya UI untuk membuat akun

- **Lokasi:** §2.1 "±5 orang"; §4.1 FR-1 Di luar cakupan; addendum §4 "Satu akun admin"
- **Masalah:** Kelima admin akan berbagi satu kredensial, dan "pembatal = admin" tidak menyebut admin yang mana. PRD tidak menyebut apakah akun berbagi memang disengaja.
- **Perbaikan:** Nyatakan salah satu: "akun bersama satu untuk semua admin (diterima)" atau "seed membaca daftar N admin dari `.env`/berkas lokal". Bila akun per orang, catat ID admin pada pembatalan.

### M10. Pendaftaran tetap terbuka setelah sesi berjalan, sehingga pendaftar terlambat dijamin tidak layak

- **Lokasi:** §4.2 Siklus kelas; §4.3 FR-7; [NOTE FOR PM]
- **Kutipan:** "Selama Dibuka, peserta bisa mendaftar dan membatalkan kapan saja, termasuk setelah sesi pertama."
- **Masalah:** Di kelas 4 sesi, siapa pun yang Terdaftar setelah sesi 1 tidak mungkin layak. Sistem menerima pendaftaran yang pasti berujung "Belum layak" tanpa memberi tahu pendaftar. NOTE FOR PM hanya menanyakan batas waktu **pembatalan**, bukan batas waktu **pendaftaran**.
- **Perbaikan:** Tambahkan pertanyaan ini ke NOTE FOR PM. Minimal, tampilkan peringatan di halaman pendaftaran bila sudah ada sesi yang lewat, misalnya "Sesi yang sudah lewat tetap dihitung untuk sertifikat".

### M11. Excel dengan locale Indonesia memakai `;` sebagai pemisah, sehingga AC "terbuka benar di Excel" tidak bisa diuji dan kemungkinan gagal

- **Lokasi:** §4.8 FR-22
- **Kutipan:** "Encoding UTF-8 dengan BOM agar berkas terbuka benar di Excel."
- **Masalah:** Excel Windows dengan regional setting id-ID (desimal koma) membaca CSV berpemisah koma sebagai satu kolom. Versi Excel dan locale tidak disebut, jadi AC ini tidak bisa diverifikasi. Format tanggal NFR-5 ("Senin, 9 Nov 2026") juga mengandung koma bila dipakai sebagai header.
- **Perbaikan:** Tentukan Excel dan locale target. Pilih pemisah (`;` untuk id-ID, atau baris `sep=,` dengan konsekuensi BOM-nya diuji), lalu tetapkan format header tanggal di CSV (ISO `YYYY-MM-DD` lebih aman). Tambahkan uji manual dengan satu berkas contoh di laptop Rina.

### M12. Test R5 dan seed bergantung pada tanggal nyata tanpa kebutuhan jam yang bisa disuntik

- **Lokasi:** §5 NFR-9; addendum §4 "relatif terhadap tanggal seed dijalankan"
- **Masalah:** Seed yang dibuat kemarin membuat test e2e "sesi hari ini" gagal hari ini. Kasus 00.30/23.30 WIB juga tidak bisa diuji tanpa mengendalikan jam.
- **Perbaikan:** Tambahkan NFR: "Waktu sekarang berasal dari satu sumber yang bisa diganti di test (jam palsu); e2e menjalankan seed ulang dengan tanggal relatif sebelum setiap run."

### M13. NFR-3 (WCAG 2.1 AA) dan NFR-1 ("tanpa flake") tidak punya metode verifikasi

- **Lokasi:** §5 NFR-1, NFR-3
- **Masalah:** "Memenuhi WCAG 2.1 AA" untuk semua halaman butuh audit manual yang tidak dianggarkan. Tidak disebut kapan NFR ini dianggap lulus.
- **Perbaikan:** "Lulus bila axe-core (via Playwright) melaporkan 0 pelanggaran serious/critical di halaman X, Y, Z, ditambah satu pemeriksaan keyboard manual pada alur daftar, batal, dan presensi."

### M14. SM-1 "pernah punya Terdaftar > kuota" tidak bisa diukur dengan query bulanan atas keadaan saat ini

- **Lokasi:** §8 SM-1; §7.3 (riwayat status = COULD)
- **Masalah:** Kelebihan kuota yang sementara (misalnya akibat bug, lalu satu orang batal) tidak terlihat pada query keadaan akhir, dan tanpa riwayat kata "pernah" tidak terukur.
- **Perbaikan:** Ganti dengan "jumlah kelas dengan Terdaftar > kuota saat query dijalankan", atau tambahkan constraint/trigger yang membuat kelebihan kuota mustahil secara fisik, lalu ukur jumlah penolakannya.

### M15. Grid rekap tanpa gulir horizontal (NFR-4) tidak dibatasi jumlah sesinya

- **Lokasi:** §5 NFR-4; §4.8 FR-21; FR-2 (tidak ada batas jumlah tanggal)
- **Kutipan:** "setiap tabel utama tampil tanpa gulir horizontal"
- **Masalah:** Nama, email, N kolom tanggal, x/y, dan kelayakan pada lebar 1366 px hanya muat untuk sedikit sesi. FR-2 tidak membatasi jumlah tanggal. Tidak jelas pula apakah grid rekap termasuk "tabel utama".
- **Perbaikan:** Batasi jumlah sesi per kelas (misalnya 1–10) di FR-2, atau nyatakan bahwa grid rekap boleh bergulir horizontal dengan kolom nama tetap terlihat.

---

## Low

### L1. Frontmatter `status: final` bertentangan dengan NOTE FOR PM yang belum dijawab
- **Lokasi:** frontmatter; §4.2 [NOTE FOR PM]; §10
- **Perbaikan:** Ubah ke `status: draft-for-confirmation` sampai keputusan siklus kelas dikonfirmasi Rina.

### L2. Zona tampilan timestamp tidak ditetapkan
- **Lokasi:** §5 NFR-2 (hanya "hari ini" dan tanggal sesi); FR-5 (waktu daftar, batal, promosi)
- **Perbaikan:** "Semua waktu ditampilkan dalam WIB dengan format Indonesia; disimpan dalam UTC/ISO."

### L3. Email sama dengan nama berbeda tidak ditentukan perilakunya
- **Lokasi:** §4.3 FR-9; §4.5 FR-14
- **Masalah:** Bila pendaftaran ulang memakai nama lain, apakah nama diperbarui atau diabaikan? Typo pada email tidak bisa dikoreksi tanpa batal-daftar ulang, yang membuat peserta kehilangan kursi.
- **Perbaikan:** "Nama pada pendaftaran yang sudah aktif tidak diubah." Pertimbangkan koreksi nama/email oleh admin sebagai COULD.

### L4. "Belum layak" pada kelas Selesai menyesatkan bagian sertifikat
- **Lokasi:** §4.7 FR-19; §4.8 FR-22
- **Perbaikan:** Pada kelas Selesai, tampilkan "Tidak layak", karena statusnya sudah final.

### L5. Mitigasi formula injection CSV tidak lengkap dan efek sampingnya tidak disebut
- **Lokasi:** §4.8 FR-22
- **Masalah:** Awalan tab (`\t`) dan CR (`\r`) tidak tercakup. Tanda `'` tampil literal di sel saat CSV dibuka, sehingga nama seperti "-Andi" berubah. Email tidak bisa diawali `=` setelah validasi, tetapi nama bisa.
- **Perbaikan:** Tambahkan `\t` dan `\r` ke daftar, lalu nyatakan bahwa `'` yang tampil adalah perilaku yang diterima.

### L6. Batas nilai tidak ditetapkan
- **Lokasi:** FR-2, FR-7
- **Masalah:** Kuota maksimum, rentang tahun tanggal sesi, apakah nama di-trim, dan definisi "berformat email" tidak disebut.
- **Perbaikan:** Tetapkan kuota 1–1000, tanggal dalam ±1 tahun dari hari ini, nama di-trim seperti judul, dan satu aturan format email.

### L7. Implementasi bocor ke PRD, bertentangan dengan janji §0
- **Lokasi:** §0 "Detail teknis ... ada di addendum.md, bukan di sini"; FR-1 "HTTP 401"; FR-8 "lapisan data"; NFR-1 "satu transaksi"
- **Masalah:** Bagian yang diwajibkan `AGENTS.md` bisa diterima. HTTP 401 dan "1-based" tidak relevan bagi pembaca produk.
- **Perbaikan:** Pindahkan hal itu ke addendum, atau ubah kalimat §0 menjadi "sebagian besar detail teknis".

### L8. Teks FR-14 dan FR-10 untuk antrean di kelas Selesai tidak sinkron
- **Lokasi:** §4.5 FR-14 (daftar status) vs §4.3 FR-10 ("Kelas selesai — tidak naik dari daftar tunggu")
- **Perbaikan:** Tambahkan status keempat ini ke daftar di FR-14.

### L9. Promosi saat kuota naik dilabeli R3, padahal ini perluasan R4 dan mengubah brief
- **Lokasi:** §4.2 FR-3; addendum §3 "R3: raising quota promotes..."
- **Masalah:** Pelabelan ini membingungkan traceability. Perilakunya benar, tetapi tidak berasal dari R3 yang dibekukan.
- **Perbaikan:** Label "R3/R1 (turunan)". Pastikan perubahan dari brief tercatat sebagai keputusan, bukan hanya `[ASSUMPTION]`.

---

## Rekomendasi urutan perbaikan

1. C1, C2: putuskan model presensi tiga keadaan dan titik beku kelas. Keduanya mengubah model data.
2. H1, H2, H3: koreksi AC test R5, AC konkurensi, dan otorisasi pembatalan sebelum `bmad-architecture`.
3. H4, H5, M4: putuskan daftar potong kedua dan perilaku daftar kelas jangka panjang.
4. Sisanya bisa diselesaikan bersama penulisan story.
