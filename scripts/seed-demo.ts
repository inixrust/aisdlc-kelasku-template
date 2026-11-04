/**
 * `npm run seed:demo` (AD-14, B-2(c)): jalankan hanya saat server mati. Membuat atau memperbarui admin
 * seed dari `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, lalu menambah kelas demo yang tanggalnya
 * relatif terhadap "hari ini" dari `Clock` (Story 1.6) beserta pendaftarnya (Story 1.7, B-2b).
 * Kelas dan pendaftaran ditambah lewat use-case yang sama dengan server dan hanya bila judul kelasnya
 * belum ada (idempoten). Kelas Selesai dibuat dan diisi dengan clock di masa lalu, bukan SQL mentah.
 * Keluaran tidak memuat email maupun password.
 */
import { type Clock, createClock, jakartaDateOf } from '../src/server/clock.js';
import { createServices } from '../src/server/services/index.js';
import { run, withServices } from './cli.js';

const DAY_MS = 86_400_000;
/** Kelas Selesai dibuat "10 hari lalu" agar tanggal sesinya sah saat dibuat dan sudah lewat sekarang. */
const PAST_OFFSET_DAYS = 10;

/** `YYYY-MM-DD` + `days` hari kalender (aritmetika UTC murni, lepas dari zona proses). */
function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Clock yang tertinggal `days` hari dari `clock`. */
function shiftedClock(clock: Clock, days: number): Clock {
  const now = (): Date => new Date(clock.now().getTime() - days * DAY_MS);
  return { now, todayJakarta: () => jakartaDateOf(now()) };
}

interface DemoClass {
  title: string;
  sessionDates: string[];
  quota: number;
  /** Jumlah pendaftar demo (urut daftar); yang melebihi kuota masuk Daftar tunggu. */
  participants: number;
  /** Dibuat dan diisi dengan clock `PAST_OFFSET_DAYS` hari lalu (kelas yang kini Selesai). */
  past?: boolean;
}

/**
 * Kelas demo: berjalan, mendatang (Story 1.6), lalu B-2b: Penuh tanpa antrean, Penuh dengan 3 Daftar tunggu,
 * dan Selesai dengan Terdaftar + Daftar tunggu.
 */
function demoClasses(today: string): DemoClass[] {
  return [
    {
      title: 'Demo: Excel untuk Laporan Keuangan',
      sessionDates: [addDays(today, -7), today, addDays(today, 7)],
      quota: 20,
      participants: 0,
    },
    {
      title: 'Demo: Public Speaking untuk Pemula',
      sessionDates: [addDays(today, 7), addDays(today, 14), addDays(today, 21)],
      quota: 15,
      participants: 0,
    },
    {
      title: 'Demo: Desain Presentasi dengan Canva',
      sessionDates: [addDays(today, 3), addDays(today, 10)],
      quota: 3,
      participants: 3,
    },
    {
      title: 'Demo: Dasar Manajemen Proyek',
      sessionDates: [addDays(today, 5), addDays(today, 12)],
      quota: 4,
      participants: 7,
    },
    {
      title: 'Demo: Menulis Surat Dinas',
      sessionDates: [addDays(today, -7), addDays(today, -3)],
      quota: 3,
      participants: 5,
      past: true,
    },
  ];
}

const DEMO_NAMES = ['Ayu Lestari', 'Bagus Wicaksono', 'Citra Maharani', 'Dedi Kurniawan', 'Endah Puspita', 'Fikri Ramadhan', 'Gita Permata'];

run(async () => {
  const email = process.env.SEED_ADMIN_EMAIL ?? '';
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (email.trim() === '' || password === '') {
    // Ditolak sebelum DB dibuka: tidak ada berkas atau migrasi yang tersentuh.
    console.error('SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi (lihat .env.example).');
    process.exit(1);
  }

  const { created, classesAdded } = await withServices(async (services, deps) => {
    const admin = await services.auth.upsertAdmin({ email, password });
    const pastServices = createServices({ db: deps.db, clock: shiftedClock(deps.clock, PAST_OFFSET_DAYS) });
    let added = 0;
    for (const demo of demoClasses(deps.clock.todayJakarta())) {
      if (services.classes.hasClassWithTitle(demo.title)) continue;
      const target = demo.past === true ? pastServices : services;
      const cls = target.classes.createClass({ title: demo.title, sessionDates: demo.sessionDates, quota: demo.quota });
      for (let i = 0; i < demo.participants; i++) {
        target.registrations.register(cls.publicCode, {
          name: DEMO_NAMES[i % DEMO_NAMES.length],
          email: `peserta${i + 1}.kelas${cls.id}@contoh.id`,
        });
      }
      added += 1;
    }
    return { created: admin.created, classesAdded: added };
  });
  console.log(created ? 'Admin seed dibuat.' : 'Password admin seed diperbarui.');
  console.log(`Kelas demo ditambahkan: ${classesAdded}.`);
});
