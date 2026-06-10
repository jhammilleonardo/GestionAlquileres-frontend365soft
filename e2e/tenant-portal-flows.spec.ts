import { expect, test } from '@playwright/test';
import { expectPageHeading, loginAsTenant } from './helpers';

const SLUG = process.env.E2E_TENANT_SLUG ?? 'demo';

test.describe('Portal inquilino — flujos', () => {
  test('dashboard del inquilino carga con sesión real', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/dashboard`);

    await expect(page.locator('.dashboard-container, app-page-header, h1, h2').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('body')).not.toHaveText(/cannot match any routes|application error/i);
  });

  test('pagos lista y permite abrir el formulario de nuevo pago', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/pagos`);

    await expectPageHeading(page);

    await page.goto(`/${slug}/portal/pagos/nuevo`);
    await expect(page.locator('form').first()).toBeVisible({ timeout: 15000 });
  });

  test('pago por QR renderiza el generador', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/pagos/qr`);

    await expect(page.locator('app-page-header, h1, h2, form').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('mantenimiento lista y permite abrir el formulario de nueva solicitud', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/mantenimiento`);

    await expectPageHeading(page);

    await page.goto(`/${slug}/portal/mantenimiento/nueva`);
    await expect(page.locator('form').first()).toBeVisible({ timeout: 15000 });
  });

  test('nueva solicitud de alquiler renderiza selección de propiedad', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/new-application`);

    await expect(
      page.locator('app-page-header, h1, h2, .property-card, app-empty-state, form').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('mis solicitudes, documentos, mensajes y notificaciones renderizan', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);

    for (const path of [
      'my-applications',
      'documentos',
      'mensajes',
      'notificaciones',
      'historial',
    ]) {
      await page.goto(`/${slug}/portal/${path}`);
      await expect(page.locator('app-page-header, h1, h2, app-empty-state').first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator('body')).not.toHaveText(
        /cannot match any routes|application error/i,
      );
    }
  });

  test('perfil del inquilino expone el formulario editable', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/perfil`);

    await expect(page.locator('form').first()).toBeVisible({ timeout: 15000 });
  });
});
