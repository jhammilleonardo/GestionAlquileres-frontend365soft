import { expect, test } from '@playwright/test';
import { getAdminSession, getWithRetry } from './helpers';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/';

/**
 * E2E de la API de contabilidad (Fase F4). No hay UI todavía, así que se prueba
 * a nivel de API contra el backend + base de datos reales. Las aserciones de
 * invariantes (balanza cuadrada, balance general cuadrado) se cumplen incluso
 * con cero asientos, por lo que el test es robusto ante el estado de los datos.
 */
test.describe('Contabilidad — API F4', () => {
  test('expone el plan de cuentas con las cuentas del sistema', async ({
    page,
  }) => {
    const session = await getAdminSession(page);
    const slug = session.user.tenant_slug ?? 'demo';

    const res = await getWithRetry(
      page,
      new URL(`${slug}/admin/accounting/chart-of-accounts`, API_URL).toString(),
    );
    expect(res.ok()).toBe(true);

    const accounts = (await res.json()) as Array<{ code: string; type: string }>;
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThan(0);
    // Cuenta base obligatoria del plan sembrado por el provisioning.
    expect(accounts.some((a) => a.code === '1100')).toBe(true);
  });

  test('libro diario responde paginado', async ({ page }) => {
    const session = await getAdminSession(page);
    const slug = session.user.tenant_slug ?? 'demo';

    const res = await getWithRetry(
      page,
      new URL(`${slug}/admin/accounting/journal-entries`, API_URL).toString(),
    );
    expect(res.ok()).toBe(true);

    const body = (await res.json()) as { data: unknown[]; total: number };
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  test('la balanza de comprobación cuadra (debe = haber)', async ({ page }) => {
    const session = await getAdminSession(page);
    const slug = session.user.tenant_slug ?? 'demo';

    const res = await getWithRetry(
      page,
      new URL(`${slug}/admin/accounting/trial-balance`, API_URL).toString(),
    );
    expect(res.ok()).toBe(true);

    const tb = (await res.json()) as {
      total_debit: number;
      total_credit: number;
      balanced: boolean;
    };
    expect(tb.balanced).toBe(true);
    expect(tb.total_debit).toBe(tb.total_credit);
  });

  test('el balance general cumple Activo = Pasivo + Patrimonio', async ({
    page,
  }) => {
    const session = await getAdminSession(page);
    const slug = session.user.tenant_slug ?? 'demo';

    const res = await getWithRetry(
      page,
      new URL(`${slug}/admin/accounting/balance-sheet`, API_URL).toString(),
    );
    expect(res.ok()).toBe(true);

    const bs = (await res.json()) as { balanced: boolean };
    expect(bs.balanced).toBe(true);
  });

  test('el estado de resultados expone ingresos, gastos y resultado neto', async ({
    page,
  }) => {
    const session = await getAdminSession(page);
    const slug = session.user.tenant_slug ?? 'demo';

    const res = await getWithRetry(
      page,
      new URL(`${slug}/admin/accounting/income-statement`, API_URL).toString(),
    );
    expect(res.ok()).toBe(true);

    const is = (await res.json()) as {
      income: unknown[];
      expenses: unknown[];
      net_income: number;
    };
    expect(Array.isArray(is.income)).toBe(true);
    expect(Array.isArray(is.expenses)).toBe(true);
    expect(typeof is.net_income).toBe('number');
  });

  test('el libro mayor de una cuenta responde con su estructura', async ({
    page,
  }) => {
    const session = await getAdminSession(page);
    const slug = session.user.tenant_slug ?? 'demo';

    const res = await getWithRetry(
      page,
      new URL(
        `${slug}/admin/accounting/general-ledger?accountCode=1100`,
        API_URL,
      ).toString(),
    );
    expect(res.ok()).toBe(true);

    const ledger = (await res.json()) as {
      account_code: string;
      lines: unknown[];
    };
    expect(ledger.account_code).toBe('1100');
    expect(Array.isArray(ledger.lines)).toBe(true);
  });
});
