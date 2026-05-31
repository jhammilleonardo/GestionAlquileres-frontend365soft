import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  QrCode,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-angular';

import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  QrPayment,
  QrPaymentStatus,
  QrPaymentStatusLabels,
  PaymentTypeLabels,
  CurrencySymbols,
  Currency,
  PaymentType,
} from '../../../core/models/payment.model';
import { TranslocoModule } from '@jsverse/transloco';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-qr-payments-list',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  template: `
    <div class="qrl-container">
      <app-page-header
        [title]="'public.tenantPayments.qrTitle' | transloco"
        [description]="'public.tenantPayments.qrSubtitle' | transloco"
      >
        <a actions class="primary-link-button" [routerLink]="nuevoQrUrl()">
          <lucide-icon [img]="Plus" [size]="20"></lucide-icon>
          {{ 'public.tenantPayments.generateQr' | transloco }}
        </a>
      </app-page-header>

      <!-- Error -->
      @if (qrService.error()) {
        <div class="alert-error">
          <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
          <span>{{ qrService.error() }}</span>
        </div>
      }

      <!-- Loading -->
      @if (qrService.isLoading() && qrService.qrList().length === 0) {
        <div class="state-card">
          <app-loading-state [label]="'public.tenantPayments.loadingQrHistory' | transloco" />
        </div>
      }

      <!-- Empty -->
      @else if (!qrService.isLoading() && qrService.qrList().length === 0) {
        <app-empty-state
          [title]="'public.tenantPayments.noQrTitle' | transloco"
          [description]="'public.tenantPayments.noQrDesc' | transloco"
        >
          <lucide-icon icon [img]="QrCode" [size]="28"></lucide-icon>
          <a actions class="primary-link-button" [routerLink]="nuevoQrUrl()">
            <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
            {{ 'public.tenantPayments.generateFirstQr' | transloco }}
          </a>
        </app-empty-state>
      }

      <!-- List -->
      @else {
        <section class="list-card">
          <div class="list-header">
            <span class="list-count">{{
              'public.tenantPayments.qrRecordsCount'
                | transloco: { count: qrService.qrList().length }
            }}</span>
            <app-button
              appearance="outline"
              size="s"
              (clicked)="qrService.loadQrList()"
              [disabled]="qrService.isLoading()"
              [attr.aria-label]="'public.tenantPayments.reload' | transloco"
            >
              <lucide-icon [img]="RefreshCw" [size]="18"></lucide-icon>
              {{ 'public.tenantPayments.reload' | transloco }}
            </app-button>
          </div>

          <div class="qr-list">
            @for (qr of qrService.qrList(); track qr.id) {
              <div class="qr-row">
                <!-- Icono de estado -->
                <div class="qr-icon" [style.background]="statusBg(qr.status)">
                  @switch (qr.status) {
                    @case (QrStatus.PAGADO) {
                      <lucide-icon
                        [img]="CheckCircle2"
                        [size]="20"
                        style="color:#10b981"
                      ></lucide-icon>
                    }
                    @case (QrStatus.EXPIRADO) {
                      <lucide-icon [img]="Clock" [size]="20" style="color:#64748b"></lucide-icon>
                    }
                    @case (QrStatus.CANCELADO) {
                      <lucide-icon [img]="XCircle" [size]="20" style="color:#ef4444"></lucide-icon>
                    }
                    @default {
                      <lucide-icon [img]="QrCode" [size]="20" style="color:#f59e0b"></lucide-icon>
                    }
                  }
                </div>

                <!-- Info -->
                <div class="qr-info">
                  <span class="qr-type">
                    {{ typeLabel(qr.payment_type) }}
                  </span>
                  <span class="qr-date">{{ qr.created_at | tenantDate }}</span>
                  @if (qr.transaction_id) {
                    <span class="qr-tx"
                      >{{ 'public.tenantPayments.txn' | transloco }} {{ qr.transaction_id }}</span
                    >
                  }
                </div>

                <!-- Monto -->
                <div class="qr-amount">
                  <span class="amount-value">
                    {{ currencySymbol(qr.currency) }}{{ qr.amount | number: '1.2-2' }}
                  </span>
                  <span class="amount-currency">{{ qr.currency }}</span>
                </div>

                <!-- Status badge -->
                <app-status-badge [label]="statusLabel(qr.status)" [tone]="statusTone(qr.status)" />

                <!-- Acción cancelar si pendiente -->
                @if (qr.status === QrStatus.PENDIENTE) {
                  <app-button
                    appearance="destructive"
                    size="s"
                    (clicked)="onCancel(qr)"
                    [disabled]="cancellingId() === qr.id"
                    [loading]="cancellingId() === qr.id"
                    [attr.aria-label]="'public.tenantPayments.cancelQr' | transloco"
                  >
                    <lucide-icon [img]="XCircle" [size]="16"></lucide-icon>
                    {{ 'public.tenantPayments.cancelQr' | transloco }}
                  </app-button>
                }
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .qrl-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .icon-primary {
        color: var(--app-color-primary);
      }

      /* Alert */
      .alert-error {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--app-color-danger-soft);
        color: var(--app-color-danger);
        padding: 14px 18px;
        border-radius: var(--app-radius-md);
        margin-bottom: 20px;
      }

      .state-card {
        display: flex;
        justify-content: center;
        padding: 60px;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
        background: var(--app-color-surface);
      }

      /* List */
      .list-card {
        padding: 0;
        overflow: hidden;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
        background: var(--app-color-surface);
        box-shadow: var(--app-shadow-sm);
      }
      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-bottom: 1px solid var(--app-color-border);
      }
      .list-count {
        font-size: 0.8rem;
        color: var(--app-color-text-muted);
        font-weight: 600;
      }

      .qr-list {
        display: flex;
        flex-direction: column;
      }

      .qr-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--app-color-border);
        transition: background 0.1s;
      }
      .qr-row:hover {
        background: var(--app-color-primary-soft);
      }
      .qr-row:last-child {
        border-bottom: 0;
      }

      .qr-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .qr-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .qr-type {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--app-color-text);
      }
      .qr-date {
        font-size: 0.78rem;
        color: var(--app-color-text-muted);
      }
      .qr-tx {
        font-family: monospace;
        font-size: 0.75rem;
        color: var(--app-color-text-muted);
      }

      .qr-amount {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        flex-shrink: 0;
      }
      .amount-value {
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--app-color-text);
      }
      .amount-currency {
        font-size: 0.72rem;
        color: var(--app-color-text-muted);
      }

      .primary-link-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 40px;
        padding-inline: 16px;
        border-radius: var(--app-radius-md);
        background: var(--app-color-primary);
        color: #fff;
        font-weight: 750;
        text-decoration: none;
      }

      app-status-badge {
        flex-shrink: 0;
      }

      /* Responsive */
      @media (max-width: 600px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
        }
        .page-header button {
          width: 100%;
        }
        .qr-row {
          flex-wrap: wrap;
          gap: 10px;
        }
        .qr-info {
          min-width: 100%;
          order: 2;
        }
        app-status-badge {
          order: 3;
        }
      }
    `,
  ],
})
export class TenantQrPaymentsListComponent {
  // ── Icons ─────────────────────────────────────────────────────────
  readonly QrCode = QrCode;
  readonly Plus = Plus;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertCircle = AlertCircle;
  readonly RefreshCw = RefreshCw;

  // ── Services ──────────────────────────────────────────────────────
  qrService = inject(TenantQrPaymentService);
  private slugService = inject(SlugService);

  // ── Enum exposed to template ──────────────────────────────────────
  QrStatus = QrPaymentStatus;

  // ── State ─────────────────────────────────────────────────────────
  cancellingId = signal<number | null>(null);

  nuevoQrUrl = () => this.slugService.buildUrl('/portal/pagos/qr/nuevo');

  // ── Lifecycle ─────────────────────────────────────────────────────
  constructor() {
    this.qrService.loadQrList();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  statusLabel(s: QrPaymentStatus): string {
    return QrPaymentStatusLabels[s] ?? s;
  }

  statusBg(s: QrPaymentStatus): string {
    const alpha: Record<QrPaymentStatus, string> = {
      [QrPaymentStatus.PENDIENTE]: '#fef3c7',
      [QrPaymentStatus.PAGADO]: '#d1fae5',
      [QrPaymentStatus.EXPIRADO]: '#f1f5f9',
      [QrPaymentStatus.CANCELADO]: '#fee2e2',
    };
    return alpha[s] ?? '#f1f5f9';
  }

  statusTone(s: QrPaymentStatus): AppStatusTone {
    const tones: Record<QrPaymentStatus, AppStatusTone> = {
      [QrPaymentStatus.PENDIENTE]: 'warning',
      [QrPaymentStatus.PAGADO]: 'success',
      [QrPaymentStatus.EXPIRADO]: 'neutral',
      [QrPaymentStatus.CANCELADO]: 'danger',
    };
    return tones[s] ?? 'neutral';
  }

  typeLabel(t: PaymentType): string {
    return PaymentTypeLabels[t] ?? t;
  }

  currencySymbol(code: string): string {
    return CurrencySymbols[code as Currency] ?? code;
  }

  // ── Cancel ────────────────────────────────────────────────────────
  onCancel(qr: QrPayment): void {
    this.cancellingId.set(qr.id);
    this.qrService.cancelQr(qr.id).subscribe({
      next: () => this.cancellingId.set(null),
      error: () => this.cancellingId.set(null),
    });
  }
}
