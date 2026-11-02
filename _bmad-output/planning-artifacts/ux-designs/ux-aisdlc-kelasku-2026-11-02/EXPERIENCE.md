---
name: Kelasku
status: final
updated: 2026-11-02
sources:
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md
  - docs/intent-kelasku.md
design: DESIGN.md
---

# Kelasku — Experience Spine

## Foundation

Kelasku adalah web responsif dengan dua permukaan dalam satu aplikasi React + Vite:

- **Panel admin**: untuk laptop dengan layar ≥ 1366×768, bergaya panel admin yang padat. Semua halamannya memerlukan sesi masuk.
- **Halaman peserta** (pendaftaran dan status): mobile-first mulai lebar 360 px, publik, tanpa akun.

Kelasku bukan aplikasi native. `DESIGN.md` adalah acuan identitas visual; dokumen ini mengatur perilaku. Istilah domain (Terdaftar, Daftar tunggu, Promosi, Sesi, Sesi masuk, Hari ini, dan seterusnya) dipakai persis seperti di Glosarium PRD §3. Belum ada UI library yang dipilih (lihat `bmad-architecture`); pola di bawah ini berlaku apa pun library-nya. [ASSUMPTION]

Tidak ada mockup atau wireframe pada putaran ini (Fast path). Semua permukaan dibangun dari tabel di spine ini. Bila nanti ada mockup dan isinya bertentangan dengan spine, spine yang berlaku.

## Information Architecture

| Permukaan | Rute [ASSUMPTION] | Dicapai dari | Tujuan | FR |
|---|---|---|---|---|
| Masuk | `/admin/masuk` | Membuka rute admin mana pun tanpa sesi masuk | Admin masuk dengan email + password | FR-1 |
| Sesi hari ini | `/admin` (beranda) | Setelah masuk; top bar | Daftar sesi bertanggal hari ini di semua kelas, urut judul kelas, satu klik ke presensi | FR-17 (SHOULD) |
| Kelas | `/admin/kelas` | Top bar | Tabel semua kelas: judul, sesi berikutnya, terisi/kuota, daftar tunggu | FR-4 |
| Buat kelas | `/admin/kelas/baru` | Tombol "Buat kelas" di Kelas | Formulir judul, tanggal sesi, kuota | FR-2 |
| Ubah kelas | `/admin/kelas/{id}/ubah` | Tombol "Ubah kelas" di halaman kelas admin | Formulir yang sama, dengan kunci R7 dan aturan tanggal sesi | FR-3 |
| Halaman kelas admin | `/admin/kelas/{id}` | Baris di Kelas | Kepala kelas + tautan pendaftaran + daftar sesi + bagian Terdaftar / Daftar tunggu / Dibatalkan | FR-5, FR-6, FR-12 |
| Presensi sesi | `/admin/kelas/{id}/sesi/{tanggal}` | Daftar sesi di halaman kelas admin; Sesi hari ini | Formulir hadir/tidak hadir untuk semua peserta Terdaftar, satu "Simpan" | FR-15, FR-16, FR-18 |
| Grid rekap | `/admin/kelas/{id}/rekap` | Tombol "Lihat rekap" di halaman kelas admin | Tabel peserta × sesi + jumlah hadir + kelayakan; tombol "Ekspor CSV" | FR-19–FR-22 |
| Halaman pendaftaran | `/daftar/{kode}` | Tautan pendaftaran yang dibagikan admin | Info kelas + formulir nama/email + hasil di halaman yang sama | FR-7–FR-10 |
| Halaman status peserta | `/status` | Tautan dari hasil pendaftaran; dibuka langsung | Masukkan email → kartu per pendaftaran aktif + pembatalan | FR-11, FR-14 |

**Navigasi admin.** Top bar dengan dua tujuan: "Sesi hari ini" dan "Kelas", ditambah tombol "Keluar". Halaman di bawah satu kelas menampilkan breadcrumb "Kelas › {judul kelas} › {halaman}". Tidak ada sidebar karena hanya ada dua tujuan utama. [ASSUMPTION]

**Bila FR-17 dipotong**, beranda `/admin` mengalihkan ke Kelas dan tautan "Sesi hari ini" dihapus dari top bar.

**Halaman peserta** tidak punya navigasi global. Hanya ada nama "Kelasku" di kepala halaman dan tautan "Cek status pendaftaran" di kaki halaman pendaftaran.

**Email tidak masuk ke URL.** Halaman status menerima email lewat formulir (POST), bukan query string, supaya email tidak tersimpan di riwayat browser atau ikut terbagi lewat tautan. Tautan dari hasil pendaftaran membawa email lewat state navigasi sehingga formulir status langsung terisi. [ASSUMPTION]

**Tautan pendaftaran** memakai kode acak yang stabil (`/daftar/{kode}`), bukan ID berurutan dan bukan slug judul, sehingga tidak berubah saat judul diubah (FR-6). [ASSUMPTION]

**Epik 1** (FR-1–FR-10) menghadirkan: Masuk, Kelas, Buat kelas, Ubah kelas, Halaman kelas admin (tanpa aksi pembatalan dan tanpa entri presensi/rekap), dan Halaman pendaftaran. Hasil pendaftaran menautkan ke Halaman status peserta, yang baru dibangun di epik berikutnya. Selama halaman itu belum ada, tautannya disembunyikan. [ASSUMPTION]

## Voice and Tone

Microcopy. Postur merek ada di `DESIGN.md` › Brand & Style.

- Sapa pengguna dengan "Anda". Kalimat pendek dan langsung. Tanpa emoji dan tanpa tanda seru.
- Pakai istilah Glosarium PRD persis sama di layar, badge, header tabel, dan CSV.
- Pesan error menyebut apa yang salah dan apa yang bisa dilakukan, dengan angka sebenarnya.
- Format tanggal: "Senin, 9 Nov 2026". Format waktu: "9 Nov 2026, 14.32 WIB". Semua dalam WIB (NFR-2, NFR-5).

| Lakukan | Jangan |
|---|---|
| "Daftar tunggu #2" + "Anda akan otomatis menjadi Terdaftar bila ada peserta yang batal." | "Maaf, kelas penuh!" / "Gagal mendaftar" |
| "Kuota minimal 14 (jumlah terdaftar saat ini)" | "Kuota tidak valid" |
| "Tanggal 9 Nov 2026 sudah ada di kelas ini" | "Terdapat tanggal duplikat" |
| "Bisa diisi mulai Senin, 16 Nov 2026" | "Sesi terkunci" |
| "Email atau password salah" | "Password salah" (jangan menyebut bagian yang salah) |
| "Tidak ada pendaftaran aktif untuk email ini" | "Email tidak ditemukan" |
| "Presensi tersimpan" | "Data berhasil disimpan ke database!" |
| "Batalkan pendaftaran di kelas Excel untuk Laporan Keuangan? Tindakan ini tidak bisa dibatalkan." | "Apakah Anda yakin?" |

Admin dan peserta disapa dengan nada yang sama. Kepada peserta, jelaskan apa yang akan terjadi berikutnya, karena tidak ada notifikasi.

## Component Patterns

Perilaku. Spesifikasi visual ada di `DESIGN.md` › Components.

| Komponen | Dipakai di | Aturan perilaku |
|---|---|---|
| **Tabel data** | Kelas, Halaman kelas admin, Grid rekap, Sesi hari ini | Seluruh baris bisa diklik dan berisi tautan nyata di sel judul, agar bisa dibuka dengan keyboard dan klik tengah. Tanpa paginasi sampai 50 baris (FR-4). Header memakai `<th scope>`. Urutan bawaan sesuai FR-4; tidak ada pengurutan per kolom di MVP. |
| **Badge status** | Di mana pun status kelas, pendaftaran, atau kelayakan tampil | Teksnya selalu istilah Glosarium. Badge tidak interaktif. Ikon bersifat dekoratif (`aria-hidden`) karena teks sudah membawa makna. |
| **Penanda promosi** | Bagian Terdaftar di halaman kelas admin | Tampil hanya pada pendaftaran hasil promosi: "Naik dari daftar tunggu · {waktu promosi}". |
| **Panel hasil** | Halaman pendaftaran | Menggantikan formulir setelah submit, di posisi yang sama. Fokus berpindah ke judul panel, dan isinya diumumkan lewat `role="status"`. Isi: status, satu kalimat apa yang terjadi berikutnya, tautan "Lihat halaman status". Untuk R2 (sudah punya pendaftaran aktif): panel yang sama dengan judul "Anda sudah terdaftar di kelas ini" atau "Anda sudah di daftar tunggu #N". |
| **Formulir** | Masuk, Buat/Ubah kelas, Halaman pendaftaran, Halaman status peserta | Validasi dijalankan saat submit, bukan saat mengetik. Error server ditampilkan di dekat kolom yang bersangkutan, lalu ringkasan error di atas formulir menautkan ke setiap kolom, dan fokus pindah ke ringkasan. Tombol submit dinonaktifkan dan berlabel "…ing" selama permintaan berjalan, sehingga klik ganda tidak mengirim dua kali. Server tetap menjaga R2 untuk kasus klik ganda yang lolos. Nilai yang sudah diisi tidak hilang saat error. |
| **Pengisi tanggal sesi** | Buat/Ubah kelas | Daftar baris input `type="date"` dengan tombol "Tambah tanggal" dan "Hapus" per baris. Daftar diurutkan otomatis saat disimpan. Tanggal yang sudah punya presensi tampil terkunci (tanpa tombol Hapus), dengan teks "Sudah ada presensi — tidak bisa diubah". Untuk kelas Selesai, tanggal sesi dan kuota tampil hanya-baca dengan teks "Kelas sudah selesai; hanya judul yang bisa diubah". |
| **Tombol salin tautan** | Halaman kelas admin; konfirmasi setelah Buat kelas | Menyalin URL lengkap ke clipboard. Labelnya berubah menjadi "Tautan disalin" selama 3 detik, dan diumumkan lewat `aria-live="polite"`. URL juga tampil sebagai teks yang bisa dipilih, sebagai cadangan bila clipboard ditolak browser. |
| **Dialog konfirmasi** | Pembatalan (peserta dan admin); peringatan perubahan tanggal sesi | Langkah kedua dari aksi dua langkah. Fokus awal ada di tombol aman ("Kembali"), bukan tombol bahaya. `Esc` dan klik latar menutup dialog tanpa aksi. Fokus kembali ke tombol pemicu setelah ditutup. Dialog tidak pernah bertumpuk. |
| **Toast** | Admin: setelah simpan presensi, salin tautan, simpan kelas | Hanya untuk konfirmasi sukses. Diumumkan lewat `aria-live="polite"`, hilang setelah 5 detik, dan tidak mencuri fokus. Error tidak pernah memakai toast; error tampil sebaris dan menetap. |
| **Toggle presensi** | Presensi sesi | Satu baris per peserta Terdaftar: nama, email, checkbox "Hadir". `Tab` berpindah antarbaris, `Spasi` mengubah centang. Peserta yang belum punya catatan presensi untuk sesi tersimpan menampilkan teks "Belum dicatat" di samping checkbox kosong (FR-15). Bila FR-18 aktif, formulir yang belum pernah disimpan dibuka dengan semua tercentang, dan teks di atas formulir berbunyi "Semua peserta ditandai hadir. Hapus centang peserta yang tidak hadir." Ada penghitung langsung "Hadir: 17 dari 20". |
| **Daftar sesi** | Halaman kelas admin | Satu baris per tanggal sesi: tanggal, status presensi ("Tersimpan", "Belum diisi", atau "Bisa diisi mulai {tanggal}"), dan aksi. Sesi yang sudah tiba punya tautan "Isi presensi" atau "Ubah presensi". Sesi mendatang tidak punya tautan; yang tampil hanya teksnya (R5, FR-16). Sesi hari ini ditandai "Hari ini". |
| **Bagian Dibatalkan** | Halaman kelas admin | Menggunakan `<details>`, tertutup secara bawaan, dengan ringkasan "Dibatalkan (N)". |
| **Kartu peserta** | Halaman status peserta | Satu kartu per pendaftaran aktif, urut menurut tanggal sesi pertama. Tombol "Batalkan pendaftaran" hanya ada bila kelas Dibuka. Kelas Selesai menampilkan teks "Kelas sudah selesai" sebagai pengganti tombol. Pendaftaran Daftar tunggu di kelas Selesai menampilkan "Kelas selesai — tidak naik dari daftar tunggu" (FR-10). |

## State Patterns

| Keadaan | Permukaan | Perlakuan |
|---|---|---|
| Memuat | Semua | Teks "Memuat…" di area konten setelah 300 ms (tanpa skeleton; data lokal biasanya cepat). Top bar tetap tampil. |
| Gagal memuat / server tak terjangkau | Semua | Alert danger sebaris: "Tidak dapat memuat data. Periksa koneksi lalu coba lagi." dengan tombol "Coba lagi". Formulir yang sedang diisi tidak dikosongkan. |
| Belum masuk | Semua rute `/admin/*` | Alihkan ke Masuk, lalu kembali ke rute asal setelah berhasil masuk. |
| Sesi masuk habis saat submit | Formulir admin | API mengembalikan 401 → alihkan ke Masuk dengan alert info "Sesi masuk Anda berakhir. Silakan masuk lagi." Isi formulir yang belum tersimpan hilang (diterima untuk MVP). [ASSUMPTION] |
| Kosong — belum ada kelas | Kelas | "Belum ada kelas." + tombol utama "Buat kelas". |
| Kosong — tidak ada sesi hari ini | Sesi hari ini | "Tidak ada sesi hari ini" + tautan "Lihat semua kelas" (FR-17). |
| Kosong — belum ada pendaftaran | Halaman kelas admin | Bagian Terdaftar: "Belum ada peserta terdaftar. Bagikan tautan pendaftaran untuk mulai menerima peserta." Bagian Daftar tunggu kosong tampil "Tidak ada daftar tunggu" (bagian tetap tampil supaya struktur halaman konsisten). |
| Kelas Penuh | Kelas; Halaman kelas admin | Badge "Penuh" (ikon + teks) di sel terisi/kuota (FR-4). |
| Kelas Penuh | Halaman pendaftaran | Alert warning di atas formulir: "Kelas penuh — Anda akan masuk daftar tunggu". Formulir tetap ada dan label tombol tetap "Daftar" (FR-7). |
| Kelas Selesai | Halaman pendaftaran | Info kelas + alert info "Pendaftaran kelas ini sudah ditutup". Tanpa formulir (FR-7). |
| Kelas Selesai | Kelas | Baris berada di bawah, kolom sesi berikutnya berisi badge "Selesai" (FR-4). |
| Tautan pendaftaran tidak dikenal | Halaman pendaftaran | "Kelas tidak ditemukan. Periksa kembali tautan dari penyelenggara." |
| Hasil Terdaftar | Halaman pendaftaran | Panel hasil success: "Terdaftar" + "Sesi berikutnya: {tanggal sesi terdekat ≥ hari ini}." |
| Hasil Daftar tunggu | Halaman pendaftaran | Panel hasil warning: "Daftar tunggu #N" + "Anda akan otomatis menjadi Terdaftar bila ada peserta yang batal. Tidak ada pemberitahuan; cek halaman status untuk melihat perubahan." Bukan error (UJ-2). |
| Sudah punya pendaftaran aktif (R2) | Halaman pendaftaran | Panel hasil dengan status yang ada: "Anda sudah terdaftar di kelas ini" atau "Anda sudah di daftar tunggu #N" (FR-9). |
| Tidak ada pendaftaran aktif | Halaman status peserta | "Tidak ada pendaftaran aktif untuk email ini." Ini teks biasa, bukan error (FR-14). |
| Pembatalan berhasil | Halaman status peserta | Kartu yang dibatalkan hilang dari daftar. Alert success di atas daftar: "Pendaftaran di {judul kelas} dibatalkan." Fokus pindah ke alert. |
| Pembatalan ditolak (kelas Selesai) | Status peserta; Halaman kelas admin | Alert danger: "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan" (FR-11). |
| Sesi mendatang | Daftar sesi; rute Presensi sesi | Di daftar sesi tidak ada tautan; tampil "Bisa diisi mulai {tanggal}". Bila rute presensi dibuka langsung, tampil teks yang sama tanpa formulir (R5, FR-16). |
| Presensi tersimpan | Presensi sesi | Toast "Presensi tersimpan", lalu kembali ke halaman kelas admin; status sesi di daftar sesi menjadi "Tersimpan". [ASSUMPTION] |
| Belum ada peserta Terdaftar | Presensi sesi; Grid rekap | "Belum ada peserta terdaftar di kelas ini." Tombol Simpan / Ekspor CSV disembunyikan. |
| Validasi R7 | Ubah kelas | Error di kolom kuota: "Kuota minimal N (jumlah terdaftar saat ini)", dengan N dari server saat simpan (FR-3). |
| Konfirmasi perubahan tanggal | Ubah kelas (bila presensi sudah ada) | Dialog konfirmasi: "Mengubah tanggal sesi akan mengubah total sesi dan kelayakan sertifikat semua peserta. Lanjutkan?" Tombol: "Kembali" / "Simpan perubahan" (FR-3). |
| Kuota dinaikkan + ada daftar tunggu | Ubah kelas → Halaman kelas admin | Setelah simpan: toast "Kelas tersimpan. N peserta naik dari daftar tunggu." Peserta tersebut tampil dengan penanda promosi (FR-3). |
| Masuk gagal | Masuk | Alert danger di atas formulir: "Email atau password salah". Password dikosongkan, email tetap terisi (FR-1). |

## Interaction Primitives

- **Klik/tap dan keyboard setara.** Semua aksi bisa dilakukan dengan `Tab`, `Enter`, `Spasi`, dan `Esc`. Tidak ada pintasan keyboard khusus di MVP; pintasan presensi berstatus COULD di PRD §7.3.
- **Aksi dua langkah** hanya untuk tindakan yang tidak bisa dibatalkan, yaitu pembatalan pendaftaran. Peringatan perubahan tanggal sesi juga dikonfirmasi. Simpan kelas dan simpan presensi tidak dikonfirmasi karena keduanya bisa dikoreksi.
- **Satu kali simpan per formulir.** Tidak ada autosave dan tidak ada simpan per baris di presensi (UJ-4: "dengan satu kali simpan").
- **Peringatan perubahan belum tersimpan.** Meninggalkan Presensi sesi atau Ubah kelas dengan perubahan yang belum disimpan memicu dialog bawaan browser (`beforeunload`). [ASSUMPTION]
- **Tanpa pembaruan langsung.** Data dimuat ulang saat halaman dibuka atau setelah aksi. Tidak ada polling atau websocket. Posisi antrean dihitung ulang setiap kali halaman ditampilkan (Glosarium: Posisi antrean).
- **Unduhan CSV** memakai tautan unduhan biasa. Tombol "Ekspor CSV" tidak membuka halaman baru.
- **Dilarang:** hover sebagai satu-satunya cara memunculkan aksi; drag-and-drop; infinite scroll; dialog bertumpuk; toast untuk error; menonaktifkan zoom di ponsel.

## Accessibility Floor

Target: **WCAG 2.1 AA** di semua halaman (NFR-3). Kontras visual diatur di `DESIGN.md` › Colors.

- **Landmark dan judul.** Setiap halaman punya satu `<h1>`, landmark `header` / `nav` / `main`, dan tautan "Lewati ke konten utama" di urutan fokus pertama. `<title>` dokumen mengikuti pola "{Halaman} — Kelasku", misalnya "Excel untuk Laporan Keuangan — Kelasku".
- **Fokus.** Indikator fokus `{components.focus-indicator}` selalu terlihat. Urutan `Tab` mengikuti urutan baca. Setelah navigasi rute, fokus pindah ke `<h1>`. Setelah dialog ditutup, fokus kembali ke pemicunya.
- **Label.** Setiap input punya `<label>` yang terlihat. Pesan error dikaitkan dengan `aria-describedby` dan input diberi `aria-invalid="true"`. Kolom wajib ditandai dengan teks "(wajib)", bukan hanya tanda bintang.
- **Pengumuman hasil aksi.** Hasil pendaftaran, presensi tersimpan, tautan disalin, dan pembatalan diumumkan lewat `role="status"` / `aria-live="polite"`. Ringkasan error formulir memakai `role="alert"`.
- **Status bukan warna saja.** Penuh, Terdaftar, Daftar tunggu, Layak, Hadir/Tidak hadir/— selalu berupa teks (FR-4, FR-21).
- **Tabel.** Memakai `<table>` semantik dengan `<caption>` (dapat disembunyikan secara visual) dan `<th scope="col|row">`. Di grid rekap, nama peserta menjadi header baris.
- **Checkbox presensi.** Nama aksesibelnya memuat nama peserta, misalnya "Hadir — Dimas Pratama", agar tidak terbaca 20 kali sebagai "Hadir" saja.
- **Ponsel.** Target sentuh ≥ 44 px di halaman peserta. Zoom tidak dinonaktifkan. Isi tetap utuh pada zoom 200% dan reflow pada lebar 320 px CSS.
- **Waktu.** Toast tidak membawa informasi yang hanya ada di toast; informasi yang sama juga tercermin di halaman.
- **Verifikasi.** Test e2e Playwright menjalankan pemeriksaan aksesibilitas otomatis (mis. axe) di setiap permukaan IA, ditambah satu kali uji manual dengan keyboard saja dan pembaca layar (NVDA atau TalkBack) sebelum rilis MVP. [ASSUMPTION]

## Responsive & Platform

| Lebar | Admin | Peserta |
|---|---|---|
| `< 640px` | Bisa dipakai tetapi tidak dioptimalkan: top bar menjadi dua baris dan tabel bergulir horizontal di dalam wadahnya sendiri | Target utama. Satu kolom, margin 16 px, tombol selebar penuh, dialog selebar layar dikurangi margin |
| `640–1023px` | Seperti di atas | Kolom tengah maksimum 560 px |
| `≥ 1024px` (target 1366×768) | Target utama. Keempat kolom tabel Kelas terlihat tanpa gulir horizontal (FR-4). Grid rekap untuk kelas 5 sesi muat tanpa gulir horizontal. | Kolom tengah maksimum 560 px |

Grid rekap dengan lebih dari ±8 sesi boleh bergulir horizontal di dalam wadahnya, dengan kolom nama tetap menempel di kiri. [ASSUMPTION]

Browser: dua versi terakhir Chrome, Edge, Firefox, dan Safari (iOS/macOS), serta Chrome Android. [ASSUMPTION]

## Inspiration & Anti-patterns

- **Diambil dari panel admin pada umumnya:** tabel rapat sebagai layar utama, status dalam badge berteks, satu tombol utama per layar.
- **Diambil dari kebiasaan saat ini (Google Form + WhatsApp):** peserta cukup membuka tautan dan mengisi dua kolom. Kelasku tidak menambah langkah, akun, atau OTP.
- **Ditolak — kartu dashboard dan grafik ringkasan:** Ringkasan dashboard berstatus COULD di PRD §7.3. Tabel Kelas sudah menjawab "mana yang penuh, berapa yang antre".
- **Ditolak — Daftar tunggu sebagai error:** kelas penuh adalah hasil yang sah (UJ-2), jadi tidak memakai warna merah dan tidak berbunyi "gagal".
- **Ditolak — katalog kelas publik:** peserta hanya datang lewat tautan pendaftaran (PRD §2.2, §6).
- **Ditolak — notifikasi dalam bentuk apa pun:** di luar cakupan MVP. Teks di layar menjelaskan bahwa peserta perlu memeriksa halaman status.

## Key Flows

Nama perjalanan mengikuti PRD §2.3.

### UJ-1. Rina membuka kelas baru dan membagikan tautannya

Rina, koordinator pelatihan, di laptop kantor setelah mengajar, sudah dalam sesi masuk.

1. Di Kelas, Rina menekan "Buat kelas".
2. Ia mengisi judul "Excel untuk Laporan Keuangan", menambah 4 tanggal sesi dengan "Tambah tanggal", lalu mengisi kuota 20.
3. Ia menekan "Simpan kelas". Ia dibawa ke halaman kelas admin, dan toast "Kelas tersimpan" muncul. Di kepala kelas tampil tautan pendaftaran beserta tombol "Salin tautan".
4. Ia menekan "Salin tautan". Label tombol berubah menjadi "Tautan disalin". Ia menempelkan tautan itu ke grup WhatsApp alumni.
5. **Klimaks:** Rina kembali ke Kelas. Baris "Excel untuk Laporan Keuangan" tampil dengan "0/20" dan tanggal sesi berikutnya. Kuotanya kini dijaga sistem, sehingga ia tidak perlu memantau chat untuk menghitung pendaftar.

**Kegagalan (R7):** seminggu kemudian Rina membuka "Ubah kelas" dan mengganti kuota menjadi 12 padahal sudah 14 Terdaftar. Saat simpan, kolom kuota menampilkan "Kuota minimal 14 (jumlah terdaftar saat ini)". Nilai lain di formulir tetap ada, dan fokus pindah ke ringkasan error.
**Kegagalan (validasi):** dua tanggal sesi sama → "Tanggal 9 Nov 2026 sudah ada di kelas ini" di baris tanggal tersebut.

### UJ-2. Dimas mendaftar dari ponsel saat kelas hampir penuh

Dimas, staf keuangan, membuka tautan dari WhatsApp di ponselnya (lebar 360 px).

1. Halaman pendaftaran menampilkan judul kelas dan 4 tanggal sesi. Saat halaman dibuka, kelas belum penuh, jadi tidak ada alert.
2. Dimas mengisi nama dan email, lalu menekan "Daftar". Tombol berubah menjadi "Mendaftar…" dan dinonaktifkan.
3. Kursi terakhir ternyata baru saja diambil orang lain. Server memasukkan Dimas ke daftar tunggu (R1, R3).
4. **Klimaks:** formulir digantikan panel hasil kuning: "Daftar tunggu #2" dan "Anda akan otomatis menjadi Terdaftar bila ada peserta yang batal. Tidak ada pemberitahuan; cek halaman status untuk melihat perubahan." Pembaca layar mengumumkannya. Dimas tahu persis posisinya tanpa bertanya ke Rina lewat WhatsApp.

**Kasus tepi (R2):** sinyal lambat membuat Dimas menekan "Daftar" dua kali. Tombol sudah nonaktif setelah tekanan pertama, dan server tetap menjaga satu pendaftaran aktif per email. Bila Dimas membuka tautan lagi dan mendaftar ulang, ia melihat "Anda sudah di daftar tunggu #2".
**Kegagalan:** email tidak valid → error di kolom email, nama tetap terisi. Server tak terjangkau → alert "Tidak dapat menghubungi server. Coba lagi." dan isi formulir tetap ada.

### UJ-3. Sari membatalkan, dan antrean naik sendiri

Sari, peserta Terdaftar, mendapat tugas ke luar kota.

1. Sari membuka halaman status peserta, memasukkan emailnya, lalu menekan "Lihat status".
2. Kartu "Excel untuk Laporan Keuangan" menampilkan badge "Terdaftar". Ia menekan "Batalkan pendaftaran".
3. Dialog konfirmasi muncul: "Batalkan pendaftaran di kelas Excel untuk Laporan Keuangan? Tindakan ini tidak bisa dibatalkan." Fokus berada di "Kembali". Sari memilih "Ya, batalkan".
4. Kartu itu hilang, dan alert "Pendaftaran di Excel untuk Laporan Keuangan dibatalkan." diumumkan. Di server, peserta teratas daftar tunggu naik dalam operasi yang sama (R4).
5. **Klimaks:** sore itu Dimas membuka halaman status. Kartunya menampilkan "Terdaftar (naik dari daftar tunggu)". Di halaman kelas admin, Rina melihat Dimas di bagian Terdaftar dengan penanda "Naik dari daftar tunggu · 10 Nov 2026, 15.04 WIB", tanpa ia melakukan apa pun.

**Kegagalan:** kelas sudah Selesai → tombol batalkan tidak tampil. Bila permintaan tetap sampai ke API, alert menampilkan "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan". Bila Sari dan admin membatalkan hampir bersamaan, keduanya melihat hasil yang sama dan tidak terjadi promosi ganda (FR-11).

### UJ-4. Rina mencatat presensi sesi dan menyerahkan daftar sertifikat pada hari yang sama

Rina, di akhir sesi ke-4 (sesi terakhir), di laptop.

1. Di Sesi hari ini (atau lewat daftar sesi di halaman kelas admin), Rina memilih "Excel untuk Laporan Keuangan — Sesi 4, hari ini".
2. Formulir presensi menampilkan 20 peserta Terdaftar, semuanya tercentang "Hadir" (FR-18), dengan penghitung "Hadir: 20 dari 20".
3. Ia menghapus centang tiga peserta yang tidak datang. Penghitung berubah menjadi "Hadir: 17 dari 20". Ia menekan "Simpan".
4. Toast "Presensi tersimpan" muncul, lalu ia kembali ke halaman kelas admin dan menekan "Lihat rekap".
5. **Klimaks:** grid rekap sudah memperlihatkan setiap peserta dengan "4/4 · Layak" atau "3/4 · Belum layak". Rina menekan "Ekspor CSV", dan berkas "Excel untuk Laporan Keuangan - 2026-11-30.csv" terunduh. Ia mengirimkannya ke bagian sertifikat hari itu juga, tanpa menyusun rekap dengan tangan.

**Kasus tepi (R5):** sesi minggu depan tampil di daftar sesi dengan teks "Bisa diisi mulai Senin, 7 Des 2026" dan tanpa tautan isi.
**Kegagalan:** simpan gagal → alert danger sebaris di atas tombol "Simpan": "Presensi belum tersimpan. Coba lagi." Semua centang tetap seperti sebelum simpan.
