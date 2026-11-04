/**
 * ATDD Story 1.6 (fase hijau) — UJ-1 langkah 1–4 (1.6-E2E-001 P1, 1.6-E2E-002 P2). Risiko: R-017, R-023.
 * - AC-5: formulir Buat kelas, error server di baris tanggal + ringkasan, nilai tetap, "Menyimpan…".
 * - AC-6: setelah simpan → halaman kelas, toast "Kelas tersimpan", kepala kelas.
 * - AC-7: "Salin tautan" → clipboard, label "Tautan disalin" 3 detik lewat aria-live.
 *
 * Playwright vanilla + fixture repo (A-6: playwright-utils tidak dipasang). Kelas dibuat sendiri
 * dengan judul ber-`uid`; kelas seed hanya dibaca. "Hari ini" = Senin 9 Nov 2026 (`KELASKU_FAKE_NOW`).
 *
 * Label kolom yang diasumsikan (lihat checklist ATDD): "Judul kelas", "Kuota", baris "Tanggal sesi N"
 * (Field menambah " (wajib)"); formulir baru tanpa baris tanggal sampai "Tambah tanggal" ditekan.
 */
import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';

const DUPLICATE_DATE_MESSAGE = 'Tanggal 16 Nov 2026 sudah ada di kelas ini';
const PUBLIC_CODE = '[A-Za-z0-9_-]{10}';

const titleField = (page: Page) => page.getByLabel(/^Judul kelas/);
const quotaField = (page: Page) => page.getByLabel(/^Kuota/);
const sessionDateField = (page: Page, row: number) => page.getByLabel(new RegExp(`^Tanggal sesi ${row}(?!\\d)`));

async function addSessionDate(page: Page, date: string): Promise<void> {
  await page.getByRole('button', { name: 'Tambah tanggal' }).click();
  await page.getByLabel(/^Tanggal sesi \d+/).last().fill(date);
}

async function fillClassForm(page: Page, input: { title: string; dates: string[]; quota: string }): Promise<void> {
  await titleField(page).fill(input.title);
  for (const date of input.dates) await addSessionDate(page, date);
  await quotaField(page).fill(input.quota);
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.describe('Buat kelas dan bagikan tautan (FR2, FR6, UJ-1)', () => {
  test(
    '[P1] AC-5 FR2: server errors stay next to the duplicate date row and in the error summary, values are kept, and the button reads "Menyimpan…" while saving',
    { tag: '@P1' },
    async ({ page, adminLogin, uid, expectNoA11yViolations }) => {
      await expect(
        (async () => {
          await adminLogin();
          await page.goto('/admin/kelas');
          await page.getByRole('link', { name: 'Buat kelas' }).or(page.getByRole('button', { name: 'Buat kelas' })).click();
          await expect(page).toHaveURL(/\/admin\/kelas\/baru$/);
          await expect(page.getByRole('heading', { level: 1, name: 'Buat kelas' })).toBeVisible();

          const title = `Excel untuk Laporan Keuangan ${uid}`;
          await fillClassForm(page, { title, dates: ['2026-11-16', '2026-11-16'], quota: '20' });

          // Tahan POST agar state "Menyimpan…" bisa diamati (pola admin-login.spec.ts).
          let release: () => void = () => undefined;
          const gate = new Promise<void>((resolve) => {
            release = resolve;
          });
          await page.route('**/api/admin/classes', async (route) => {
            if (route.request().method() === 'POST') await gate;
            await route.continue();
          });

          await page.getByRole('button', { name: 'Simpan kelas' }).click();
          await expect(page.getByRole('button', { name: 'Menyimpan…' })).toBeDisabled();
          release();

          // Kriteria inti: error server di baris tanggal yang ganda (baris kedua).
          await expect(sessionDateField(page, 2)).toHaveAccessibleDescription(new RegExp(DUPLICATE_DATE_MESSAGE));
          await expect(sessionDateField(page, 2)).toHaveAttribute('aria-invalid', 'true');

          const summary = page.getByRole('alert');
          await expect(summary.getByRole('link', { name: DUPLICATE_DATE_MESSAGE })).toBeVisible();
          await expect(summary).toBeFocused();

          await expect(titleField(page)).toHaveValue(title);
          await expect(quotaField(page)).toHaveValue('20');
          await expect(sessionDateField(page, 1)).toHaveValue('2026-11-16');
          await expect(sessionDateField(page, 2)).toHaveValue('2026-11-16');
          await expect(page.getByRole('button', { name: 'Simpan kelas' })).toBeEnabled();
          await expect(page).toHaveURL(/\/admin\/kelas\/baru$/);

          await expectNoA11yViolations();
        })(),
      ).resolves.toBeUndefined();
    },
  );

  test(
    '[P1] AC-6 FR2: saving opens the admin class page with the "Kelas tersimpan" toast and the class header',
    { tag: '@P1' },
    async ({ page, adminLogin, uid, expectNoA11yViolations }) => {
      await expect(
        (async () => {
          await adminLogin();
          await page.goto('/admin/kelas/baru');
          const title = `Excel untuk Laporan Keuangan ${uid}`;
          // Urutan masukan sengaja acak; server mengurutkan.
          await fillClassForm(page, { title, dates: ['2026-11-16', '2026-11-09', '2026-11-23'], quota: '20' });
          await page.getByRole('button', { name: 'Simpan kelas' }).click();

          // Kriteria inti: pindah ke halaman kelas dengan toast sukses yang sopan.
          await expect(page).toHaveURL(/\/admin\/kelas\/\d+$/);
          const toast = page.locator('[aria-live="polite"]').filter({ hasText: 'Kelas tersimpan' });
          await expect(toast).toBeVisible();
          await expect(toast).not.toBeFocused();

          await expect(page).toHaveTitle(`${title} — Kelasku`);
          await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
          await expect(page.getByText('Dibuka', { exact: true })).toBeVisible();
          await expect(page.getByText(/Kuota\s*:?\s*20\b/)).toBeVisible();
          for (const formatted of ['Senin, 9 Nov 2026', 'Senin, 16 Nov 2026', 'Senin, 23 Nov 2026']) {
            await expect(page.getByText(formatted)).toBeVisible();
          }
          await expect(page.getByText('Hari ini', { exact: true })).toBeVisible();

          const origin = new URL(page.url()).origin;
          const classId = new URL(page.url()).pathname.split('/').pop() ?? '';
          const link = page.getByText(new RegExp(`^${escapeRegExp(origin)}/daftar/${PUBLIC_CODE}$`));
          await expect(link).toBeVisible();
          // P1-011: id internal tidak muncul di tautan.
          expect((await link.textContent())?.endsWith(`/daftar/${classId}`)).toBe(false);

          await expectNoA11yViolations();
          // Toast hilang sendiri setelah 5 detik.
          await expect(toast).toBeHidden({ timeout: 8_000 });
        })(),
      ).resolves.toBeUndefined();
    },
  );

  test(
    '[P2] AC-7 FR6: "Salin tautan" copies the full URL and announces "Tautan disalin" for 3 seconds',
    { tag: '@P2' },
    async ({ page, context, adminLogin, uid, expectNoA11yViolations }) => {
      await expect(
        (async () => {
          await adminLogin();
          const created = await page.request.post('/api/admin/classes', {
            data: { title: `Kelas salin tautan ${uid}`, sessionDates: ['2026-11-16', '2026-11-23'], quota: 10 },
          });
          const { id, publicCode } = (await created.json()) as { id: number; publicCode: string };

          await page.goto(`/admin/kelas/${id}`);
          const origin = new URL(page.url()).origin;
          await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
          const expectedUrl = `${origin}/daftar/${publicCode}`;

          await page.getByRole('button', { name: 'Salin tautan' }).click();

          // Kriteria inti: URL lengkap ada di clipboard.
          expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expectedUrl);

          await expect(page.getByRole('button', { name: 'Tautan disalin' })).toBeVisible();
          await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Tautan disalin' }).first()).toBeVisible();
          await expect(page.getByText(expectedUrl, { exact: true })).toBeVisible();
          await expectNoA11yViolations();
          // Label kembali setelah 3 detik.
          await expect(page.getByRole('button', { name: 'Salin tautan' })).toBeVisible({ timeout: 6_000 });
        })(),
      ).resolves.toBeUndefined();
    },
  );

  test(
    '[P2] AC-5 FR2: an empty date row is caught on submit in the browser, and a class without dates shows the list error near "Tambah tanggal"',
    { tag: '@P2' },
    async ({ page, adminLogin, uid, expectNoA11yViolations }) => {
      await expect(
        (async () => {
          await adminLogin();
          await page.goto('/admin/kelas/baru');
          let posts = 0;
          page.on('request', (request) => {
            if (request.method() === 'POST' && request.url().endsWith('/api/admin/classes')) posts += 1;
          });

          await titleField(page).fill(`Kelas tanpa tanggal ${uid}`);
          await quotaField(page).fill('20');
          await page.getByRole('button', { name: 'Tambah tanggal' }).click();

          // Validasi klien saat submit: baris kosong ditandai tanpa request ke server.
          await page.getByRole('button', { name: 'Simpan kelas' }).click();
          await expect(sessionDateField(page, 1)).toHaveAttribute('aria-invalid', 'true');
          await expect(page.getByRole('alert')).toBeFocused();
          expect(posts).toBe(0);

          // Hapus satu-satunya baris → error tingkat daftar dari server.
          await page.getByRole('button', { name: 'Hapus tanggal sesi 1' }).click();
          await page.getByRole('button', { name: 'Simpan kelas' }).click();

          const addDate = page.getByRole('button', { name: 'Tambah tanggal' });
          await expect(addDate).toHaveAccessibleDescription(/\S/);
          const message = (await page.locator('#class-session-dates-error').textContent()) ?? '';
          expect(message.trim()).not.toBe('');
          const summary = page.getByRole('alert');
          await expect(summary.getByRole('link', { name: message.trim() })).toBeVisible();
          await expect(summary).toBeFocused();
          expect(posts).toBe(1);
          await expect(titleField(page)).toHaveValue(`Kelas tanpa tanggal ${uid}`);

          await expectNoA11yViolations();
        })(),
      ).resolves.toBeUndefined();
    },
  );

  test('[P2] AC-8 FR5: an unknown class id shows "Kelas tidak ditemukan" with a link back to Kelas', { tag: '@P2' }, async ({ page, adminLogin, expectNoA11yViolations }) => {
    await adminLogin();
    await page.goto('/admin/kelas/987654');

    await expect(page.getByText('Kelas tidak ditemukan.')).toBeVisible();
    const back = page.getByRole('link', { name: 'Kembali ke daftar kelas' });
    await expect(back).toHaveAttribute('href', '/admin/kelas');
    await expectNoA11yViolations();
  });
});
