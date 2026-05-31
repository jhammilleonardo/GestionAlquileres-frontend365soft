import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const CRITICAL_MODULES = [
  'propiedades',
  'contratos',
  'pagos',
  'mantenimiento',
  'solicitudes',
];

test.describe('Rutas críticas admin', () => {
  test('cargan sin pantalla blanca despues del login', async ({ page }) => {
    const slug = await loginAsAdmin(page);

    for (const path of CRITICAL_MODULES) {
      await page.goto(`/${slug}/${path}`);
      await expect(page).toHaveURL(new RegExp(`/${slug}/${path}`), { timeout: 10000 });
      await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
