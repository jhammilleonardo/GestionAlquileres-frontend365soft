import { Page, expect } from '@playwright/test';

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@365soft.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin365!';
export const TENANT_EMAIL = process.env.E2E_TENANT_EMAIL ?? 'maria.perez@gmail.com';
export const TENANT_PASSWORD = process.env.E2E_TENANT_PASSWORD ?? 'Inquilino365!';
export const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? 'jorge.villanueva@gmail.com';
export const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? 'Propietario365!';

interface AdminLoginResponse {
  access_token: string;
  user: {
    tenant_slug?: string;
    [key: string]: unknown;
  };
}

let cachedAdminSession: AdminLoginResponse | null = null;
let cachedTenantSession: TenantLoginResponse | null = null;
let cachedOwnerSession: OwnerLoginResponse | null = null;

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

interface TenantLoginResponse {
  access_token: string;
  user: {
    tenant_slug?: string;
    tenantSlug?: string;
    [key: string]: unknown;
  };
}

interface OwnerLoginResponse {
  access_token: string;
  user: {
    tenant_slug?: string;
    [key: string]: unknown;
  };
}

export async function loginAsTenant(page: Page, slug = 'demo'): Promise<string> {
  const session = await getTenantSession(page, slug);
  const tenantSlug = session.user.tenant_slug ?? session.user.tenantSlug ?? slug;

  await page.addInitScript(
    ({ token, user, slugValue }) => {
      localStorage.setItem('tenant_access_token', token);
      localStorage.setItem('tenant_user', JSON.stringify(user));
      localStorage.setItem('tenant_slug', slugValue);
      sessionStorage.setItem('tenant_slug', slugValue);
    },
    { token: session.access_token, user: session.user, slugValue: tenantSlug },
  );

  return tenantSlug;
}

export async function loginAsOwner(page: Page, slug = 'demo'): Promise<string> {
  const session = await getOwnerSession(page, slug);
  const tenantSlug = session.user.tenant_slug ?? slug;

  await page.addInitScript(
    ({ token, user, slugValue }) => {
      localStorage.setItem('owner_access_token', token);
      localStorage.setItem('owner_user', JSON.stringify(user));
      localStorage.setItem('tenant_slug', slugValue);
      sessionStorage.setItem('tenant_slug', slugValue);
    },
    { token: session.access_token, user: session.user, slugValue: tenantSlug },
  );

  return tenantSlug;
}

export async function getTenantSession(
  page: Page,
  slug = 'demo',
): Promise<TenantLoginResponse> {
  if (cachedTenantSession) return cachedTenantSession;

  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/';
  const response = await page.request.post(new URL(`auth/${slug}/login`, apiUrl).toString(), {
    data: { email: TENANT_EMAIL, password: TENANT_PASSWORD },
  });

  if (!response.ok()) {
    throw new Error(`No se pudo crear sesion E2E tenant: ${response.status()} ${await response.text()}`);
  }

  cachedTenantSession = (await response.json()) as TenantLoginResponse;
  return cachedTenantSession;
}

export async function getOwnerSession(
  page: Page,
  slug = 'demo',
): Promise<OwnerLoginResponse> {
  if (cachedOwnerSession) return cachedOwnerSession;

  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/';
  const response = await page.request.post(
    new URL(`auth/${slug}/owner/login`, apiUrl).toString(),
    {
      data: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
    },
  );

  if (!response.ok()) {
    throw new Error(`No se pudo crear sesion E2E owner: ${response.status()} ${await response.text()}`);
  }

  cachedOwnerSession = (await response.json()) as OwnerLoginResponse;
  return cachedOwnerSession;
}
