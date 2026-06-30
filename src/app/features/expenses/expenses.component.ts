import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Download, Plus } from 'lucide-angular';

import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
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
    DecimalPipe,
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    AppTextareaComponent,
    AppTextFieldComponent,
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
