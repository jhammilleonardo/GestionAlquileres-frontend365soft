import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppTableComponent } from '../../../shared/ui/table/table.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Estado de resultados (ingresos / gastos / resultado neto). */
@Component({
  selector: 'app-acc-income-statement-view',
  standalone: true,
  imports: [
    TranslocoModule,
    AppTableComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    TenantCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (f.incomeStatement(); as is) {
      <div class="acc-summary">
        <span
          >{{ 'accounting.totals.income' | transloco }}:
          <strong>{{ is.total_income | tenantCurrency }}</strong></span
        >
        <span
          >{{ 'accounting.totals.expenses' | transloco }}:
          <strong>{{ is.total_expenses | tenantCurrency }}</strong></span
        >
        <span class="acc-net"
          >{{ 'accounting.totals.netIncome' | transloco }}:
          <strong>{{ is.net_income | tenantCurrency }}</strong></span
        >
      </div>

      <h3>{{ 'accounting.totals.income' | transloco }}</h3>
      <app-table
        [columns]="f.statementColumns"
        [items]="is.income"
        trackBy="code"
        [emptyText]="'accounting.empty' | transloco"
      />

      <h3>{{ 'accounting.totals.expenses' | transloco }}</h3>
      <app-table
        [columns]="f.statementColumns"
        [items]="is.expenses"
        trackBy="code"
        [emptyText]="'accounting.empty' | transloco"
      />
    } @else if (f.incomeStatement() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccIncomeStatementViewComponent {
  protected readonly f = inject(ContabilidadFacade);
}
