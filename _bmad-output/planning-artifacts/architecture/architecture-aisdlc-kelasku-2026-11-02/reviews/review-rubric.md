---
review: rubric-walker
target: ARCHITECTURE-SPINE.md (architecture-aisdlc-kelasku-2026-11-02)
inputs: [ARCHITECTURE-SPINE.md, .memlog.md, prds/prd-aisdlc-kelasku-2026-11-02/prd.md, prds/.../addendum.md, ux-designs/.../EXPERIENCE.md (IA table), AGENTS.md]
date: 2026-11-02
verdict: pass-with-fixes
---

# Rubric Review — Kelasku Architecture Spine

**Verdict:** A strong, mostly enforceable spine. It handles the hard invariants well: R1/R2/R4/R7 in `BEGIN IMMEDIATE`, a single promotion path, a Jakarta clock and integer R6. Before epics, it needs fixes in five places: idempotent cancellation, waitlist ordering under concurrency, seed/admin provisioning, the Selesai check inside transactions, and the upgrade/migration operating envelope. No critical blocker.

## Rubric walk

| # | Criterion | Result | Notes |
| --- | --- | --- | --- |
| 1 | Fixes real divergence points, misses none | Partial | Missed: idempotent cancel (H-1), Selesai guard inside tx (H-3), seed vs admin provisioning (H-2), server production build/run mode (M-1), some API routes (M-3), auth-check endpoint for the SPA (M-3). |
| 2 | Every AD Rule enforceable and prevents its divergence | Mostly | AD-4/AD-10 ordering `created_at, id` with `now()` taken outside the lock can reorder the waitlist (H-4). AD-3 read list omits the class's last session date (H-3). AD-7 fake-clock guard conflicts with Playwright on a "production build" (M-2). |
| 3 | Nothing Deferred lets two units diverge | Mostly | Lint/format deferred "until scaffolding" is acceptable only if the scaffolding story pins it (L-2). Other deferrals (off-site backup, PDP retention, HTTPS, CI, TS7) are operator/policy items. |
| 4 | Named tech verified-current | Pass | The memlog has `(version)` entries dated 2026-11-02 for every Stack row. Small gaps: the Node 24 vs 26 Active LTS rationale is thin, and `.nvmrc` sits in the memlog but not in the spine (L-3). |
| 5 | Greenfield, nothing to contradict | Pass | No code exists. Note the spine/memlog drift: migrations live in `src/server/data/migrations` in the spine but `src/server/db/migrations` in the memlog, and the `promoteFromWaitlist` signature differs (L-4). |
| 6 | Covers FR-1..FR-22, NFR-1..9, R1–R7 | Mostly | All are mapped. Thin spots: FR-11 idempotency (H-1), FR-7/FR-11/FR-3 Selesai behavior (H-3), the NFR-7 measurement method (L-5), and NFR-9 seed scenarios relative to "today" (H-2). |
| 7 | Every feature-altitude dimension decided/deferred/open, esp. ops envelope | Partial | Decided: deployment, environments, config, logging, migration mechanism, backup mechanism. Missing: the upgrade procedure and a pre-migration backup, restore, admin-session lifetime, and multi-admin provisioning (M-4, M-5, H-2). |

---

## Critical

None.

## High

### H-1 — Idempotent cancellation is not in the spine (memlog only)
**Where:** AD-4 / AD-3; the memlog line "Pembatalan idempoten: UPDATE ... WHERE id=? AND status IN aktif".
**Problem:** FR-11 says a double click, or a participant and an admin cancelling almost at once, must change nothing on the second attempt and must not trigger a second promotion. The first cancellation's `cancelled_at`/`cancelled_by` must be kept. Two stories build cancellation (FR-11 participant, FR-12 admin). Nothing in the spine binds them to the same guarded UPDATE. One could read-then-write, or overwrite `cancelled_by`.
**Fix:** Add a Rule to AD-4, or a new AD "Satu jalur pembatalan". Proposed wording: all cancellation goes through one `cancelRegistration(tx, registrationId, by, now)` in `services/cancellation`, which runs `UPDATE registrations SET status='cancelled', cancelled_at=?, cancelled_by=? WHERE id=? AND status IN ('registered','waitlisted')`. When `changes = 0`, it returns the current state with no promotion. It calls `promoteFromWaitlist` only when the previous status was `registered`. Bind FR-11, FR-12, FR-13 and R4.

### H-2 — Seed conflates admin provisioning with demo data; ~5 admins cannot be created
**Where:** AD-1 ("seed hanya dijalankan saat server mati"), AD-9 ("Akun admin hanya dibuat oleh skrip seed dari .env"), Konfigurasi (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`), NFR-9.
**Problem:**
- The PRD has about 5 admins, but config allows exactly one seed admin.
- The NFR-9 seed contains demo classes (full class, waitlist, past attendance, a session "hari ini relatif terhadap tanggal seed"). These must never land in a production DB, yet the same `npm run seed` is the only way to create admins.
- The seed's "today" is not tied to `Clock`/`KELASKU_FAKE_NOW`. E2E runs with a fixed fake now, so "sesi hari ini" built from the machine date drifts from the date the server considers today.

Story authors for seed, e2e and auth will each resolve these differently.
**Fix:** Split the scripts.
- `npm run admin:create -- --email … --password-stdin` (or reading from `.env`): idempotent upsert of one admin per call, safe in production.
- `npm run seed:demo`: refuses to run unless `NODE_ENV` is `development` or `test`, builds every date from the same `Clock` (honoring `KELASKU_FAKE_NOW`), and wipes and recreates the DB file.

State both in AD-9 and the Konfigurasi row, and add both to the minimum script names.

### H-3 — Selesai (finished class) guard is not required inside the transaction
**Where:** AD-3 read list; AD-4 ("Kelas Selesai tidak pernah mempromosikan"); FR-3/FR-7/FR-11.
**Problem:**
- Selesai is derived from the last session date versus `todayJakarta()`.
- FR-7 and FR-11 must reject registration and cancellation in Selesai classes, and FR-3 locks dates and quota. AD-3 lists the reads that must happen inside `fn` (registered count, queue length, active registration, quota), but not the class's session dates.
- One story could compute the status in the handler before the transaction. A concurrent admin date edit could then let a registration or cancellation slip into a class that just became Selesai, or the reverse.
- Error codes for these rejections are also unnamed. Example messages: "Pendaftaran kelas ini sudah ditutup", "Kelas sudah selesai; pendaftaran tidak bisa dibatalkan".

**Fix:**
- Extend the AD-3 Rule: "…termasuk tanggal sesi kelas untuk menghitung status Selesai via fungsi domain dengan `clock.todayJakarta()` yang diambil di dalam `fn`."
- Name the codes in AD-8/`errors.ts`: `class_finished_registration_closed`, `class_finished_cancellation_closed`, `class_finished_locked_fields`, `quota_below_registered`, `session_not_yet_open`.

### H-4 — Waitlist order `created_at, id` can invert under concurrency
**Where:** AD-4 ("urut `created_at`, lalu `id`"), AD-10 (timestamps from `toISOString()`), AD-7.
**Problem:**
- Nothing says `clock.now()` must be read inside the write lock.
- Suppose request A reads `now()` = t1, then request B reads t2 > t1, but B gets the lock first. B is inserted with the lower `id` and is told "Daftar tunggu #1". A is then inserted with an earlier `created_at` and becomes #1, so B's shown position silently moves back. That breaks FR-10 ("posisi … selalu sama") and the R3 spirit.
- In-process sync better-sqlite3 hides this. AD-14's worker_threads tests and any future async path expose it. Under `KELASKU_FAKE_NOW`, every `created_at` is equal, so order depends on `id` alone, which makes test and prod semantics differ.

**Fix:** Pick one of these and state it in AD-4:
- (a) Order the queue by `id` only. AUTOINCREMENT under `BEGIN IMMEDIATE` is commit order and is "waktu daftar" by construction. Keep `created_at` for display only.
- (b) Require `now()` to be read inside `withWriteTx`'s `fn`, and keep `created_at, id`.

(a) is simpler and fully enforceable. Update the memlog decision to match.

## Medium

### M-1 — Server production build/run mode undecided
**Where:** Stack (`tsx` "saat dev dan skrip"), Topologi ("`npm run build` lalu `npm start`").
**Problem:** The spine does not say whether `npm start` runs compiled JS (`tsc` → `dist/server`) or `tsx`/Node 24 native type stripping. That choice drives `tsconfig` (`module`, `outDir`, import extensions `.js` vs `.ts`), which every server file's imports depend on. Two early stories would diverge on import specifiers.
**Fix:** Add a row to Konvensi (or AD-1): "Server dikompilasi `tsc -p tsconfig.server.json` ke `dist/server`; impor relatif memakai ekstensi `.js`; `npm start` = `node --env-file-if-exists=.env dist/server/main.js` dengan `NODE_ENV=production`." Alternatively, choose native type stripping explicitly, with its constraints (no enums/namespaces, `erasableSyntaxOnly`).

### M-2 — Fake clock guard vs "Playwright runs the production build"
**Where:** AD-7 (`KELASKU_FAKE_NOW` honored only when `NODE_ENV=test`), AD-14 and Topologi ("Playwright memakai `vite build` + server produksi").
**Problem:** The production server must be started with `NODE_ENV=test` for e2e. This is legitimate, but it is implicit, and a story author may "fix" one side. Static serving or logging that keys off `NODE_ENV=production` would then behave differently under e2e.
**Fix:** In AD-7/AD-14, state that "Playwright `webServer` menjalankan artefak build yang sama dengan `NODE_ENV=test`, `DATABASE_PATH` sementara, dan `KELASKU_FAKE_NOW`". Also state that no behavior other than the clock and the seed:demo gate may branch on `NODE_ENV`.

### M-3 — API route table incomplete for known units
**Where:** Konvensi "Rute API".
**Problem:**
- There is no admin cancellation endpoint (FR-12).
- There is no "who am I" endpoint for the SPA redirect and return-to-route behavior (FR-1, EXPERIENCE "Belum masuk").
- The attendance GET/PUT verbs are not given.
- `/api/admin/classes[/:id]` leaves POST/PUT/PATCH open.

The FR-12 and FR-1 stories will invent paths independently.
**Fix:** Enumerate method and path:
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/admin/classes`
- `GET|PUT /api/admin/classes/:id`
- `POST /api/admin/registrations/:id/cancellation`
- `GET|PUT /api/admin/classes/:id/sessions/:date/attendance`
- `GET /api/admin/classes/:id/recap`
- `GET /api/admin/classes/:id/recap.csv`
- `GET /api/admin/today`

Also state that `@fastify/static` SPA fallback applies only to non-`/api` paths (unknown `/api/*` returns the 404 envelope).

### M-4 — Upgrade / migration-run safety not decided
**Where:** AD-12 (migrations auto-apply at start, forward-only), Deferred (backup schedule).
**Problem:** Forward-only auto-migrations on start, with no pre-migration backup, make a bad migration unrecoverable in a single-file deployment. The upgrade procedure (stop → backup → pull → `npm ci` → build → start) and restore are not stated anywhere. This is the operational-envelope gap the rubric targets.
**Fix:** Add to AD-12: "Sebelum menerapkan migrasi yang tertunda, server menyalin DB lewat `db.backup()` ke `backups/pre-migrate-<user_version>-<timestamp>.db`; setiap migrasi berjalan dalam satu transaksi; gagal = proses keluar non-zero tanpa melayani." Add a one-line upgrade and restore procedure to the Topologi table (restore = stop, copy backup over `DATABASE_PATH`, remove `-wal`/`-shm`, start).

### M-5 — Admin session lifetime and cleanup unspecified
**Where:** AD-9 (`expires_at` exists, no value).
**Problem:** The auth story and any "today" landing story may pick different lifetimes, or sliding versus absolute expiry. Expired rows also accumulate.
**Fix:** Fix the values in AD-9, for example an absolute 12 h (a working day), no sliding renewal, expired rows deleted on login, and an expired token answered with 401 `session_expired`.

### M-6 — Attendance ↔ session link is implicit
**Where:** AD-11 (`attendance(registration_id, session_date, present)`), ER ("by session_date").
**Problem:** Nothing at the schema level stops an attendance row for a date that is not a `class_sessions` row of that registration's class. The "date with attendance cannot be edited" rule then has to be enforced only in code, and two stories (FR-3 edit and FR-15 save) each re-implement the check. The behavior for payload rows that target non-Terdaftar registrations (ignore or reject) is also unspecified.
**Fix:** Either key attendance by `class_session_id` (FK `ON DELETE RESTRICT`), which makes the "locked date" rule a DB guarantee, or keep `session_date` and state that the save service validates the date against `class_sessions` inside the tx. State: "baris untuk pendaftaran non-Terdaftar → tolak seluruh simpan dengan `code: registration_not_registered`".

## Low

- **L-1 — SQLITE_BUSY handling.** With `busy_timeout=5000`, a lock wait over 5 s throws. Add to AD-8 that `SQLITE_BUSY` maps to HTTP 503 `code: busy_retry`, so it does not become an unhandled 500.
- **L-2 — Lint/format deferral.** This is harmless only if decided once. Change the Deferred line to "diputuskan di cerita scaffolding pertama dan dikunci di `package.json`". Otherwise parallel stories produce formatting-only diffs and merge conflicts.
- **L-3 — Node version pinning.** Add `.nvmrc` (24) to the source tree, because it appears in the memlog but not in the spine. Add one memlog line on why Node 24 (Maintenance LTS) rather than 26 (Active LTS) as of 2026-11. Node 22 is EOL April 2027, so the `engines >=22.22.0` floor will need revisiting.
- **L-4 — Spine/memlog drift.** In the memlog, the migrations path is `src/server/db/migrations` and the signature is `promoteFromWaitlist(tx, classId)`. In the spine they are `src/server/data/migrations` and `(tx, classId, now)`. Append a memlog `(decision)` that supersedes the old lines.
- **L-5 — NFR-7 verification method.** The 1-CPU, one-year seed perf check has no home. Add a line to AD-14 (`npm run perf` on `seed:demo --year`), or defer it explicitly.
- **L-6 — Registration result DTO.** AD-5 names `alreadyActive`, but the response shape (`status`, `position`, `promotedAt`, `today`) is left to `dto.ts`. Name the DTO (`RegistrationResult`) in AD-5 so the FR-7, FR-9 and FR-14 stories share it.
- **L-7 — Logging of credentials.** Extend the Logging convention: request bodies are never logged (login password, participant email), and pino `redact` covers `req.headers.cookie`.

## Bloat / trim candidates

- **AD-1 `[ADOPTED]` tag.** It is the only AD with a status tag. Either tag all of them or drop it.
- **Deferred → "Pembagian epik…; Epik 1 cukup dengan AD-1–AD-10, AD-12–AD-14".** This is sequencing advice, not a divergence point. Move it to the memlog or epics input.
- **Deferred → "Struktur internal tiap halaman React".** Already implied by the spine's minimal-seed nature. Drop it.
- **AD-13 example date strings and the CSV row in Konvensi.** These restate PRD FR-22 and NFR-5 nearly verbatim. Keep only the binding part ("satu `format.ts`, `Intl`, `id-ID`, `Asia/Jakarta`"; "CSV dibangun di `services/recap` dari fungsi domain AD-6") and reference FR-22 for the formatting details.
- **"Prevents" lines that restate rationale** (AD-9 "campuran JWT dan sesi server"). These are fine, but the alternatives-weighed content belongs in the memlog, which already has it. No action is needed beyond keeping them to one clause.
- **Stack row parenthetical** "(menjalankan server TS saat dev dan skrip)". After M-1 is resolved, this becomes a decision. Move it to the Konvensi row from M-1.

## What is good (keep)

- AD-3 + AD-4 + AD-5 together close R1/R2/R4/R7 at the data layer with a COUNT-in-tx and no counters, which is exactly what AGENTS.md requires.
- AD-6 integer R6/FR-20 formulas, with a single domain function shared by the grid, status page and CSV.
- AD-7 Clock injection with a `new Date()` ban in domain and services. This is enforceable with a lint rule or grep in review.
- AD-14 cross-connection concurrency tests via `worker_threads`, with no mocked DB.
- Every Stack row is backed by a dated memlog `(version)` entry.
