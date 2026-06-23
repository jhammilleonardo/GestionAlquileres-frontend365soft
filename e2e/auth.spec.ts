import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@365soft.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin365!';

/**
 * Flujo crítico: inicio de sesión del administrador.
 * Verifica que con credenciales válidas se llega al dashboard del tenant.
 */
test.describe('Autenticación admin', () => {
  test('login válido lleva al dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    // El admin se monta en /:slug — el dashboard queda en /:slug/dashboard
    await expect(page).toHaveURL(/\/[^/]+\/dashboard/, { timeout: 15000 });
  });

  test('la sesión HttpOnly sobrevive una recarga sin JWT en storage', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    await expect(page).toHaveURL(/\/[^/]+\/dashboard/, { timeout: 15000 });
    const protectedUrl = page.url();

    const storedTokens = await page.evaluate(() => ({
      local: localStorage.getItem('admin_access_token'),
      session: sessionStorage.getItem('admin_access_token'),
      user:
        localStorage.getItem('admin_user') ??
        sessionStorage.getItem('admin_user'),
    }));
    expect(storedTokens.local).toBeNull();
    expect(storedTokens.session).toBeNull();
    expect(storedTokens.user).not.toBeNull();

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(protectedUrl, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('renueva automáticamente una sesión cuyo access token expiró', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    await expect(page).toHaveURL(/\/[^/]+\/dashboard/, { timeout: 15000 });
    const protectedUrl = page.url();
    const context = page.context();
    const refreshBefore = (await context.cookies()).find(
      (cookie) => cookie.name === 'refresh_token',
    )?.value;
    expect(refreshBefore).toBeTruthy();

    // Simula la expiración del JWT corto sin tocar refresh ni CSRF.
    await context.clearCookies({ name: 'access_token' });
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(protectedUrl, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);
    await expect
      .poll(async () => (await context.cookies()).some((cookie) => cookie.name === 'access_token'))
      .toBe(true);

    const refreshAfter = (await context.cookies()).find(
      (cookie) => cookie.name === 'refresh_token',
    )?.value;
    expect(refreshAfter).toBeTruthy();
    expect(refreshAfter).not.toBe(refreshBefore);
  });

  test('credenciales inválidas no autentican', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill('wrong-password');
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    // Permanece en la página de login
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
