# Laporan Validasi — PRD Kelasku

- **PRD:** `_bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md`
- **Rubrik:** `.claude/skills/bmad-prd/assets/prd-validation-checklist.md`
- **Dijalankan:** 2026-11-02T12:41:23+07:00
- **Grade:** Fair (Cukup)

## Putusan keseluruhan

PRD ini kuat untuk taruhannya. Tesisnya jelas dan spesifik, glosariumnya rapat, setiap aturan R1–R7 punya FR dengan konsekuensi yang bisa diuji (konkurensi, batas tengah malam WIB, R6 dengan bilangan bulat), dan siklus kelas kini diputuskan secara eksplisit dengan `[NOTE FOR PM]` di tempat yang tepat. Ada dua risiko yang tersisa. Pertama, keterjangkauan aplikasi belum diputuskan: NFR-6 mengizinkan "laptop lokal", padahal UJ-2 menuntut peserta membuka tautan dari ponsel lewat WhatsApp. Kedua, kelas masih berstatus Dibuka sepanjang hari sesi terakhir, sehingga rekap CSV yang diekspor hari itu (UJ-4, SM-3) belum final. Selain itu ada beberapa celah done-ness yang akan langsung terasa saat membuat story: status awal formulir presensi, delimiter CSV untuk Excel berlokal Indonesia, dan tidak adanya jalan pemulihan bila tanggal sesi salah.

Reviewer tambahan mempertajam gambaran ini. Reviewer adversarial menaikkan dua celah menjadi **critical**: formulir presensi berbasis centang tidak bisa membedakan "tidak hadir" dari "belum dicatat", sehingga hasil R6/FR-20 bergantung pada tafsiran engineer; dan kelas tetap Dibuka pada hari sesi terakhir, sehingga CSV yang sudah diserahkan ke bagian sertifikat bisa basi hari itu juga. Ia juga menemukan contoh test R5 yang mustahil secara faktual ("23.30 WIB saat UTC sudah hari berikutnya", padahal UTC selalu tertinggal dari WIB), pembatalan publik (FR-11) yang tidak mewajibkan pencocokan email sehingga endpoint bisa dipanggil hanya dengan ID, serta risiko cakupan yang tidak muat dalam satu minggu untuk tim 3 orang. Reviewer kesetiaan intent menyatakan R1–R7 dan semua non-goal terwakili dengan setia, tanpa temuan critical maupun high. Namun ia menandai tiga hal: promosi saat kuota naik dinaikkan menjadi MUST dan diberi label R3, siklus "Selesai" yang baru belum dikonfirmasi padahal status PRD sudah `final`, dan SM-3 yang dilemahkan menjadi ≥ 90%.

## Putusan per dimensi
- Kesiapan keputusan (Decision-readiness) — adequate
- Substansi, bukan teater (Substance over theater) — strong
- Koherensi strategis (Strategic coherence) — adequate
- Kejelasan kriteria selesai (Done-ness clarity) — adequate
- Kejujuran cakupan (Scope honesty) — adequate
- Kegunaan hilir (Downstream usability) — adequate
- Kecocokan bentuk (Shape fit) — strong

## Temuan menurut tingkat

Temuan dari ketiga reviewer digabung. Bila isu yang sama muncul di lebih dari satu reviewer, temuan itu ditulis sekali dengan tingkat tertinggi, dan sumbernya disebut. Singkatan sumber: **Rubrik** = `review-rubric.md`, **Adversarial** = `review-adversarial-general.md`, **Intent** = `review-intent-fidelity.md`.

### Critical (2)

**[Done-ness clarity · Rubrik (medium) + Adversarial C1 (critical)]** — Formulir presensi tidak bisa membedakan "tidak hadir" dari "belum dicatat" (§4.6 FR-15, FR-18; §4.7 FR-20; §4.8 FR-21)
FR-15 menyebut "pilihan hadir/tidak hadir" dan "centang", tetapi baris hasil promosi tampil "belum dicatat, tanpa centang bawaan". Checkbox hanya punya dua keadaan. Bila admin menekan "Simpan" tanpa menyentuh satu peserta, dua implementasi sama-sama sah: checkbox kosong disimpan sebagai "Tidak hadir" (bisa langsung memicu "Tidak mungkin layak"), atau tidak ada catatan dibuat (tetap "Belum layak"). Bila FR-18 (SHOULD) dipotong, formulir baru disimpan kosong dengan hasil yang sama ambigunya. Jawabannya juga mengubah grid FR-21 ("—" vs "Tidak hadir") dan penguncian tanggal FR-3.
Perbaikan: tetapkan kontrol tiga keadaan per peserta (Hadir / Tidak hadir / Belum dicatat), mis. radio group. "Simpan" hanya menulis baris bernilai Hadir atau Tidak hadir. Tentukan apakah catatan boleh dikembalikan ke "Belum dicatat". Tambahkan AC: "Menyimpan formulir tanpa menyentuh peserta X tidak membuat catatan untuk X."

**[Done-ness clarity · Rubrik (high) + Adversarial C2 (critical)]** — Kelas masih Dibuka sepanjang hari sesi terakhir, jadi CSV yang sudah diekspor bisa basi (§3 "Status kelas", §4.2 "Siklus kelas", §2.3 UJ-4, §8 SM-3, §1 Visi)
Dibuka = "tanggal sesi terakhir ≥ hari ini", sehingga pembekuan baru berlaku pukul 00.00 WIB keesokan harinya. Setelah Rina mengekspor CSV dan mengirimnya ke bagian sertifikat (UJ-4), peserta masih bisa membatalkan dan hilang dari CSV, promosi masih bisa terjadi (peserta naik dengan "—" di semua kolom dan otomatis "Belum layak"), dan pendaftar baru masih bisa masuk. Ini bertabrakan dengan Visi ("siap pada hari sesi terakhir") dan SM-3.
Perbaikan: putuskan secara eksplisit. Usulan: pendaftaran, pembatalan, dan promosi ditutup mulai tanggal sesi terakhir (≥, bukan >), sementara presensi dan koreksinya tetap terbuka. Alternatif: CSV final baru dikirim keesokan hari dan SM-3 disesuaikan. Tambahkan AC di FR-7, FR-11, FR-13 dan kasus test di addendum §3; bila perlu konfirmasi Rina, masukkan ke `[NOTE FOR PM]`.

### High (6)

**[Decision-readiness · Rubrik]** — Keterjangkauan aplikasi bagi peserta belum diputuskan (§5 NFR-6, §2.3 UJ-2, §5 NFR-8)
NFR-6 mengizinkan "laptop lokal atau satu server kecil" sebagai `[ASSUMPTION]`, padahal UJ-2 menggambarkan Dimas membuka tautan WhatsApp di ponsel. Laptop lokal tidak terjangkau dari luar jaringan kantor; server publik butuh alamat publik dan HTTPS, yang tidak disebut di NFR-8 padahal password admin dan email peserta lewat jaringan publik.
Perbaikan: nyatakan sebagai keputusan, mis. "server lembaga yang bisa diakses dari internet lewat HTTPS; laptop lokal hanya untuk pengembangan dan demo", lalu tambahkan HTTPS ke NFR-8. Bila jawabannya "hanya LAN kantor", tulis pendaftaran dari luar kantor sebagai non-goal dan sesuaikan UJ-2.

**[Adversarial H2 + Rubrik (low) + Adversarial M13 (sebagian)]** — AC konkurensi bisa lulus tanpa membuktikan apa pun (§4.3 FR-8, FR-9; §4.4 FR-13; §5 NFR-1; addendum §1, §3)
Level paralelisme tidak disebut. Dengan driver SQLite sinkron di satu proses Node, 20 panggilan "paralel" berjalan serial dan lulus tanpa transaksi. Dengan driver async dan satu koneksi bersama, `BEGIN IMMEDIATE` yang bertumpuk menghasilkan error atau `SQLITE_BUSY`, dan AC tidak menuntut ke-20 permintaan berhasil. "Lulus berulang kali tanpa flake" tidak menyebut jumlah ulangan.
Perbaikan: AC "20 request HTTP serentak ke API yang berjalan: semua sukses (bukan 5xx), tepat 5 Terdaftar, 15 Daftar tunggu posisi 1–15 tanpa celah/duplikat". Tambahkan mutation check (versi tanpa transaksi harus gagal), angka ulangan (mis. 50 kali di CI), dan perilaku `SQLITE_BUSY` sebagai kebutuhan yang detailnya diputuskan arsitektur.

**[Adversarial H1]** — Contoh test R5 "23.30 WIB saat UTC sudah hari berikutnya" mustahil secara faktual (§4.6 FR-16; addendum §3)
WIB adalah UTC+7, jadi UTC selalu tertinggal. Pukul 23.30 WIB = 16.30 UTC di hari yang sama. Test yang ditulis persis dari AC ini tidak bisa dibuat atau tidak menguji apa pun. Jendela berbahaya yang sebenarnya untuk server UTC adalah 00.00–06.59 WIB. Kasus "zona di depan WIB" hanya terjadi untuk WITA/WIT. (Reviewer kesetiaan intent menilai kasus tepi ini "Setia" dan tidak menangkap kekeliruannya.)
Perbaikan: ganti kasus menjadi (1) 00.30 WIB tanggal D, server UTC: sesi D diterima; (2) 23.30 WIB tanggal D, proses Asia/Jayapura: sesi D+1 ditolak; (3) 06.59 WIB sebagai batas atas. Wajibkan test berjalan dengan `TZ` berbeda-beda.

**[Adversarial H3]** — Pembatalan publik tidak mewajibkan email yang cocok (§4.4 FR-11; §4.5 FR-14 Catatan; §9)
Risiko yang diterima adalah "harus tahu email", tetapi PRD tidak menyatakan API pembatalan mewajibkan email. `POST /registrations/:id/cancel` tanpa parameter lain sah menurut teks. Dengan ID berurutan, satu loop bisa membatalkan seluruh peserta, dan promosi yang terpicu tidak bisa dibalik.
Perbaikan: AC FR-11 "API pembatalan peserta menerima ID pendaftaran dan email; ditolak bila email ternormalisasi tidak cocok. ID di URL publik tidak berurutan." Pertimbangkan pembatasan laju sederhana.

**[Adversarial H4]** — Cakupan tidak muat dalam 1 minggu untuk 3 orang (§7.1; §5 NFR-3, NFR-7, NFR-9; §9)
19 FR MUST dan 9 NFR, termasuk WCAG 2.1 AA di semua halaman, benchmark p95 dengan seed satu tahun, test konkurensi dan multi-TZ yang benar, CSV aman untuk Excel, autentikasi, seed, dan e2e Playwright, di repo kosong yang package manager dan akses SQLite-nya belum diputuskan. Katup pengamannya hanya tiga FR SHOULD kecil, untuk ±15 hari-orang. (Rubrik menilai kejujuran cakupan "adequate" dan tidak menandai ini.)
Perbaikan: buat daftar potong kedua yang eksplisit (bagian Dibatalkan FR-5, dialog peringatan FR-3, NFR-7 menjadi smoke test, NFR-3 dibatasi ke alur peserta + presensi dengan axe), dan tetapkan kriteria keputusan potong pada hari ke-3.

**[Adversarial H5]** — Tabel kelas dibatasi 50 baris tanpa paginasi, padahal kelas tidak bisa dihapus (§4.2 FR-4; FR-3; §5 NFR-7)
Dengan ±20 kelas per bulan, batas 50 terlampaui di bulan ketiga. Perilaku untuk kelas ke-51 tidak disebut; dua engineer akan membangun dua perilaku berbeda, dan kelas Selesai terlama bisa hilang dari UI.
Perbaikan: tetapkan bawaan (mis. kelas Dibuka + Selesai 30 hari terakhir, dengan tautan "Tampilkan semua kelas Selesai"), atau "tampilkan semua, ≤ 300 baris". Sesuaikan AC kinerja.

### Medium (21)

**[Decision-readiness · Rubrik + Adversarial L1 + Intent M2]** — `status: final` mendahului konfirmasi siklus kelas "Selesai" (frontmatter; §3 "Status kelas"; §4.2 "Siklus kelas" dan `[NOTE FOR PM]`; §10)
NOTE FOR PM meminta konfirmasi Rina sebelum `bmad-create-epics-and-stories` untuk lima keputusan siklus, tetapi frontmatter sudah `final` dan konfirmasi itu tidak punya pemilik, tenggat, atau tempat pencatatan. Intent tidak punya konsep status kelas; aturan "Kelas Selesai menolak pendaftaran baru, pembatalan, dan promosi" tidak melanggar R1–R7 tetapi mempersempit What #2 dan #3.
Perbaikan: ubah status menjadi `final-pending-confirmation` (atau setara), atau tambahkan baris di §10 "Konfirmasi siklus kelas dengan Rina — pemilik PM, sebelum pemecahan epik". Hapus tag `[ASSUMPTION]` terkait setelah dikonfirmasi.

**[Intent M1 + Adversarial L9 + Rubrik (catatan mekanis)]** — Promosi saat kuota naik dinaikkan dari COULD menjadi MUST dan dilabeli R3 (§4.2 FR-3; §11; addendum §1 baris R7, addendum §3)
Brief sengaja menaruh perilaku ini di COULD karena tidak tertulis di intent. PRD menjadikannya MUST dan memberi label R3 (addendum §1 menaruhnya di baris R7). Perilakunya masuk akal, tetapi test "R3: …" akan tampak menguji intent padahal menguji keputusan PRD.
Perbaikan: konfirmasi ke PM/Rina. Beri ID turunan, mis. "FR-3 (diturunkan dari R1+R3)", catat sebagai perluasan di §11, pilih satu label secara konsisten, dan ganti nama test, mis. `FR-3/R3-derived: …`.

**[Intent M3]** — Target SM-3 "daftar sertifikat siap di hari yang sama" diturunkan menjadi ≥ 90% (§8 SM-3)
Intent dan brief menulis "pada hari yang sama" tanpa persentase. PRD menambahkan ambang 90% dan membatasinya ke bulan pertama. Ukurannya (CSV diekspor pada tanggal sesi terakhir) juga hanya proksi.
Perbaikan: jadikan target 100%, atau tandai 90% sebagai `[ASSUMPTION]` yang perlu persetujuan PM. Bedakan "sistem siap" dari "admin menyerahkan".

**[Strategic coherence · Rubrik]** — SM-2 hampir pasti lulus dan tidak cocok dengan SM-C1 (§8 SM-2, SM-C1)
SM-2 mengukur waktu ekspor "untuk kelas 5 sesi dengan presensi lengkap", jadi yang diukur hanya beberapa klik. Baseline ±1 jam mencakup pekerjaan presensi yang tidak ada di definisi. SM-C1 mengimbangi "kecepatan presensi" yang tidak diukur SM-2.
Perbaikan: definisikan SM-2 sebagai total waktu admin untuk satu kelas 5 sesi (lima kali presensi FR-15 + ekspor), dengan target per sesi (mis. < 2 menit untuk 20 peserta) dan target ekspor.

**[Strategic coherence · Rubrik (low) + Adversarial M14]** — SM-1 "pernah melebihi kuota" tidak terukur dengan query keadaan saat ini; SM-C2 tanpa cara ukur (§8 SM-1, SM-C2; §7.3)
Query bulanan atas keadaan akhir tidak melihat kelebihan kuota sementara, dan tanpa riwayat kata "pernah" tidak terukur. SM-C2 tidak punya cara ukur maupun ambang.
Perbaikan: SM-1 menjadi "jumlah kelas dengan Terdaftar > kuota saat query, ditambah test paralel hijau di setiap build", atau tambahkan constraint/trigger yang membuat kelebihan kuota mustahil. SM-C2: "Rina meninjau setiap kenaikan kuota saat tinjauan bulanan".

**[Done-ness clarity · Rubrik + Adversarial M11]** — Delimiter CSV tidak ditentukan, padahal Excel berlokal Indonesia memakai titik koma (§4.8 FR-22; §8 SM-2)
Excel Windows id-ID membaca CSV berpemisah koma sebagai satu kolom; `sep=,` bentrok dengan BOM di beberapa versi. Versi Excel dan locale target tidak disebut, sehingga AC "terbuka benar di Excel" tidak bisa diverifikasi. Format tanggal NFR-5 ("Senin, 9 Nov 2026") juga mengandung koma bila dipakai di header.
Perbaikan: tentukan Excel dan locale target, pilih pemisah (`;` untuk id-ID), tetapkan format header tanggal (ISO `YYYY-MM-DD`), dan tambahkan uji manual dengan berkas contoh di laptop Rina. Bila belum diketahui, jadikan pertanyaan terbuka dengan pemilik.

**[Done-ness clarity · Rubrik + Adversarial M6]** — Tanggal sesi yang salah tetapi sudah berisi presensi tidak punya jalan pemulihan (§4.2 FR-3; §3 "Presensi"; §4.6 FR-15)
Tanggal yang punya presensi terkunci, kelas tidak bisa dihapus, dan presensi tidak bisa dihapus. Bila Rina salah memasukkan 9 Nov (seharusnya 10 Nov) dan sempat menyimpan presensi, tanggal itu terkunci selamanya dan total sesi R6 salah untuk semua peserta.
Perbaikan: izinkan "Kosongkan presensi sesi ini" dengan konfirmasi dua langkah agar tanggal terbuka lagi, atau izinkan memindahkan tanggal beserta presensinya (tujuan ≤ hari ini). Bila sengaja tidak dibangun, tulis `[NON-GOAL for MVP]` beserta jalan keluar manualnya.

**[Scope honesty · Rubrik + Adversarial L3]** — Koreksi nama atau email peserta tidak dibahas (§3 "Peserta"; §4.3 FR-7, FR-9; §4.8 FR-22)
Nama yang diketik peserta langsung masuk CSV sertifikat tanpa FR koreksi. Salah ketik email membuat peserta tidak menemukan pendaftarannya; daftar ulang dengan email benar menaruhnya di ekor antrean. Perilaku email sama dengan nama berbeda juga tidak ditentukan.
Perbaikan: (a) FR SHOULD/COULD baru: admin bisa mengubah nama (dan email, dengan cek R2) pendaftaran aktif; atau (b) `[NON-GOAL for MVP]` dengan jalan keluar manual. Nyatakan juga "nama pada pendaftaran aktif tidak diubah oleh pendaftaran ulang".

**[Downstream usability · Rubrik]** — UJ-3 melanggar R3 bila dibaca bersama UJ-2 (§2.3 UJ-2, UJ-3; §4.3 FR-10; §4.4 FR-13)
Dimas berada di "Daftar tunggu #2", lalu satu pembatalan oleh Sari membuatnya Terdaftar. Menurut FR-13, satu pembatalan hanya mempromosikan posisi 1. Skenario e2e yang menggabungkan keduanya akan bertentangan dengan R3.
Perbaikan: ubah UJ-2 menjadi "Daftar tunggu #1", atau tambahkan di UJ-3 bahwa peserta #1 sudah batal lebih dulu.

**[Adversarial M2 + Intent L1]** — Invarian "kursi kosong ⇒ daftar tunggu kosong" tersirat, tidak dinyatakan, dan tidak diuji (§4.3 FR-8; §4.2 FR-3)
FR-8 menambah syarat "daftar tunggu kosong" untuk Terdaftar. Bila keadaan "Terdaftar < kuota dan antrean tidak kosong" pernah terjadi (bug, data manual, jalur terlewat, atau promosi saat kuota naik dipotong), kursi itu kosong selamanya.
Perbaikan: nyatakan invarian I1 ("bila Terdaftar < kuota maka daftar tunggu kosong, kecuali kelas Selesai"), kaitkan FR-8 dengan FR-3, dan tambahkan test properti setelah setiap operasi tulis. Alternatif: pendaftaran baru selalu masuk ekor lalu jalankan promosi.

**[Adversarial M1]** — Jumlah promosi FR-13 tidak menyebut dihitung sebelum atau sesudah pembatalan (§4.4 FR-13; addendum §1 R4)
Bila Terdaftar dihitung sebelum status menjadi Dibatalkan, hasilnya 0 dan tidak ada yang naik. Bullet "posisi antrean 1" dan rumus min(...) juga tampak mengatakan dua hal berbeda.
Perbaikan: "dihitung setelah status menjadi Dibatalkan, di transaksi yang sama". AC: "kuota 5, Terdaftar 5, antrean 3; satu batal → Terdaftar 5, antrean 2."

**[Adversarial M3]** — Kelas Selesai "hanya bisa diubah judulnya" bertabrakan dengan "semua validasi FR-2 berlaku" (§4.2 FR-3 vs FR-2)
Kelas Selesai pasti tidak punya tanggal ≥ hari ini, sehingga mengubah judul gagal validasi bila FR-2 diterapkan utuh.
Perbaikan: "Validasi tanggal FR-2 hanya berlaku bila daftar tanggal berubah. Pada kelas Selesai, hanya validasi judul yang berlaku."

**[Adversarial M4]** — Admin tidak bisa menutup atau menyembunyikan kelas yang salah dibuat atau batal diselenggarakan (§4.2 FR-3)
Kelas ganda, typo tanggal, atau yang dibatalkan lembaga tetap Dibuka dan tautannya tetap menerima pendaftaran. Rina tidak punya jalan keluar.
Perbaikan: tambahkan aksi "Tutup pendaftaran", atau izinkan menghapus kelas yang belum punya pendaftaran.

**[Adversarial M5]** — Tanggal sesi terkunci oleh presensi tak terlihat milik pendaftaran yang dibatalkan (§3 Presensi; §4.2 FR-3; §4.6 FR-15)
Sesi yang presensinya hanya milik peserta yang kemudian batal tampak kosong, tetapi tanggalnya terkunci, dan pesan penolakan merujuk data yang tidak bisa dilihat admin.
Perbaikan: kunci tanggal hanya bila ada catatan presensi milik pendaftaran yang saat ini Terdaftar, atau tampilkan jumlah catatan tersembunyi di pesan.

**[Adversarial M7]** — Simpan presensi yang bersamaan dengan pembatalan atau penyimpanan admin lain tidak didefinisikan (§4.6 FR-15; §5 NFR-1)
Tiga kasus terbuka: peserta batal saat formulir terbuka, dua admin menyimpan sesi yang sama, dan tanggal sesi dihapus saat formulir terbuka.
Perbaikan: simpan hanya untuk pendaftaran yang Terdaftar saat disimpan (entri lain diabaikan dan disebut di pesan); last-write-wins per peserta; simpan ke sesi yang sudah dihapus ditolak.

**[Adversarial M8]** — Halaman status menyembunyikan pendaftaran Dibatalkan, padahal pembatalan oleh orang lain adalah risiko yang diakui (§4.5 FR-14; §9)
Peserta yang dibatalkan admin atau orang iseng hanya melihat "Tidak ada pendaftaran aktif", lalu bertanya lewat WhatsApp, melawan SM-4.
Perbaikan: tampilkan pendaftaran Dibatalkan 30 hari terakhir beserta waktu batal dan pembatalnya.

**[Adversarial M9]** — "±5 admin" bertabrakan dengan seed satu akun admin tanpa UI pembuatan akun (§2.1; §4.1 FR-1; addendum §4)
Kelima admin akan berbagi satu kredensial, dan "pembatal = admin" tidak menyebut admin yang mana.
Perbaikan: nyatakan "akun bersama (diterima)" atau "seed membaca daftar N admin dari `.env`/berkas lokal"; bila per orang, catat ID admin pada pembatalan.

**[Adversarial M10]** — Pendaftaran tetap terbuka setelah sesi berjalan, sehingga pendaftar terlambat dijamin tidak layak (§4.2 Siklus kelas; §4.3 FR-7; `[NOTE FOR PM]`)
Di kelas 4 sesi, siapa pun yang Terdaftar setelah sesi 1 tidak mungkin layak, dan sistem tidak memberi tahu. NOTE FOR PM hanya menanyakan batas waktu pembatalan.
Perbaikan: tambahkan pertanyaan batas waktu pendaftaran ke NOTE FOR PM; minimal tampilkan peringatan bila sudah ada sesi yang lewat.

**[Adversarial M12]** — Test R5 dan seed bergantung pada tanggal nyata tanpa jam yang bisa disuntik (§5 NFR-9; addendum §4)
Seed kemarin membuat test e2e "sesi hari ini" gagal hari ini; kasus 00.30/23.30 WIB tidak bisa diuji tanpa mengendalikan jam.
Perbaikan: NFR baru "waktu sekarang berasal dari satu sumber yang bisa diganti di test; e2e menjalankan seed ulang dengan tanggal relatif sebelum setiap run".

**[Adversarial M13]** — NFR-3 (WCAG 2.1 AA di semua halaman) tidak punya metode verifikasi (§5 NFR-3)
Audit manual untuk semua halaman tidak dianggarkan, dan tidak disebut kapan NFR ini lulus. (Bagian NFR-1 dari temuan ini digabung ke temuan High konkurensi.)
Perbaikan: "Lulus bila axe-core via Playwright melaporkan 0 pelanggaran serious/critical di halaman X, Y, Z, ditambah satu pemeriksaan keyboard manual pada alur daftar, batal, dan presensi."

**[Adversarial M15]** — Grid rekap tanpa gulir horizontal (NFR-4) tidak dibatasi jumlah sesinya (§5 NFR-4; §4.8 FR-21; FR-2)
Nama, email, N kolom tanggal, x/y, dan kelayakan pada 1366 px hanya muat untuk sedikit sesi, dan FR-2 tidak membatasi jumlah tanggal.
Perbaikan: batasi jumlah sesi per kelas (mis. 1–10) di FR-2, atau nyatakan grid rekap boleh bergulir horizontal dengan kolom nama tetap terlihat.

### Low (14)

**[Done-ness clarity · Rubrik + Adversarial L8 + Intent L6]** — FR-14 tidak memuat semua status yang dijanjikan FR lain (§4.5 FR-14; §4.3 FR-10; §4.4 FR-11)
Daftar status FR-14 tidak memuat "Kelas selesai — tidak naik dari daftar tunggu" (FR-10), dan tidak menyebut apa yang tampil tepat setelah peserta membatalkan.
Perbaikan: lengkapi daftar status di FR-14 dan tambahkan konfirmasi "Pendaftaran di {judul} dibatalkan".

**[Done-ness clarity · Rubrik + Adversarial L5]** — Detail grid dan CSV: urutan baris dan netralisasi formula tidak lengkap (§4.8 FR-21, FR-22)
Urutan baris tidak ditentukan. Netralisasi formula hanya menyebut `= + - @`, tidak mencakup tab (`\t`) dan CR (`\r`); efek samping `'` yang tampil literal (mis. nama "-Andi") tidak disebut.
Perbaikan: tetapkan urutan (mis. nama A–Z), lengkapi daftar karakter awalan, dan nyatakan `'` yang tampil sebagai perilaku yang diterima.

**[Scope honesty · Rubrik]** — Kehilangan berkas SQLite tidak ada di daftar risiko (§9, §10 butir 2)
Pencadangan sudah menjadi pertanyaan terbuka, tetapi dampaknya (seluruh riwayat hilang, spreadsheet lama sudah ditinggalkan) tidak tercatat sebagai risiko.
Perbaikan: tambahkan satu butir di §9 yang merujuk ke pertanyaan terbuka 2.

**[Downstream usability · Rubrik]** — UJ-4 menyebut "sesi minggu depan" padahal yang dicatat adalah sesi terakhir (§2.3 UJ-4)
Di kelas yang sama tidak ada sesi minggu depan.
Perbaikan: pindahkan kasus tepi R5 ke sesi yang lebih awal, mis. "di sesi ke-2, sesi ke-3 minggu depan tampil tetapi belum bisa diisi".

**[Downstream usability · Rubrik]** — Epik 1 bergantung pada kemampuan dari epik berikutnya (§7.1)
FR-3 memakai fungsi promosi R4 dan FR-5 memuat "Bagian Dibatalkan", keduanya bergantung pada mekanisme pembatalan di epik berikutnya.
Perbaikan: tambahkan catatan urutan di §7.1: fungsi promosi dibangun di Epik 1, bagian Dibatalkan terisi setelah FR-11/FR-12.

**[Intent L7]** — Bawaan "semua hadir" (FR-18) berisiko membuat R6 bernilai "Layak" palsu (§4.6 FR-18)
Rumus R6 benar, tetapi data masukannya bisa salah. Sudah diakui lewat SM-C1.
Perbaikan: potong FR-18 lebih dulu bila SM-C1 tidak bisa diukur.

**[Intent L3]** — NFR-1 tidak mencantumkan R7 dan promosi saat kuota naik (§5 NFR-1)
FR-3 dan addendum §1 menuntut cek R7 dan promosi dalam transaksi yang sama, tetapi NFR-1 dan bukti test paralelnya tidak menyebut FR-3.
Perbaikan: tambahkan R7/FR-3 ke NFR-1, serta test paralel "ubah kuota bersamaan dengan pendaftaran".

**[Intent L2]** — Pembatalan oleh admin (FR-12) memperluas What #3 (§4.4 FR-12)
Intent hanya menyebut pembatalan oleh peserta. Perluasan sudah ditandai asumsi dan konsisten dengan R4.
Perbaikan: cukup dikonfirmasi.

**[Intent L4]** — §6 menambah non-goal yang tidak ada di intent (§6)
"Katalog kelas publik" dan "Penjadwalan jam sesi, ruangan, atau instruktur" mempersempit cakupan tanpa bertentangan.
Perbaikan: tandai sebagai keputusan PRD agar daftar non-goal intent tetap bisa dibedakan.

**[Intent L5]** — Batasan baru saat mengubah kelas mempersempit What #1 (§4.2 FR-2, FR-3)
Minimal satu tanggal ≥ hari ini, tanggal berpresensi terkunci, kelas Selesai hanya judul, kelas tidak bisa dihapus. Wajar dan sudah ditandai `[ASSUMPTION]`.
Perbaikan: konfirmasi bersama keputusan siklus kelas.

**[Adversarial L2]** — Zona tampilan timestamp tidak ditetapkan (§5 NFR-2; FR-5)
NFR-2 hanya mencakup "hari ini" dan tanggal sesi, bukan waktu daftar, batal, dan promosi.
Perbaikan: "Semua waktu ditampilkan dalam WIB dengan format Indonesia; disimpan dalam UTC/ISO."

**[Adversarial L4]** — "Belum layak" pada kelas Selesai menyesatkan bagian sertifikat (§4.7 FR-19; §4.8 FR-22)
Perbaikan: pada kelas Selesai, tampilkan "Tidak layak" karena statusnya sudah final.

**[Adversarial L6]** — Batas nilai tidak ditetapkan (FR-2, FR-7)
Kuota maksimum, rentang tahun tanggal sesi, trim nama, dan definisi "berformat email" tidak disebut.
Perbaikan: kuota 1–1000, tanggal ±1 tahun dari hari ini, nama di-trim, dan satu aturan format email.

**[Adversarial L7]** — Implementasi bocor ke PRD, bertentangan dengan janji §0 (§0; FR-1; FR-8; NFR-1)
"HTTP 401" dan "1-based" tidak relevan bagi pembaca produk; bagian yang diwajibkan `AGENTS.md` bisa diterima.
Perbaikan: pindahkan ke addendum, atau ubah §0 menjadi "sebagian besar detail teknis".

## Catatan mekanis
- **Kontinuitas ID:** FR-1…FR-22, UJ-1…UJ-4, SM-1…SM-4, SM-C1/SM-C2, NFR-1…NFR-9 kontigu dan unik; klaim §0 akurat; semua rujukan silang terselesaikan.
- **Roundtrip indeks asumsi:** 10 tag inline ↔ 10 entri §11, semuanya cocok (FR-2, FR-3 ×4, FR-7, FR-11, FR-12, FR-15, NFR-6).
- **Label aturan promosi saat kuota naik:** FR-3 dan addendum §3 memakai R3, tabel addendum §1 menaruhnya di baris R7. Pilih satu (lihat temuan Medium terkait).
- **Drift glosarium:** "belum dicatat" (FR-15), "—" (FR-21), dan "sesi tanpa catatan presensi" (FR-20) adalah satu konsep; "Daftar tunggu" dipakai untuk status dan antrean; "halaman kelas" vs "halaman kelas admin", serta "tabel kelas", "halaman pendaftaran", dan "pembatal" belum ada di glosarium.
- **Kesetiaan pada intent:** R1–R7 terwakili dengan makna yang sama; R4 diperluas ke pembatalan admin (FR-12) dan kenaikan kuota (FR-3), keduanya ditandai; R6 bilangan bulat cocok dengan contoh intent; semua non-goal dipertahankan.
- **Sumber:** riset kompetitif tercatat "prompt saja, belum ada hasil", konsisten dengan pertanyaan terbuka 1.
- **Bagian wajib:** semua ada untuk taruhan ini.
- **Dibanding tinjauan sebelumnya:** temuan critical (kenaikan kuota memotong antrean) dan temuan high (pembekuan kelas Selesai, kepemilikan presensi, perubahan tanggal sesi) sudah diselesaikan; sisa celah siklus kelas hanya pada batas hari sesi terakhir.

## Berkas reviewer
- `review-rubric.md`
- `review-adversarial-general.md`
- `review-intent-fidelity.md`
