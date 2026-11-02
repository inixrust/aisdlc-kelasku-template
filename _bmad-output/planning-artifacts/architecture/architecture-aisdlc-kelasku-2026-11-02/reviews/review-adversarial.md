---
title: 'Adversarial review — Architecture Spine Kelasku'
reviewed: _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md
date: '2026-11-02'
lenses:
  - 'Adversary: two units one level down that obey every AD yet build incompatibly'
  - 'Data integrity: R1/R2/R4/R7 under SQLite WAL + better-sqlite3 sync transactions'
sources:
  - docs/intent-kelasku.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/addendum.md
  - AGENTS.md
verdict: 'REVISE — the spine is sound in shape, but 5 high holes let compliant stories diverge on R3, R4/FR-11, Selesai, and attendance integrity'
---

# Adversarial review — Architecture Spine Kelasku

## Verdict

**REVISE before `bmad-create-epics-and-stories`.** The paradigm (one process, a sync `BEGIN IMMEDIATE` transaction per write, a pure domain, COUNT inside the transaction) is the right foundation, and the core of R1/R2 is closed. One fact matters for every finding below. With one process and one synchronous better-sqlite3 connection, production transactions are fully serialized. Most remaining holes therefore do not come from SQL interleaving. They come from **decisions the spine leaves open**: timestamp format, cancellation identity, who owns `registrations` writes, where the Selesai check happens, and how attendance references sessions. Two stories can each settle these differently and still comply with every AD.

| # | Hole | Severity | Rules hit | Fix |
| --- | --- | --- | --- | --- |
| H1 | Timestamps from SQL vs Clock; mixed formats break FIFO ordering | High | R3, R4, AD-7 | New AD-15 |
| H2 | Cancellation identity and idempotency (public by email vs admin by id) | High | R4, FR-11, FR-12 | New AD-16 + route table |
| H3 | No single owner of `registrations` writes; unguarded transitions; nested `withWriteTx` | High | R1, R4, FR-11 | New AD-17, tighten AD-3/AD-4 |
| H4 | Selesai gate: where it runs and which "today" it uses; `promoteFromWaitlist(now: Date)` cannot compute it | High | FR-7, FR-11, AD-4, R5-adjacent | Tighten AD-4, AD-7, new AD-18 |
| H5 | Attendance ↔ session dates have no referential integrity; class edit and attendance save race on semantics | High | R5, R6, FR-3 | Tighten AD-11, new AD-19 |
| H6 | Queue position computed by different queries in different places | Medium | R3, FR-10 | Tighten AD-6 |
| H7 | Attendance save with a stale roster (cancelled or promoted between open and save) | Medium | FR-15, AD-11 | Tighten AD-11 |
| H8 | Registration result after a UNIQUE violation: the transaction has rolled back, so "existing status" is undefined | Medium | R2, AD-5 | Tighten AD-5 |
| H9 | Request/response DTOs not bound to one source | Medium | AD-8 | Tighten AD-8 |
| H10 | Class invariants not stated, and nothing at the DB level backs up R1 | Medium | R1, R3, R7 | New AD-20 |
| H11 | `SQLITE_BUSY` / `busy_timeout` behaviour unmapped | Low | NFR-1, AD-8 | Tighten AD-1/AD-8 |
| H12 | Playwright + `KELASKU_FAKE_NOW` vs a production build's `NODE_ENV` | Low | AD-7, AD-14 | Tighten AD-14 |

---

## H1 — Timestamps written by SQL vs by Clock (High)

**Unit A (story "class & registration schema", migration `001_init.sql`):** declares `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` and `promoted_at`/`cancelled_at` without a default. This complies with AD-12 (numbered migration) and AD-10 (timestamp is TEXT). AD-7 bans `new Date()` only in `domain/` and `services/` and says nothing about SQL.

**Unit B (story "cancellation & promotion"):** a repository writes `promoted_at = @now` with `clock.now().toISOString()`, as AD-10 requires.

**Unit C (story "admin session"):** checks expiry with `WHERE expires_at > datetime('now')`.

**Incompatibility:**
- `CURRENT_TIMESTAMP` yields `2026-11-02 09:00:00`, while `toISOString()` yields `2026-11-02T09:00:00.000Z`. Any string comparison between them is wrong, because a space (0x20) sorts before `T` (0x54).
- If one insert path relies on the default and another (seed, a later story) passes ISO, `ORDER BY created_at, id` stops being FIFO. That breaks R3, and through promotion it also breaks R4 (the wrong person is promoted).
- `datetime('now')` and `CURRENT_TIMESTAMP` ignore `KELASKU_FAKE_NOW`, so R5 and session-expiry tests become clock-dependent.
- Unit C compares `'2026-11-02 09:00:00'` against an ISO `expires_at`, which gives an incorrect expiry.

**Close with a new AD-15 — All time values come from Clock; the DB never generates time:**
> Migrations and repositories must not use `CURRENT_TIMESTAMP`, `CURRENT_DATE`, `datetime('now')`, `date('now')`, `strftime(... 'now')`, or a time `DEFAULT`. Every timestamp column is `TEXT NOT NULL` (or `NULL` for `promoted_at`/`cancelled_at`) and is filled by an `@now` parameter from `clock.now().toISOString()`. Every calendar-date column is filled from a `YYYY-MM-DD` string. The schema enforces the format with `CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')` and `CHECK (session_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`. Every time comparison in SQL (session expiry, ordering) compares a column against a parameter in the same format. A grep test in CI fails if `src/server/data/**` contains `'now'` or `CURRENT_`.

---

## H2 — Cancellation identity and idempotency (High)

**Unit A (story "participant cancellation", FR-11):** follows the route table literally, `POST /api/public/cancellations { classCode, email }`. The service looks up *the current active registration* for `(class, email)` and cancels it. If none exists, it returns `200 { outcome: 'no_active_registration' }` (AD-8: a valid business outcome is 200).

**Unit B (story "admin cancellation", FR-12):** the route table defines no admin route. The developer picks `POST /api/admin/registrations/:id/cancel`. The service reads the row by id. If it is already `cancelled`, it throws `409 already_cancelled`.

**Incompatibility / integrity:**
1. **No idempotency for double-clicks across re-registration.** The participant cancels registration A and then re-registers (B, waitlisted). Next, a stale retry or second tab sends `{classCode, email}` again, and **B gets cancelled**. The first cancellation was not a no-op; the second request cancelled a different entity. FR-11 requires that a repeated cancellation "tidak mengubah apa pun".
2. **Participant and admin cancel almost simultaneously** (FR-11, EXPERIENCE UJ-3: "keduanya melihat hasil yang sama"). Unit A returns `no_active_registration` (the status page shows "Tidak ada pendaftaran aktif"). Unit B returns 409 (the admin sees an error). The two results are not the same, and there are two shapes for one fact.
3. Both units have their own "cancel" logic. AD-4 unifies only promotion, not cancellation.

**Close with a new AD-16 — One cancellation path, keyed by registration identity, idempotent:**
> Cancellation goes only through `cancelRegistration(tx, { registrationId, by: 'participant' | 'admin', now, today })` in `services/cancellation.ts`. The public entry point carries the registration identity received from `POST /api/public/status`: `POST /api/public/cancellations { registrationRef, email }`. `registrationRef` is an opaque token, either a per-registration `public_ref` (base64url, UNIQUE) or the internal id in the body (never in a URL, per AD-10). `email` must match `normalizeEmail` for that row, otherwise the response is `not_found`. The admin entry point is `POST /api/admin/registrations/:id/cancellation`. Inside the transaction: if the row is already `cancelled`, return `200 { outcome: 'already_cancelled', cancelledAt, cancelledBy }` with no write and no promotion. If the class is Selesai, return `class_finished`. Otherwise do a guarded update (AD-17), then call `promoteFromWaitlist` **only if the previous status was `registered`**. Both routes return the same `CancellationResult` DTO from `src/shared/dto.ts`.

Also update the API Routes row in Consistency Conventions: replace `POST /api/public/cancellations (body { classCode, email })` with the form above, and add `POST /api/admin/registrations/:id/cancellation`.

---

## H3 — No single owner of `registrations` writes; unguarded transitions; nested transactions (High)

**Unit A (story "registration"):** `data/registrations-repo.ts` exports `insertRegistration`.

**Unit B (story "cancellation"):** `data/cancellation-repo.ts` exports `cancel(db, id, by, now)` = `UPDATE registrations SET status='cancelled', cancelled_at=@now, cancelled_by=@by WHERE id=@id`, with no current-status guard. The service checks the status first, so the code complies with AD-2 and AD-3.

**Unit C (story "quota increase", FR-3):** `promoteFromWaitlist` lives in `services/` (AD-4). It mutates data, so by the literal reading of AD-3 ("Semua service yang mengubah data memanggil `withWriteTx`") it **opens its own `withWriteTx`**. It also adds `promote(db, ids, now)` to `data/promotion-repo.ts`.

**Incompatibility / integrity:**
- Three repositories write to one table, each with its own transition assumptions. A fourth story (for example an admin "fix status" or the seed) can write `waitlisted → registered` without `promoted_at`. Nothing at the DB level rejects `registered → waitlisted` or `cancelled → registered`, and either one breaks R1 or R4.
- If a later refactor moves the status check out of the service, `cancel` without a guard overwrites `cancelled_at` and `cancelled_by` from the first cancellation (FR-11: "tetap milik pembatalan pertama").
- `promoteFromWaitlist` calling `withWriteTx` inside the caller's transaction: better-sqlite3 turns it into a SAVEPOINT. `.immediate()` has no meaning there, and Unit C's own tests (which call promote directly, outside a transaction) pass while running in a separate transaction from the R7 update. If the developer calls it *after* `withWriteTx` returns, both AD-3 and AD-4 still appear to be followed, but promotion lands in a different transaction from the quota change.
- AD-3 vs AD-4 is a real contradiction: AD-4 says "dipanggil di dalam transaksi pemicunya", while AD-3 makes every mutating service open a transaction.

**Close with a new AD-17 — Registration state machine with one writer:**
> Only `src/server/data/registrations-repo.ts` writes to `registrations`. Allowed transitions: (insert) → `registered` | `waitlisted`; `waitlisted → registered` (promotion only, sets `promoted_at`); `registered → cancelled`; `waitlisted → cancelled` (sets `cancelled_at`, `cancelled_by`). Every `UPDATE` includes `AND status = @expectedStatus` and the repository asserts `info.changes === 1`, otherwise it throws `StaleTransitionError` (programming error, 500). The schema adds `CHECK (status IN ('registered','waitlisted','cancelled'))`, `CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))`, and `CHECK (cancelled_by IN ('participant','admin') OR cancelled_by IS NULL)`.

**Tighten AD-3 (add):**
> Services come in two kinds. A *use-case* (exported, called by http) opens exactly one `withWriteTx`. A *tx-step* (`promoteFromWaitlist`, `cancelRegistration`, `assertClassOpen`) takes a parameter of type `Tx` (branded from `data/db.ts`, available only inside the `withWriteTx` callback), never opens a transaction, and must not be exported to `http/`. `withWriteTx` throws if called while `db.inTransaction` is true.

**Tighten AD-4:** replace "di `src/server/services/`" with "di `src/server/services/promotion.ts`, as a tx-step `promoteFromWaitlist(tx: Tx, classId, ctx: TxClock)`", and add "No other code changes `waitlisted → registered`."

---

## H4 — Where the Selesai gate runs and which "today" it uses (High)

**Unit A (story "registration", FR-7):** the handler loads the class, calls `domain.classStatus(sessionDates, clock.todayJakarta())`, and rejects with `registration_closed` if the class is Selesai. Then it calls the service, which opens `withWriteTx`. AD-3 lists the reads that must happen inside the transaction (*jumlah Terdaftar, panjang antrean, pendaftaran aktif, kuota*), and class status/session dates are **not** on that list, so this is compliant.

**Unit B (story "promotion", AD-4):** AD-4 says "Kelas Selesai tidak pernah mempromosikan", but the signature is `promoteFromWaitlist(tx, classId, now)` and receives `now: Date`, not `today`. The developer derives today with `now.toISOString().slice(0, 10)`. That does not violate AD-7 (no `new Date()`), but it is a **UTC** date.

**Unit C (story "class edit", FR-3):** checks "Selesai only title editable" against the class status read when the form was loaded.

**Incompatibility / integrity:**
- Between 00:00 and 07:00 WIB the UTC date is still yesterday. Promotion considers the class Dibuka while registration and cancellation consider it Selesai, or the other way round. On the morning after the last session, a cancellation can be rejected while a quota increase still promotes, which violates "daftar Terdaftar dibekukan".
- The gate in Unit A runs outside the transaction. While the request is in flight, an admin's class edit can change the session dates in another transaction, so the decision rests on a stale read. In production with a single connection the window is small but real when the handler `await`s between the check and the transaction. In the worker_threads tests required by AD-14, the window is real.
- Midnight WIB: a request that reads `today` at 23:59:59.999 and opens the transaction after midnight uses two different "todays" for one decision.

**Tighten AD-7 (add):**
> Each use-case reads the clock **once, inside the `withWriteTx` callback**, and builds `ctx: TxClock = { nowIso: string, today: string }`, which is passed to every tx-step. Tx-steps and the domain receive only `ctx`, never `Date` or `Clock`. Deriving a date from `toISOString()` is forbidden; the only date source is `clock.todayJakarta()`.

**New AD-18 — The Selesai gate lives in the transaction:**
> Every use-case that writes to a class's `registrations` or changes `quota`/`class_sessions` calls `assertClassOpen(tx, classId, ctx)` as the first read inside the transaction. It reads `MAX(session_date)` and calls `domain.classStatus`. Selesai results in `registration_closed` (registration), `class_finished` (cancellation), or `class_finished_locked` (quota/date changes; a title-only change is allowed). `promoteFromWaitlist` calls the same check and returns 0 when the class is Selesai. A check in the handler or UI is UX only and never replaces this one.

Add "status kelas (dari `class_sessions` di dalam transaksi)" to the AD-3 list.

---

## H5 — Attendance ↔ session dates without referential integrity (High)

**Unit A (story "class edit", FR-3):** implements sessions as a full replacement: `DELETE FROM class_sessions WHERE class_id=?` followed by re-inserting the new list, after first checking that no removed date has attendance. This complies with AD-11 (dates with attendance do not change, because they are re-inserted identically) and AD-12.

**Unit B (story "attendance", FR-15):** saves to `attendance(registration_id, session_date, present)` as AD-11 specifies. It checks `session_date <= today` and that the registration is Terdaftar in the class. It does **not** check that `session_date` is one of the class's session dates, because AD-11 does not require it.

**Incompatibility / integrity:**
- The ERD draws `class_sessions ||--o{ attendance : "by session_date"`, but `attendance` has no `class_id`, so there is **no possible FK**. An `attendance` row for date D that is not (or no longer) a session of the class is accepted by Unit B. For example, an admin with a stale form saves attendance for D after another admin deletes D, or a direct API call sends any date ≤ today.
- R6 counts `hadir` from attendance rows, while `totalSesi` comes from `class_sessions`. An orphan `present=1` row makes `hadir > totalSesi`, so a participant becomes Layak with too few sessions. This is a silent R6 violation.
- The "dates with attendance cannot be deleted" rule depends entirely on each class-edit story remembering to run the check (outside or inside the transaction). The DB does not hold the line.
- FR-3 requires admin confirmation when attendance exists. Unit A puts the warning only in the UI. If another admin saves the first attendance after the form opens, the change goes through without a warning.

**Tighten AD-11 (replace the schema sentence):**
> `attendance(registration_id INTEGER NOT NULL REFERENCES registrations(id), class_session_id INTEGER NOT NULL REFERENCES class_sessions(id) ON DELETE RESTRICT, present INTEGER NOT NULL CHECK (present IN (0,1)), recorded_at TEXT NOT NULL, PRIMARY KEY (registration_id, class_session_id))`. The attendance route `/api/admin/classes/:id/sessions/:date/attendance` resolves `:date` to `class_sessions.id` **inside the transaction** for class `:id`. If it is not found, the response is `session_not_found`. Each `registration_id` sent must have `class_id = :id`.

**New AD-19 — Session-date changes are a diff, not a replace:**
> Editing a class sends the full list `sessionDates[]` (PUT). Inside the transaction the server computes `added` / `removed` against `class_sessions`. It only `INSERT`s `added` and only `DELETE`s `removed`; existing rows (and their ids) are never deleted and re-inserted. The FK `ON DELETE RESTRICT` rejects deleting a date that has attendance, and that error maps to `session_has_attendance` (409, `fields.sessionDates` lists the dates). If the class has any attendance and `added ∪ removed` is non-empty, the request must include `confirmSessionChange: true`, otherwise the response is `session_change_needs_confirmation` (409). The check runs inside the transaction, so the warning is enforced by the server.

---

## H6 — Queue position computed by different queries (Medium)

**Unit A (registration result, FR-7):** position = `SELECT COUNT(*) FROM registrations WHERE class_id=? AND status='waitlisted' AND (created_at < @c OR (created_at = @c AND id <= @id))`.

**Unit B (admin class page, FR-5):** fetches the waitlist with `ORDER BY id` (the developer reasons that id is autoincrement, so it is already FIFO) and passes it to `domain.queuePositions(list)` as required by AD-6.

**Unit C (status page, FR-14):** uses `ROW_NUMBER() OVER (ORDER BY created_at)` without a tie-breaker.

**Incompatibility:** AD-6 makes the domain compute the position, but the **input order comes from SQL that each story writes itself**. Whenever `created_at` order ≠ `id` order (clock captured before an `await`, NTP stepping backwards, timestamps equal under `KELASKU_FAKE_NOW`), the three pages show different numbers for the same registration. That violates FR-10 ("selalu sama"), and promotion (AD-4) may take a different head than the one the admin sees.

**Tighten AD-6 (add):**
> Queue order is defined once in `registrations-repo.listWaitlist(classId)` with `ORDER BY created_at, id`. Promotion, the admin page, the status page, and the registration result all use that function (or `waitlistPosition(classId, registrationId)`, which is implemented over the same ordering). Positions are computed by `domain.queuePositions` over that output. Combined with AD-7 (clock read inside the transaction), `created_at` is monotonic in insert order, so the tie-breaker `id` applies only to equal timestamps.

---

## H7 — Attendance save with a stale roster (Medium)

**Unit A (attendance service):** if any `registrationId` in the payload is no longer Terdaftar (cancelled after the form opened), it rejects the whole save with `registration_not_active` (409), because AD-11 says the save is "hanya untuk pendaftaran berstatus Terdaftar".

**Unit B (attendance client, FR-18 default "semua hadir"):** sends every row on the form. It assumes the server ignores rows that are no longer relevant and shows the toast "Presensi tersimpan".

**Incompatibility:** a participant cancelling while Rina is filling in attendance makes the whole save fail, with an error message the client has never seen. Two developers will read "hanya untuk" differently: as a reason to reject, or as a reason to filter.

**Tighten AD-11 (add):**
> The attendance payload is `{ entries: { registrationId: number, present: boolean }[] }` (DTO in `src/shared/dto.ts`). Inside the transaction, entries whose registration is not Terdaftar in that class are **skipped**, not rejected. Entries whose `registrationId` does not belong to the class are rejected with `invalid_registration` (400). The response is `{ saved: number, skippedRegistrationIds: number[], roster: AttendanceRow[] }` and the client re-renders from `roster`. Saving never deletes rows (there is no "un-record"); registrations not in the payload are left unchanged.

---

## H8 — Result after a UNIQUE violation (Medium)

**Unit A:** catches `SQLITE_CONSTRAINT_UNIQUE` **outside** `withWriteTx`. The transaction has already rolled back, so the developer returns `{ alreadyActive: true }` with no status or position, because there is no data to return.

**Unit B (client):** follows FR-9 and renders "Anda sudah di daftar tunggu #N" from `status` + `position`, which are now `undefined`.

**Integrity note:** in production (one connection) this path is practically unreachable, because the second request is serialized and finds the row through the first lookup. It is reachable in the AD-14 worker_threads test and whenever a CLI opens a second connection, and the response shape still has to be fixed.

**Tighten AD-5 (add):**
> The insert runs inside the same callback as the lookup. A `SQLITE_CONSTRAINT_UNIQUE` error from the `registrations` insert is caught **inside** the `withWriteTx` callback (SQLite rolls back only that statement). The service then re-reads the active registration in the same transaction and returns the full `RegistrationResult` (`status`, `position`, `promoted`, `alreadyActive: true`). Other UNIQUE errors (for example a `public_code` collision) are not mapped to this outcome; `public_code` is regenerated up to 3 times before failing.

---

## H9 — DTOs not bound to one source (Medium)

**Unit A (server):** `POST /api/public/classes/:code/registrations` returns `{ status: 'waitlisted', position: 2 }`.
**Unit B (client):** expects `{ registration: { status: 'Daftar tunggu', queuePosition: 2 } }` (Indonesian labels from the server, interpreting "message dari server" in AD-8).

AD-8 binds only the error envelope and the zod schema for *input*. The tree mentions `dto.ts` but no AD requires it.

**Tighten AD-8 (add):**
> Every route's request and response types are defined in `src/shared/dto.ts`; Fastify handlers declare their return type with that type and `src/client/api/` imports the same type. Status values in DTOs are always the AD-10 codes (`registered|waitlisted|cancelled`) plus explicit derived flags (`promoted: boolean`, `classStatus: 'open'|'full'|'finished'`, `position: number | null`). Indonesian labels are produced only by `client/format.ts`. The only exceptions are `error.message`/`error.fields`, which come from the server.

---

## H10 — Class invariants not stated; no DB backstop for R1 (Medium)

**Unit A (seed script, NFR-9):** builds the "kelas penuh dengan 3 daftar tunggu" state with direct INSERTs. AD-1 allows a CLI to open its own connection, and AD-2/"Mutasi state" are written for the server. Because of a typo, the seed creates a class with quota 5, 4 registered, and 3 waitlisted.

**Unit B (registration service):** follows AD-5. Since the waitlist is not empty, a new registrant goes to the waitlist, so the class shows 4/5 with a queue forever (until a cancellation). The e2e test for "kelas penuh" fails for a reason that has nothing to do with the code under test.

The spine never states the invariant that all R1/R3/R4/R7 logic relies on: **for a Dibuka class, `waitlisted > 0 ⇒ registered = quota`, and always `registered ≤ quota`.**

**New AD-20 — Class invariants and data backstop:**
> For every class: (I1) `COUNT(registered) ≤ quota`; (I2) if the class is Dibuka and `COUNT(waitlisted) > 0` then `COUNT(registered) = quota`. `data/` provides `assertClassInvariants(tx, classId)`, which is called at the end of every write use-case when `NODE_ENV !== 'production'` and in every concurrency test. The schema adds triggers `BEFORE INSERT` / `BEFORE UPDATE OF status ON registrations` that `RAISE(ABORT, 'quota_exceeded')` when the row becomes `registered` and the count already equals the quota, and `BEFORE UPDATE OF quota ON classes` that `RAISE(ABORT, 'quota_below_registered')`. These triggers back up R1/R7 regardless of service or script bugs. Seed and other scripts write only through services (they call the use-cases with a `Clock`), never through direct INSERTs.

---

## H11 — `SQLITE_BUSY` unmapped (Low)

In production a single connection never waits. Still, `npm run backup` (`db.backup()`) and the worker_threads tests open a second connection. Once `busy_timeout=5000` runs out, `SQLITE_BUSY` reaches the error handler as a 500 with an English message. One story maps it to a 503 and another does not.

**Tighten AD-8 (add):** `SQLITE_BUSY`/`SQLITE_LOCKED` map to `503 { code: 'database_busy', message: 'Server sedang sibuk, coba lagi.' }`; no automatic retry inside the handler. AD-14: the concurrency tests set `busy_timeout` to the same value as production and fail if any operation returns `database_busy`.

## H12 — `KELASKU_FAKE_NOW` in Playwright (Low)

AD-14 says Playwright runs "build produksi … dengan `KELASKU_FAKE_NOW`", while AD-7 says the variable is ignored unless `NODE_ENV=test`. If the `start` script sets `NODE_ENV=production` and `playwright.config.ts` relies on `npm start`, then the R5 e2e tests (23.30 / 06.00 WIB) silently use the real clock.

**Tighten AD-14 (add):** Playwright's `webServer` runs `node dist/server/main.js` (not `npm start`) with an explicit `NODE_ENV=test` and `KELASKU_FAKE_NOW`. At startup, the server logs `fakeNow` when it is active, and Playwright's global setup checks `GET /api/public/health → { today }` against the expected date.

---

## Checked and closed (no hole found)

- **R1 for concurrent registrations:** `BEGIN IMMEDIATE` + COUNT inside the transaction + a sync callback (AD-3). Closed, and the H10 trigger adds defence in depth.
- **R2 for double-clicks:** lookup inside the transaction + a partial unique index (AD-5). Closed apart from the H8 result shape.
- **R4 with concurrent cancellations:** `min(quota − COUNT, queue)` inside the transaction (AD-4) cannot exceed the quota. Closed once H2/H3 make it idempotent.
- **R7 with a stale form:** the quota check runs inside the same transaction as the update (AD-3 lists the quota). Closed.
- **R6 integer arithmetic:** AD-6 is explicit. Closed apart from the orphan-attendance input (H5).
- **WAL + `db.backup()`:** safe while the server is running.
