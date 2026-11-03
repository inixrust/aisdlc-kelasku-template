import { expect, test } from './support/fixtures';

test('home page renders in Indonesian with no axe violations', async ({ page, expectNoA11yViolations }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Kelasku' })).toBeVisible();
  await expect(page).toHaveTitle('Kelasku');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');

  await expectNoA11yViolations();
});

test('deep links are served by the SPA fallback', async ({ page, expectNoA11yViolations }) => {
  const response = await page.goto('/admin/kelas');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' })).toBeVisible();

  await expectNoA11yViolations();
});

test('unknown API routes return the 404 error envelope', async ({ request }) => {
  const response = await request.get('/api/tidak-ada');
  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({
    error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.' },
  });
});
