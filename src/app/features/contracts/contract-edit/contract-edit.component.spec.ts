import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Contract, ContractStatus } from '../../../core/models/contract.model';
import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { ContractEditComponent } from './contract-edit.component';

describe('ContractEditComponent', () => {
  let getContract: ReturnType<typeof vi.fn>;
  let updateContract: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getContract = vi.fn(() => of(makeContract()));
    updateContract = vi.fn(() => of(makeContract()));
    navigateByUrl = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ContractEditComponent],
      providers: [
        { provide: AdminContractService, useValue: { getContract, updateContract } },
        { provide: SlugService, useValue: { buildUrl: (url: string) => `/demo${url}` } },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '42' }),
            },
          },
        },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    })
      .overrideComponent(ContractEditComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('loads contract and submits update payload', () => {
    const fixture = TestBed.createComponent(ContractEditComponent);
    const component = fixture.componentInstance;

    expect(getContract).toHaveBeenCalledWith(42);
    expect(component.contractNumber()).toBe('C-42');

    component.contractForm.patchValue({
      monthly_rent: 1500,
      end_date: new Date(2026, 11, 31),
      included_services: ['Agua', 'Internet'],
    });

    component.onSubmit();

    expect(updateContract).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        monthly_rent: 1500,
        included_services: ['Agua', 'Internet'],
      }),
    );
    expect(navigateByUrl).toHaveBeenCalledWith('/demo/contratos/42');
  });

  it('blocks update when date range is invalid', () => {
    const fixture = TestBed.createComponent(ContractEditComponent);
    const component = fixture.componentInstance;
    component.contractForm.patchValue({
      start_date: new Date(2026, 11, 31),
      end_date: new Date(2026, 0, 1),
    });

    component.onSubmit();

    expect(updateContract).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('contracts.create.dateRangeError');
  });
});

function makeContract(): Contract {
  return {
    id: 42,
    contract_number: 'C-42',
    status: ContractStatus.BORRADOR,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    key_delivery_date: '2026-01-01',
    monthly_rent: 1000,
    payment_day: 5,
    payment_method: 'Transferencia',
    included_services: ['Agua'],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    tenant: { id: 1, name: 'Tenant Demo', email: 'tenant@mail.com', tenant_id: 1 },
    property: { id: 7, title: 'Casa Central' },
  };
}
