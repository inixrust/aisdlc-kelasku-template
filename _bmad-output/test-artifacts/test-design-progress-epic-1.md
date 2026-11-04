---
runScope: 'epic-level'
runKey: 'epic-1'
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-11-04'
inputDocuments:
  - _bmad/tea/config.yaml
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/deferred-work.md
  - _bmad-output/test-artifacts/test-design-architecture.md
  - _bmad-output/test-artifacts/test-design-qa.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/nfr-criteria.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/playwright-cli.md
---

# Progres Test Design — Epic 1

## Step 1 — Deteksi Mode

- Mode: **Epic-Level (Phase 4)** — diminta eksplisit oleh pengguna ("epic-level test-design for Phase 4 on Epic 1").
- `epic_num`: 1 · `run_scope`: epic-level · `run_key`: epic-1
- Prasyarat: `epics.md` (epik + cerita + AC) tersedia; arsitektur `ARCHITECTURE-SPINE.md` tersedia; output system-level (`test-design-architecture.md`, `test-design-qa.md`, handoff) tersedia.
- Checkpoint `test-design-progress-epic-1.md` belum ada → run baru.

## Step 2 — Konteks

**Konfigurasi:** `tea_use_playwright_utils: true` (paket tidak terpasang → Playwright vanilla, sesuai A-6 epics), `tea_use_pactjs_utils: true` (tidak relevan: tidak ada artefak Pact; satu package), `tea_browser_automation: auto`, `test_stack_type: auto` → **fullstack** (React + Vite + Playwright, server Fastify).

**Artefak:** Epic 1 di `epics.md` (Story 1.1–1.12, FR1–FR10, NFR1–NFR9, A-1..A-14); system-level `test-design-architecture.md` + `test-design-qa.md` (R-001..R-021, P0-001..P3-007); `epic-1-context.md`; `sprint-status.yaml` (1.1–1.5 `review`, 1.6–1.12 `backlog`); `deferred-work.md`.

**Cakupan test yang sudah ada (Story 1.1–1.5):** fitness test arsitektur (HP-3) + fixture negatif; clock `*.tz.test.ts` di 3 zona; format/glossary/errors; `createDb`/`migrate`/`withWriteTx` (termasuk `database_busy` 503); harness `runConcurrently`/`repeatConcurrent` (`CONCURRENCY_REPEATS = 50`) dengan kontrol negatif dan positif; `startTestServer`; auth API (login/sesi/logout, 415, enumerasi rute admin `onRoute` = P0-008, log privacy); fetch wrapper (P2-012); token DESIGN.md; skrip `admin:create`/`seed:demo`; E2E masuk/keluar admin, smoke + axe. CI `.github/workflows/test.yml` menjalankan typecheck, Vitest, dan Playwright di setiap PR.

**Celah yang diketahui:** Chromium gagal start di mesin dev (`libnspr4`) → E2E browser hanya terverifikasi di CI; `useResource`/jeda 300 ms tidak diuji langsung; cabang baca-ulang hash password di login tidak tercakup; prompt TTY `admin:create` tidak diuji.

**Eksplorasi browser:** dilewati — Chromium tidak bisa start di mesin ini dan permukaan Story 1.6+ belum ada; analisis berbasis dokumen dan kode.

**Fragmen pengetahuan:** risk-governance, probability-impact, test-levels-framework, test-priorities-matrix, nfr-criteria (NFR1/2/3/4/7/8/9 ada di epik), playwright-cli.

## Step 3 — Risiko & NFR

Register epik: 20 risiko (4 tinggi, 9 sedang, 7 rendah). ID sistem dipertahankan dan diskor ulang untuk keadaan Epik 1; risiko baru R-022..R-028. Detail di `test-design-epic-1.md` §Penilaian Risiko.

- Tinggi (≥6): R-001 (R1 kursi terakhir, 6), R-002 (R2 aktif ganda, 6), R-022 (drift Selesai `<` vs `<=`, spine baris 87 masih `<`, 6), R-023 (E2E browser tidak bisa jalan di mesin dev, 6).
- Diskor turun karena bukti Story 1.1–1.5: R-008 6→3 (harness + kontrol negatif/positif ×50 ada), R-016 6→4 (B-2a/c selesai; B-2b menunggu 1.7), R-005 6→4 (Clock + tz test 3 zona + fitness test), R-019 4→2 (fitness test ada).
- Diskor naik: R-007 2→3 (dampak = R1 bila terjadi).
- NFR: ambang diketahui untuk NFR1 (50 ulangan, >1 koneksi, tanpa 5xx, mutation check), NFR7 smoke (<1 s pada 240 kelas), NFR4 (360 px / 1366×768). UNKNOWN: anggaran durasi suite (R-028), target coverage kode (asumsi sistem ≥80%), tingkat konkurensi beban NFR7.

## Step 4 — Rencana Coverage

- Skenario baru: P0 6 baris / 9 test (R1, R2, R7 serentak + mutation check; smoke UJ-1+UJ-2), P1 28, P2 17, P3 6 → **60 test**; P0-008 (Story 1.4) dipakai ulang sebagai regresi.
- ID test: `{epik}.{story}-{LEVEL}-{seq}` (test-levels-framework), dengan rujukan silang ke ID sistem (P0-001 dst.).
- Eksekusi: semua di PR (CI `test.yml`), termasuk 50 ulangan konkurensi per run (FR8); tanpa nightly; manual sebelum menutup epik.
- Estimasi: P0 ~12–20 j, P1 ~22–38 j, P2 ~8–16 j, P3 ~2–5 j; total ~44–79 j (≈1–2 minggu satu orang; ≈2–4 hari dibagi 3 dev).
- Gate: P0 100% (50/50 ulangan), P1 ≥95%, mutation check merah terhadap mutan, R-022 tertutup, E2E hijau di CI.

## Step 5 — Output

- Mode eksekusi: sequential (epic-level = satu dokumen, satu worker).
- Output: `_bmad-output/test-artifacts/test-design-epic-1.md` (template `test-design-template.md`, plus bagian "Panduan untuk ATDD dan Automate").
- Validasi checklist: semua risiko punya ID unik, kategori, P/I 1–3, skor = P×I; setiap risiko punya ≥1 baris coverage dengan Risk ID persis; prioritas tanpa konteks eksekusi; strategi eksekusi PR/Nightly/Weekly sederhana; estimasi berupa rentang; gate P0 100% / P1 ≥95%; ambang NFR yang tidak diketahui ditandai UNKNOWN. Tidak ada sesi CLI browser yang dibuka (eksplorasi dilewati), jadi tidak ada sesi yatim.
- Handoff BMAD: tidak dibuat (hanya untuk mode sistem).
- Asumsi terbuka: seam mutation check lewat tx-step; target coverage ≥80% belum dikonfirmasi; anggaran durasi suite UNKNOWN; Playwright vanilla (A-6).
