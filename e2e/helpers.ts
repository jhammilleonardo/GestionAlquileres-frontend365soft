import { Page, expect } from '@playwright/test';

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@365soft.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin365!';

interface AdminLoginResponse {
  access_token: string;
  user: {
    tenant_slug?: string;
    [key: string]: unknown;
  };
}

let cachedAdminSession: AdminLoginResponse | null = null;

/** Inyecta una sesión admin válida y espera el dashboard. Devuelve el slug del tenant. */
export async function loginAsAdmin(page: Page): Promise<string> {
  const session = await getAdminSession(page);
  const slug = session.user.tenant_slug ?? 'demo';

  await page.goto('/');
  await page.evaluate(
    ({ token, user, tenantSlug }) => {
      localStorage.setItem('admin_access_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      localStorage.setItem('tenant_slug', tenantSlug);
      sessionStorage.setItem('tenant_slug', tenantSlug);
    },
    { token: session.access_token, user: session.user, tenantSlug: slug },
  );
  await page.goto(`/${slug}/dashboard`);
  await expect(page).toHaveURL(new RegExp(`/${slug}/dashboard`), { timeout: 15000 });

  return slug;
}

export async function getAdminSession(page: Page): Promise<AdminLoginResponse> {
  if (cachedAdminSession) return cachedAdminSession;

  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/';
  const response = await page.request.post(new URL('auth/login-admin', apiUrl).toString(), {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  if (!response.ok()) {
    throw new Error(`No se pudo crear sesion E2E admin: ${response.status()} ${await response.text()}`);
  }

  cachedAdminSession = (await response.json()) as AdminLoginResponse;
  return cachedAdminSession;
}
