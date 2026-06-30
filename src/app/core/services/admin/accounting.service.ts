import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import {
  AccountingDashboard,
  AccountingBankMatchCandidate,
  AccountingBankMatchResult,
  AccountingBankTransaction,
  AdminPaymentLedger,
  BalanceSheet,
  ChartAccount,
  CreateJournalEntry,
  FinancialIntegrityReport,
  FinancialIntegrityRemediationResult,
  IncomeStatement,
  PaginatedJournalEntries,
  PostedJournalEntry,
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

  /** Registra un asiento contable manual (ajustes/reclasificaciones). */
  createJournalEntry(dto: CreateJournalEntry): Observable<PostedJournalEntry> {
    return this.api.post<PostedJournalEntry, CreateJournalEntry>(
      this.endpoint('admin/accounting/journal-entries'),
      dto,
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

  getDashboard(params: QueryParams = {}): Observable<AccountingDashboard> {
    return this.api.get<AccountingDashboard>(this.endpoint('admin/accounting/dashboard'), {
      params,
    });
  }

  getOpenBankTransactions(params: QueryParams = {}): Observable<AccountingBankTransaction[]> {
    return this.api.get<AccountingBankTransaction[]>(
      this.endpoint('admin/accounting/bank-transactions/open'),
      { params },
    );
  }

  getBankMatchCandidates(
    bankTransactionId: number,
    params: QueryParams = {},
  ): Observable<AccountingBankMatchCandidate[]> {
    return this.api.get<AccountingBankMatchCandidate[]>(
      this.endpoint(`admin/accounting/bank-transactions/${bankTransactionId}/candidates`),
      { params },
    );
  }

  matchBankTransaction(
    bankTransactionId: number,
    journalLineId: number,
  ): Observable<AccountingBankMatchResult> {
    return this.api.post<
      AccountingBankMatchResult,
      { bank_transaction_id: number; journal_line_id: number }
    >(this.endpoint('admin/accounting/bank-transactions/match'), {
      bank_transaction_id: bankTransactionId,
      journal_line_id: journalLineId,
    });
  }

  getFinancialIntegrity(): Observable<FinancialIntegrityReport> {
    return this.api.get<FinancialIntegrityReport>(this.endpoint('admin/accounting/integrity'));
  }

  reprocessApprovedPaymentPostings(limit = 50): Observable<FinancialIntegrityRemediationResult> {
    return this.api.post<FinancialIntegrityRemediationResult, object>(
      this.endpoint('admin/accounting/integrity/reprocess-payments'),
      {},
      { params: { limit } },
    );
  }

  reprocessExpensePostings(limit = 50): Observable<FinancialIntegrityRemediationResult> {
    return this.api.post<FinancialIntegrityRemediationResult, object>(
      this.endpoint('admin/accounting/integrity/reprocess-expenses'),
      {},
      { params: { limit } },
    );
  }

  getPaymentLedger(): Observable<AdminPaymentLedger> {
    return this.api.get<AdminPaymentLedger>(this.endpoint('admin/payments/ledger'));
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
