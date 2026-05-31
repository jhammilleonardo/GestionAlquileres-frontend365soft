import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminOperationsService, ApiRecord } from './admin-operations.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

describe('AdminOperationsService', () => {
  let service: AdminOperationsService;
  let apiGet: ReturnType<typeof vi.fn>;
  let apiPost: ReturnType<typeof vi.fn>;
  let apiDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiGet = vi.fn();
    apiPost = vi.fn().mockReturnValue(of({ id: 1 }));
    apiDelete = vi.fn().mockReturnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        AdminOperationsService,
        {
          provide: ApiClientService,
          useValue: { get: apiGet, post: apiPost, delete: apiDelete },
        },
        // El endpoint antepone el slug: buildApiEndpoint('admin/x') -> 'acme/admin/x'
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(AdminOperationsService);
  });

  it('getVendors llama al endpoint con el slug', () => {
    const vendors: ApiRecord[] = [{ id: 1, name: 'ACME' }];
    apiGet.mockReturnValue(of(vendors));

    let result: ApiRecord[] = [];
    service.getVendors().subscribe((r) => (result = r));

    expect(apiGet).toHaveBeenCalledWith('acme/admin/vendors', { params: {} });
    expect(result).toEqual(vendors);
  });

  it('getExpenses desempaqueta una respuesta paginada', () => {
    apiGet.mockReturnValue(of({ data: [{ id: 1 }, { id: 2 }], total: 2 }));

    let result: ApiRecord[] = [];
    service.getExpenses().subscribe((r) => (result = r));

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });

  it('getExpenses acepta también un array plano', () => {
    apiGet.mockReturnValue(of([{ id: 5 }]));

    let result: ApiRecord[] = [];
    service.getExpenses().subscribe((r) => (result = r));

    expect(result).toEqual([{ id: 5 }]);
  });

  it('getViolations desempaqueta paginación', () => {
    apiGet.mockReturnValue(of({ data: [{ id: 9 }], total: 1 }));

    let result: ApiRecord[] = [];
    service.getViolations().subscribe((r) => (result = r));

    expect(result[0].id).toBe(9);
  });

  it('createVendor hace POST al endpoint correcto', () => {
    service.createVendor({ name: 'Nuevo' }).subscribe();
    expect(apiPost).toHaveBeenCalledWith('acme/admin/vendors', { name: 'Nuevo' });
  });

  it('deleteExpense hace DELETE con el id', () => {
    service.deleteExpense(7).subscribe();
    expect(apiDelete).toHaveBeenCalledWith('acme/admin/expenses/7');
  });

  it('getReportsKpis llama al endpoint de KPIs', () => {
    apiGet.mockReturnValue(of({ occupancy_rate: 0.9 }));

    let result = {};
    service.getReportsKpis().subscribe((r) => (result = r));

    expect(apiGet).toHaveBeenCalledWith('acme/admin/reports/kpis', { params: {} });
    expect(result).toEqual({ occupancy_rate: 0.9 });
  });
});
