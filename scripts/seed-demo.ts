/**
 * `npm run seed:demo` (AD-14, B-2(c)): jalankan hanya saat server mati. Membuat atau memperbarui admin
 * seed dari `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, lalu menambah kelas demo yang tanggalnya
 * relatif terhadap "hari ini" dari `Clock` (Story 1.6). Kelas demo ditambah lewat use-case yang sama
 * dengan server dan hanya bila judulnya belum ada (idempoten). Keluaran tidak memuat email maupun password.
 */
import { createClock } from '../src/server/clock.js';
import { run, withServices } from './cli.js';

/** `YYYY-MM-DD` + `days` hari kalender (aritmetika UTC murni, lepas dari zona proses). */
function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Kelas demo: satu sedang berjalan (ada sesi hari ini), satu mendatang. */
function demoClasses(today: string): Array<{ title: string; sessionDates: string[]; quota: number }> {
  return [
    {
      title: 'Demo: Excel untuk Laporan Keuangan',
      sessionDates: [addDays(today, -7), today, addDays(today, 7)],
      quota: 20,
    },
    {
      title: 'Demo: Public Speaking untuk Pemula',
      sessionDates: [addDays(today, 7), addDays(today, 14), addDays(today, 21)],
      quota: 15,
    },
  ];
}

run(async () => {
  const email = process.env.SEED_ADMIN_EMAIL ?? '';
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (email.trim() === '' || password === '') {
    // Ditolak sebelum DB dibuka: tidak ada berkas atau migrasi yang tersentuh.
    console.error('SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi (lihat .env.example).');
    process.exit(1);
  }

  const { created, classesAdded } = await withServices(async (services) => {
    const admin = await services.auth.upsertAdmin({ email, password });
    let added = 0;
    for (const demo of demoClasses(createClock().todayJakarta())) {
      if (services.classes.hasClassWithTitle(demo.title)) continue;
      services.classes.createClass(demo);
      added += 1;
    }
    return { created: admin.created, classesAdded: added };
  });
  console.log(created ? 'Admin seed dibuat.' : 'Password admin seed diperbarui.');
  console.log(`Kelas demo ditambahkan: ${classesAdded}.`);
});
