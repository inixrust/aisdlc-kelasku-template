# Test Kelasku

Kerangka test mengikuti AD-14 di `ARCHITECTURE-SPINE.md`: **Vitest** untuk unit dan integrasi, **Playwright** + `@axe-core/playwright` untuk E2E. Rencana cakupan dan ID test (P0-001 dst.) ada di `_bmad-output/test-artifacts/test-design-qa.md`.

## Persiapan

```bash
nvm use                       # Node dari .nvmrc
npm ci
npx playwright install chromium
```

Di Linux/WSL tanpa pustaka sistem browser (`libnss3`, `libnspr4`, `libasound2`), jalankan sekali `sudo npx playwright install-deps chromium`.

## Menjalankan

| Perintah | Isi |
| --- | --- |
| `npm test` | Seluruh Vitest: project `unit` + `integration` dengan `TZ=UTC` (HP-1), ditambah `tz-utc`, `tz-jakarta`, `tz-jayapura` (A-12) |
| `npx vitest run --project unit` | Domain murni, `src/shared`, klien, fitness test arsitektur |
| `npx vitest run --project integration` | `src/server/{data,services,http}`, `scripts/`, `test/` dengan berkas SQLite sementara yang nyata |
| `npx vitest run --project 'tz-*'` | Hanya test sensitif waktu (`*.tz.test.ts`), sekali per zona proses `UTC`, `Asia/Jakarta`, `Asia/Jayapura` |
| `npx vitest run -t "R3"` | Semua test aturan R3 (ID aturan ada di nama test) |
| `npx vitest` | Mode watch |
| `npm run test:e2e` | Build produksi, server `NODE_ENV=test` + `KELASKU_FAKE_NOW`, project `admin-desktop` dan `participant-mobile` |
| `npx playwright test --project participant-mobile` | Hanya viewport ponsel 360×740 |
| `npx playwright test --headed` / `--debug` / `--ui` | Melihat browser, debugger langkah demi langkah, UI mode |
| `npx playwright show-report` | Laporan HTML run terakhir (`playwright-report/`) |
| `npx playwright show-trace test-results/<test>/trace.zip` | Trace test yang gagal |
| `npm run typecheck` | `tsc` untuk klien, server, test, dan e2e |

Test yang hasilnya bisa bergantung pada zona proses (clock, format tanggal, R5) diberi akhiran `*.tz.test.ts`. Berkas itu tidak ikut `unit`/`integration`; ia dijalankan di tiga project tz dan harus lulus dengan ekspektasi yang sama di ketiganya.

Sebelum commit: `npm test`, `npm run test:e2e`, dan `npm run typecheck` harus hijau (AGENTS.md). CI menjalankan perintah yang sama (lihat §CI). `CI=1` mengaktifkan `forbidOnly`, retry 2, dan reporter JUnit (`test-results/junit.xml`).

## CI

GitHub Actions, berkas `.github/workflows/test.yml`, berjalan di setiap pull request ke `main` dan setiap push ke `main`:

| Job | Langkah |
| --- | --- |
| `unit` | `npm ci` → `npm run typecheck` → `npm test` (Vitest `unit` + `integration`, termasuk ulangan 50× skenario konkurensi) |
| `e2e` | `npm ci` → `npx playwright install --with-deps chromium` (browser di-cache per lockfile) → `npm run test:e2e` (kedua project) |

- Node dari `.nvmrc`; cache npm dari `package-lock.json`. Tidak ada secret yang dibutuhkan.
- Bila `e2e` gagal, unduh artefak `playwright-report-<run>-<attempt>` (HTML report, trace, screenshot, video, `junit.xml`; disimpan 30 hari) dari halaman run, lalu buka dengan `npx playwright show-report` atau `show-trace`.
- Mereproduksi kondisi CI secara lokal: `CI=1 npm run test:e2e`.
- Belum ada sharding, burn-in, lint, atau notifikasi. Jadikan job `unit` dan `e2e` sebagai *required status checks* di aturan proteksi branch `main` agar PR merah tidak bisa di-merge.

## Struktur

```text
src/**/*.test.ts            # test Vitest ditempatkan di samping kodenya
test/helpers/               # helper Vitest bersama (dipakai juga oleh e2e)
  temp-dir.ts               # createTempDir(): direktori unik di os.tmpdir() + cleanup()
  unique.ts                 # uniqueId(), uniqueEmail(), uniqueTitle()
e2e/                        # spec Playwright (*.spec.ts)
  support/fixtures.ts       # satu-satunya sumber `test`/`expect` untuk spec e2e
```

Helper yang menyusul di story pemiliknya (jangan dibuat di tempat lain):

| Helper | Story | Catatan |
| --- | --- | --- |
| clock beku untuk test, `*.tz.test.ts` dijalankan di tiga zona | 1.2 | `createClock()` di `src/server/clock.ts` |
| DB test (`createDb` + migrasi di berkas sementara), `runConcurrently`, `repeatConcurrent` + `CONCURRENCY_REPEATS`, `startTestServer()` | 1.3 | taruh di `test/helpers/`, di atas `createTempDir` |
| fixture `adminLogin` (sesi cookie) | 1.4 / 1.5 | tambahkan ke `e2e/support/fixtures.ts` |
| `webServer` e2e: hapus DB e2e → `seed:demo` → start, `DATABASE_PATH` khusus e2e | story yang membuat `seed:demo` (B-2) | ganti `command` di `playwright.config.ts` |

## Aturan menulis test

- **ID aturan di nama test.** `it('R3: waitlist is FIFO by registration order')`. Tag prioritas di e2e: `test('@P0 R1: …')`, lalu `--grep @P0`.
- **Jangan mock DB.** Test `services/` dan `data/` memakai berkas SQLite sementara yang nyata; satu DB per test file. Konkurensi R1, R2, R4, R7 memakai minimal dua koneksi dari `worker_threads`.
- **Waktu.** Jangan bergantung pada jam mesin. Vitest berjalan `TZ=UTC`, browser `timezoneId: 'UTC'`; "hari ini" selalu dari `Clock`/`today` di respons API. E2E memakai `KELASKU_FAKE_NOW=2026-11-09T03:00:00.000Z` (Senin 10.00 WIB).
- **Tanpa jeda tetap.** Tidak ada `waitForTimeout` atau `setTimeout` untuk menunggu. Tunggu kondisi: assertion web-first (`await expect(locator).toBeVisible()`), respons jaringan, atau barrier `Atomics` di test konkurensi.
- **Selector.** `getByRole`/`getByLabel` dengan teks Indonesia lebih dulu. `data-testid` hanya untuk baris/sel tabel.
- **Isolasi data.** Kelas hasil seed hanya dibaca. Test yang mengubah data membuat kelasnya sendiri lewat API dengan judul unik (`uid` fixture / `uniqueTitle()`), sehingga test bisa berjalan paralel dan tidak perlu dibersihkan.
- **Builder memanggil use-case**, bukan SQL mentah, supaya state selalu sah. Hanya `src/server/data/` yang mengimpor `better-sqlite3`; fitness test arsitektur juga memindai `test/`.
- **Aksesibilitas.** Setiap permukaan IA di EXPERIENCE.md diperiksa dengan `await expectNoA11yViolations()` setelah halaman siap.
- **Privasi.** Email, nama peserta, password, dan token tidak masuk log test atau nama test; email tidak pernah di URL.
- **Assertion error.** Assert `error.code` dan status HTTP dari registri `src/shared/errors.ts`, bukan angka/pesan hardcode.
- Jangan commit `.only`, dan jangan `.skip` test R1–R7.

## Contoh

```ts
// src/server/services/registrations.test.ts (integrasi; helper DB menyusul di story 1.3)
import { afterAll, describe, expect, it } from 'vitest';
import { createTempDir } from '../../../test/helpers/temp-dir.js';

describe('R3: waitlist is FIFO by registration order', () => {
  const dir = createTempDir();
  afterAll(() => dir.cleanup());

  it('R3: the first waitlisted registrant is promoted first', () => {
    // Given kelas penuh dengan dua Daftar tunggu — When satu Terdaftar batal — Then antrean pertama naik
  });
});
```

```ts
// e2e/registration.spec.ts
import { expect, test } from './support/fixtures';

test('@P1 R1: participant sees "Terdaftar" after registering', async ({ page, uid, expectNoA11yViolations }) => {
  // Given kelas baru berjudul `Kelas ${uid}` dibuat lewat API admin
  // When peserta membuka tautan pendaftaran dan mengirim formulir
  // Then status "Terdaftar" tampil, dan halaman lolos axe
  await expectNoA11yViolations();
});
```

## Pemecahan masalah

| Gejala | Penyebab / tindakan |
| --- | --- |
| `browserType.launch: … libnspr4.so: cannot open shared object file` | Pustaka sistem browser belum ada: `sudo npx playwright install-deps chromium` |
| `Executable doesn't exist at …/ms-playwright/…` | Browser belum diunduh: `npx playwright install chromium` |
| `webServer` timeout / port 4310 dipakai | Ada server e2e lain yang masih hidup; matikan prosesnya. `reuseExistingServer` sengaja `false` agar clock palsu selalu berlaku |
| Test tanggal lulus di laptop, gagal di mesin lain | Ada kode yang memakai zona proses; cari `new Date()`/`toISOString().slice(0,10)` di luar `clock.ts` (fitness test menjaga `domain/`/`services/`) |
| Pelanggaran axe | Pesan menyebut `id` aturan, `help`, dan selector elemen; perbaiki di komponen, jangan menonaktifkan aturan |
| Lulus lokal, gagal di CI | Jalankan `CI=1 npm run test:e2e` (retry 2, `forbidOnly`); periksa trace di artefak run. `test.only` yang tertinggal menggagalkan CI |

## Penegakan saat menulis (hook TEA)

Belum terpasang. Workflow `bmad-testarch-framework` menyediakan hook `tea-enforce.cjs` yang memblokir penulisan test berisi jeda tetap (H1) atau berkas test > 1000 baris (H5). Tingkat keparahannya berasal dari criteria registry `bmad-testarch-test-review`, bukan dari hook. Pemasangannya butuh izin menulis ke `.claude/`. Langkah manual ada di `_bmad-output/test-artifacts/framework-setup-progress.md` §Hook. Setelah terpasang, menonaktifkan satu aturan dilakukan lewat `disabledRules` di `.tea/enforce-config.json` dengan alasan di pesan commit. Sampai saat itu, penegakan dilakukan oleh `bmad-testarch-test-review`.

## Referensi

- `ARCHITECTURE-SPINE.md` AD-3, AD-7, AD-14 (path di AGENTS.md)
- `_bmad-output/test-artifacts/test-design-architecture.md` dan `test-design-qa.md`
- TEA knowledge: `fixture-architecture.md`, `data-factories.md`, `test-quality.md`, `network-first.md`, `playwright-config.md` (di `.claude/skills/bmad-testarch-*/resources/knowledge/`)
