import type { Page, Route } from '@playwright/test';
import { E2E_ADMIN } from './support/admin';
import { expect, test } from './support/fixtures';

const SESSION_EXPIRED = 'Sesi masuk Anda berakhir. Silakan masuk lagi.';
const LOAD_FAILED = 'Tidak dapat memuat data. Periksa koneksi lalu coba lagi.';

/** Isi formulir Masuk lewat UI (bukan fixture API) lalu kirim. */
async function submitLogin(page: Page, email: string, password: string) {
  await page.getByLabel('Email (wajib)').fill(email);
  await page.getByLabel('Password (wajib)').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

/**
 * `GET /api/auth/session` dipanggil dua kali di `/admin/kelas`: pertama oleh `AdminLayout`, lalu oleh
 * halaman Kelas (sumber data sementara). `handleData` menangani panggilan kedua dan seterusnya.
 */
async function routeClassesData(page: Page, handleData: (route: Route) => Promise<void>) {
  let calls = 0;
  await page.route('**/api/auth/session', async (route) => {
    calls += 1;
    if (calls === 1) await route.continue();
    else await handleData(route);
  });
}

test.describe('Masuk admin (FR-1)', () => {
  test('@P1 wrong credentials show the danger alert, clear the password, and keep the email', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await page.goto('/admin/masuk');
    await expect(page).toHaveTitle('Masuk — Kelasku');
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
    await expect(page.getByRole('navigation')).toHaveCount(0);

    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/auth/login', async (route) => {
      await gate;
      await route.continue();
    });

    await submitLogin(page, E2E_ADMIN.email, 'bukan-password-yang-benar');
    const busy = page.getByRole('button', { name: 'Masuk…' });
    await expect(busy).toBeDisabled();
    release();

    const alert = page.getByRole('alert');
    await expect(alert).toHaveText('Email atau password salah');
    await expect(page.getByLabel('Password (wajib)')).toHaveValue('');
    await expect(page.getByLabel('Password (wajib)')).toBeFocused();
    await expect(page.getByLabel('Email (wajib)')).toHaveValue(E2E_ADMIN.email);
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeEnabled();
    // Alert berada di atas formulir.
    const alertBox = await alert.boundingBox();
    const emailBox = await page.getByLabel('Email (wajib)').boundingBox();
    expect(alertBox!.y).toBeLessThan(emailBox!.y);

    await expectNoA11yViolations();
  });

  test('@P1 submitting the empty form focuses the error summary linked to each field', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await page.goto('/admin/masuk');
    await page.getByRole('button', { name: 'Masuk' }).click();

    const summary = page.getByRole('alert');
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link', { name: 'Email wajib diisi.' })).toHaveAttribute('href', '#login-email');
    await expect(summary.getByRole('link', { name: 'Password wajib diisi.' })).toHaveAttribute('href', '#login-password');

    for (const [label, message] of [
      ['Email (wajib)', 'Email wajib diisi.'],
      ['Password (wajib)', 'Password wajib diisi.'],
    ] as const) {
      const input = page.getByLabel(label);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAccessibleDescription(message);
    }

    await summary.getByRole('link', { name: 'Password wajib diisi.' }).click();
    await expect(page.getByLabel('Password (wajib)')).toBeFocused();
    await expect(page).toHaveURL('/admin/masuk');

    await expectNoA11yViolations();
  });

  test('@P1 opening an admin route signed out goes to Masuk and returns after signing in', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await page.goto('/admin/kelas');
    await expect(page).toHaveURL('/admin/masuk?next=/admin/kelas');
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();
    // Belum masuk bukan sesi habis: tanpa alert info.
    await expect(page.getByText(SESSION_EXPIRED)).toHaveCount(0);

    await submitLogin(page, E2E_ADMIN.email, E2E_ADMIN.password);
    await expect(page).toHaveURL('/admin/kelas');
    await expect(page).toHaveTitle('Kelas — Kelasku');
    const heading = page.getByRole('heading', { level: 1, name: 'Kelas' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    const topBar = page.getByRole('banner');
    const box = await topBar.boundingBox();
    if (test.info().project.name === 'admin-desktop') expect(box!.height).toBe(48);
    else expect(box!.height).toBeGreaterThanOrEqual(48);
    const nav = page.getByRole('navigation', { name: 'Navigasi admin' });
    await expect(nav.getByText('Kelasku')).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Kelas' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Sesi hari ini' })).toHaveCount(0);
    await expect(topBar.getByText(E2E_ADMIN.email)).toBeVisible();
    await expect(topBar.getByRole('button', { name: 'Keluar' })).toBeVisible();

    await expectNoA11yViolations();
  });

  test('@P1 P2-012 login ignores an unsafe or missing next and lands on /admin/kelas', async ({ page }) => {
    for (const url of ['/admin/masuk?next=//evil.example', '/admin/masuk?next=https://evil.example', '/admin/masuk']) {
      await page.goto(url);
      await submitLogin(page, E2E_ADMIN.email, E2E_ADMIN.password);
      await expect(page).toHaveURL('/admin/kelas');
      await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();
    }
  });

  test('@P2 a failed login request shows the network alert and keeps the input', async ({ page }) => {
    await page.goto('/admin/masuk');
    await page.route('**/api/auth/login', (route) => route.abort('internetdisconnected'));
    await submitLogin(page, E2E_ADMIN.email, E2E_ADMIN.password);

    await expect(page.getByRole('alert')).toHaveText('Tidak dapat menghubungi server. Coba lagi.');
    await expect(page.getByLabel('Email (wajib)')).toHaveValue(E2E_ADMIN.email);
    await expect(page.getByLabel('Password (wajib)')).toHaveValue(E2E_ADMIN.password);
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeEnabled();
    await expect(page).toHaveURL('/admin/masuk');
  });

  test('@P1 /admin redirects to /admin/kelas', async ({ page, adminLogin }) => {
    await adminLogin();
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin/kelas');
    await expect(page).toHaveTitle('Kelas — Kelasku');
  });

  test('@P1 signing out lands on Masuk and Back does not show admin data', async ({ page, adminLogin }) => {
    await adminLogin();
    await page.goto('/admin/kelas');
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();

    await page.getByRole('button', { name: 'Keluar' }).click();
    await expect(page).toHaveURL('/admin/masuk');
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL('/admin/masuk?next=/admin/kelas');
    await expect(page.getByText(E2E_ADMIN.email)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Keluar' })).toHaveCount(0);
  });

  test('@P2 a failed sign-out shows a danger alert and stays on the page', async ({ page, adminLogin }) => {
    await adminLogin();
    await page.goto('/admin/kelas');
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();

    await page.route('**/api/auth/logout', (route) => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: 'Keluar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Tidak dapat menghubungi server. Coba lagi.');
    await expect(page).toHaveURL('/admin/kelas');
  });
});

test.describe('Kerangka halaman admin', () => {
  test('@P2 slow data shows "Memuat…" after 300 ms', async ({ page, adminLogin }) => {
    await adminLogin();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await routeClassesData(page, async (route) => {
      await gate;
      await route.continue();
    });

    await page.goto('/admin/kelas');
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();
    await expect(page.getByText('Memuat…')).toBeVisible();
    release();
    await expect(page.getByText('Memuat…')).toHaveCount(0);
  });

  test('@P2 failed data shows the load alert and "Coba lagi" reloads it', async ({
    page,
    adminLogin,
    expectNoA11yViolations,
  }) => {
    await adminLogin();
    let fail = true;
    await routeClassesData(page, async (route) => {
      if (fail) await route.abort('internetdisconnected');
      else await route.continue();
    });

    await page.goto('/admin/kelas');
    const alert = page.getByRole('alert');
    await expect(alert).toContainText(LOAD_FAILED);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Keluar' })).toBeVisible();
    await expectNoA11yViolations();

    fail = false;
    await alert.getByRole('button', { name: 'Coba lagi' }).click();
    await expect(page.getByText(LOAD_FAILED)).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();
  });

  test('@P2 a failed session check shows the load alert without admin chrome', async ({
    page,
    adminLogin,
    expectNoA11yViolations,
  }) => {
    await adminLogin();
    let failSessionCheck = true;
    await page.route('**/api/auth/session', async (route) => {
      if (failSessionCheck) await route.abort('internetdisconnected');
      else await route.continue();
    });

    await page.goto('/admin/kelas');
    const alert = page.getByRole('alert');
    await expect(alert).toContainText(LOAD_FAILED);
    await expect(page).toHaveURL('/admin/kelas');
    await expect(page.getByRole('button', { name: 'Keluar' })).toHaveCount(0);
    await expect(page.getByText(E2E_ADMIN.email)).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toHaveCount(0);
    await expectNoA11yViolations();

    failSessionCheck = false;
    await alert.getByRole('button', { name: 'Coba lagi' }).click();
    await expect(page.getByRole('banner').getByRole('button', { name: 'Keluar' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();
  });

  test('@P1 an expired session while loading data redirects to Masuk with the info alert', async ({ page, adminLogin }) => {
    await adminLogin();
    let expired = true;
    await routeClassesData(page, async (route) => {
      if (!expired) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'unauthorized', message: SESSION_EXPIRED } }),
      });
    });

    await page.goto('/admin/kelas?x=1');
    await expect(page).toHaveURL('/admin/masuk?next=/admin/kelas%3Fx%3D1');
    await expect(page.getByRole('status').filter({ hasText: SESSION_EXPIRED })).toBeVisible();

    expired = false;
    await submitLogin(page, E2E_ADMIN.email, E2E_ADMIN.password);
    await expect(page).toHaveURL('/admin/kelas?x=1');
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();
  });

  test('@P2 the first Tab focuses "Lewati ke konten utama" on Masuk and Kelas', async ({ page, adminLogin }) => {
    await page.goto('/admin/masuk');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Lewati ke konten utama' })).toBeFocused();
    // Muat pertama tidak memindahkan fokus ke <h1>.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Masuk' })).not.toBeFocused();

    await adminLogin();
    await page.goto('/admin/kelas');
    await expect(page.getByRole('heading', { level: 1, name: 'Kelas' })).toBeVisible();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Lewati ke konten utama' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });
});
