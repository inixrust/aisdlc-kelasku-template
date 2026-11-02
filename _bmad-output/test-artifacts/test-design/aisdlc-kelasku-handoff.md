---
title: 'TEA Test Design → BMAD Handoff Document'
version: '1.0'
workflowType: 'testarch-test-design-handoff'
inputDocuments:
  - _bmad-output/test-artifacts/test-design-architecture.md
  - _bmad-output/test-artifacts/test-design-qa.md
sourceWorkflow: 'testarch-test-design'
generatedBy: 'TEA Master Test Architect'
generatedAt: '2026-11-02'
projectName: 'aisdlc-kelasku'
---

# TEA → BMAD Integration Handoff — Kelasku

## Tujuan

Menjembatani test design level sistem dengan `bmad-create-epics-and-stories`, supaya risiko, gate, dan skenario kritis masuk ke epik dan acceptance criteria story.

## Inventaris Artefak TEA

| Artefak | Path | Titik integrasi BMAD |
| --- | --- | --- |
| Test design arsitektur | `_bmad-output/test-artifacts/test-design-architecture.md` | Blocker Sprint 0, risiko per epik |
| Test design QA | `_bmad-output/test-artifacts/test-design-qa.md` | AC story, test ID P0–P3 |
| Risk assessment | (di dokumen arsitektur) | Klasifikasi risiko epik, prioritas story |
| Coverage strategy | (di dokumen QA) | Kebutuhan test per story |

## Panduan Level Epik

### Referensi risiko

- **Story Sprint 0 / enabler (sebelum Epik 1):** B-1 (`createDb`/`createServices` injeksi clock), B-2 (clock beku, seed + kelas Selesai, admin seed dari `.env`), HP-2 (registri `code → httpStatus`), HP-3 (fitness test arsitektur), harness konkurensi + kontrol negatif. Menutup R-005, R-008, R-016, R-019.
- **Epik 1 — Kelas & Pendaftaran Berkuota (FR-1..FR-10; R1–R3, R7):** R-001, R-002 (tinggi); R-004, R-007, R-009, R-010, R-011 (sedang/rendah).
- **Epik pembatalan & promosi (FR-11..FR-13; R4):** R-003 (tinggi); R-009, R-013.
- **Epik status peserta (FR-14):** R-006, R-013.
- **Epik presensi (FR-15..FR-18; R5):** R-005 (tinggi); R-021.
- **Epik kelayakan & rekap (FR-19..FR-22; R6):** R-006, R-012, R-018, R-014.
- **Lintas epik (NFR-3/4/7):** R-017, R-014, R-015.

### Quality gate per epik

- P0 epik lulus 100%; burn-in konkurensi ×20 hijau untuk epik yang menyentuh R1/R2/R4/R7.
- P1 epik ≥95%; setiap aturan R yang dicakup punya test dengan ID di nama `describe`/`it`.
- Risiko skor ≥6 milik epik bermitigasi dan terverifikasi.
- `npm test`, `npm run test:e2e`, `npm run typecheck` hijau sebelum commit (AGENTS.md).

## Panduan Level Story

### Skenario P0/P1 → acceptance criteria

| Story (usulan) | AC wajib (test ID) |
| --- | --- |
| Admin masuk/keluar (FR-1) | Semua `/api/admin/*` tanpa sesi → 401 (P0-008); pesan kredensial generik, cookie aman, logout mencabut sesi (P1-021, P1-022) |
| Buat kelas (FR-2) | Validasi tanggal/judul/kuota dengan pesan Indonesia di dekat kolom (P1-003, P1-004) |
| Ubah kelas + R7 (FR-3) | "Kuota minimal N" (P1-001); kuota naik mempromosikan kepala antrean (P1-002); diff tanggal + `confirmation_required` (P1-005..P1-007); Selesai hanya judul (P1-008); konkurensi turun kuota (P0-005) |
| Tabel & halaman kelas admin (FR-4, FR-5) | Urutan + terisi/kuota + "Penuh" teks+ikon (P1-010, P2-007) |
| Tautan pendaftaran (FR-6) | `publicCode` stabil, id internal tidak bocor (P1-011) |
| Pendaftaran mandiri + R1/R2/R3 (FR-7..FR-10) | 20 paralel → 5/15 (P0-001); duplikat bersamaan → 1 baris (P0-002); FIFO dan posisi konsisten (P1-014); kelas Selesai ditutup (P1-018); klik ganda di 360 px (P1-025); smoke UJ-1+UJ-2 (P0-009) |
| Pembatalan & promosi (FR-11..FR-13) | Konkurensi batal (P0-003, P0-004); batal idempoten (P1-028); `registrationRef` + email (P1-029); UJ-3 (P1-032) |
| Status peserta (FR-14) | P1-033, P1-034 |
| Presensi + R5 (FR-15, FR-16) | 23.30/06.00 WIB (P0-006); `roster_changed` (P1-036); "belum dicatat" (P1-038) |
| Kelayakan + rekap + CSV (FR-19, FR-21, FR-22) | Tabel ambang R6 (P0-007); konsistensi antar-permukaan (P1-042); keamanan dan format CSV (P1-043, P1-044); UJ-4 (P1-045) |

### Kebutuhan `data-testid`

Utamakan `getByRole`/`getByLabel` dengan teks Indonesia. `data-testid` hanya untuk elemen tabel yang tidak punya nama aksesibel unik:

- `class-row-{publicCode}` (tabel kelas admin)
- `registration-row-{registrationId}` (halaman kelas admin, bagian Terdaftar/Daftar tunggu/Dibatalkan)
- `attendance-row-{registrationId}` (formulir presensi)
- `recap-cell-{registrationId}-{YYYY-MM-DD}` dan `recap-eligibility-{registrationId}` (grid rekap)

## Pemetaan Risiko → Story

| Risk ID | Kategori | P×I | Story/Epik yang disarankan | Level test |
| --- | --- | --- | --- | --- |
| R-001 | DATA | 2×3=6 | Epik 1 — pendaftaran mandiri | Integrasi (worker), E2E smoke |
| R-002 | DATA | 2×3=6 | Epik 1 — pendaftaran mandiri | Integrasi (worker), Unit, API |
| R-003 | DATA | 2×3=6 | Epik pembatalan — batal + promosi | Integrasi (worker), E2E |
| R-005 | BUS | 3×2=6 | Sprint 0 (clock) + Epik presensi | Unit, API, E2E |
| R-008 | TECH | 2×3=6 | Sprint 0 — harness konkurensi | Integrasi |
| R-016 | OPS | 3×2=6 | Sprint 0 — seed & config E2E | E2E |
| R-004 | BUS | 2×2=4 | Epik 1 — ubah kuota, pendaftaran | Unit, Integrasi |
| R-009 | DATA | 2×2=4 | Epik 1 + epik pembatalan | Unit, Integrasi, API |
| R-010 | DATA | 2×2=4 | Epik 1 — ubah kelas | Unit, Integrasi, API |
| R-012 | SEC | 2×2=4 | Epik rekap — CSV | Unit, E2E |
| R-013 | SEC | 2×2=4 | Epik pembatalan / status (diterima) | API |
| R-014 | PERF | 2×2=4 | Story enabler pra-rilis (`seed:perf`) | Skrip kinerja, Integrasi |
| R-017 | BUS | 2×2=4 | Semua story UI (DoD) | E2E, manual |
| R-019 | TECH | 2×2=4 | Sprint 0 — fitness test | Unit (statis) |
| R-021 | DATA | 2×2=4 | Epik presensi | Integrasi |
| R-006 | BUS | 1×3=3 | Epik kelayakan & rekap | Unit, Integrasi |
| R-007 | DATA | 1×2=2 | Epik 1 — ubah kuota | Integrasi (worker) |
| R-011 | SEC | 1×2=2 | Epik 1 — masuk admin | API |
| R-015 | OPS | 1×2=2 | Sprint 0 (migrasi) + pra-go-live (backup) | Integrasi, manual |
| R-018 | BUS | 1×2=2 | Epik rekap | Unit, API, manual |
| R-020 | OPS | 1×2=2 | Sprint 0 — `withWriteTx` | Integrasi, skrip kinerja |

## Urutan Workflow BMAD → TEA yang Disarankan

1. **TEA Test Design** (`TD`) → menghasilkan dokumen ini
2. **BMAD Create Epics & Stories** → memakai handoff ini dan menanamkan kebutuhan kualitas (termasuk story enabler Sprint 0)
3. **TEA Framework** (`TF`) → scaffolding Vitest/Playwright sesuai setup Sprint 0
4. **TEA ATDD** (`AT`) → acceptance test per story (mulai dari P0 Epik 1)
5. **BMAD Implementation** → implementasi dengan panduan test-first
6. **TEA Automate** (`TA`) → melengkapi suite
7. **TEA Trace** (`TR`) → memvalidasi kelengkapan coverage

## Gate Transisi Fase

| Dari fase | Ke fase | Kriteria gate |
| --- | --- | --- |
| Test Design | Epic/Story Creation | Semua risiko ≥6 punya strategi mitigasi (terpenuhi); B-1/B-2 masuk sebagai story Sprint 0 |
| Epic/Story Creation | ATDD | Story memuat AC dari tabel di atas |
| ATDD | Implementation | Test acceptance yang gagal (red) ada untuk semua skenario P0/P1 story |
| Implementation | Test Automation | Semua test acceptance lulus; burn-in konkurensi hijau |
| Test Automation | Release | Trace ≥80% coverage kebutuhan P0/P1; bukti NFR terkumpul untuk `bmad-testarch-nfr` |
