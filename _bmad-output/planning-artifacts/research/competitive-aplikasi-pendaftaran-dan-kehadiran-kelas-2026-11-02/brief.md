---
type: competitive
intent: draft
topic: Kompetitor aplikasi pendaftaran & kehadiran kelas pelatihan di Indonesia
decision: Fitur/pola apa yang wajib, ditiru, atau dihindari Kelasku di Epik 1 (Kelas & Pendaftaran Berkuota — R1–R3, R7), dan apakah ada alat gratis self-hosted yang sudah memenuhi kebutuhan sehingga membangun jadi mubazir
target_tool: Gemini Deep Research
status: brief-drafted
created: 2026-11-02
---

# Prompt Deep Research — salin semua di bawah garis ke Gemini

---

## Peran dan tujuan

Anda analis riset kompetitif. Bantu tim produk kecil di Indonesia menentukan cakupan dan diferensiasi alat internal bernama **Kelasku**. Kelasku adalah aplikasi web untuk mengelola pendaftaran dan kehadiran kelas pelatihan di satu lembaga.

**Keputusan yang harus didukung riset ini:**
1. Fitur dan pola UX apa yang **wajib ada**, **layak ditiru**, dan **sebaiknya dihindari** untuk epik pertama: pembuatan kelas berkuota, pendaftaran peserta, dan daftar tunggu.
2. Apakah sudah ada alat **gratis dan bisa di-host sendiri** (tanpa layanan cloud) yang memenuhi kebutuhan di bawah. Bila ada, membangun Kelasku dari nol jadi tidak perlu.

## Konteks produk (untuk menyaring relevansi, bukan untuk dikutip sebagai bukti)

- Pengguna: satu lembaga pelatihan, ±5 admin, ±400 peserta per bulan, ±20 kelas per bulan dengan 3–5 sesi per kelas. Admin bekerja di laptop. Peserta mendaftar dari ponsel atau laptop.
- Cara kerja saat ini: **spreadsheet + grup WhatsApp + Google Form**. Masalahnya: 2–3 kelas per bulan melebihi kuota karena pendaftaran lewat chat, dan rekap kehadiran satu kelas makan ±1 jam.
- Aturan inti yang harus dipenuhi:
  - R1: jumlah terdaftar tidak pernah melebihi kuota, termasuk saat dua orang mendaftar bersamaan.
  - R2: satu email hanya boleh punya satu pendaftaran aktif per kelas.
  - R3: bila kuota penuh, peserta masuk daftar tunggu berurutan FIFO menurut waktu mendaftar.
  - R4: bila peserta terdaftar batal, antrean teratas daftar tunggu otomatis naik.
  - R5: kehadiran dicatat per sesi, hanya untuk sesi yang tanggalnya sudah tiba.
  - R6: layak sertifikat bila hadir ≥ 80% sesi.
  - R7: kuota tidak boleh diturunkan di bawah jumlah peserta terdaftar saat ini.
  - Ekspor rekap kehadiran ke CSV.
- Batasan: tanpa monetisasi, tanpa pembayaran, tanpa SSO, tanpa notifikasi email/WhatsApp, tanpa multi-tenant, tanpa sertifikat PDF, tanpa ujian. Data disimpan lokal di satu server kecil.

## Kandidat yang harus diteliti

Daftar ini **hipotesis awal dan belum diverifikasi**. Pastikan setiap produk masih ada dan relevan. Buang yang tidak relevan dengan alasannya, dan tambahkan pemain penting yang terlewat, terutama produk lokal Indonesia.

- **Status quo (pembanding utama):** Google Forms + Google Sheets (termasuk add-on pembatas kuota respons seperti "Form Limiter" atau sejenisnya), WhatsApp Group, Microsoft Forms.
- **Platform event/tiket yang dipakai lembaga pelatihan di Indonesia:** Loket.com, Goers, Eventbrite, dan platform pendaftaran pelatihan/webinar lokal lain yang Anda temukan.
- **Self-hosted / open source:** pretix (tiket dengan fitur waiting list), Indico (manajemen event dengan registrasi), Moodle (plugin Attendance dan enrolment dengan batas peserta), serta alat open source lain untuk pendaftaran kelas dan absensi.
- **SaaS manajemen pelatihan / LMS / absensi buatan Indonesia:** cari produk lokal yang menawarkan pendaftaran kelas, kuota, daftar tunggu, absensi per sesi, atau rekap kehadiran (misalnya modul training di HRIS lokal, atau aplikasi absensi kelas/kursus).

Batasi ke **6–10 produk terpenting**. Kriteria pentingnya: dipakai lembaga pelatihan di Indonesia, atau punya fitur kuota + daftar tunggu + absensi per sesi.

## Pertanyaan riset (urut prioritas)

### 1. Teardown fitur (prioritas tertinggi)
Untuk setiap produk, jawab dengan bukti dari dokumentasi resmi, changelog, atau demo:
- Bisakah admin membuat kelas/event dengan **banyak tanggal sesi** dan **kuota**?
- Bagaimana kuota ditegakkan? Apakah ada bukti (dokumentasi, issue tracker, keluhan) kuota **jebol** saat pendaftaran bersamaan atau lewat batas?
- Apakah ada **daftar tunggu**? Urutannya FIFO atau lain? Apakah promosi **otomatis** atau perlu tindakan admin/peserta (misalnya undangan dengan batas waktu)?
- Apakah ada pencegahan **pendaftaran ganda** per email/identitas?
- Apa yang terjadi bila admin **menurunkan kuota** di bawah jumlah terdaftar: ditolak, diizinkan, atau peserta dikeluarkan?
- Apakah ada **absensi per sesi**, ambang **kelayakan sertifikat** berbasis persentase hadir, dan **ekspor CSV/Excel**?
- Apakah bisa **di-host sendiri** tanpa cloud? Apa kebutuhan servernya?
- Apakah antarmuka tersedia dalam **bahasa Indonesia** dan nyaman di ponsel?

Sajikan hasilnya sebagai **tabel matriks fitur** (produk × fitur di atas). Isi tiap sel dengan Ya / Tidak / Sebagian / Tidak diketahui, dan beri nomor sumbernya.

### 2. Pola UX pendaftaran berkuota
- Bagaimana produk terbaik menampilkan **sisa kursi**, status **"Penuh — masuk daftar tunggu"**, dan **posisi antrean** kepada peserta?
- Bagaimana panel admin menampilkan peserta terdaftar vs daftar tunggu, dan riwayat siapa yang naik dari antrean?
- Pola mana yang sering dikeluhkan pengguna?

### 3. Suara pengguna (keluhan & pujian)
- Apa keluhan pengguna Indonesia tentang Google Form + spreadsheet + WhatsApp untuk pendaftaran pelatihan (kuota, rekap absensi, data ganda)? Cari di forum, Kaskus, Reddit r/indonesia, blog, YouTube, ulasan Play Store/App Store, dan Google Reviews.
- Apa yang dipuji dan dikeluhkan pengguna produk lain dalam daftar? Prioritaskan ulasan **bintang 1–3**.

### 4. Positioning (ringkas)
- Siapa target yang diklaim tiap produk (event publik, korporat, sekolah, kursus)? Di mana klaim pemasaran berbeda dengan kemampuan nyata di dokumentasi?

### 5. Harga dan arah produk (prioritas rendah, cukup singkat)
- Model harga saat ini, apakah ada tier gratis, dan apakah fitur kuota/daftar tunggu/absensi terkunci di tier berbayar.
- Sinyal arah produk dalam 6 bulan terakhir (rilis, changelog, lowongan kerja), hanya bila relevan dengan fitur di atas.

## Standar bukti (wajib, tidak bisa ditawar)

1. **Setiap klaim harus punya sumber**: URL, nama penerbit, dan tanggal publikasi (atau "tanggal tidak tercantum"). Klaim tanpa sumber jangan ditulis.
2. **Batas kesegaran:**
   - fitur dan harga: ≤ 3 bulan (cek halaman resmi terbaru; arsip Wayback Machine boleh dipakai untuk melihat arah perubahan harga);
   - sinyal arah produk (rilis, pendanaan, lowongan): ≤ 6 bulan;
   - sentimen pengguna: ≤ 12 bulan.
   Sumber yang lebih tua tetap boleh dipakai bila ditandai **[USANG]** beserta tanggalnya.
3. **Dua sumber independen** untuk: (a) klaim jumlah pengguna, traksi, atau pangsa pasar; (b) klaim kemampuan yang menjadi dasar diferensiasi, yaitu kuota anti-jebol, daftar tunggu otomatis, dan absensi per sesi. Halaman perbandingan buatan vendor cenderung melebih-lebihkan, jadi verifikasi lewat dokumentasi teknis atau ulasan pengguna.
4. **Laporkan bukti yang berlawanan.** Bila sumber saling bertentangan, tampilkan keduanya.
5. **Akui celah.** Bila data publik tipis atau tidak ditemukan, tulis "tidak ditemukan bukti". Jangan mengisi dengan dugaan. Tidak ditemukannya bukti juga merupakan temuan.
6. Pisahkan dengan jelas **fakta bersumber** dan **inferensi Anda** (beri label "Inferensi:").

## Format keluaran (ikuti persis)

Tulis dalam **bahasa Indonesia**.

1. **Ringkasan eksekutif** (≤ 10 butir), dimulai dengan jawaban langsung untuk dua pertanyaan keputusan di atas.
2. **Daftar produk yang diteliti**: nama, URL, kategori, alasan masuk atau dibuang.
3. **Matriks fitur** (tabel dari pertanyaan 1).
4. **Temuan per dimensi**: bagian 1–5 sesuai urutan pertanyaan. Setiap temuan satu kalimat dengan nomor sumber `[n]`.
5. **Rekomendasi untuk Epik 1**: tiga daftar, yaitu *Wajib ada*, *Layak ditiru*, *Hindari*. Setiap butir merujuk temuan dan sumbernya.
6. **Bukti berlawanan dan celah data.**
7. **Daftar sumber**: tabel bernomor `[n]` dengan kolom Judul | Penerbit | URL | Tanggal publikasi | Tanggal akses.
