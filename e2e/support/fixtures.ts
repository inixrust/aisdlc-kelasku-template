import AxeBuilder from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';
import { uniqueId } from '../../test/helpers/unique.js';
import { E2E_ADMIN } from './admin.js';

interface KelaskuFixtures {
  /**
   * Jalankan axe pada state halaman saat ini dan gagal bila ada pelanggaran
   * (AD-14, NFR-3: setiap permukaan IA EXPERIENCE.md). Aturan bawaan axe adalah
   * superset WCAG 2.1 AA, jadi tidak dipersempit dengan `withTags`.
   */
  expectNoA11yViolations: () => Promise<void>;
  /**
   * Akhiran unik per test untuk judul kelas dan email. Kelas hasil seed hanya dibaca;
   * test yang mengubah data membuat kelasnya sendiri dengan judul berakhiran `uid`.
   */
  uid: string;
  /**
   * Masuk sebagai admin seed lewat `POST /api/auth/login`. Cookie sesi tersimpan di konteks
   * browser test ini, jadi `page` dan `page.request` berikutnya sudah terautentikasi.
   */
  adminLogin: () => Promise<void>;
}

/** Satu-satunya titik impor `test` untuk spec e2e. Fixture baru ditambah di sini. */
export const test = base.extend<KelaskuFixtures>({
  expectNoA11yViolations: async ({ page }, use) => {
    await use(async () => {
      const { violations } = await new AxeBuilder({ page }).analyze();
      const summary = violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        targets: v.nodes.map((n) => n.target.join(' ')),
      }));
      expect(summary).toEqual([]);
    });
  },
  // eslint-disable-next-line no-empty-pattern -- Playwright mewajibkan pola objek di argumen pertama.
  uid: async ({}, use) => {
    await use(uniqueId());
  },
  adminLogin: async ({ page }, use) => {
    await use(async () => {
      const response = await page.request.post('/api/auth/login', { data: E2E_ADMIN });
      expect(response.status(), 'login admin seed e2e').toBe(200);
    });
  },
});

export { expect };
