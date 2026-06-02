import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContractStatus } from '../../../core/models/contract.model';
import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { AdminUserService } from '../../../core/services/admin/admin-user.service';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { ContractCreateComponent } from './contract-create.component';

describe('ContractCreateComponent', () => {
  let createContract: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createContract = vi.fn(() =>
      of({
        id: 55,
        contract_number: 'C-55',
        status: ContractStatus.BORRADOR,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        monthly_rent: 1000,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      }),
    );
    navigateByUrl = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ContractCreateComponent],
      providers: [
        { provide: AdminContractService, useValue: { createContract } },
        {
          provide: AdminUserService,
          useValue: {
            tenants: signal([{ id: 9, name: 'Tenant Demo', email: 'tenant@mail.com' }]),
            isLoading: signal(false),
            loadTenants: vi.fn(),
          },
        },
        {
          provide: PropertyService,
          useValue: {
            getFilteredProperties: vi.fn(() =>
              of({
                items: [
                  {
                    id: 7,
                    title: 'Casa Central',
                    addresses: [{ city: 'La Paz' }],
                  },
                ],
              }),
            ),
          },
        },
        { provide: SlugService, useValue: { buildUrl: (url: string) => `/demo${url}` } },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ tenant_id: '9', property_id: '7' }),
            },
          },
        },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    })
      .overrideComponent(ContractCreateComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('prefills tenant/property from query params and creates contract', () => {
    const fixture = TestBed.createComponent(ContractCreateComponent);
    const component = fixture.componentInstance;
    const initialValue = component.contractForm.getRawValue() as {
      tenant_id: number | null;
      property_id: number | null;
    };

    expect(initialValue.tenant_id).toBe(9);
    expect(initialValue.property_id).toBe(7);

    component.contractForm.patchValue({
      start_date: new Date(2026, 0, 1),
      end_date: new Date(2026, 11, 31),
      monthly_rent: 1200,
      payment_day: 5,
      payment_method: 'Transferencia',
      included_services: ['Agua'],
    });

    component.onSubmit();

    expect(createContract).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 9,
        property_id: 7,
        monthly_rent: 1200,
        included_services: ['Agua'],
      }),
    );
    expect(navigateByUrl).toHaveBeenCalledWith('/demo/contratos/55');
  });

  it('does not create when date range is invalid', () => {
    const fixture = TestBed.createComponent(ContractCreateComponent);
    const component = fixture.componentInstance;
    component.contractForm.patchValue({
      tenant_id: 9,
      property_id: 7,
      start_date: new Date(2026, 11, 31),
      end_date: new Date(2026, 0, 1),
      monthly_rent: 1200,
    });

    component.onSubmit();

    expect(createContract).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('contracts.create.dateRangeError');
  });
});
