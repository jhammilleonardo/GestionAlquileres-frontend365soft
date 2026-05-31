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
  'proveedores',
  'gastos',
  'violaciones',
  'inspecciones',
  'reportes',
  'mensajes',
  'auditoria',
  'mi-sitio-web',
];

test('navega por los módulos nuevos desde el sidebar', async ({ page }) => {
  const slug = await loginAsAdmin(page);

  for (const path of MODULE_PATHS) {
    const link = page.locator(`a[href$="/${slug}/${path}"]`).first();
    await expect(link, `enlace de ${path} en el sidebar`).toBeVisible({ timeout: 10000 });
    await link.click();
    await expect(page, `ruta de ${path}`).toHaveURL(new RegExp(`/${path}$`), { timeout: 10000 });
    // No debe quedar en una pantalla en blanco: el contenedor principal sigue presente
    await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible({ timeout: 10000 });
  }
});
