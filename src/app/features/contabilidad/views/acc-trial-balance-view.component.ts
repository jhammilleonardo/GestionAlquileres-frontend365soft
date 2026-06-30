import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppTableComponent } from '../../../shared/ui/table/table.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppStatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Balanza de comprobación. */
@Component({
  selector: 'app-acc-trial-balance-view',
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
    @if (f.trialBalance(); as tb) {
      <div class="acc-summary">
        <app-status-badge
          [label]="(tb.balanced ? 'accounting.balanced' : 'accounting.unbalanced') | transloco"
          [tone]="tb.balanced ? 'success' : 'danger'"
        />
        <span
          >{{ 'accounting.cols.debit' | transloco }}:
          <strong>{{ tb.total_debit | tenantCurrency }}</strong></span
        >
        <span
          >{{ 'accounting.cols.credit' | transloco }}:
          <strong>{{ tb.total_credit | tenantCurrency }}</strong></span
        >
      </div>
      <app-table
        [columns]="f.trialBalanceColumns"
        [items]="tb.rows"
        trackBy="code"
        [emptyText]="'accounting.empty' | transloco"
        [ariaLabel]="'accounting.views.trialBalance' | transloco"
      />
    } @else if (f.trialBalance() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccTrialBalanceViewComponent {
  protected readonly f = inject(ContabilidadFacade);
}
