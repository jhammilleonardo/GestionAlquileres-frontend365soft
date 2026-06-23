import { expect, test } from '@playwright/test';

const BRANDING = {
  company_name: 'Demo',
  logo_url: null,
  hero_image_url: null,
  hero_title: null,
  hero_subtitle: null,
  about_content: null,
  faq_items: [],
  primary_color: '#2563eb',
  secondary_color: '#0f172a',
  company_description: 'Portal público',
  contact_email: null,
  contact_phone: null,
  social_links: {},
  meta_title: null,
  meta_description: null,
  is_published: true,
};

test.describe('Aislamiento del portal público', () => {
  test('un 401 público con una sesión admin obsoleta no redirige al login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_user', '{"id":"1","tenant_slug":"demo"}');
    });
    await page.route('**/demo/catalog/website', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/demo/publico/inicio');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/demo\/publico\/inicio$/);
    await expect(page.locator('app-public-layout, app-home').first()).toBeVisible();
  });

  test('los usuarios sociales se renderizan como enlaces externos absolutos', async ({ page }) => {
    await page.route('**/demo/catalog/website', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...BRANDING,
          social_links: {
            facebook: 'mi.pagina',
            instagram: '@mi_cuenta',
            whatsapp: '+591 700-00-000',
          },
        }),
      }),
    );

    await page.goto('/demo/publico/inicio');

    await expect(page.locator('footer a[title="Facebook"]')).toHaveAttribute(
      'href',
      'https://www.facebook.com/mi.pagina',
    );
    await expect(page.locator('footer a[title="Instagram"]')).toHaveAttribute(
      'href',
      'https://www.instagram.com/mi_cuenta',
    );
    await expect(page.locator('footer a[title="WhatsApp"]')).toHaveAttribute(
      'href',
      'https://wa.me/59170000000',
    );
  });
});
