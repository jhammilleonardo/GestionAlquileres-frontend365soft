import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { ReservationAnalytics } from '../../../core/models/reservation-admin.model';
import { ReservationAnalyticsFacade } from './reservation-analytics.facade';

function makeAnalytics(overrides?: Partial<ReservationAnalytics>): ReservationAnalytics {
  return {
    from: '2026-06-01',
    to: '2026-06-30',
    range_nights: 30,
    short_term_units: 2,
    available_nights: 60,
    booked_nights: 45,
    occupancy_rate: 0.75,
    revenue: 3600,
    currency: 'BOB',
    adr: 80,
    reservations_by_status: { completed: 5 },
    ...overrides,
  };
}

describe('ReservationAnalyticsFacade', () => {
  let service: { getAnalytics: ReturnType<typeof vi.fn> };
  let facade: ReservationAnalyticsFacade;

  beforeEach(() => {
    service = { getAnalytics: vi.fn(() => of(makeAnalytics())) };

    TestBed.configureTestingModule({
      providers: [
        ReservationAnalyticsFacade,
        { provide: ReservationAdminService, useValue: service },
      ],
    });
    facade = TestBed.inject(ReservationAnalyticsFacade);
  });

  it('carga las métricas con el rango por defecto (mes actual)', () => {
    expect(service.getAnalytics).toHaveBeenCalledTimes(1);
    expect(facade.analytics()?.revenue).toBe(3600);
    expect(facade.isLoading()).toBe(false);
  });

  it('expone la ocupación en porcentaje', () => {
    expect(facade.occupancyPct()).toBe(75);
  });

  it('no consulta con un rango invertido', () => {
    service.getAnalytics.mockClear();
    facade.form.setValue({ from: '2026-06-30', to: '2026-06-01' });
    facade.load();
    expect(service.getAnalytics).not.toHaveBeenCalled();
  });
});
