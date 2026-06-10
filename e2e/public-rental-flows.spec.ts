import { expect, test, type Page } from '@playwright/test';
import { getWithRetry } from './helpers';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/';
const SLUG = process.env.E2E_TENANT_SLUG ?? 'demo';

interface CatalogProperty {
  id: number;
  title: string;
  rental_type?: string | null;
  monthly_rent?: number | string | null;
  min_price_per_night?: number | string | null;
  available_short_term_units?: number | string | null;
  available_long_term_units?: number | string | null;
  units?: CatalogUnit[];
}

interface CatalogResponse {
  data?: CatalogProperty[];
}

interface CatalogUnit {
  id: number;
  unit_number: string;
  rental_type?: string | null;
  status?: string | null;
  price_per_night?: number | string | null;
  min_nights?: number | string | null;
}

interface AvailabilityDay {
  date: string;
  status: 'available' | 'blocked' | 'booked';
}

interface AvailableStay {
  checkinDate: string;
  checkoutDate: string;
}

test.describe('Portal publico alquiler corto/largo', () => {
  test('listado publico abre detalle sin pantalla blanca', async ({ page }) => {
    await page.goto(`/${SLUG}/publico/propiedades`);

    await expect(page.getByRole('heading', { name: /propiedades|properties/i }).first()).toBeVisible(
      { timeout: 15000 },
    );
    await expect(page.locator('body')).not.toHaveText(/cannot match any routes|application error/i);

    const firstDetailButton = page.locator('.properties-grid .btn-action').first();
    await expect(firstDetailButton).toBeVisible({ timeout: 15000 });
    await firstDetailButton.click();
    await expect(page).toHaveURL(/\/publico\/propiedades\/\d+/, { timeout: 15000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).not.toHaveText(/no se pudo cargar|could not load|cannot match/i);
  });

  test('catalogo short-term usa precio por noche y recupera reserva hacia login', async ({
    page,
  }) => {
    const shortTermProperty = (await getCatalogProperties(page, 'SHORT_TERM')).find(
      (property) => Number(property.min_price_per_night ?? 0) > 0,
    );

    if (!shortTermProperty) {
      test.skip(true, 'No hay propiedades short-term con precio por noche en el seed actual.');
    }

    expect(Number(shortTermProperty.min_price_per_night)).toBeGreaterThan(0);
    expect(Number(shortTermProperty.available_short_term_units ?? 0)).toBeGreaterThan(0);

    await page.goto(`/${SLUG}/publico/propiedades/${shortTermProperty.id}`);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/\/noche|\/night|disponibilidad|availability/i).first()).toBeVisible({
      timeout: 15000,
    });

    const requestButton = page.getByRole('button', { name: /solicitar reserva|request booking/i });
    if ((await requestButton.count()) === 0) {
      test.skip(true, 'La propiedad short-term no expone calendario de reserva en este seed.');
    }

    await expect(requestButton.first()).toBeVisible();

    const detail = await getCatalogPropertyDetail(page, shortTermProperty.id);
    const unit = (detail.units ?? []).find(
      (item) => supportsShortTerm(item.rental_type) && Number(item.price_per_night ?? 0) > 0,
    );
    if (!unit) {
      test.skip(true, 'La propiedad short-term no tiene unidad reservable en el detalle.');
    }

    const stay = await findAvailableStay(page, shortTermProperty.id, unit.id);
    if (!stay) {
      test.skip(true, 'No hay dos noches consecutivas disponibles en el mes actual.');
    }

    await selectCalendarDay(page, stay.checkinDate);
    await selectCalendarDay(page, stay.checkoutDate);
    await requestButton.first().click();

    await expect(page).toHaveURL(new RegExp(`/${SLUG}/login`), { timeout: 15000 });
    const storedIntention = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('reservation_intention') ?? 'null'),
    );
    expect(storedIntention).toMatchObject({
      propertyId: shortTermProperty.id,
      unitId: unit.id,
      checkinDate: stay.checkinDate,
      checkoutDate: stay.checkoutDate,
    });
  });

  test('catalogo long-term sigue exponiendo renta mensual', async ({ page }) => {
    const longTermProperty = (await getCatalogProperties(page, 'LONG_TERM')).find(
      (property) => Number(property.monthly_rent ?? 0) > 0,
    );

    if (!longTermProperty) {
      test.skip(true, 'No hay propiedades long-term con renta mensual en el seed actual.');
    }

    expect(Number(longTermProperty.monthly_rent)).toBeGreaterThan(0);

    await page.goto(`/${SLUG}/publico/propiedades/${longTermProperty.id}`);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/\/mes|\/month|renta mensual|monthly rent/i).first()).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole('button', { name: /solicitar alquiler|apply now/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${SLUG}/login`), { timeout: 15000 });
    const storedIntention = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('application_intention') ?? 'null'),
    );
    expect(storedIntention).toMatchObject({
      propertyId: longTermProperty.id,
      propertyTitle: longTermProperty.title,
    });
  });

  test('catalogo both expone camino de solicitud larga y reserva corta', async ({ page }) => {
    const bothProperty = (await getCatalogProperties(page, 'any')).find(
      (property) =>
        property.rental_type === 'BOTH' &&
        Number(property.monthly_rent ?? 0) > 0 &&
        Number(property.min_price_per_night ?? 0) > 0,
    );

    if (!bothProperty) {
      test.skip(true, 'No hay propiedad BOTH con renta mensual y precio por noche en el seed.');
    }

    await page.goto(`/${SLUG}/publico/propiedades/${bothProperty.id}`);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /solicitar alquiler|apply now/i })).toBeVisible();
    await expect(page.getByText(/disponibilidad|availability/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /solicitar reserva|request booking/i })).toBeVisible();
  });
});

async function getCatalogProperties(
  page: Page,
  rentalType: 'SHORT_TERM' | 'LONG_TERM' | 'any',
): Promise<CatalogProperty[]> {
  const response = await getWithRetry(
    page,
    new URL(`${SLUG}/catalog/properties?rental_type=${rentalType}&sort=price_asc`, API_URL).toString(),
  );
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as CatalogResponse;
  return body.data ?? [];
}

async function getCatalogPropertyDetail(
  page: Page,
  propertyId: number,
): Promise<CatalogProperty> {
  const response = await getWithRetry(
    page,
    new URL(`${SLUG}/catalog/properties/${propertyId}`, API_URL).toString(),
  );
  expect(response.ok()).toBe(true);
  return (await response.json()) as CatalogProperty;
}

async function findAvailableStay(
  page: Page,
  propertyId: number,
  unitId: number,
): Promise<AvailableStay | null> {
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const earliestCheckin = toIsoDate(addDays(today, 1));
  const response = await getWithRetry(
    page,
    new URL(
      `${SLUG}/catalog/properties/${propertyId}/availability?month=${month}&unit_id=${unitId}`,
      API_URL,
    ).toString(),
  );
  expect(response.ok()).toBe(true);

  const days = (await response.json()) as AvailabilityDay[];
  const available = new Map(days.map((day) => [day.date.slice(0, 10), day.status]));

  for (const day of days) {
    const checkinDate = day.date.slice(0, 10);
    if (checkinDate < earliestCheckin || day.status !== 'available') continue;

    const checkout = addDays(new Date(`${checkinDate}T00:00:00`), 1);
    if (checkout.getMonth() !== today.getMonth()) continue;

    const checkoutDate = toIsoDate(checkout);
    if (available.get(checkoutDate) === 'available') {
      return { checkinDate, checkoutDate };
    }
  }

  return null;
}

async function selectCalendarDay(
  page: Page,
  isoDate: string,
): Promise<void> {
  const button = page
    .locator(`button.cal-day[data-date="${isoDate}"]:not([disabled])`)
    .first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();
}

function supportsShortTerm(type: string | null | undefined): boolean {
  const normalized = (type ?? '').toUpperCase();
  return normalized === 'SHORT_TERM' || normalized === 'BOTH';
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}
