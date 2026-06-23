import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

/**
 * Smoke E2E: tras login, navegar dentro del SPA (clic en el sidebar) a los módulos
 * nuevos y verificar que la ruta carga sin crashear. Cubre las rutas entregadas y
 * detecta regresiones de routing (este test ya detectó navegaciones con prefijo
 * '/admin' incorrecto que fueron corregidas).
 *
 * Se navega in-app (sin hard reload) porque la sesión vive en sessionStorage.
 */
const MODULE_PATHS = [
  { path: 'proveedores', sectionIndex: 3 },
  { path: 'gastos', sectionIndex: 2 },
  { path: 'violaciones', sectionIndex: 3 },
  { path: 'inspecciones', sectionIndex: 3 },
  { path: 'reportes', sectionIndex: 2 },
  { path: 'mensajes', sectionIndex: 3 },
  { path: 'auditoria', sectionIndex: 4 },
  { path: 'mi-sitio-web', sectionIndex: 4 },
];

test('navega por los módulos nuevos desde el sidebar', async ({ page }) => {
  const slug = await loginAsAdmin(page);

  for (const { path, sectionIndex } of MODULE_PATHS) {
    const section = page.locator(
      `.nav-group-trigger[aria-controls="sidebar-section-${sectionIndex}"]`,
    );
    if ((await section.getAttribute('aria-expanded')) !== 'true') {
      await section.click();
    }

    const link = page.locator(`a[href$="/${slug}/${path}"]`).first();
    await expect(link, `enlace de ${path} en el sidebar`).toBeVisible({ timeout: 10000 });
    await link.click();
    await expect(page, `ruta de ${path}`).toHaveURL(new RegExp(`/${path}$`), { timeout: 10000 });
    // No debe quedar en una pantalla en blanco: el contenedor principal sigue presente
    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible({ timeout: 10000 });
  }

  const openSectionsBeforeReload = await page
    .locator('.nav-group-trigger[aria-expanded="true"]')
    .evaluateAll((triggers) => triggers.map((trigger) => trigger.getAttribute('aria-controls')));
  expect(openSectionsBeforeReload.length).toBeGreaterThan(1);

  await page.reload();
  for (const panelId of openSectionsBeforeReload) {
    await expect(page.locator(`[aria-controls="${panelId}"]`)).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  }

  await page.locator('.menu-btn').click();
  await expect(page.locator('app-sidebar .sidebar')).toHaveClass(/is-collapsed/);
  await expect(page.locator('.nav-group-panel')).toHaveCount(0);

  await page.locator('.nav-group-trigger[aria-controls="sidebar-section-2"]').click();
  await expect(page.locator('app-sidebar .sidebar')).not.toHaveClass(/is-collapsed/);
  await expect(page.locator('#sidebar-section-2')).toBeVisible();
});
