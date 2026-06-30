import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ContabilidadFacade } from './contabilidad.facade';
import { AccountingService } from '../../core/services/admin/accounting.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { FormatService } from '../../core/services/format.service';
import { TranslocoService } from '@jsverse/transloco';

function buildAccountingMock() {
  return {
    getTrialBalance: vi.fn(() => of(null)),
    getBalanceSheet: vi.fn(() => of(null)),
    getIncomeStatement: vi.fn(() => of(null)),
    getChartOfAccounts: vi.fn(() => of([])),
    getJournalEntries: vi.fn(() => of({ data: [], total: 0 })),
    getDashboard: vi.fn(() => of(null)),
    getFinancialIntegrity: vi.fn(() => of(null)),
    getOpenBankTransactions: vi.fn(() => of([])),
    createJournalEntry: vi.fn(() => of({ id: 1, entryNumber: 'JE-1' })),
    reprocessApprovedPaymentPostings: vi.fn(() => of({})),
    reprocessExpensePostings: vi.fn(() => of({})),
  };
}

describe('ContabilidadFacade', () => {
  let facade: ContabilidadFacade;
  let accounting: ReturnType<typeof buildAccountingMock>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  function setup(): void {
    accounting = buildAccountingMock();
    toastSuccess = vi.fn();
    toastError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        ContabilidadFacade,
        { provide: AccountingService, useValue: accounting },
        { provide: ToastService, useValue: { success: toastSuccess, error: toastError } },
        { provide: FormatService, useValue: { formatCurrency: (v: number) => `$${v}` } },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    });
    facade = TestBed.inject(ContabilidadFacade);
  }

  it('applyFilters traslada los inputs a los filtros activos', () => {
    setup();
    facade.fromInput.set('2026-01-01');
    facade.toInput.set('2026-01-31');
    facade.applyFilters();
    expect(facade.filters()).toEqual({ from: '2026-01-01', to: '2026-01-31' });
  });

  it('clearFilters limpia inputs y filtros', () => {
    setup();
    facade.fromInput.set('2026-01-01');
    facade.applyFilters();
    facade.clearFilters();
    expect(facade.filters()).toEqual({ from: '', to: '' });
    expect(facade.fromInput()).toBe('');
  });

  it('postJournalEntry postea, notifica éxito y cierra el diálogo', () => {
    setup();
    facade.openJournalDialog();
    facade.postJournalEntry({
      entryDate: '2026-06-27',
      description: 'Ajuste',
      lines: [
        { accountCode: '1100', debit: 100 },
        { accountCode: '4100', credit: 100 },
      ],
    });
    expect(accounting.createJournalEntry).toHaveBeenCalledTimes(1);
    expect(facade.journalDialogOpen()).toBe(false);
    expect(facade.postingEntry()).toBe(false);
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('postJournalEntry notifica error y mantiene el diálogo abierto si falla', () => {
    setup();
    accounting.createJournalEntry.mockReturnValueOnce(throwError(() => new Error('boom')));
    facade.openJournalDialog();
    facade.postJournalEntry({
      entryDate: '2026-06-27',
      description: 'Ajuste',
      lines: [
        { accountCode: '1100', debit: 100 },
        { accountCode: '4100', credit: 100 },
      ],
    });
    expect(toastError).toHaveBeenCalled();
    expect(facade.journalDialogOpen()).toBe(true);
    expect(facade.postingEntry()).toBe(false);
  });

  it('onViewChange cambia la vista activa', () => {
    setup();
    facade.onViewChange('journal');
    expect(facade.view()).toBe('journal');
    facade.onViewChange(null);
    expect(facade.view()).toBe('trial-balance');
  });
});
