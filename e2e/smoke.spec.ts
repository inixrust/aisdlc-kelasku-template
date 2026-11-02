import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page renders in Indonesian with no axe violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Kelasku' })).toBeVisible();
  await expect(page).toHaveTitle('Kelasku');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('deep links are served by the SPA fallback', async ({ page }) => {
  const response = await page.goto('/admin/kelas');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('unknown API routes return the 404 error envelope', async ({ request }) => {
  const response = await request.get('/api/tidak-ada');
  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({
    error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.' },
  });
});
