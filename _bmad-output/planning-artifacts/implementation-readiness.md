---
date: 2026-11-03
skill: bmad-sprint-planning
verdict: CONCERNS
decision: lanjut (dry run; asumsi dicatat di bawah)
status_file: _bmad-output/implementation-artifacts/sprint-status.yaml
---

# Kesiapan Implementasi — Kelasku

## Inventaris

| Artefak | Lokasi |
|---|---|
| Intent (dibekukan) | `docs/intent-kelasku.md` |
| Brief, riset kompetitif | `planning-artifacts/briefs/…`, `planning-artifacts/research/…` |
| PRD (revisi 2026-11-03) + validasi | `planning-artifacts/prds/prd-aisdlc-kelasku-2026-11-02/` |
| UX: DESIGN.md + EXPERIENCE.md (2026-11-02) | `planning-artifacts/ux-designs/ux-aisdlc-kelasku-2026-11-02/` |
| Architecture Spine AD-1..AD-20 (2026-11-02) | `planning-artifacts/architecture/architecture-aisdlc-kelasku-2026-11-02/` |
| Test design sistem + handoff | `_bmad-output/test-artifacts/` |
| Epik & story (4 epik, 29 story) | `planning-artifacts/epics.md` |

## Yang lulus

- R1–R7 dan FR1–FR22 ter-trace ke story (FR Coverage Map); tidak ada story tanpa requirement asal.
- Non-goal intent (pembayaran, SSO, notifikasi, multi-tenant, PDF, ujian) tidak muncul di story mana pun.
- Epik memberi nilai pengguna, berurutan tanpa ketergantungan maju; story fondasi (1.1–1.3) mendahului story yang memakainya.
- Keputusan arsitektur dan UX yang dibutuhkan story tercatat di spine/UX, atau di asumsi A-1..A-14 epics.md.

## Concerns

1. **Drift PRD revisi vs spine/UX (epics A-9), belum diselesaikan di hulu.** Spine dan UX lebih tua dari PRD revisi 2026-11-03. Konflik yang diketahui:
   - Spine AD-6 `max(session_date) < today` vs epics/PRD `<=`. Berdampak **mulai Story 1.6** (Epik 1), bukan hanya 3.3/4.7 seperti tertulis di A-9.
   - DESIGN.md/EXPERIENCE.md "checkbox Hadir" vs kontrol radio tiga keadaan (Story 3.3).
   - EXPERIENCE.md "tanpa paginasi sampai 50 baris" vs tampilan bawaan 30 hari (Story 1.9).
   - Handoff test design "burn-in ×20" vs 50 ulangan per run CI (Story 1.3).
   - Spine "HTTPS bergantung jaringan lembaga" vs HTTPS wajib di produksi (Story 4.7).

   Risikonya: AGENTS.md menyatakan AD-1..AD-20 mengikat, jadi agen pengembang yang membaca spine bisa memilih `<`. Perbaikannya: `bmad-correct-course`, atau mode update `bmad-architecture` dan `bmad-ux`.
2. **A-7 belum dikonfirmasi PM/Rina.** Aturan "Selesai sejak 00.00 WIB pada tanggal sesi terakhir" menutup pendaftaran sepanjang hari kelas satu sesi.
3. **A-10 (reverse proxy TLS) belum masuk spine.** Perlu dikonfirmasi sebelum Story 4.7.

## Asumsi yang diambil (dry run)

- AS-1: Concerns di atas **tidak memblokir** sprint planning. Hingga spine/UX diperbarui, untuk butir drift A-9 **epics.md + PRD revisi menang**; untuk hal lain spine tetap mengikat. Ini opsi paling sederhana yang konsisten dengan intent (R1–R7 tidak berubah).
- AS-2: Pembaruan spine (AD-6 `<=`, HTTPS/A-10) dilakukan **sebelum Story 1.6** di-build, bukan sebelum 3.3 seperti disebut A-9. Pembaruan UX (radio presensi, paginasi) sebelum Story 1.9 dan 3.3.
- AS-3: A-7 dipakai apa adanya sampai Rina menolaknya; perubahan lewat `bmad-correct-course`.
- AS-4: Satu berkas `epics.md` adalah sumber epik (tidak ada versi sharded). Kunci story untuk "(SHOULD)" memuat kata `should` (mis. `3-5-should-…`).
- AS-5: Semua status awal `backlog`; belum ada berkas story di `implementation-artifacts/`.
