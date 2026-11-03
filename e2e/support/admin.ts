/**
 * Kredensial admin e2e yang tetap. Bukan rahasia: hanya dipakai `seed:demo` untuk DB e2e
 * (`data/e2e.db`) yang dihapus di awal setiap run (playwright.config.ts).
 */
export const E2E_ADMIN = {
  email: 'admin-e2e@kelasku.test',
  password: 'kata-sandi-e2e-123',
} as const;
