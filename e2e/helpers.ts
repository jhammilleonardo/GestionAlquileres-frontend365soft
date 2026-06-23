import { Page, expect, test } from '@playwright/test';

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@365soft.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin365!';
export const TENANT_EMAIL = process.env.E2E_TENANT_EMAIL ?? 'maria.perez@gmail.com';
export const TENANT_PASSWORD = process.env.E2E_TENANT_PASSWORD ?? 'Inquilino365!';
export const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? 'jorge.villanueva@gmail.com';
export const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? 'Propietario365!';
// El portal de proveedores requiere un usuario con rol VENDOR sembrado en el
// tenant. El DevSeed siembra un proveedor demo con cuenta (rol VENDOR), así que
// hay defaults; se pueden sobreescribir por env para otros entornos.
export const VENDOR_EMAIL =
  process.env.E2E_VENDOR_EMAIL ?? 'proveedor.demo@gmail.com';
export const VENDOR_PASSWORD =
  process.env.E2E_VENDOR_PASSWORD ?? 'Proveedor365!';

export function hasVendorCredentials(): boolean {
  return VENDOR_EMAIL.length > 0 && VENDOR_PASSWORD.length > 0;
}

interface AdminLoginResponse {
  user: {
    tenant_slug?: string;
    [key: string]: unknown;
  };
}

/** Inyecta una sesión admin válida y espera el dashboard. Devuelve el slug del tenant. */
export async function loginAsAdmin(page: Page): Promise<string> {
  const session = await getAdminSession(page);
  const slug = session.user.tenant_slug ?? 'demo';

  // page.request comparte el almacén de cookies con el BrowserContext. El JWT
  // queda exclusivamente en la cookie HttpOnly emitida por el login.
  await page.goto('/');
  await page.evaluate(
    ({ user, tenantSlug }) => {
      localStorage.setItem('admin_user', JSON.stringify(user));
      localStorage.setItem('tenant_slug', tenantSlug);
      sessionStorage.setItem('tenant_slug', tenantSlug);
    },
    { user: session.user, tenantSlug: slug },
  );
  await page.goto(`/${slug}/dashboard`);
  await expect(page).toHaveURL(new RegExp(`/${slug}/dashboard`), {
    timeout: 15000,
  });

  return slug;
}

export async function getAdminSession(page: Page): Promise<AdminLoginResponse> {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/';
  const response = await postWithRetry(
    page,
    new URL('auth/login-admin', apiUrl).toString(),
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  );

  if (!response.ok()) {
    throw new Error(`No se pudo crear sesion E2E admin: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as AdminLoginResponse;
}

interface TenantLoginResponse {
  user: {
    tenant_slug?: string;
    tenantSlug?: string;
    [key: string]: unknown;
  };
}

interface OwnerLoginResponse {
  user: {
    tenant_slug?: string;
    [key: string]: unknown;
  };
}

export async function loginAsTenant(page: Page, slug = 'demo'): Promise<string> {
  const session = await getTenantSession(page, slug);
  const tenantSlug = session.user.tenant_slug ?? session.user.tenantSlug ?? slug;

  await page.addInitScript(
    ({ user, slugValue }) => {
      localStorage.setItem('tenant_user', JSON.stringify(user));
      localStorage.setItem('tenant_slug', slugValue);
      sessionStorage.setItem('tenant_slug', slugValue);
    },
    { user: session.user, slugValue: tenantSlug },
  );

  return tenantSlug;
}

export async function loginAsOwner(page: Page, slug = 'demo'): Promise<string> {
  const session = await getOwnerSession(page, slug);
  const tenantSlug = session.user.tenant_slug ?? slug;

  await page.addInitScript(
    ({ user, slugValue }) => {
      localStorage.setItem('owner_user', JSON.stringify(user));
      localStorage.setItem('tenant_slug', slugValue);
      sessionStorage.setItem('tenant_slug', slugValue);
    },
    { user: session.user, slugValue: tenantSlug },
  );

  return tenantSlug;
}

export async function getTenantSession(
  page: Page,
  slug = 'demo',
): Promise<TenantLoginResponse> {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/';
  const response = await postWithRetry(
    page,
    new URL(`auth/${slug}/login`, apiUrl).toString(),
    { email: TENANT_EMAIL, password: TENANT_PASSWORD },
  );

  if (!response.ok()) {
    throw new Error(`No se pudo crear sesion E2E tenant: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as TenantLoginResponse;
}

export async function getOwnerSession(
  page: Page,
  slug = 'demo',
): Promise<OwnerLoginResponse> {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/';
  const response = await postWithRetry(
    page,
    new URL(`auth/${slug}/owner/login`, apiUrl).toString(),
    { email: OWNER_EMAIL, password: OWNER_PASSWORD },
  );

  if (!response.ok()) {
    throw new Error(`No se pudo crear sesion E2E owner: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as OwnerLoginResponse;
}

interface VendorLoginResponse {
  user: {
    tenant_slug?: string;
    [key: string]: unknown;
  };
}

export async function getVendorSession(
  page: Page,
  slug = 'demo',
): Promise<VendorLoginResponse> {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/';
  const response = await postWithRetry(
    page,
    new URL(`auth/${slug}/vendor/login`, apiUrl).toString(),
    { email: VENDOR_EMAIL, password: VENDOR_PASSWORD },
  );

  if (!response.ok()) {
    throw new Error(
      `No se pudo crear sesion E2E vendor: ${response.status()} ${await response.text()}`,
    );
  }

  return (await response.json()) as VendorLoginResponse;
}

export async function loginAsVendor(page: Page, slug = 'demo'): Promise<string> {
  const session = await getVendorSession(page, slug);
  const tenantSlug = session.user.tenant_slug ?? slug;

  await page.addInitScript(
    ({ user, slugValue }) => {
      localStorage.setItem('vendor_user', JSON.stringify(user));
      localStorage.setItem('tenant_slug', slugValue);
      sessionStorage.setItem('tenant_slug', slugValue);
    },
    { user: session.user, slugValue: tenantSlug },
  );

  return tenantSlug;
}

// ──────────────────────────────────────────────────────────────
// Aserciones reutilizables y robustas (independientes del estado de datos)
// ──────────────────────────────────────────────────────────────

/**
 * Verifica que una ruta renderiza una página "sana": app-root con contenido,
 * sin errores de routing/runtime y sin errores JS no capturados.
 * No depende de datos concretos, por lo que es estable en cualquier entorno.
 */
export async function expectHealthyRoute(page: Page, route: string): Promise<void> {
  const pageErrors: string[] = [];
  const onError = (error: Error): void => {
    pageErrors.push(error.message);
  };
  page.on('pageerror', onError);

  await test.step(`ruta ${route}`, async () => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('app-root')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);

    const appTextLength = await page.locator('app-root').evaluate((node) => {
      const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      return text.length;
    });

    expect(appTextLength, `app-root sin contenido visible en ${route}`).toBeGreaterThan(20);
    await expect(page.locator('body')).not.toHaveText(
      /cannot match any routes|application error|chunk load error|uncaught|runtimeerror/i,
    );
    expect(pageErrors, `errores JS en ${route}`).toEqual([]);
  });

  page.off('pageerror', onError);
}

/** Asegura que la página expone una cabecera/título (page-header, h1 o h2). */
export async function expectPageHeading(page: Page): Promise<void> {
  await expect(page.locator('app-page-header, h1, h2').first()).toBeVisible({ timeout: 15000 });
}

/** Cierra cualquier diálogo abierto buscando el botón de cierre/cancelar. */
export async function closeAnyDialog(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: /cerrar|cancelar|cancel|close/i }).first();
  if ((await closeButton.count()) > 0 && (await closeButton.isVisible())) {
    await closeButton.click();
  }
}

/**
 * GET resiliente a throttling: reintenta ante 429/5xx esperando a que la
 * ventana de rate-limit (60s/IP en backend local) libere cupo. Evita
 * falsos negativos cuando la suite completa satura el límite por IP.
 */
export async function getWithRetry(
  page: Page,
  url: string,
  options: { headers?: Record<string, string>; attempts?: number } = {},
): Promise<import('@playwright/test').APIResponse> {
  const attempts = options.attempts ?? 4;
  let lastResponse: import('@playwright/test').APIResponse | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await page.request.get(url, { headers: options.headers });
    if (response.ok()) return response;

    lastResponse = response;
    const transient = response.status() === 429 || response.status() >= 500;
    if (!transient || attempt === attempts - 1) return response;

    await page.waitForTimeout(Math.min(15000, 4000 * (attempt + 1)));
  }

  return lastResponse!;
}

/**
 * POST resiliente a throttling: reintenta ante 429/5xx (igual que getWithRetry).
 * Se usa en los logins de sesión para que una saturación temporal del
 * rate-limit por IP no produzca un falso negativo al crear la sesión E2E.
 */
export async function postWithRetry(
  page: Page,
  url: string,
  data: unknown,
  options: { attempts?: number } = {},
): Promise<import('@playwright/test').APIResponse> {
  const attempts = options.attempts ?? 4;
  let lastResponse: import('@playwright/test').APIResponse | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await page.request.post(url, { data });
    if (response.ok()) return response;

    lastResponse = response;
    const transient = response.status() === 429 || response.status() >= 500;
    if (!transient || attempt === attempts - 1) return response;

    await page.waitForTimeout(Math.min(15000, 4000 * (attempt + 1)));
  }

  return lastResponse!;
}
