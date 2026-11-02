---
title: "PRD: Kelasku"
status: final
created: 2026-11-02
updated: 2026-11-02
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
  Rina, di akhir sesi ke-4 (sesi terakhir), membuka halaman kelas, memilih sesi hari ini, menandai siapa saja yang hadir, dan menekan "Simpan". Grid rekap langsung menunjukkan setiap peserta dengan "hadir 4 dari 4" atau "hadir 3 dari 4" beserta status "Layak" atau "Belum layak". Ia menekan "Ekspor CSV" dan mengirim berkasnya ke bagian sertifikat. **Kasus tepi:** sesi minggu depan tampil di daftar sesi, tetapi formulir presensinya tidak bisa diisi sebelum tanggalnya tiba (R5).

## 3. Glosarium

- **Admin** — Pengguna internal lembaga yang masuk dengan akun seed. Membuat dan mengubah kelas, mencatat presensi, membatalkan pendaftaran atas nama peserta, dan mengekspor rekap.
- **Peserta** — Orang yang mendaftar ke kelas. Diidentifikasi oleh email yang dinormalisasi (spasi di awal/akhir dibuang, huruf kecil). Tidak punya akun atau password.
- **Kelas** — Satu program pelatihan dengan judul, satu atau lebih sesi, dan kuota. Satu kelas punya banyak pendaftaran.
- **Sesi** — Satu pertemuan kelas pada satu tanggal kalender (tanpa jam). Tanggal sesi unik dalam satu kelas. Kata "sesi" di dokumen ini selalu berarti pertemuan kelas; status masuk admin disebut **sesi masuk**.
- **Sesi masuk** — Keadaan admin sudah masuk (login) dan belum keluar.
- **Kuota** — Bilangan bulat ≥ 1: jumlah maksimum pendaftaran berstatus Terdaftar di satu kelas.
- **Status kelas** — Dihitung dari tanggal sesi dan hari ini (WIB), tidak disimpan:
  - **Dibuka**: tanggal sesi terakhir ≥ hari ini.
  - **Penuh**: Dibuka dan jumlah Terdaftar = kuota.
  - **Selesai**: tanggal sesi terakhir < hari ini. Kelas Selesai menolak pendaftaran baru, pembatalan, dan promosi.
- **Total sesi** — Jumlah semua tanggal sesi kelas, termasuk sesi yang belum tiba.
- **Pendaftaran** — Hubungan satu peserta dengan satu kelas, dengan satu status dan waktu daftar. Satu peserta bisa punya beberapa pendaftaran di kelas yang sama sepanjang waktu, tetapi paling banyak satu yang aktif (R2).
- **Status pendaftaran** — Salah satu dari: **Terdaftar**, **Daftar tunggu**, **Dibatalkan**. Terdaftar dan Daftar tunggu disebut **aktif**.
- **Waktu daftar** — Saat pendaftaran dibuat oleh sistem. Menentukan urutan daftar tunggu (R3).
- **Daftar tunggu** — Urutan pendaftaran berstatus Daftar tunggu di satu kelas, FIFO menurut waktu daftar. **Posisi antrean** adalah nomor urut 1-based dalam daftar ini, dihitung ulang setiap kali ditampilkan.
- **Promosi** — Perubahan otomatis status pendaftaran dari Daftar tunggu menjadi Terdaftar ketika kursi terbuka, baik karena pembatalan (R4) maupun karena kuota dinaikkan (FR-3). Pendaftaran yang dipromosikan menyimpan waktu promosi.
- **Pembatalan** — Perubahan status pendaftaran aktif menjadi Dibatalkan, oleh peserta sendiri atau oleh admin. Final; tidak bisa dibatalkan ulang (undo).
- **Tautan pendaftaran** — URL publik per kelas yang membuka halaman pendaftaran kelas itu.
- **Halaman status peserta** — Halaman publik tempat peserta memasukkan email untuk melihat semua pendaftaran aktifnya, kehadiran, dan kelayakan sertifikat, serta untuk membatalkan.
- **Presensi** — Catatan hadir/tidak hadir untuk satu pendaftaran Terdaftar pada satu sesi. Presensi melekat pada pendaftaran, bukan pada email. Bila pendaftaran dibatalkan, presensinya tetap tersimpan tetapi tidak ditampilkan. Pendaftaran baru dengan email yang sama tidak mewarisi presensi lama.
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

**Siklus kelas.** Kelas berstatus Dibuka sejak dibuat sampai tanggal sesi terakhirnya lewat, lalu Selesai (lihat Status kelas di §3). Selama Dibuka, peserta bisa mendaftar dan membatalkan kapan saja, termasuk setelah sesi pertama. Setelah Selesai, daftar Terdaftar dibekukan: tidak ada pendaftaran, pembatalan, atau promosi baru, sehingga daftar kelayakan sertifikat tidak berubah lagi kecuali lewat koreksi presensi. Tanggal sesi yang dipakai untuk menghitung R6 hanya bisa berubah selama belum ada presensi di tanggal itu.

> [NOTE FOR PM] Keputusan siklus kelas di paragraf ini dan di FR-3, FR-7, FR-11, dan FR-15 diambil sebagai opsi paling sederhana, tanpa konfirmasi langsung dari Rina. Konfirmasikan sebelum `bmad-create-epics-and-stories`. Yang paling mungkin ditanyakan Rina: apakah pembatalan perlu batas waktu, misalnya setelah sesi pertama.

#### FR-2: Membuat kelas

Admin dapat membuat kelas dengan judul, satu atau lebih tanggal sesi, dan kuota.

**Konsekuensi:**
- Judul wajib, 1–120 karakter setelah spasi di awal/akhir dibuang.
- Minimal satu tanggal sesi; tanggal ganda dalam satu kelas ditolak dengan pesan yang menyebut tanggalnya.
- Kuota wajib berupa bilangan bulat ≥ 1; nilai lain ditolak dengan pesan validasi di dekat kolomnya.
- Minimal satu tanggal sesi harus ≥ hari ini (WIB), karena kelas yang lahir dalam status Selesai tidak bisa menerima pendaftaran. Tanggal lain boleh di masa lalu. [ASSUMPTION: admin bisa memasukkan kelas yang sudah berjalan, lalu mencatat presensi susulan.]
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
- Kolom: judul, sesi berikutnya (tanggal sesi terdekat ≥ hari ini, atau "Selesai" bila tidak ada), terisi/kuota (mis. "18/20"), dan jumlah daftar tunggu.
- Kelas Penuh ditandai dengan teks "Penuh" dan ikon, tidak dengan warna saja.
- Urutan bawaan: kelas dengan sesi berikutnya paling dekat di atas; kelas Selesai di bawah.
- Tabel memuat 50 kelas tanpa paginasi. Di layar 1366×768, keempat kolom terlihat tanpa gulir horizontal.

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

#### FR-8: Kuota tidak pernah terlampaui (R1)

Sistem menetapkan status pendaftaran baru: Terdaftar bila jumlah Terdaftar < kuota dan daftar tunggu kosong, selain itu Daftar tunggu. Syarat daftar tunggu kosong menjaga R3: pendaftar baru tidak pernah mendahului antrean.

**Konsekuensi:**
- R1: jumlah pendaftaran Terdaftar di satu kelas tidak pernah melebihi kuota, pada saat apa pun.
- R1: 20 pendaftaran dengan email berbeda yang dikirim paralel ke kelas berkuota 5 menghasilkan tepat 5 Terdaftar dan 15 Daftar tunggu.
- Keputusan Terdaftar/Daftar tunggu dan penyimpanan pendaftaran terjadi sebagai satu operasi atomik di lapisan data.

#### FR-9: Satu pendaftaran aktif per email per kelas (R2)

Sistem menolak membuat pendaftaran aktif kedua untuk email yang sama di kelas yang sama.

**Konsekuensi:**
- R2: bila email (setelah dinormalisasi) sudah punya pendaftaran aktif di kelas itu, tidak ada pendaftaran baru yang dibuat; peserta melihat status yang sudah ada ("Anda sudah terdaftar di kelas ini" atau "Anda sudah di daftar tunggu #N").
- R2: "Budi@Mail.com " dan "budi@mail.com" dianggap email yang sama.
- R2: dua permintaan pendaftaran identik yang dikirim bersamaan (klik ganda) menghasilkan satu pendaftaran.
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
- Pembatalan boleh dilakukan kapan saja selama kelas Dibuka, termasuk setelah sesi pertama. Pembatalan di kelas Selesai ditolak di API dengan pesan "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan". [ASSUMPTION]
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
- R4: dua pembatalan bersamaan tidak pernah membuat jumlah Terdaftar melebihi kuota, dan tidak pernah mempromosikan peserta yang sama dua kali.
- R4: membatalkan pendaftaran berstatus Daftar tunggu tidak mempromosikan siapa pun.
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

**Catatan:** siapa pun yang tahu email seorang peserta bisa melihat dan membatalkan pendaftarannya. Risiko ini diterima untuk MVP (lihat §9).

### 4.6 Presensi per sesi (R5)

**Deskripsi:** Admin membuka satu sesi dari halaman kelas admin dan menandai kehadiran semua peserta Terdaftar dalam satu formulir, lalu menyimpan sekali. Hanya sesi yang tanggalnya sudah tiba (hari ini atau sebelumnya, WIB) yang bisa diisi. Presensi bisa dikoreksi kemudian. Realizes UJ-4.

#### FR-15: Formulir presensi per sesi

Admin dapat mencatat dan mengoreksi presensi semua peserta Terdaftar untuk satu sesi dalam satu formulir.

**Konsekuensi:**
- Formulir mendaftar setiap peserta berstatus Terdaftar dengan pilihan hadir/tidak hadir; satu tombol "Simpan" menyimpan semuanya.
- Membuka ulang sesi yang sudah diisi menampilkan presensi tersimpan dan memungkinkan koreksi.
- Formulir bisa dioperasikan penuh dengan keyboard.
- Pendaftaran yang dibatalkan setelah presensi dicatat tidak lagi tampil di formulir, grid rekap, maupun rekap CSV. Presensinya tetap tersimpan (lihat Presensi di §3). [ASSUMPTION]
- Pendaftaran yang naik dari daftar tunggu setelah sebuah sesi disimpan tampil di formulir sesi itu dengan status "belum dicatat", tanpa centang bawaan. Catatan presensinya baru dibuat saat admin menyimpan pilihan untuknya.

#### FR-16: Presensi hanya untuk sesi yang sudah tiba (R5)

Sistem menolak presensi untuk sesi yang tanggalnya setelah hari ini.

**Konsekuensi:**
- R5: sesi bertanggal hari ini (WIB) bisa diisi; sesi bertanggal besok tidak, termasuk pukul 23.30 WIB saat jam server UTC sudah menunjukkan hari berikutnya, dan pukul 06.00 WIB saat UTC masih hari sebelumnya.
- R5: penolakan berlaku di API, bukan hanya di UI; UI menampilkan sesi mendatang sebagai tidak bisa diisi dengan teks "Bisa diisi mulai {tanggal}".

#### FR-17 (SHOULD): Beranda "Sesi hari ini"

Setelah masuk, admin melihat daftar sesi bertanggal hari ini di semua kelas, diurutkan menurut judul kelas. Setiap sesi membuka formulir presensinya dengan satu klik. Bila tidak ada sesi hari ini, tampil "Tidak ada sesi hari ini".

#### FR-18 (SHOULD): Bawaan "semua hadir"

Formulir presensi yang belum pernah disimpan dibuka dengan semua peserta tercentang hadir; admin menghapus centang peserta yang absen.

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

Sistem menampilkan "Tidak mungkin layak" sebagai pengganti "Belum layak" bila `(hadir + sesi tanpa catatan presensi) × 5 < total sesi × 4`. *Sesi tanpa catatan presensi* mencakup sesi yang belum tiba maupun sesi lampau yang belum diisi. Status ini tampil di tempat yang sama dengan FR-19.

**Konsekuensi:**
- 5 sesi, 2 kali "Tidak hadir" tercatat: (0 + 3) × 5 = 15 < 20 → "Tidak mungkin layak".
- 5 sesi, 1 kali "Tidak hadir" tercatat: (0 + 4) × 5 = 20 ≥ 20 → tetap "Belum layak".
- 3 sesi, 1 kali "Tidak hadir" tercatat: (0 + 2) × 5 = 10 < 12 → "Tidak mungkin layak".

### 4.8 Rekap dan ekspor CSV

**Deskripsi:** Grid rekap muncul dengan sendirinya dari presensi; tidak ada langkah "buat rekap". Admin mengekspornya ke CSV dengan satu klik. Realizes UJ-4.

#### FR-21: Grid rekap kehadiran

Admin dapat melihat grid rekap satu kelas.

**Konsekuensi:**
- Baris per peserta Terdaftar; kolom per sesi (tanggal) berisi "Hadir", "Tidak hadir", atau "—" (belum dicatat); lalu kolom jumlah hadir ("x/y") dan kelayakan sertifikat.
- Nilai sel dibedakan dengan teks, tidak dengan warna saja.

#### FR-22: Ekspor rekap CSV

Admin dapat mengunduh rekap CSV satu kelas.

**Konsekuensi:**
- Isi berkas sama dengan grid rekap: nama, email, satu kolom per tanggal sesi, jumlah hadir, total sesi, status kelayakan.
- Header berbahasa Indonesia. Encoding UTF-8 dengan BOM agar berkas terbuka benar di Excel. Nama dengan koma, tanda kutip, atau huruf non-ASCII tetap terbaca utuh saat dibuka di Excel.
- Sel yang diawali `=`, `+`, `-`, atau `@` diberi awalan tanda kutip tunggal (`'`) supaya tidak dieksekusi sebagai formula.
- Nama berkas berisi judul kelas dan tanggal ekspor (WIB). Karakter yang tidak sah dalam nama berkas, seperti `/ \ : * ? " < > |`, diganti tanda hubung.

## 5. Kebutuhan non-fungsional lintas fitur

- **NFR-1 Konsistensi data.** R1, R2, dan R4 ditegakkan di lapisan data dalam satu transaksi per operasi (cek kuota + simpan; batal + promosi). Validasi di UI atau handler saja tidak dianggap memenuhi. Bukti: test paralel di FR-8, FR-9, FR-13 lulus berulang kali tanpa flake.
- **NFR-2 Zona waktu.** Semua perhitungan "hari ini" dan tanggal sesi memakai Asia/Jakarta, terlepas dari zona waktu server atau browser.
- **NFR-3 Aksesibilitas.** Semua halaman memenuhi WCAG 2.1 AA: kontras teks minimal 4,5:1, semua aksi bisa dilakukan dengan keyboard, fokus terlihat, setiap input punya label, status tidak disampaikan dengan warna saja, dan hasil aksi (terdaftar, tersimpan, gagal) diumumkan ke pembaca layar.
- **NFR-4 Tata letak.** Halaman peserta (pendaftaran, status) bisa dipakai penuh pada lebar 360 px tanpa gulir horizontal. Halaman admin dioptimalkan untuk laptop 1366×768 ke atas dan bergaya panel admin: tabel padat, tanpa hiasan, dan setiap tabel utama tampil tanpa gulir horizontal.
- **NFR-5 Bahasa.** Semua teks antarmuka, pesan validasi, dan header CSV berbahasa Indonesia. Tanggal ditampilkan dalam format Indonesia, mis. "Senin, 9 Nov 2026". Identifier kode dan nama berkas berbahasa Inggris.
- **NFR-6 Data lokal.** Semua data disimpan di satu berkas SQLite lokal. Tidak ada layanan cloud untuk basis data, hosting, atau autentikasi. Kelasku berjalan di laptop lokal atau satu server kecil milik lembaga. [ASSUMPTION]
- **NFR-7 Kinerja pada skala lembaga.** Pada data satu tahun (±240 kelas, ±5.000 pendaftaran), waktu respons server p95 untuk setiap halaman dan aksi < 1 detik, dan ekspor CSV satu kelas < 2 detik. Ukur dengan data seed satu tahun di laptop tim yang dibatasi ke satu inti CPU.
- **NFR-8 Keamanan minimum.** Password admin disimpan dalam bentuk hash; aksi admin di API selalu memeriksa sesi masuk; semua input divalidasi di server; nilai rahasia hanya di `.env` lokal dan tidak masuk repositori. Keamanan di luar itu adalah non-goal MVP.
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
- **SHOULD (dipotong pertama bila waktu habis):** FR-17, FR-18, FR-20.

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
- **Pembatalan oleh orang lain.** Siapa pun yang tahu email peserta bisa membatalkan pendaftarannya, dan promosi yang terpicu tidak bisa dibalik. Diterima karena keamanan penuh adalah non-goal MVP.
- **Peserta yang naik di tengah kelas mungkin mustahil layak.** Ditangani sebagian oleh FR-20 (SHOULD).
- **Target satu minggu ketat** untuk empat area. FR SHOULD dipotong lebih dulu; Epik 1 dikerjakan pertama.
- **Data pribadi peserta (nama, email) disimpan tanpa kebijakan retensi.** Lihat pertanyaan terbuka 3.

## 10. Pertanyaan terbuka

1. **Bangun atau pakai alat yang sudah ada?** Riset kompetitif (pretix, Moodle Attendance, dll.) belum dijalankan; prompt-nya sudah siap di `_bmad-output/planning-artifacts/research/competitive-aplikasi-pendaftaran-dan-kehadiran-kelas-2026-11-02/brief.md`. Bukan penghalang untuk studi kasus ini; ditinjau ulang bila riset dijalankan. Pemilik: PM.
2. **Pencadangan berkas SQLite.** Siapa yang mencadangkan, seberapa sering, dan di mana disimpan. Bukan penghalang untuk PRD; diputuskan di `bmad-architecture` atau runbook. Pemilik: tim pengembang.
3. **Retensi data pribadi peserta.** Berapa lama nama dan email peserta disimpan, mengingat UU No. 27/2022 tentang Pelindungan Data Pribadi. Bukan penghalang untuk MVP internal. Pemilik: lembaga.

## 11. Indeks asumsi

- §4.2 FR-2 — Tanggal sesi di masa lalu diterima, untuk presensi susulan, asalkan minimal satu tanggal ≥ hari ini.
- §4.2 FR-3 — Kuota yang dinaikkan langsung mempromosikan antrean teratas (mengubah asumsi brief).
- §4.2 FR-3 — Tanggal sesi yang sudah punya presensi tidak bisa diubah atau dihapus.
- §4.2 FR-3 — Kelas Selesai hanya bisa diubah judulnya.
- §4.2 FR-3 — Kelas tidak bisa dihapus di MVP.
- §4.3 FR-7 — Pendaftaran ditutup saat kelas Selesai.
- §4.4 FR-11 — Pembatalan boleh kapan saja selama kelas Dibuka; ditolak saat kelas Selesai.
- §4.4 FR-12 — Admin boleh membatalkan atas nama peserta, dengan promosi yang sama.
- §4.6 FR-15 — Pendaftaran yang dibatalkan setelah presensi dicatat tidak tampil di formulir, grid, maupun CSV; presensinya tetap tersimpan.
- §5 NFR-6 — Kelasku berjalan di laptop lokal atau satu server kecil milik lembaga.
