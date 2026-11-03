---
stepsCompleted: ['step-01-preflight', 'step-02-generate-pipeline', 'step-03-configure-quality-gates', 'step-04-validate-and-summary']
lastStep: 'step-04-validate-and-summary'
lastSaved: '2026-11-03'
workflowStatus: 'completed'
ciPlatform: 'github-actions'
pipelinePath: '.github/workflows/test.yml'
---

# CI Pipeline: Kelasku

Workflow: `bmad-testarch-ci` (Create). Pengguna: Rustan. Tanggal: 2026-11-03.
Permintaan: GitHub Actions, sederhana; unit test dan E2E di setiap pull request dan push ke `main`; tanpa sharding dan burn-in.

## Step 1: Preflight

| Pemeriksaan | Hasil |
| --- | --- |
| Repo Git | `.git/` ada; remote `origin` = `github.com/inixrust/aisdlc-kelasku` |
| `test_stack_type` (auto) | **fullstack**: `playwright.config.ts` + `vite.config.ts` (frontend), `vitest.config.ts` + Fastify (backend) |
| `test_framework` (auto) | Vitest 5.0.5 (project `unit`, `integration`) + Playwright 1.64.1 (`admin-desktop`, `participant-mobile`, keduanya Chromium) |
| Dependensi | `node_modules/` terpasang, satu `package-lock.json` (npm) |
| `npm test` | ✅ 5 berkas, 37 test lulus |
| `npm run typecheck` | ✅ lulus |
| `npm run test:e2e` | ⚠️ 2 lulus, 4 gagal. Semua kegagalan di `browserType.launch`: `libnspr4.so: cannot open shared object file`. Test API (tanpa browser) lulus. Lihat Asumsi A1 |
| `ci_platform` (auto) | Tidak ada konfigurasi CI; remote github.com → **github-actions** (sesuai permintaan) |
| Node | `.nvmrc` = `24.22.2` (`engines` ≥ 22.22.0). Pipeline memakai `node-version-file: .nvmrc` |
| Cache | npm (`package-lock.json`); browser `~/.cache/ms-playwright` |
| `tea_use_playwright_utils: true` | `@seontechnologies/playwright-utils` tidak ada di `package.json` dan tidak ada di tabel Stack spine (lihat `framework-setup-progress.md`). Burn-in juga di luar cakupan permintaan, jadi `runBurnIn` tidak dipakai |
| `tea_use_pactjs_utils: true` | Tidak ada artefak kontrak (`pact/`, `*.pacttest.ts`, skrip pact, dependensi Pact). Satu package, klien ke server lewat HTTP internal. **Job contract-test dilewati** |

## Step 2: Pipeline

Mode eksekusi: `sequential`. Satu berkas kecil, tidak perlu dipecah ke subagent.

Berkas: `.github/workflows/test.yml`, diadaptasi dari `github-actions-template.yaml`.

| Elemen | Isi |
| --- | --- |
| Trigger | `pull_request` ke `main`, `push` ke `main`. Tanpa `schedule` (tidak ada burn-in) |
| Permissions | `contents: read` |
| Concurrency | per workflow + ref; `cancel-in-progress` hanya untuk PR, jadi run di `main` selalu selesai |
| Job `unit` (15 menit) | checkout → setup-node (`.nvmrc`, cache npm) → `npm ci` → `npm run typecheck` → `npm test` |
| Job `e2e` (30 menit) | checkout → setup-node → `npm ci` → cache browser (key hash lockfile, ada restore-keys) → `npx playwright install --with-deps chromium` (cache miss) atau `npx playwright install-deps chromium` (cache hit) → `npm run test:e2e` → upload artefak bila gagal |
| Paralel | `unit` dan `e2e` berjalan bersamaan (tanpa `needs`), jadi kegagalan typecheck tidak menunda umpan balik E2E |
| Retry | Dari `playwright.config.ts`: `retries: 2` saat `CI`; trace `retain-on-failure-and-retries`. Vitest tanpa retry, karena test deterministik |
| Artefak | `playwright-report/` + `test-results/` (trace, screenshot, video, `junit.xml`), hanya saat gagal, retensi 30 hari, nama unik per run/attempt |
| Secret | Tidak ada. E2E memakai `NODE_ENV=test`, `PORT=4310`, `KELASKU_FAKE_NOW` dari `webServer.env` |
| Keamanan | Tidak ada `${{ github.event.* }}`/`${{ inputs.* }}` di blok `run:`; ekspresi hanya `github.workflow`, `github.ref`, `github.event_name` (untuk `concurrency`), `runner.os`, `hashFiles`, `github.run_id`/`run_attempt` |

## Step 3: Quality gates dan notifikasi

- **Burn-in: dimatikan atas permintaan pengguna**, walau default untuk stack fullstack adalah aktif. Bukti stabilitas konkurensi NFR-1 (50 ulangan per run CI, Story 1.3) sudah berada di dalam `npm test`, jadi job `unit` ikut menegakkannya tanpa job burn-in.
- **Gate harus bisa gagal:** tidak ada `continue-on-error` di langkah test. `forbidOnly: CI` membuat `test.only` yang tertinggal menggagalkan run. Tidak ada manifest subset: Vitest dan Playwright menemukan test sendiri dari config.
- **Ambang lulus:** semua test wajib lulus (P0 = 100%, dan P1 juga 100% karena suite masih kecil). Retry Playwright hanya meredam flake transien. Test yang lulus setelah retry ditandai "flaky" di laporan dan perlu ditindaklanjuti.
- **Proteksi branch (tindakan fasilitator):** jadikan `Typecheck + unit/integration (Vitest)` dan `E2E (Playwright)` sebagai *required status checks* untuk `main`. Ini selaras dengan kebijakan "semua perubahan masuk ke `main` lewat PR".
- **Notifikasi:** tidak ditambahkan (permintaan "mulai sederhana"; notifikasi juga non-goal produk). Email bawaan GitHub untuk run gagal sudah cukup. Tautan artefak tersedia di halaman run.
- Gate kontrak: tidak relevan (lihat Step 1).

## Step 4: Validasi checklist

| Bagian checklist | Status |
| --- | --- |
| Prasyarat: git, remote, framework, platform | ✅ |
| Tes lokal lulus | ⚠️ Vitest + typecheck ✅; E2E terhalang pustaka sistem di WSL (A1) |
| Berkas di path yang benar, YAML valid | ✅ `.github/workflows/test.yml`; di-parse dengan PyYAML, trigger dan langkah sesuai. `actionlint` tidak tersedia di mesin ini |
| Perintah sesuai stack, Node sesuai `.nvmrc`, browser install untuk fullstack | ✅ |
| Sharding (matrix 4, fail-fast false) | ➖ Sengaja tidak ada (permintaan pengguna; suite E2E masih 3 spec × 2 project) |
| Burn-in | ➖ Sengaja tidak ada (permintaan pengguna; ulangan konkurensi ada di `npm test`) |
| Caching: npm, browser, key lockfile, restore-keys | ✅ |
| Artefak: hanya saat gagal, path benar, retensi 30 hari, nama unik, tanpa data sensitif | ✅ Data e2e berasal dari clock palsu dan factory test, bukan data peserta asli |
| Retry 2, timeout ≤ 30 menit | ✅ |
| Helper script (`scripts/ci-local.sh`, `test-changed.sh`, `burn-in.sh`) | ➖ Tidak dibuat. `scripts/` berisi skrip CLI TypeScript (spine); `CI=1 npm run test:e2e` sudah mencerminkan CI. `test-changed`/`burn-in` di luar cakupan |
| Dokumentasi (`docs/ci.md`, secrets checklist) | ✅ dengan penyesuaian: bagian §CI dan baris pemecahan masalah ditambahkan di `test/README.md` (sudah jadi rumah dokumentasi test), bukan `docs/ci.md`. Tidak ada secret, jadi tidak perlu secrets checklist |
| Keamanan: tanpa kredensial, tanpa konteks tak tepercaya di `run:` | ✅ |
| Eksekusi pertama (push, cache hit, artefak) | ⏳ Menunggu fasilitator mendorong ke GitHub |

## Asumsi dan keputusan

- **A1: kegagalan E2E lokal disebabkan lingkungan.** Chromium headless di WSL ini tidak menemukan `libnspr4.so`, dan `sudo` butuh password, jadi pustaka tidak bisa dipasang dari sesi ini. Gejala dan solusinya sudah tercatat di `test/README.md` §Pemecahan masalah. Di CI, `playwright install --with-deps` / `install-deps` memasang pustaka tersebut. **Run CI pertama adalah verifikasi E2E yang sebenarnya.** Di mesin pengembang, jalankan `sudo npx playwright install-deps chromium` sekali.
- **A2: tanpa job lint.** Tidak ada skrip `lint`; pemilihan alat lint/format masih di spine §Deferred. `npm run typecheck` menjadi gate statis di job `unit`.
- **A3: versi action.** Dipakai `actions/checkout@v5`, `actions/setup-node@v5`, `actions/cache@v4`, `actions/upload-artifact@v4`, yaitu major version yang pasti ada. Naikkan saat major baru dirilis (Dependabot untuk `github-actions` bisa ditambahkan nanti).
- **A4: hanya Chromium.** Kedua project Playwright (`Desktop Chrome`, `Pixel 7`) memakai Chromium. Bila nanti ada project WebKit/Firefox, tambahkan browsernya di langkah install.
- **A5: TODO `seed:demo` di `webServer`** (B-2) tidak diubah. Saat story `seed:demo` mengubah perintah `webServer`, pipeline tidak perlu diubah karena CI hanya memanggil `npm run test:e2e`.

## Tindak lanjut (di luar workflow ini)

1. Fasilitator: push ke GitHub, pastikan kedua job hijau, cek cache hit pada run kedua, lalu pasang *required status checks* di `main`.
2. Spine §Deferred masih bertuliskan "CI. Belum ada platform CI". Perbarui lewat `bmad-architecture` (AGENTS.md melarang edit langsung). Perbarui juga `AGENTS.md` §Menjalankan lewat `bmad-project-context` (refresh) agar menyebut `.github/workflows/test.yml`.
3. `test-design-qa.md` §Eksekusi menyebut "CI belum ada, jadi setiap PR = lokal sebelum commit". Sekarang setiap PR juga dijalankan CI.
4. Bila suite E2E tumbuh melewati ~10 menit, jalankan ulang workflow ini dalam mode Edit untuk menambah sharding. Burn-in untuk spec E2E baru bisa ditambahkan dengan cara yang sama.
