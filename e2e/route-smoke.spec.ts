import { expect, test, type Page } from '@playwright/test';

import { loginAsAdmin, loginAsOwner, loginAsTenant } from './helpers';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/';
const SLUG = process.env.E2E_TENANT_SLUG ?? 'demo';

test.describe('Smoke de rutas principales', () => {
  test('portal publico no deja rutas blancas', async ({ page }) => {
    const propertyId = await getFirstPublicPropertyId(page);
    const routes = [
      `/${SLUG}/publico/inicio`,
      `/${SLUG}/publico/propiedades`,
      `/${SLUG}/publico/mapa`,
      `/${SLUG}/publico/contacto`,
      `/${SLUG}/publico/faq`,
      ...(propertyId ? [`/${SLUG}/publico/propiedades/${propertyId}`] : []),
    ];

    for (const route of routes) {
      await expectHealthyRoute(page, route);
    }
  });

  test('admin no deja rutas blancas en modulos principales', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    const routes = [
      `/${slug}/dashboard`,
      `/${slug}/propiedades`,
      `/${slug}/contratos`,
      `/${slug}/solicitudes`,
      `/${slug}/pagos`,
      `/${slug}/mantenimiento`,
      `/${slug}/reportes`,
      `/${slug}/proveedores`,
      `/${slug}/gastos`,
      `/${slug}/violaciones`,
      `/${slug}/inspecciones`,
      `/${slug}/empleados`,
      `/${slug}/configuracion`,
      `/${slug}/perfil`,
    ];

    for (const route of routes) {
      await expectHealthyRoute(page, route);
    }
  });

  test('portal tenant no deja rutas blancas con sesion real', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    const routes = [
      `/${slug}/portal/home`,
      `/${slug}/portal/dashboard`,
      `/${slug}/portal/pagos`,
      `/${slug}/portal/mantenimiento`,
      `/${slug}/portal/documentos`,
      `/${slug}/portal/mensajes`,
      `/${slug}/portal/notificaciones`,
      `/${slug}/portal/perfil`,
    ];

    for (const route of routes) {
      await expectHealthyRoute(page, route);
    }
  });

  test('owner portal no deja rutas blancas en login ni dashboard autenticado', async ({
    page,
  }) => {
    await expectHealthyRoute(page, `/${SLUG}/owner/login`);

    const authenticatedPage = page.context().pages()[0] ?? page;
    const slug = await loginAsOwner(authenticatedPage, SLUG);
    await expectHealthyRoute(authenticatedPage, `/${slug}/owner`);
  });
});

async function expectHealthyRoute(page: Page, route: string): Promise<void> {
  const pageErrors: string[] = [];
  page.once('pageerror', (error) => pageErrors.push(error.message));

  await test.step(`ruta ${route}`, async () => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);

    const appTextLength = await page.locator('app-root').evaluate((node) => {
      const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      return text.length;
    });

    expect(appTextLength, `app-root sin contenido visible en ${route}`).toBeGreaterThan(20);
    await expect(page.locator('body')).not.toHaveText(
      /cannot match any routes|application error|chunk load error|uncaught|runtimeerror/i,
    );
    expect(pageErrors, `errores JS en ${route}`).toEqual([]);
  });
}

async function getFirstPublicPropertyId(page: Page): Promise<number | null> {
  const response = await page.request.get(
    new URL(`${SLUG}/catalog/properties?limit=1`, API_URL).toString(),
  );

  if (!response.ok()) return null;

  const body = (await response.json()) as { data?: Array<{ id?: number }> };
  return body.data?.[0]?.id ?? null;
}
