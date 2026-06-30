import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Violation,
  ViolationFineStatus,
  ViolationSeverity,
  ViolationStatus,
  ViolationType,
} from '../../core/models/violation.model';
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
    severity: ViolationSeverity.MEDIUM,
    status: ViolationStatus.OPEN,
    description: 'Ruido',
    evidence_photos: [],
    fine_status: ViolationFineStatus.NONE,
    created_at: '2026-05-01',
  };

  const stats = {
    total: 3,
    open: 2,
    overdue: 1,
    escalated: 0,
    fines_outstanding: 150,
  };

  let service: {
    list: ReturnType<typeof vi.fn>;
    stats: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    uploadEvidence: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    addNote: ReturnType<typeof vi.fn>;
    chargeFine: ReturnType<typeof vi.fn>;
    waiveFine: ReturnType<typeof vi.fn>;
    payFine: ReturnType<typeof vi.fn>;
    notify: ReturnType<typeof vi.fn>;
    downloadPdf: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: ViolationsFacade;

  beforeEach(() => {
    service = {
      list: vi.fn(() => of({ data: [violation], total: 1 })),
      stats: vi.fn(() => of(stats)),
      getById: vi.fn(() => of({ ...violation, events: [] })),
      create: vi.fn(() => of(violation)),
      uploadEvidence: vi.fn(() => of({ evidence_photos: [] })),
      updateStatus: vi.fn(() => of({ ...violation, status: ViolationStatus.RESOLVED })),
      addNote: vi.fn(() => of([])),
      chargeFine: vi.fn(() => of({ ...violation, fine_status: ViolationFineStatus.CHARGED })),
      waiveFine: vi.fn(() => of({ ...violation, fine_status: ViolationFineStatus.WAIVED })),
      payFine: vi.fn(() => of({ ...violation, fine_status: ViolationFineStatus.PAID })),
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

  it('loads violations, properties, tenants and stats', () => {
    expect(facade.violations()).toEqual([violation]);
    expect(facade.propertyOptions()).toEqual([{ value: 10, label: 'Casa' }]);
    expect(facade.tenantOptions()).toEqual([{ value: 20, label: 'Tenant' }]);
    expect(facade.stats().overdue).toBe(1);
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

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        property_id: 10,
        tenant_id: 20,
        type: ViolationType.PARKING,
        severity: ViolationSeverity.MEDIUM,
        description: 'Parqueo',
      }),
    );
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

  it('opens the detail and loads the timeline', () => {
    facade.openDetail(violation);

    expect(facade.detailOpen()).toBe(true);
    expect(service.getById).toHaveBeenCalledWith(1);
    expect(facade.detail()?.id).toBe(1);
  });

  it('changes the stage from the detail panel', () => {
    facade.openDetail(violation);
    facade.changeStatus(ViolationStatus.IN_PROGRESS);

    expect(service.updateStatus).toHaveBeenCalledWith(1, ViolationStatus.IN_PROGRESS);
    expect(toast.success).toHaveBeenCalled();
  });

  it('charges a fine from the detail panel', () => {
    facade.openDetail(violation);
    facade.fineAmount.set(120);
    facade.chargeFine();

    expect(service.chargeFine).toHaveBeenCalledWith(1, { amount: 120 });
  });

  it('rejects an invalid fine amount', () => {
    facade.openDetail(violation);
    facade.fineAmount.set(0);
    facade.chargeFine();

    expect(service.chargeFine).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
