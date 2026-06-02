import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RentalType, Unit, UnitStatus } from '../../../core/models/unit.model';
import { UnitService } from '../../../core/services/admin/unit.service';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { PropertyUnitsFacade } from './property-units.facade';

describe('PropertyUnitsFacade', () => {
  let facade: PropertyUnitsFacade;
  let unitService: {
    findByProperty: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let confirmDialog: {
    confirm: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    unitService = {
      findByProperty: vi.fn(() =>
        of([unit(1, UnitStatus.AVAILABLE), unit(2, UnitStatus.OCCUPIED)]),
      ),
      remove: vi.fn(() => of({ message: 'ok' })),
    };
    confirmDialog = {
      confirm: vi.fn(() => Promise.resolve(true)),
    };
    toast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PropertyUnitsFacade,
        { provide: UnitService, useValue: unitService },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        { provide: ToastService, useValue: toast },
      ],
    });
    facade = TestBed.inject(PropertyUnitsFacade);
  });

  it('loads units and computes counters', () => {
    facade.loadUnits(10);

    expect(unitService.findByProperty).toHaveBeenCalledWith(10);
    expect(facade.counters()).toEqual({
      available: 1,
      occupied: 1,
      maintenance: 0,
      reserved: 0,
      total: 2,
    });
  });

  it('filters units by status', () => {
    facade.loadUnits(10);
    facade.setStatusFilter(UnitStatus.OCCUPIED);

    expect(facade.filteredUnits().map((current) => current.id)).toEqual([2]);
  });

  it('adds saved units locally', () => {
    facade.loadUnits(10);
    facade.handleUnitSaved(unit(3, UnitStatus.RESERVED));

    expect(facade.units().map((current) => current.id)).toEqual([1, 2, 3]);
    expect(facade.selectedUnit()?.id).toBe(3);
  });

  it('removes units after confirmation', async () => {
    facade.loadUnits(10);

    await facade.deleteUnit(10, unit(1, UnitStatus.AVAILABLE));

    expect(confirmDialog.confirm).toHaveBeenCalled();
    expect(unitService.remove).toHaveBeenCalledWith(10, 1);
    expect(facade.units().map((current) => current.id)).toEqual([2]);
  });
});

function unit(id: number, status: UnitStatus): Unit {
  return {
    id,
    property_id: 10,
    unit_number: String(id),
    status,
    rental_type: RentalType.LONG_TERM,
    features: {},
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}
