import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { HousekeepingTask } from '../../../core/models/reservation-admin.model';
import { HousekeepingFacade } from './housekeeping.facade';

function makeTask(overrides?: Partial<HousekeepingTask>): HousekeepingTask {
  return {
    id: 1,
    property_id: 3,
    unit_id: 7,
    reservation_id: 5,
    scheduled_date: '2026-06-15',
    status: 'pending',
    assigned_to: null,
    notes: null,
    property_name: 'Casa',
    unit_number: 'A1',
    assignee_name: null,
    ...overrides,
  };
}

describe('HousekeepingFacade', () => {
  let service: {
    listHousekeeping: ReturnType<typeof vi.fn>;
    updateHousekeeping: ReturnType<typeof vi.fn>;
  };
  let facade: HousekeepingFacade;

  beforeEach(() => {
    service = {
      listHousekeeping: vi.fn(() => of([makeTask()])),
      updateHousekeeping: vi.fn(() => of(makeTask({ status: 'in_progress' }))),
    };

    TestBed.configureTestingModule({
      providers: [
        HousekeepingFacade,
        { provide: ReservationAdminService, useValue: service },
        {
          provide: TranslocoService,
          useValue: { translate: (k: string) => k, events$: of() },
        },
      ],
    });
    facade = TestBed.inject(HousekeepingFacade);
  });

  it('carga las tareas al iniciar', () => {
    expect(service.listHousekeeping).toHaveBeenCalled();
    expect(facade.tasks()).toHaveLength(1);
  });

  it('filtra por estado al cambiar el select (auto-apply)', async () => {
    service.listHousekeeping.mockClear();
    facade.filterForm.setValue({ status: 'pending' });
    await vi.waitFor(() => {
      expect(service.listHousekeeping).toHaveBeenCalledWith('pending');
    });
  });

  it('expone el siguiente estado del flujo', () => {
    expect(facade.nextStatus(makeTask({ status: 'pending' }))).toBe('in_progress');
    expect(facade.nextStatus(makeTask({ status: 'in_progress' }))).toBe('done');
    expect(facade.nextStatus(makeTask({ status: 'done' }))).toBeNull();
  });

  it('avanza la tarea al siguiente estado y recarga', () => {
    service.listHousekeeping.mockClear();
    facade.advance(makeTask({ id: 9, status: 'pending' }));
    expect(service.updateHousekeeping).toHaveBeenCalledWith(9, 'in_progress');
    expect(service.listHousekeeping).toHaveBeenCalledTimes(1);
  });

  it('no avanza una tarea ya completada', () => {
    facade.advance(makeTask({ status: 'done' }));
    expect(service.updateHousekeeping).not.toHaveBeenCalled();
  });

  it('mapea el tono del estado', () => {
    expect(facade.statusTone('pending')).toBe('warning');
    expect(facade.statusTone('done')).toBe('success');
  });
});
