import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppTableComponent } from '../../../shared/ui/table/table.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppStatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Conciliación bancaria: cuentas + transacciones abiertas. */
@Component({
  selector: 'app-acc-banks-view',
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
    @if (f.openBankTransactions(); as transactions) {
      <section class="acc-health">
        <div>
          <span>{{ 'accounting.banks.title' | transloco }}</span>
          <strong>{{ 'accounting.banks.subtitle' | transloco }}</strong>
        </div>
        <app-status-badge
          [label]="
            'accounting.banks.openCount' | transloco: { count: f.bankTransactionRows().length }
          "
          [tone]="f.bankTransactionRows().length > 0 ? 'warning' : 'success'"
        />
      </section>

      <section class="acc-operational-grid">
        <article class="acc-panel">
          <header>
            <div>
              <h3>{{ 'accounting.dashboard.banksTitle' | transloco }}</h3>
              <p>{{ 'accounting.dashboard.banksSubtitle' | transloco }}</p>
            </div>
            <div class="acc-owner-totals">
              <span>
                {{ 'accounting.dashboard.bankBookBalance' | transloco }}
                <strong>{{
                  f.dashboard()?.banks?.total_book_balance ?? 0 | tenantCurrency
                }}</strong>
              </span>
              <span>
                {{ 'accounting.dashboard.bankUnreconciled' | transloco }}
                <strong>{{
                  f.dashboard()?.banks?.unreconciled_transactions ?? transactions.length
                }}</strong>
              </span>
            </div>
          </header>
          <app-table
            [columns]="f.bankColumns"
            [items]="f.bankAccounts()"
            trackBy="id"
            [emptyText]="'accounting.dashboard.noBankAccounts' | transloco"
            [ariaLabel]="'accounting.dashboard.banksTitle' | transloco"
          />
        </article>

        <article class="acc-panel">
          <header>
            <div>
              <h3>{{ 'accounting.banks.openTransactions' | transloco }}</h3>
              <p>{{ 'accounting.banks.openTransactionsDetail' | transloco }}</p>
            </div>
            <strong>{{ transactions.length }}</strong>
          </header>
          <app-table
            [columns]="f.bankTransactionColumns"
            [items]="f.bankTransactionRows()"
            trackBy="id"
            [emptyText]="'accounting.banks.noOpenTransactions' | transloco"
            [ariaLabel]="'accounting.banks.openTransactions' | transloco"
          />
        </article>
      </section>
    } @else if (f.openBankTransactions() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccBanksViewComponent {
  protected readonly f = inject(ContabilidadFacade);
}
