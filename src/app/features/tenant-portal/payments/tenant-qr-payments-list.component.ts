import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import {
  LucideAngularModule,
  QrCode,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Banknote,
} from 'lucide-angular';

import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  QrPayment,
  QrPaymentStatus,
  QrPaymentStatusLabels,
  QrPaymentStatusColors,
  PaymentTypeLabels,
  CurrencySymbols,
  Currency,
  PaymentType,
} from '../../../core/models/payment.model';
import { TranslocoModule } from '@jsverse/transloco';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';

@Component({
  selector: 'app-tenant-qr-payments-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
  ],
  template: `
    <div class="qrl-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <lucide-icon [img]="QrCode" [size]="32" class="icon-primary"></lucide-icon>
          <div>
            <h1>{{ 'public.tenantPayments.qrTitle' | transloco }}</h1>
            <p>{{ 'public.tenantPayments.qrSubtitle' | transloco }}</p>
          </div>
        </div>
        <button mat-raised-button color="primary" [routerLink]="nuevoQrUrl()">
          <lucide-icon [img]="Plus" [size]="20"></lucide-icon>
          {{ 'public.tenantPayments.generateQr' | transloco }}
        </button>
      </div>

      <!-- Error -->
      @if (qrService.error()) {
        <div class="alert-error">
          <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
          <span>{{ qrService.error() }}</span>
        </div>
      }

      <!-- Loading -->
      @if (qrService.isLoading() && qrService.qrList().length === 0) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>{{ 'public.tenantPayments.loadingQrHistory' | transloco }}</p>
        </div>
      }

      <!-- Empty -->
      @else if (!qrService.isLoading() && qrService.qrList().length === 0) {
        <mat-card class="empty-card">
          <lucide-icon [img]="QrCode" [size]="60" class="empty-icon"></lucide-icon>
          <h2>{{ 'public.tenantPayments.noQrTitle' | transloco }}</h2>
          <p>{{ 'public.tenantPayments.noQrDesc' | transloco }}</p>
          <button mat-raised-button color="primary" [routerLink]="nuevoQrUrl()">
            <lucide-icon [img]="Plus" [size]="20"></lucide-icon>
            {{ 'public.tenantPayments.generateFirstQr' | transloco }}
          </button>
        </mat-card>
      }

      <!-- List -->
      @else {
        <mat-card class="list-card">
          <div class="list-header">
            <span class="list-count">{{
              'public.tenantPayments.qrRecordsCount'
                | transloco: { count: qrService.qrList().length }
            }}</span>
            <button
              mat-icon-button
              (click)="qrService.loadQrList()"
              [disabled]="qrService.isLoading()"
              [attr.aria-label]="'public.tenantPayments.reload' | transloco"
            >
              <lucide-icon [img]="RefreshCw" [size]="18"></lucide-icon>
            </button>
          </div>
          <mat-divider></mat-divider>

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
                <span
                  class="status-badge"
                  [style.background]="statusBg(qr.status)"
                  [style.color]="statusColor(qr.status)"
                >
                  {{ statusLabel(qr.status) }}
                </span>

                <!-- Acción cancelar si pendiente -->
                @if (qr.status === QrStatus.PENDIENTE) {
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="onCancel(qr)"
                    [disabled]="cancellingId() === qr.id"
                    [attr.aria-label]="'public.tenantPayments.cancelQr' | transloco"
                  >
                    @if (cancellingId() === qr.id) {
                      <mat-spinner diameter="16"></mat-spinner>
                    } @else {
                      <lucide-icon [img]="XCircle" [size]="18"></lucide-icon>
                    }
                  </button>
                }
              </div>
              <mat-divider></mat-divider>
            }
          </div>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .qrl-container {
        max-width: 800px;
        margin: 0 auto;
      }

      /* Header */
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .icon-primary {
        color: var(--mat-sys-primary, #1976d2);
      }
      .header-left h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }
      .header-left p {
        color: #64748b;
        margin: 0;
        font-size: 0.875rem;
      }

      /* Alert */
      .alert-error {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fee2e2;
        color: #dc2626;
        padding: 14px 18px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      /* States */
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px;
        color: #64748b;
        gap: 16px;
      }
      .empty-card {
        padding: 56px 32px;
        text-align: center;
      }
      .empty-icon {
        color: #cbd5e1;
        margin-bottom: 16px;
      }
      .empty-card h2 {
        color: #1e293b;
        margin: 0 0 8px;
      }
      .empty-card p {
        color: #64748b;
        margin: 0 0 24px;
      }

      /* List */
      .list-card {
        padding: 0;
        overflow: hidden;
      }
      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
      }
      .list-count {
        font-size: 0.8rem;
        color: #94a3b8;
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
        transition: background 0.1s;
      }
      .qr-row:hover {
        background: #f8fafc;
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
        color: #1e293b;
      }
      .qr-date {
        font-size: 0.78rem;
        color: #94a3b8;
      }
      .qr-tx {
        font-family: monospace;
        font-size: 0.75rem;
        color: #64748b;
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
        color: #1e293b;
      }
      .amount-currency {
        font-size: 0.72rem;
        color: #94a3b8;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
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
        .status-badge {
          order: 3;
        }
      }
    `,
  ],
})
export class TenantQrPaymentsListComponent implements OnInit {
  // ── Icons ─────────────────────────────────────────────────────────
  readonly QrCode = QrCode;
  readonly Plus = Plus;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertCircle = AlertCircle;
  readonly RefreshCw = RefreshCw;
  readonly Banknote = Banknote;

  // ── Services ──────────────────────────────────────────────────────
  qrService = inject(TenantQrPaymentService);
  private slugService = inject(SlugService);

  // ── Enum exposed to template ──────────────────────────────────────
  QrStatus = QrPaymentStatus;

  // ── State ─────────────────────────────────────────────────────────
  cancellingId = signal<number | null>(null);

  nuevoQrUrl = () => this.slugService.buildUrl('/portal/pagos/qr/nuevo');

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    this.qrService.loadQrList();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  statusLabel(s: QrPaymentStatus): string {
    return QrPaymentStatusLabels[s] ?? s;
  }

  statusColor(s: QrPaymentStatus): string {
    return QrPaymentStatusColors[s] ?? '#475569';
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
