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

  test('credenciales inválidas no autentican', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill('wrong-password');
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    // Permanece en la página de login
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
