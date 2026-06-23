import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AccountingService } from './accounting.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

describe('AccountingService', () => {
  let service: AccountingService;
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        AccountingService,
        { provide: ApiClientService, useValue: { get } },
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
});
