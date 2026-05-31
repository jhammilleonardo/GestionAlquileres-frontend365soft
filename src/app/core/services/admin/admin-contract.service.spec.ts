import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AdminContractService } from './admin-contract.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { TranslocoService } from '@jsverse/transloco';

describe('AdminContractService', () => {
  let service: AdminContractService;
  let get: ReturnType<typeof vi.fn>;

  function configure(slug = 'acme'): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AdminContractService,
        { provide: ApiClientService, useValue: { get, post: vi.fn(), patch: vi.fn() } },
        {
          provide: SlugService,
          useValue: { getSlug: () => slug, buildApiEndpoint: (p: string) => `${slug}/${p}` },
        },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    });
    service = TestBed.inject(AdminContractService);
  }

  beforeEach(() => {
    get = vi.fn();
    configure();
  });

  it('loadContracts arma el objeto tenant desde campos planos', () => {
    get.mockReturnValue(
      of([
        {
          id: 1,
          contract_number: 'C-1',
          tenant_id: 5,
          tenant_name: 'Ana López',
          tenant_email: 'ana@x.com',
          status: 'ACTIVO',
        },
      ]),
    );

    service.loadContracts();

    const contracts = service.contracts();
    expect(contracts).toHaveLength(1);
    expect(contracts[0].tenant?.name).toBe('Ana López');
    expect(contracts[0].tenant?.email).toBe('ana@x.com');
  });

  it('loadContracts no hace petición si no hay slug', () => {
    configure('');
    service.loadContracts();
    expect(get).not.toHaveBeenCalled();
  });

  it('loadContracts marca error y deja lista vacía si falla', () => {
    get.mockReturnValue(throwError(() => new Error('network')));
    service.loadContracts();
    expect(service.contracts()).toEqual([]);
    expect(service.error()).toBeTruthy();
  });
});
