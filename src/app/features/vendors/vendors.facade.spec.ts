import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Vendor, VendorSpecialty } from '../../core/models/vendor.model';
import { VendorService } from '../../core/services/admin/vendor.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { VendorsFacade } from './vendors.facade';

describe('VendorsFacade', () => {
  const vendor: Vendor = {
    id: 1,
    name: 'Plomeria Central',
    specialty: VendorSpecialty.PLUMBING,
    is_active: true,
    average_rating: 4,
  };

  let service: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    getHistory: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: VendorsFacade;

  beforeEach(() => {
    service = {
      list: vi.fn(() => of([vendor])),
      create: vi.fn(() => of(vendor)),
      update: vi.fn(() => of(vendor)),
      remove: vi.fn(() => of({ message: 'ok' })),
      getHistory: vi.fn(() => of([])),
    };
    confirm = { confirm: vi.fn(() => Promise.resolve(true)) };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        VendorsFacade,
        { provide: VendorService, useValue: service },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    });
    facade = TestBed.inject(VendorsFacade);
  });

  it('loads vendors on creation', () => {
    expect(facade.vendors()).toEqual([vendor]);
    expect(facade.isLoading()).toBe(false);
  });

  it('filters vendors by specialty', () => {
    facade.vendors.set([vendor, { ...vendor, id: 2, specialty: VendorSpecialty.ELECTRICAL }]);

    facade.onSpecialtyFilter(VendorSpecialty.PLUMBING);

    expect(facade.filteredVendors()).toEqual([vendor]);
  });

  it('creates a vendor from the form', () => {
    facade.openCreate();
    facade.form.patchValue({
      name: 'Nuevo proveedor',
      specialty: VendorSpecialty.CLEANING,
      email: 'proveedor@test.com',
    });

    facade.save();

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nuevo proveedor',
        specialty: VendorSpecialty.CLEANING,
        email: 'proveedor@test.com',
      }),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('updates a vendor from the form', () => {
    facade.openEdit(vendor, new Event('click'));
    facade.form.patchValue({ name: 'Actualizado' });

    facade.save();

    expect(service.update).toHaveBeenCalledWith(
      vendor.id,
      expect.objectContaining({ name: 'Actualizado' }),
    );
  });

  it('deactivates a vendor after confirmation', async () => {
    await facade.deactivate(vendor, new Event('click'));

    expect(service.remove).toHaveBeenCalledWith(vendor.id);
    expect(toast.success).toHaveBeenCalled();
  });
});
