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
  - _bmad-output/test-artifacts/test-design-architecture.md
---

# Test Design untuk QA: Kelasku MVP (level sistem)

**Tujuan:** Resep eksekusi test: apa yang diuji, di level mana, dengan alat apa, dan apa yang dibutuhkan dari tim lain. Tim belum punya QA khusus, jadi "QA" di sini berarti peran yang dijalankan oleh tiga developer.

**Tanggal:** 2026-11-02
**Penulis:** Murat (TEA) untuk Rustan
**Status:** Draf
**Proyek:** aisdlc-kelasku (Kelasku)

**Terkait:** `test-design-architecture.md` untuk risiko lengkap, blocker B-1/B-2, dan keputusan HP-1..HP-5.

---

## Ringkasan Eksekutif

**Cakupan:** FR-1..FR-22, NFR-1..NFR-9, R1–R7. Epik 1 (FR-1..FR-10; R1–R3, R7) diuji lebih dulu. Skenario epik lanjutan tetap direncanakan di sini supaya harness Sprint 0 bisa langsung memakainya.

**Ringkasan risiko:**

- Total risiko: 21 (6 tinggi ≥6, 10 sedang, 5 rendah)
- Kategori kritis: **DATA** (R-001, R-002, R-003), **TECH/OPS** testability (R-008, R-016), **BUS** zona waktu (R-005)

**Ringkasan coverage:**

- P0: ~9 (konkurensi R1/R2/R4/R7, R5, R6, auth admin, smoke UJ-1+UJ-2)
- P1: ~50 (aturan R1–R7 serial, validasi, alur UJ-1..UJ-4, a11y, migrasi)
- P2: ~22 (FR SHOULD, kasus tepi UI, kinerja, operasi)
- P3: ~7 (manual/eksploratif)
- **Total:** ~88 skenario (~65–120 jam, ≈1,5–3 minggu untuk satu orang; dibagi ke 3 dev)

---

## Di Luar Cakupan

| Item | Alasan | Mitigasi |
| --- | --- | --- |
| **Non-goal MVP** (pembayaran, SSO, notifikasi, multi-tenant, PDF sertifikat, ujian, katalog publik, jadwal jam/ruang) | `docs/intent-kelasku.md`, PRD §6 | Tidak dibangun, jadi tidak diuji |
| **Verifikasi kepemilikan email** di status/pembatalan publik | Risiko diterima (PRD §9, R-013) | Hanya diuji bahwa `registrationRef` + email harus cocok (P1-029) |
| **Uji beban di atas skala lembaga**, failover, zero-downtime | Instance tunggal (AD-1, NFR-6) | NFR-7 diukur pada data satu tahun (P2-018/019) |
| **Contract testing (Pact)** | Satu package, klien dan server berbagi `src/shared/dto.ts` + zod (AD-20) | `tsc` + validasi skema zod di test API |
| **Test komponen React terisolasi** | Tidak ada alat component testing di stack | Perilaku UI dicakup E2E; logika ada di domain/server |
| **Kebijakan retensi data (UU PDP)** | Ditunda ke lembaga (PRD §10) | — |

---

## Dependensi & Blocker Test

### Dependensi backend/arsitektur (Sprint 0)

1. **B-1: `createDb(path, { busyTimeoutMs? })` + `createServices({ db, clock })`** — tech lead — sebelum story pertama
   - QA butuh use-case nyata yang bisa dipanggil dari `worker_threads` dengan koneksi sendiri.
   - Tanpa ini P0-001..P0-005 tidak bisa ditulis. Me-mock DB tidak membuktikan transaksi (AD-14).
2. **B-2: Clock palsu beku, seed dengan kelas Selesai, admin seed non-interaktif** — dev backend — sebelum E2E pertama
   - `KELASKU_FAKE_NOW` = instan ISO UTC beku; `seed:demo` membuat kelas relatif ke `Clock.todayJakarta()`, **termasuk kelas Selesai** dengan Terdaftar + Daftar tunggu; admin dari `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` di `.env`.
   - Tanpa ini P0-009, P1-018 (E2E), dan semua E2E admin terblokir.
3. **HP-2: registri `code → httpStatus` di `src/shared/errors.ts`** — tech lead — Sprint 0
   - Test API meng-assert `error.code` **dan** status dari registri, bukan angka hardcode.
4. **HP-4: keputusan `@seontechnologies/playwright-utils`** — arsitek — sebelum E2E pertama.

### Setup infrastruktur QA (Sprint 0)

1. **Konfigurasi Vitest** (`vitest.config.ts`, satu berkas dengan dua `projects`)
   - `unit`: `src/shared/**`, `src/server/domain/**`, `src/client/api/**`; tanpa I/O.
   - `integration`: `src/server/{data,services,http}/**`; `pool: 'forks'`; `env: { TZ: 'UTC', NODE_ENV: 'test' }` (HP-1).
   - Coverage `v8` untuk `src/server/domain` + `src/server/services` (asumsi target ≥80%).
2. **Helper test** (`test/helpers/`)
   - `fixed-clock.ts`: `fixedClock(isoUtc)` → `Clock`; `advance(clock, days)` untuk transisi ke Selesai tanpa menyentuh DB.
   - `test-db.ts`: `createTestDb(nowIso)` → berkas di `os.tmpdir()` (nama acak), migrasi diterapkan, `services` siap, dihapus di `afterAll`.
   - `builders.ts`: `givenClass({ quota, sessionDates })`, `givenRegistrations(cls, n)`, `givenFullClassWithWaitlist(k)`. Builder memanggil **use-case**, bukan SQL mentah, supaya state selalu sah. Pengecualian: P1-013 butuh state yang tidak sah, jadi memakai repository langsung.
   - `run-concurrently.ts` + `concurrency-worker.ts`: N worker, koneksi masing-masing, mulai serentak lewat barrier `Atomics` (contoh di bawah).
   - Data unik per test: `crypto.randomUUID()` untuk email/judul (tanpa faker; tidak ada di stack).
3. **Kontrol negatif harness (sekali, Sprint 0):** varian use-case daftar yang mengecek kuota di luar transaksi harus **gagal** di P0-001. Ini bukti bahwa harness bisa menangkap race (R-008). Varian itu tidak di-commit.
4. **Konfigurasi Playwright** (`playwright.config.ts`)
   - `webServer`: hapus `./data/e2e.db` → `npm run build` → `npm run seed:demo` → `npm start`, dengan env `NODE_ENV=test`, `KELASKU_FAKE_NOW=<instan tetap>`, `DATABASE_PATH=./data/e2e.db`, `PORT` khusus test.
   - Projects: `admin-desktop` (viewport 1366×768) dan `participant-mobile` (360×740). Keduanya `timezoneId: 'UTC'`, `locale: 'id-ID'`.
   - `support/merged-fixtures.ts`: `mergeTests` dari `apiRequest`, `networkErrorMonitor`, `log`, file-utils (`handleDownload`/`readCSV`), ditambah fixture proyek `adminLogin` dan `axe`.
   - Aturan data: kelas hasil seed **hanya dibaca**; test yang mengubah data membuat kelasnya sendiri lewat `POST /api/admin/classes` dengan judul unik.
   - Selector: `getByRole`/`getByLabel` dengan teks Indonesia lebih dulu; `data-testid` hanya untuk baris/sel tabel (lihat handoff).
5. **Burn-in:** test konkurensi memakai `{ repeats: Number(process.env.BURN_IN ?? 0) }`; `BURN_IN=19 npx vitest run --project integration -t "R1|R2|R4|R7"` menghasilkan 20 run.
6. **Kinerja:** `scripts/seed-perf.ts` (±240 kelas, ±5.000 pendaftaran, presensi) dan `scripts/perf-check.ts` (Node `fetch`, tanpa dependensi baru; hasil p50/p95 per endpoint ke JSON). Jalankan server di bawah `taskset -c 0`.

**Contoh harness konkurensi (Vitest, nama use-case mengikuti B-1):**

```typescript
// test/helpers/concurrency-worker.ts
import { parentPort, workerData } from 'node:worker_threads';
import { createDb } from '../../src/server/data/db';
import { createServices } from '../../src/server/services';
import { fixedClock } from './fixed-clock';

const { sync, dbPath, nowIso, op, input } = workerData as {
  sync: Int32Array; dbPath: string; nowIso: string; op: string; input: unknown;
};
const services = createServices({ db: createDb(dbPath), clock: fixedClock(nowIso) });

Atomics.add(sync, 0, 1);  // siap
Atomics.wait(sync, 1, 0); // tunggu aba-aba
try {
  parentPort!.postMessage({ ok: true, value: (services as any)[op](input) });
} catch (err) {
  parentPort!.postMessage({ ok: false, code: (err as { code?: string }).code });
}
```

```typescript
// test/helpers/run-concurrently.ts
import { Worker } from 'node:worker_threads';

export type WorkerResult<T> = { ok: true; value: T } | { ok: false; code?: string };

export async function runConcurrently<T>(opts: {
  dbPath: string; nowIso: string; op: string; inputs: unknown[];
}): Promise<WorkerResult<T>[]> {
  const sync = new Int32Array(new SharedArrayBuffer(8)); // [siap, mulai]
  const done = opts.inputs.map(
    (input) =>
      new Promise<WorkerResult<T>>((resolve, reject) => {
        const w = new Worker(new URL('./concurrency-worker.ts', import.meta.url), {
          execArgv: ['--import', 'tsx'],
          workerData: { sync, dbPath: opts.dbPath, nowIso: opts.nowIso, op: opts.op, input },
        });
        w.once('message', resolve);
        w.once('error', reject);
      }),
  );
  while (Atomics.load(sync, 0) < opts.inputs.length) {
    await new Promise((r) => setImmediate(r)); // menyerahkan event loop, bukan sleep
  }
  Atomics.store(sync, 1, 1);
  Atomics.notify(sync, 1);
  return Promise.all(done);
}
```

```typescript
// src/server/services/registrations.concurrency.test.ts
import { describe, it, expect } from 'vitest';
import { createTestDb } from '../../../test/helpers/test-db';
import { runConcurrently } from '../../../test/helpers/run-concurrently';

const NOW = '2026-11-09T03:00:00.000Z'; // Senin 10.00 WIB
const BURN_IN = Number(process.env.BURN_IN ?? 0);

describe('R1: registered count never exceeds quota', () => {
  it('R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered', { repeats: BURN_IN }, async () => {
    const { dbPath, services } = createTestDb(NOW);
    const cls = services.createClass({ title: 'Kelas R1', quota: 5, sessionDates: ['2026-11-16'] });

    const results = await runConcurrently<{ status: string }>({
      dbPath, nowIso: NOW, op: 'register',
      inputs: Array.from({ length: 20 }, (_, i) => ({ code: cls.publicCode, name: `Peserta ${i}`, email: `p${i}@contoh.id` })),
    });

    expect(results.filter((r) => !r.ok)).toEqual([]); // tidak ada SQLITE_BUSY / 500
    const statuses = results.map((r) => (r.ok ? r.value.status : 'error'));
    expect(statuses.filter((s) => s === 'registered')).toHaveLength(5);
    expect(statuses.filter((s) => s === 'waitlisted')).toHaveLength(15);
    expect(services.getAdminClass(cls.id).registered).toHaveLength(5); // dibaca ulang dari DB
  });
});
```

---

## Penilaian Risiko

Detail skor dan mitigasi ada di dokumen arsitektur.

### Risiko tinggi (≥6)

| Risk ID | Kat. | Deskripsi | Skor | Coverage QA |
| --- | --- | --- | --- | --- |
| **R-001** | DATA | Kursi terakhir diambil dua pendaftaran | **6** | P0-001, P0-005, P0-009, P1-012; burn-in ×20 |
| **R-002** | DATA | Pendaftaran aktif ganda / 500 dari unique index | **6** | P0-002, P1-015, P1-016, P1-017, P1-020, P1-025 |
| **R-003** | DATA | Promosi ganda / kuota terlampaui saat batal bersamaan | **6** | P0-003, P0-004, P1-026..P1-028, P1-031, P1-032 |
| **R-005** | BUS | "Hari ini" salah zona | **6** | P0-006, P1-003, P1-009, P1-046, P1-050, P2-004 |
| **R-008** | TECH | Test konkurensi palsu atau flaky | **6** | Kontrol negatif harness + burn-in ×20 atas P0-001..P0-005 |
| **R-016** | OPS | E2E tidak deterministik / terblokir | **6** | Semua E2E dijalankan 3× dengan `--workers=4` setelah B-2 |

### Risiko sedang/rendah

| Risk ID | Kat. | Deskripsi | Skor | Coverage QA |
| --- | --- | --- | --- | --- |
| R-004 | BUS | Antrean disalip | 4 | P1-002, P1-012, P1-013, P1-014 |
| R-009 | DATA | Penjaga kelas Selesai bolong | 4 | P1-008, P1-009, P1-018, P1-030, P1-034, P1-040 |
| R-010 | DATA | Ubah tanggal sesi memutus presensi | 4 | P1-003, P1-005..P1-007, P1-041, P2-009 |
| R-012 | SEC | Injeksi formula CSV | 4 | P1-043, P1-045 |
| R-013 | SEC | Status/pembatalan lewat email (diterima) | 4 | P1-029 |
| R-014 | PERF | NFR-7 tidak terbukti / N+1 | 4 | P2-018, P2-019, P2-021 |
| R-017 | BUS | WCAG / 360 px | 4 | P1-047, P1-048, P2-005, P2-007, P2-008, P3-002, P3-003 |
| R-019 | TECH | Aturan lapisan terkikis | 4 | P1-050, P3-005 |
| R-021 | DATA | Roster presensi salah | 4 | P1-017, P1-035, P1-036, P1-038, P1-039, P2-003 |
| R-006 | BUS | Kelayakan R6 salah/berbeda antar-permukaan | 3 | P0-007, P1-033, P1-041, P1-042, P2-001 |
| R-007 | DATA | Turun kuota vs pendaftaran bersamaan | 2 | P0-005, P1-001 |
| R-011 | SEC | Route admin tanpa auth | 2 | P0-008, P1-021..P1-023, P2-012, P2-016 |
| R-015 | OPS | Migrasi/restore | 2 | P1-049, P2-017, P3-006 |
| R-018 | BUS | CSV/label/tanggal | 2 | P1-043, P1-044, P2-014, P2-022, P3-001 |
| R-020 | OPS | `SQLITE_BUSY` → 503 | 2 | P2-013, P2-019 |

---

## Rencana Coverage NFR

| Kategori NFR | Kebutuhan / ambang | Validasi yang direncanakan | Alat / level | Artefak bukti | Prioritas |
| --- | --- | --- | --- | --- | --- |
| Keamanan (NFR-8) | 401 di semua `/api/admin/*`; hash scrypt; validasi server; tulis hanya JSON; `.env` tidak dilacak; log tanpa PII | P0-008, P1-021..P1-023, P2-015, P2-016, P2-020 | API (`fastify.inject`), integrasi, skrip | Laporan Vitest | P0–P2 |
| Kinerja (NFR-7) | p95 < 1 s per halaman/aksi; CSV < 2 s; data satu tahun; 1 inti | P2-018, P2-019, P2-021 | `seed:perf` + `perf-check` di bawah `taskset -c 0` | `_bmad-output/test-artifacts/evidence/perf-<tanggal>.json` | P2 |
| Konsistensi (NFR-1) | Lulus berulang tanpa flake | P0-001..P0-005 dengan `BURN_IN=19` | Vitest + `worker_threads` | Log burn-in `evidence/burn-in-<tanggal>.txt` | P0 |
| Zona waktu (NFR-2) | Asia/Jakarta, lepas dari zona server/browser | P0-006, P1-046, P2-004 | Unit/API dengan `TZ=UTC`; E2E `timezoneId: 'UTC'` | Laporan Vitest/Playwright | P0–P2 |
| Aksesibilitas (NFR-3) | WCAG 2.1 AA | P1-047, P2-005, P2-008, P3-002, P3-003 | axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`), keyboard E2E, NVDA manual | Laporan HTML Playwright + catatan manual | P1–P3 |
| Tata letak (NFR-4) | 360 px tanpa gulir horizontal; admin 1366×768 | P1-048, P2-007 | E2E (`scrollWidth ≤ clientWidth`) | Laporan Playwright | P1–P2 |
| Bahasa (NFR-5) | Teks/pesan/header CSV Indonesia; format tanggal | P1-043, P1-019, P2-014, P2-022 | Unit, API | Laporan Vitest | P1–P2 |
| Pemulihan | Backup harian; pra-migrasi; restore | P1-049, P2-017, P3-006 | Integrasi, drill manual | Catatan drill restore | P1–P3 |
| Maintainability (NFR-9) | Test R1–R7 dengan ID di nama; coverage | P1-050; `grep -rE "R[1-7]:"` atas berkas test | Vitest coverage v8, skrip | `coverage/coverage-summary.json` | P1 |

**Ambang/bukti yang belum ada:** konkurensi beban NFR-7 (asumsi: berurutan + ledakan 20 paralel); RTO/RPO; target coverage (asumsi ≥80% domain+services); jumlah burn-in (asumsi 20). Konfirmasi sebelum `bmad-testarch-nfr`.

---

## Kriteria Masuk

- [ ] B-1, B-2, HP-2 selesai; keputusan HP-4 tercatat
- [ ] `package.json` memuat `test`, `test:e2e`, `typecheck`, `seed:demo` (spine §Structural Seed)
- [ ] Helper Sprint 0 (clock, test-db, builders, run-concurrently) ada, dan kontrol negatif harness terbukti merah
- [ ] `seed:demo` menghasilkan semua state addendum §4 + kelas Selesai, relatif terhadap `KELASKU_FAKE_NOW`
- [ ] `.env` lokal berisi kredensial admin seed (tidak di-commit)
- [ ] Asumsi NFR (konkurensi, coverage, burn-in) disetujui tech lead/PM

## Kriteria Keluar (gate per rilis/epik)

- [ ] P0 lulus 100%; burn-in konkurensi ×20 tanpa gagal
- [ ] P1 lulus ≥95%; kegagalan sisanya punya waiver dengan pemilik dan tanggal
- [ ] Setiap R1–R7 yang dicakup epik punya test dengan ID aturan di nama `describe`/`it`
- [ ] Tidak ada bug terbuka berseverity tinggi; semua risiko skor ≥6 bermitigasi dan terverifikasi
- [ ] Coverage `domain/` + `services/` ≥80% (asumsi)
- [ ] E2E hijau 3× berturut-turut (R-016)
- [ ] Bukti NFR terkumpul per kategori di atas. Status PASS/CONCERNS/FAIL diputuskan oleh `bmad-testarch-nfr`

---

## Rencana Coverage Test

**PENTING:** P0/P1/P2/P3 = **prioritas dan tingkat risiko**, BUKAN waktu eksekusi. Waktu eksekusi ada di bagian Strategi Eksekusi.

Level: **Unit** = fungsi murni (domain/shared/client api). **Integrasi** = use-case + berkas SQLite nyata. **API** = `fastify.inject` dengan DB nyata. **E2E** = Playwright pada build produksi. Setiap perilaku diuji di satu level saja; E2E hanya untuk perjalanan pengguna, a11y, dan tata letak.

### P0 (Kritis)

**Kriteria:** dampak kritis pada bisnis, keamanan, atau integritas data, tanpa jalan pintas yang aman.

| Test ID | Kebutuhan | Level | Risk Link | Catatan |
| --- | --- | --- | --- | --- |
| **P0-001** | R1: 20 pendaftaran paralel ke kelas kuota 5 → tepat 5 Terdaftar, 15 Daftar tunggu | Integrasi (worker) | R-001, R-008 | Contoh di atas; tanpa hasil error |
| **P0-002** | R2: pendaftaran identik bersamaan (termasuk `"Budi@Mail.com "` vs `"budi@mail.com"`) → satu baris aktif, semua respons 200 | Integrasi (worker) | R-002, R-008 | Respons yang kalah = `alreadyActive: true` |
| **P0-003** | R4: dua Terdaftar batal bersamaan di kelas dengan antrean 3 → Terdaftar = kuota, dua peserta berbeda naik | Integrasi (worker) | R-003, R-008 | Cek tidak ada `promoted_at` ganda |
| **P0-004** | R4: peserta dan admin membatalkan pendaftaran yang sama bersamaan → satu transisi, pembatal pertama tersimpan, ≤1 promosi | Integrasi (worker) | R-003 | Sisi yang kalah = `alreadyCancelled: true` |
| **P0-005** | R7: turunkan kuota berpacu dengan pendaftaran → Terdaftar ≤ kuota setiap saat; penolakan menyebut N sebenarnya | Integrasi (worker) | R-001, R-007 | Ulangi dengan urutan start acak |
| **P0-006** | R5: presensi sesi hari ini (WIB) diterima, besok ditolak `session_not_yet_open`, pada 23.30 WIB (`16:30Z`) dan 06.00 WIB (`23:00Z` hari sebelumnya) | API | R-005 | Clock disuntik, `TZ=UTC` |
| **P0-007** | R6: Layak bila `hadir*5 >= total*4`; tabel 1→1, 3→3, 4→4, 5→4 plus satu di bawah ambang | Unit | R-006 | `it.each`; tidak ada `0.8` |
| **P0-008** | FR-1/NFR-8: setiap route `/api/admin/*` tanpa sesi → 401 envelope | API | R-011 | Daftar route diambil dari `fastify.printRoutes`/hook `onRoute`, tidak hardcode |
| **P0-009** | UJ-1+UJ-2 smoke: admin membuat kelas kuota 1 → peserta (360 px) Terdaftar → peserta kedua melihat "Daftar tunggu #1"; tabel admin "1/1" + "Penuh" | E2E | R-001, R-016 | Satu-satunya E2E P0 |

**Total P0:** ~9

### P1 (Tinggi)

**Kriteria:** perilaku inti, sering dipakai, atau kompleks; menjangkau banyak pengguna; jalan pintasnya terbatas.

| Test ID | Kebutuhan | Level | Risk Link | Catatan |
| --- | --- | --- | --- | --- |
| **P1-001** | R7: kuota < Terdaftar → `quota_below_registered`, "Kuota minimal N (jumlah terdaftar saat ini)" | API | R-007 | |
| **P1-002** | R3: kuota naik mempromosikan `min(baru − Terdaftar, antrean)` dari kepala antrean dalam transaksi yang sama; `promotedCount` dikembalikan | Integrasi | R-004 | `promoted_at = ctx.nowIso` |
| **P1-003** | FR-2: validasi tanggal (kosong, ganda menyebut tanggalnya, tidak ada yang ≥ hari ini WIB; tanggal lampau boleh) | Unit | R-010, R-005 | Fungsi domain dipakai buat & ubah |
| **P1-004** | FR-2: judul 1–120 setelah trim; kuota bulat ≥1; `fields` berpath titik (`sessionDates.2`) dan pesan Indonesia | API | — | |
| **P1-005** | FR-3: ubah tanggal = diff (insert/delete); id sesi yang tidak berubah tetap | Integrasi | R-010 | |
| **P1-006** | FR-3: hapus tanggal yang punya presensi → `session_has_attendance` | Integrasi | R-010 | |
| **P1-007** | FR-3: diff tidak kosong + presensi ada → 409 `confirmation_required`; lolos dengan `confirmSessionChange: true` | API | R-010 | |
| **P1-008** | AD-18: kelas Selesai hanya bisa ubah judul; kuota/tanggal → `class_finished` | Integrasi | R-009 | Clock dimajukan |
| **P1-009** | Status kelas Dibuka/Penuh/Selesai; sesi terakhir = hari ini masih Dibuka | Unit | R-009, R-005 | |
| **P1-010** | FR-4: daftar kelas: urutan (sesi terdekat dulu, Selesai di bawah), terisi/kuota, jumlah antrean, sesi berikutnya, `today` | API | — | Urutan dari server (AD-20) |
| **P1-011** | FR-6/AD-10: `publicCode` stabil setelah ganti judul; 10 karakter base64url; id internal tidak ada di URL/DTO publik | API | R-013 | |
| **P1-012** | R1/R3: keputusan Terdaftar ⇔ `count < kuota` **dan** antrean kosong | Unit | R-001, R-004 | |
| **P1-013** | R3: pendaftaran baru masuk antrean bila antrean tidak kosong walau ada kursi | Integrasi | R-004 | State disiapkan lewat repository |
| **P1-014** | R3: FIFO berdasarkan `id`; posisi 1-based sama di hasil daftar, halaman admin, dan status peserta | Integrasi | R-004 | Clock beku → `created_at` identik |
| **P1-015** | R2: `normalizeEmail` trim + lowercase | Unit | R-002 | |
| **P1-016** | R2: daftar ulang (serial) dengan email aktif → status lama, "Anda sudah di daftar tunggu #N", tanpa baris baru | API | R-002 | |
| **P1-017** | R2: setelah Dibatalkan boleh daftar lagi → baris baru di ekor antrean; presensi lama tidak diwarisi | Integrasi | R-002, R-021 | |
| **P1-018** | FR-7: kelas Selesai → `registration_closed` dengan pesan "Pendaftaran kelas ini sudah ditutup" | API | R-009 | |
| **P1-019** | FR-7: nama 1–100, format email; pesan Indonesia | API | — | |
| **P1-020** | AD-5: `SQLITE_CONSTRAINT_UNIQUE` → 200 `alreadyActive`, bukan 500 | Integrasi | R-002 | Paksa jalur insert kedua lewat repository |
| **P1-021** | FR-1: kredensial salah → "Email atau password salah" (sama untuk email/password); sukses → cookie `HttpOnly`, `SameSite=Lax`, `Path=/` | API | R-011 | |
| **P1-022** | FR-1: logout menghapus baris sesi; cookie lama → 401; sesi kedaluwarsa setelah 12 jam | API | R-011 | Clock dimajukan |
| **P1-023** | NFR-8: endpoint tulis menolak `Content-Type` selain JSON | API | R-011 | |
| **P1-024** | UJ-1: masuk → buat kelas 4 tanggal kuota 20 → salin tautan → baris "0/20" + sesi berikutnya; akses `/admin` tanpa sesi dialihkan ke `/admin/masuk` | E2E | R-016 | `admin-desktop` |
| **P1-025** | UJ-2: tekan "Daftar" dua kali di 360 px → satu pendaftaran, status sama | E2E | R-002 | `participant-mobile` |
| **P1-026** | R4: batal Terdaftar mempromosikan kepala antrean | Integrasi | R-003 | |
| **P1-027** | R4: batal Daftar tunggu tidak mempromosikan siapa pun; posisi di belakangnya maju | Integrasi | R-003 | |
| **P1-028** | R4: batal yang sudah Dibatalkan → 200 `alreadyCancelled`, tanpa tulis, `cancelled_at/by` tetap | Integrasi | R-003 | |
| **P1-029** | AD-16: pembatalan publik butuh `registrationRef` + email cocok; selain itu `registration_not_found` | API | R-013 | |
| **P1-030** | Kelas Selesai: batal → `class_finished`; tidak ada promosi | Integrasi | R-009 | |
| **P1-031** | FR-12: batal admin mencatat `cancelled_by='admin'`, DTO `CancellationResult` sama dengan rute publik | API | R-003 | |
| **P1-032** | UJ-3: peserta batal lewat dialog dua langkah yang menyebut judul → peserta antrean tampil "Terdaftar (naik dari daftar tunggu)"; admin melihat "Naik dari daftar tunggu" + waktu | E2E | R-003 | |
| **P1-033** | FR-14: status lewat email: semua pendaftaran aktif, label, posisi, "Hadir x dari y", kelayakan; email tanpa pendaftaran → 200 "Tidak ada pendaftaran aktif untuk email ini" | API | R-006 | |
| **P1-034** | FR-10: Daftar tunggu di kelas Selesai → "Kelas selesai — tidak naik dari daftar tunggu", tanpa posisi | Unit | R-009 | |
| **P1-035** | FR-15: simpan batch (upsert); buka ulang menampilkan yang tersimpan; koreksi menimpa; `present: null` tidak ditulis | Integrasi | R-021 | |
| **P1-036** | AD-11: batch berisi pendaftaran yang bukan Terdaftar → 409 `roster_changed`, tidak ada yang tertulis | Integrasi | R-021 | |
| **P1-037** | AD-11: tanggal bukan sesi → 404 `session_not_found` | API | — | |
| **P1-038** | FR-15: peserta yang naik setelah sesi disimpan → `sessionSaved: true`, `present: null` ("belum dicatat") | Integrasi | R-021 | |
| **P1-039** | Presensi pendaftaran Dibatalkan tetap di DB, tetapi tidak muncul di formulir/grid/CSV/kelayakan | Integrasi | R-021, R-006 | |
| **P1-040** | Koreksi presensi tetap bisa di kelas Selesai | Integrasi | R-009 | |
| **P1-041** | R6: kelayakan berubah setelah tanggal sesi ditambah/dihapus | Integrasi | R-006, R-010 | |
| **P1-042** | AD-6: grid, status peserta, dan CSV memberi hadir/total/kelayakan identik untuk fixture yang sama | Integrasi | R-006 | |
| **P1-043** | CSV: BOM, CRLF, kutip RFC 4180 (koma, kutip, baris baru, non-ASCII), header Indonesia, prefix `'` untuk `= + - @` | Unit | R-012, R-018 | |
| **P1-044** | CSV endpoint: `Content-Disposition` dengan `filename` ASCII aman (`/ \ : * ? " < > \|` → `-`) + `filename*` UTF-8; tanggal WIB | API | R-018 | |
| **P1-045** | UJ-4: hari sesi terakhir, simpan presensi → grid "hadir 4 dari 4"/"Layak" → Ekspor CSV, baris CSV = grid | E2E | R-006, R-012 | `handleDownload` + `readCSV` |
| **P1-046** | Clock: `todayJakarta` di `16:59:59.999Z` vs `17:00:00.000Z`; `KELASKU_FAKE_NOW` diabaikan bila `NODE_ENV≠test` | Unit | R-005 | |
| **P1-047** | Axe: 0 pelanggaran WCAG 2.1 A/AA di setiap permukaan IA (10 rute UI) | E2E | R-017 | Asumsi: nol pelanggaran, semua impact |
| **P1-048** | 360 px: `/daftar/:kode` dan `/status` tanpa gulir horizontal; semua tombol terjangkau | E2E | R-017 | |
| **P1-049** | AD-12: DB baru → `user_version` terbaru; DB berisi + migrasi tertunda → backup pra-migrasi; migrasi gagal → exit ≠ 0, DB tidak berubah | Integrasi | R-015 | |
| **P1-050** | Fitness test arsitektur (HP-3): import lapisan, `Date` di domain/services, fungsi waktu SQL, `client` ↛ `server` | Unit (statis) | R-019, R-005 | |

**Total P1:** ~50

### P2 (Sedang)

**Kriteria:** perilaku sekunder, jangkauan pengguna lebih sempit, ada jalan pintas yang dapat diterima.

| Test ID | Kebutuhan | Level | Risk Link | Catatan |
| --- | --- | --- | --- | --- |
| **P2-001** | FR-20 (SHOULD): "Tidak mungkin layak" pada contoh PRD (5/2 → ya; 5/1 → tidak; 3/1 → ya) | Unit | R-006 | |
| **P2-002** | FR-17 (SHOULD): `/api/admin/today` urut judul; kosong → "Tidak ada sesi hari ini" | API | R-005 | |
| **P2-003** | FR-18 (SHOULD): formulir yang belum disimpan tercentang semua; yang tersimpan menampilkan nilai DB | E2E | R-021 | |
| **P2-004** | FR-16 UI: sesi mendatang tidak bisa diisi, teks "Bisa diisi mulai {tanggal}"; browser `timezoneId: 'UTC'` | E2E | R-005 | |
| **P2-005** | FR-15: formulir presensi bisa dipakai penuh dengan keyboard; hasil simpan diumumkan lewat live region | E2E | R-017 | |
| **P2-006** | FR-5: bagian Terdaftar/Daftar tunggu/Dibatalkan (bisa dilipat, menampilkan pembatal) | E2E | — | |
| **P2-007** | FR-4: 50 kelas di 1366×768 tanpa gulir horizontal; "Penuh" berupa teks + ikon | E2E | R-017 | |
| **P2-008** | FR-6: "Salin tautan" menyalin URL dan mengumumkannya ke pembaca layar | E2E | R-017 | Izin clipboard di context |
| **P2-009** | FR-3 UI: alasan tanggal tidak bisa dihapus; dialog konfirmasi perubahan sesi | E2E | R-010 | |
| **P2-010** | AD-13: penjaga perubahan belum tersimpan (`useBlocker` + `beforeunload`) | E2E | — | |
| **P2-011** | AD-8: `/api/*` tak dikenal → 404 envelope; path lain → `index.html` | API | — | |
| **P2-012** | AD-8 fetch wrapper: gagal jaringan → `network_error`; non-envelope → `unexpected_response`; 401 → `/admin/masuk?next=` hanya same-origin (`//evil.example` ditolak) | Unit | R-011 | |
| **P2-013** | AD-3: `SQLITE_BUSY` → 503 `database_busy` | Integrasi | R-020 | `busyTimeoutMs: 50` |
| **P2-014** | NFR-5: `format.ts` → "Senin, 9 Nov 2026" dan "9 Nov 2026, 14.32 WIB" dari timestamp UTC | Unit | R-018 | |
| **P2-015** | Log pino tidak memuat email, nama, password, token saat daftar/login | Integrasi | — | NFR-8; tangkap stream logger |
| **P2-016** | `admin:create` idempoten; hash scrypt dengan salt berbeda per akun | Integrasi | R-011 | |
| **P2-017** | `npm run backup` menghasilkan salinan yang lolos `PRAGMA integrity_check` dan bisa dibuka server | Integrasi | R-015 | |
| **P2-018** | NFR-7: p95 < 1 s tiap halaman/aksi dan CSV < 2 s pada `seed:perf`, 1 inti | Skrip kinerja | R-014 | Klien berurutan (asumsi) |
| **P2-019** | NFR-7: ledakan 20 pendaftaran paralel lewat HTTP → semua 200, tanpa 503, p95 < 1 s | Skrip kinerja | R-014, R-020 | |
| **P2-020** | NFR-8: `.env` tidak dilacak git; `.env.example` berisi kunci tanpa nilai | Skrip statis | — | |
| **P2-021** | Tanpa N+1: daftar kelas dan rekap menjalankan jumlah query terbatas, tidak bergantung jumlah baris | Integrasi | R-014 | Hitung statement lewat wrapper `db` |
| **P2-022** | Semua status DTO punya label di `glossary.ts` | Unit | R-018 | |

**Total P2:** ~22

### P3 (Rendah)

**Kriteria:** jarang, kosmetik, atau eksploratif; dampak minimal; jalan pintas mudah.

| Test ID | Kebutuhan | Level | Risk Link | Catatan |
| --- | --- | --- | --- | --- |
| **P3-001** | CSV dengan nama non-ASCII/koma dibuka di Excel (Windows) | Manual | R-018 | Sekali sebelum rilis |
| **P3-002** | Pembaca layar (NVDA) di alur pendaftaran dan presensi | Manual | R-017 | |
| **P3-003** | Kontras pasangan token `tokens.css` ≥ 4,5:1 | Unit | R-017 | Hitung dari token |
| **P3-004** | Uji coba berwaktu dengan Rina: rekap < 5 menit (SM-2) | UAT manual | — | |
| **P3-005** | Tidak ada warna hex di luar `tokens.css` | Unit (statis) | R-019 | |
| **P3-006** | Drill restore di server target (stop → salin backup → hapus `-wal`/`-shm` → start) | Manual | R-015 | Sebelum go-live |
| **P3-007** | Eksploratif: matikan server di tengah ledakan pendaftaran → setelah restart DB konsisten (`integrity_check` + Terdaftar ≤ kuota) | Manual | R-001 | |

**Total P3:** ~7

---

## Strategi Eksekusi

**Filosofi:** jalankan semuanya di setiap perubahan kecuali yang mahal atau lama. CI belum ada (spine §Deferred), jadi "setiap PR" = **lokal sebelum commit**, sesuai AGENTS.md ("jalankan seluruh test dan pastikan hijau sebelum commit"). Playwright dengan paralelisasi bisa menjalankan ratusan test dalam ~10–15 menit; suite ini jauh lebih kecil.

### Setiap PR / sebelum commit (~3–6 menit)

- `npm test`: Vitest `unit` + `integration`, termasuk P0 konkurensi (1 run). Perkiraan < 2 menit.
- `npm run test:e2e`: Playwright, 2 project, `--workers=4`. Perkiraan 2–4 menit.
- `npm run typecheck`.

### Sebelum merge story yang menyentuh `registrations`/`cancellation`/`classes` (~5–10 menit)

- Burn-in konkurensi: `BURN_IN=19 npx vitest run --project integration -t "R1|R2|R4|R7"`.

### Sebelum rilis MVP (pengganti nightly; ~30–60 menit)

- `seed:perf` + `perf-check` di bawah `taskset -c 0` (P2-018, P2-019). Bukti disimpan ke `_bmad-output/test-artifacts/evidence/`.
- E2E 3× berturut-turut (R-016).

### Manual (sebelum go-live)

- P3-001, P3-002, P3-004, P3-006, P3-007.

---

## Estimasi Upaya QA

Hanya upaya pengembangan test; scaffolding aplikasi, migrasi, dan seed dihitung sebagai upaya dev.

| Prioritas | Jumlah | Rentang upaya | Catatan |
| --- | --- | --- | --- |
| P0 | ~9 | ~16–28 jam | Termasuk harness worker, barrier, kontrol negatif |
| P1 | ~50 | ~35–60 jam | Sebagian besar integrasi/API dengan builder |
| P2 | ~22 | ~10–22 jam | Termasuk skrip kinerja |
| P3 | ~7 | ~4–10 jam | Manual/eksploratif |
| **Total** | ~88 | **~65–120 jam** | **≈1,5–3 minggu satu orang; ≈3–5 hari bila dibagi 3 dev** |

**Asumsi:** termasuk desain, implementasi, dan debug test; tidak termasuk pemeliharaan (~10%); helper Sprint 0 siap sebelum P1.

**Konsekuensi untuk target 1 minggu:** P0 + test R1–R7 di P1 wajib. P2/P3 boleh ditunda pasca-MVP lewat waiver.

---

## Serah Terima ke Perencanaan Implementasi

| Pekerjaan | Pemilik | Target | Dependensi / catatan |
| --- | --- | --- | --- |
| B-1 `createDb`/`createServices` | Tech lead | Sprint 0 | Prasyarat P0-001..005 |
| B-2 clock beku, seed + kelas Selesai, admin seed dari `.env` | Dev backend | Sprint 0 | Prasyarat semua E2E |
| HP-2 registri `code → httpStatus` | Tech lead | Sprint 0 | |
| Vitest config + helper + harness + kontrol negatif | Tech lead | Sprint 0 | B-1 |
| Playwright config + merged fixtures + axe | Dev frontend | Sprint 0 | B-2, HP-4 |
| Fitness test arsitektur (P1-050) | Tech lead | Sprint 0 | |
| P0-001, P0-002, P0-005, P0-006..P0-009 | Dev backend / frontend | Epik 1 | |
| P0-003, P0-004 | Dev backend | Epik pembatalan | AD-16 |
| `seed:perf` + `perf-check` | Tech lead | Sebelum rilis | HP-5 |

---

## Tooling & Akses

| Alat | Tujuan | Akses | Status |
| --- | --- | --- | --- |
| `@seontechnologies/playwright-utils` | `apiRequest`, `handleDownload`/`readCSV`, `networkErrorMonitor`, `log` | devDependency npm | Pending (HP-4) |
| `taskset` (Linux) / `start /affinity 1` (Windows) | Batasi server ke 1 inti untuk NFR-7 | Mesin tim | Siap |
| NVDA | Pemeriksaan pembaca layar manual | Laptop Windows | Pending |

---

## Interworking & Regresi

| Komponen | Dampak | Cakupan regresi | Validasi |
| --- | --- | --- | --- |
| **`services/promotion` (satu jalur, AD-4)** | Dipakai kuota naik, batal peserta, batal admin | P0-003/004, P1-002, P1-026..P1-031 | Setiap perubahan promosi → burn-in |
| **`data/db.ts` `withWriteTx`** | Semua use-case tulis | Seluruh P0 + integrasi | Burn-in |
| **`domain/eligibility`, status kelas** | Grid, status, beranda, CSV (AD-6) | P0-007, P1-009, P1-042 | `npm test` |
| **`server/clock.ts`** | R5, status Selesai, timestamp | P0-006, P1-046, P2-004 | `TZ=UTC` |
| **Migrasi** | Semua data | P1-049 | DB salinan versi sebelumnya |
| **`src/shared/dto.ts`/`errors.ts`** | Klien dan server | `typecheck` + test API | `npm run typecheck` |

**Strategi regresi:** seluruh suite berjalan sebelum setiap commit. Epik lanjutan menambah test tanpa menghapus test Epik 1; test R1–R7 tidak boleh di-skip atau di-`.only` (aturan test-quality).

---

## Lampiran A: Contoh Kode & Tagging

Contoh Playwright memakai gaya `@seontechnologies/playwright-utils` (flag TEA aktif; menunggu HP-4).

```typescript
// e2e/registration.api.spec.ts
import { test } from './support/merged-fixtures';
import { expect } from '@playwright/test';

test('@P1 @API R1: last seat goes to the first registrant, the next one is waitlisted', async ({ apiRequest }) => {
  const uid = crypto.randomUUID().slice(0, 8);

  const login = await apiRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
  });
  expect(login.status).toBe(200);

  const { body: list } = await apiRequest({ method: 'GET', path: '/api/admin/classes' });
  const created = await apiRequest({
    method: 'POST',
    path: '/api/admin/classes',
    body: { title: `E2E kuota ${uid}`, quota: 1, sessionDates: [list.today] },
  });
  expect(created.status).toBe(200);

  const register = (n: number) =>
    apiRequest({
      method: 'POST',
      path: `/api/public/classes/${created.body.publicCode}/registrations`,
      body: { name: `Peserta ${n}`, email: `p${n}-${uid}@contoh.id` },
    });

  const first = await register(1);
  const second = await register(2);
  expect(first.body.status).toBe('registered');
  expect(second.body.status).toBe('waitlisted');
  expect(second.body.waitlistPosition).toBe(1);
});
```

```typescript
// e2e/a11y.spec.ts
import { test } from './support/merged-fixtures';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@P1 @A11y status page has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('/status');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(violations).toEqual([]);
});
```

Nama properti DTO (`publicCode`, `waitlistPosition`, `today`) mengikuti AD-20 dan dikunci di `src/shared/dto.ts`. Untuk Lampiran A belum ada skema respons; begitu `dto.ts` ada, skema zod-nya diberikan ke `apiRequest` untuk validasi bentuk respons.

**Tag:** `@P0..@P3`, level (`@API`, `@E2E`, `@A11y`), dan ID aturan di nama test (`R1:`).

```bash
npx playwright test --grep @P0             # hanya P0
npx playwright test --grep "@P0|@P1"       # P0 + P1
npx vitest run -t "R4"                      # semua test aturan R4
BURN_IN=19 npx vitest run --project integration -t "R1|R2|R4|R7"
```

---

## Lampiran B: Referensi Knowledge Base

- `risk-governance.md`, `probability-impact.md`: skor dan gate risiko
- `test-priorities-matrix.md`: kriteria P0–P3
- `test-levels-framework.md`: pemilihan unit/integrasi/E2E
- `test-quality.md`: DoD (tanpa hard wait, isolasi, test ≤1,5 menit)
- `nfr-criteria.md`, `adr-quality-readiness-checklist.md`: perencanaan NFR
- `playwright-utils-mandate.md`: pola fixture/utilitas Playwright

---

**Dibuat oleh:** BMad TEA Agent (Murat)
**Workflow:** `bmad-testarch-test-design`
**Versi:** 4.0 (BMad v6)
