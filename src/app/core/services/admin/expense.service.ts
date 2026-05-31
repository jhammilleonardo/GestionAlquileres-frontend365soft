import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import {
  CreateExpenseDto,
  Expense,
  MonthlyBalancePoint,
  PaginatedExpenses,
  UpdateExpenseDto,
} from '../../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  list(params: QueryParams = {}): Observable<PaginatedExpenses> {
    return this.api.get<PaginatedExpenses>(this.endpoint('admin/expenses'), { params }).pipe(
      map((res) => ({
        total: res.total,
        data: res.data.map((e) => this.normalize(e)),
      })),
    );
  }

  getMonthlyBalance(propertyId?: number): Observable<MonthlyBalancePoint[]> {
    const params: QueryParams = propertyId ? { property_id: propertyId } : {};
    return this.api.get<MonthlyBalancePoint[]>(this.endpoint('admin/expenses/monthly-balance'), {
      params,
    });
  }

  create(dto: CreateExpenseDto): Observable<Expense> {
    return this.api.post<Expense, CreateExpenseDto>(this.endpoint('admin/expenses'), dto);
  }

  update(id: number, dto: UpdateExpenseDto): Observable<Expense> {
    return this.api.patch<Expense, UpdateExpenseDto>(this.endpoint(`admin/expenses/${id}`), dto);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/expenses/${id}`));
  }

  private normalize(expense: Expense): Expense {
    return { ...expense, amount: Number(expense.amount) };
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
