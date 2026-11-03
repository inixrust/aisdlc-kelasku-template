/**
 * `npm run seed:demo` (AD-14, B-2(c)): jalankan hanya saat server mati. Story ini hanya membuat
 * atau memperbarui admin seed dari `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`; kelas demo
 * menyusul di Story 1.7. Keluaran tidak memuat email maupun password.
 */
import { run, withServices } from './cli.js';

run(async () => {
  const email = process.env.SEED_ADMIN_EMAIL ?? '';
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (email.trim() === '' || password === '') {
    // Ditolak sebelum DB dibuka: tidak ada berkas atau migrasi yang tersentuh.
    console.error('SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi (lihat .env.example).');
    process.exit(1);
  }

  const { created } = await withServices((services) => services.auth.upsertAdmin({ email, password }));
  console.log(created ? 'Admin seed dibuat.' : 'Password admin seed diperbarui.');
});
