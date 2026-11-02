---
runScope: 'system-level'
runKey: 'system'
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-11-02'
inputDocuments:
  - docs/intent-kelasku.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/prd.md
  - _bmad-output/planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/ARCHITECTURE-SPINE.md
  - _bmad/tea/config.yaml
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/adr-quality-readiness-checklist.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/nfr-criteria.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/test-quality.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/playwright-cli.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/playwright-utils-mandate.md
  - .claude/skills/bmad-testarch-test-design/resources/knowledge/library-integration-mandate.md
---

# Progres Test Design — level sistem (Kelasku)

## Langkah 1 — Mode

- Mode: **System-Level (Phase 3)**. Alasan: permintaan eksplisit pengguna; PRD + Architecture Spine (AD-1..AD-20 berfungsi sebagai ADR) tersedia; belum ada epik/story maupun `sprint-status.yaml`.
- `run_scope = system-level`, `run_key = system`. Tidak ada checkpoint sebelumnya.

## Langkah 2 — Konteks

- Config: `tea_use_playwright_utils: true`, `tea_use_pactjs_utils: true`, `tea_pact_mcp: none`, `tea_browser_automation: auto`, `test_stack_type: auto`.
- Stack terdeteksi: belum ada kode (`package.json` belum ada). Dari spine: **fullstack** (React+Vite SPA + Fastify + better-sqlite3), Vitest + Playwright + @axe-core/playwright.
- Gate kedua mandat playwright-utils (paket terpasang) **belum terpenuhi** — paket tidak ada di stack spine. Dicatat sebagai keputusan tim (lihat arsitektur ⚠️ HP-4). Contoh kode tetap ditulis dengan gaya playwright-utils sesuai flag.
- Contract testing: **tidak relevan** (satu proses, satu package, tidak ada artefak Pact) → fragmen Pact tidak dimuat.
- Browser exploration: dilewati — belum ada aplikasi yang berjalan.
- Epik: belum ada dokumen epik; cakupan epik diambil dari PRD §7.1 (Epik 1 = FR-1..FR-10, R1–R3, R7).

## Langkah 3 — Testability & risiko (ringkas)

- Concerns utama: harness konkurensi multi-koneksi (B-1), semantik clock palsu + seed E2E + kredensial admin seed (B-2), pemetaan kode error → status HTTP belum ditabulasi, data/metode uji NFR-7 belum ada, lint ditunda sehingga aturan lapisan tidak dijaga otomatis.
- 21 risiko; 6 tinggi (skor 6): R-001, R-002, R-003, R-005, R-008, R-016. Tidak ada skor 9.
- Detail di `test-design-architecture.md`.

## Langkah 4 — Coverage (ringkas)

- ~88 skenario: P0 ~9, P1 ~50, P2 ~22, P3 ~7. Level: Unit, Integrasi (service + SQLite nyata), API (`fastify.inject`), E2E (Playwright). Tidak ada level Component (tidak ada alat di stack).
- Detail di `test-design-qa.md`.

## Langkah 5 — Output & validasi

- Mode eksekusi: **sequential** (tidak ada permintaan subagent; dua dokumen ditulis lalu direkonsiliasi).
- Output:
  - `_bmad-output/test-artifacts/test-design-architecture.md`
  - `_bmad-output/test-artifacts/test-design-qa.md`
  - `_bmad-output/test-artifacts/test-design/aisdlc-kelasku-handoff.md`
- Validasi `checklist.md`: struktur dua dokumen, konsistensi ID risiko/prioritas, estimasi dalam rentang, eksekusi PR/pra-rilis/manual, contoh kode sesuai mandat playwright-utils (impor `test` dari merged fixtures, `expect` dari `@playwright/test`). Catatan: dokumen arsitektur ±280 baris, di atas target 150–200, karena tabel risiko dan NFR lengkap.
- Tidak ada sesi CLI browser yang dibuka.
- Asumsi terbuka: konkurensi NFR-7 (berurutan + ledakan 20), RTO/RPO, target coverage ≥80% domain+services, burn-in ×20, keputusan HP-4 (playwright-utils).
