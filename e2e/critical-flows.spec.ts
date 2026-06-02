import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Flujos críticos admin', () => {
  test('pagos expone aprobacion, rechazo y registro manual', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/pagos`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /registrar|register/i })).toBeVisible();

    const pendingApprove = page.getByRole('button', { name: /aprobar|approve/i }).first();
    const pendingReject = page.getByRole('button', { name: /rechazar|reject/i }).first();
    if ((await pendingApprove.count()) > 0) {
      await expect(pendingApprove).toBeVisible();
      await expect(pendingReject).toBeVisible();
    }
  });

  test('solicitudes expone detalle y acciones de aprobacion/rechazo cuando hay datos', async ({
    page,
  }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/solicitudes`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    const firstDetailLink = page.locator('a[href*="/solicitudes/"]').first();

    if ((await firstDetailLink.count()) === 0) {
      return;
    }

    await firstDetailLink.click();
    await expect(page).toHaveURL(/\/solicitudes\/\d+/, { timeout: 10000 });
    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /aprobar|approve|rechazar|reject/i }).first(),
    ).toBeVisible();
  });

  test('propiedades permite abrir el formulario de creacion', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/propiedades`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await page.getByRole('button', { name: /nueva|crear|agregar|new/i }).first().click();
    await expect(page.getByRole('heading', { name: /nueva propiedad/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('contratos permite abrir creacion y navegar a detalle si existe un contrato', async ({
    page,
  }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/contratos`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await page.getByRole('button', { name: /nuevo|crear|new/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/${slug}/contratos/nuevo`), { timeout: 10000 });
    await expect(page.locator('form, app-loading-state').first()).toBeVisible();

    await page.goto(`/${slug}/contratos`);
    const detailLink = page.locator('a[href*="/contratos/"]').first();
    if ((await detailLink.count()) > 0) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/contratos\/\d+/, { timeout: 10000 });
      await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    }
  });

  test('mantenimiento carga y expone acciones o estado vacio', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/mantenimiento`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await expectAnyVisible(page, [
      'button:has-text("Nueva")',
      'button:has-text("Crear")',
      'app-empty-state',
      'table',
      '.maintenance-card',
      'text=No hay solicitudes',
    ]);
  });
});

async function expectAnyVisible(page: Page, selectors: string[]): Promise<void> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      await expect(locator).toBeVisible({ timeout: 10000 });
      return;
    }
  }

  throw new Error(`No visible selector found: ${selectors.join(', ')}`);
}
