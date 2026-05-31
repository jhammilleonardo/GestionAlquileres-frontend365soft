import { Page, expect } from '@playwright/test';

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@365soft.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin365!';

/** Inicia sesión como administrador y espera el dashboard. Devuelve el slug del tenant. */
export async function loginAsAdmin(page: Page): Promise<string> {
  await page.goto('/login');
  await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
  await expect(page).toHaveURL(/\/[^/]+\/dashboard/, { timeout: 15000 });

  const match = /\/([^/]+)\/dashboard/.exec(page.url());
  return match?.[1] ?? 'demo';
}
