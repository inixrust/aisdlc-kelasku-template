---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-11-04'
workflowType: 'testarch-test-design'
runScope: 'epic-level'
runKey: 'epic-1'
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/deferred-work.md
  - _bmad-output/test-artifacts/test-design-architecture.md
  - _bmad-output/test-artifacts/test-design-qa.md
  - _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md
---

# Test Design: Epic 1 - Kelas & Pendaftaran Berkuota (R1–R3, R7)

**Tanggal:** 2026-11-04
**Penulis:** Murat (TEA) untuk Rustan
**Status:** Draft
**Turunan dari:** `test-design-architecture.md` + `test-design-qa.md` (level sistem, 2026-11-02). ID risiko sistem (R-0xx) dan ID skenario sistem (P0-001 dst.) dipakai ulang supaya bisa dilacak; dokumen ini menskor ulang risiko untuk keadaan Epik 1 per 2026-11-04.

---

## Ringkasan Eksekutif

**Cakupan:** test design level epik untuk Epik 1, yaitu Story 1.1–1.12, FR1–FR10, R1, R2, R3, R7. Story 1.1–1.5 berstatus `review` dan test-nya sudah ada; rencana ini berfokus pada Story 1.6–1.12 (`backlog`) dan menjaga test 1.1–1.5 sebagai regresi.

**Ringkasan risiko:**

- Total risiko: 20 (4 tinggi, 9 sedang, 7 rendah). Tidak ada skor 9.
- Risiko tinggi (≥6): R-001, R-002, R-022, R-023.
- Kategori kritis: **DATA** (R1/R2 di bawah konkurensi), **BUS** (batas Selesai yang bertentangan antardokumen), **OPS** (E2E browser tidak bisa dijalankan di mesin dev).

**Ringkasan coverage:**

- P0: 9 test dalam 6 baris (~12–20 jam)
- P1: 28 test (~22–38 jam)
- P2/P3: 23 test (~10–21 jam)
- **Total:** 60 test baru, **~44–79 jam** (≈1–2 minggu untuk satu orang; ≈2–4 hari bila dibagi 3 dev bersama implementasi story)

---

## Di Luar Cakupan

| Item | Alasan | Mitigasi |
| --- | --- | --- |
| **Pembatalan, promosi karena batal, halaman status (R4, FR11–FR14)** | Epik 2 | `promoteFromWaitlist` dari Story 1.11 diuji di sini lewat jalur kenaikan kuota; R-003 diuji di Epik 2 |
| **Presensi, penguncian tanggal berpresensi, `confirmation_required` (R5, FR15–FR16, bagian FR3)** | Epik 3; A-3 memindahkan bagian FR3 ke Story 3.4 | Di Epik 1 hanya diff tanggal (insert/delete) yang diuji (R-010) |
| **Kelayakan, rekap, CSV (R6, FR19–FR22)** | Epik 4 | — |
| **Bukti p95 penuh NFR7, HTTPS produksi** | Story 4.6 dan 4.7 | Epik 1 hanya smoke kinerja tabel kelas (<1 s pada 240 kelas) |
| **Non-goal MVP** (pembayaran, SSO, notifikasi, multi-tenant, PDF sertifikat, ujian) | `docs/intent-kelasku.md` | Tidak dibangun, jadi tidak diuji |
| **Test komponen React terisolasi** | Tidak ada alat component testing di stack; Vitest berjalan di environment `node` | Perilaku UI dicakup E2E; logika ada di domain/server |
| **Contract testing (Pact)** | Satu package; klien dan server berbagi `src/shared/dto.ts` + zod | `npm run typecheck` + validasi skema di test API |

---

## Penilaian Risiko

Kolom "Sistem" menunjukkan skor di dokumen level sistem. Skor berubah hanya bila ada bukti baru di repositori atau di `epics.md`.

### Risiko Prioritas Tinggi (Skor ≥6)

| Risk ID | Kategori | Deskripsi | Probabilitas | Dampak | Skor | Sistem | Mitigasi | Pemilik | Timeline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **R-001** | DATA | Dua pendaftaran bersamaan mengambil kursi terakhir sehingga Terdaftar > kuota. Sumber: FR8 ("Terdaftar tidak pernah melebihi kuota"), SM-1. | 2 | 3 | **6** | 6 | `assertClassOpen` → `COUNT` → keputusan → insert di satu `withWriteTx` (`BEGIN IMMEDIATE`), callback sinkron; tanpa kolom counter | Dev backend | Story 1.7 |
| **R-002** | DATA | Klik ganda atau email beda kapitalisasi/spasi menghasilkan dua pendaftaran aktif, atau `SQLITE_CONSTRAINT_UNIQUE` bocor sebagai 5xx. Sumber: FR9, AD-5. | 2 | 3 | **6** | 6 | `normalizeEmail` dari `src/shared/`; cek aktif di transaksi + unique index parsial; constraint → baca ulang → `alreadyActive`; tombol "Mendaftar…" nonaktif | Dev backend + frontend | Story 1.7, 1.8 |
| **R-022** | BUS | Batas Selesai diimplementasikan mengikuti spine AD-6 (`max(session_date) < today`, `ARCHITECTURE-SPINE.md` baris 87, belum diperbarui) dan bukan PRD/epics (`<=`, A-7/A-9a). Akibatnya pendaftaran tetap diterima sepanjang hari sesi terakhir (melanggar FR7), tabel menampilkan sesi berikutnya alih-alih "Selesai" (FR4), dan kuota bisa diubah di hari terakhir (FR3). AGENTS.md menyatakan AD-1..AD-20 mengikat, jadi agen dev cenderung mengikuti spine. | 3 | 2 | **6** | — | Perbarui spine AD-6/AD-18 lewat `bmad-architecture` atau `bmad-correct-course` sebelum Story 1.6 (A-9); kunci batas dengan test unit `classStatus` dan test `*.tz.test.ts` FR7 | Tech lead | Sebelum Story 1.6 |
| **R-023** | OPS | E2E browser tidak bisa dijalankan di mesin dev karena Chromium gagal start (`libnspr4` hilang, `deferred-work.md`). Story UI 1.6, 1.8, 1.9, 1.10, 1.12 berisiko di-commit tanpa bukti E2E/axe lokal, padahal AGENTS.md mewajibkan semua test hijau sebelum commit. | 3 | 2 | **6** | — | `npx playwright install-deps chromium` di mesin dev; job E2E di `.github/workflows/test.yml` menjadi gate wajib PR; story UI tidak boleh pindah ke `done` tanpa run E2E hijau | Tech lead | Sebelum Story 1.6 |

### Risiko Prioritas Sedang (Skor 3–5)

| Risk ID | Kategori | Deskripsi | Probabilitas | Dampak | Skor | Sistem | Mitigasi | Pemilik |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-004 | BUS | Pendaftar baru menyalip antrean: diterima Terdaftar saat ada kursi tetapi antrean tidak kosong, atau kursi dari kenaikan kuota jatuh ke pendaftar baru (FR8, FR10, FR3) | 2 | 2 | 4 | 4 | Syarat "antrean kosong" di keputusan domain; `promoteFromWaitlist` di transaksi ubah kuota (AD-19) | Dev backend |
| R-005 | BUS | "Hari ini" bukan WIB pada logika baru Epik 1: validasi tanggal buat kelas, status Selesai, penutupan pendaftaran 00.00 WIB, `nextSessionDate` (NFR2) | 2 | 2 | 4 | 6 | `ctx.today` dari `Clock`; fitness test melarang `new Date()`/`Date.now()` di `domain/`/`services/`; klien memakai `today` dari respons | Dev backend |
| R-009 | DATA | `assertClassOpen` tidak menjadi baca pertama di salah satu use-case tulis (daftar, ubah kuota, ubah tanggal, promosi), sehingga kelas Selesai masih menerima perubahan (AD-18) | 2 | 2 | 4 | 4 | Satu penjaga; test per use-case untuk kelas Selesai | Dev backend |
| R-014 | PERF | Tabel kelas pada ±240 kelas melewati 1 s atau memakai N+1 query (FR4, NFR7) | 2 | 2 | 4 | 4 | Jumlah query tetap per request; indeks `registrations(class_id, status, id)` | Dev backend |
| R-016 | OPS | E2E tidak deterministik: `seed:demo` belum memuat kelas Penuh/antrean/Selesai (B-2b, Story 1.7), test E2E mengubah kelas seed bersama | 2 | 2 | 4 | 6 | Seed relatif ke `Clock`; kelas seed hanya dibaca; test yang mengubah data membuat kelas sendiri lewat API | Dev backend |
| R-017 | BUS | Pelanggaran WCAG 2.1 AA atau gulir horizontal di 360 px pada halaman pendaftaran, tabel kelas, halaman kelas, formulir buat/ubah (NFR3, NFR4) | 2 | 2 | 4 | 4 | Komponen bersama; axe di setiap state; `scrollWidth <= clientWidth` | Dev frontend |
| R-028 | OPS | Pola bukti FR8 (50 ulangan per run CI untuk R1 worker, R1 HTTP, R2 worker, R2 HTTP, R7, ditambah mutation check) membuat `npm test` lambat, sehingga tim tergoda menurunkan ulangan atau melewati test lokal | 2 | 2 | 4 | — | Ukur durasi per skenario; pakai ulang worker (`stopConcurrencyWorkers` sekali per berkas); kelas kecil per ulangan; anggaran durasi ditetapkan tech lead | Tech lead |
| R-007 | DATA | Penurunan kuota berpacu dengan pendaftaran sehingga Terdaftar > kuota akhir (R7, FR3) | 1 | 3 | 3 | 2 | `COUNT(Terdaftar)` dibaca di transaksi ubah kuota | Dev backend |
| R-008 | TECH | Test konkurensi R1/R2/R7 lulus palsu: berjalan di satu koneksi, atau mutasi non-atomik tidak terdeteksi | 1 | 3 | 3 | 6 | Harness `runConcurrently` sudah terbukti (kontrol negatif + positif ×50, Story 1.3); setiap test R wajib punya mutation check | Tech lead |

> R-008 turun dari 6 ke 3 karena `test/helpers/concurrency.test.ts` sudah membuktikan harness menangkap race. R-007 naik dari 2 ke 3 karena dampaknya sama dengan R1 bila terjadi. Prioritas test-nya tetap P0 (prioritas tidak ditentukan oleh skor).

### Risiko Prioritas Rendah (Skor 1–2)

| Risk ID | Kategori | Deskripsi | Probabilitas | Dampak | Skor | Tindakan |
| --- | --- | --- | --- | --- | --- | --- |
| R-010 | DATA | Ubah tanggal menghapus semua sesi lalu menyisipkan ulang (bukan diff), sehingga id sesi berubah; dampak baru terasa di Epik 3 (AD-19) | 1 | 2 | 2 | Test diff id sesi tetap |
| R-011 | SEC | Rute admin baru (Story 1.6, 1.9–1.11) lolos dari hook auth (FR1) | 1 | 2 | 2 | Test enumerasi `onRoute` Story 1.4 otomatis mencakup rute baru |
| R-015 | OPS | Migrasi yang sudah di-merge diedit alih-alih menambah berkas bernomor baru (DoD epics) | 1 | 2 | 2 | Review PR; test `migrate` yang ada |
| R-019 | TECH | Aturan lapisan terkikis (SQL di luar `data/`, `INSERT`/`UPDATE` `registrations` di luar `registrations-repo.ts`) | 1 | 2 | 2 | Fitness test HP-3 ada; tambah aturan repo tunggal |
| R-020 | OPS | Ledakan pendaftaran memicu `SQLITE_BUSY` → 503 bagi peserta (FR8 "tanpa 5xx") | 1 | 2 | 2 | Dicakup test HTTP serentak P0 |
| R-024 | SEC | ID internal, email, atau ref berurutan bocor di API/URL publik (AD-10, FR7, UX-DR22) | 1 | 2 | 2 | Test DTO publik + 1.000 ref unik |
| R-025 | BUS | Posisi antrean berbeda antara hasil pendaftaran dan halaman kelas admin (FR10) | 1 | 2 | 2 | Satu fungsi domain posisi; test kesamaan posisi |

### Legenda Kategori Risiko

- **TECH**: arsitektur/integrasi · **SEC**: keamanan · **PERF**: kinerja · **DATA**: integritas data · **BUS**: dampak bisnis/UX · **OPS**: operasi/deployment

---

## Perencanaan NFR

**Tujuan:** mencatat ambang NFR Epik 1, validasi yang direncanakan, dan bukti untuk `bmad-testarch-nfr` nanti. Ini bukan audit bukti final.

| Kategori NFR | Kebutuhan / ambang | Risk Link | Validasi yang direncanakan | Bukti yang dibutuhkan |
| --- | --- | --- | --- | --- |
| Keandalan/konsistensi (NFR1) | R1/R2/R7 di satu transaksi; > 1 koneksi; tanpa 5xx; mutation check gagal tanpa atomisitas; 50 ulangan per run CI semuanya lulus | R-001, R-002, R-007, R-008, R-020 | Test P0 worker + HTTP serentak + mutation check | Laporan Vitest CI dengan nomor ulangan; log durasi |
| Keamanan (NFR8) | 401 di semua `/api/admin/*`; validasi zod di server; DTO publik tanpa ID internal; log tanpa email/nama | R-011, R-024 | Enumerasi rute (ada), test DTO publik, test log saat daftar | Laporan Vitest |
| Kinerja (NFR7, smoke) | Tabel kelas, tampilan bawaan dan `?finished=all`, < 1 s pada 240 kelas; jumlah query tetap | R-014 | Test integrasi waktu respons + penghitung query | Laporan Vitest (waktu tercatat) |
| Zona waktu (NFR2) | "Hari ini" = Asia/Jakarta; pendaftaran tutup 00.00 WIB tanggal sesi terakhir | R-005, R-022 | `*.tz.test.ts` di UTC, Asia/Jakarta, Asia/Jayapura | Laporan 3 project tz Vitest |
| Aksesibilitas & tata letak (NFR3, NFR4) | WCAG 2.1 AA; 360 px tanpa gulir horizontal; admin 1366×768 tabel tanpa gulir | R-017, R-023 | axe di setiap permukaan/state; cek `scrollWidth` | Laporan HTML Playwright dari CI |
| Maintainability (NFR9) | Setiap test R1/R2/R3/R7 menyebut ID aturan di nama | R-019 | `grep -rE "R[1237]:"` atas berkas test | Keluaran grep di PR |

**Ambang yang belum diketahui:** anggaran durasi `npm test` dengan 50 ulangan (R-028); target coverage kode (system-level berasumsi ≥80% `domain/` + `services/`, belum dikonfirmasi); tingkat konkurensi beban NFR7 (di luar Epik 1). Tidak ada nilai yang ditebak di sini.

---

## Kriteria Masuk

- [ ] Story 1.1–1.5 pindah dari `review` ke `done` dan test-nya hijau di CI
- [ ] **R-022:** spine AD-6/AD-18 diperbarui ke `max(session_date) <= today` sebelum Story 1.6 di-build (A-9)
- [ ] **R-023:** Chromium bisa start di mesin dev (`npx playwright install-deps chromium`), atau tim menyepakati job E2E CI sebagai gate wajib untuk story UI
- [ ] Helper test tersedia: `createTestDb`, `fixedClock`, `runConcurrently`, `repeatConcurrent`, `startTestServer`, `uniqueEmail`/`uniqueTitle` (sudah ada)
- [ ] Seam mutation check disepakati: tx-step use-case diekspor terpisah dari pembungkus `withWriteTx`, sehingga test bisa merakit varian non-atomik tanpa mengubah kode produksi
- [ ] `seed:demo` memuat kelas Penuh tanpa antrean, Penuh dengan 3 Daftar tunggu, dan Selesai dengan Terdaftar + Daftar tunggu (B-2b) sebelum E2E Story 1.8/1.9

## Kriteria Keluar

- [ ] Semua test P0 lulus, termasuk 50/50 ulangan di run CI
- [ ] Setiap mutation check (R1, R2, R7) terbukti merah terhadap mutannya
- [ ] P1 lulus ≥95%; kegagalan sisanya punya waiver dengan pemilik dan tanggal
- [ ] Tidak ada bug terbuka berseverity tinggi; R-001, R-002, R-022, R-023 bermitigasi dan terverifikasi
- [ ] Test R1, R2, R3, R7 menyebut ID aturan di nama `describe`/`it`
- [ ] E2E Epik 1 hijau di CI 3 run berturut-turut (R-016)

---

## Rencana Coverage Test

**Catatan:** P0/P1/P2/P3 menyatakan **prioritas dan risiko**, bukan waktu eksekusi. Waktu eksekusi ada di bagian Strategi Eksekusi.

**Level:** **Unit** = fungsi murni (`domain/`, `shared/`). **Integrasi** = use-case + berkas SQLite sementara nyata, termasuk worker multi-koneksi. **API** = `fastify.inject()`, atau HTTP nyata lewat `startTestServer()` bila disebut. **E2E** = Playwright atas build produksi, `timezoneId: 'UTC'`, project `admin-desktop` (1366×768) atau `participant-mobile` (360×740). Setiap perilaku diuji di satu level; E2E hanya untuk perjalanan pengguna, a11y, dan tata letak.

**ID test:** `1.{story}-{LEVEL}-{seq}`; kolom Notes menyebut ID sistem bila ada.

### P0 (Kritis)

**Kriteria:** dampak kritis pada bisnis, keamanan, integritas data, atau kepatuhan, tanpa jalan pintas yang aman. Skor risiko hanya bukti pendukung.

| Test ID | Kebutuhan | Level | Risk Link | Jumlah | Pemilik | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1.7-INT-001 | R1: 20 pendaftaran serentak (worker, koneksi terpisah) ke kelas kuota 5 → tepat 5 Terdaftar, 15 Daftar tunggu dengan posisi 1–15 tanpa celah/duplikat, tanpa error; ×50. **Plus** mutation check: varian yang membaca `COUNT` di luar `withWriteTx` gagal ≥1 kali dalam 50 ulangan | Integrasi (worker) | R-001, R-008, R-028 | 2 | Dev backend | P0-001. Race hanya nyata lewat > 1 koneksi; mock DB tidak membuktikan transaksi (AD-14) |
| 1.7-API-001 | R1: 20 `POST /api/public/classes/:code/registrations` serentak lewat HTTP ke `startTestServer()` → semua 200 (tanpa 503), 5/15, posisi 1–15; ×50 | API (HTTP nyata) | R-001, R-020 | 1 | Dev backend | A-11; `inject` tidak cukup karena FR8 menuntut "tanpa 5xx" end-to-end |
| 1.7-INT-003 | R2: dua pendaftaran identik serentak (termasuk `"Budi@Mail.com "` vs `"budi@mail.com"`) → satu baris aktif; keduanya 200 dengan status sama, satu `alreadyActive: false`, satu `true`; ×50. **Plus** mutation check: tanpa cek aktif di transaksi dan tanpa unique index parsial → gagal | Integrasi (worker) | R-002, R-008 | 2 | Dev backend | P0-002 |
| 1.7-API-002 | R2: skenario duplikat yang sama lewat HTTP ke `startTestServer()`; ×50 | API (HTTP nyata) | R-002, R-020 | 1 | Dev backend | Membuktikan pemetaan constraint → 200, bukan 5xx |
| 1.11-INT-001 | R7: penurunan kuota berpacu dengan pendaftaran → di setiap ulangan Terdaftar ≤ kuota akhir, tanpa 5xx; ×50. **Plus** mutation check: `COUNT` di luar transaksi ubah kuota → gagal | Integrasi (worker) | R-007, R-001, R-008 | 2 | Dev backend | P0-005; acak urutan start |
| 1.9-E2E-001 | Smoke UJ-1 + UJ-2: admin membuat kelas kuota 2 → dua peserta (360 px) Terdaftar → tabel "2/2" + badge "Penuh" → peserta ketiga "Daftar tunggu #1" → kolom Daftar tunggu = 1 setelah muat ulang; axe tanpa pelanggaran | E2E | R-001, R-016, R-023 | 1 | Dev frontend | P0-009; satu-satunya E2E P0 |

**Regresi P0 yang sudah ada:** P0-008 (setiap `/api/admin/*` tanpa sesi → 401, rute ditemukan lewat `onRoute`) di `src/server/http/auth.test.ts` otomatis mencakup rute admin baru Story 1.6–1.11 (R-011). Tidak dihitung ulang.

**Total P0:** 9 test, ~12–20 jam

### P1 (Tinggi)

**Kriteria:** perilaku inti, sering dipakai, atau kompleks, dengan jangkauan pengguna besar dan jalan pintas terbatas.

| Test ID | Kebutuhan | Level | Risk Link | Jumlah | Pemilik | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1.6-UNIT-001 | FR2: `validateSessionDates`: kosong ditolak; ganda ditolak dengan pesan menyebut tanggal + kunci `sessionDates.<i>`; tanpa tanggal > `today` ditolak; `[today]` ditolak, `[today, today+1]` dan `[today-7, today+1]` diterima | Unit | R-022, R-005, R-010 | 1 | Dev backend | P1-003 (direvisi: "setelah" hari ini, bukan "≥") |
| 1.6-UNIT-002 | `classStatus`: Selesai bila `max(session_date) <= today`, termasuk sepanjang tanggal sesi terakhir; Dibuka bila ada tanggal > today | Unit | R-022 | 1 | Dev backend | **Menggantikan** P1-009 sistem ("sesi terakhir = hari ini masih Dibuka"), yang sudah tidak berlaku sejak PRD revisi |
| 1.6-API-001 | `POST /api/admin/classes` valid → 201 DTO: `id`, `publicCode` 10 karakter base64url, tanggal terurut, kuota, `today`; kelas + sesi tersimpan dalam satu transaksi | API | R-024 | 1 | Dev backend | |
| 1.6-API-002 | FR2: judul di-trim 1–120; kuota bilangan bulat ≥ 1 → 400 `validation_error` dengan `fields` per kolom dan pesan Indonesia | API | — | 1 | Dev backend | P1-004; `it.each` |
| 1.6-E2E-001 | UJ-1 langkah 1–4: Buat kelas (Tambah tanggal, Simpan kelas) → toast "Kelas tersimpan" → kepala kelas (`<h1>`, badge, tanggal "Senin, 9 Nov 2026", penanda "Hari ini", tautan) → Salin tautan; error duplikat tampil di baris tanggal + ringkasan; axe | E2E | R-017, R-023 | 1 | Dev frontend | P1-024 |
| 1.7-UNIT-001 | Keputusan pendaftaran: Terdaftar ⇔ `registered < quota` **dan** antrean kosong; status Penuh bila Dibuka dan Terdaftar = kuota; posisi 1-based urut `id` | Unit | R-001, R-004, R-025 | 1 | Dev backend | P1-012; tabel kasus `it.each` |
| 1.7-INT-005 | R3: pendaftaran baru masuk ekor antrean bila antrean tidak kosong walau ada kursi | Integrasi | R-004 | 1 | Dev backend | P1-013; state disiapkan lewat repository |
| 1.7-INT-006 | R3: FIFO menurut `id` saat `created_at` identik (clock beku) | Integrasi | R-004 | 1 | Dev backend | P1-014 |
| 1.7-API-004 | R2 serial: `"Budi@Mail.com "` aktif lalu `"budi@mail.com"` mendaftar → tanpa baris baru, 200 `alreadyActive: true` + posisi bila Daftar tunggu | API | R-002 | 1 | Dev backend | P1-016 |
| 1.7-INT-007 | AD-5: `SQLITE_CONSTRAINT_UNIQUE` dari insert kedua dipetakan ke 200 `alreadyActive`, bukan 5xx | Integrasi | R-002, R-020 | 1 | Dev backend | P1-020; paksa jalur lewat repository |
| 1.7-API-005 | FR7: kelas Selesai → 409 `registration_closed` "Pendaftaran kelas ini sudah ditutup", tanpa baris; `*.tz.test.ts` sesi terakhir 10 Nov: `2026-11-09T16:59Z` diterima, `2026-11-09T17:00Z` dan `2026-11-10T16:30Z` ditolak, di 3 zona proses | API | R-022, R-005, R-009 | 1 | Dev backend | P1-018 |
| 1.7-API-006 | FR7: nama 1–100, format email → 400 `validation_error` + `fields` Indonesia | API | — | 1 | Dev backend | P1-019 |
| 1.7-API-007 | AD-10: `GET /api/public/classes/:code` tanpa id internal, kuota, data peserta; respons daftar tanpa id internal; 1.000 `registrationRef` unik dan tidak berurutan | API | R-024 | 1 | Dev backend | P1-011 (bagian publik) |
| 1.7-INT-009 | B-2b: `seed:demo` memuat kelas Penuh tanpa antrean, Penuh dengan 3 Daftar tunggu, dan Selesai dengan Terdaftar + Daftar tunggu, relatif ke `today` dari `Clock`; idempoten | Integrasi | R-016 | 1 | Dev backend | Prasyarat E2E 1.8/1.9 |
| 1.8-E2E-001 | UJ-2 di 360×740: buka `/daftar/{kode}` → isi → `ResultPanel` "Terdaftar" + "Sesi berikutnya", fokus ke judul panel, `role="status"`; tanpa gulir horizontal; axe | E2E | R-017, R-023 | 1 | Dev frontend | |
| 1.8-E2E-002 | Kelas Penuh: alert warning "Kelas penuh — Anda akan masuk daftar tunggu"; kursi terakhir diambil peserta lain sebelum submit → "Daftar tunggu #N" tanpa kata "gagal"/warna merah | E2E | R-001, R-004 | 1 | Dev frontend | Peserta lain didaftarkan lewat API di tengah test |
| 1.8-E2E-003 | Klik ganda "Daftar" → tombol "Mendaftar…" nonaktif, satu pendaftaran | E2E | R-002 | 1 | Dev frontend | P1-025 |
| 1.8-E2E-004 | Kelas Selesai: info kelas + alert "Pendaftaran kelas ini sudah ditutup" tanpa formulir; kode tak dikenal → "Kelas tidak ditemukan. Periksa kembali tautan dari penyelenggara." | E2E | R-022, R-009 | 1 | Dev frontend | Memakai kelas Selesai dari seed (hanya dibaca) |
| 1.9-API-001 | FR4: `GET /api/admin/classes`: field per kelas, `nextSessionDate` null untuk Selesai termasuk hari sesi terakhir, urutan dari server, tampilan bawaan (Dibuka + Selesai 30 hari terakhir), `?finished=all`, `hiddenFinishedCount`, `today` | API | R-022, R-005 | 1 | Dev backend | P1-010 (direvisi) |
| 1.9-E2E-002 | Tabel kelas: `<caption>`, `<th scope>`, judul bertautan, badge "Penuh" ikon + teks, "Tampilkan semua kelas Selesai (N)" memuat semua kelas tanpa paginasi, 4 kolom tanpa gulir di 1366×768; axe | E2E | R-017, R-023 | 1 | Dev frontend | |
| 1.10-API-001 | FR5: `GET /api/admin/classes/:id` memuat `registered`, `waitlisted` (posisi dari domain), `cancelled`, masing-masing terurut dari server, satu query per tabel | API | R-025, R-014 | 1 | Dev backend | |
| 1.10-INT-001 | R3: posisi antrean sama di hasil pendaftaran dan halaman kelas admin | Integrasi | R-025, R-004 | 1 | Dev backend | Nama test di epics: `R3: waitlist position is identical on the registration result and the admin class page` |
| 1.11-API-001 | R7: kuota 12 pada kelas dengan 14 Terdaftar → 409 `quota_below_registered`, "Kuota minimal 14 (jumlah terdaftar saat ini)" di `fields.quota`, tanpa perubahan | API | R-007 | 1 | Dev backend | P1-001 |
| 1.11-INT-003 | R3: kuota 5→8 dengan 5 Terdaftar + 2 antrean → kedua kepala naik dalam transaksi yang sama, `promoted_at = ctx.nowIso`, `promotedCount = 2`, `UPDATE … AND status='waitlisted'` dengan `changes === 1`; varian antrean lebih panjang → naik `min(kuota − Terdaftar, antrean)` | Integrasi | R-004 | 1 | Dev backend | P1-002; `it.each` untuk kedua varian |
| 1.11-INT-005 | AD-18: kelas Selesai (termasuk tanggal sesi terakhir) → ubah kuota/tanggal 409 `class_finished`, tanpa promosi; ubah judul saja berhasil | Integrasi | R-009, R-022 | 1 | Dev backend | P1-008 |
| 1.11-INT-006 | AD-19: ubah tanggal = diff (insert/delete); id sesi yang tidak berubah tetap | Integrasi | R-010 | 1 | Dev backend | P1-005 |
| 1.11-API-002 | FR6: `publicCode` tidak berubah setelah judul diubah | API | R-024 | 1 | Dev backend | P1-011 (bagian stabilitas) |
| 1.12-E2E-001 | Ubah kelas: kuota 12 vs 14 Terdaftar → pesan di kolom kuota, ringkasan error menerima fokus, nilai lain tetap; kuota naik → toast "Kelas tersimpan. N peserta naik dari daftar tunggu." dan penanda promosi di bagian Terdaftar; axe | E2E | R-007, R-004, R-017 | 1 | Dev frontend | Kelas dibuat sendiri lewat API, bukan kelas seed |

**Total P1:** 28 test, ~22–38 jam

### P2 (Sedang)

**Kriteria:** perilaku sekunder, jangkauan pengguna lebih sempit, ada jalan pintas yang dapat diterima.

| Test ID | Kebutuhan | Level | Risk Link | Jumlah | Pemilik | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1.6-API-003 | `GET /api/admin/classes/:id` id tak dikenal → 404 `class_not_found` | API | — | 1 | Dev backend | |
| 1.6-E2E-002 | "Salin tautan" menyalin URL lengkap, label "Tautan disalin" 3 s via `aria-live`; clipboard ditolak → URL tetap tersedia sebagai teks | E2E | R-017 | 1 | Dev frontend | P2-008; izin clipboard di context |
| 1.7-API-008 | `GET /api/public/classes/:code` kode tak dikenal → 404 `class_not_found` | API | — | 1 | Dev backend | |
| 1.7-INT-010 | Skema `registrations`: tanpa `DEFAULT` waktu, `CHECK` status/GLOB/konsistensi pembatalan; hanya `registrations-repo.ts` yang `INSERT`/`UPDATE` `registrations` | Integrasi + statis | R-019, R-015 | 1 | Tech lead | Tambah aturan ke fitness test HP-3 |
| 1.7-INT-011 | R2: pendaftaran Dibatalkan boleh mendaftar lagi sebagai baris baru di ekor antrean | Integrasi | R-002 | 1 | Dev backend | State Dibatalkan via fixture repository; jalur pembatalan nyata diuji di Epik 2 |
| 1.7-INT-012 | NFR8: log pino saat pendaftaran tidak memuat email atau nama peserta | Integrasi | R-024 | 1 | Dev backend | Pola test log privacy Story 1.4 |
| 1.8-E2E-005 | `alreadyActive: true` → panel "Anda sudah terdaftar di kelas ini" / "Anda sudah di daftar tunggu #N" | E2E | R-002 | 1 | Dev frontend | |
| 1.8-E2E-006 | Email tidak valid → error di kolom, nama tetap; server tak terjangkau → alert "Tidak dapat menghubungi server. Coba lagi." dengan isi formulir utuh | E2E | — | 1 | Dev frontend | |
| 1.9-INT-001 | Tanpa N+1: jumlah query daftar kelas tetap untuk 240 kelas | Integrasi | R-014 | 1 | Dev backend | P2-021; hitung statement lewat wrapper `db` |
| 1.9-INT-002 | Smoke NFR7: kedua tampilan tabel kelas < 1 s pada 240 kelas | Integrasi | R-014 | 1 | Dev backend | Waktu dicatat sebagai bukti; p95 penuh di Story 4.6 |
| 1.9-E2E-003 | Belum ada kelas → "Belum ada kelas." + tombol "Buat kelas" | E2E | — | 1 | Dev frontend | DB kosong per test, atau API-level bila seed selalu berisi |
| 1.10-E2E-001 | Halaman kelas admin: breadcrumb, bagian Terdaftar/Daftar tunggu/Dibatalkan (`<details>` "Dibatalkan (N)", ✂2), penanda "Naik dari daftar tunggu · {waktu}", teks kosong; axe | E2E | R-017 | 1 | Dev frontend | P2-006 |
| 1.11-API-003 | Ubah tanggal tidak sah (nol tanggal, ganda, tanpa tanggal > today) → 400 dengan pesan yang sama seperti buat kelas | API | R-010 | 1 | Dev backend | Hanya memeriksa sambungan; logika di 1.6-UNIT-001 |
| 1.11-INT-008 | R3: kenaikan kuota serentak dengan pendaftaran baru → kursi baru selalu ke kepala antrean | Integrasi (worker) | R-004 | 1 | Dev backend | Tanpa mutation check; ×50 memakai harness yang sama |
| 1.12-E2E-002 | Kelas Selesai: tanggal + kuota hanya-baca dengan "Kelas sudah selesai; hanya judul yang bisa diubah"; hanya judul tersimpan; axe | E2E | R-009, R-022 | 1 | Dev frontend | |
| 1.12-E2E-003 | Perubahan belum tersimpan: `useBlocker` + `beforeunload`; tanpa peringatan setelah simpan | E2E | — | 1 | Dev frontend | P2-010 |
| X-OPS-001 | Durasi `npm test` per skenario konkurensi tercatat di setiap run CI | Skrip/CI | R-028 | 1 | Tech lead | Bukti untuk menetapkan anggaran durasi (UNKNOWN) |

**Total P2:** 17 test, ~8–16 jam

### P3 (Rendah)

**Kriteria:** jarang, kosmetik, atau eksploratif; dampak minimal; jalan pintas mudah.

| Test ID | Kebutuhan | Level | Risk Link | Jumlah | Pemilik | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1.6-UNIT-003 | `Badge` Daftar tunggu memakai token `warning`, bukan `danger` | Unit (statis) | R-017 | 1 | Dev frontend | |
| 1.5-UNIT-001 | `useResource`: jeda 300 ms "Memuat…", abaikan hasil basi, abort saat unmount, `retry` | Unit | — | 1 | Dev frontend | Celah deferred-work Story 1.5; perlu keputusan pendekatan render (tanpa jsdom saat ini) |
| 1.4-INT-001 | Login yang lolos scrypt tetapi password-nya diganti sebelum transaksi tulis tidak menghasilkan sesi | Integrasi (worker) | R-011 | 1 | Dev backend | Celah deferred-work Story 1.4 |
| 1.4-MAN-001 | Prompt password tersembunyi `admin:create` (backspace, Ctrl-C) di TTY | Manual | — | 1 | Dev backend | Celah deferred-work Story 1.4 |
| 1.8-MAN-001 | NVDA di alur pendaftaran (hasil diumumkan, fokus ke panel) | Manual | R-017 | 1 | Dev frontend | Bagian P3-002 |
| 1.7-EXP-001 | Eksploratif: matikan server di tengah ledakan pendaftaran → setelah restart `integrity_check` ok dan Terdaftar ≤ kuota | Manual | R-001 | 1 | Tech lead | P3-007 |

**Total P3:** 6 test, ~2–5 jam

---

## Strategi Eksekusi

**Filosofi:** semua skenario fungsional berjalan di setiap pull request selama suite tetap di bawah 15 menit; hanya pekerjaan yang mahal atau manual yang ditunda. Playwright paralel menjalankan ratusan test dalam 10–15 menit; suite Epik 1 jauh lebih kecil.

- **Pull request (CI `.github/workflows/test.yml`, juga lokal sebelum commit):** `npm run typecheck`, `npm test` (unit, integrasi, 3 project tz), termasuk **semua skenario konkurensi ×50 dan mutation check** (FR8 menuntut 50 ulangan di setiap run CI, jadi tidak dipindah ke nightly), dan `npm run test:e2e` (2 project). Karena R-023, job E2E CI adalah bukti E2E yang mengikat sampai Chromium bisa jalan di mesin dev.
- **Nightly:** tidak ada. Tidak ada suite Epik 1 yang cukup mahal untuk ditunda.
- **Sebelum menutup Epik 1 (pengganti weekly):** E2E 3 run berturut-turut di CI (R-016); test manual P3 (NVDA, prompt TTY, eksploratif matikan server).

Bila X-OPS-001 menunjukkan `npm test` melewati anggaran yang ditetapkan tech lead, kurangi biaya per ulangan (pakai ulang worker, kelas lebih kecil). Jangan turunkan jumlah ulangan di bawah 50 tanpa perubahan PRD FR8.

---

## Estimasi Sumber Daya

### Upaya Pengembangan Test

| Prioritas | Jumlah | Rentang upaya | Catatan |
| --- | --- | --- | --- |
| P0 | 9 | ~12–20 jam | Harness sudah ada; upaya utama di seam mutation check dan HTTP serentak |
| P1 | 28 | ~22–38 jam | Sebagian besar API/integrasi dengan helper yang ada; 7 E2E |
| P2 | 17 | ~8–16 jam | |
| P3 | 6 | ~2–5 jam | Separuh manual |
| **Total** | **60** | **~44–79 jam** | **≈1–2 minggu satu orang; ≈2–4 hari dibagi 3 dev** |

Rentang sudah memuat desain, implementasi, dan debug test, termasuk menyiapkan Chromium di mesin dev. Pemeliharaan (~10%) tidak termasuk.

### Prasyarat

**Data test:**

- Builder use-case (`givenClass`, `givenRegistrations`, `givenFullClassWithWaitlist`) di `test/helpers/` yang memanggil use-case, bukan SQL mentah. Pengecualian: state tidak sah (1.7-INT-005, 1.7-INT-011, 1.10 penanda promosi) memakai repository langsung.
- Data unik per test lewat `uniqueEmail()`/`uniqueTitle()`; tanpa faker (tidak ada di stack).
- `seed:demo` (B-2b) untuk E2E yang hanya membaca kelas Penuh/antrean/Selesai.

**Tooling:**

- Vitest 5 + `worker_threads` untuk konkurensi; `startTestServer()` untuk HTTP nyata.
- Playwright 1.64 vanilla (A-6: `@seontechnologies/playwright-utils` tidak dipasang, jadi flag TEA tidak berlaku) + `@axe-core/playwright` dengan tag `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

**Lingkungan:**

- Chromium dengan dependensi sistem di mesin dev (R-023), atau CI sebagai gate.
- `NODE_ENV=test`, `KELASKU_FAKE_NOW` beku, `DATABASE_PATH=./data/e2e.db` baru per run Playwright.

---

## Kriteria Quality Gate

### Ambang Lulus/Gagal

- **P0:** 100%, dan setiap skenario konkurensi lulus 50/50 ulangan di run CI
- **P1:** ≥95%; kegagalan sisanya wajib waiver
- **P2/P3:** ≥90% (informasional)
- **Mitigasi risiko tinggi:** R-001, R-002, R-022, R-023 100% selesai atau ber-waiver

### Target Coverage

- **Jalur kritis** (daftar, R1/R2/R3/R7, buat/ubah kelas): ≥80%
- **Skenario keamanan** (auth rute admin, DTO publik, log): 100%
- **Logika bisnis** (`domain/` + `services/`): ≥80%, mengikuti asumsi level sistem yang belum dikonfirmasi
- **Kasus tepi:** ≥50%

### Syarat Mutlak

- [ ] Semua test P0 lulus, termasuk mutation check yang merah terhadap mutannya
- [ ] Tidak ada risiko ≥6 yang belum dimitigasi
- [ ] Test keamanan (kategori SEC) lulus 100%
- [ ] Smoke kinerja tabel kelas < 1 s pada 240 kelas (PERF)
- [ ] Bukti NFR yang direncanakan ada, atau `bmad-testarch-nfr` mencatat CONCERNS/waiver

---

## Rencana Mitigasi

### R-001: Kursi terakhir diambil dua pendaftaran (Skor: 6)

**Strategi:** use-case daftar menjalankan `assertClassOpen` → cari aktif → `COUNT` Terdaftar + antrean → keputusan domain → insert, semuanya di satu callback sinkron `withWriteTx`; tidak ada kolom counter.
**Pemilik:** dev backend · **Timeline:** Story 1.7 · **Status:** Direncanakan
**Verifikasi:** 1.7-INT-001 dan 1.7-API-001 hijau 50/50; mutation check merah. **Residual:** rendah.

### R-002: Pendaftaran aktif ganda (Skor: 6)

**Strategi:** `normalizeEmail` sebelum simpan/cari; unique index parsial `(class_id, email) WHERE status IN ('registered','waitlisted')`; `SQLITE_CONSTRAINT_UNIQUE` → baca ulang → 200 `alreadyActive`; tombol nonaktif selama request.
**Pemilik:** dev backend + frontend · **Timeline:** Story 1.7, 1.8 · **Status:** Direncanakan
**Verifikasi:** 1.7-INT-003, 1.7-API-002, 1.7-API-004, 1.7-INT-007, 1.8-E2E-003. **Residual:** rendah.

### R-022: Batas Selesai bertentangan antara spine dan PRD (Skor: 6)

**Strategi:** (1) perbarui `ARCHITECTURE-SPINE.md` AD-6 (dan teks AD-18) ke `max(session_date) <= today` lewat `bmad-architecture` mode update atau `bmad-correct-course` sebelum Story 1.6; (2) satu fungsi `classStatus` dipakai pendaftaran, tabel kelas, dan ubah kelas; (3) test batas di unit dan di `*.tz.test.ts`.
**Pemilik:** tech lead · **Timeline:** sebelum Story 1.6 · **Status:** Terbuka (spine baris 87 masih `<`)
**Verifikasi:** spine diperbarui; 1.6-UNIT-002, 1.7-API-005, 1.9-API-001, 1.11-INT-005 hijau. **Residual:** rendah setelah spine diperbarui.

### R-023: E2E browser tidak bisa dijalankan di mesin dev (Skor: 6)

**Strategi:** (1) pasang dependensi Chromium (`npx playwright install-deps chromium`) di mesin dev; (2) sampai itu beres, job E2E di `.github/workflows/test.yml` menjadi gate wajib PR, dan story UI tidak boleh `done` tanpa run E2E CI hijau; (3) catat di spec story bila E2E hanya terverifikasi di CI.
**Pemilik:** tech lead · **Timeline:** sebelum Story 1.6 · **Status:** Terbuka
**Verifikasi:** `npm run test:e2e` lulus lokal, atau tautan run CI hijau di setiap PR story UI. **Residual:** rendah.

---

## Asumsi dan Dependensi

### Asumsi

1. PRD revisi 2026-11-03 menang atas spine dan UX yang belum diperbarui (A-9). Semua test memakai `<=` untuk Selesai, 50 ulangan per run, dan kontrol presensi tiga keadaan (di Epik 3).
2. Mutation check memakai seam tx-step: use-case mengekspor langkah `(tx, ctx, input)` terpisah dari pembungkus `withWriteTx`, sehingga test merakit varian non-atomik (baca di satu transaksi, tulis di transaksi lain) tanpa flag di kode produksi. Ini mengikuti pola AD-3 dan opsi paling sederhana; konfirmasi saat Story 1.7.
3. Target coverage kode ≥80% untuk `domain/` + `services/` diambil dari asumsi level sistem dan belum dikonfirmasi PM/tech lead.
4. E2E memakai Playwright vanilla (A-6). Contoh `apiRequest` di `test-design-qa.md` Lampiran A tidak dipakai.
5. Kelas seed hanya dibaca; test yang mengubah data membuat kelasnya sendiri lewat `POST /api/admin/classes` dengan setidaknya satu tanggal setelah `today`. Contoh di `test-design-qa.md` Lampiran A (`sessionDates: [list.today]`) sekarang menghasilkan 400, karena kelas seperti itu akan lahir Selesai.

### Dependensi

1. Pembaruan spine AD-6/AD-18 (R-022): sebelum Story 1.6
2. Chromium di mesin dev, atau kesepakatan gate CI (R-023): sebelum Story 1.6
3. `seed:demo` B-2b: di Story 1.7, sebelum E2E 1.8/1.9
4. Anggaran durasi `npm test` dari tech lead (R-028): sebelum Story 1.11 menambah skenario konkurensi ketiga

### Risiko terhadap Rencana

- **Risiko:** target MVP 1 minggu dan aturan potong akhir hari ke-3 (epics §Potongan cakupan) bergantung pada test konkurensi R1 dan R2 hijau.
  - **Dampak:** bila P0 R1/R2 terlambat, potongan SHOULD dan ✂2 diterapkan sekaligus.
  - **Kontinjensi:** P0 dan test R1/R2/R3/R7 tidak pernah dipotong. Potong P2/P3 lebih dulu; bagian Dibatalkan (1.10-E2E-001 sebagian) mengikuti ✂2.

---

## Panduan untuk ATDD dan Automate

### `/bmad-testarch-atdd` (scaffold fase merah, per story sebelum implementasi)

Jalankan per story, mulai Story 1.6. Scaffold P0 dan P1 story itu saja; P2/P3 diserahkan ke automate.

| Story | Scaffold merah | Berkas (mengikuti konvensi repo) |
| --- | --- | --- |
| 1.6 | 1.6-UNIT-001, 1.6-UNIT-002, 1.6-API-001, 1.6-API-002, 1.6-E2E-001 | `src/server/domain/*.test.ts`, `src/server/http/*.test.ts`, `e2e/admin-class-create.spec.ts` |
| 1.7 | Semua P0 1.7 (termasuk mutation check), 1.7-UNIT-001, 1.7-INT-005..007, 1.7-INT-009, 1.7-API-004..007 | `src/server/services/registrations.concurrency.test.ts`, `src/server/services/*.test.ts`, `src/server/http/registrations.tz.test.ts` untuk 1.7-API-005 |
| 1.8 | 1.8-E2E-001..004 | `e2e/registration.spec.ts` (project `participant-mobile`) |
| 1.9 | 1.9-E2E-001 (P0), 1.9-API-001, 1.9-E2E-002 | `e2e/smoke-uj1-uj2.spec.ts`, `e2e/admin-classes.spec.ts` |
| 1.10 | 1.10-API-001, 1.10-INT-001 | `src/server/http/`, `src/server/services/` |
| 1.11 | 1.11-INT-001 (P0 + mutation), 1.11-API-001, 1.11-INT-003, 1.11-INT-005, 1.11-INT-006, 1.11-API-002 | `src/server/services/classes.concurrency.test.ts`, `src/server/services/*.test.ts` |
| 1.12 | 1.12-E2E-001 | `e2e/admin-class-edit.spec.ts` |

Aturan scaffold:

- Nama test aturan bisnis memakai ID aturan dan nama persis dari AC epics, mis. `it('R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered')`. Tag Playwright `@P0`/`@P1` di judul.
- Konkurensi memakai `runConcurrently` + `repeatConcurrent(CONCURRENCY_REPEATS, …)`; jangan menulis ulang harness. Pesan gagal menyebut nomor ulangan.
- Fase merah harus gagal karena perilaku belum ada (404 rute, use-case tidak ada), bukan karena error sintaks atau import. Jangan pakai `it.skip` untuk test R1–R7.
- Services/data memakai `createTestDb` (berkas SQLite sementara nyata); jangan mock DB. Waktu hanya lewat `fixedClock`/`KELASKU_FAKE_NOW`.
- Assert `error.code` dan status dari `src/shared/errors.ts`, bukan angka hardcode. Kode baru (`class_not_found`, `registration_closed`, `quota_below_registered`, `class_finished`) didaftarkan di registri oleh story-nya (A-8).
- E2E: selector `getByRole`/`getByLabel` dengan teks Indonesia; `data-testid` hanya `class-row-{publicCode}` dan `registration-row-{registrationId}`. Login lewat fixture `adminLogin` yang sudah ada.

### `/bmad-testarch-automate` (perluasan setelah implementasi)

Jalankan setelah Story 1.12 selesai, atau per story setelah P0/P1-nya hijau:

1. Isi P2 dan P3 otomatis di atas (17 + 3 test), dengan prioritas 1.9-INT-001/002 (bukti NFR7 smoke) dan 1.7-INT-010 (aturan repo tunggal ke fitness test).
2. Tutup celah `deferred-work.md` yang masuk P3 (1.5-UNIT-001, 1.4-INT-001), setelah keputusan pendekatan render untuk `useResource`.
3. Sapu axe di setiap state halaman (kosong, error, Penuh, Selesai), bukan hanya state bahagia.
4. Pasang X-OPS-001 (durasi per skenario konkurensi) dan jalankan E2E 3× berturut di CI sebagai syarat keluar epik.
5. Jangan menduplikasi: perilaku yang sudah dibuktikan di unit/API tidak diulang di E2E (contoh: validasi judul/kuota cukup di 1.6-API-002).

---

## Rekomendasi Lanjutan (Manual)

- Jalankan `/bmad-testarch-atdd` per story untuk scaffold merah P0/P1 (workflow terpisah, tidak otomatis).
- Jalankan `/bmad-testarch-automate` untuk cakupan P2/P3 setelah implementasi ada.
- Jalankan `bmad-architecture` (mode update) atau `bmad-correct-course` untuk R-022 sebelum Story 1.6.
- Jalankan `/bmad-testarch-trace` di akhir epik untuk matriks keterlacakan dan keputusan gate.

---

## Persetujuan

**Test design disetujui oleh:**

- [ ] Product Manager: ________ Tanggal: ________
- [ ] Tech Lead: ________ Tanggal: ________
- [ ] Penanggung jawab QA (peran dev): ________ Tanggal: ________

**Komentar:**

---

## Interworking & Regresi

| Komponen | Dampak | Cakupan regresi |
| --- | --- | --- |
| **`src/server/data/db.ts` (`withWriteTx`, `migrate`)** | Semua use-case tulis baru dan tiga migrasi baru (classes, class_sessions, registrations) | `db.test.ts` + seluruh P0 |
| **`test/helpers/concurrency.ts`** | Dipakai semua test R1/R2/R7 | `concurrency.test.ts` (kontrol negatif + positif) harus tetap hijau |
| **`src/server/http/admin-plugin.ts`** | Rute admin baru Story 1.6, 1.9–1.11 | `auth.test.ts` enumerasi 401 (P0-008) |
| **`src/server/clock.ts`, `src/shared/format.ts`** | Status Selesai, penutupan pendaftaran, format tanggal di semua halaman baru | `clock.tz.test.ts`, `format.tz.test.ts` |
| **`src/shared/errors.ts`, `dto.ts`** | Kode error dan DTO baru | `errors.test.ts`, `npm run typecheck` |
| **`src/architecture.test.ts`** | Use-case dan repository baru | Fitness test HP-3 tetap hijau |
| **`promoteFromWaitlist` (Story 1.11)** | Dipakai ulang Epik 2 untuk pembatalan (R4) | 1.11-INT-003, 1.11-INT-008; setiap perubahan menjalankan ulang P0 |
| **`scripts/seed-demo.ts`** | Data E2E Epik 1–4 | 1.7-INT-009; `scripts.test.ts` |

---

## Lampiran

### Referensi Knowledge Base

- `risk-governance.md`: klasifikasi risiko dan gate
- `probability-impact.md`: skala skor
- `test-levels-framework.md`: pemilihan level dan format ID test
- `test-priorities-matrix.md`: kriteria P0–P3
- `nfr-criteria.md`: perencanaan NFR

### Dokumen Terkait

- Epik: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.1–1.12)
- Konteks epik: `_bmad-output/implementation-artifacts/epic-1-context.md`
- Arsitektur: `_bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md`
- Test design sistem: `_bmad-output/test-artifacts/test-design-architecture.md`, `_bmad-output/test-artifacts/test-design-qa.md`
- PRD: `_bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md`

---

**Dibuat oleh:** BMad TEA Agent (Murat), Test Architect Module
**Workflow:** `bmad-testarch-test-design`
**Versi:** 4.0 (BMad v6)
