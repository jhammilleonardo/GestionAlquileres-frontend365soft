import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AccountingService } from './accounting.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

describe('AccountingService', () => {
  let service: AccountingService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of([]));
    post = vi.fn().mockReturnValue(of({}));
    TestBed.configureTestingModule({
      providers: [
        AccountingService,
        { provide: ApiClientService, useValue: { get, post } },
        {
          provide: SlugService,
          useValue: { buildApiEndpoint: (p: string) => `acme/${p}` },
        },
      ],
    });
    service = TestBed.inject(AccountingService);
  });

  it('getChartOfAccounts pega al endpoint del plan de cuentas', () => {
    service.getChartOfAccounts().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/chart-of-accounts', { params: {} });
  });

  it('getTrialBalance pega a la balanza de comprobación', () => {
    service.getTrialBalance().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/trial-balance', {
      params: {},
    });
  });

  it('getBalanceSheet pega al balance general', () => {
    service.getBalanceSheet().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/balance-sheet', {
      params: {},
    });
  });

  it('getIncomeStatement pega al estado de resultados', () => {
    service.getIncomeStatement().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/income-statement', {
      params: {},
    });
  });

  it('getJournalEntries reenvía los parámetros de consulta', () => {
    service.getJournalEntries({ limit: 10 }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/journal-entries', {
      params: { limit: 10 },
    });
  });

  it('createJournalEntry postea un asiento manual al libro diario', () => {
    const dto = {
      entryDate: '2026-06-27',
      description: 'Ajuste',
      basis: 'accrual' as const,
      lines: [
        { accountCode: '1100', debit: 100 },
        { accountCode: '4100', credit: 100 },
      ],
    };
    service.createJournalEntry(dto).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/accounting/journal-entries', dto);
  });

  it('getDashboard usa el endpoint operativo de contabilidad', () => {
    service.getDashboard({ from: '2026-06-01' }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/dashboard', {
      params: { from: '2026-06-01' },
    });
  });

  it('getOpenBankTransactions usa el endpoint de conciliación bancaria', () => {
    service.getOpenBankTransactions({ bankAccountId: 4 }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/bank-transactions/open', {
      params: { bankAccountId: 4 },
    });
  });

  it('getBankMatchCandidates usa el endpoint de candidatos de conciliación', () => {
    service.getBankMatchCandidates(7, { limit: 5 }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/bank-transactions/7/candidates', {
      params: { limit: 5 },
    });
  });

  it('matchBankTransaction envía la transacción bancaria y línea contable', () => {
    service.matchBankTransaction(7, 20).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/accounting/bank-transactions/match', {
      bank_transaction_id: 7,
      journal_line_id: 20,
    });
  });

  it('getFinancialIntegrity usa el endpoint de auditoría financiera', () => {
    service.getFinancialIntegrity().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/accounting/integrity');
  });

  it('reprocessApprovedPaymentPostings usa el endpoint de remediación', () => {
    service.reprocessApprovedPaymentPostings(25).subscribe();
    expect(post).toHaveBeenCalledWith(
      'acme/admin/accounting/integrity/reprocess-payments',
      {},
      { params: { limit: 25 } },
    );
  });

  it('reprocessExpensePostings usa el endpoint de remediación de gastos', () => {
    service.reprocessExpensePostings(30).subscribe();
    expect(post).toHaveBeenCalledWith(
      'acme/admin/accounting/integrity/reprocess-expenses',
      {},
      { params: { limit: 30 } },
    );
  });

  it('getPaymentLedger usa el ledger financiero de pagos', () => {
    service.getPaymentLedger().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/payments/ledger');
  });
});
