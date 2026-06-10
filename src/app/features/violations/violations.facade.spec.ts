import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Violation, ViolationStatus, ViolationType } from '../../core/models/violation.model';
import { PropertyService } from '../../core/services/admin/property.service';
import { ViolationService } from '../../core/services/admin/violation.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ViolationsFacade } from './violations.facade';

describe('ViolationsFacade', () => {
  const violation: Violation = {
    id: 1,
    property_id: 10,
    tenant_id: 20,
    type: ViolationType.NOISE,
    status: ViolationStatus.OPEN,
    description: 'Ruido',
    evidence_photos: [],
    created_at: '2026-05-01',
  };

  let service: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    uploadEvidence: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    notify: ReturnType<typeof vi.fn>;
    downloadPdf: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: ViolationsFacade;

  beforeEach(() => {
    service = {
      list: vi.fn(() => of({ data: [violation], total: 1 })),
      create: vi.fn(() => of(violation)),
      uploadEvidence: vi.fn(() => of({ evidence_photos: [] })),
      updateStatus: vi.fn(() => of({ ...violation, status: ViolationStatus.RESOLVED })),
      notify: vi.fn(() => of({ message: 'ok' })),
      downloadPdf: vi.fn(() => of(new Blob(['pdf']))),
    };
    confirm = { confirm: vi.fn(() => Promise.resolve(true)) };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ViolationsFacade,
        { provide: ViolationService, useValue: service },
        {
          provide: PropertyService,
          useValue: { getAdminProperties: vi.fn(() => of([{ id: 10, title: 'Casa' }])) },
        },
        {
          provide: TenantUserService,
          useValue: { getFilteredUsers: vi.fn(() => of([{ id: 20, name: 'Tenant' }])) },
        },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key, events$: of() },
        },
      ],
    });
    facade = TestBed.inject(ViolationsFacade);
  });

  it('loads violations, properties and tenants', () => {
    expect(facade.violations()).toEqual([violation]);
    expect(facade.propertyOptions()).toEqual([{ value: 10, label: 'Casa' }]);
    expect(facade.tenantOptions()).toEqual([{ value: 20, label: 'Tenant' }]);
    expect(facade.openCount()).toBe(1);
  });

  it('creates a violation and uploads evidence when files are selected', () => {
    facade.openCreate();
    facade.form.patchValue({
      property_id: 10,
      tenant_id: 20,
      type: ViolationType.PARKING,
      description: 'Parqueo',
    });
    facade.selectedFiles.set([new File(['a'], 'photo.png')]);

    facade.save();

    expect(service.create).toHaveBeenCalledWith({
      property_id: 10,
      tenant_id: 20,
      type: ViolationType.PARKING,
      description: 'Parqueo',
    });
    expect(service.uploadEvidence).toHaveBeenCalled();
  });

  it('resolves a violation', () => {
    facade.openResolve(violation);
    facade.resolveNotes.set('Listo');

    facade.confirmResolve();

    expect(service.updateStatus).toHaveBeenCalledWith(1, ViolationStatus.RESOLVED, 'Listo');
    expect(toast.success).toHaveBeenCalled();
  });

  it('notifies after confirmation', async () => {
    await facade.notify(violation);

    expect(service.notify).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalled();
  });
});
