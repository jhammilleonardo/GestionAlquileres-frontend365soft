import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración E2E (Playwright).
 *
 * Por defecto apunta al frontend local en :4200. En CI/staging se sobreescribe
 * con E2E_BASE_URL (ej. https://staging.365soft.com) para correr antes de cada deploy.
 *
 * Usa el Chrome del sistema (channel: 'chrome') para no descargar binarios.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
