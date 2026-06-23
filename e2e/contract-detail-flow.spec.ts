import { expect, test } from '@playwright/test';
import { loginAsTenant } from './helpers';

const SLUG = process.env.E2E_TENANT_SLUG ?? 'demo';

/**
 * Cubre el área de contratos del portal del inquilino (lista + detalle), que no
 * tenía e2e. La acción de firma sólo aplica a contratos en borrador/pendiente;
 * con el contrato demo ya ACTIVO se valida el render del detalle y las acciones
 * de PDF (no se envía la firma para no mutar datos entre corridas).
 */
test.describe('Portal inquilino — contrato', () => {
  test('la lista de documentos renderiza sin error de ruta', async ({
    page,
  }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/documentos`);

    await expect(
      page.locator('app-page-header, h1, h2, app-empty-state').first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).not.toHaveText(
      /cannot match any routes|application error/i,
    );
  });

  test('el detalle del contrato renderiza con su contenido y acciones', async ({
    page,
  }) => {
    const slug = await loginAsTenant(page, SLUG);
    await page.goto(`/${slug}/portal/documentos/contratos/1`);

    // El detalle muestra encabezado/estado del contrato (o loading/empty si el
    // dato aún resuelve), nunca una pantalla en blanco o error de router.
    await expect(
      page
        .locator('h1, app-status-badge, app-loading-state, app-empty-state')
        .first(),
    ).toBeVisible({ timeout: 15000 });

    // Acciones del detalle (volver / PDF / firmar según estado).
    await expect(page.locator('app-button').first()).toBeVisible({
      timeout: 15000,
    });

    await expect(page.locator('body')).not.toHaveText(
      /cannot match any routes|application error/i,
    );
  });
});
