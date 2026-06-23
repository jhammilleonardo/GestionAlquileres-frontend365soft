import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import {
  BalanceSheet,
  ChartAccount,
  IncomeStatement,
  PaginatedJournalEntries,
  TrialBalance,
} from '../../models/accounting.model';

/** Cliente de la API de contabilidad (Fase F4, solo lectura). */
@Injectable({ providedIn: 'root' })
export class AccountingService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  getChartOfAccounts(params: QueryParams = {}): Observable<ChartAccount[]> {
    return this.api.get<ChartAccount[]>(this.endpoint('admin/accounting/chart-of-accounts'), {
      params,
    });
  }

  getJournalEntries(params: QueryParams = {}): Observable<PaginatedJournalEntries> {
    return this.api.get<PaginatedJournalEntries>(
      this.endpoint('admin/accounting/journal-entries'),
      { params },
    );
  }

  getTrialBalance(params: QueryParams = {}): Observable<TrialBalance> {
    return this.api.get<TrialBalance>(this.endpoint('admin/accounting/trial-balance'), { params });
  }

  getBalanceSheet(params: QueryParams = {}): Observable<BalanceSheet> {
    return this.api.get<BalanceSheet>(this.endpoint('admin/accounting/balance-sheet'), { params });
  }

  getIncomeStatement(params: QueryParams = {}): Observable<IncomeStatement> {
    return this.api.get<IncomeStatement>(this.endpoint('admin/accounting/income-statement'), {
      params,
    });
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
