---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-11-02'
workflowType: 'testarch-test-design'
inputDocuments:
  - docs/intent-kelasku.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md
---

# Test Design untuk Arsitektur: Kelasku MVP (level sistem)

**Tujuan:** Kekhawatiran arsitektur, celah testability, dan kebutuhan NFR untuk ditinjau tim arsitektur/dev. Dokumen ini adalah kontrak antara QA dan Engineering tentang apa yang harus beres sebelum penulisan test dimulai. Resep test (skenario, level, alat, gate) ada di `test-design-qa.md`.

**Tanggal:** 2026-11-02
**Penulis:** Murat (TEA) untuk Rustan
**Status:** Menunggu tinjauan arsitektur
**Proyek:** aisdlc-kelasku (Kelasku)
**Referensi PRD:** `_bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md` (+ `addendum.md`)
**Referensi ADR:** `_bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md` (AD-1..AD-20)

---

## Ringkasan Eksekutif

**Cakupan:** Seluruh MVP (FR-1..FR-22, NFR-1..NFR-9, R1–R7). Epik pertama: Kelas & Pendaftaran Berkuota (FR-1..FR-10; R1–R3, R7).

**Konteks bisnis (PRD):**

- **Dampak:** SM-1 nol kelas melebihi kuota (sekarang 2–3/bulan); SM-2 rekap < 5 menit; SM-3 daftar sertifikat siap di hari sesi terakhir. Tanpa monetisasi.
- **Masalah:** spreadsheet + WhatsApp + Google Form untuk ±5 admin, ±20 kelas dan ±400 peserta per bulan.
- **Target:** MVP 1 minggu, tim 3 orang, tanpa QA khusus.

**Arsitektur (spine):**

- **AD-1/AD-2:** satu proses Fastify, satu berkas SQLite (WAL) lewat better-sqlite3 sinkron, tanpa ORM.
- **AD-3/AD-4/AD-16/AD-17:** setiap tulis = satu `BEGIN IMMEDIATE` yang dibuka use-case; satu jalur promosi dan satu jalur pembatalan.
- **AD-6/AD-7/AD-20:** nilai turunan (status kelas, posisi antrean, kelayakan) dihitung domain murni; waktu hanya dari `Clock` Asia/Jakarta; `KELASKU_FAKE_NOW` untuk test.

**Skala:** ±240 kelas dan ±5.000 pendaftaran per tahun; puncak tulis = ledakan pendaftaran saat tautan dibagikan.

**Ringkasan risiko:**

- **Total risiko:** 21 (6 tinggi, 10 sedang, 5 rendah). Tidak ada skor 9.
- **Skor tinggi (≥6):** 6 risiko, empat di antaranya soal integritas data atau waktu.
- **Upaya test:** ~88 skenario, ~65–120 jam (≈1,5–3 minggu satu orang; dibagi ke 3 dev selama Sprint 0 dan epik).

---

## Panduan Cepat

### 🚨 BLOCKER — tim harus memutuskan

Harus selesai di **Sprint 0** sebelum test integrasi/E2E bisa ditulis:

1. **B-1: Use-case bisa dibangun tanpa Fastify, dengan clock dan busy timeout yang bisa disuntik.** Sediakan `createDb(path, { busyTimeoutMs? })` dan `createServices({ db, clock })` yang bisa diimpor dari `worker_threads`. Tanpa ini, test konkurensi R1/R2/R4/R7 (AD-14) tidak bisa menjalankan use-case nyata dari dua koneksi. (pemilik: tech lead)
2. **B-2: Kontrak data dan waktu untuk E2E.** (a) `KELASKU_FAKE_NOW` = instan ISO UTC yang **beku**, dibaca sekali saat start, diabaikan di luar `NODE_ENV=test`. (b) `seed:demo` menyertakan kelas **Selesai** yang punya Terdaftar + Daftar tunggu; daftar seed di addendum §4 belum memuatnya. (c) Kredensial admin seed dibaca non-interaktif dari `.env` (mis. `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`; nama variabelnya ada di `.env.example` tanpa nilai). `admin:create` meminta password secara interaktif, jadi tidak bisa dipakai otomatis. (pemilik: dev backend)

**Yang kami perlukan:** kedua butir selesai sebelum story pertama Epik 1 masuk implementasi.

### ⚠️ PRIORITAS TINGGI — tim memvalidasi rekomendasi

1. **HP-1 (R-005): Test zona waktu tidak bergantung zona mesin.** Vitest dijalankan dengan `TZ=UTC`, dan browser Playwright dengan `timezoneId: 'UTC'`, supaya bug "hari ini = UTC/zona lokal" langsung kelihatan. Persetujuan: tech lead.
2. **HP-2 (kekhawatiran Observability): Tabel kode error → status HTTP di `src/shared/errors.ts`.** AD-8 baru menetapkan 401, 404, 409 `confirmation_required`/`roster_changed`, dan 503. Status untuk `validation_error`, `quota_below_registered`, `registration_closed`, `class_finished`, `session_not_yet_open`, `session_has_attendance`, dan `registration_not_found` belum ditetapkan. Rekomendasi: registri `{ code, httpStatus, message }` yang dipakai handler dan test. Persetujuan: tech lead.
3. **HP-3 (R-019): Fitness test arsitektur pengganti lint yang ditunda.** Satu test Vitest statis memeriksa: hanya `data/` yang mengimpor `better-sqlite3`; tidak ada `new Date()`/`Date.now()` di `domain/` dan `services/`; tidak ada fungsi waktu SQL di migrasi; `client/` tidak mengimpor `src/server`. Persetujuan: tech lead.
4. **HP-4: Tambah `@seontechnologies/playwright-utils` sebagai devDependency.** Config TEA mengaktifkannya, tetapi paket itu belum ada di tabel Stack spine. Pustaka ini berjalan lokal tanpa layanan cloud. Bila ditolak, E2E memakai Playwright vanilla dan penyimpangan itu dicatat. Persetujuan: arsitek (AGENTS.md: keputusan dependensi lewat arsitektur).
5. **HP-5 (R-014): Data dan metode uji NFR-7.** Perlu `seed:perf` (±240 kelas, ±5.000 pendaftaran, presensi) dan skrip ukur p95 yang dijalankan di bawah `taskset -c 0`. Tingkat konkurensi beban belum diketahui (lihat NFR). Persetujuan: PM + tech lead.

### 📋 INFO SAJA — solusi sudah disiapkan

1. **Strategi test:** domain diuji sebagai unit murni; service/data diuji sebagai integrasi dengan SQLite nyata; HTTP diuji lewat `fastify.inject`; E2E hanya untuk UJ-1..UJ-4, a11y, dan tata letak. Detail di QA doc.
2. **Tooling:** Vitest 5 (proyek `unit` dan `integration`), Playwright 1.64 + axe-core, `worker_threads` untuk konkurensi.
3. **Eksekusi:** CI belum ada, jadi seluruh suite dijalankan lokal sebelum commit (AGENTS.md). Burn-in konkurensi ×20 dan uji kinerja dijalankan sebelum rilis.
4. **Coverage:** ~88 skenario P0–P3 yang ditautkan ke ID risiko.
5. **Quality gate:** P0 100%, P1 ≥95%, setiap aturan R1–R7 punya test yang menyebut ID-nya (NFR-9).

---

## Untuk Arsitek dan Dev — Topik Terbuka 👷

### Penilaian Risiko

**Total:** 21 (6 tinggi ≥6, 10 sedang 3–5, 5 rendah 1–2)

#### Risiko tinggi (skor ≥6)

| Risk ID   | Kat.     | Deskripsi | P | I | Skor  | Mitigasi | Pemilik | Timeline |
| --------- | -------- | --------- | - | - | ----- | -------- | ------- | -------- |
| **R-001** | **DATA** | Dua pendaftaran bersamaan sama-sama mengambil kursi terakhir sehingga Terdaftar > kuota (R1, FR-8, SM-1) | 2 | 3 | **6** | AD-3: `COUNT` di dalam `BEGIN IMMEDIATE`; test 20 paralel multi-koneksi | Dev backend | Epik 1 |
| **R-002** | **DATA** | Klik ganda atau email beda kapitalisasi menghasilkan dua pendaftaran aktif, atau pelanggaran unique bocor sebagai 500 (R2, FR-9, AD-5) | 2 | 3 | **6** | `normalizeEmail` tunggal; unique index parsial; tangkap `SQLITE_CONSTRAINT_UNIQUE` → `alreadyActive` | Dev backend | Epik 1 |
| **R-003** | **DATA** | Pembatalan bersamaan (peserta + admin, atau dua peserta) mempromosikan orang yang sama dua kali atau melampaui kuota (R4, FR-11..13, AD-4/16/17) | 2 | 3 | **6** | `UPDATE … AND status=@expected` + `changes===1`; promosi hanya bila status sebelumnya `registered` | Dev backend | Epik pembatalan |
| **R-005** | **BUS**  | "Hari ini" dihitung dalam UTC/zona server: presensi tertolak pukul 00.00–07.00 WIB atau terbuka untuk besok pukul 23.30 WIB; status Selesai bergeser (R5, NFR-2, AD-7) | 3 | 2 | **6** | `Clock.todayJakarta()` satu-satunya sumber; larangan `Date` di domain/services; HP-1 | Dev backend | Sprint 0 |
| **R-008** | **TECH** | Test konkurensi memberi rasa aman palsu: berjalan serial di satu koneksi, atau flaky karena `busy_timeout` (NFR-1 "lulus berulang tanpa flake", AD-14) | 2 | 3 | **6** | B-1; barrier `Atomics.wait` agar mulai serentak; burn-in ×20 | Tech lead | Sprint 0 |
| **R-016** | **OPS**  | E2E tidak deterministik atau terblokir: clock palsu belum jelas, seed tanpa kelas Selesai, kredensial admin seed tidak terdefinisi (AD-14, addendum §4) | 3 | 2 | **6** | B-2 | Dev backend | Sprint 0 |

#### Risiko sedang (skor 3–5)

| Risk ID | Kat. | Deskripsi | P | I | Skor | Mitigasi | Pemilik |
| ------- | ---- | --------- | - | - | ---- | -------- | ------- |
| R-004 | BUS  | Pendaftar baru menyalip antrean saat kursi terbuka atau kuota naik (R3, FR-3, FR-8) | 2 | 2 | 4 | Syarat "antrean kosong" (AD-5); promosi di transaksi ubah kuota (AD-19) | Dev backend |
| R-009 | DATA | Penjaga kelas Selesai tidak konsisten: satu use-case masih menerima daftar/batal/promosi (AD-18) | 2 | 2 | 4 | `assertClassOpen` sebagai baca pertama di semua use-case tulis | Dev backend |
| R-010 | DATA | Ubah tanggal sesi memutus presensi atau mengubah kelayakan tanpa konfirmasi (FR-3, AD-19) | 2 | 2 | 4 | Diff di transaksi; `session_has_attendance`; 409 `confirmation_required` | Dev backend |
| R-012 | SEC  | Nama peserta `=HYPERLINK(…)` dieksekusi sebagai formula di Excel (FR-22) | 2 | 2 | 4 | Prefix `'` untuk `= + - @` di builder CSV | Dev backend |
| R-013 | SEC  | Siapa pun yang tahu email bisa melihat/membatalkan pendaftaran orang lain (PRD §9, **diterima**) | 2 | 2 | 4 | Diterima PM; pembatalan publik wajib `registrationRef` + email (AD-16) | PM |
| R-014 | PERF | NFR-7 (p95 < 1 s, CSV < 2 s) tidak terbukti: tidak ada data satu tahun, ada risiko N+1 | 2 | 2 | 4 | HP-5; satu query per tabel per request | Tech lead |
| R-017 | BUS  | Pelanggaran WCAG 2.1 AA atau gulir horizontal di 360 px (NFR-3, NFR-4) | 2 | 2 | 4 | Komponen bersama AD-13; axe di setiap permukaan IA | Dev frontend |
| R-019 | TECH | Aturan lapisan (SQL di luar `data/`, `Date` di service, klien menghitung aturan) terkikis tanpa terdeteksi; lint ditunda | 2 | 2 | 4 | HP-3 | Tech lead |
| R-021 | DATA | Roster presensi salah: peserta yang dipromosikan tidak muncul sebagai "belum dicatat", atau presensi pendaftaran Dibatalkan ikut dihitung (FR-15, AD-11) | 2 | 2 | 4 | `roster_changed` 409; filter Terdaftar di domain | Dev backend |
| R-006 | BUS  | Kelayakan R6 dihitung dengan `0.8*n` atau rumus berbeda di grid/status/CSV (FR-19, AD-6) | 1 | 3 | 3 | Satu fungsi domain bilangan bulat yang dipakai semua permukaan | Dev backend |

#### Risiko rendah (skor 1–2)

| Risk ID | Kat. | Deskripsi | P | I | Skor | Tindakan |
| ------- | ---- | --------- | - | - | ---- | -------- |
| R-007 | DATA | Turunkan kuota berpacu dengan pendaftaran baru (R7, FR-3); jendela sempit dengan 5 admin | 1 | 2 | 2 | Dokumentasikan; tetap dicakup test konkurensi P0 |
| R-011 | SEC  | Route admin terlewat dari hook auth (FR-1, AD-8) | 1 | 2 | 2 | Dokumentasikan; test enumerasi 401 |
| R-015 | OPS  | Migrasi gagal atau restore tidak pernah diuji, padahal data hanya satu berkas (AD-12; jadwal backup ditunda) | 1 | 2 | 2 | Dokumentasikan; drill restore sebelum go-live |
| R-018 | BUS  | CSV rusak di Excel (tanpa BOM) atau label/tanggal menyimpang dari Glosarium (NFR-5, FR-22) | 1 | 2 | 2 | Dokumentasikan |
| R-020 | OPS  | Ledakan pendaftaran memicu `SQLITE_BUSY` → 503 bagi peserta (AD-3) | 1 | 2 | 2 | Dokumentasikan; test pemetaan 503 |

> Catatan skor: R-007 dan R-011 berdampak tinggi bila terjadi, tetapi AD-3/AD-19 dan plugin auth tunggal (AD-8) membuat probabilitasnya rendah. Test-nya tetap P0 karena menyangkut integritas dan keamanan (prioritas tidak ditentukan oleh skor).

#### Legenda kategori

TECH arsitektur/integrasi · SEC keamanan · PERF kinerja · DATA integritas data · BUS dampak bisnis/UX · OPS operasi/deployment

---

### Kebutuhan Testability NFR

| Kategori NFR | Ambang / kebutuhan | Dukungan desain | Celah / keputusan | Bukti yang direncanakan |
| --- | --- | --- | --- | --- |
| Keamanan (NFR-8) | Hash scrypt; 401 di semua `/api/admin/*`; validasi zod di server; `.env` tidak di repo; sesi 12 jam; tulis hanya `application/json` | Didukung (AD-8, AD-9) | — | Test API enumerasi route; test log bebas PII; cek `git ls-files` |
| Kinerja (NFR-7) | p95 < 1 s per halaman/aksi; CSV satu kelas < 2 s; data satu tahun; 1 inti CPU | Sebagian (indeks + aturan tanpa N+1) | Generator data, alat ukur, dan **tingkat konkurensi UNKNOWN** | Laporan JSON `perf-check` |
| Keandalan/konsistensi (NFR-1) | R1/R2/R4/R7 di satu transaksi; test paralel lulus berulang | Didukung (AD-3, AD-14) | B-1; jumlah ulangan "berulang" tidak ditetapkan (asumsi ×20) | Log burn-in Vitest |
| Pemulihan | Backup harian (`npm run backup`), backup pra-migrasi otomatis | Sebagian | **RTO/RPO UNKNOWN**; operator dan lokasi backup ditunda ke lembaga | Hasil drill restore + `PRAGMA integrity_check` |
| Zona waktu (NFR-2) | Semua "hari ini" = Asia/Jakarta, lepas dari zona server/browser | Didukung (AD-7) | HP-1 | Test unit batas 16.30Z/23.00Z; E2E `timezoneId: 'UTC'` |
| Aksesibilitas & tata letak (NFR-3/4) | WCAG 2.1 AA; 360 px tanpa gulir horizontal; admin 1366×768 | Didukung (AD-13, axe di stack) | Pembaca layar dan kontras visual sebagian manual | Laporan axe per permukaan; cek scrollWidth |
| Maintainability (NFR-9) | Setiap R1–R7 punya test dengan ID di nama; data seed untuk E2E | Didukung (AD-14) | **Target coverage kode UNKNOWN** (asumsi ≥80% untuk `domain/` + `services/`) | Laporan coverage Vitest; grep nama test R1–R7 |

**Ambang yang belum diketahui:** konkurensi beban NFR-7; RTO/RPO; target coverage kode; jumlah ulangan burn-in. Semuanya dicatat sebagai asumsi di bawah dan harus dikonfirmasi PM/tech lead sebelum `nfr-assess`.

**Batas penilaian:** status PASS/CONCERNS/FAIL final ditetapkan di `bmad-testarch-nfr` setelah bukti implementasi ada.

---

### Kekhawatiran Testability dan Celah Arsitektur

**🚨 KEKHAWATIRAN YANG HARUS DITINDAKLANJUTI**

#### 1. Penghambat umpan balik cepat

| Kekhawatiran | Dampak | Yang harus disediakan arsitektur | Pemilik | Timeline |
| --- | --- | --- | --- | --- |
| **Use-case terikat Fastify / singleton modul** | Test konkurensi tidak bisa memanggil use-case nyata dari worker | B-1: `createServices({ db, clock })`, `createDb(path, opts)` | Tech lead | Sprint 0 |
| **`busy_timeout=5000` tetap** | Test pemetaan `SQLITE_BUSY → 503` butuh ≥5 detik per kasus | `busyTimeoutMs` bisa disuntik di `createDb` (bawaan tetap 5000) | Dev backend | Sprint 0 |
| **Semantik `KELASKU_FAKE_NOW` belum ditulis** | E2E R5 dan kelas Selesai tidak deterministik | B-2(a): instan beku, dibaca saat start | Dev backend | Sprint 0 |
| **Seed tanpa kelas Selesai dan admin non-interaktif** | Tidak bisa menguji "pendaftaran ditutup" di E2E dan tidak bisa login otomatis | B-2(b), B-2(c) | Dev backend | Sprint 0 |

#### 2. Perbaikan arsitektur yang dibutuhkan

1. **Registri kode error lengkap dengan status HTTP** (HP-2)
   - **Masalah:** status HTTP untuk tujuh kode error tidak ditetapkan, sehingga tiap handler bisa memilih status sendiri.
   - **Perubahan:** `errors.ts` memuat `httpStatus` per kode; error-handler memetakan dari registri itu.
   - **Dampak bila tidak:** test mengunci status yang berbeda antar-story, dan fetch wrapper klien salah membedakan error bisnis dari error tak terduga.
   - **Pemilik:** tech lead · **Timeline:** Sprint 0
2. **Fitness test arsitektur** (HP-3), karena lint ditunda (spine §Deferred). **Pemilik:** tech lead · **Timeline:** Sprint 0
3. **`seed:perf` + skrip ukur** (HP-5). **Pemilik:** tech lead · **Timeline:** sebelum rilis MVP

---

### Ringkasan Testability

**📊 KONDISI SAAT INI — FYI**

#### Yang sudah kuat

- Inti domain murni (AD-6) membuat R3 (posisi), R6 (kelayakan), status kelas, dan validasi tanggal bisa diuji sebagai fungsi tanpa DB atau jam.
- `Clock` yang disuntik dan `ctx` per transaksi (AD-7) memungkinkan uji batas 23.30/06.00 WIB dan transisi ke Selesai tanpa menunggu jam asli.
- Semua logika bisnis bisa diakses lewat API (`/api/public`, `/api/admin`), sehingga data E2E bisa dibuat lewat API dan tiap test memakai kelasnya sendiri.
- Envelope error dengan `code` stabil (AD-8) dan DTO bersama berbasis zod (AD-20) memberi assertion deterministik dan skema siap pakai untuk validasi respons.
- Test DB = berkas SQLite sementara, satu per file test, sehingga test terisolasi dan bisa diparalelkan tanpa server DB.
- FIFO berdasarkan `id` (AD-15) tetap benar walaupun clock beku membuat semua `created_at` identik.

#### Trade-off yang diterima (tanpa tindakan)

- **Tidak ada endpoint seeding khusus test.** Data dibuat lewat API publik/admin; kondisi yang hanya bisa dicapai lewat waktu (Selesai) diambil dari `seed:demo` di E2E atau dari clock yang disuntik di integrasi.
- **Tidak ada metrik/tracing.** Untuk satu proses dan ±5 admin, log pino JSON sudah cukup.
- **Tidak ada failover/zero-downtime.** Instance tunggal sesuai NFR-6; upgrade dilakukan dengan menghentikan layanan.
- **Status/pembatalan publik tanpa verifikasi email** (R-013), diterima PRD §9.

Semua ini sesuai untuk MVP internal; ditinjau ulang bila skala atau kebutuhan keamanan berubah.

---

### Rencana Mitigasi Risiko Tinggi (≥6)

#### R-001: Kursi terakhir diambil dua pendaftaran (skor 6) — KRITIS untuk SM-1

1. Use-case daftar membaca kuota, `COUNT(Terdaftar)`, dan antrean di dalam `withWriteTx` (`BEGIN IMMEDIATE`); tidak ada `await` di dalam `fn`.
2. Tidak ada kolom counter; status ditentukan oleh fungsi domain.
3. (Opsional, Deferred) trigger DB sebagai backstop.

**Pemilik:** dev backend · **Timeline:** Epik 1 · **Status:** Direncanakan · **Verifikasi:** P0-001 dan P0-005 hijau di burn-in ×20 · **Residual:** rendah setelah verifikasi.

#### R-002: Pendaftaran aktif ganda (skor 6) — KRITIS

1. `normalizeEmail` hanya di `src/shared/`, dipakai sebelum setiap simpan dan cari.
2. Unique index parsial `(class_id, email) WHERE status IN ('registered','waitlisted')`.
3. Tangkap `SQLITE_CONSTRAINT_UNIQUE` di luar transaksi → baca ulang → 200 `alreadyActive`.

**Pemilik:** dev backend · **Timeline:** Epik 1 · **Status:** Direncanakan · **Verifikasi:** P0-002 + P1 normalisasi · **Residual:** rendah.

#### R-003: Promosi ganda / melampaui kuota saat pembatalan bersamaan (skor 6) — KRITIS

1. Satu tx-step `cancelRegistration` dengan `UPDATE … WHERE status=@expected` dan cek `changes===1`.
2. `promoteFromWaitlist` hanya bila status sebelumnya `registered`; jumlahnya `min(kuota − COUNT, panjang antrean)`.
3. `CHECK` konsistensi `cancelled_at`/`cancelled_by` di skema.

**Pemilik:** dev backend · **Timeline:** epik pembatalan · **Status:** Direncanakan · **Verifikasi:** P0-003, P0-004 · **Residual:** rendah.

#### R-005: "Hari ini" salah zona (skor 6) — TINGGI

1. `src/server/clock.ts` dengan `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })` sebagai satu-satunya sumber.
2. Fitness test (HP-3) melarang `new Date()`/`Date.now()`/`toISOString().slice(0,10)` di `domain/` dan `services/`.
3. Klien tidak menghitung "hari ini"; ia memakai `today` dari respons API (AD-20).

**Pemilik:** dev backend · **Timeline:** Sprint 0 · **Status:** Direncanakan · **Verifikasi:** P0-006, unit batas clock dengan `TZ=UTC` · **Residual:** rendah.

#### R-008: Test konkurensi memberi rasa aman palsu (skor 6) — TINGGI

1. B-1: komposisi service yang bisa diimpor worker.
2. Harness `runConcurrently(n, task)`: `n` worker, masing-masing dengan koneksi sendiri ke berkas yang sama, mulai serentak lewat barrier `SharedArrayBuffer` + `Atomics.wait`.
3. Kontrol negatif sekali di Sprint 0: varian use-case yang sengaja mengecek kuota di luar transaksi harus **gagal** di harness. Ini bukti bahwa harness memang bisa menangkap race.

**Pemilik:** tech lead · **Timeline:** Sprint 0 · **Status:** Direncanakan · **Verifikasi:** kontrol negatif merah, implementasi asli hijau ×20 · **Residual:** rendah.

#### R-016: E2E tidak deterministik / terblokir (skor 6) — TINGGI

1. B-2(a–c).
2. Kelas hasil seed hanya dibaca; test yang mengubah data membuat kelasnya sendiri lewat API admin.
3. Satu DB baru per run Playwright (`DATABASE_PATH=./data/e2e.db`, dihapus sebelum `seed:demo`).

**Pemilik:** dev backend · **Timeline:** Sprint 0 · **Status:** Direncanakan · **Verifikasi:** suite E2E hijau 3× berturut-turut dengan `--workers=4` · **Residual:** rendah.

---

### Asumsi dan Dependensi

#### Asumsi

1. Proses produksi tunggal (AD-1); sumber race nyata adalah dua koneksi (worker test, skrip CLI) atau `await` yang menyela cek-lalu-tulis. better-sqlite3 sinkron menserialkan request di dalam satu proses.
2. NFR-7 diukur sebagai respons server dengan klien berurutan (konkurensi 1) **ditambah** satu skenario ledakan 20 pendaftaran paralel (selaras FR-8). Tingkat konkurensi resmi UNKNOWN; ini opsi paling sederhana sampai PM menetapkannya.
3. RTO/RPO: RPO ≤ 24 jam tersirat dari backup harian; RTO tidak ditetapkan (bergantung lembaga).
4. "Lulus berulang kali" (NFR-1) = 20 run berturut-turut tanpa gagal.
5. Target coverage kode ≥80% untuk `src/server/domain` dan `src/server/services`; tidak ada target untuk `client/`.
6. Belum ada platform CI (spine §Deferred); gate dijalankan lokal sebelum commit.

#### Dependensi

1. B-1 dan B-2 selesai — sebelum story pertama Epik 1.
2. Keputusan HP-4 (playwright-utils) — sebelum E2E pertama ditulis.
3. `seed:perf` + skrip ukur (HP-5) — sebelum rilis MVP.
4. Keputusan lembaga soal operator/lokasi backup — sebelum go-live.

#### Risiko terhadap rencana

- **Risiko:** target MVP 1 minggu (PRD §9) memeras waktu test, dan tidak ada QA khusus.
  - **Dampak:** P2/P3 dan uji kinerja terpotong.
  - **Kontinjensi:** P0 dan test aturan R1–R7 tidak boleh dipotong. P2/P3 boleh ditunda ke pasca-MVP lewat waiver tertulis; urutan potong mengikuti FR SHOULD (FR-17, FR-18, FR-20).

---

**Akhir dokumen arsitektur.**

**Langkah berikut, tim arsitektur:** tinjau Panduan Cepat dan putuskan B-1/B-2 serta HP-1..HP-5; konfirmasi asumsi 2–5; beri umpan balik ke QA.

**Langkah berikut, QA/dev:** setelah blocker selesai, ikuti `test-design-qa.md` (setup Sprint 0, lalu skenario P0).
