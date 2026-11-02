# Review — Reconcile spine vs. inputs (intent, PRD, addendum, AGENTS.md)

- Spine: `ARCHITECTURE-SPINE.md` (draft, 2026-11-02)
- Inputs: `docs/intent-kelasku.md`, `prds/prd-aisdlc-kelasku-2026-11-02/prd.md`, `addendum.md`, `AGENTS.md`
- Reviewer stance: only gaps/contradictions with architectural consequence; pure UI copy ignored.

## Verdict

**Mostly faithful, needs a targeted patch before epics.** R1–R4, R6, R7 transaction mechanics, timezone (AD-7), integer R6, email normalization, CSV hygiene, and data locality land well. Gaps cluster around the **Selesai lifecycle** (enforced only for promotion), **cancellation identity/idempotency** (admin route missing, public cancel keyed by email), **admin provisioning** (one env admin vs ±5 admins; seed mixes demo data), and **attendance payload semantics** (tri-state, session-date existence). No hard contradiction with R1–R7; one near-contradiction (KELASKU_FAKE_NOW vs "production build" in e2e).

## Findings

### F1 — Selesai lifecycle only enforced for promotion — HIGH
- **Source:** PRD §3 "Kelas Selesai menolak pendaftaran baru, pembatalan, dan promosi"; FR-7 "Pendaftaran ke kelas Selesai ditolak di API"; FR-11/FR-12 "Pembatalan di kelas Selesai ditolak di API"; FR-3 "Kelas Selesai hanya bisa diubah judulnya; tanggal sesi dan kuota terkunci"; addendum §3 last test.
- **Gap:** AD-4 says "Kelas Selesai tidak pernah mempromosikan", but no AD requires registration (AD-5), cancellation, or class edit (FR-3) to check Selesai **inside the write transaction** using `clock.todayJakarta()`. FR-3 edit lock for dates/quota on Selesai classes is absent entirely. Registration decision in AD-5 skips the closed check.
- **Fix:** Add a rule (extend AD-3 or new AD): every write service first computes `classStatus(sessions, today)` inside `withWriteTx`; if Selesai → registration rejects `registration_closed`, cancellation rejects `class_finished`, class edit rejects any change except title (`class_finished_locked`). Attendance is explicitly **still allowed** on Selesai classes (PRD §4.2 "kecuali lewat koreksi presensi"). Add error codes to `src/shared/errors.ts` list.

### F2 — Admin cancellation route missing; cancellation idempotency not specified — HIGH
- **Source:** FR-12 (admin cancels from halaman kelas admin); FR-11 "Membatalkan pendaftaran yang sudah Dibatalkan ... tidak mengubah apa pun dan tidak memicu promosi kedua. Waktu batal dan pembatal yang tercatat tetap milik pembatalan pertama"; addendum test `R4: cancelling an already-cancelled registration is a no-op`.
- **Gap:** Route table lists only `POST /api/public/cancellations {classCode, email}`; no admin cancel route. No rule that the cancel UPDATE is conditional (`WHERE status IN ('registered','waitlisted')`) with 0 rows ⇒ no-op, no promotion, `cancelled_at/by` untouched. Keying the public cancel by `(classCode, email)` also creates a stale-double-click hazard: request 1 cancels registration A; participant re-registers B; a delayed duplicate of request 1 cancels B. "R2 menjamin pasangan ini menunjuk satu pendaftaran aktif" is true at any instant but does not make the request idempotent.
- **Fix:** Add `POST /api/admin/classes/:id/registrations/:registrationId/cancellation`. Specify in AD-4 (or new AD) that cancel is a conditional update by **registration identity**, first writer wins, 0 affected rows ⇒ 200 with current state and no promotion. For the public route, include an opaque registration reference in the status DTO (non-sequential, e.g. a `public_ref` or the registration id inside POST body only) and cancel by `{ registrationRef, email }`; or explicitly accept the hazard in the spine.

### F3 — Admin provisioning: one env admin vs ±5 admins; seed = demo data — HIGH
- **Source:** PRD §2.1 "Admin ... ±5 orang"; §4.1 "Admin masuk dengan akun yang dibuat lewat seed"; NFR-9/addendum §4 seed contains demo classes; AGENTS.md "simpan nilai rahasia hanya di `.env` lokal".
- **Gap:** AD-9/config define one `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`; there is no way to create the other admins. The same `seed` script also creates demo classes (NFR-9), so running it in production would pollute real data; and "seed hanya dijalankan saat server mati" conflicts with adding an admin later.
- **Fix:** Split scripts: `npm run admin:create` (idempotent upsert of one admin from env or prompt, safe in prod, may run while server is up since it is a single short write tx) and `npm run seed:demo` (demo/e2e fixtures, refuses to run on a non-empty DB unless `--force`). Admin login email normalized with `normalizeEmail`.

### F4 — Attendance payload semantics and session existence — MEDIUM
- **Source:** FR-15 "Pendaftaran yang naik dari daftar tunggu setelah sebuah sesi disimpan tampil ... 'belum dicatat', tanpa centang bawaan. Catatan presensinya baru dibuat saat admin menyimpan pilihan untuknya"; FR-18 "Formulir presensi yang belum pernah disimpan dibuka dengan semua peserta tercentang hadir"; FR-21 "—" (belum dicatat).
- **Gap:** AD-11 says "upsert seluruh baris yang dikirim" but does not define (a) tri-state per row (`true | false | null` ⇒ null/omitted = no row written, never coerced to absent), (b) a `sessionSaved` (any row exists for this session) flag in the GET DTO so the client knows whether FR-18 default applies, (c) that `session_date` must be one of the class's `class_sessions` (only `> today` is checked; an arbitrary past date would be accepted), (d) whether rows for non-Terdaftar registrations are rejected or ignored.
- **Fix:** Extend AD-11: GET returns `{ sessionSaved, rows: [{ registrationId, present: boolean|null }] }`; PUT accepts only rows with boolean `present`, rejects (`invalid_registration`) any registration not Terdaftar in this class, rejects unknown session date (`session_not_found`, 404). Consider composite FK `attendance(class_id, session_date) → class_sessions` or a check in the tx.

### F5 — Eligibility-changing date edits need server-side confirmation — MEDIUM
- **Source:** FR-3 "Bila presensi sudah ada di kelas itu, menambah atau menghapus tanggal sesi menampilkan peringatan ... Admin harus mengonfirmasi peringatan itu sebelum perubahan disimpan"; FR-3 "Semua validasi FR-2 berlaku saat mengubah kelas" (min one date ≥ today, no duplicates, cannot remove the only date).
- **Gap:** Whether "presensi sudah ada" is evaluated client-side (stale) or server-side is undefined; a concurrent attendance save between form load and submit would bypass the warning. FR-2 validations on edit (esp. "minimal satu tanggal ≥ hari ini") are only implied by "validasi tanggal" in the domain row.
- **Fix:** Edit DTO carries `confirmEligibilityImpact: boolean`; service, inside the tx, rejects with `confirmation_required` (409) if attendance exists and the session set changes without the flag. State in AD-6/domain that `validateSessionDates(dates, today, { existingAttendanceDates })` is shared by create and edit.

### F6 — Which attendance rows lock a date / count as "presensi sudah ada" — LOW-MEDIUM
- **Source:** PRD §3 Presensi "Bila pendaftaran dibatalkan, presensinya tetap tersimpan tetapi tidak ditampilkan"; FR-3 date lock.
- **Gap:** AD-11 locks any date with "baris presensi", including rows of Dibatalkan registrations that are invisible in the UI; admin would see an unexplained lock. Also hadir/sesiTanpaCatatan should only count rows whose date is in the current session set.
- **Fix:** Decide explicitly (recommend: only rows of currently Terdaftar registrations lock a date and trigger the F5 warning; rows of cancelled registrations do not block but are kept). State it in AD-11.

### F7 — e2e fake clock vs "production build"; seed dates relative to fake now — MEDIUM
- **Source:** NFR-9 / addendum §4 "kelas dengan sesi hari ini (relatif terhadap tanggal seed dijalankan, WIB)"; FR-16 R5 cases 23.30 WIB and 06.00 WIB.
- **Gap:** AD-7 honours `KELASKU_FAKE_NOW` only when `NODE_ENV=test`, while AD-14 says Playwright runs the production build — the server must therefore run with `NODE_ENV=test`, which is not stated. Seed content (four required class shapes) is not specified, nor that seed computes "today" via the same `Clock` (so fake-now e2e and seed agree).
- **Fix:** In AD-14: e2e server = built artifacts started with `NODE_ENV=test` and `KELASKU_FAKE_NOW`; seed uses `createClock()` from `src/server/clock.ts`. List the four NFR-9 seed fixtures in Structural Seed.

### F8 — NFR-7 thresholds not carried — MEDIUM-LOW
- **Source:** NFR-7 "±240 kelas, ±5.000 pendaftaran, p95 < 1 detik, CSV < 2 detik, satu inti CPU".
- **Gap:** Map lists only one index. No numbers, no volume seed, no guard against N+1 in class table (FR-4 needs per-class counts, next session, waitlist count for all classes) or recap.
- **Fix:** Put thresholds in the NFR-7 row; require list/recap queries to be aggregate (GROUP BY) not per-class loops; add `seed:volume` (1-year data) and a perf check script. Add index `class_sessions(class_id, session_date)` and `attendance(registration_id)` (covered by UNIQUE).

### F9 — Waitlisted entries in Selesai classes — LOW
- **Source:** FR-10 "Halaman status peserta menampilkan 'Kelas selesai — tidak naik dari daftar tunggu', bukan posisi antrean."
- **Gap:** AD-6 computes position but does not say the status DTO must carry class status so the client replaces the position.
- **Fix:** AD-6: status DTO per registration includes `classStatus` and `waitlistPosition: number | null` (null when Selesai).

### F10 — CSV filename and download headers — LOW
- **Source:** FR-22 "Karakter yang tidak sah ... `/ \ : * ? \" < > |` diganti tanda hubung"; header Indonesian; columns nama, email, per tanggal, jumlah hadir, total sesi, kelayakan.
- **Gap:** "`<judul-aman>`" leaves sanitization undefined; non-ASCII titles need `Content-Disposition` with RFC 5987 `filename*=UTF-8''…` plus ASCII fallback. Column list/total sesi column not pinned.
- **Fix:** Spell out the sanitizer (replace listed chars and control chars with `-`) and header form in the CSV convention row; reference FR-22 column order.

### F11 — Accepted risks and non-goals not recorded — LOW
- **Source:** FR-14 note / PRD §9 "siapa pun yang tahu email ... bisa melihat dan membatalkan"; §6 non-goals (no notification, no catalog, no class deletion FR-3, no account for peserta).
- **Gap:** Spine never states these as deliberate; a story author may add OTP, rate-limit, delete route, or a public class list.
- **Fix:** Short "Out of scope / accepted risks" bullets in Deferred: no public class listing route (only `/:code`), no DELETE for classes/registrations, no participant auth, no notifications.

### F12 — Minor unspecified behaviours — LOW
- R2 duplicate with a different name: existing registration returned, name not updated (state it).
- `SQLITE_BUSY` after `busy_timeout` → map to a stable error code (e.g. `busy_retry`, 503) rather than 500.
- Admin session lifetime (`expires_at`) has no value; pick one (e.g. 12 h sliding).
- Production run of server TS: spine names `tsx` for dev/scripts but not how `npm start` runs the server (tsc build vs tsx). Not an input requirement, but a build-divergence risk.

## Landed correctly (no action)

R1/R2/R4/R7 in one `BEGIN IMMEDIATE` tx with COUNT inside (AD-3); waitlist-non-empty ⇒ waitlist (AD-5, R3); quota raise promotion via single path (AD-4); R2 partial unique index + mapping (AD-5); FIFO by `created_at`, `id` (AD-4); R5 Asia/Jakarta server clock, client uses server `today` (AD-7); R6 integer formula + FR-20 (AD-6); attendance per registration, no inheritance (AD-11); CSV BOM/formula guard (conventions); SQLite local only, npm, single repo (AD-1); Indonesian UI / English identifiers; `.env` not committed; rule IDs in test names (AD-14); stable public link independent of title (AD-10); email never in URL.
