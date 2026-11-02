---
title: 'Story 1.1: Kerangka repositori yang bisa dijalankan dan diuji'
type: 'chore'
created: '2026-11-03'
status: 'in-review'
baseline_commit: '7fae43125e9250a4105d956115403ba830dca822'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Repositori baru berisi dokumen perencanaan; belum ada kode, skrip, atau test, sehingga story berikutnya tidak punya struktur dan pagar arsitektur untuk ditulisi.

**Approach:** Scaffolding manual satu package npm (versi persis tabel Stack spine): server Fastify yang melayani `/api/*` (404 envelope) dan SPA `dist/client` (fallback `index.html`), SPA React + Vite berbahasa Indonesia, Vitest dengan `TZ=UTC` + fitness test arsitektur, Playwright smoke + axe di build produksi.

## Boundaries & Constraints

**Always:** Versi dependensi persis tabel Stack spine (tanpa `^`, kecuali `@types/node` `^24`); npm saja; `"type": "module"`; teks UI Indonesia, identifier Inggris; kode error `not_found` didaftar di `src/shared/errors.ts` dalam bentuk `{ code, httpStatus, message }` + `toErrorEnvelope(code, fields?)` (Story 1.2 memperluas); fitness test punya satu kasus negatif per aturan.

**Never:** Tanpa DB/migrasi/clock (Story 1.2–1.3); tanpa tokens.css/komponen bersama (Story 1.5); tanpa dependensi di luar tabel Stack (mis. `concurrently`, ESLint); tanpa stub palsu untuk `admin:create`/`seed:demo`/`backup` (ditambahkan di story pemiliknya); tanpa `.env` terkomit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| SPA root | `GET /` (build produksi) | `index.html`; React menampilkan `<h1>Kelasku</h1>` di `<main>`, `<html lang="id">` | N/A |
| SPA deep link | `GET /admin/kelas` | 200 `index.html` dari `dist/client`; router menampilkan halaman "Halaman tidak ditemukan" berbahasa Indonesia | N/A |
| API tak dikenal | `GET`/`POST /api/tidak-ada` | 404 `{ "error": { "code": "not_found", "message": "Halaman atau data tidak ditemukan." } }` | envelope AD-8 |
| Aset statis | `GET /assets/<hash>.js` | berkas dari `dist/client` | N/A |
| Tanpa build klien (dev) | `dist/client/index.html` tidak ada, `GET /x` | 404 envelope `not_found` (Vite yang melayani klien di dev) | N/A |

</frozen-after-approval>

## Code Map

- Repositori belum berisi kode; hanya `AGENTS.md`, `CLAUDE.md`, `docs/`, `_bmad*`. Jangan ubah `_bmad/`, `.claude/skills/`, `docs/intent-kelasku.md`.
- Spine: pohon sumber (§Structural Seed), Stack, konvensi Konfigurasi (`node --env-file-if-exists=.env`) dan skrip produksi (`vite build` → `dist/client`, `tsc -p tsconfig.server.json` → `dist/server`, `npm start` = `node --env-file-if-exists=.env dist/server/main.js`).

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `package-lock.json`, `.nvmrc` (`24.22.2`), `.gitignore`, `.env.example` -- skrip `dev`, `build`, `start`, `test`, `test:e2e`, `typecheck`; `engines.node >=22.22.0`; `.gitignore`: `.env`, `data/`, `backups/`, `dist/`, `node_modules/`, `test-results/`, `playwright-report/`; `.env.example`: `PORT`, `DATABASE_PATH`, `COOKIE_SECURE`, `NODE_ENV`, `KELASKU_FAKE_NOW`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` tanpa rahasia.
- [x] `tsconfig.json` (noEmit, bundler, DOM, JSX; mencakup `src`, `e2e`, `scripts`, berkas config) + `tsconfig.server.json` (NodeNext, `rootDir: src`, `outDir: dist`, hanya `src/server` + `src/shared`, tanpa `*.test.ts`) -- typecheck klien & server, emit `dist/server/main.js`.
- [x] `vite.config.ts` (root `src/client`, outDir `dist/client`, proxy `/api` → `127.0.0.1:$PORT`) + `vitest.config.ts` (set `process.env.TZ='UTC'`, include `src/**/*.test.ts(x)`).
- [x] `scripts/dev.ts` -- jalankan `vite` dan `tsx watch --env-file-if-exists=.env src/server/main.ts` bersamaan, hentikan keduanya bila salah satu keluar (tanpa dependensi tambahan, lintas OS).
- [x] `src/shared/errors.ts` -- registri `not_found` (404) + `toErrorEnvelope`.
- [x] `src/server/http/app.ts`, `src/server/http/spa-fallback.ts`, `src/server/main.ts` -- `buildApp({ clientDir, logger })`; @fastify/static bila `index.html` ada; not-found handler: `/api/*` → 404 envelope, GET/HEAD lain → `index.html`; `main.ts` listen `127.0.0.1:${PORT ?? 3000}`.
- [x] `src/client/index.html`, `main.tsx`, `router.tsx`, `pages/HomePage.tsx`, `pages/NotFoundPage.tsx` -- `createBrowserRouter`; teks Indonesia; direktori `components/`, `api/`, `styles/`, `pages/admin/`, `pages/participant/` disiapkan (`.gitkeep`) bersama `src/server/{domain,data,services}/`.
- [x] `src/architecture.test.ts` -- fitness test HP-3 (impor `better-sqlite3`, larangan waktu di `domain/`/`services/`, fungsi waktu SQL di migrasi, arah impor lapisan) + fixture negatif per aturan + pindai repo nyata (> 0 berkas).
- [x] `src/test-environment.test.ts` -- HP-1: zona proses Vitest `UTC`.
- [x] `src/server/http/app.test.ts` -- `inject()`: 404 envelope `/api/*` (GET & POST), fallback `index.html` dari `clientDir` sementara, aset statis, tanpa build → 404 envelope.
- [x] `playwright.config.ts` + `e2e/smoke.spec.ts` -- webServer `npm run build && node dist/server/main.js` (`NODE_ENV=test`, port tetap), `timezoneId: 'UTC'`; smoke `/` + axe tanpa pelanggaran, `/admin/kelas` ber-`index.html`, `/api/tidak-ada` 404 envelope.

**Acceptance Criteria:**
- Given dependensi terpasang, when `npm run dev`, then Vite dan `tsx watch src/server/main.ts` berjalan dan `/` menampilkan "Kelasku".
- Given `npm test`, when dijalankan, then Vitest berjalan dengan `TZ=UTC` dan fitness test gagal pada setiap fixture negatif tetapi lulus pada repositori.
- Given `npm run typecheck` dan `npm run test:e2e`, when dijalankan, then keduanya lulus.

## Implementation Notes

- Diimplementasikan langsung di sesi ini (tanpa subagen) karena konteks spec sudah dimuat; spec tetap satu-satunya acuan.
- npm 11 menahan install script; `allowScripts` di `package.json` menyetujui `better-sqlite3@13.0.3` dan `esbuild@0.28.2` (dependensi stack). better-sqlite3 memakai prebuild `linux-x64`.
- `.gitignore` lama dipertahankan; pola baru dijangkarkan ke root (`/data/`, `/dist/`, …) karena `data/` tanpa jangkar ikut mengabaikan `src/server/data/`.
- `@fastify/static` memakai `index: ['index.html']` agar `/` tidak 403; not-found handler menangani deep link dan `/api/*`.
- Fitness test mengecualikan dirinya sendiri dari pindaian (fixture pelanggaran berupa string) dan juga memeriksa arah lapisan penuh (domain/data/services/http), bukan hanya lima aturan AC.
- React Router 8: `createBrowserRouter` dari `react-router`, `RouterProvider` dari `react-router/dom`.
- Lingkungan WSL ini tidak punya `libnss3`/`libnspr4`/`libasound2` dan tanpa sudo; e2e dijalankan dengan pustaka hasil `apt-get download` di `~/.cache/kelasku-pw-libs` via `LD_LIBRARY_PATH` (di luar repo). Mesin lain cukup `npx playwright install --with-deps chromium`.
- `npm audit`: 3 temuan moderate transitif (`glob`/`minimatch` lewat `@fastify/static`); tidak diubah karena versi dikunci spine.
- Build Vite memberi peringatan chunk > 500 kB; belum ditangani (bukan cakupan story ini).
- Skrip `admin:create`, `seed:demo`, `backup` sengaja belum ada (story pemiliknya).

## Spec Change Log

## Review Triage Log

## Design Notes

- Halaman `/` adalah placeholder tanpa token/komponen; rangkaian `ui-consistency` dan `tokens.css` mulai Story 1.5, saat permukaan UI sebenarnya pertama dibuat.
- `TZ` diset di `vitest.config.ts` (bukan `TZ=UTC vitest` di skrip) agar lintas OS; Story 1.2 menambah tiga run untuk `*.tz.test.ts`.
- Fitness test memakai regex atas teks sumber (impor relatif di-resolve ke path) — cukup untuk pagar statis tanpa dependensi.

## Verification

**Commands:**
- `npm run typecheck` -- expected: exit 0
- `npm test` -- expected: semua hijau
- `npm run build && npm run test:e2e` -- expected: smoke + axe hijau
