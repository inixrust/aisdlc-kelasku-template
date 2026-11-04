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
  test-db.ts                # TEST_NOW_ISO, fixedClock(iso), createTestDb(): SQLite sementara + migrasi + services
  concurrency.ts            # runConcurrently(), defineConcurrentTask(), repeatConcurrent(), CONCURRENCY_REPEATS
  concurrency-worker.ts     # entry worker_threads untuk runConcurrently (jangan diimpor langsung)
  test-server.ts            # startTestServer(): Fastify sungguhan di port acak di atas DB test
  fixtures/                 # migrasi + task fixture untuk membuktikan harness (bukan skema produksi)
e2e/                        # spec Playwright (*.spec.ts)
  support/fixtures.ts       # satu-satunya sumber `test`/`expect` untuk spec e2e
  support/admin.ts          # E2E_ADMIN: kredensial admin seed e2e yang tetap (bukan rahasia)
```

Helper yang menyusul di story pemiliknya (jangan dibuat di tempat lain):

| Helper | Story | Catatan |
| --- | --- | --- |
| clock beku untuk test, `*.tz.test.ts` dijalankan di tiga zona | 1.2 | `createClock()` di `src/server/clock.ts` |

## Admin dan seed e2e (story 1.4)

| Helper | Isi |
| --- | --- |
| fixture `adminLogin()` | `POST /api/auth/login` dengan `E2E_ADMIN` lewat `page.request`; cookie `kelasku_session` tersimpan di konteks browser test itu, jadi `page` dan `page.request` berikutnya sudah masuk. Spec API tanpa browser memakai fixture `request` dan login sendiri (`e2e/auth-api.spec.ts`). |
| `webServer` e2e | Hapus `data/e2e.db` (+ `-wal`/`-shm`) → `npm run build` → `npm run seed:demo` (migrasi + admin `E2E_ADMIN`, clock palsu) → `node dist/server/main.js`. `SEED_ADMIN_*` diisi dari `e2e/support/admin.ts` di `playwright.config.ts`. |
| `seed:demo` | Membuat/memperbarui admin seed dari `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (keduanya wajib; kosong → exit 1 tanpa menyentuh DB), lalu menambah dua kelas demo relatif ke "hari ini" `Clock` (Story 1.6): "Demo: Excel untuk Laporan Keuangan" (today−7, today, today+7) dan "Demo: Public Speaking untuk Pemula" (today+7/+14/+21). Idempoten per judul. Jalankan hanya saat server mati. |
| Test HTTP admin | `buildApp({ adminRoutes: [...], onRoute })` memasang rute uji di dalam plugin auth `/api/admin` dan mencatat semua rute (P0-008); lihat `src/server/http/auth.test.ts`. |

## UI admin dan kerangka bersama (story 1.5)

| Berkas | Isi |
| --- | --- |
| `e2e/admin-login.spec.ts` | Masuk lewat formulir (kredensial salah, formulir kosong + ringkasan error), rute admin tanpa sesi → Masuk `?next=` → kembali, top bar, `/admin` → `/admin/kelas`, Keluar + Back, Keluar gagal, "Memuat…" > 300 ms, gagal muat + "Coba lagi", sesi habis (alert info), skip link. Axe di Masuk, Kelas, dan state gagal muat. |
| `e2e/smoke.spec.ts` | Deep link SPA fallback kini memakai rute tak dikenal (`/admin/kelas` dialihkan ke Masuk). |
| `src/client/api/client.test.ts` | Fetch wrapper (P2-012): envelope, `network_error`, `unexpected_response`, 401 → Masuk, `safeNextPath`, satu-satunya pemanggil `fetch`. `fetch`/`navigate` disuntik lewat `configureApi`, environment node. |
| `src/client/styles/tokens.test.ts` | Token DESIGN.md ↔ `tokens.css` 1:1, dan tanpa hex/`rgb(` di `src/client/**` selain `tokens.css`. |

- Halaman Kelas sementara memuat `GET /api/auth/session` dua kali (pertama `AdminLayout`, kedua halaman). Test state muat/gagal/sesi habis mencegat panggilan kedua dengan `page.route`; ganti ke `/api/admin/classes` saat Story 1.9.
- Request lambat ditahan dengan promise gate di handler `page.route`, bukan jeda tetap.

## Buat kelas dan tautan pendaftaran (story 1.6)

| Berkas | Isi |
| --- | --- |
| `e2e/admin-class-create.spec.ts` | UJ-1 langkah 1–4: formulir Buat kelas (error server tanggal ganda di baris + ringkasan, nilai tetap, "Menyimpan…"), simpan → `/admin/kelas/{id}` + toast "Kelas tersimpan", kepala kelas (badge, kuota, tanggal, "Hari ini", tautan `{origin}/daftar/{publicCode}`), "Salin tautan" → clipboard + "Tautan disalin". Axe di formulir dan halaman kelas. |
| `src/server/http/admin-classes.test.ts` | `POST /api/admin/classes` (201 + DTO, 400 `fields` tanpa baris baru) dan `GET /api/admin/classes/:id` (404 `class_not_found`, `publicCode` tanpa id). |
| `src/server/domain/{session-dates,class-status}.test.ts` | `validateSessionDates` (kosong, ganda, tanpa tanggal setelah hari ini) dan `classStatus` (`max(session_date) <= today` → Selesai). |
| `src/client/components/Badge.test.ts` | Render statis `react-dom/server`: teks Glosarium, ikon `aria-hidden`, Daftar tunggu bukan `danger`. |
| `scripts/scripts.test.ts` (AC-9) | `seed:demo` menambah kelas demo idempoten, minimal satu bertanggal setelah hari ini. |

- Kelas seed hanya dibaca. Spec e2e membuat kelasnya sendiri lewat formulir atau `page.request.post('/api/admin/classes')` dengan judul ber-`uid`.

## Helper DB, konkurensi, dan server (story 1.3)

| Helper | Isi |
| --- | --- |
| `createTestDb(opts?)` | Berkas SQLite sementara yang nyata: `createDb` → `migrate` (migrasi produksi, atau `migrationsDir`) → `createServices`, clock beku `TEST_NOW_ISO`. Mengembalikan `{ dbPath, db, clock, services, dir, cleanup }`. Satu per test file (atau per ulangan konkurensi). |
| `fixedClock(iso?)` / `TEST_NOW_ISO` | `Clock` beku lewat `createClock({ NODE_ENV: 'test', KELASKU_FAKE_NOW })`; bawaan Senin 9 Nov 2026 10.00 WIB. |
| `defineConcurrentTask(import.meta.url, 'nama', fn)` | Mendefinisikan task untuk worker. Harus diekspor dengan nama yang sama dari modul yang **bukan** `*.test.ts` (worker mengimpornya ulang); `fn` menerima `{ db, clock, services, input, index }` dengan koneksi milik worker itu. Input/hasil harus bisa di-clone. |
| `runConcurrently(n, task, { dbPath, input?, nowIso?, busyTimeoutMs? })` | Menjalankan task di `n` worker_threads (n ≥ 2), masing-masing `createDb` + `createServices` sendiri, dilepas bersamaan lewat barrier `SharedArrayBuffer` + `Atomics`. Hasil per worker urut `index`: `{ ok: true, value }` atau `{ ok: false, code, message }` (tidak melempar). Worker dipakai ulang antar-panggilan. |
| `stopConcurrencyWorkers()` | Hentikan pool worker; panggil di `afterAll` file yang memakai `runConcurrently`. |
| `repeatConcurrent(times, scenario)` / `CONCURRENCY_REPEATS` (50) | Ulangi skenario berurutan; kegagalan menyebut "ulangan k dari times". Pakai DB baru per ulangan. |
| `startTestServer(opts?)` | Fastify sungguhan (`listen({ port: 0 })`) di atas DB test baru, tanpa build klien. Mengembalikan `{ baseUrl, dbPath, close }`, untuk `fetch` HTTP serentak (R1, R2). |

`test/helpers/concurrency.test.ts` membuktikan harness dengan kontrol negatif (cek di luar transaksi melampaui batas 5 dari 20 worker) dan kontrol positif (`withWriteTx` tepat 5 baris di setiap 50 ulangan, tanpa error). Bila kontrol negatif gagal, harness tidak lagi menghasilkan konkurensi nyata; perbaiki harness sebelum mempercayai test R1/R2/R4/R7.

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
// src/server/services/registrations.test.ts (integrasi)
import { afterAll, describe, expect, it } from 'vitest';
import { createTestDb } from '../../../test/helpers/test-db.js';

describe('R3: waitlist is FIFO by registration order', () => {
  const { services, cleanup } = createTestDb();
  afterAll(() => cleanup());

  it('R3: the first waitlisted registrant is promoted first', () => {
    // Given kelas penuh dengan dua Daftar tunggu — When satu Terdaftar batal — Then antrean pertama naik
  });
});
```

```ts
// test/tasks/registration-tasks.ts — task worker di modul terpisah, BUKAN di berkas *.test.ts
// (worker mengimpor ulang modulnya; berkas test akan mendaftarkan `it` di luar Vitest).
import { defineConcurrentTask } from '../helpers/concurrency.js';

export const register = defineConcurrentTask<{ email: string }, string>(import.meta.url, 'register', ({ input }) => {
  // panggil use-case pendaftaran lewat `services` dengan `input.email`, kembalikan statusnya
  void input.email;
  return 'registered';
});
```

```ts
// src/server/services/registrations.concurrency.test.ts (R1, worker_threads)
import { afterAll, expect, it } from 'vitest';
import { CONCURRENCY_REPEATS, repeatConcurrent, runConcurrently, stopConcurrencyWorkers } from '../../../test/helpers/concurrency.js';
import { createTestDb } from '../../../test/helpers/test-db.js';
import { register } from '../../../test/tasks/registration-tasks.js';

afterAll(() => stopConcurrencyWorkers());

it('R1: 20 simultaneous registrations to a quota-5 class yield exactly 5 Terdaftar', async () => {
  await repeatConcurrent(CONCURRENCY_REPEATS, async () => {
    const testDb = createTestDb();
    try {
      const results = await runConcurrently(20, register, { dbPath: testDb.dbPath, input: (i) => ({ email: `p${i}@contoh.id` }) });
      expect(results.filter((r) => !r.ok)).toEqual([]);
    } finally {
      testDb.cleanup();
    }
  });
}, 120_000);
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
