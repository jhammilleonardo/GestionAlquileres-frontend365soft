import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Mail, Pencil, Phone, X } from 'lucide-angular';

import {
  AdminTenantUser,
  TenantLedger,
  TenantMaintenanceItem,
} from '../../../../core/models/tenant-user.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';
import { AppStatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';
import type { AppStatusTone } from '../../../../shared/ui/status-badge/status-badge.component';
import {
  AppLedgerLine,
  AppLedgerTableComponent,
} from '../../../../shared/ui/ledger-table/ledger-table.component';

/** Mapea estados de pago a tono de badge. */
const PAYMENT_TONE: Record<string, AppStatusTone> = {
  APPROVED: 'success',
  PENDING: 'warning',
  PROCESSING: 'warning',
  REJECTED: 'danger',
  FAILED: 'danger',
  DISPUTED: 'danger',
  REFUNDED: 'neutral',
  REVERSED: 'neutral',
};

/** Mapea estados de mantenimiento a tono de badge. */
const MAINTENANCE_TONE: Record<string, AppStatusTone> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  DEFERRED: 'neutral',
  CLOSED: 'neutral',
};

/**
 * Panel lateral con el detalle de un inquilino: contacto, contrato vigente,
 * rent ledger (saldo/cargos/pagos) e historial de mantenimiento.
 */
@Component({
  selector: 'app-tenant-detail-panel',
  standalone: true,
  imports: [
    DatePipe,
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
    AppLedgerTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-backdrop" (click)="closed.emit()" aria-hidden="true"></div>
    <aside
      class="panel"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="'tenants.detail.title' | transloco"
    >
      <header class="panel__header">
        <div class="panel__id">
          <div class="avatar" aria-hidden="true">{{ tenant().name.slice(0, 1).toUpperCase() }}</div>
          <div>
            <h2>{{ tenant().name }}</h2>
            <app-status-badge
              [label]="'tenants.leaseStatus.' + (tenant().lease_status ?? 'none') | transloco"
              [tone]="leaseTone()"
            />
          </div>
        </div>
        <button
          type="button"
          class="icon-btn"
          (click)="closed.emit()"
          [attr.aria-label]="'common.close' | transloco"
        >
          <lucide-icon [img]="X" [size]="20" />
        </button>
      </header>

      <div class="panel__body">
        <section class="panel__section">
          <h3>{{ 'tenants.detail.contact' | transloco }}</h3>
          <ul class="contact-list">
            <li>
              <lucide-icon [img]="Mail" [size]="16" aria-hidden="true" />
              <span>{{ tenant().email }}</span>
            </li>
            @if (tenant().phone) {
              <li>
                <lucide-icon [img]="Phone" [size]="16" aria-hidden="true" />
                <span>{{ tenant().phone }}</span>
              </li>
            }
          </ul>
          <app-button appearance="secondary" size="s" (clicked)="editRequested.emit()">
            <lucide-icon [img]="Pencil" [size]="16" aria-hidden="true" />
            {{ 'tenants.detail.edit' | transloco }}
          </app-button>
        </section>

        <section class="panel__section">
          <h3>{{ 'tenants.detail.lease' | transloco }}</h3>
          @if (tenant().current_contract_id) {
            <dl class="info-grid">
              <div>
                <dt>{{ 'tenants.detail.contractNumber' | transloco }}</dt>
                <dd>{{ tenant().contract_number || '—' }}</dd>
              </div>
              <div>
                <dt>{{ 'tenants.monthlyRent' | transloco }}</dt>
                <dd>{{ monthlyRent() | tenantCurrency: tenant().currency || 'BOB' }}</dd>
              </div>
              <div>
                <dt>{{ 'tenants.detail.property' | transloco }}</dt>
                <dd>{{ tenant().property_title || '—' }}</dd>
              </div>
              <div>
                <dt>{{ 'tenants.leaseEnd' | transloco }}</dt>
                <dd>
                  {{ tenant().end_date ? (tenant().end_date | date: 'mediumDate') : '—' }}
                </dd>
              </div>
            </dl>
          } @else {
            <p class="muted">{{ 'tenants.detail.noLease' | transloco }}</p>
          }
        </section>

        <section class="panel__section">
          <h3>{{ 'tenants.detail.ledger' | transloco }}</h3>
          @if (ledgerLoading()) {
            <app-loading-state [label]="'tenants.detail.ledgerLoading' | transloco" />
          } @else if (ledger(); as data) {
            <div class="ledger-summary">
              <article>
                <span>{{ 'tenants.detail.totalCharged' | transloco }}</span>
                <strong>{{ data.summary.total_charged | tenantCurrency: data.currency }}</strong>
              </article>
              <article>
                <span>{{ 'tenants.detail.totalPaid' | transloco }}</span>
                <strong>{{ data.summary.total_paid | tenantCurrency: data.currency }}</strong>
              </article>
              <article [class.alert]="data.summary.balance_due > 0">
                <span>{{ 'tenants.balanceDue' | transloco }}</span>
                <strong>{{ data.summary.balance_due | tenantCurrency: data.currency }}</strong>
              </article>
            </div>
            <app-ledger-table
              [lines]="ledgerLines()"
              [currency]="data.currency"
              [dateLabel]="'tenants.detail.date' | transloco"
              [conceptLabel]="'tenants.detail.concept' | transloco"
              [amountLabel]="'tenants.detail.amount' | transloco"
              [balanceLabel]="'tenants.detail.balance' | transloco"
              [emptyLabel]="'tenants.detail.noMovements' | transloco"
            />
          }
        </section>

        <section class="panel__section">
          <h3>{{ 'tenants.detail.maintenance' | transloco }}</h3>
          @if (maintenanceLoading()) {
            <app-loading-state [label]="'tenants.detail.maintenanceLoading' | transloco" />
          } @else if (maintenance().length === 0) {
            <p class="muted">{{ 'tenants.detail.noMaintenance' | transloco }}</p>
          } @else {
            <ul class="maintenance-list">
              @for (item of maintenance(); track item.id) {
                <li>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <span class="muted">{{ item.ticket_number }}</span>
                  </div>
                  <div class="maintenance-meta">
                    <app-status-badge
                      [label]="'tenants.detail.maintenanceStatus.' + item.status | transloco"
                      [tone]="maintenanceTone(item.status)"
                    />
                    <span class="muted">{{ item.created_at | date: 'mediumDate' }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </section>
      </div>
    </aside>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 50;
    }

    .panel-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
    }

    .panel {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      inline-size: min(560px, 100%);
      background: var(--tui-background-base);
      box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem;
      border-bottom: 1px solid var(--tui-background-neutral-1);
    }

    .panel__id {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .panel__id h2 {
      margin: 0 0 0.25rem;
      font-size: 1.125rem;
    }

    .avatar {
      display: grid;
      place-items: center;
      inline-size: 2.75rem;
      block-size: 2.75rem;
      border-radius: 999px;
      background: var(--tui-background-neutral-1);
      font-weight: 700;
    }

    .icon-btn {
      display: grid;
      place-items: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border: none;
      border-radius: 0.5rem;
      background: transparent;
      cursor: pointer;
      color: var(--tui-text-secondary);
    }

    .icon-btn:hover {
      background: var(--tui-background-neutral-1);
    }

    .panel__body {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .panel__section h3 {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--tui-text-secondary);
    }

    .contact-list {
      list-style: none;
      margin: 0 0 0.75rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .contact-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin: 0;
    }

    @media (min-width: 480px) {
      .info-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .info-grid dt {
      font-size: 0.75rem;
      color: var(--tui-text-secondary);
    }

    .info-grid dd {
      margin: 0.125rem 0 0;
      font-weight: 600;
    }

    .ledger-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-block-end: 1rem;
    }

    .ledger-summary article {
      padding: 0.75rem;
      border: 1px solid var(--tui-background-neutral-1);
      border-radius: 0.625rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .ledger-summary article.alert {
      border-color: #ffca00;
      background: rgba(255, 202, 0, 0.08);
    }

    .ledger-summary span {
      font-size: 0.6875rem;
      color: var(--tui-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .ledger-summary strong {
      font-size: 1rem;
      font-variant-numeric: tabular-nums;
    }

    .maintenance-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .maintenance-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--tui-background-neutral-1);
      border-radius: 0.625rem;
    }

    .maintenance-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .muted {
      color: var(--tui-text-secondary);
      font-size: 0.875rem;
    }
  `,
})
export class TenantDetailPanelComponent {
  readonly tenant = input.required<AdminTenantUser>();
  readonly ledger = input<TenantLedger | null>(null);
  readonly ledgerLoading = input(false);
  readonly maintenance = input<TenantMaintenanceItem[]>([]);
  readonly maintenanceLoading = input(false);

  readonly closed = output<void>();
  readonly editRequested = output<void>();

  readonly X = X;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Pencil = Pencil;

  readonly leaseTone = computed<AppStatusTone>(() => {
    const tones: Record<string, AppStatusTone> = {
      active: 'success',
      pending: 'warning',
      past: 'neutral',
      none: 'info',
    };
    return tones[this.tenant().lease_status ?? 'none'];
  });

  readonly monthlyRent = computed<number>(() => Number(this.tenant().monthly_rent ?? 0));

  readonly ledgerLines = computed<AppLedgerLine[]>(() => {
    const data = this.ledger();
    if (!data) return [];
    return data.lines.map((line) => ({
      date: line.date,
      concept: line.payment_type,
      reference: line.reference_number ?? line.payment_method,
      status: {
        label: line.status,
        tone: PAYMENT_TONE[line.status] ?? 'neutral',
      },
      amount: line.amount,
      balance: line.running_balance,
    }));
  });

  protected maintenanceTone(status: string): AppStatusTone {
    return MAINTENANCE_TONE[status] ?? 'neutral';
  }
}
