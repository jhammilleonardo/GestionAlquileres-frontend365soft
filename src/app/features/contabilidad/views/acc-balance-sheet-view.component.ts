import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppTableComponent } from '../../../shared/ui/table/table.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppStatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Balance general (activos / pasivos / patrimonio). */
@Component({
  selector: 'app-acc-balance-sheet-view',
  standalone: true,
  imports: [
    TranslocoModule,
    AppTableComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
    TenantCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (f.balanceSheet(); as bs) {
      <div class="acc-summary">
        <app-status-badge
          [label]="(bs.balanced ? 'accounting.balanced' : 'accounting.unbalanced') | transloco"
          [tone]="bs.balanced ? 'success' : 'danger'"
        />
        <span
          >{{ 'accounting.totals.assets' | transloco }}:
          <strong>{{ bs.total_assets | tenantCurrency }}</strong></span
        >
        <span
          >{{ 'accounting.totals.liabilities' | transloco }}:
          <strong>{{ bs.total_liabilities | tenantCurrency }}</strong></span
        >
        <span
          >{{ 'accounting.totals.equity' | transloco }}:
          <strong>{{ bs.total_equity | tenantCurrency }}</strong></span
        >
      </div>

      <h3>{{ 'accounting.totals.assets' | transloco }}</h3>
      <app-table
        [columns]="f.statementColumns"
        [items]="bs.assets"
        trackBy="code"
        [emptyText]="'accounting.empty' | transloco"
      />

      <h3>{{ 'accounting.totals.liabilities' | transloco }}</h3>
      <app-table
        [columns]="f.statementColumns"
        [items]="bs.liabilities"
        trackBy="code"
        [emptyText]="'accounting.empty' | transloco"
      />

      <h3>{{ 'accounting.totals.equity' | transloco }}</h3>
      <app-table
        [columns]="f.statementColumns"
        [items]="bs.equity"
        trackBy="code"
        [emptyText]="'accounting.empty' | transloco"
      />
    } @else if (f.balanceSheet() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccBalanceSheetViewComponent {
  protected readonly f = inject(ContabilidadFacade);
}
