import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminReservation,
  ReservationAction,
  ReservationStatus,
} from '../../core/models/reservation-admin.model';
import { PropertyService } from '../../core/services/admin/property.service';
import { ReservationAdminService } from '../../core/services/admin/reservation-admin.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ReservationsAdminFacade } from './reservations.facade';

function makeReservation(overrides?: Partial<AdminReservation>): AdminReservation {
  return {
    id: 1,
    property_id: 10,
    unit_id: 7,
    tenant_id: 20,
    checkin_date: '2026-06-10',
    checkout_date: '2026-06-15',
    nights: 5,
    price_per_night: '80.00',
    cleaning_fee: '20.00',
    total_amount: '420.00',
    currency: 'BOB',
    status: ReservationStatus.PENDING,
    notes: null,
    created_at: '2026-05-01',
    property_name: 'Casa',
    unit_number: 'A1',
    tenant_name: 'Tenant',
    ...overrides,
  };
}

describe('ReservationsAdminFacade', () => {
  let service: {
    list: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: ReservationsAdminFacade;

  beforeEach(() => {
    service = {
      list: vi.fn(() => of({ data: [makeReservation()], total: 1, page: 1, limit: 20 })),
      getOne: vi.fn(() => of(makeReservation())),
      updateStatus: vi.fn(() => of(makeReservation({ status: ReservationStatus.CONFIRMED }))),
    };
    confirm = { confirm: vi.fn(() => Promise.resolve(true)) };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ReservationsAdminFacade,
        { provide: ReservationAdminService, useValue: service },
        {
          provide: PropertyService,
          useValue: { getAdminProperties: vi.fn(() => of([{ id: 10, title: 'Casa' }])) },
        },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key, events$: of() },
        },
      ],
    });
    facade = TestBed.inject(ReservationsAdminFacade);
  });

  it('carga reservas y opciones de propiedad al iniciar', () => {
    expect(facade.reservations()).toHaveLength(1);
    expect(facade.total()).toBe(1);
    expect(facade.propertyOptions()).toEqual([{ value: 10, label: 'Casa' }]);
  });

  it('expone las acciones válidas según el estado', () => {
    const pending = makeReservation({ status: ReservationStatus.PENDING });
    expect(facade.availableActions(pending)).toContain(ReservationAction.CONFIRM);

    const completed = makeReservation({ status: ReservationStatus.COMPLETED });
    expect(facade.availableActions(completed)).toHaveLength(0);
  });

  it('aplica una acción no destructiva sin pedir confirmación', async () => {
    await facade.applyAction(makeReservation(), ReservationAction.CONFIRM);

    expect(confirm.confirm).not.toHaveBeenCalled();
    expect(service.updateStatus).toHaveBeenCalledWith(1, ReservationAction.CONFIRM);
    expect(toast.success).toHaveBeenCalled();
  });

  it('pide confirmación para acciones destructivas (cancel)', async () => {
    await facade.applyAction(makeReservation(), ReservationAction.CANCEL);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.updateStatus).toHaveBeenCalledWith(1, ReservationAction.CANCEL);
  });

  it('no ejecuta la acción si el usuario cancela la confirmación', async () => {
    confirm.confirm.mockResolvedValueOnce(false);

    await facade.applyAction(makeReservation(), ReservationAction.NO_SHOW);

    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('cambia de página y recarga', () => {
    service.list.mockClear();
    facade.onPageChange(2);

    expect(facade.page()).toBe(2);
    const params = service.list.mock.calls[0][0] as Record<string, number>;
    expect(params['page']).toBe(2);
  });
});
