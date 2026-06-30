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
    listTemplates: ReturnType<typeof vi.fn>;
    createTemplate: ReturnType<typeof vi.fn>;
    deleteTemplate: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: InspectionsFacade;

  beforeEach(() => {
    service = {
      list: vi.fn(() => of([inspection])),
      create: vi.fn(() => of(inspection)),
      compare: vi.fn(() => of([])),
      listTemplates: vi.fn(() =>
        of([{ id: 7, name: 'Estándar', type: null, items: [], is_default: true }]),
      ),
      createTemplate: vi.fn(() => of({ id: 8, name: 'Mudanza', items: [], is_default: false })),
      deleteTemplate: vi.fn(() => of(void 0)),
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
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key, events$: of() },
        },
      ],
    });
    facade = TestBed.inject(InspectionsFacade);
  });

  it('loads inspections, properties and inspectors', () => {
    expect(facade.inspections()).toEqual([inspection]);
    expect(facade.propertyOptions()).toEqual([{ value: 10, label: 'Casa' }]);
    expect(facade.inspectorOptions()).toEqual([{ value: 2, label: 'Inspector' }]);
  });

  it('loads templates and preselects the default one on create', () => {
    expect(facade.templates()).toHaveLength(1);
    facade.openCreate();
    expect(facade.form.getRawValue().template_id).toBe(7);
  });

  it('creates an inspection from the default template', () => {
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
      template_id?: number;
    };

    expect(createPayload.property_id).toBe(10);
    expect(createPayload.type).toBe(InspectionType.PERIODIC);
    expect(createPayload.template_id).toBe(7);
    expect(router.navigate).toHaveBeenCalledWith(['demo', 'inspecciones', 1]);
  });

  it('computes metrics from the inspection list', () => {
    expect(facade.metrics().total).toBe(1);
    expect(facade.metrics().scheduled).toBe(1);
    // scheduled_date 2026-05-01 está en el pasado respecto a la fecha actual
    expect(facade.metrics().overdue).toBe(1);
  });

  it('creates and deletes templates', () => {
    facade.createTemplate({ name: 'Mudanza', items: [] });
    expect(service.createTemplate).toHaveBeenCalledWith({ name: 'Mudanza', items: [] });

    facade.deleteTemplate(8);
    expect(service.deleteTemplate).toHaveBeenCalledWith(8);
  });

  it('runs move-in vs move-out comparison', () => {
    facade.compareForm.patchValue({ move_in: 1, move_out: 2 });

    facade.runCompare();

    expect(service.compare).toHaveBeenCalledWith(1, 2);
    expect(facade.comparison()).toEqual([]);
  });
});
