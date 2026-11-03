---
stepsCompleted: ['step-01-preflight', 'step-02-select-framework', 'step-03-scaffold-framework', 'step-04-docs-and-scripts', 'step-05-validate-and-summary']
lastStep: 'step-05-validate-and-summary'
lastSaved: '2026-11-03'
mode: create
---

# Setup Kerangka Test — Kelasku

Workflow: `bmad-testarch-framework` (Create). Pengguna: Rustan. Tanggal: 2026-11-03.

## Langkah 1 — Preflight

- **Stack terdeteksi:** `fullstack`. Klien React 19 + Vite 8 (`src/client`), server Fastify 5 + better-sqlite3 (`src/server`), satu `package.json` npm (AD-1). Bundler: Vite. Bukan mobile.
- **Framework yang sudah ada (story 1.1):** `vitest.config.ts` (TZ=UTC, HP-1), `playwright.config.ts` (build produksi, `NODE_ENV=test`, `KELASKU_FAKE_NOW`, `timezoneId: 'UTC'`), `e2e/smoke.spec.ts` dengan axe, fitness test arsitektur `src/architecture.test.ts`, test HTTP `fastify.inject()`.
- **Prasyarat "tidak ada E2E framework":** tidak terpenuhi secara harfiah. Sesuai instruksi pengguna, setup ini **menyesuaikan dan memperluas** kerangka story 1.1 dan tidak membuatnya ulang. Tidak ada konflik.
- **Dokumen konteks:** `ARCHITECTURE-SPINE.md` (AD-1–AD-20, khususnya AD-3, AD-7, AD-14), `test-design-architecture.md`, `test-design-qa.md`, `epics.md` (story 1.1–1.3), AGENTS.md.
- **Auth:** sesi cookie admin (`/api/auth/*`) belum dibangun (story 1.4).

## Langkah 2 — Pilihan framework

- **Unit/integrasi:** Vitest 5.0.5. **E2E:** Playwright 1.64.1 + `@axe-core/playwright` 4.14.0. Ketiganya ditetapkan tabel Stack spine dan AD-14. Cypress tidak dipertimbangkan.
- **`tea_use_playwright_utils: true` → tidak dipasang (HP-4 masih pending).** `@seontechnologies/playwright-utils` tidak ada di tabel Stack spine, dan AGENTS.md melarang memilih library di luar spine (perubahan lewat `bmad-architecture`). Sesuai aturan workflow ("bila ditolak, pakai cabang disabled"), seluruh scaffold memakai **Playwright vanilla**. Fixture memakai `test.extend`, jadi migrasi ke `mergeTests` nanti cukup di `e2e/support/fixtures.ts`.
- **Pact (`tea_use_pactjs_utils: true`):** gate relevansi tertutup. Klien dan server ada di satu package dan berbagi `src/shared/dto.ts` (AD-20); tidak ada batas consumer–provider. Tidak ada artefak kontrak.

## Langkah 3 — Scaffold

Mode eksekusi: `sequential` (perubahan kecil dan saling terkait).

| Berkas | Perubahan |
| --- | --- |
| `vitest.config.ts` | Dua project: `unit` (`src/*.test.ts`, `src/shared`, `src/server/domain`, `src/client`) dan `integration` (`src/server/**` kecuali domain, `scripts/`, `test/`; `pool: 'forks'`). TZ=UTC tetap. Setiap test file masuk tepat satu project (diverifikasi dengan `vitest list`). |
| `test/helpers/temp-dir.ts` | `createTempDir(prefix)` → `{ path, file(), cleanup() }`; dasar DB sementara story 1.3. |
| `test/helpers/unique.ts` | `uniqueId()`, `uniqueEmail()`, `uniqueTitle()` (`crypto.randomUUID`, tanpa faker). |
| `test/helpers/helpers.test.ts` | Self-test helper. |
| `src/server/http/app.test.ts` | Memakai `createTempDir` sebagai ganti `mkdtempSync`/`rmSync` manual. |
| `src/architecture.test.ts` | `test/` ikut dipindai (aturan `better-sqlite3` hanya di `data/` berlaku juga untuk helper). |
| `tsconfig.json` | `test` masuk `include` sehingga `npm run typecheck` mencakup helper. |
| `playwright.config.ts` | Project `admin-desktop` (1366×768) dan `participant-mobile` (Pixel 7, 360×740); timeout action 15 s / navigasi 30 s / test 60 s / expect 10 s; trace `retain-on-failure-and-retries`, screenshot `only-on-failure`, video `retain-on-failure`; reporter list + HTML (+ JUnit bila `CI`); retry 2 di CI. TODO `seed:demo` di `webServer`. |
| `e2e/support/fixtures.ts` | `test`/`expect` proyek: fixture `expectNoA11yViolations` (axe, ringkasan pelanggaran yang mudah dibaca) dan `uid`. |
| `e2e/smoke.spec.ts` | Impor dari `./support/fixtures`; pemeriksaan axe lewat fixture. |

### Penyimpangan dari checklist workflow (disengaja)

| Item checklist | Keputusan | Alasan |
| --- | --- | --- |
| Direktori `tests/` dengan `support/fixtures/factories` | `test/helpers/` (Vitest) + `e2e/support/` (Playwright) | Pohon sumber spine memakai `e2e/`; test-design-qa menetapkan `test/helpers/`; test Vitest ditempatkan di samping kode. |
| Factory dengan faker + `cleanup()` | Belum ada factory; `unique.ts` saja | Faker tidak ada di stack. Builder harus memanggil **use-case** (test-design-qa), yang baru ada mulai story 1.3/1.6. Isolasi lewat data unik per test, bukan cleanup, karena DB e2e dibuat baru per run. |
| `BASE_URL` env fallback, `TEST_ENV`/`BASE_URL`/`API_URL` di `.env.example` | Tidak ditambahkan | AD-14: e2e hanya di build sendiri dengan clock palsu. Spine §Konfigurasi membatasi env ke `PORT`, `DATABASE_PATH`, `COOKIE_SECURE`, `NODE_ENV`, `KELASKU_FAKE_NOW` (+ `SEED_ADMIN_*`). `.env.example` dari story 1.1 sudah lengkap. |
| Contoh `example.spec.ts` dengan data-testid dan network interception | Smoke spec yang ada menjadi contoh; pola Given/When/Then ada di `test/README.md` | Belum ada fitur untuk diuji; spec contoh tanpa fitur hanya akan jadi test palsu. Selector utama `getByRole` (aksesibilitas). Tidak ada API pihak ketiga untuk di-intercept. |
| Auth helper / fixture login | Ditunda ke story 1.4/1.5 | Endpoint `/api/auth/login` belum ada. |
| `.nvmrc` | Sudah ada (`24.22.2`, story 1.1) | — |

## Langkah 4 — Dokumentasi dan skrip

- `test/README.md`: persiapan, cara menjalankan (lokal, headed, debug, UI, report, trace), struktur, helper yang menyusul per story, aturan menulis test, contoh, pemecahan masalah, CI, referensi knowledge.
- Skrip `package.json` **tidak diubah**: `test`, `test:e2e`, `typecheck` sudah ada; subset dijalankan dengan `npx vitest run --project …`. Nama skrip mengikuti spine.

### Hook

Hook penegakan saat menulis **tidak terpasang**. Menulis ke `.claude/hooks/` ditolak oleh permission harness (berkas sensitif, sesi non-interaktif). Pemasangan manual, bila tim menyetujui:

```bash
mkdir -p .claude/hooks .tea
cp .claude/skills/bmad-testarch-framework/resources/hooks/tea-enforce.cjs .claude/hooks/tea-enforce.cjs
cat > .tea/enforce-config.json <<'JSON'
{
  "testGlobs": ["e2e/**/*.spec.ts", "src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts", "test/**/*.test.ts"],
  "pactConfigGlobs": [],
  "excludeGlobs": [],
  "disabledRules": [],
  "maxFileLines": 1000,
  "stopScanWindowSeconds": 900,
  "maxScannedFiles": 5000,
  "hookSha256": "e94cc2dd8d4b64105860b5c75e2bbe48ac3ad6a41fc459bfcb132a0ce08f594d"
}
JSON
```

Lalu daftarkan `--pre` (PreToolUse `Write|Edit|MultiEdit`), `--post` (PostToolUse `Write|Edit|MultiEdit|Bash`), dan `--stop` (Stop) di `.claude/settings.json` sesuai step-04 §3.3. Aturan aktif: H1 (jeda tetap) dan H5 (berkas test > 1000 baris); H6/H8 khusus Pact tidak berlaku. Sampai hook terpasang, penegakan dilakukan oleh `bmad-testarch-test-review`.

## Langkah 5 — Validasi dan ringkasan

| Pemeriksaan | Hasil |
| --- | --- |
| `npm test` | 5 file, 37 test lulus (`unit` 24, `integration` 13) |
| `npm run typecheck` | Lulus |
| `npm run test:e2e` | 6/6 lulus (3 spec × `admin-desktop` + `participant-mobile`), 3,7 s setelah build |
| Artefak gagal (trace/screenshot/video) | Terbentuk di `test-results/` saat percobaan pertama gagal (lihat catatan lingkungan) |

**Catatan lingkungan:** di mesin WSL ini Chromium headless gagal start karena `libnspr4`, `libnss3`, dan `libasound2` tidak terpasang, dan `sudo` butuh password. Untuk verifikasi, ketiga paket diunduh dengan `apt-get download`, diekstrak ke `/tmp/pwlibs`, lalu e2e dijalankan dengan `LD_LIBRARY_PATH`. Repositori dan sistem tidak diubah. Perbaikan permanen: `sudo npx playwright install-deps chromium`.

**Knowledge yang diterapkan (cabang playwright-utils nonaktif):** `fixture-architecture.md`, `data-factories.md`, `test-quality.md`, `network-first.md`, `playwright-config.md`.

### Asumsi yang diambil (pengganti keputusan pengguna)

1. Playwright-utils (HP-4) tidak dipasang; Playwright vanilla sampai arsitek memutuskan lewat `bmad-architecture`.
2. Lokasi helper Vitest bersama `test/helpers/` (test-design-qa), di luar `src/` sehingga tidak ikut build `tsconfig.server.json`.
3. Helper milik story 1.2 (clock, `*.tz.test.ts`) dan 1.3 (DB test, `runConcurrently`, `repeatConcurrent`, `startTestServer`) tidak dibuat di sini agar tidak menduplikasi scope story.
4. Burn-in memakai `CONCURRENCY_REPEATS = 50` milik story 1.3, bukan variabel `BURN_IN` dari draf test-design.
5. Coverage v8 tidak dikonfigurasi karena `@vitest/coverage-v8` tidak ada di tabel Stack spine.

### Langkah berikut

1. Pasang pustaka sistem browser: `sudo npx playwright install-deps chromium`.
2. Bila disetujui, pasang hook TEA (§Hook).
3. Story 1.2: clock + project Vitest tambahan untuk `*.tz.test.ts` di tiga zona (tambahkan ke `projects` di `vitest.config.ts`).
4. Story 1.3: helper DB/konkurensi di `test/helpers/` di atas `createTempDir`.
5. Story `seed:demo`: ganti `webServer.command` dan set `DATABASE_PATH` e2e.
6. `bmad-testarch-ci` setelah platform CI dipilih.
