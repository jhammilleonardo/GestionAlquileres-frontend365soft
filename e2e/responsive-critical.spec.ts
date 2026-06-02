import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Responsive crítico', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pantallas principales renderizan en mobile sin pantalla blanca', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión|sign in/i })).toBeVisible();

    await page.goto('/demo/login');
    await expect(page.getByRole('heading', { name: /portal|iniciar sesión|sign in/i })).toBeVisible();

    await page.goto('/demo/owner/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión|sign in/i })).toBeVisible();

    const slug = await loginAsAdmin(page);
    const protectedRoutes = [
      `/${slug}/dashboard`,
      `/${slug}/pagos`,
      `/${slug}/propiedades`,
      `/${slug}/contratos`,
      `/${slug}/reportes`,
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator('body')).not.toHaveText(/application error|cannot match any routes/i);
    }
  });
});
