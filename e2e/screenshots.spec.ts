import { test } from '@playwright/test';
import { loginAsAdmin, loginAsTenant } from './helpers';

const OUT = '/tmp/shots';

test.use({ viewport: { width: 1366, height: 900 } });

test('admin: reservas (analytics + lista)', async ({ page }) => {
  const slug = await loginAsAdmin(page);
  await page.goto(`/${slug}/reservas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/01-admin-reservas.png`, fullPage: true });
});

test('admin: reseñas', async ({ page }) => {
  const slug = await loginAsAdmin(page);
  await page.goto(`/${slug}/resenas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/02-admin-resenas.png`, fullPage: true });
});

test('admin: limpieza', async ({ page }) => {
  const slug = await loginAsAdmin(page);
  await page.goto(`/${slug}/limpieza`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/03-admin-limpieza.png`, fullPage: true });
});

test('inquilino: mis reservas', async ({ page }) => {
  const slug = await loginAsTenant(page);
  await page.goto(`/${slug}/portal/reservas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/04-portal-mis-reservas.png`, fullPage: true });
});

test('público: detalle con rating', async ({ page }) => {
  await page.goto('/demo/publico/propiedades/6', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/05-publico-rating.png`, fullPage: true });
});
