---
type: review
lens: reconcile-ux
target: ARCHITECTURE-SPINE.md
sources:
  - _bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/EXPERIENCE.md
created: '2026-11-02'
---

# Reconcile review — Architecture Spine vs UX (DESIGN.md, EXPERIENCE.md)

## Verdict

**Mostly aligned; spine needs a patch before stories are written.** The spine absorbs the big UX decisions: no UI library, tokens mapped 1:1, shared components, Indonesian labels and WIB formats, axe in e2e, email kept out of URLs, a random public code, reload-on-action with no polling, server-owned Indonesian error messages, and R2 handled idempotently. The gaps are mostly in the **API contract**. The spine does not say which derived fields the screens need, it is missing one endpoint (admin cancellation) and one capability (session check), and it puts formatting and glossary labels in a module (`src/client/format.ts`) that the server also needs, for error messages and CSV. None of these require a redesign. Each one can produce divergent implementations across stories if it is left open.

Severity: **High** = stories will diverge or a UX flow can't be built as specified; **Medium** = likely divergence or rework; **Low** = small clarification.

## Findings

### F1 — No admin cancellation endpoint [High]

- **Source:** EXPERIENCE IA "Halaman kelas admin … FR-12"; State Patterns "Pembatalan ditolak (kelas Selesai) — Status peserta; Halaman kelas admin"; Component "Dialog konfirmasi — Pembatalan (peserta dan admin)".
- **Gap:** The spine's "Rute API" list has only `POST /api/public/cancellations`. It has no admin route for cancelling a registration. AD-4 and the entity model (`cancelled_by 'participant'|'admin'`) assume admin cancellation exists, but nothing defines its route or how it identifies the registration (internal id vs classCode+email).
- **Suggested fix:** Add `POST /api/admin/registrations/:id/cancellation` (or `/api/admin/classes/:id/registrations/:regId/cancellation`) to the Rute API row. It runs the same `services/cancellation` function with `cancelledBy: 'admin'` inside one `withWriteTx` and calls `promoteFromWaitlist`. A finished class returns error code `class_finished`.

### F2 — Indonesian date formats and glossary labels are needed on the server, but the spine confines them to the client [High]

- **Source:** EXPERIENCE Voice & Tone ("Tanggal 9 Nov 2026 sudah ada di kelas ini", "Bisa diisi mulai Senin, 16 Nov 2026", "Kuota minimal 14 …"); "Pakai istilah Glosarium PRD persis sama di layar, badge, header tabel, dan CSV"; DESIGN Badge "Teks badge sama persis dengan istilah Glosarium".
- **Contradiction:** AD-13 says all status labels and Indonesian date formats come from `src/client/format.ts`. AD-10 says Indonesian labels exist "hanya di lapisan tampilan". But AD-8 makes the **server** the source of Indonesian error messages, and those messages contain formatted dates. The CSV convention makes the **server** emit Glossary labels (Hadir/Tidak hadir/—, Layak/Belum layak/Tidak mungkin layak) and WIB timestamps. With the formatter on the client only, the server will either write its own second formatter or import from `src/client`, which the layer table forbids.
- **Suggested fix:** Move `format.ts` (date, timestamp, status, and eligibility labels, built on `Intl` with `id-ID` and `Asia/Jakarta`) to `src/shared/format.ts`, along with a `glossary.ts` that maps internal enums to Indonesian labels. Update AD-10 and AD-13 so the client, the error messages in `errors.ts`, and the CSV builder all use these. Keep the rule that the DB and DTOs carry English enums.

### F3 — The derived fields the screens need are not in the DTO contract [High]

- **Source:** EXPERIENCE State Patterns and Components. Each screen needs data the spine computes (AD-6, AD-7) but never commits to returning:
  - Registration result: `waitlistPosition` (#N), `nextSessionDate` ("Sesi berikutnya: {tanggal ≥ hari ini}"), and for the R2 case `alreadyActive` plus position.
  - Status page card: class title, session dates, class status (whether the cancel button shows, "Kelas sudah selesai", "Kelas selesai — tidak naik dari daftar tunggu"), `promoted` flag ("Terdaftar (naik dari daftar tunggu)"), `presentCount`/`totalSessions` ("Hadir x dari y sesi"), eligibility, waitlist position, `classCode` (needed for the cancellation body), sorted by first session date.
  - Session list on the admin class page: per-session state `saved | not_filled | future` plus `isToday` ("Tersimpan", "Belum diisi", "Bisa diisi mulai {tanggal}", "Hari ini").
  - Edit class: per-session `hasAttendance` (locked rows and whether the date-change confirmation dialog appears), `registeredCount` and class status (read-only mode for a Selesai class).
  - Attendance form: `everSaved` for the session (FR-18 all-checked default) and per-registration `present: boolean | null` ("Belum dicatat").
  - Class detail: `promotedAt` per registration (promotion marker).
  - Update-class response: `promotedCount` (toast "N peserta naik dari daftar tunggu").
- **Gap:** AD-7 says "Klien … memakai nilai `today` dari respons API" but does not say **which** responses carry `today`. If the server returns only `today`, every page will recompute derived state on the client, which AD-6 is meant to prevent.
- **Suggested fix:** Add a convention row, "DTO turunan": the server returns derived values already computed (`status`, `waitlistPosition`, `nextSessionDate`, `sessionState`, `isToday`, `eligibility`, `presentCount`, `hasAttendance`, `promotedCount`). Every admin and participant read response also includes `today: 'YYYY-MM-DD'`. The client never compares dates for rule purposes. List the DTOs above in `src/shared/dto.ts` as the contract.

### F4 — No way for the SPA to check the admin session or show the admin identity [Medium-High]

- **Source:** EXPERIENCE State "Belum masuk — alihkan ke Masuk, lalu kembali ke rute asal"; DESIGN Top bar "Kanan: email admin dan tombol Keluar".
- **Gap:** The cookie is `HttpOnly` (AD-9), so the client cannot read it. The spine defines only login and logout. There is no endpoint the SPA can call on boot to decide whether to redirect to `/admin/masuk`, and none that returns the admin email for the top bar. Without a convention, each page will probe some admin endpoint and treat a 401 its own way.
- **Suggested fix:** Add `GET /api/auth/session`, which returns `{ email }` or 401. One admin layout route calls it once and redirects to `/admin/masuk?next=<path>`. Restrict `next` to same-origin `/admin/*` paths to avoid an open redirect. The `src/client/api` wrapper turns any 401 from `/api/admin/*` into the same redirect with the info alert "Sesi masuk Anda berakhir. Silakan masuk lagi."

### F5 — Client-side transport error strings are not allowed for in AD-8 [Medium]

- **Source:** EXPERIENCE State "Gagal memuat / server tak terjangkau — 'Tidak dapat memuat data. Periksa koneksi lalu coba lagi.' + 'Coba lagi'"; UJ-2 "Tidak dapat menghubungi server. Coba lagi."; UJ-4 "Presensi belum tersimpan. Coba lagi."
- **Contradiction:** AD-8 says the message comes from the server and the client shows it as-is, with no free-form error strings. A network failure, or a 5xx without the envelope (proxy, crash), has no server message. The UX also uses two different wordings for the same condition ("memuat data" vs "menghubungi server").
- **Suggested fix:** In AD-8, let `src/client/api` produce a synthetic envelope with code `network_error` (and `unexpected_response` for non-JSON or 5xx bodies) whose messages come from a small client catalog. Messages tied to an action, such as "Presensi belum tersimpan. Coba lagi.", are allowed as client wording for those two codes. Ask UX to settle on one wording for the load-failure and submit-failure messages.

### F6 — The `fields` key convention for list inputs is undefined [Medium]

- **Source:** EXPERIENCE UJ-1 "dua tanggal sesi sama → 'Tanggal 9 Nov 2026 sudah ada di kelas ini' di baris tanggal tersebut"; Formulir "Error server ditampilkan di dekat kolom … ringkasan error menautkan ke setiap kolom".
- **Gap:** AD-8 defines `fields?: Record<string,string>` but not how keys address array items such as `sessionDates[2]`, or how they map to input ids for the error-summary links and `aria-describedby`.
- **Suggested fix:** Use dotted zod paths as keys (`sessionDates.2`, `quota`, `email`). Client field ids are derived from the same path (`field-sessionDates-2`). Zod schema messages in `src/shared/schemas.ts` are written in Indonesian, so client-side and server-side validation show the same text.

### F7 — In-app navigation away from unsaved changes is not covered [Medium]

- **Source:** EXPERIENCE Interaction Primitives "Peringatan perubahan belum tersimpan … dialog bawaan browser (`beforeunload`)" for Presensi sesi and Ubah kelas.
- **Gap:** `beforeunload` only fires on reload, tab close, or leaving the site. Clicking the top bar or breadcrumb inside the SPA leaves silently. A navigation blocker needs React Router's data router (`createBrowserRouter` plus `useBlocker`), and that is a routing setup decision every page inherits. The spine pins React Router 8.5.1 but does not say which router mode to use.
- **Suggested fix:** Specify in the structural seed or AD-13 that `routes.tsx` uses the data router (`createBrowserRouter`). Add one shared `useUnsavedChangesGuard` hook that combines `beforeunload` and `useBlocker`, using the shared ConfirmDialog for the in-app case. Alternatively, record that in-app navigation is unguarded in the MVP and ask UX to accept it.

### F8 — Fastify has no SPA history fallback [Medium]

- **Source:** EXPERIENCE IA deep links (`/daftar/{kode}` opened from WhatsApp, `/status`, `/admin/kelas/{id}/sesi/{tanggal}` opened directly — "Bila rute presensi dibuka langsung…").
- **Gap:** AD-1 says Fastify serves the static `vite build` output, but deep links only work if non-`/api` GETs fall back to `index.html`. Unknown `/api/*` paths must still return the JSON 404 envelope, not HTML.
- **Suggested fix:** Add to AD-1 or AD-8: a `setNotFoundHandler` returns `index.html` for GET requests outside `/api/`, and the AD-8 envelope (`code: not_found`) for `/api/*`. Add one Playwright test that loads a deep link cold.

### F9 — Idempotency of concurrent and repeated cancellations is not specified [Medium]

- **Source:** EXPERIENCE UJ-3 "Bila Sari dan admin membatalkan hampir bersamaan, keduanya melihat hasil yang sama dan tidak terjadi promosi ganda (FR-11)"; Formulir "klik ganda tidak mengirim dua kali".
- **Gap:** AD-8 makes "tidak ada pendaftaran aktif" an HTTP 200 for the public route. For an admin cancel of a registration that is already cancelled (F1), neither the result shape nor the status code is defined. "Keduanya melihat hasil yang sama" requires both callers to get the same success-shaped answer, not one success and one error.
- **Suggested fix:** Specify that cancellation is idempotent. When the target is already Dibatalkan, return 200 with `{ status: 'cancelled', alreadyCancelled: true, promotedCount: 0 }`, and never promote a second time. Add an R4 concurrency test that covers participant and admin cancelling at the same moment (AD-14 already covers R4 concurrency in general).

### F10 — No contract for reading a future or invalid attendance session [Low-Medium]

- **Source:** EXPERIENCE State "Sesi mendatang — Bila rute presensi dibuka langsung, tampil teks yang sama tanpa formulir"; "Belum ada peserta Terdaftar — Tombol Simpan disembunyikan".
- **Gap:** AD-11 covers only the write rejection (`session_not_yet_open`). It does not say whether GET `/api/admin/classes/:id/sessions/:date/attendance` for a future date returns 200 with `sessionState: 'future'` (and the date to format) or an error, or what happens for a date that is not one of the class's sessions. It also does not say what happens if the save body includes a registration that was cancelled after the form loaded (skip silently or reject).
- **Suggested fix:** GET returns 200 with `{ today, sessionState, registrations: [] }` for a future session, and 404 `session_not_found` for a date that is not a session. On save, rows for registrations that are no longer Terdaftar are rejected with `registration_not_active` and the whole transaction rolls back, so the form reloads instead of saving partial data.

### F11 — Shared component list misses the structural a11y pieces [Low-Medium]

- **Source:** EXPERIENCE Accessibility Floor: one `<h1>`, landmarks, skip link, `<title>` "{Halaman} — Kelasku", focus to `<h1>` after route change, error summary with `role="alert"`, `aria-describedby`/`aria-invalid`, checkbox names "Hadir — {nama}". Components: Alert, Tombol salin tautan (aria-live, selectable fallback URL), Pengisi tanggal sesi, Top bar, breadcrumb, `<details>` Dibatalkan.
- **Gap:** The AD-13 shared component list (Badge, ResultPanel, DataTable, ConfirmDialog, Toast, Field) has no page layout or route-focus manager, ErrorSummary, Alert, CopyLinkButton, or LoadingGate (the 300 ms "Memuat…" delay). These are the behaviors most likely to be built differently in each story and to fail axe or manual keyboard checks unevenly.
- **Suggested fix:** Add `AdminLayout` (top bar, breadcrumb, skip link, `<main>`), `ParticipantLayout`, `usePageTitleAndFocus`, `ErrorSummary`, `Alert`, `CopyLinkButton`, `SessionDateList`, and `LoadingState` to the AD-13 component list and the `components/` seed. Give a single `aria-live` region host for Toast in the layout.

### F12 — Double submit of non-idempotent admin writes is guarded on the client only [Low]

- **Source:** EXPERIENCE Formulir "Tombol submit dinonaktifkan … sehingga klik ganda tidak mengirim dua kali. Server tetap menjaga R2…"
- **Gap:** R2 protects registration on the server, and attendance is an upsert. **Buat kelas** has no server-side guard, so a request that gets through twice (retry after a timeout) creates two classes with different public codes.
- **Suggested fix:** Either accept this for the MVP and record it in Deferred, or have the client send an `Idempotency-Key` header (UUID created when the form mounts) on `POST /api/admin/classes`, with a unique `classes.creation_key` column.

### F13 — Smaller contract details [Low]

- **CSV filename** (UX example "Excel untuk Laporan Keuangan - 2026-11-30.csv"): titles may contain non-ASCII characters or `/`. Specify `Content-Disposition: attachment; filename="<ascii fallback>"; filename*=UTF-8''<encoded>` and define `<judul-aman>` (remove `\/:*?"<>|`). The CSV link is a plain GET carrying the cookie (SameSite=Lax, same origin), which works. A 401 on this link leaves the SPA, so it should redirect to `/admin/masuk` rather than download JSON.
- **Copy link "URL lengkap"** (EXPERIENCE Tombol salin tautan): decide whether the client builds the URL from `location.origin` or the server returns a `publicUrl` (this matters behind a reverse proxy, AD-Deferred HTTPS). Recommended: the client uses `location.origin + '/daftar/' + publicCode`.
- **Kelas table order** (FR-4, "Kelas Selesai … Baris berada di bawah") and **status cards** "urut menurut tanggal sesi pertama", **Sesi hari ini** "urut judul kelas": state that the server does the sorting (inside the domain/service read), not the client, so admin and e2e tests see the same order.
- **Toast on participant pages:** DESIGN gives a participant toast position ("bawah tengah (peserta)"), but EXPERIENCE uses toasts only for admin. This is an inconsistency inside the UX docs. The spine needs no change; ask UX to decide.
- **Epik 1 hides the status link** (EXPERIENCE IA): a build-time constant or route-existence check. No flag system is needed; note in the stories.
- **Out of reconcile scope, noted:** `/api/public/status` (email only) and `/api/public/cancellations` (classCode + email) are unauthenticated, so anyone who knows an email can see attendance and eligibility or cancel. This is a PRD-level decision. Architecture may want a basic rate limit on `/api/public/*` (NFR-8).

## Already reconciled (no action)

These are consistent with the UX: email never in URLs (AD-10); random stable `public_code` (AD-10); no UI library and tokens 1:1 (AD-13); Indonesian date/time formats and `Asia/Jakarta` (AD-7, AD-13, apart from where they live, F2); waitlist is a 200 result, not an error (AD-8); R2 double-click and unique-violation mapping (AD-5); reload after action with no polling (conventions: Data klien); R5 future-session lock (AD-11); integer eligibility shared by grid, status, and CSV (AD-6); axe on every IA surface (AD-14); CSV hardening (convention); promotion stamping `promoted_at` (AD-4); UI routes follow the IA table.
