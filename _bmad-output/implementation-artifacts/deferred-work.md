# Pekerjaan Tertunda

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-1-kerangka-repositori-yang-bisa-dijalankan-dan-diuji.md`
  summary: Perbarui AGENTS.md (lewat bmad-project-context refresh) karena `package.json`/`.nvmrc` sudah ada dan skrip `admin:create`, `seed:demo`, `backup` belum dibuat.
  evidence: Bagian "Menjalankan dan memverifikasi" di AGENTS.md masih berisi TODO pra-scaffolding dan deskripsi "Belum ada kode", padahal Story 1.1 menambah kode dan skrip.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/test-artifacts/framework-setup-progress.md`
  summary: Lanjutan setup kerangka test. (1) Story 1.3 menaruh helper DB/konkurensi di `test/helpers/` di atas `createTempDir`. (2) Story yang membuat `seed:demo` mengganti `webServer.command` di `playwright.config.ts` dan menambah `DATABASE_PATH` e2e (TODO di berkas itu). (3) Story 1.4/1.5 menambah fixture `adminLogin` di `e2e/support/fixtures.ts`. (4) Keputusan HP-4 (playwright-utils) lewat `bmad-architecture`. (5) Hook TEA `tea-enforce.cjs` belum terpasang karena izin menulis `.claude/`. (6) AGENTS.md "Letak sesuatu" belum menyebut `test/helpers/`, `test/README.md`, dan project Vitest `unit`/`integration`; masukkan saat refresh bmad-project-context.
  evidence: Hasil `bmad-testarch-framework` 2026-11-03; lihat tabel penyimpangan dan §Hook di dokumen sumber.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-3-fondasi-data-koneksi-sqlite-migrasi-transaksi-tulis-dan-harness-konkurensi.md`
  summary: Error yang bukan `AppError` (throw tak terduga → 500, JSON rusak → 400, content-type salah → 415) harus dipetakan ke envelope AD-8, termasuk kode registri baru `internal_error` (500) di `src/shared/errors.ts`, beserta test jalur fallback di `src/server/http/app.test.ts`; kerjakan paling lambat di story 1.4 (rute `/api/*` pertama).
  evidence: `src/server/http/app.ts` meneruskan non-`AppError` ke `reply.send(error)`, sehingga Fastify menjawab `{ statusCode, error, message }` dan 500 membocorkan `message` mentah (mis. teks SQL); AD-8 mewajibkan error selalu ber-envelope. Perilaku ini sudah ada sejak story 1.1, bukan disebabkan story 1.3.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-4-api-masuk-dan-keluar-admin.md`
  summary: Perbarui ARCHITECTURE-SPINE §Konfigurasi lewat `bmad-architecture` agar memuat `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (khusus `seed:demo`) dan kredensial admin e2e tetap di `e2e/support/admin.ts`.
  evidence: Spine hanya mencantumkan PORT, DATABASE_PATH, COOKIE_SECURE, NODE_ENV, KELASKU_FAKE_NOW dan menyatakan kredensial admin tidak disimpan di repositori; Story 1.4 menambah keduanya (bukan rahasia, DB e2e dibuang).

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-4-api-masuk-dan-keluar-admin.md`
  summary: Jalankan suite e2e penuh (termasuk `e2e/admin-session.spec.ts` berbasis browser) di CI atau mesin dengan dependensi Chromium.
  evidence: Di mesin dev Chromium gagal start (`libnspr4` hilang); hanya test API Playwright (8 lulus) yang terverifikasi.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-4-api-masuk-dan-keluar-admin.md`
  summary: Test bahwa login yang lolos verifikasi scrypt tetapi password-nya diganti sebelum transaksi tulis tidak menghasilkan sesi.
  evidence: Cabang baca-ulang `passwordHash` di `src/server/services/auth.ts` tidak tercakup test; butuh barrier `worker_threads` atau seam test.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-4-api-masuk-dan-keluar-admin.md`
  summary: Uji prompt password tersembunyi `admin:create` (backspace, Ctrl-C) atau tambahkan cek manual di verifikasi.
  evidence: `readHiddenLine` hanya jalan bila stdin TTY; `scripts.test.ts` memakai pipe sehingga jalur itu tak pernah dieksekusi.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-5-halaman-masuk-admin-dan-kerangka-ui-bersama.md`
  summary: Uji jeda 300 ms "Memuat…" dan logika `useResource` (abaikan hasil basi, abort saat unmount, `retry`) secara langsung.
  evidence: Test e2e "Memuat…" menahan request tanpa batas sehingga tetap lulus bila `LOADING_DELAY_MS` = 0; Vitest berjalan di environment node tanpa jsdom, jadi hook belum bisa dirender tanpa memilih pendekatan component test.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md`
  summary: Perbarui ARCHITECTURE-SPINE lewat `bmad-architecture` (R-022): AD-6 batas Selesai menjadi `max(session_date) <= today`, dan AD-19 menjadi "minimal satu tanggal sesi setelah today".
  evidence: Story 1.6 mengikuti epics/PRD revisi (`classStatus` memakai `<=`, `validateSessionDates` mewajibkan tanggal > today), sedangkan spine AD-6 masih `<` dan AD-19 masih "≥ today". AGENTS.md menyatakan AD mengikat, sehingga agen berikutnya bisa mengikuti spine yang usang.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md`
  summary: Cabang sekunder ATDD 1.6 untuk `bmad-testarch-automate`: test skema migrasi 002 (CHECK kuota/GLOB/UNIQUE), rollback satu transaksi createClass, keunikan `publicCode`, tombol Hapus baris tanggal, badge Selesai di halaman kelas, clipboard ditolak, halaman `/admin/kelas/987654` (pesan Indonesia), dan toast tidak muncul lagi setelah muat ulang.
  evidence: Checklist ATDD §"Cabang sekunder" mencantumkannya sebagai di luar leaf merah; perilakunya sudah diimplementasikan tetapi belum diuji otomatis.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md`
  summary: Uji e2e fallback "Salin tautan" saat clipboard ditolak (teks URL terpilih + pesan "Tautan belum tersalin…").
  evidence: Review verification-gap: e2e AC-7 hanya memberi izin clipboard; menghapus cabang `catch` di `CopyLinkButton` tidak menggagalkan test apa pun.

- source_spec: `/home/inixindo/aisdlc/aisdlc-kelasku/_bmad-output/implementation-artifacts/spec-1-6-membuat-kelas-dan-membagikan-tautan-pendaftaran.md`
  summary: Tambahkan `page.reload()` setelah simpan di e2e AC-6 untuk memastikan toast "Kelas tersimpan" tidak muncul lagi.
  evidence: Review verification-gap: menghapus efek `navigate(..., { replace: true, state: null })` di `ClassPage` tidak menggagalkan test apa pun.
