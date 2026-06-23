import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';

import { AccountingService } from '../../core/services/admin/accounting.service';
import {
  ChartAccount,
  JournalEntryView,
  StatementLine,
  TrialBalanceRow,
} from '../../core/models/accounting.model';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSegmentedControlComponent } from '../../shared/ui/segmented-control/segmented-control.component';
import type { AppSegmentedControlOption } from '../../shared/ui/segmented-control/segmented-control.component';
import { AppTableColumn, AppTableComponent } from '../../shared/ui/table/table.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { FormatService } from '../../core/services/format.service';

type AccountingView = 'trial-balance' | 'balance-sheet' | 'income-statement' | 'chart' | 'journal';

@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    AppPageHeaderComponent,
    AppSegmentedControlComponent,
    AppTableComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppStatusBadgeComponent,
    TenantCurrencyPipe,
  ],
  providers: [provideTranslocoScope({ scope: 'accounting-ledger', alias: 'accounting' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contabilidad.component.html',
  styleUrl: './contabilidad.component.scss',
})
export class ContabilidadComponent {
  private readonly accounting = inject(AccountingService);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);

  readonly view = signal<AccountingView>('trial-balance');

  readonly viewOptions = (): AppSegmentedControlOption<AccountingView>[] => [
    { value: 'trial-balance', label: this.t('accounting.views.trialBalance') },
    { value: 'balance-sheet', label: this.t('accounting.views.balanceSheet') },
    {
      value: 'income-statement',
      label: this.t('accounting.views.incomeStatement'),
    },
    { value: 'chart', label: this.t('accounting.views.chart') },
    { value: 'journal', label: this.t('accounting.views.journal') },
  ];

  // Solo lectura: cada reporte se carga una vez; null = error, undefined = cargando.
  readonly trialBalance = toSignal(
    this.accounting.getTrialBalance().pipe(catchError(() => of(null))),
  );
  readonly balanceSheet = toSignal(
    this.accounting.getBalanceSheet().pipe(catchError(() => of(null))),
  );
  readonly incomeStatement = toSignal(
    this.accounting.getIncomeStatement().pipe(catchError(() => of(null))),
  );
  readonly chart = toSignal(this.accounting.getChartOfAccounts().pipe(catchError(() => of(null))));
  readonly journal = toSignal(this.accounting.getJournalEntries().pipe(catchError(() => of(null))));

  readonly journalEntries = computed<JournalEntryView[]>(() => this.journal()?.data ?? []);

  readonly trialBalanceColumns: AppTableColumn<TrialBalanceRow>[] = [
    { key: 'code', label: this.t('accounting.cols.code') },
    { key: 'name', label: this.t('accounting.cols.account') },
    {
      key: 'debit',
      label: this.t('accounting.cols.debit'),
      align: 'right',
      formatter: (row) => this.money(row.debit),
    },
    {
      key: 'credit',
      label: this.t('accounting.cols.credit'),
      align: 'right',
      formatter: (row) => this.money(row.credit),
    },
  ];

  readonly statementColumns: AppTableColumn<StatementLine>[] = [
    { key: 'code', label: this.t('accounting.cols.code') },
    { key: 'name', label: this.t('accounting.cols.account') },
    {
      key: 'amount',
      label: this.t('accounting.cols.amount'),
      align: 'right',
      formatter: (row) => this.money(row.amount),
    },
  ];

  readonly chartColumns: AppTableColumn<ChartAccount>[] = [
    { key: 'code', label: this.t('accounting.cols.code') },
    { key: 'name', label: this.t('accounting.cols.account') },
    {
      key: 'type',
      label: this.t('accounting.cols.type'),
      formatter: (row) => this.t('accounting.types.' + row.type),
    },
  ];

  readonly journalColumns: AppTableColumn<JournalEntryView>[] = [
    { key: 'entry_number', label: this.t('accounting.cols.entryNumber') },
    { key: 'entry_date', label: this.t('accounting.cols.date') },
    { key: 'description', label: this.t('accounting.cols.description') },
  ];

  onViewChange(value: AccountingView | null): void {
    this.view.set(value ?? 'trial-balance');
  }

  private t(key: string): string {
    return this.transloco.translate(key);
  }

  private money(amount: number): string {
    return this.format.formatCurrency(amount);
  }
}
