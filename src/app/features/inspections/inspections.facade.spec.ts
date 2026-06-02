import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Inspection, InspectionStatus, InspectionType } from '../../core/models/inspection.model';
import { InspectionService } from '../../core/services/admin/inspection.service';
import { PropertyService } from '../../core/services/admin/property.service';
import { SlugService } from '../../core/services/slug.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { InspectionsFacade } from './inspections.facade';

describe('InspectionsFacade', () => {
  const inspection: Inspection = {
    id: 1,
    property_id: 10,
    property_title: 'Casa',
    type: InspectionType.MOVE_IN,
    status: InspectionStatus.SCHEDULED,
    scheduled_date: '2026-05-01',
  };

  let service: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    compare: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: InspectionsFacade;

  beforeEach(() => {
    service = {
      list: vi.fn(() => of([inspection])),
      create: vi.fn(() => of(inspection)),
      compare: vi.fn(() => of([])),
    };
    router = { navigate: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        InspectionsFacade,
        { provide: InspectionService, useValue: service },
        {
          provide: PropertyService,
          useValue: { getAdminProperties: vi.fn(() => of([{ id: 10, title: 'Casa' }])) },
        },
        {
          provide: TenantUserService,
          useValue: { getFilteredUsers: vi.fn(() => of([{ id: 2, name: 'Inspector' }])) },
        },
        { provide: SlugService, useValue: { getSlug: () => 'demo' } },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    });
    facade = TestBed.inject(InspectionsFacade);
  });

  it('loads inspections, properties and inspectors', () => {
    expect(facade.inspections()).toEqual([inspection]);
    expect(facade.propertyOptions()).toEqual([{ value: 10, label: 'Casa' }]);
    expect(facade.inspectorOptions()).toEqual([{ value: 2, label: 'Inspector' }]);
  });

  it('creates an inspection with default checklist', () => {
    facade.openCreate();
    facade.form.patchValue({
      property_id: 10,
      type: InspectionType.PERIODIC,
      scheduled_date: '2026-05-02',
      inspector_user_id: 2,
    });

    facade.save();

    const createPayload = service.create.mock.calls[0]?.[0] as {
      property_id: number;
      type: InspectionType;
      scheduled_date: string;
      inspector_user_id: number;
      items: unknown[];
    };

    expect(createPayload.property_id).toBe(10);
    expect(createPayload.type).toBe(InspectionType.PERIODIC);
    expect(createPayload.scheduled_date).toBe('2026-05-02');
    expect(createPayload.inspector_user_id).toBe(2);
    expect(Array.isArray(createPayload.items)).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['demo', 'inspecciones', 1]);
  });

  it('runs move-in vs move-out comparison', () => {
    facade.compareForm.patchValue({ move_in: 1, move_out: 2 });

    facade.runCompare();

    expect(service.compare).toHaveBeenCalledWith(1, 2);
    expect(facade.comparison()).toEqual([]);
  });
});
