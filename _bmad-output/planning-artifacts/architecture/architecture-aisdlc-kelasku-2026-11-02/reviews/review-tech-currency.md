---
review: tech-currency
target: ARCHITECTURE-SPINE.md (Stack table + AD-1..AD-14) and .memlog.md (version entries)
reviewed: 2026-11-02
method: live npm registry (`npm view ... --json`, `npm pack`), nodejs.org/dist/index.json, nodejs/Release schedule.json, Node API docs (latest-v22/v24/v26 sqlite.html), GitHub releases API, CVE.org / NVD. Then a scratch install of the full set (`npm i --ignore-scripts`) in /tmp, with the AD APIs run on local Node v24.18.0 / npm 11.16.0.
verdict: PASS WITH MINOR FIXES
---

# Review: Tech Currency

## Verdict

**PASS WITH MINOR FIXES.** Every named technology exists, fits the constraints, and installs with no peer or engine conflict on Node 24. Every API that the ADs rely on exists and works at the pinned versions. The memlog shows a registry check made earlier the same day. Since then, two patch releases have come out. The Node "24 LTS" label is now imprecise, because Node 24 entered Maintenance on 2026-10-20. The Stack table also leaves out the `@types/*` packages that a TypeScript build needs, and better-sqlite3 13 ships no type definitions of its own.

## Findings that need action

| # | Severity | Item | Spine says | Live reality | Fix |
| --- | --- | --- | --- | --- | --- |
| F1 | low | @vitejs/plugin-react | 6.1.2 | latest **6.2.1**. 6.2.0 was published 2026-11-02T07:47Z and 6.2.1 at 09:18Z, which is after the spine was written. The peer range is still `vite ^8.0.0`. | Bump to 6.2.1, or keep 6.1.2 on purpose. 6.1.2 installs cleanly with vite 8.3.5. |
| F2 | low | Fastify | 5.12.7 | latest **5.12.8**, published 2026-11-02T10:46Z | Bump to 5.12.8. This is a patch release with no API impact. |
| F3 | low | Node.js "24 LTS" | runtime target 24 LTS | Per the nodejs/Release schedule, v24 Krypton has been **Maintenance LTS since 2026-10-20** (EOL 2028-04-30). v26 Lithium has been **Active LTS since 2026-10-28** (EOL 2029-04-30). The latest 24.x is **24.22.2** (2026-10-27). | Name the status precisely: "Node 24 (Maintenance LTS, EOL 2028-04)". Pin `.nvmrc` to 24.22.2 or later. The team's local **24.18.0 is 4 minors behind** and falls in the affected range of CVE-2026-58041 (≤24.18.0). That CVE does not touch this design because `node:sqlite` is not used, but there is no reason to stay on 24.18.0. Optionally note that 26 is the Active LTS. |
| F4 | medium | Type packages missing from Stack | (absent) | `better-sqlite3@13.0.3` ships **no `.d.ts`** (checked in the tarball). Types come from `@types/better-sqlite3` **9.6.0**, which declares `Transaction.immediate()` and `backup(): Promise<BackupMetadata>`, both used by AD-3 and the backup step. Under TS 6 the build also needs `@types/react` **19.3.0**, `@types/react-dom` **19.3.0**, and `@types/node`. react-router 8.5.1 declares `@types/react >=19.2.0` as an optional peer. | Add the four `@types/*` rows to the Stack table so builders don't each pick different versions. Use the `@types/node` major that matches the Node target (`^24`), not latest 26.6.6. |

## Per-item verification: Stack table

| Item | Spine | Registry latest (2026-11-02) | Engines / peers | Status |
| --- | --- | --- | --- | --- |
| Node.js | 24 LTS, engines `>=22.22.0` | 24.22.2 (Krypton, Maintenance); 26.13.0 (Lithium, Active); 22.23.4 (Jod, Maintenance) | The `>=22.22.0` floor matches react-router 8.5.1 `engines.node >=22.22.0`. | **verified with F3** |
| npm | 11.x | latest 12.2.1. Node 24.22.2 bundles npm **11.19.1** and Node 26.13.0 bundles 11.20.0 (dist/index.json). | npm 12 requires node `^22.22.2 \|\| ^24.15.0 \|\| >=26`. "11.x" equals the npm bundled with the target Node. Note that Node 22.23.4 bundles npm 10.9.9, so a dev on the Node 22 floor gets npm 10. | **verified** (add a note that npm 11 is the version bundled with Node 24) |
| TypeScript | 6.0.3 | latest 7.0.2 (2026-07-08); 6.0.3 published 2026-04-16 and not deprecated | The 7.0.2 `exports` expose only `./unstable/{sync,async,ast,...}` APIs, and the `beta` tag is 7.1.0-beta. This confirms the memlog claim that the programmatic API is not stable until 7.1. | **verified** (choosing 6 over latest 7 is a deliberate, evidenced decision) |
| React / react-dom | 19.3.1 | 19.3.1 | react-dom peer `react ^19.3.1` | **verified** |
| Vite | 8.3.5 | 8.3.5 | node `^20.19.0 \|\| >=22.12.0`, matching the memlog | **verified** |
| @vitejs/plugin-react | 6.1.2 | **6.2.1** | 6.1.2 peer `vite ^8.0.0`, node `^20.19 \|\| >=22.12` | **mismatch (F1)**. Compatible, but not current. |
| React Router | 8.5.1 | 8.5.1 | node `>=22.22.0`; peers `react/react-dom >=19.2.7` (satisfied by 19.3.1) | **verified** |
| Fastify | 5.12.7 | **5.12.8** | — | **mismatch (F2)** |
| @fastify/static | 10.1.8 | 10.1.8 | `fastify-plugin` metadata `fastify: '5.x'` (index.js) | **verified** |
| @fastify/cookie | 11.1.5 | 11.1.5 | `fastify-plugin` metadata `fastify: '5.x'` (index.js) | **verified** |
| better-sqlite3 | 13.0.3 | 13.0.3 (2026-08-05) | node `>=22`; depends on `node-addon-api ^8` (N-API, ABI-stable). The tarball bundles `prebuilds/{linux,linuxmusl,darwin,win32}-{x64,arm64}.node`, has no install script, and has `gypfile:false`. One N-API binary per platform covers Node 22, 24, and 26 with no compile step. GitHub releases carry no assets because the prebuilds are inside the npm tarball. | **verified** (also loaded and ran on Node 24.18.0) |
| zod | 4.6.7 | 4.6.7 (2026-10-12) | none | **verified**. The v4 top-level `z.email()` exists. |
| tsx | 4.23.15 | 4.23.15 | node `>=18`; depends on `esbuild ~0.28.0`. tsx strips types through esbuild and does not depend on the `typescript` package, so it works alongside TS 6. | **verified** |
| Vitest | 5.0.5 | 5.0.5 | peer `vite ^6.4 \|\| ^7 \|\| ^8`; node `^22.12 \|\| ^24 \|\| >=26` | **verified** |
| @playwright/test | 1.64.1 | 1.64.1 | node `>=20` | **verified** |
| @axe-core/playwright | 4.14.0 | 4.14.0 | node `>=22.12.0`; peer `playwright-core >=1.0.0` | **verified** |

Cross-set install check: `npm i` of the exact pinned set (better-sqlite3 13.0.3, fastify 5.12.7, @fastify/static 10.1.8, @fastify/cookie 11.1.5, react/react-dom 19.3.1, react-router 8.5.1, vite 8.3.5, @vitejs/plugin-react 6.1.2, vitest 5.0.5, zod 4.6.7, tsx 4.23.15, typescript 6.0.3) added 119 packages. It produced no peer warnings, and `npm ls` reported no invalid or unmet entries.

## Per-item verification: APIs the ADs rely on

| AD | API / claim | Evidence | Status |
| --- | --- | --- | --- |
| AD-3 | better-sqlite3 `db.transaction(fn).immediate()` → `BEGIN IMMEDIATE` | `lib/methods/transaction.js` defines `immediate` with `begin: db.prepare('BEGIN IMMEDIATE')`. At runtime `typeof tx.immediate === 'function'` and the insert committed. | **verified** |
| AD-1 | PRAGMAs `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000` through `db.pragma()` | Ran without error | **verified** |
| AD-5 | Unique violation surfaces as `SQLITE_CONSTRAINT_UNIQUE` | A partial unique index plus a duplicate insert gave `e.code === 'SQLITE_CONSTRAINT_UNIQUE'` | **verified** |
| Deferred / backup | `db.backup(file)` | `lib/methods/backup.js` defines an **async** function that returns a Promise. A runtime backup file was created. The backup script must `await` it. | **verified** (implementation note: the call is async) |
| AD-14 | Fastify `inject()` | `app.inject({method:'GET',url:'/api/x'})` returned 200 with the JSON body, with cookie and static plugins registered on 5.12.7 | **verified** |
| Config convention | `node --env-file-if-exists=.env` | On Node 24.18.0 an existing file loaded the variables. A missing file printed "not found. Continuing without it." and ran normally. The flag was added in Node 22.9, below the `>=22.22.0` floor. | **verified** |
| AD-7 / AD-13 | `Intl.DateTimeFormat` with `timeZone:'Asia/Jakarta'` | `2026-11-02T18:30Z` became `2026-11-03` (en-CA, YYYY-MM-DD). id-ID formatting gave "Senin, 9 Nov 2026" and "9 Nov 2026, 14.32 WIB", which exactly match the AD-13 sample strings. | **verified** |
| memlog frontend | React Router 8 declarative/library mode | The shipped `docs/start/modes.md` lists three modes (framework, data, **declarative**) and `docs/start/declarative/*` exists. The `BrowserRouter`, `Routes`, `Route`, `Link`, and `useNavigate` exports are all present in 8.5.1. | **verified** |
| AD-8 / logging | Fastify built-in pino | fastify 5.12.x depends on `pino ^9.14.0 \|\| ^10.1.0` | **verified** |
| AD-9 | `node:crypto` `scrypt`, `randomBytes` | Stable core APIs (no version risk) | **verified** (not run) |
| AD-14 | `worker_threads` with two better-sqlite3 connections | N-API addon, documented as worker-safe. Not executed in this review. | **unverifiable here** (low risk; the first concurrency test will prove it) |

## Memlog claim: node:sqlite

Memlog: "node:sqlite (RC, ada CVE-2026-58041, belum stabil di 22)", meaning RC, has CVE-2026-58041, and not stable on 22.

- Stability: the Node docs show **Stability 1.1 (Active development)** on latest-v22.x and **Stability 1.2 (Release candidate)** on latest-v24.x and latest-v26.x. The claim is **verified**. It is RC on 24 and 26, and less mature on 22.
- CVE-2026-58041: **verified** on CVE.org and NVD (published 2026-08-04, assigner HackerOne). A stale `StatementSyncIterator` from `DatabaseSync#createTagStore()` keeps running a reset or rebound statement. Affected: Node ≤22.23.1, ≤24.18.0, ≤26.5.0. Current releases (22.23.4, 24.22.2, 26.13.0) are past the affected range, so the CVE is fixed in current lines. It is still a fair reason to prefer better-sqlite3, but "has a CVE" should read "had a CVE, since patched".

## Other observations (outside the version lens, noted only)

- The memlog places migrations at `src/server/db/migrations`. The spine (AD-12, Pohon sumber) uses `src/server/data/migrations/`. The spine is authoritative, but the memlog is inconsistent with it.
- The memlog Node entry ("26 = Active LTS, ... Runtime target Node 24 LTS") is accurate. The spine Stack row drops the "Maintenance" qualifier (F3).

## Recommended corrected Stack rows

| Name | Version |
| --- | --- |
| Node.js (runtime target; `engines` `>=22.22.0`) | 24.x Maintenance LTS (≥24.22.2; EOL 2028-04-30). 26 is Active LTS. |
| npm | 11.x (bundled with Node 24) |
| @vitejs/plugin-react | 6.2.1 |
| Fastify | 5.12.8 |
| @types/better-sqlite3 | 9.6.0 |
| @types/react / @types/react-dom | 19.3.0 |
| @types/node | ^24 (match the runtime target) |
