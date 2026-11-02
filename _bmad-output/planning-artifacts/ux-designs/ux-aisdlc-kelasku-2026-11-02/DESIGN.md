---
name: Kelasku
description: Panel admin internal untuk kelas pelatihan berkuota, ditambah halaman peserta publik yang responsif. Bersih, padat informasi, WCAG 2.1 AA. Token agnostik framework.
status: final
updated: 2026-11-02
sources:
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md
  - docs/intent-kelasku.md
colors:
  # Permukaan dan teks
  background: '#FFFFFF'
  surface: '#F8FAFC'
  surface-muted: '#F1F5F9'
  border: '#E2E8F0'
  border-strong: '#64748B'
  text: '#0F172A'
  text-muted: '#475569'
  # Merek / aksi
  primary: '#1D4ED8'
  primary-hover: '#1E40AF'
  primary-foreground: '#FFFFFF'
  focus-ring: '#1D4ED8'
  # Status (selalu dipasangkan dengan teks/ikon, tidak pernah warna saja)
  info: '#1D4ED8'
  info-bg: '#EFF6FF'
  success: '#15803D'
  success-bg: '#F0FDF4'
  warning: '#A16207'
  warning-bg: '#FEFCE8'
  danger: '#B91C1C'
  danger-bg: '#FEF2F2'
  danger-foreground: '#FFFFFF'
typography:
  # System font stack: tanpa web font, karena deployment lokal tanpa CDN.
  page-title:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  section-title:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-participant:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  table:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  status-hero:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif'
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.25'
rounded:
  sm: 4px
  md: 6px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '6': 24px
  '8': 32px
  table-row-y: 8px
  table-cell-x: 12px
  admin-max-width: 1280px
  participant-max-width: 560px
  page-margin-mobile: 16px
  page-margin-desktop: 24px
  touch-target: 44px
components:
  button-primary:
    background: '{colors.primary}'
    background-hover: '{colors.primary-hover}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
    height: 36px
    height-participant: '{spacing.touch-target}'
  button-secondary:
    background: '{colors.background}'
    foreground: '{colors.text}'
    border: '1px solid {colors.border-strong}'
    radius: '{rounded.md}'
    height: 36px
  button-danger:
    background: '{colors.danger}'
    foreground: '{colors.danger-foreground}'
    radius: '{rounded.md}'
    height: 36px
    height-participant: '{spacing.touch-target}'
  input:
    background: '{colors.background}'
    foreground: '{colors.text}'
    border: '1px solid {colors.border-strong}'
    border-error: '2px solid {colors.danger}'
    radius: '{rounded.sm}'
    height: 36px
    height-participant: '{spacing.touch-target}'
  focus-indicator:
    outline: '2px solid {colors.focus-ring}'
    offset: 2px
  data-table:
    header-background: '{colors.surface-muted}'
    header-foreground: '{colors.text-muted}'
    row-divider: '1px solid {colors.border}'
    row-padding-y: '{spacing.table-row-y}'
    cell-padding-x: '{spacing.table-cell-x}'
    typography: '{typography.table}'
  status-badge:
    radius: '{rounded.full}'
    typography: '{typography.caption}'
    padding: '2px 8px'
  status-badge-terdaftar:
    background: '{colors.success-bg}'
    foreground: '{colors.success}'
    icon: 'check'
  status-badge-daftar-tunggu:
    background: '{colors.warning-bg}'
    foreground: '{colors.warning}'
    icon: 'clock'
  status-badge-dibatalkan:
    background: '{colors.surface-muted}'
    foreground: '{colors.text-muted}'
    icon: 'x'
  status-badge-penuh:
    background: '{colors.danger-bg}'
    foreground: '{colors.danger}'
    icon: 'lock'
  status-badge-selesai:
    background: '{colors.surface-muted}'
    foreground: '{colors.text-muted}'
    icon: 'flag'
  status-badge-layak:
    background: '{colors.success-bg}'
    foreground: '{colors.success}'
    icon: 'check'
  status-badge-belum-layak:
    background: '{colors.surface-muted}'
    foreground: '{colors.text-muted}'
    icon: 'minus'
  status-badge-tidak-mungkin-layak:
    background: '{colors.danger-bg}'
    foreground: '{colors.danger}'
    icon: 'x'
  promotion-marker:
    foreground: '{colors.info}'
    background: '{colors.info-bg}'
    radius: '{rounded.sm}'
    typography: '{typography.caption}'
  result-panel:
    background-terdaftar: '{colors.success-bg}'
    background-daftar-tunggu: '{colors.warning-bg}'
    border-left: '4px solid (warna status yang sama)'
    radius: '{rounded.md}'
    title-typography: '{typography.status-hero}'
    padding: '{spacing.4}'
  alert:
    radius: '{rounded.md}'
    padding: '{spacing.3}'
    variants: 'info, success, warning, danger; latar {colors.*-bg}, teks {colors.*}'
  toast:
    background: '{colors.text}'
    foreground: '{colors.background}'
    radius: '{rounded.md}'
    position: 'kanan bawah (admin); bawah tengah (peserta)'
  dialog:
    background: '{colors.background}'
    radius: '{rounded.md}'
    max-width: 440px
    backdrop: 'rgba(15, 23, 42, 0.5)'
  top-bar:
    background: '{colors.background}'
    border-bottom: '1px solid {colors.border}'
    height: 48px
    active-link-foreground: '{colors.primary}'
    active-link-indicator: '2px bawah {colors.primary}'
  participant-card:
    background: '{colors.background}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
    padding: '{spacing.4}'
  attendance-toggle:
    size: 20px
    hit-area: 32px
    checked-background: '{colors.primary}'
    border: '1px solid {colors.border-strong}'
---

## Brand & Style

Kelasku adalah alat kerja internal, bukan produk konsumen. Penggunanya Rina, koordinator yang membuka laptop di sela jam mengajar dan butuh jawaban dalam sekali lihat: kelas mana yang penuh, siapa yang antre, sesi mana yang harus diisi hari ini. Karena itu tampilannya tenang, rapat, dan polos. Tabel adalah pusatnya, angka rata kanan dengan angka tabular, tanpa ilustrasi, gradien, atau animasi dekoratif.

Halaman peserta memakai bahasa visual yang sama tetapi lebih lega. Peserta membuka tautan dari WhatsApp di ponsel, jadi teksnya lebih besar, target sentuh lebih tinggi, dan dalam satu layar hanya ada satu hal yang penting: statusnya.

Belum ada UI library yang dipilih; itu keputusan `bmad-architecture`. Token di frontmatter adalah kontrak lengkap yang agnostik framework. Bila arsitektur memilih library komponen, token ini dipetakan ke tema library tersebut, bukan sebaliknya. [ASSUMPTION]

## Colors

Palet terdiri dari netral slate dan satu warna primer. Warna status hanya memperkuat makna yang sudah disampaikan teks dan ikon. Semua pasangan di bawah sudah dihitung dan memenuhi WCAG 2.1 AA.

| Token | Hex | Dipakai untuk | Kontras |
|---|---|---|---|
| `{colors.text}` | `#0F172A` | Teks utama | 17,9:1 di `background` |
| `{colors.text-muted}` | `#475569` | Teks sekunder, header tabel, keterangan | 7,6:1 di `background`; 6,9:1 di `surface-muted` |
| `{colors.background}` | `#FFFFFF` | Latar halaman dan kartu | — |
| `{colors.surface}` | `#F8FAFC` | Latar area konten admin di belakang tabel | — |
| `{colors.surface-muted}` | `#F1F5F9` | Header tabel, badge netral, baris Dibatalkan | — |
| `{colors.border}` | `#E2E8F0` | Pemisah baris tabel dan garis kartu (dekoratif) | Tidak dipakai sebagai batas kontrol |
| `{colors.border-strong}` | `#64748B` | Batas input, checkbox, tombol sekunder | 4,8:1 (≥ 3:1 untuk komponen UI) |
| `{colors.primary}` | `#1D4ED8` | Tombol utama, tautan, navigasi aktif, cincin fokus | 6,7:1 teks putih di atasnya |
| `{colors.primary-hover}` | `#1E40AF` | Hover/tekan tombol utama | 8,7:1 |
| `{colors.success}` / `success-bg` | `#15803D` / `#F0FDF4` | Terdaftar, Layak, Tersimpan | 4,8:1 |
| `{colors.warning}` / `warning-bg` | `#A16207` / `#FEFCE8` | Daftar tunggu | 4,8:1 |
| `{colors.danger}` / `danger-bg` | `#B91C1C` / `#FEF2F2` | Penuh, Tidak mungkin layak, error validasi, tombol batalkan | 5,9:1 |
| `{colors.info}` / `info-bg` | `#1D4ED8` / `#EFF6FF` | Penanda "Naik dari daftar tunggu", info | 6,2:1 |

Daftar tunggu memakai kuning, bukan merah, karena itu hasil yang sah dan bukan error (PRD UJ-2). Merah hanya untuk hal yang menghalangi: kelas Penuh di tabel admin, error, dan aksi yang tidak bisa dibatalkan.

Tidak ada dark mode di MVP. [ASSUMPTION]

## Typography

Kelasku memakai system font stack tanpa web font, agar tetap berjalan lokal tanpa jaringan luar. Tabel memakai `font-variant-numeric: tabular-nums` agar kolom "18/20" dan jumlah hadir rata.

| Peran | Token | Ukuran | Dipakai di |
|---|---|---|---|
| Judul halaman | `{typography.page-title}` | 20/600 | Judul kelas di halaman kelas admin, "Kelas", "Sesi hari ini" |
| Judul bagian | `{typography.section-title}` | 16/600 | "Terdaftar", "Daftar tunggu", "Dibatalkan", judul kartu peserta |
| Isi admin | `{typography.body}` | 14/400 | Teks umum di halaman admin |
| Isi peserta | `{typography.body-participant}` | 16/400 | Semua teks di halaman pendaftaran dan status; 16 px mencegah zoom otomatis input di iOS |
| Tabel | `{typography.table}` | 14/400 | Sel tabel kelas, daftar pendaftaran, grid rekap |
| Label | `{typography.label}` | 14/500 | Label formulir, header tabel |
| Keterangan | `{typography.caption}` | 13/400 | Badge, waktu daftar, teks bantuan |
| Status utama | `{typography.status-hero}` | 24/700 | "Terdaftar" / "Daftar tunggu #2" di hasil pendaftaran |

Ukuran terkecil 13 px, dan hanya untuk teks sekunder. Teks harus tetap terbaca saat zoom browser 200%.

## Layout & Spacing

Skala jarak berbasis 4 px: `{spacing.1}` 4 · `{spacing.2}` 8 · `{spacing.3}` 12 · `{spacing.4}` 16 · `{spacing.6}` 24 · `{spacing.8}` 32.

**Admin.** Top bar setinggi 48 px, lalu konten selebar maksimum `{spacing.admin-max-width}` dengan margin `{spacing.page-margin-desktop}`. Baris tabel rapat (`{spacing.table-row-y}` vertikal, `{spacing.table-cell-x}` horizontal), sehingga ±20 baris kelas muat di layar 1366×768 tanpa gulir. Halaman kelas admin terdiri dari satu kolom: kepala kelas (judul, status, kuota, aksi), daftar sesi, lalu bagian Terdaftar, Daftar tunggu, dan Dibatalkan berurutan ke bawah. Tidak ada layout multi-kolom yang menyembunyikan isi.

**Peserta.** Satu kolom selebar maksimum `{spacing.participant-max-width}`, berada di tengah layar, dengan margin `{spacing.page-margin-mobile}` di ponsel. Pada lebar 360 px tidak boleh ada gulir horizontal (NFR-4). Target sentuh minimal `{spacing.touch-target}`.

Breakpoint: `< 640px` ponsel; `≥ 640px` tablet/laptop; `≥ 1024px` admin penuh. Halaman admin tetap bisa dipakai di bawah 1024 px (tabel bergulir horizontal di dalam wadahnya), tetapi tidak dioptimalkan untuk itu.

## Elevation & Depth

Kelasku hampir datar. Hierarki dibangun dengan garis `{colors.border}` dan latar `{colors.surface}`, bukan bayangan. Bayangan hanya dipakai di dua tempat: dialog (`0 10px 25px rgba(15,23,42,0.15)`) dan toast (`0 4px 12px rgba(15,23,42,0.2)`), karena keduanya melayang di atas konten.

## Shapes

Sudut kecil agar terasa seperti alat kerja: `{rounded.sm}` (4 px) untuk input dan checkbox, `{rounded.md}` (6 px) untuk tombol, kartu, dialog, dan alert. `{rounded.full}` hanya untuk badge status.

## Components

| Komponen | Spesifikasi visual |
|---|---|
| **Tombol utama** (`button-primary`) | Latar `{colors.primary}`, teks putih, tinggi 36 px di admin dan `{spacing.touch-target}` di halaman peserta. Satu tombol utama per formulir. Saat memproses: label berganti ("Mendaftar…", "Menyimpan…") dan tombol dinonaktifkan. |
| **Tombol sekunder** (`button-secondary`) | Latar putih, garis `{colors.border-strong}`. Untuk "Salin tautan", "Ekspor CSV", "Ubah kelas", "Batal". |
| **Tombol bahaya** (`button-danger`) | Latar `{colors.danger}`. Hanya muncul di langkah konfirmasi pembatalan, tidak pernah di langkah pertama. |
| **Input** (`input`) | Garis `{colors.border-strong}`, label di atas input (bukan placeholder). Saat error: garis 2 px `{colors.danger}`, pesan error di bawah input dengan ikon peringatan. |
| **Indikator fokus** (`focus-indicator`) | Outline 2 px `{colors.focus-ring}` dengan jarak 2 px. Tidak pernah dihilangkan. |
| **Tabel data** (`data-table`) | Header `{colors.surface-muted}` dengan teks `{colors.text-muted}` 14/500. Pemisah baris `{colors.border}`, tanpa zebra. Kolom angka rata kanan dan tabular. Baris yang bisa diklik mendapat latar `{colors.surface}` saat hover. |
| **Badge status** (`status-badge-*`) | Pil dengan ikon + teks. Varian: Terdaftar, Daftar tunggu, Dibatalkan, Penuh, Selesai, Layak, Belum layak, Tidak mungkin layak. Teks badge sama persis dengan istilah Glosarium PRD. |
| **Penanda promosi** (`promotion-marker`) | Label kecil `{colors.info}` di atas `{colors.info-bg}`: "Naik dari daftar tunggu · {tanggal jam}". |
| **Panel hasil** (`result-panel`) | Hasil pendaftaran di halaman peserta. Garis kiri 4 px berwarna status, judul `{typography.status-hero}` ("Terdaftar" / "Daftar tunggu #2"), lalu satu kalimat penjelasan dan tautan ke halaman status. |
| **Alert** (`alert`) | Kotak sebaris dengan ikon + teks, varian info/success/warning/danger. Untuk pesan tingkat halaman, misalnya "Kelas penuh — Anda akan masuk daftar tunggu" atau "Pendaftaran kelas ini sudah ditutup". |
| **Toast** (`toast`) | Latar gelap `{colors.text}`, teks putih. Untuk konfirmasi singkat: "Tautan disalin", "Presensi tersimpan". Hilang setelah 5 detik; tidak dipakai untuk error yang perlu tindakan. |
| **Dialog** (`dialog`) | Maksimum 440 px, latar gelap semi-transparan. Hanya untuk konfirmasi (pembatalan, peringatan perubahan tanggal sesi). Di ponsel tampil selebar layar dikurangi margin. |
| **Top bar admin** (`top-bar`) | Tinggi 48 px. Kiri: "Kelasku". Tengah-kiri: tautan "Sesi hari ini" dan "Kelas"; tautan aktif berwarna `{colors.primary}` dengan garis bawah 2 px. Kanan: email admin dan tombol "Keluar". |
| **Kartu peserta** (`participant-card`) | Satu kartu per pendaftaran di halaman status peserta: judul kelas, tanggal sesi, badge status, "Hadir x dari y sesi", badge kelayakan, dan tombol "Batalkan pendaftaran". |
| **Toggle presensi** (`attendance-toggle`) | Checkbox 20 px dengan area klik 32 px, ditambah label teks "Hadir" di sebelahnya. Status "belum dicatat" ditampilkan sebagai teks "Belum dicatat", tidak sebagai checkbox setengah. |

## Do's and Don'ts

| Lakukan | Jangan |
|---|---|
| Pasangkan setiap warna status dengan teks dan ikon | Membedakan Penuh/Terdaftar/Hadir hanya dengan warna |
| Pakai kuning (`warning`) untuk Daftar tunggu | Menampilkan Daftar tunggu dengan warna merah atau gaya error |
| Pakai tabel rapat dengan angka tabular untuk data admin | Mengganti tabel kelas dengan kartu besar di layar admin |
| Pakai label di atas input | Memakai placeholder sebagai satu-satunya label |
| Biarkan outline fokus selalu terlihat | `outline: none` tanpa pengganti |
| Pakai teks 16 px dan target 44 px di halaman peserta | Mengecilkan halaman peserta menjadi gaya padat admin |
| Pakai bayangan hanya untuk dialog dan toast | Memberi bayangan pada kartu, tabel, atau tombol |
| Pakai system font | Memuat web font dari CDN |
