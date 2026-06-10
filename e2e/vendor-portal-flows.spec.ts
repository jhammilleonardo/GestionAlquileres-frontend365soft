import { expect, test } from '@playwright/test';
import { hasVendorCredentials, loginAsVendor } from './helpers';

const SLUG = process.env.E2E_TENANT_SLUG ?? 'demo';

test.describe('Portal proveedor — acceso', () => {
  test('login del proveedor renderiza el formulario con email y contraseña', async ({ page }) => {
    await page.goto(`/${SLUG}/vendor/login`);

    await expect(page.locator('form.login-form, form').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="email"], input[formcontrolname="email"]').first()).toBeVisible();
    await expect(
      page.locator('input[type="password"], input[formcontrolname="password"]').first(),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar|ingresar|sign in|entrar/i }).first()).toBeVisible();
  });

  test('ruta protegida del proveedor redirige a login sin sesión', async ({ page }) => {
    await page.goto(`/${SLUG}/vendor`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/vendor\/login/, { timeout: 15000 });
  });

  test('credenciales inválidas no autentican al proveedor', async ({ page }) => {
    await page.goto(`/${SLUG}/vendor/login`);
    await page.locator('input[type="email"], input[formcontrolname="email"]').first().fill('noexiste@vendor.com');
    await page.locator('input[type="password"], input[formcontrolname="password"]').first().fill('claveIncorrecta1');
    await page.getByRole('button', { name: /iniciar|ingresar|sign in|entrar/i }).first().click();

    // Debe permanecer en login (no navega al dashboard del proveedor).
    await expect(page).toHaveURL(/\/vendor\/login/, { timeout: 10000 });
  });
});

// Flujo autenticado: requiere un usuario con rol VENDOR sembrado en el tenant.
// Se omite si no se proveen credenciales (E2E_VENDOR_EMAIL / E2E_VENDOR_PASSWORD).
test.describe('Portal proveedor — autenticado', () => {
  test.skip(
    !hasVendorCredentials(),
    'Define E2E_VENDOR_EMAIL y E2E_VENDOR_PASSWORD para correr el flujo autenticado del proveedor',
  );

  test('proveedor autenticado ve su dashboard de órdenes', async ({ page }) => {
    const slug = await loginAsVendor(page, SLUG);
    await page.goto(`/${slug}/vendor`);

    await expect(page.locator('.vendor-portal, .stats, h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).not.toHaveText(/cannot match any routes|application error/i);
  });

  test('proveedor autenticado accede a su perfil', async ({ page }) => {
    const slug = await loginAsVendor(page, SLUG);
    await page.goto(`/${slug}/vendor/perfil`);

    await expect(page.locator('app-page-header, h1, h2, form').first()).toBeVisible({
      timeout: 15000,
    });
  });
});
