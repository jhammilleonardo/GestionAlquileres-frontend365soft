import { expect, test, type Page } from '@playwright/test';

import {
  expectHealthyRoute,
  loginAsAdmin,
  loginAsOwner,
  loginAsTenant,
} from './helpers';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/';
const SLUG = process.env.E2E_TENANT_SLUG ?? 'demo';

test.describe('Smoke de rutas — portal público', () => {
  test('todas las rutas públicas renderizan sin pantalla blanca', async ({ page }) => {
    const propertyId = await getFirstPublicPropertyId(page);
    const routes = [
      `/${SLUG}/publico/inicio`,
      `/${SLUG}/publico/propiedades`,
      `/${SLUG}/publico/mapa`,
      `/${SLUG}/publico/nosotros`,
      `/${SLUG}/publico/contacto`,
      `/${SLUG}/publico/faq`,
      ...(propertyId
        ? [
            `/${SLUG}/publico/propiedades/${propertyId}`,
            `/${SLUG}/publico/solicitud/${propertyId}`,
          ]
        : []),
    ];

    for (const route of routes) {
      await expectHealthyRoute(page, route);
    }
  });

  test('landing y auth pública renderizan', async ({ page }) => {
    for (const route of ['/', '/login', '/register', '/forgot-password', `/${SLUG}/login`]) {
      await expectHealthyRoute(page, route);
    }
  });
});

test.describe('Smoke de rutas — panel admin', () => {
  test('todos los módulos admin renderizan sin pantalla blanca', async ({ page }) => {
    const slug = await loginAsAdmin(page);
    const routes = [
      `/${slug}/dashboard`,
      `/${slug}/propiedades`,
      `/${slug}/inquilinos`,
      `/${slug}/contratos`,
      `/${slug}/contratos/nuevo`,
      `/${slug}/solicitudes`,
      `/${slug}/pagos`,
      `/${slug}/mantenimiento`,
      `/${slug}/reportes`,
      `/${slug}/proveedores`,
      `/${slug}/gastos`,
      `/${slug}/violaciones`,
      `/${slug}/inspecciones`,
      `/${slug}/auditoria`,
      `/${slug}/mensajes`,
      `/${slug}/mi-sitio-web`,
      `/${slug}/empleados`,
      `/${slug}/configuracion`,
      `/${slug}/notificaciones`,
      `/${slug}/perfil`,
    ];

    for (const route of routes) {
      await expectHealthyRoute(page, route);
    }
  });
});

test.describe('Smoke de rutas — portal inquilino', () => {
  test('todas las rutas del inquilino renderizan con sesión real', async ({ page }) => {
    const slug = await loginAsTenant(page, SLUG);
    const routes = [
      `/${slug}/portal/home`,
      `/${slug}/portal/dashboard`,
      `/${slug}/portal/new-application`,
      `/${slug}/portal/my-applications`,
      `/${slug}/portal/pagos`,
      `/${slug}/portal/pagos/nuevo`,
      `/${slug}/portal/pagos/qr`,
      `/${slug}/portal/mantenimiento`,
      `/${slug}/portal/mantenimiento/nueva`,
      `/${slug}/portal/documentos`,
      `/${slug}/portal/mensajes`,
      `/${slug}/portal/notificaciones`,
      `/${slug}/portal/historial`,
      `/${slug}/portal/perfil`,
    ];

    for (const route of routes) {
      await expectHealthyRoute(page, route);
    }
  });
});

test.describe('Smoke de rutas — portal propietario', () => {
  test('login y dashboard del propietario renderizan', async ({ page }) => {
    await expectHealthyRoute(page, `/${SLUG}/owner/login`);

    const slug = await loginAsOwner(page, SLUG);
    await expectHealthyRoute(page, `/${slug}/owner`);
  });
});

test.describe('Smoke de rutas — portal proveedor', () => {
  test('login del proveedor renderiza y la ruta protegida redirige a login', async ({ page }) => {
    await expectHealthyRoute(page, `/${SLUG}/vendor/login`);

    // Sin sesión, /vendor debe redirigir a /vendor/login (guard de proveedor).
    await page.goto(`/${SLUG}/vendor`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/vendor\/login/, { timeout: 15000 });
  });
});

async function getFirstPublicPropertyId(page: Page): Promise<number | null> {
  const response = await page.request.get(
    new URL(`${SLUG}/catalog/properties?limit=1`, API_URL).toString(),
  );

  if (!response.ok()) return null;

  const body = (await response.json()) as { data?: Array<{ id?: number }> };
  return body.data?.[0]?.id ?? null;
}
