import { expect, test, Page } from '@playwright/test';
import { getAdminSession, loginAsAdmin, loginAsOwner } from './helpers';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/';

test.describe('Modulos operativos admin', () => {
  test('reports permite filtrar y navegar entre vistas', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/reportes`);

    await expect(page.getByRole('heading', { name: /reportes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /recargar/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /rent roll/i })).toBeVisible();

    await page.getByRole('radio', { name: /vacancias/i }).click();
    await expect(page.getByRole('radio', { name: /vacancias/i })).toHaveClass(/active/);

    await page.getByRole('radio', { name: /morosidad/i }).click();
    await expect(page.getByRole('radio', { name: /morosidad/i })).toHaveClass(/active/);

    await page.getByRole('radio', { name: /p&l/i }).click();
    await expect(page.getByRole('radio', { name: /p&l/i })).toHaveClass(/active/);

    await page.getByRole('button', { name: /aplicar/i }).click();
    await expect(page.locator('app-empty-state, app-table').first()).toBeVisible();
  });

  test('reports exporta PDF y Excel reales desde backend', async ({ page }) => {
    const session = await getAdminSession(page);
    const slug = session.user.tenant_slug ?? 'demo';
    const reports = [
      'rent-roll',
      'vacancies',
      'delinquency',
      'pnl',
      'maintenance',
      'owners',
      'cash-flow',
      'budget-vs-actual',
      'kpis',
    ];

    for (const report of reports) {
      const pdf = await page.request.get(
        new URL(`${slug}/admin/reports/${report}?format=pdf`, API_URL).toString(),
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      expect(pdf.ok(), `${report} PDF export failed`).toBe(true);
      expect(pdf.headers()['content-type']).toContain('application/pdf');
      expect((await pdf.body()).byteLength).toBeGreaterThan(100);

      const excel = await page.request.get(
        new URL(`${slug}/admin/reports/${report}?format=excel`, API_URL).toString(),
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      expect(excel.ok(), `${report} Excel export failed`).toBe(true);
      expect(excel.headers()['content-type']).toContain('spreadsheetml.sheet');
      expect((await excel.body()).byteLength).toBeGreaterThan(100);
    }
  });

  test('vendors abre formulario e historial/detalle si hay registros', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/proveedores`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await page.getByRole('button', { name: /nuevo|new/i }).click();
    await expect(page.getByRole('dialog', { name: /proveedor/i })).toBeVisible();
    await expect(page.getByLabel(/nombre/i).first()).toBeVisible();

    await closeDialog(page);
    const detailButton = page.getByRole('button', { name: /detalle|ver|historial/i }).first();
    if ((await detailButton.count()) > 0) {
      await detailButton.click();
      await expect(page.locator('app-vendor-detail-panel').first()).toBeVisible();
    }
  });

  test('expenses abre formulario y expone resumen contable', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/gastos`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await expect(page.locator('app-expense-balance-card').first()).toBeVisible();

    await page.getByRole('button', { name: /registrar gasto|nuevo|new/i }).click();
    await expect(page.getByRole('dialog', { name: /gasto/i })).toBeVisible();
    await expect(page.getByLabel(/monto|amount/i).first()).toBeVisible();
  });

  test('violations abre formulario y filtros', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/violaciones`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await expect(page.locator('app-violation-filters').first()).toBeVisible();

    await page.getByRole('button', { name: /registrar violación|nueva|new/i }).click();
    await expect(page.getByRole('dialog', { name: /violación/i })).toBeVisible();
    await expect(page.getByLabel(/tipo|type/i).first()).toBeVisible();
  });

  test('inspections abre crear y comparar', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    await page.goto(`/${slug}/inspecciones`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible();
    await page.getByRole('button', { name: /comparar|compare/i }).click();
    await expect(page.getByRole('dialog', { name: /comparar/i })).toBeVisible();

    await closeDialog(page);
    await page.getByRole('button', { name: /nueva|new/i }).click();
    await expect(page.getByRole('dialog', { name: /inspección/i })).toBeVisible();
    await expect(page.getByLabel(/tipo|type/i).first()).toBeVisible();
  });
});

test.describe('Owner portal', () => {
  test('login propietario carga y ruta protegida redirige a login', async ({ page }) => {
    await page.goto('/demo/owner');
    await expect(page).toHaveURL(/\/demo\/owner\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByLabel(/correo/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test('propietario autenticado navega dashboard, mantenimiento, statements y contratos', async ({
    page,
  }) => {
    const slug = await loginAsOwner(page);
    await page.goto(`/${slug}/owner`);

    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('body')).not.toHaveText(/cannot match any routes|application error/i);

    await page.getByRole('button', { name: /propiedades|properties/i }).click();
    await expect(page.locator('app-empty-state, .owner-card, .property-card').first()).toBeVisible();

    await page.getByRole('button', { name: /liquidaciones|statements/i }).click();
    await expect(page.locator('app-empty-state, table, .statement-card').first()).toBeVisible();

    const statementPdf = page.getByRole('button', { name: /pdf|descargar|download/i }).first();
    if ((await statementPdf.count()) > 0) {
      await expect(statementPdf).toBeVisible();
    }

    await page.getByRole('button', { name: /mantenimiento|maintenance/i }).click();
    await expect(page.locator('app-empty-state, .maintenance-card, table').first()).toBeVisible();

    const authorizeButton = page
      .getByRole('button', { name: /autorizar|authorize/i })
      .first();
    if ((await authorizeButton.count()) > 0) {
      await expect(authorizeButton).toBeVisible();
    }

    await page.getByRole('button', { name: /contratos|contracts/i }).click();
    await expect(page.locator('app-empty-state, table, .contract-card').first()).toBeVisible();
  });
});

async function closeDialog(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: /cerrar|cancelar|cancel/i }).first();
  if ((await closeButton.count()) > 0) {
    await closeButton.click();
  }
}
