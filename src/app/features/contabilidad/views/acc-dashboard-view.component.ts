import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';
import { AppTableComponent } from '../../../shared/ui/table/table.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppStatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Panel operativo: salud financiera, métricas, cobranza, pagos, propietarios, bancos, impuestos. */
@Component({
  selector: 'app-acc-dashboard-view',
  standalone: true,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    AppTableComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
    TenantCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (f.dashboard()) {
      <section class="acc-health">
        <div>
          <span>{{ 'accounting.dashboard.financialHealth' | transloco }}</span>
          <strong>{{ 'accounting.dashboard.period' | transloco }}</strong>
        </div>
        <app-status-badge
          [label]="
            (f.dashboardTrialBalance()?.balanced && f.dashboardBalanceSheet()?.balanced
              ? 'accounting.balanced'
              : 'accounting.unbalanced'
            ) | transloco
          "
          [tone]="f.healthTone()"
        />
      </section>

      <section class="acc-metrics" [attr.aria-label]="'accounting.dashboard.metrics' | transloco">
        @for (metric of f.dashboardMetrics(); track metric.label) {
          <article class="acc-metric" [class]="'tone-' + metric.tone">
            <div class="acc-metric-icon">
              <lucide-icon [img]="metric.icon" [size]="20" />
            </div>
            <div>
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.detail }}</small>
            </div>
          </article>
        }
      </section>

      <section class="acc-operational-grid">
        <article class="acc-panel">
          <header>
            <div>
              <h3>{{ 'accounting.dashboard.receivablesTitle' | transloco }}</h3>
              <p>{{ 'accounting.dashboard.receivablesSubtitle' | transloco }}</p>
            </div>
            <strong>{{
              f.dashboardLedger()?.summary?.total_receivable ?? 0 | tenantCurrency
            }}</strong>
          </header>
          <app-table
            [columns]="f.receivableColumns"
            [items]="f.receivables()"
            trackBy="key"
            [emptyText]="'accounting.dashboard.noReceivables' | transloco"
            [ariaLabel]="'accounting.dashboard.receivablesTitle' | transloco"
          />
        </article>

        <article class="acc-panel">
          <header>
            <div>
              <h3>{{ 'accounting.dashboard.payablesTitle' | transloco }}</h3>
              <p>{{ 'accounting.dashboard.payablesSubtitle' | transloco }}</p>
            </div>
            <strong>{{ f.totalPayables() | tenantCurrency }}</strong>
          </header>
          <app-table
            [columns]="f.payableColumns"
            [items]="f.payables()"
            trackBy="id"
            [emptyText]="'accounting.dashboard.noPayables' | transloco"
            [ariaLabel]="'accounting.dashboard.payablesTitle' | transloco"
          />
        </article>

        <article class="acc-panel">
          <header>
            <div>
              <h3>{{ 'accounting.dashboard.ownersTitle' | transloco }}</h3>
              <p>{{ 'accounting.dashboard.ownersSubtitle' | transloco }}</p>
            </div>
            <div class="acc-owner-totals">
              <span>
                {{ 'accounting.dashboard.ownerPending' | transloco }}
                <strong>{{ f.dashboard()?.owners?.pending_total ?? 0 | tenantCurrency }}</strong>
              </span>
              <span>
                {{ 'accounting.dashboard.ownerTransferred' | transloco }}
                <strong>{{
                  f.dashboard()?.owners?.transferred_total ?? 0 | tenantCurrency
                }}</strong>
              </span>
            </div>
          </header>
          <app-table
            [columns]="f.ownerStatementColumns"
            [items]="f.ownerStatements()"
            trackBy="id"
            [emptyText]="'accounting.dashboard.noOwnerStatements' | transloco"
            [ariaLabel]="'accounting.dashboard.ownersTitle' | transloco"
          />
        </article>

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
                <strong>{{ f.dashboard()?.banks?.unreconciled_transactions ?? 0 }}</strong>
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
              <h3>{{ 'accounting.dashboard.taxesTitle' | transloco }}</h3>
              <p>{{ 'accounting.dashboard.taxesSubtitle' | transloco }}</p>
            </div>
            <app-status-badge [label]="f.dashboard()?.tax_profile?.country ?? '-'" tone="info" />
          </header>
          <div class="acc-tax-grid">
            <div>
              <span>{{ f.dashboard()?.tax_profile?.tax_id_label }}</span>
              <strong>{{
                f.dashboard()?.tax_profile?.tax_id ||
                  ('accounting.dashboard.taxIdMissing' | transloco)
              }}</strong>
            </div>
            <div>
              <span>{{ 'accounting.dashboard.legalName' | transloco }}</span>
              <strong>{{
                f.dashboard()?.tax_profile?.legal_name ||
                  ('accounting.dashboard.legalNameMissing' | transloco)
              }}</strong>
            </div>
            <div>
              <span>{{ 'accounting.dashboard.accountingBasis' | transloco }}</span>
              <strong>{{ f.dashboard()?.tax_profile?.accounting_basis }}</strong>
            </div>
          </div>
          <div class="acc-tax-lists">
            <section>
              <h4>{{ 'accounting.dashboard.taxReports' | transloco }}</h4>
              <ul>
                @for (report of f.dashboard()?.tax_profile?.required_reports ?? []; track report) {
                  <li>{{ report }}</li>
                }
              </ul>
            </section>
            <section>
              <h4>{{ 'accounting.dashboard.taxControls' | transloco }}</h4>
              <ul>
                @for (note of f.dashboard()?.tax_profile?.operational_notes ?? []; track note) {
                  <li>{{ note }}</li>
                }
              </ul>
            </section>
          </div>
        </article>
      </section>

      <section class="acc-next">
        <div class="acc-next-icon">
          <lucide-icon [img]="AlertTriangle" [size]="18" />
        </div>
        <div>
          <strong>{{ 'accounting.dashboard.nextPhaseTitle' | transloco }}</strong>
          <p>{{ 'accounting.dashboard.nextPhaseText' | transloco }}</p>
        </div>
      </section>
    } @else if (f.dashboard() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccDashboardViewComponent {
  protected readonly f = inject(ContabilidadFacade);
  readonly AlertTriangle = AlertTriangle;
}
