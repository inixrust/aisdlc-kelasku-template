<!-- bmad:context -->
<!-- Diverifikasi 2026-11-02 terhadap c5b110a. Dikelola oleh bmad-project-context; isi di dalam block ini diganti saat refresh. Simpan apa pun yang ingin dipertahankan di luar penanda. -->

## Kelasku

Aplikasi web pendaftaran dan kehadiran kelas pelatihan. Stack wajib: TypeScript, Node.js ≥ 22, React + Vite, HTTP API Node.js, SQLite berkas lokal, Vitest + Playwright, satu repositori. Belum ada kode. Intent produk ada di `docs/intent-kelasku.md`, artefak perencanaan BMad di `_bmad-output/planning-artifacts/`.

## Kebijakan

- Semua perubahan masuk ke `main` lewat pull request; jangan push langsung ke `main`.
- Pesan commit wajib Conventional Commits berbahasa Inggris, mis. `feat: promote waitlist on cancellation`.
- Jangan pernah commit berkas `.env` atau kredensial; simpan nilai rahasia hanya di `.env` lokal.
- Jalankan seluruh test dan pastikan hijau sebelum commit.
- Jangan ubah `_bmad/` atau `.claude/skills/` secara langsung; kustomisasi BMad hanya lewat `_bmad/custom/`.
- Jangan ubah `docs/intent-kelasku.md` karena sudah dibekukan; perubahan requirement lewat dokumen perencanaan BMad di `_bmad-output/planning-artifacts/`.
- Jangan tambahkan layanan cloud (DB, hosting, auth eksternal); data hanya di berkas SQLite lokal.
- Teks antarmuka berbahasa Indonesia; identifier kode dan nama berkas berbahasa Inggris.
- Jangan bangun fitur non-goal MVP (pembayaran, SSO, notifikasi, multi-tenant, PDF sertifikat, ujian); daftarnya di `docs/intent-kelasku.md`.

## Letak sesuatu

- Aturan bisnis R1–R7 dan non-goals: `docs/intent-kelasku.md`.
- Package manager, cara akses SQLite, dan struktur repo belum diputuskan. Putuskan lewat skill `bmad-architecture` sebelum menulis kode, jangan memilih sendiri.

## Menjalankan dan memverifikasi

- TODO (refresh setelah `bmad-architecture`): perintah dev, test Vitest, dan e2e Playwright belum ada. Baca `package.json` setelah dibuat, jangan menebak perintahnya.

## Konvensi yang berbeda dari default

- Setiap test aturan bisnis menyebut ID aturannya di nama `describe`/`it`, mis. `it('R3: waitlist is FIFO by registration time')`.
- R1, R2, dan R4 dijaga di lapisan data dalam satu transaksi (cek kuota + insert; batal + promosi daftar tunggu). Validasi di UI atau handler saja masih meloloskan dua pendaftaran yang bersamaan.
- "Hari ini" untuk R5 dan tanggal sesi dihitung di zona Asia/Jakarta, bukan UTC atau zona server.
- R6 dihitung dengan bilangan bulat: layak bila `hadir * 5 >= totalSesi * 4` (4 sesi → 4 hadir, 5 sesi → 4 hadir). Jangan pakai `0.8 * n`, karena `0.8 * 3` menghasilkan `2.4000000000000004`.

<!-- /bmad:context -->
