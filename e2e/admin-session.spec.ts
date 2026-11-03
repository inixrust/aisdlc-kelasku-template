import { E2E_ADMIN } from './support/admin';
import { expect, test } from './support/fixtures';

// Butuh browser (konteks `page`); dipisah dari spec API agar `-g "API"` tetap tanpa browser.
test('@P1 adminLogin fixture signs the browser context in as the seeded admin', async ({ page, adminLogin }) => {
  await adminLogin();
  const session = await page.request.get('/api/auth/session');
  expect(session.status()).toBe(200);
  expect(await session.json()).toEqual({ email: E2E_ADMIN.email });
});
