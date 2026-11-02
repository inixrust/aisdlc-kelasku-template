---
title: "PRD: Kelasku"
status: final
created: 2026-11-02
updated: 2026-11-03
sources:
  - docs/intent-kelasku.md
  - _bmad-output/planning-artifacts/briefs/brief-aisdlc-kelasku-2026-11-02/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-aisdlc-kelasku-2026-11-02/addendum.md
  - _bmad-output/planning-artifacts/research/competitive-aplikasi-pendaftaran-dan-kehadiran-kelas-2026-11-02/brief.md (prompt saja, belum ada hasil)
---

# PRD: Kelasku

## 0. Tujuan dokumen

PRD ini ditujukan bagi tim pengembang Kelasku (3 orang) dan bagi alur kerja berikutnya: `bmad-ux`, `bmad-architecture`, dan `bmad-create-epics-and-stories`. Dokumen ini menurunkan kebutuhan dari `docs/intent-kelasku.md` (sumber aturan R1–R7 yang dibekukan) dan dari product brief beserta addendumnya. Istilah domain didefinisikan sekali di §3 Glosarium dan dipakai persis sama di seluruh dokumen. Fitur dikelompokkan di §4, dengan FR bernomor global (FR-1 sampai FR-22) yang tidak berubah walaupun fitur disusun ulang. Setiap FR yang menegakkan aturan bisnis menyebut ID aturannya. Asumsi ditandai `[ASSUMPTION]` di tempatnya dan dikumpulkan di §11. Detail teknis (cara transaksi, indeks, rencana test) ada di `addendum.md`, bukan di sini.

## 1. Visi

Kelasku adalah aplikasi web internal untuk satu lembaga pelatihan. Kelasku mengelola kelas berkuota, pendaftaran mandiri peserta, daftar tunggu, kehadiran per sesi, dan kelayakan sertifikat. Kelasku menggantikan gabungan spreadsheet, grup WhatsApp, dan Google Form.

Produk ini bertumpu pada dua gagasan. **Kuota dijaga sistem, bukan ketelitian koordinator.** Peserta mendaftar sendiri lewat tautan kelas, dan sistem tidak pernah menerima peserta melebihi kuota, termasuk saat dua orang mendaftar pada detik yang sama. Bila ada yang batal, peserta teratas daftar tunggu naik tanpa campur tangan admin. **Rekap adalah hasil sampingan presensi, bukan pekerjaan terpisah.** Begitu kehadiran satu sesi disimpan, grid rekap, status kelayakan sertifikat, dan berkas CSV langsung mencerminkannya.

Hasilnya: tidak ada lagi kelas yang melebihi kuota, rekap satu kelas selesai dalam hitungan menit, dan daftar peserta yang layak sertifikat siap pada hari sesi terakhir.

## 2. Pengguna

### 2.1 Jobs To Be Done

**Admin (koordinator pelatihan, ±5 orang; persona Rina).** Rina mengelola ±20 kelas per bulan, masing-masing 3–5 sesi, dan bekerja di laptop di sela jam mengajar.

- Membuka satu kelas untuk pendaftaran dan yakin kuotanya tidak akan terlampaui tanpa harus ia awasi.
- Melihat dalam sekilas kelas mana yang penuh, berapa yang antre, dan kapan sesi berikutnya.
- Mencatat kehadiran satu sesi dengan satu kali simpan.
- Menyerahkan daftar peserta yang layak sertifikat pada hari sesi terakhir, tanpa menyusun rekap dengan tangan.
- Berhenti menjawab pertanyaan "saya sudah terdaftar?" lewat WhatsApp satu per satu.

**Peserta pelatihan (±400 per bulan).** Membuka Kelasku dari ponsel atau laptop.

- Mendaftar ke kelas dalam satu menit tanpa membuat akun.
- Mengetahui dengan pasti statusnya: terdaftar, atau nomor berapa di daftar tunggu.
- Membatalkan pendaftaran sendiri bila berhalangan.
- Melihat jumlah kehadirannya dan apakah ia layak sertifikat.

### 2.2 Bukan pengguna (MVP)

- Instruktur atau pengajar sebagai peran tersendiri. Bila instruktur mencatat presensi, ia memakai akun admin.
- Lembaga lain. Kelasku melayani satu lembaga saja (multi-tenant adalah non-goal).
- Publik umum yang mencari katalog kelas. Kelasku tidak punya halaman katalog; peserta datang lewat tautan kelas yang dibagikan admin.

### 2.3 Perjalanan pengguna utama

- **UJ-1. Rina membuka kelas baru dan membagikan tautannya.**
  Rina, di laptop kantor setelah mengajar, sudah masuk sebagai admin. Ia membuat kelas "Excel untuk Laporan Keuangan" dengan 4 tanggal sesi dan kuota 20, lalu menyalin tautan pendaftaran kelas ke grup WhatsApp alumni. Di tabel kelas, baris kelas baru tampil dengan "0/20" dan tanggal sesi berikutnya. **Kasus tepi:** seminggu kemudian Rina mencoba menurunkan kuota ke 12 padahal sudah 14 terdaftar; sistem menolak dengan pesan "Kuota minimal 14 (jumlah terdaftar saat ini)".

- **UJ-2. Dimas mendaftar dari ponsel saat kelas hampir penuh.**
  Dimas, staf keuangan, menerima tautan di WhatsApp dan membukanya di ponsel. Ia mengisi nama dan email lalu menekan "Daftar". Kursi terakhir baru saja diambil orang lain, jadi layar menampilkan "Daftar tunggu #2" dengan penjelasan bahwa ia akan naik otomatis bila ada yang batal. Ini bukan pesan error. **Kasus tepi:** Dimas menekan "Daftar" dua kali karena sinyal lambat; ia tetap hanya punya satu pendaftaran dan melihat status yang sama.

- **UJ-3. Sari membatalkan, dan antrean naik sendiri.**
  Sari, peserta terdaftar, mendapat tugas luar kota. Ia membuka halaman status peserta, memasukkan emailnya, menekan "Batalkan pendaftaran", lalu mengonfirmasi di langkah kedua. Saat Dimas membuka halaman statusnya sore itu, statusnya sudah "Terdaftar (naik dari daftar tunggu)". Di halaman kelas admin, Rina melihat Dimas bertanda promosi beserta waktunya.

- **UJ-4. Rina mencatat presensi sesi dan menyerahkan daftar sertifikat pada hari yang sama.**
  Rina, di akhir sesi ke-4 (sesi terakhir), membuka halaman kelas, memilih sesi hari ini, menandai setiap peserta "Hadir" atau "Tidak hadir", dan menekan "Simpan". Grid rekap langsung menunjukkan setiap peserta dengan "hadir 4 dari 4" atau "hadir 3 dari 4" beserta status "Layak" atau "Belum layak". Ia menekan "Ekspor CSV" dan mengirim berkasnya ke bagian sertifikat. Karena kelas sudah Selesai sejak pagi itu, tidak ada lagi pendaftaran, pembatalan, atau promosi yang bisa mengubah daftar peserta di berkas tersebut; yang masih bisa berubah hanya koreksi presensi oleh Rina sendiri. **Kasus tepi:** sesi minggu depan tampil di daftar sesi, tetapi formulir presensinya tidak bisa diisi sebelum tanggalnya tiba (R5).

## 3. Glosarium

- **Admin** — Pengguna internal lembaga yang masuk dengan akun seed. Membuat dan mengubah kelas, mencatat presensi, membatalkan pendaftaran atas nama peserta, dan mengekspor rekap.
- **Peserta** — Orang yang mendaftar ke kelas. Diidentifikasi oleh email yang dinormalisasi (spasi di awal/akhir dibuang, huruf kecil). Tidak punya akun atau password.
- **Kelas** — Satu program pelatihan dengan judul, satu atau lebih sesi, dan kuota. Satu kelas punya banyak pendaftaran.
- **Sesi** — Satu pertemuan kelas pada satu tanggal kalender (tanpa jam). Tanggal sesi unik dalam satu kelas. Kata "sesi" di dokumen ini selalu berarti pertemuan kelas; status masuk admin disebut **sesi masuk**.
- **Sesi masuk** — Keadaan admin sudah masuk (login) dan belum keluar.
- **Kuota** — Bilangan bulat ≥ 1: jumlah maksimum pendaftaran berstatus Terdaftar di satu kelas.
- **Status kelas** — Dihitung dari tanggal sesi dan hari ini (WIB), tidak disimpan:
  - **Dibuka**: tanggal sesi terakhir > hari ini.
  - **Penuh**: Dibuka dan jumlah Terdaftar = kuota.
  - **Selesai**: tanggal sesi terakhir ≤ hari ini, termasuk sepanjang hari sesi terakhir itu sendiri. Kelas Selesai menolak pendaftaran baru, pembatalan, dan promosi, sehingga daftar Terdaftar sudah beku pada hari sesi terakhir. Presensi tetap bisa dicatat dan dikoreksi.
- **Total sesi** — Jumlah semua tanggal sesi kelas, termasuk sesi yang belum tiba.
- **Pendaftaran** — Hubungan satu peserta dengan satu kelas, dengan satu status dan waktu daftar. Satu peserta bisa punya beberapa pendaftaran di kelas yang sama sepanjang waktu, tetapi paling banyak satu yang aktif (R2).
- **Status pendaftaran** — Salah satu dari: **Terdaftar**, **Daftar tunggu**, **Dibatalkan**. Terdaftar dan Daftar tunggu disebut **aktif**.
- **Waktu daftar** — Saat pendaftaran dibuat oleh sistem. Menentukan urutan daftar tunggu (R3).
- **Daftar tunggu** — Urutan pendaftaran berstatus Daftar tunggu di satu kelas, FIFO menurut waktu daftar. **Posisi antrean** adalah nomor urut 1-based dalam daftar ini, dihitung ulang setiap kali ditampilkan.
- **Promosi** — Perubahan otomatis status pendaftaran dari Daftar tunggu menjadi Terdaftar ketika kursi terbuka, baik karena pembatalan (R4) maupun karena kuota dinaikkan (FR-3). Pendaftaran yang dipromosikan menyimpan waktu promosi.
- **Pembatalan** — Perubahan status pendaftaran aktif menjadi Dibatalkan, oleh peserta sendiri atau oleh admin. Final; tidak bisa dibatalkan ulang (undo).
- **Tautan pendaftaran** — URL publik per kelas yang membuka halaman pendaftaran kelas itu.
- **Halaman status peserta** — Halaman publik tempat peserta memasukkan email untuk melihat semua pendaftaran aktifnya, kehadiran, dan kelayakan sertifikat, serta untuk membatalkan.
- **Presensi** — Catatan bernilai **Hadir** atau **Tidak hadir** untuk satu pendaftaran Terdaftar pada satu sesi. Pendaftaran yang belum punya catatan untuk sebuah sesi berada dalam keadaan **Belum dicatat** (ditampilkan "—" di grid rekap dan CSV). Belum dicatat bukan Tidak hadir: keadaan ini tidak menyimpan apa pun. Presensi melekat pada pendaftaran, bukan pada email. Bila pendaftaran dibatalkan, presensinya tetap tersimpan tetapi tidak ditampilkan. Pendaftaran baru dengan email yang sama tidak mewarisi presensi lama.
- **Hari ini** — Tanggal kalender saat ini di zona waktu Asia/Jakarta (WIB). Dipakai untuk R5 dan untuk menentukan sesi berikutnya.
- **Kelayakan sertifikat** — Status per pendaftaran Terdaftar: **Layak** bila `hadir × 5 ≥ total sesi × 4` (R6), selain itu **Belum layak**. *Hadir* adalah jumlah sesi dengan presensi hadir.
- **Grid rekap** — Tabel satu kelas: baris per peserta Terdaftar, kolom per sesi, ditambah jumlah hadir dan kelayakan sertifikat.
- **Rekap CSV** — Berkas CSV hasil ekspor grid rekap satu kelas.

## 4. Fitur

Prioritas: **MUST** kecuali ditandai **SHOULD**. FR SHOULD adalah yang pertama dipotong bila waktu tidak cukup.

### 4.1 Akses admin

**Deskripsi:** Admin masuk dengan akun yang dibuat lewat seed. Semua halaman admin dan aksi admin di API memerlukan sesi masuk yang valid. Halaman pendaftaran dan halaman status peserta bersifat publik. Keamanan penuh adalah non-goal MVP.

#### FR-1: Masuk dan keluar sebagai admin

Admin dapat masuk dengan email dan password akun seed, lalu keluar.

**Konsekuensi (dapat diuji):**
- Kredensial salah menampilkan "Email atau password salah" tanpa menyebut bagian mana yang salah.
- Membuka halaman admin tanpa sesi masuk mengalihkan ke halaman masuk; memanggil aksi admin di API tanpa sesi masuk ditolak (HTTP 401).
- Setelah keluar, halaman admin tidak bisa dibuka lagi tanpa masuk ulang.

**Di luar cakupan:** pendaftaran akun admin lewat UI, lupa password, SSO, peran admin bertingkat.

### 4.2 Pengelolaan kelas (R7)

**Deskripsi:** Admin membuat kelas dengan judul, daftar tanggal sesi, dan kuota, lalu mengubahnya bila perlu. Kuota tidak bisa diturunkan di bawah jumlah pendaftaran Terdaftar saat itu. Tabel kelas memberi gambaran sekilas; halaman kelas admin menampilkan siapa yang Terdaftar dan siapa yang antre. Realizes UJ-1.

**Siklus kelas.** Kelas berstatus Dibuka sejak dibuat sampai sehari sebelum tanggal sesi terakhirnya. Mulai pukul 00.00 WIB pada tanggal sesi terakhir, kelas berstatus Selesai (lihat Status kelas di §3). Selama Dibuka, peserta bisa mendaftar dan membatalkan kapan saja, termasuk setelah sesi pertama. Setelah Selesai, daftar Terdaftar dibekukan: tidak ada pendaftaran, pembatalan, atau promosi baru. Dengan begitu rekap CSV yang diekspor pada hari sesi terakhir (UJ-4, SM-3) sudah final; yang masih bisa mengubahnya hanya koreksi presensi oleh admin. Presensi sesi terakhir tetap bisa dicatat pada hari itu (R5). Tanggal sesi yang dipakai untuk menghitung R6 hanya bisa berubah selama belum ada presensi di tanggal itu.

> [NOTE FOR PM] Keputusan siklus kelas di paragraf ini dan di FR-2, FR-3, FR-7, FR-11, dan FR-15 diambil sebagai opsi paling sederhana, tanpa konfirmasi langsung dari Rina. Konfirmasikan sebelum `bmad-create-epics-and-stories`. Yang paling mungkin ditanyakan Rina: (1) apakah pembatalan perlu batas waktu, misalnya setelah sesi pertama; (2) apakah penutupan pendaftaran dan pembatalan sejak pukul 00.00 WIB pada hari sesi terakhir dapat diterima, termasuk akibatnya bahwa kelas satu sesi tidak bisa menerima pendaftaran pada hari sesinya.

#### FR-2: Membuat kelas

Admin dapat membuat kelas dengan judul, satu atau lebih tanggal sesi, dan kuota.

**Konsekuensi:**
- Judul wajib, 1–120 karakter setelah spasi di awal/akhir dibuang.
- Minimal satu tanggal sesi; tanggal ganda dalam satu kelas ditolak dengan pesan yang menyebut tanggalnya.
- Kuota wajib berupa bilangan bulat ≥ 1; nilai lain ditolak dengan pesan validasi di dekat kolomnya.
- Minimal satu tanggal sesi harus setelah hari ini (WIB), karena kelas yang tanggal sesi terakhirnya hari ini atau lebih awal lahir dalam status Selesai dan tidak bisa menerima pendaftaran. Tanggal lain boleh hari ini atau di masa lalu. [ASSUMPTION: admin bisa memasukkan kelas yang sudah berjalan, lalu mencatat presensi susulan.]
- Setelah tersimpan, kelas muncul di tabel kelas dan punya tautan pendaftaran (FR-6).

#### FR-3: Mengubah kelas dan menjaga batas kuota (R7)

Admin dapat mengubah judul, menambah atau menghapus tanggal sesi, dan mengubah kuota.

**Konsekuensi:**
- R7: kuota baru yang lebih kecil dari jumlah pendaftaran Terdaftar saat itu ditolak dengan pesan "Kuota minimal N (jumlah terdaftar saat ini)", dengan N adalah angka sebenarnya. Pengecekan ini juga berlaku bila pendaftaran baru masuk di antara saat admin membuka formulir dan saat menyimpan.
- Semua validasi FR-2 berlaku saat mengubah kelas. Menghapus satu-satunya tanggal sesi ditolak, begitu pula mengubah tanggal sehingga ada tanggal ganda.
- R3: kuota yang dinaikkan langsung mempromosikan min(kuota baru − jumlah Terdaftar, panjang daftar tunggu) pendaftaran teratas daftar tunggu, dalam operasi atomik yang sama dengan perubahan kuota. Tanpa ini, kursi baru akan diambil pendaftar yang datang belakangan, mendahului antrean. [ASSUMPTION: mengubah asumsi brief yang menunda promosi saat kuota naik ke COULD.]
- Tanggal sesi yang sudah punya presensi tidak bisa dihapus atau diubah; UI menjelaskan alasannya. [ASSUMPTION]
- Bila presensi sudah ada di kelas itu, menambah atau menghapus tanggal sesi menampilkan peringatan bahwa total sesi dan kelayakan sertifikat semua peserta ikut berubah. Admin harus mengonfirmasi peringatan itu sebelum perubahan disimpan.
- Kelas Selesai hanya bisa diubah judulnya; tanggal sesi dan kuota terkunci. [ASSUMPTION]
- Kelas tidak bisa dihapus di MVP. [ASSUMPTION]

#### FR-4: Tabel kelas admin

Admin dapat melihat semua kelas dalam satu tabel padat.

**Konsekuensi:**
- Kolom: judul, sesi berikutnya (tanggal sesi terdekat ≥ hari ini; untuk kelas Selesai, termasuk pada hari sesi terakhir, tampil "Selesai"), terisi/kuota (mis. "18/20"), dan jumlah daftar tunggu.
- Kelas Penuh ditandai dengan teks "Penuh" dan ikon, tidak dengan warna saja.
- Urutan bawaan: kelas dengan sesi berikutnya paling dekat di atas; kelas Selesai di bawah, yang paling baru selesai lebih dulu.
- Tampilan bawaan memuat semua kelas Dibuka ditambah kelas Selesai yang tanggal sesi terakhirnya dalam 30 hari terakhir. Tautan "Tampilkan semua kelas Selesai" memuat seluruh kelas di tabel yang sama. Tidak ada paginasi di kedua tampilan, dan tidak ada kelas yang hilang dari UI. [ASSUMPTION]
- Kedua tampilan memenuhi NFR-7 pada data satu tahun (±240 kelas). Di layar 1366×768, keempat kolom terlihat tanpa gulir horizontal.

#### FR-5: Halaman kelas admin

Admin dapat membuka satu kelas dan melihat pendaftarannya.

**Konsekuensi:**
- Bagian Terdaftar: nama, email, waktu daftar; pendaftaran hasil promosi ditandai "Naik dari daftar tunggu" beserta waktu promosi.
- Bagian Daftar tunggu: diurutkan menurut posisi antrean, menampilkan posisi, nama, email, dan waktu daftar.
- Bagian Dibatalkan (bisa dilipat): nama, email, waktu batal, dan siapa yang membatalkan (peserta/admin).
- Halaman ini menjadi titik masuk ke presensi per sesi (FR-15), grid rekap (FR-21), dan ekspor CSV (FR-22).

#### FR-6: Tautan pendaftaran kelas

Admin dapat menyalin tautan pendaftaran satu kelas untuk dibagikan.

**Konsekuensi:**
- Setiap kelas punya satu tautan pendaftaran yang stabil; mengubah judul tidak mengubah tautannya.
- Tombol "Salin tautan" menyalin URL ke clipboard dan memberi konfirmasi yang terbaca pembaca layar.

### 4.3 Pendaftaran berkuota dan daftar tunggu (R1–R3)

**Deskripsi:** Peserta membuka tautan pendaftaran, mengisi nama dan email, lalu langsung mendapat hasil: Terdaftar, atau Daftar tunggu dengan posisi antreannya. Kelas penuh bukan kondisi error. Kuota ditegakkan saat data disimpan, bukan hanya di layar, sehingga dua pendaftaran bersamaan tidak bisa sama-sama mengambil kursi terakhir. Realizes UJ-2.

#### FR-7: Pendaftaran mandiri

Peserta dapat mendaftar ke kelas lewat tautan pendaftaran dengan nama dan email, tanpa akun.

**Konsekuensi:**
- Halaman pendaftaran menampilkan judul kelas, daftar tanggal sesi, dan apakah kelas sudah penuh ("Kelas penuh — Anda akan masuk daftar tunggu").
- Nama wajib (1–100 karakter); email wajib dan berformat email. Email disimpan dalam bentuk ternormalisasi.
- Hasil ditampilkan di halaman yang sama: "Terdaftar" atau "Daftar tunggu #N", disertai tautan ke halaman status peserta.
- Pendaftaran ke kelas Selesai ditolak di API dengan pesan "Pendaftaran kelas ini sudah ditutup"; halaman pendaftaran menampilkan pesan yang sama tanpa formulir. [ASSUMPTION]
- Pendaftaran yang dikirim pada tanggal sesi terakhir (WIB), pukul berapa pun, ditolak dengan pesan yang sama. Pendaftaran yang dikirim sehari sebelumnya pukul 23.59 WIB diterima.

#### FR-8: Kuota tidak pernah terlampaui (R1)

Sistem menetapkan status pendaftaran baru: Terdaftar bila jumlah Terdaftar < kuota dan daftar tunggu kosong, selain itu Daftar tunggu. Syarat daftar tunggu kosong menjaga R3: pendaftar baru tidak pernah mendahului antrean.

**Konsekuensi:**
- R1: jumlah pendaftaran Terdaftar di satu kelas tidak pernah melebihi kuota, pada saat apa pun.
- R1: 20 permintaan pendaftaran HTTP serentak dengan email berbeda ke kelas berkuota 5, dikirim ke API yang sedang berjalan, menghasilkan: ke-20 permintaan berhasil (tidak ada respons 5xx atau error), tepat 5 Terdaftar, dan tepat 15 Daftar tunggu dengan posisi antrean 1–15 tanpa celah maupun duplikat.
- Keputusan Terdaftar/Daftar tunggu dan penyimpanan pendaftaran terjadi sebagai satu operasi atomik di lapisan data.
- Bila lapisan data sedang sibuk melayani penulisan lain, permintaan menunggu gilirannya atau diulang secara otomatis. Pada beban setara 20 pendaftaran serentak, tidak ada peserta yang menerima error karena kesibukan itu. Mekanismenya diputuskan arsitektur.
- Bukti konkurensi wajib mampu gagal (pola ini juga berlaku untuk FR-3, FR-9, dan FR-13): test menjalankan operasi yang benar-benar bersamaan melalui lebih dari satu koneksi ke berkas data, bukan panggilan yang diam-diam berjalan berurutan. Versi kode yang menghapus atomisitas cek-kuota-dan-simpan harus membuat test gagal (mutation check). Skenario serentak diulang 50 kali dalam setiap run CI dan harus lulus semuanya.

#### FR-9: Satu pendaftaran aktif per email per kelas (R2)

Sistem menolak membuat pendaftaran aktif kedua untuk email yang sama di kelas yang sama.

**Konsekuensi:**
- R2: bila email (setelah dinormalisasi) sudah punya pendaftaran aktif di kelas itu, tidak ada pendaftaran baru yang dibuat; peserta melihat status yang sudah ada ("Anda sudah terdaftar di kelas ini" atau "Anda sudah di daftar tunggu #N").
- R2: "Budi@Mail.com " dan "budi@mail.com" dianggap email yang sama.
- R2: dua permintaan pendaftaran identik yang dikirim bersamaan (klik ganda) menghasilkan satu pendaftaran. Kedua permintaan berhasil (tanpa respons 5xx) dan menampilkan status yang sama. Dibuktikan dengan pola bukti konkurensi di FR-8.
- Peserta yang pendaftarannya Dibatalkan boleh mendaftar lagi; pendaftaran barunya diperlakukan seperti pendaftar baru (masuk ke ekor daftar tunggu bila kelas penuh).

#### FR-10: Daftar tunggu FIFO (R3)

Sistem mengurutkan daftar tunggu menurut waktu daftar.

**Konsekuensi:**
- R3: posisi antrean mengikuti urutan waktu daftar; bila waktu daftar sama, urutan pembuatan pendaftaran memecah seri secara deterministik.
- R3: posisi antrean di halaman kelas admin, halaman status peserta, dan hasil pendaftaran selalu sama untuk pendaftaran yang sama.
- Bila pendaftaran di depan batal atau dipromosikan, posisi antrean yang tampil berikutnya bergeser maju.
- Saat kelas Selesai, pendaftaran yang masih di daftar tunggu tidak akan naik lagi. Halaman status peserta menampilkan "Kelas selesai — tidak naik dari daftar tunggu", bukan posisi antrean.

### 4.4 Pembatalan dan promosi daftar tunggu (R4)

**Deskripsi:** Peserta membatalkan pendaftarannya sendiri dari halaman status peserta; admin bisa membatalkan atas nama peserta dari halaman kelas admin. Pembatalan bersifat final dan dikonfirmasi dua langkah. Bila yang batal berstatus Terdaftar, peserta teratas daftar tunggu otomatis naik dalam operasi yang sama. Tidak ada notifikasi; hasil promosi hanya terlihat di layar. Realizes UJ-3.

#### FR-11: Peserta membatalkan pendaftaran

Peserta dapat membatalkan pendaftaran aktifnya dari halaman status peserta.

**Konsekuensi:**
- Pembatalan butuh dua langkah: tombol "Batalkan pendaftaran", lalu konfirmasi yang menyebut judul kelas dan bahwa tindakan ini tidak bisa dibatalkan.
- Setelah batal, status menjadi Dibatalkan dan sistem mencatat waktu batal serta pembatal = peserta.
- Pembatalan boleh dilakukan kapan saja selama kelas Dibuka, termasuk setelah sesi pertama. Pembatalan di kelas Selesai, termasuk sepanjang tanggal sesi terakhir (WIB), ditolak di API dengan pesan "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan". [ASSUMPTION]
- API pembatalan peserta mewajibkan dua masukan: kode rujukan pendaftaran dan email. Pembatalan hanya diproses bila email yang dikirim, setelah dinormalisasi, sama dengan email pendaftaran itu. Bila tidak cocok, atau kode rujukan tidak dikenal, permintaan ditolak dengan pesan yang sama, "Pendaftaran tidak ditemukan", tanpa menyebut bagian mana yang salah dan tanpa perubahan data.
- Kode rujukan pendaftaran yang terlihat publik bersifat acak dan tidak berurutan, sehingga tidak bisa ditebak dari kode pendaftaran lain. ID internal tidak pernah muncul di URL atau API publik. Pembatasan laju permintaan tidak dibangun di MVP (lihat §9).
- Membatalkan pendaftaran yang sudah Dibatalkan, misalnya karena tombol diklik dua kali atau peserta dan admin membatalkan hampir bersamaan, tidak mengubah apa pun dan tidak memicu promosi kedua. Waktu batal dan pembatal yang tercatat tetap milik pembatalan pertama.

#### FR-12: Admin membatalkan atas nama peserta

Admin dapat membatalkan pendaftaran aktif mana pun dari halaman kelas admin, dengan konfirmasi dua langkah yang sama dan aturan kelas Selesai yang sama seperti FR-11. [ASSUMPTION: asumsi yang dibawa dari brief.]

**Konsekuensi:**
- Sistem mencatat pembatal = admin, dan pendaftaran itu tampil di bagian Dibatalkan halaman kelas admin (FR-5) dengan pembatal "admin".
- Efek promosinya identik dengan FR-13.

#### FR-13: Promosi otomatis (R4)

Saat pendaftaran Terdaftar dibatalkan, sistem mempromosikan pendaftaran teratas daftar tunggu dalam operasi atomik yang sama dengan pembatalan.

**Konsekuensi:**
- R4: setelah pembatalan pendaftaran Terdaftar di kelas yang punya daftar tunggu, peserta di posisi antrean 1 berstatus Terdaftar dengan waktu promosi tercatat.
- R4: jumlah yang dipromosikan adalah min(kuota − jumlah Terdaftar, panjang daftar tunggu), sehingga R1 tetap berlaku.
- R4: dua pembatalan bersamaan tidak pernah membuat jumlah Terdaftar melebihi kuota, dan tidak pernah mempromosikan peserta yang sama dua kali. Kedua permintaan berhasil (tanpa respons 5xx). Dibuktikan dengan pola bukti konkurensi di FR-8.
- R4: membatalkan pendaftaran berstatus Daftar tunggu tidak mempromosikan siapa pun.
- Di kelas Selesai, termasuk sepanjang tanggal sesi terakhir (WIB), tidak ada promosi, karena pembatalan dan perubahan kuota sudah ditolak.
- Peserta yang dipromosikan melihat "Terdaftar (naik dari daftar tunggu)" di halaman status peserta.

**Di luar cakupan:** konfirmasi admin sebelum promosi, jendela terima/tolak bagi peserta yang naik, undo pembatalan, notifikasi apa pun (alasan penolakan ada di `addendum.md`).

### 4.5 Halaman status peserta

**Deskripsi:** Peserta memasukkan email dan melihat semua pendaftaran aktifnya di semua kelas, tanpa password. Halaman ini menggantikan pertanyaan status lewat WhatsApp dan menjadi tempat pembatalan. Realizes UJ-2, UJ-3.

#### FR-14: Melihat status lewat email

Peserta dapat melihat pendaftaran aktifnya dengan memasukkan email.

**Konsekuensi:**
- Per kelas ditampilkan: judul, tanggal sesi, status ("Terdaftar", "Terdaftar (naik dari daftar tunggu)", atau "Daftar tunggu #N"), dan untuk pendaftaran Terdaftar: "Hadir x dari y sesi" (y = total sesi) serta kelayakan sertifikat (FR-19).
- Email yang tidak punya pendaftaran aktif menampilkan "Tidak ada pendaftaran aktif untuk email ini", bukan error.
- Pada lebar 360 px, semua isi dan tombol bisa dipakai tanpa gulir horizontal.

**Catatan:** siapa pun yang tahu email seorang peserta bisa melihat dan membatalkan pendaftarannya lewat halaman ini. Risiko ini diterima untuk MVP (lihat §9). Membatalkan tanpa mengetahui email tidak mungkin, karena API pembatalan mewajibkan email yang cocok (FR-11).

### 4.6 Presensi per sesi (R5)

**Deskripsi:** Admin membuka satu sesi dari halaman kelas admin dan menandai kehadiran semua peserta Terdaftar dalam satu formulir, lalu menyimpan sekali. Hanya sesi yang tanggalnya sudah tiba (hari ini atau sebelumnya, WIB) yang bisa diisi. Presensi bisa dikoreksi kemudian. Realizes UJ-4.

#### FR-15: Formulir presensi per sesi

Admin dapat mencatat dan mengoreksi presensi semua peserta Terdaftar untuk satu sesi dalam satu formulir.

**Konsekuensi:**
- Formulir mendaftar setiap peserta berstatus Terdaftar dengan kontrol tiga keadaan yang saling eksklusif: **Hadir**, **Tidak hadir**, **Belum dicatat**. Kontrolnya berupa pilihan tunggal, misalnya grup radio, bukan checkbox. Satu tombol "Simpan" menyimpan semuanya.
- Tanpa FR-18, setiap peserta yang belum punya catatan untuk sesi itu dibuka dalam keadaan Belum dicatat.
- "Simpan" hanya membuat atau mengubah catatan untuk peserta bernilai Hadir atau Tidak hadir. Menyimpan formulir tanpa menyentuh peserta X yang berstatus Belum dicatat tidak membuat catatan untuk X: X tetap Belum dicatat, tampil "—" di grid rekap dan CSV, dan tidak dihitung sebagai Tidak hadir di FR-19 maupun FR-20.
- Catatan yang sudah tersimpan bisa dikoreksi antara Hadir dan Tidak hadir, tetapi tidak bisa dikembalikan ke Belum dicatat. Untuk peserta yang sudah punya catatan, pilihan Belum dicatat tidak tersedia. [ASSUMPTION]
- Membuka ulang sesi yang sudah diisi menampilkan presensi tersimpan dan memungkinkan koreksi.
- Formulir bisa dioperasikan penuh dengan keyboard.
- Pendaftaran yang dibatalkan setelah presensi dicatat tidak lagi tampil di formulir, grid rekap, maupun rekap CSV. Presensinya tetap tersimpan (lihat Presensi di §3). [ASSUMPTION]
- Pendaftaran yang naik dari daftar tunggu setelah sebuah sesi disimpan tampil di formulir sesi itu dalam keadaan Belum dicatat, termasuk bila FR-18 aktif. Catatan presensinya baru dibuat saat admin memilih Hadir atau Tidak hadir untuknya lalu menyimpan.

#### FR-16: Presensi hanya untuk sesi yang sudah tiba (R5)

Sistem menolak presensi untuk sesi yang tanggalnya setelah hari ini.

**Konsekuensi:**
- R5: sesi bertanggal hari ini (WIB) bisa diisi; sesi bertanggal besok tidak.
- R5: kasus tepi zona waktu yang wajib diuji. WIB = UTC+7, jadi pada server berzona UTC tanggal UTC tertinggal dari tanggal WIB antara pukul 00.00 dan 06.59 WIB.
  - Pukul 00.30 WIB tanggal D, proses server berzona UTC (masih tanggal D−1 menurut UTC): sesi tanggal D diterima, sesi tanggal D+1 ditolak.
  - Pukul 06.59 WIB tanggal D, proses server berzona UTC (batas atas jendela itu): sesi tanggal D diterima.
  - Pukul 23.30 WIB tanggal D, proses server berzona Asia/Jayapura (WIT, sudah tanggal D+1 menurut zona proses): sesi tanggal D+1 ditolak.
- R5: test kasus tepi di atas dijalankan dengan zona waktu proses yang berbeda-beda, minimal UTC, Asia/Jakarta, dan Asia/Jayapura, dan memakai waktu "sekarang" yang dikendalikan test, bukan jam mesin.
- R5: penolakan berlaku di API, bukan hanya di UI; UI menampilkan sesi mendatang sebagai tidak bisa diisi dengan teks "Bisa diisi mulai {tanggal}".

#### FR-17 (SHOULD): Beranda "Sesi hari ini"

Setelah masuk, admin melihat daftar sesi bertanggal hari ini di semua kelas, diurutkan menurut judul kelas. Setiap sesi membuka formulir presensinya dengan satu klik. Bila tidak ada sesi hari ini, tampil "Tidak ada sesi hari ini".

#### FR-18 (SHOULD): Bawaan "semua hadir"

Formulir presensi yang belum pernah disimpan dibuka dengan semua peserta dalam keadaan Hadir; admin mengubah peserta yang absen menjadi Tidak hadir. Pilihan Hadir bawaan ini dihitung sebagai pilihan admin, sehingga "Simpan" membuat catatan Hadir untuk peserta yang tidak diubah. Pengecualian: peserta hasil promosi pada sesi yang sudah pernah disimpan tetap Belum dicatat (FR-15).

**Catatan:** bawaan ini mempercepat presensi tetapi bisa menggelembungkan kehadiran bila admin menyimpan tanpa memeriksa. Lihat SM-C1.

### 4.7 Kelayakan sertifikat (R6)

**Deskripsi:** Sistem menghitung kelayakan sertifikat setiap peserta Terdaftar dari presensi yang tersimpan, dan menampilkannya di grid rekap, halaman status peserta, dan rekap CSV. Realizes UJ-4.

#### FR-19: Status kelayakan sertifikat (R6)

Sistem menampilkan "Layak" bila `hadir × 5 ≥ total sesi × 4`, selain itu "Belum layak".

**Konsekuensi:**
- R6: 5 sesi → minimal 4 hadir; 4 sesi → 4 hadir; 3 sesi → 3 hadir; 1 sesi → 1 hadir.
- R6: perhitungan memakai bilangan bulat saja; tidak ada perkalian dengan 0,8.
- Status langsung berubah setelah presensi disimpan atau dikoreksi, dan setelah tanggal sesi ditambah atau dihapus.

#### FR-20 (SHOULD): Status "Tidak mungkin layak"

Sistem menampilkan "Tidak mungkin layak" sebagai pengganti "Belum layak" bila `(hadir + sesi Belum dicatat) × 5 < total sesi × 4`. *Sesi Belum dicatat* adalah sesi tanpa catatan presensi untuk pendaftaran itu (§3 Presensi), baik sesi yang belum tiba maupun sesi lampau yang belum diisi. Hanya catatan Tidak hadir yang mengurangi peluang layak. Status ini tampil di tempat yang sama dengan FR-19.

**Konsekuensi:**
- 5 sesi, 2 kali "Tidak hadir" tercatat: (0 + 3) × 5 = 15 < 20 → "Tidak mungkin layak".
- 5 sesi, 1 kali "Tidak hadir" tercatat: (0 + 4) × 5 = 20 ≥ 20 → tetap "Belum layak".
- 3 sesi, 1 kali "Tidak hadir" tercatat: (0 + 2) × 5 = 10 < 12 → "Tidak mungkin layak".

### 4.8 Rekap dan ekspor CSV

**Deskripsi:** Grid rekap muncul dengan sendirinya dari presensi; tidak ada langkah "buat rekap". Admin mengekspornya ke CSV dengan satu klik. Realizes UJ-4.

#### FR-21: Grid rekap kehadiran

Admin dapat melihat grid rekap satu kelas.

**Konsekuensi:**
- Baris per peserta Terdaftar; kolom per sesi (tanggal) berisi "Hadir", "Tidak hadir", atau "—" (Belum dicatat); lalu kolom jumlah hadir ("x/y") dan kelayakan sertifikat.
- Nilai sel dibedakan dengan teks, tidak dengan warna saja.

#### FR-22: Ekspor rekap CSV

Admin dapat mengunduh rekap CSV satu kelas.

**Konsekuensi:**
- Isi berkas sama dengan grid rekap: nama, email, satu kolom per tanggal sesi, jumlah hadir, total sesi, status kelayakan.
- Header berbahasa Indonesia. Encoding UTF-8 dengan BOM agar berkas terbuka benar di Excel. Nama dengan koma, tanda kutip, atau huruf non-ASCII tetap terbaca utuh saat dibuka di Excel.
- Sel yang diawali `=`, `+`, `-`, atau `@` diberi awalan tanda kutip tunggal (`'`) supaya tidak dieksekusi sebagai formula.
- Nama berkas berisi judul kelas dan tanggal ekspor (WIB). Karakter yang tidak sah dalam nama berkas, seperti `/ \ : * ? " < > |`, diganti tanda hubung.

## 5. Kebutuhan non-fungsional lintas fitur

- **NFR-1 Konsistensi data.** R1, R2, dan R4 ditegakkan di lapisan data dalam satu transaksi per operasi (cek kuota + simpan; batal + promosi). Validasi di UI atau handler saja tidak dianggap memenuhi. Bukti: test serentak untuk FR-8, FR-9, dan FR-13 memenuhi pola bukti konkurensi di FR-8, yaitu operasi benar-benar bersamaan lewat lebih dari satu koneksi, tidak ada respons 5xx, mutation check gagal tanpa atomisitas, dan 50 ulangan per run CI yang semuanya lulus.
- **NFR-2 Zona waktu.** Semua perhitungan "hari ini" dan tanggal sesi memakai Asia/Jakarta, terlepas dari zona waktu server atau browser.
- **NFR-3 Aksesibilitas.** Semua halaman memenuhi WCAG 2.1 AA: kontras teks minimal 4,5:1, semua aksi bisa dilakukan dengan keyboard, fokus terlihat, setiap input punya label, status tidak disampaikan dengan warna saja, dan hasil aksi (terdaftar, tersimpan, gagal) diumumkan ke pembaca layar.
- **NFR-4 Tata letak.** Halaman peserta (pendaftaran, status) bisa dipakai penuh pada lebar 360 px tanpa gulir horizontal. Halaman admin dioptimalkan untuk laptop 1366×768 ke atas dan bergaya panel admin: tabel padat, tanpa hiasan, dan setiap tabel utama tampil tanpa gulir horizontal.
- **NFR-5 Bahasa.** Semua teks antarmuka, pesan validasi, dan header CSV berbahasa Indonesia. Tanggal ditampilkan dalam format Indonesia, mis. "Senin, 9 Nov 2026". Identifier kode dan nama berkas berbahasa Inggris.
- **NFR-6 Data lokal.** Semua data disimpan di satu berkas SQLite lokal. Tidak ada layanan cloud untuk basis data, hosting, atau autentikasi. Produksi berjalan sebagai satu instance di satu server kecil milik lembaga yang bisa diakses dari internet lewat HTTPS, karena peserta membuka tautan pendaftaran dari ponsel di luar jaringan kantor (UJ-2). Laptop lokal hanya dipakai untuk pengembangan dan demo, bukan untuk melayani peserta. [ASSUMPTION]
- **NFR-7 Kinerja pada skala lembaga.** Pada data satu tahun (±240 kelas, ±5.000 pendaftaran), waktu respons server p95 untuk setiap halaman dan aksi < 1 detik, dan ekspor CSV satu kelas < 2 detik. Ukur dengan data seed satu tahun di laptop tim yang dibatasi ke satu inti CPU.
- **NFR-8 Keamanan minimum.** Di produksi, semua lalu lintas antara browser dan Kelasku memakai HTTPS, karena password admin, cookie sesi masuk, serta nama dan email peserta melewati jaringan publik. Akses HTTP biasa dialihkan ke HTTPS. Password admin disimpan dalam bentuk hash; aksi admin di API selalu memeriksa sesi masuk; semua input divalidasi di server; nilai rahasia hanya di `.env` lokal dan tidak masuk repositori. Keamanan di luar itu adalah non-goal MVP.
- **NFR-9 Kemampuan uji.** Setiap aturan R1–R7 punya test otomatis yang menyebut ID aturannya di nama test. Data seed dipakai untuk demo dan test end-to-end. Isinya mengikuti `addendum.md` §4: akun admin, kelas Penuh tanpa daftar tunggu, kelas Penuh dengan daftar tunggu, kelas dengan sesi lampau dan presensi sebagian, serta kelas dengan sesi hari ini.

## 6. Non-goals

Kelasku MVP **tidak** membangun:

- Pembayaran atau tagihan.
- Login SSO atau akun peserta dengan password.
- Notifikasi email, WhatsApp, atau push, termasuk pemberitahuan promosi.
- Aplikasi mobile native.
- Dukungan multi-lembaga (multi-tenant).
- Penerbitan berkas sertifikat PDF. Kelasku hanya menentukan siapa yang layak.
- Penilaian atau ujian.
- Katalog kelas publik atau pencarian kelas.
- Penjadwalan jam sesi, ruangan, atau instruktur.

## 7. Cakupan MVP

### 7.1 Termasuk

- **Epik 1 — Kelas & Pendaftaran Berkuota (R1–R3, R7):** FR-1 sampai FR-10. Dibangun pertama karena R1 adalah metrik utama dan fondasi semua epik lain.
- **Epik berikutnya (tetap wajib di MVP):** pembatalan dan promosi (FR-11 sampai FR-13, R4); halaman status peserta (FR-14); presensi (FR-15, FR-16, R5); kelayakan sertifikat (FR-19, R6); grid rekap dan ekspor CSV (FR-21, FR-22).
- **SHOULD (potongan pertama bila waktu habis):** FR-17, FR-18, FR-20.

**Potongan kedua (disiapkan, dipakai hanya bila kriteria hari ke-3 terpenuhi).** Cakupan di atas adalah 19 FR MUST dan 9 NFR untuk ±15 hari-orang di repositori kosong, sehingga satu potongan SHOULD saja tidak cukup sebagai katup pengaman. Potongan kedua berisi:

1. FR-5: bagian Dibatalkan di halaman kelas admin ditunda. Data pembatalan (waktu batal dan pembatal) tetap disimpan, hanya tampilannya yang ditunda.
2. FR-3: dialog peringatan perubahan total sesi ditunda. Aturan bahwa tanggal sesi yang sudah punya presensi terkunci tetap berlaku.
3. NFR-7: benchmark p95 dengan data seed satu tahun diganti smoke test kinerja, yaitu memuat tabel kelas, halaman kelas, dan ekspor CSV pada data seed satu tahun masing-masing satu kali di bawah target waktunya.
4. NFR-3: target tetap WCAG 2.1 AA, tetapi verifikasi otomatis dengan axe dibatasi ke alur peserta (halaman pendaftaran, halaman status, pembatalan) dan formulir presensi, ditambah uji keyboard manual pada ketiga alur itu. Halaman admin lain diperiksa secara best-effort.

Yang tidak pernah dipotong: R1–R7 beserta test-nya (NFR-1, NFR-9), HTTPS (NFR-8), dan kontrol presensi tiga keadaan (FR-15).

**Kriteria keputusan potong (akhir hari ke-3 dari 5 hari kerja).** PM dan tim memeriksa Epik 1. Bila FR-1 sampai FR-10 belum selesai dengan test konkurensi R1 dan R2 hijau sesuai pola bukti di FR-8, potongan SHOULD dan potongan kedua diterapkan sekaligus. Bila Epik 1 selesai tetapi pembatalan dan promosi (FR-11 sampai FR-13) belum dimulai, hanya potongan SHOULD yang diterapkan. Keputusan dicatat di memlog proyek. [ASSUMPTION]

Pembagian epik final diputuskan di `bmad-create-epics-and-stories`.

### 7.2 Tidak termasuk di MVP

Semua butir di §6.

### 7.3 COULD (ditunda, ditinjau ulang setelah MVP)

- Riwayat perubahan status pendaftaran, untuk menyelesaikan sengketa.
- Pintasan keyboard di formulir presensi.
- Filter peserta di halaman kelas admin.
- Ringkasan dashboard.
- Indikator "Sisa N kursi" di halaman pendaftaran.
- Log peristiwa (ekspor CSV, koreksi presensi) untuk mengukur SM-3 dan SM-C1 secara otomatis.

## 8. Metrik keberhasilan

**Utama**
- **SM-1 Nol kelas melebihi kuota.** Jumlah kelas yang pernah punya Terdaftar > kuota. Target: 0 sejak MVP dipakai (sekarang 2–3 per bulan). Diukur dengan query bulanan atas jumlah Terdaftar dibanding kuota per kelas, ditambah test paralel FR-8/FR-13 yang lulus di setiap build. Memvalidasi FR-3, FR-8, FR-9, FR-13.
- **SM-2 Rekap satu kelas < 5 menit.** Waktu dari admin membuka halaman kelas sampai rekap CSV terunduh, untuk kelas 5 sesi dengan presensi lengkap. Target: < 5 menit (sekarang ±1 jam). Diukur dengan uji coba berwaktu bersama Rina. Memvalidasi FR-15, FR-21, FR-22.
- **SM-3 Daftar sertifikat siap di hari yang sama.** Persentase kelas yang rekap CSV-nya diekspor pada tanggal sesi terakhir. Target: ≥ 90% kelas pada bulan pertama pemakaian (sekarang beberapa hari setelahnya). Diukur manual di MVP: admin mencatat tanggal penyerahan daftar sertifikat per kelas. Memvalidasi FR-15, FR-19, FR-21, FR-22.

**Sekunder**
- **SM-4 Pertanyaan status lewat WhatsApp berkurang.** Perkiraan Rina atas jumlah pertanyaan "sudah terdaftar?/antrean berapa?" per minggu, sebelum dan sesudah satu bulan pemakaian. Target: turun ≥ 50% dari perkiraan awal Rina. Memvalidasi FR-7, FR-14.

**Metrik pengimbang (jangan dioptimalkan)**
- **SM-C1 Ketepatan presensi.** Kecepatan presensi (SM-2, FR-18) tidak boleh dibayar dengan presensi yang salah. Diukur manual: setiap bulan Rina mencocokkan presensi 3 kelas dengan daftar hadir kertas atau ingatan instruktur. Selisih yang sering adalah tanda bawaan "semua hadir" merusak data. Mengimbangi SM-2.
- **SM-C2 Kursi terisi lewat promosi.** Jumlah promosi bukan target. Menaikkan kuota hanya untuk menghabiskan daftar tunggu mengorbankan alasan kuota itu ada (kapasitas ruang dan instruktur). Mengimbangi SM-1.

## 9. Risiko

- **Peserta yang dipromosikan tidak tahu.** Tanpa notifikasi, peserta baru tahu saat membuka halaman status, jadi kursi bisa terbuang. Mitigasi MVP: halaman kelas admin menandai promosi beserta waktunya (FR-5) sehingga Rina bisa mengabari secara manual bila perlu.
- **Pembatalan oleh orang lain.** Siapa pun yang tahu email peserta bisa membatalkan pendaftarannya, dan promosi yang terpicu tidak bisa dibalik. Pembatalan massal dengan menebak ID tidak mungkin, karena API pembatalan mewajibkan email yang cocok dan kode rujukan publik yang acak (FR-11). Tanpa pembatasan laju di MVP; risiko sisanya diterima karena keamanan penuh adalah non-goal MVP.
- **Peserta yang naik di tengah kelas mungkin mustahil layak.** Ditangani sebagian oleh FR-20 (SHOULD).
- **Target satu minggu ketat** untuk empat area. Mitigasi: Epik 1 dikerjakan pertama, potongan SHOULD dan potongan kedua sudah disiapkan, dan keputusan potong diambil di akhir hari ke-3 (§7.1).
- **Server lembaga harus terjangkau dari internet lewat HTTPS (NFR-6, NFR-8).** Bila lembaga tidak bisa menyediakan alamat publik dan sertifikat, peserta tidak bisa mendaftar dari ponsel di luar kantor dan UJ-2 gagal. Perlu dipastikan sebelum rilis.
- **Data pribadi peserta (nama, email) disimpan tanpa kebijakan retensi.** Lihat pertanyaan terbuka 3.

## 10. Pertanyaan terbuka

1. **Bangun atau pakai alat yang sudah ada?** Riset kompetitif (pretix, Moodle Attendance, dll.) belum dijalankan; prompt-nya sudah siap di `_bmad-output/planning-artifacts/research/competitive-aplikasi-pendaftaran-dan-kehadiran-kelas-2026-11-02/brief.md`. Bukan penghalang untuk studi kasus ini; ditinjau ulang bila riset dijalankan. Pemilik: PM.
2. **Pencadangan berkas SQLite.** Siapa yang mencadangkan, seberapa sering, dan di mana disimpan. Bukan penghalang untuk PRD; diputuskan di `bmad-architecture` atau runbook. Pemilik: tim pengembang.
3. **Retensi data pribadi peserta.** Berapa lama nama dan email peserta disimpan, mengingat UU No. 27/2022 tentang Pelindungan Data Pribadi. Bukan penghalang untuk MVP internal. Pemilik: lembaga.

## 11. Indeks asumsi

- §4.2 FR-2 — Tanggal sesi di masa lalu diterima, untuk presensi susulan, asalkan minimal satu tanggal setelah hari ini.
- §4.2 FR-3 — Kuota yang dinaikkan langsung mempromosikan antrean teratas (mengubah asumsi brief).
- §4.2 FR-3 — Tanggal sesi yang sudah punya presensi tidak bisa diubah atau dihapus.
- §4.2 FR-3 — Kelas Selesai hanya bisa diubah judulnya.
- §4.2 FR-3 — Kelas tidak bisa dihapus di MVP.
- §4.2 FR-4 — Tabel kelas bawaan memuat kelas Dibuka ditambah kelas Selesai 30 hari terakhir; "Tampilkan semua kelas Selesai" memuat semuanya tanpa paginasi.
- §4.3 FR-7 — Pendaftaran ditutup saat kelas Selesai, yaitu sejak pukul 00.00 WIB pada tanggal sesi terakhir.
- §4.4 FR-11 — Pembatalan boleh kapan saja selama kelas Dibuka; ditolak saat kelas Selesai, termasuk pada tanggal sesi terakhir.
- §4.4 FR-12 — Admin boleh membatalkan atas nama peserta, dengan promosi yang sama.
- §4.6 FR-15 — Catatan presensi yang sudah tersimpan tidak bisa dikembalikan ke Belum dicatat; hanya dikoreksi antara Hadir dan Tidak hadir.
- §4.6 FR-15 — Pendaftaran yang dibatalkan setelah presensi dicatat tidak tampil di formulir, grid, maupun CSV; presensinya tetap tersimpan.
- §5 NFR-6 — Produksi berjalan di satu server kecil milik lembaga yang terjangkau dari internet lewat HTTPS; laptop lokal hanya untuk pengembangan dan demo.
- §7.1 — Isi potongan kedua dan kriteria keputusan potong di akhir hari ke-3.
