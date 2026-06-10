import { test, expect } from '@playwright/test';
import { expectPageHeading, loginAsAdmin } from './helpers';

test.describe('Flujos críticos admin', () => {
  test('pagos expone aprobacion, rechazo y registro manual', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/pagos`);

    await expectPageHeading(page);
    await expect(page.getByRole('button', { name: /registrar|register/i }).first()).toBeVisible();

    const pendingApprove = page.getByRole('button', { name: /aprobar|approve/i }).first();
    const pendingReject = page.getByRole('button', { name: /rechazar|reject/i }).first();
    if ((await pendingApprove.count()) > 0) {
      await expect(pendingApprove).toBeVisible();
      await expect(pendingReject).toBeVisible();
    }
  });

  test('solicitudes lista y el detalle expone estado y acciones segun corresponda', async ({
    page,
  }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/solicitudes`);

    await expectPageHeading(page);
    const firstDetailLink = page.locator('a[href*="/solicitudes/"]').first();

    if ((await firstDetailLink.count()) === 0) {
      // Sin datos: la página debe seguir sana (encabezado o estado vacío).
      await expect(
        page.locator('app-page-header, app-empty-state, h1, h2').first(),
      ).toBeVisible();
      return;
    }

    await firstDetailLink.click();
    await expect(page).toHaveURL(/\/solicitudes\/\d+/, { timeout: 10000 });

    // El detalle siempre muestra encabezado y el badge de estado.
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.locator('app-status-badge').first()).toBeVisible({ timeout: 10000 });

    // Aprobar/Rechazar solo existen si la solicitud está pendiente; si están,
    // deben ser visibles (pueden renderizarse como botón o enlace con routerLink).
    const action = page
      .getByRole('button', { name: /aprobar|approve|rechazar|reject/i })
      .or(page.getByRole('link', { name: /aprobar|approve|rechazar|reject/i }))
      .first();
    if ((await action.count()) > 0) {
      await expect(action).toBeVisible();
    }
  });

  test('propiedades permite abrir el formulario de creacion', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/propiedades`);

    await expectPageHeading(page);
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

    await expectPageHeading(page);
    await page.getByRole('button', { name: /nuevo|crear|new/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/${slug}/contratos/nuevo`), { timeout: 10000 });
    await expect(page.locator('form, app-loading-state').first()).toBeVisible();

    await page.goto(`/${slug}/contratos`);
    const detailLink = page.locator('a[href*="/contratos/"]').first();
    if ((await detailLink.count()) > 0) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/contratos\/\d+/, { timeout: 10000 });
      await expectPageHeading(page);
    }
  });

  test('mantenimiento carga estadisticas, filtros y lista o estado vacio', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/mantenimiento`);

    await expectPageHeading(page);
    // Las tarjetas de estadísticas y la barra de filtros están siempre presentes.
    await expect(page.locator('.stat-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.filters-card, .filter-bar').first()).toBeVisible();
    // El contenedor de solicitudes muestra la grilla o el estado vacío.
    await expect(
      page.locator('.requests-grid, .empty-state, .request-card').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
