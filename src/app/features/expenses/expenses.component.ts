import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Download, Plus } from 'lucide-angular';

import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ExpenseBalanceCardComponent } from './components/expense-balance-card/expense-balance-card.component';
import { ExpenseChartComponent } from './components/expense-chart/expense-chart.component';
import { ExpenseFiltersComponent } from './components/expense-filters/expense-filters.component';
import { ExpenseFormDialogComponent } from './components/expense-form-dialog/expense-form-dialog.component';
import { ExpenseTableComponent } from './components/expense-table/expense-table.component';
import { ExpensesFacade } from './expenses.facade';

@Component({
  selector: 'app-expenses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    ExpenseBalanceCardComponent,
    ExpenseChartComponent,
    ExpenseFiltersComponent,
    ExpenseFormDialogComponent,
    ExpenseTableComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'contabilidad', alias: 'accounting' })],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent extends ExpensesFacade {
  readonly Plus = Plus;
  readonly Download = Download;
}
