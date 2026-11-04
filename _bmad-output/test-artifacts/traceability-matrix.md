---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-map-criteria', 'step-04-analyze-gaps', 'step-05-gate-decision']
lastStep: 'step-05-gate-decision'
lastSaved: '2026-11-04'
workflowType: 'testarch-trace'
inputDocuments:
  - _bmad-output/test-artifacts/test-design-epic-1.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/deferred-work.md
  - _bmad-output/implementation-artifacts/spec-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md
  - _bmad-output/implementation-artifacts/spec-1-7-api-pendaftaran-berkuota-dengan-daftar-tunggu-fifo.md
coverageBasis: 'acceptance_criteria'
oracleConfidence: 'high'
oracleResolutionMode: 'formal_requirements'
oracleSources:
  - _bmad-output/test-artifacts/test-design-epic-1.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/deferred-work.md
externalPointerStatus: 'not_used'
collectionStatus: 'COLLECTED'
sourceSha: '5fd56b9c9b2a9544c3f36d639d3ccb2ac0a86919'
gateType: 'epic'
tempCoverageMatrixPath: '/tmp/tea-trace-coverage-matrix-2026-11-04T13-36-15-000Z.json'
gateDecision: 'FAIL'
---

# Matriks Keterlacakan & Keputusan Gate — Epik 1: Kelas & Pendaftaran Berkuota (R1–R3, R7)

**Target:** Epik 1 (epic gate), Story 1.1–1.12
**Tanggal:** 2026-11-04
**Evaluator:** Murat (TEA) untuk Rustan
**Commit yang ditelusuri:** `5fd56b9` (`fix: code review story 1.7`)
**Coverage Oracle:** `acceptance_criteria`: 57 skenario test di `test-design-epic-1.md` (P0 6, P1 28, P2 17, P3 6)
**Oracle Confidence:** high
**Oracle Sources:** `test-design-epic-1.md` (oracle utama), `epics.md`, `sprint-status.yaml`, `deferred-work.md`

---

Catatan: workflow ini tidak membuat test. Celah ditutup lewat `/bmad-testarch-atdd` (sebelum implementasi story) atau `/bmad-testarch-automate` (setelahnya).

## Ringkasan Eksekutif

**Keputusan gate: ❌ FAIL.** P0 tercakup 67% (4/6), padahal syaratnya 100%. P1 tercakup 50% dan keseluruhan 44%.

Kegagalan ini **bukan karena ada regresi**. Story yang sudah dibangun (1.1–1.7) tercakup baik: setiap kriteria P0/P1 milik 1.6 dan 1.7 berstatus FULL dan semua test-nya hijau. Gate gagal karena **Story 1.8–1.12 masih `backlog`**, dan dua skenario P0 bergantung pada story itu: R7 konkurensi (1.11-INT-001) dan smoke E2E UJ-1+UJ-2 (1.9-E2E-001). Epik 1 belum siap ditutup. Hasil ini adalah snapshot pertengahan epik, bukan gate penutupan.

**Bukti eksekusi pada commit `5fd56b9` (dijalankan di sesi ini):**

| Perintah | Hasil |
| --- | --- |
| `npm test` (Vitest: unit, integrasi, 3 project tz) | ✅ 39 berkas, **355/355 lulus**, 20,4 s, termasuk ×50 ulangan konkurensi dan mutation check R1/R2 |
| `npm run test:e2e` (Playwright, `admin-desktop` + `participant-mobile`) | ✅ **56/56 lulus**, 2,5 menit. **Chromium sekarang bisa start di mesin dev**, jadi R-023 sudah termitigasi secara lokal |
| `npm run typecheck` | ✅ bersih |

---

## PHASE 1: KETERLACAKAN KEBUTUHAN

### Pemetaan oracle (Step 1)

- **Oracle:** setiap baris Test ID di bagian "Rencana Coverage Test" `test-design-epic-1.md` dihitung sebagai satu kriteria. Baris dengan mutation check (1.7-INT-001, 1.7-INT-003, 1.11-INT-001) hanya FULL bila uji konkurensi **dan** mutation check-nya ada.
- **Alasan memilih oracle ini:** oracle diminta langsung oleh pengguna. Dokumen ini juga formal (turunan `epics.md` + PRD revisi), sudah berprioritas, dan sudah memetakan risiko. Jadi tidak perlu oracle sintetis.
- **Regresi P0-008** (setiap `/api/admin/*` tanpa sesi → 401, ditemukan lewat `onRoute`) tidak dihitung ulang, mengikuti oracle. Statusnya hijau di `src/server/http/auth.test.ts:290`.
- **Knowledge fragment yang dimuat:** `test-priorities-matrix.md`, `risk-governance.md`, `probability-impact.md`, `test-quality.md`, `selective-testing.md`.
- **Pemetaan level:** taksonomi workflow hanya punya `e2e/api/component/unit/live`. Test integrasi (use-case + SQLite nyata, termasuk worker) dicatat di bucket `api` pada JSON. Di matriks ini levelnya tetap ditulis "INT".

### Inventaris test (Step 2)

- 39 berkas test Vitest + 5 berkas spec Playwright di `src/`, `scripts/`, `test/helpers/`, `e2e/`. Penemuan test memakai ID test-design di komentar/judul (`1.x-LEVEL-NNN`) dan ID AC di judul (`[P1] AC-5 R1: …`).
- **Tidak ada `it.skip`, `it.todo`, `it.fails`, `test.fixme`, atau `.only`** di berkas test Epik 1.
- **Live verification:** `live-verification-results.json` tidak ada (`present: false`, `freshness: not_present`). Tidak ada bukti live yang dihitung dan tidak ada blocker live.
- **Live Verification Results:**

```json
{
  "liveRecords": [],
  "liveManifestHeader": {
    "present": false,
    "results_file": "_bmad-output/test-artifacts/live-verification-results.json",
    "source_sha": "",
    "observed_at": "",
    "producer": "",
    "read_error": "",
    "current_source_sha": "5fd56b9c9b2a9544c3f36d639d3ccb2ac0a86919"
  }
}
```

**Heuristik coverage:**

| Heuristik | Temuan |
| --- | --- |
| Endpoint tanpa test | 2 endpoint Epik 1 belum ada (dan belum dibangun): `GET /api/admin/classes` (1.9), ubah kelas `/api/admin/classes/:id` (1.11). Endpoint yang sudah ada semuanya teruji: `POST /api/admin/classes`, `GET /api/admin/classes/:id`, `GET /api/public/classes/:code`, `POST /api/public/classes/:code/registrations` |
| Auth negatif | Ada. `auth.test.ts:290` enumerasi 401 untuk semua rute admin; login salah → 401 identik (`auth.test.ts:115`, `e2e/auth-api.spec.ts:31`) |
| Jalur error | Ada untuk semua endpoint yang sudah dibangun: 400 `validation_error`, 404 `class_not_found`, 409 `registration_closed`, 415, constraint → 200 `alreadyActive`, 500 envelope |
| Jurnal UI / state UI | `not_applicable` (oracle formal, bukan sintetis). Catatan informatif: halaman pendaftaran peserta, tabel kelas, dan ubah kelas belum ada |

### Ringkasan Coverage

| Prioritas | Total kriteria | FULL | Coverage % | Status |
| --- | --- | --- | --- | --- |
| P0 | 6 | 4 | 67% | ❌ FAIL (wajib 100%) |
| P1 | 28 | 14 | 50% | ❌ FAIL (minimum 80%, target 90%) |
| P2 | 17 | 6 | 35% | ⚠️ WARN (informasional, ≥90%) |
| P3 | 6 | 1 | 17% | ⚠️ WARN (informasional) |
| **Total** | **57** | **25** | **44%** | **❌ FAIL** (minimum 80%) |

**Per story** (kriteria yang dimiliki story, semua prioritas):

| Story | Status sprint | Kriteria | FULL | Catatan |
| --- | --- | --- | --- | --- |
| 1.4 | review | 2 (P3) | 0 | Celah deferred-work (1.4-INT-001, 1.4-MAN-001) |
| 1.5 | review | 1 (P3) | 0 | 1.5-UNIT-001 menunggu keputusan pendekatan render |
| 1.6 | review | 8 | 8 | ✅ lengkap |
| 1.7 | in-progress | 18 | 17 | ✅ semua P0/P1/P2 FULL; tinggal 1.7-EXP-001 (P3, manual) |
| 1.8 | backlog | 7 | 0 | |
| 1.9 | backlog | 6 | 0 | Memuat P0 1.9-E2E-001 |
| 1.10 | backlog | 3 | 0 | |
| 1.11 | backlog | 8 | 0 | Memuat P0 1.11-INT-001 |
| 1.12 | backlog | 3 | 0 | |
| Lintas | — | 1 (X-OPS-001) | 0 | |

**Coverage per level** (test unik yang diterima sebagai bukti: 30 kasus di 16 berkas): Unit 6 · Integrasi/API 20 · E2E 4 · Component 0 · Live 0.

---

### Pemetaan Rinci

Legenda: ✅ FULL · ❌ NONE. Tidak ada kriteria berstatus PARTIAL, UNIT-ONLY, atau INTEGRATION-ONLY.

#### P0 (Kritis)

##### 1.7-INT-001: R1, 20 pendaftaran serentak lewat worker ke kuota 5, ×50, plus mutation check (P0)

- **Coverage:** FULL ✅
- **Tests:**
  - `1.7-INT-001` (AC-5) - `src/server/services/registrations.concurrency.test.ts:81`
    - **Given:** kelas kuota 5, 20 worker `worker_threads` dengan koneksi terpisah
    - **When:** semua mendaftar serentak (`registerAtomic`), diulang `CONCURRENCY_REPEATS = 50`
    - **Then:** tepat 5 Terdaftar; posisi Daftar tunggu 1–15 tanpa celah atau duplikat; tanpa error; DB `{5, 15, 0}`
  - `1.7-INT-001` (AC-7, mutation) - `src/server/services/registrations.concurrency.test.ts:137`
    - **Given:** mutan `registerNonAtomic` (`planRegistration` di luar `withWriteTx`, `applyRegistration` di transaksi lain; `test/tasks/registration-tasks.ts:47`)
    - **When:** 20 worker, hingga 50 ulangan
    - **Then:** Terdaftar > kuota terdeteksi minimal sekali, jadi test AC-5 terbukti tajam

##### 1.7-API-001: R1, 20 POST serentak lewat HTTP nyata, semua 200, ×50 (P0)

- **Coverage:** FULL ✅
- **Tests:**
  - `1.7-API-001` (AC-6) - `src/server/services/registrations.concurrency.test.ts:109`
    - **Given:** `startTestServer()` (HTTP nyata), kelas kuota 5 per ulangan
    - **When:** 20 `fetch` POST serentak, ×50
    - **Then:** 20× HTTP 200 (tanpa 503 `database_busy`); 5 Terdaftar; posisi 1–15; DB `{5, 15, 0}`

##### 1.7-INT-003: R2, dua pendaftaran identik serentak (`"Budi@Mail.com "` vs `"budi@mail.com"`), ×50, plus mutation check (P0)

- **Coverage:** FULL ✅
- **Tests:**
  - `1.7-INT-003` (AC-9 bagian 1) - `src/server/services/registrations.concurrency.test.ts:167`
    - **Given:** 2 worker dengan dua varian email yang sama setelah `normalizeEmail`
    - **When:** daftar serentak ×50
    - **Then:** 1 baris aktif; tanpa error; status sama; `alreadyActive` = `[false, true]`
  - `1.7-INT-003` (AC-10, mutation) - `src/server/services/registrations.concurrency.test.ts:214`
    - **Given:** mutan non-atomik, dan unique index parsial dibuang (`droppedIndexes > 0` dipastikan)
    - **When:** hingga 50 ulangan
    - **Then:** baris aktif ganda terdeteksi, jadi test R2 terbukti tajam

##### 1.7-API-002: R2, skenario duplikat serentak lewat HTTP nyata, ×50 (P0)

- **Coverage:** FULL ✅
- **Tests:**
  - `1.7-API-002` (AC-9 bagian 2) - `src/server/services/registrations.concurrency.test.ts:167`
    - **Given:** `startTestServer()`, kelas baru per ulangan
    - **When:** dua POST serentak dengan dua varian email, ×50
    - **Then:** `[200, 200]`; 1 baris aktif; status sama; `alreadyActive` = `[false, true]` (constraint → 200, bukan 5xx)

##### 1.11-INT-001: R7, penurunan kuota berpacu dengan pendaftaran, ×50, plus mutation check (P0)

- **Coverage:** NONE ❌
- **Gaps:** Story 1.11 masih `backlog`. Use-case ubah kuota, rutenya, dan `src/server/services/classes.concurrency.test.ts` belum ada.
- **Recommendation:** jalankan ATDD Story 1.11 dengan `1.11-INT-001` (integrasi worker): *Given* kelas berisi Terdaftar mendekati kuota, *When* `updateClass(quota↓)` dan pendaftaran dijalankan serentak dari ≥ 2 koneksi dengan urutan start acak ×50, *Then* Terdaftar ≤ kuota akhir di setiap ulangan dan tanpa 5xx. Sertakan mutan "`COUNT` di luar transaksi ubah kuota" yang harus merah. Pakai ulang `runConcurrently`/`repeatConcurrent` dan seam tx-step seperti `planRegistration`/`applyRegistration`.

##### 1.9-E2E-001: smoke UJ-1 + UJ-2, kuota 2 → 2/2 Penuh → "Daftar tunggu #1", axe (P0)

- **Coverage:** NONE ❌
- **Gaps:** Story 1.8 (halaman `/daftar/{kode}`) dan 1.9 (tabel kelas admin) masih `backlog`. `e2e/smoke-uj1-uj2.spec.ts` belum ada.
- **Recommendation:** setelah 1.8 dan 1.9 dibangun, tambah `1.9-E2E-001` (E2E, `participant-mobile` + `admin-desktop`): *Given* admin membuat kelas kuota 2 lewat UI, *When* dua peserta di 360 px mendaftar lalu peserta ketiga mendaftar, *Then* tabel menampilkan "2/2" + badge "Penuh", peserta ketiga melihat "Daftar tunggu #1", kolom Daftar tunggu = 1 setelah muat ulang, dan axe tanpa pelanggaran.

#### P1 (Tinggi)

| Kriteria | Kebutuhan | Coverage | Test (`path:line`) |
| --- | --- | --- | --- |
| 1.6-UNIT-001 | FR2 `validateSessionDates` (kosong, ganda + kunci `sessionDates.<i>`, tanpa tanggal > today, `[today]` ditolak) | FULL ✅ | `src/server/domain/session-dates.test.ts:19` |
| 1.6-UNIT-002 | `classStatus` Selesai bila `max(session_date) <= today` | FULL ✅ | `src/server/domain/class-status.test.ts:15` |
| 1.6-API-001 | `POST /api/admin/classes` → 201 DTO, satu transaksi | FULL ✅ | `src/server/http/admin-classes.test.ts:90`, `src/server/services/classes.test.ts:26` (rollback) |
| 1.6-API-002 | Judul trim 1–120, kuota bulat ≥ 1 → 400 + `fields` | FULL ✅ | `src/server/http/admin-classes.test.ts:90` (8 kasus + batas 120) |
| 1.6-E2E-001 | UJ-1 langkah 1–4 + error duplikat + axe | FULL ✅ | `e2e/admin-class-create.spec.ts:39`, `e2e/admin-class-create.spec.ts:89` |
| 1.7-UNIT-001 | Keputusan Terdaftar ⇔ kursi + antrean kosong; Penuh; posisi 1-based | FULL ✅ | `src/server/domain/registration-rules.test.ts:21` |
| 1.7-INT-005 | R3: ke ekor antrean bila antrean tidak kosong walau ada kursi | FULL ✅ | `src/server/services/registrations.test.ts:32` |
| 1.7-INT-006 | R3: FIFO menurut `id` saat `created_at` identik | FULL ✅ | `src/server/services/registrations.test.ts:61` |
| 1.7-API-004 | R2 serial: email ternormalisasi → 200 `alreadyActive` + posisi | FULL ✅ | `src/server/http/public-registrations.test.ts:151` |
| 1.7-INT-007 | AD-5: `SQLITE_CONSTRAINT_UNIQUE` → 200 `alreadyActive` | FULL ✅ | `src/server/services/registrations.recovery.test.ts:58` |
| 1.7-API-005 | FR7: Selesai → 409 `registration_closed`; batas 00.00 WIB di 3 zona | FULL ✅ | `src/server/http/public-registrations.test.ts:174`, `src/server/http/registrations.tz.test.ts:54` (project `tz-utc`/`tz-jakarta`/`tz-jayapura`) |
| 1.7-API-006 | FR7: nama 1–100, format email → 400 + `fields` Indonesia | FULL ✅ | `src/server/http/public-registrations.test.ts:97`, `src/shared/schemas.test.ts:74` (pesan dari `SCHEMA_MESSAGES`) |
| 1.7-API-007 | AD-10: DTO publik tanpa id/kuota/peserta; 1.000 ref unik dan tidak berurutan | FULL ✅ | `src/server/http/public-registrations.test.ts:71`, `src/server/http/public-registrations.test.ts:97` |
| 1.7-INT-009 | B-2b `seed:demo`: Penuh, Penuh + 3 antrean, Selesai; relatif `Clock`; idempoten | FULL ✅ | `scripts/scripts.test.ts:202` |
| 1.8-E2E-001 | UJ-2 360×740, ResultPanel, fokus, tanpa gulir, axe | NONE ❌ | — (Story 1.8 backlog) |
| 1.8-E2E-002 | Penuh: alert warning; kursi direbut → "Daftar tunggu #N" | NONE ❌ | — (Story 1.8 backlog) |
| 1.8-E2E-003 | Klik ganda → "Mendaftar…" nonaktif | NONE ❌ | — (Story 1.8 backlog) |
| 1.8-E2E-004 | Kelas Selesai tanpa formulir; kode tak dikenal | NONE ❌ | — (Story 1.8 backlog) |
| 1.9-API-001 | FR4 `GET /api/admin/classes` | NONE ❌ | — (Story 1.9 backlog) |
| 1.9-E2E-002 | Tabel kelas a11y + "Tampilkan semua kelas Selesai (N)" | NONE ❌ | — (Story 1.9 backlog) |
| 1.10-API-001 | FR5 daftar pendaftaran di `GET /api/admin/classes/:id` | NONE ❌ | — (Story 1.10 backlog) |
| 1.10-INT-001 | R3: posisi sama di hasil daftar dan halaman admin | NONE ❌ | — (Story 1.10 backlog) |
| 1.11-API-001 | R7: kuota < Terdaftar → 409 `quota_below_registered` | NONE ❌ | — (Story 1.11 backlog) |
| 1.11-INT-003 | R3: promosi saat kuota naik, dalam satu transaksi | NONE ❌ | — (Story 1.11 backlog) |
| 1.11-INT-005 | AD-18: Selesai → 409 `class_finished`; judul boleh | NONE ❌ | — (Story 1.11 backlog) |
| 1.11-INT-006 | AD-19: ubah tanggal = diff | NONE ❌ | — (Story 1.11 backlog) |
| 1.11-API-002 | FR6: `publicCode` tetap setelah judul diubah | NONE ❌ | — (Story 1.11 backlog) |
| 1.12-E2E-001 | Ubah kelas: error kuota + toast promosi + axe | NONE ❌ | — (Story 1.12 backlog) |

Catatan klasifikasi P1:

- **1.6-E2E-001:** `:39` membuktikan error duplikat di baris tanggal + ringkasan, nilai tetap, dan "Menyimpan…". `:89` membuktikan toast polite, `<h1>`, badge "Dibuka", format "Senin, 9 Nov 2026", penanda "Hari ini", tautan `/daftar/{10 karakter}` tanpa id internal, dan axe. Bagian "Salin tautan" dibuktikan oleh 1.6-E2E-002 (P2).
- **1.7-API-006:** test API hanya memastikan `fields[kolom]` berupa string. Isi pesan Indonesia dikunci di level unit lewat `SCHEMA_MESSAGES` (`schemas.test.ts`). Gabungan keduanya membuktikan kriteria, jadi statusnya FULL.

#### P2 (Sedang)

| Kriteria | Kebutuhan | Coverage | Test (`path:line`) |
| --- | --- | --- | --- |
| 1.6-API-003 | `GET /api/admin/classes/:id` tak dikenal → 404 | FULL ✅ | `src/server/http/admin-classes.test.ts:144` |
| 1.6-E2E-002 | Salin tautan + `aria-live`; clipboard ditolak → URL tetap tersedia | FULL ✅ | `e2e/admin-class-create.spec.ts:132`, `e2e/admin-class-create.spec.ts:224` |
| 1.7-API-008 | `GET /api/public/classes/:code` tak dikenal → 404 | FULL ✅ | `src/server/http/public-registrations.test.ts:71` |
| 1.7-INT-010 | Skema `registrations` (tanpa DEFAULT waktu, CHECK) + aturan penulis tunggal | FULL ✅ | `src/server/data/registrations-schema.test.ts:58`, `src/architecture.test.ts:285` (aturan `registrations-single-writer`) |
| 1.7-INT-011 | R2: Dibatalkan boleh daftar lagi sebagai baris baru di ekor | FULL ✅ | `src/server/services/registrations.test.ts:101` |
| 1.7-INT-012 | NFR8: log tanpa email/nama | FULL ✅ | `src/server/http/public-registrations.test.ts:217` |
| 1.8-E2E-005 | Panel `alreadyActive` | NONE ❌ | — (1.8) |
| 1.8-E2E-006 | Email tidak valid; server tak terjangkau | NONE ❌ | — (1.8) |
| 1.9-INT-001 | Tanpa N+1 pada 240 kelas | NONE ❌ | — (1.9) |
| 1.9-INT-002 | Smoke NFR7 < 1 s pada 240 kelas | NONE ❌ | — (1.9) |
| 1.9-E2E-003 | "Belum ada kelas." | NONE ❌ | — (1.9) |
| 1.10-E2E-001 | Halaman kelas admin: tiga bagian + penanda promosi | NONE ❌ | — (1.10) |
| 1.11-API-003 | Ubah tanggal tidak sah → 400 | NONE ❌ | — (1.11) |
| 1.11-INT-008 | R3: kenaikan kuota serentak → kursi ke kepala antrean | NONE ❌ | — (1.11) |
| 1.12-E2E-002 | Kelas Selesai: hanya judul yang bisa diubah | NONE ❌ | — (1.12) |
| 1.12-E2E-003 | Peringatan perubahan belum tersimpan | NONE ❌ | — (1.12) |
| X-OPS-001 | Durasi skenario konkurensi tercatat di CI | NONE ❌ | — (`.github/workflows/` belum mencatat durasi per skenario) |

#### P3 (Rendah)

| Kriteria | Kebutuhan | Coverage | Test / alasan |
| --- | --- | --- | --- |
| 1.6-UNIT-003 | Badge Daftar tunggu memakai token `warning` | FULL ✅ | `src/client/components/Badge.test.ts:15` |
| 1.5-UNIT-001 | `useResource` (300 ms, hasil basi, abort, retry) | NONE ❌ | Deferred Story 1.5; belum ada pendekatan render |
| 1.4-INT-001 | Password diganti sebelum tx tulis → tanpa sesi | NONE ❌ | Deferred Story 1.4 |
| 1.4-MAN-001 | Prompt TTY `admin:create` (manual) | NONE ❌ | Belum ada catatan cek manual |
| 1.8-MAN-001 | NVDA alur pendaftaran (manual) | NONE ❌ | Story 1.8 backlog |
| 1.7-EXP-001 | Eksploratif: matikan server di tengah ledakan | NONE ❌ | Sesi eksploratif belum tercatat |

#### Bukti yang ditolak (rejected evidence)

Tidak ada. Setiap test yang menyebut ID kriteria di judul atau komentar sudah dibaca, dan asersinya memang membuktikan bagian kriteria yang diklaim. Mutation check R1/R2 juga sudah dipastikan memakai mutan nyata, bukan stub.

#### Coverage ganda

Tumpang tindih yang disengaja (defense in depth untuk jalur kritis): R1/R2 diuji di level worker **dan** HTTP nyata, sesuai rancangan oracle (A-11, FR8 "tanpa 5xx"). Validasi judul/kuota hanya diuji di API dan tidak diulang di E2E, sesuai panduan automate butir 5. Tidak ada duplikasi yang perlu dirapikan.

---

### Analisis Celah (Step 4)

#### Celah Kritis (BLOCKER) ❌: 2

1. **1.11-INT-001: R7 penurunan kuota vs pendaftaran serentak** (P0)
   - Coverage saat ini: NONE (Story 1.11 backlog)
   - Rekomendasi: `1.11-INT-001` (integrasi worker ×50 + mutation check) di `src/server/services/classes.concurrency.test.ts`
   - Dampak: tanpa test ini R-007 (Terdaftar > kuota akhir) tidak terbukti termitigasi; FR3/R7 tidak boleh dirilis

2. **1.9-E2E-001: smoke UJ-1 + UJ-2** (P0)
   - Coverage saat ini: NONE (Story 1.8/1.9 backlog)
   - Rekomendasi: `1.9-E2E-001` di `e2e/smoke-uj1-uj2.spec.ts`
   - Dampak: belum ada bukti perjalanan peserta ujung ke ujung (daftar → Penuh → Daftar tunggu) di browser

#### Celah Tinggi (P1, NONE): 14

1.8-E2E-001, 1.8-E2E-002, 1.8-E2E-003, 1.8-E2E-004, 1.9-API-001, 1.9-E2E-002, 1.10-API-001, 1.10-INT-001, 1.11-API-001, 1.11-INT-003, 1.11-INT-005, 1.11-INT-006, 1.11-API-002, 1.12-E2E-001. Semuanya milik story yang masih `backlog`. Tidak ada celah P1 di story yang sudah dibangun.

#### Celah Sedang (P2, NONE): 11

1.8-E2E-005, 1.8-E2E-006, 1.9-INT-001, 1.9-INT-002, 1.9-E2E-003, 1.10-E2E-001, 1.11-API-003, 1.11-INT-008, 1.12-E2E-002, 1.12-E2E-003, X-OPS-001.

#### Celah Rendah (P3, NONE): 5

1.5-UNIT-001, 1.4-INT-001, 1.4-MAN-001, 1.8-MAN-001, 1.7-EXP-001.

#### Coverage parsial / unit-only / integration-only

Tidak ada.

#### Status risiko tinggi dari test design

| Risk ID | Status per 2026-11-04 | Bukti |
| --- | --- | --- |
| R-001 (kursi terakhir ganda) | ✅ Termitigasi dan terverifikasi | 1.7-INT-001 + mutation, 1.7-API-001 hijau ×50 |
| R-002 (pendaftaran aktif ganda) | ✅ Termitigasi di sisi server; sisi UI (1.8-E2E-003 klik ganda) belum | 1.7-INT-003 + mutation, 1.7-API-002, 1.7-API-004, 1.7-INT-007 |
| R-022 (batas Selesai `<` vs `<=`) | ⚠️ Kode dan test terkunci ke `<=` (1.6-UNIT-002, 1.7-API-005 tz). **Spine AD-6/AD-19 masih usang** (deferred-work Story 1.6) | `ARCHITECTURE-SPINE.md` belum diperbarui |
| R-023 (E2E tidak bisa jalan lokal) | ✅ Termitigasi: `npm run test:e2e` 56/56 lulus lokal di sesi ini | Run 2026-11-04 |
| R-007 (R7 konkurensi) | ❌ Belum ada mitigasi atau test | Story 1.11 backlog |

---

## PHASE 2: KEPUTUSAN GATE

### Keputusan Gate: ❌ FAIL

**Rationale (deterministik, aturan 1):** P0 coverage is 67% (required: 100%). 2 critical requirement(s) below FULL coverage.

| Kriteria gate | Syarat | Aktual | Status |
| --- | --- | --- | --- |
| P0 coverage | 100% | 67% | ❌ NOT_MET |
| P1 coverage | target 90%, minimum 80% | 50% | ❌ NOT_MET |
| Coverage keseluruhan | minimum 80% | 44% | ❌ NOT_MET |
| Eksekusi test | semua hijau | Vitest 355/355, E2E 56/56, typecheck bersih | ✅ |
| Bukti live | — | tidak ada (`not_present`) | n/a |

- **Mode keputusan:** deterministic · **Jenis gate:** epic · **Collection:** `contract_static`, `COLLECTED` · **Gate eligible:** ya
- **Waiver:** register `gate-waivers.md` tidak ada. Tidak ada waiver yang diajukan atau diterapkan. Waiver juga tidak pantas di sini, karena celahnya adalah fitur yang belum dibangun, bukan risiko yang diterima.

**Tafsiran untuk tim:** status FAIL ini berarti **Epik 1 belum selesai**, bukan kualitas test yang buruk. Untuk story yang sudah dibangun, kualitas coverage tinggi: semua P0/P1 milik 1.6–1.7 FULL, dengan mutation check yang membuktikan test konkurensi tidak lulus palsu. Jalankan ulang trace ini setelah Story 1.12 selesai sebagai gate penutupan epik yang sebenarnya.

### Asumsi yang dicatat

1. **Cakupan gate = seluruh Epik 1 (Story 1.1–1.12)** sesuai permintaan "epic gate" dan oracle `test-design-epic-1.md`. Opsi paling sederhana yang konsisten dengan permintaan adalah tidak mempersempit gate ke story yang sudah dibangun. Sebagai informasi tambahan, bila oracle dibatasi ke story 1.1–1.7, P0 = 4/4 (100%), P1 = 14/14 (100%), dan P2 = 6/6 (100%) untuk 1.6–1.7, sedangkan celah tersisa hanya P3 deferred. Angka ini **tidak** dipakai untuk keputusan.
2. Test integrasi (use-case + SQLite nyata) dipetakan ke bucket `api` di JSON karena taksonomi level workflow tidak punya bucket `integration`.
3. Bukti E2E diambil dari run lokal sesi ini. Kriteria keluar "E2E hijau di CI 3 run berturut-turut" (R-016) belum bisa diverifikasi dari repositori dan tetap terbuka.

---

## Rekomendasi & Tindakan Berikutnya

1. **URGENT:** bangun Story 1.11 dan 1.8/1.9 dengan `/bmad-testarch-atdd` lebih dulu, termasuk 1.11-INT-001 (R7 ×50 + mutation check) dan 1.9-E2E-001 (smoke UJ-1+UJ-2). Tanpa keduanya gate P0 tidak bisa lulus.
2. **HIGH:** selesaikan Story 1.8–1.12 dengan ATDD per story (14 kriteria P1). Tambah test API untuk `GET /api/admin/classes` dan ubah kelas saat endpoint dibuat.
3. **HIGH:** perbarui `ARCHITECTURE-SPINE.md` AD-6/AD-19 ke `<=` / "minimal satu tanggal setelah today" lewat `bmad-architecture` (R-022), sebelum Story 1.9/1.11 memakai `classStatus` lagi.
4. **MEDIUM:** pasang X-OPS-001 (durasi per skenario konkurensi di CI) sebelum Story 1.11 menambah skenario konkurensi ketiga (R-028). Saat ini `npm test` total 20 s, masih jauh di bawah anggaran.
5. **MEDIUM:** sebelum menutup epik, jalankan E2E 3× berturut di CI (R-016) dan lakukan cek manual P3 (NVDA, prompt TTY, eksploratif matikan server).
6. **LOW:** jalankan `/bmad-testarch-test-review` untuk menilai kualitas test, lalu `/bmad-testarch-trace` lagi di akhir epik.

---

## Ringkasan Keputusan Gate

```text
🚨 GATE DECISION: FAIL

📊 Coverage Analysis:
- P0 Coverage: 67% (Required: 100%) → NOT_MET
- P1 Coverage: 50% (PASS target: 90%, minimum: 80%) → NOT_MET
- Overall Coverage: 44% (Minimum: 80%) → NOT_MET

✅ Decision Rationale:
P0 coverage is 67% (required: 100%). 2 critical requirement(s) below FULL coverage.

⚠️ Critical Gaps: 2 (P0 criteria below FULL coverage): 1.11-INT-001, 1.9-E2E-001

📝 Recommended Actions:
1. Bangun Story 1.11 + 1.8/1.9 lewat ATDD (P0 R7 konkurensi, smoke UJ-1+UJ-2)
2. Selesaikan Story 1.8–1.12 (14 kriteria P1)
3. Perbarui spine AD-6/AD-19 (R-022)

📂 Full Report: _bmad-output/test-artifacts/traceability-matrix.md
📂 Machine-readable: _bmad-output/test-artifacts/e2e-trace-summary.json, _bmad-output/test-artifacts/gate-decision.json

🚫 GATE: FAIL. Epik 1 belum boleh ditutup sampai coverage P0/P1 terpenuhi
```

---

**Dibuat oleh:** BMad TEA Agent (Murat), Test Architect Module
**Workflow:** `bmad-testarch-trace` (Create mode)
