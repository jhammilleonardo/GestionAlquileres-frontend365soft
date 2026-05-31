import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ExpenseService } from './expense.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { Expense, MonthlyBalancePoint } from '../../models/expense.model';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;
  let patch: ReturnType<typeof vi.fn>;
  let del: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of({ data: [], total: 0 }));
    post = vi.fn().mockReturnValue(of({ id: 1 }));
    patch = vi.fn().mockReturnValue(of({ id: 1 }));
    del = vi.fn().mockReturnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        ExpenseService,
        { provide: ApiClientService, useValue: { get, post, patch, delete: del } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(ExpenseService);
  });

  it('list normaliza el monto string a número', () => {
    get.mockReturnValue(
      of({ data: [{ id: 1, amount: '150.50' }] as unknown as Expense[], total: 1 }),
    );

    let amount = 0;
    service.list().subscribe((res) => (amount = res.data[0].amount));

    expect(get).toHaveBeenCalledWith('acme/admin/expenses', { params: {} });
    expect(amount).toBe(150.5);
  });

  it('getMonthlyBalance pide la serie con property_id', () => {
    get.mockReturnValue(of([] as MonthlyBalancePoint[]));
    service.getMonthlyBalance(3).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/expenses/monthly-balance', {
      params: { property_id: 3 },
    });
  });

  it('getMonthlyBalance sin propiedad usa params vacíos', () => {
    get.mockReturnValue(of([]));
    service.getMonthlyBalance().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/expenses/monthly-balance', { params: {} });
  });

  it('create hace POST con el dto', () => {
    const dto = { property_id: 1, category: 'TAX', amount: 100, date: '2026-01-01' };
    service.create(dto).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/expenses', dto);
  });

  it('remove hace DELETE del gasto', () => {
    service.remove(9).subscribe();
    expect(del).toHaveBeenCalledWith('acme/admin/expenses/9');
  });
});
