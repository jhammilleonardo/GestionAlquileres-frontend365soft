import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SafeUrl } from '@angular/platform-browser';
import { Clock, Download, LucideAngularModule, QrCode, RefreshCw, XCircle } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { QrPayment, QrPaymentStatus } from '../../../../core/models/payment.model';

@Component({
  selector: 'app-tenant-payment-qr-panel',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule, TranslocoModule],
  template: `
    <div class="form-section last">
      <div class="qr-info-banner">
        <lucide-icon [img]="QrCode" [size]="18"></lucide-icon>
        <span>
          {{ 'public.tenantCreatePayment.qrInfoBefore' | transloco }}
          <strong>MC4 / SIP Bolivia</strong>.
          {{ 'public.tenantCreatePayment.qrInfoAfter' | transloco }}
        </span>
      </div>

      @if (activeQr()?.status === QrStatus.EXPIRADO || activeQr()?.status === QrStatus.CANCELADO) {
        <div class="qr-result-msg expired">
          <lucide-icon [img]="XCircle" [size]="20"></lucide-icon>
          <span>{{
            activeQr()!.status === QrStatus.EXPIRADO
              ? ('public.tenantCreatePayment.qrExpired' | transloco)
              : ('public.tenantCreatePayment.qrCancelled' | transloco)
          }}</span>
          <button type="button" class="outline-button" (click)="reset.emit()">
            {{ 'public.tenantCreatePayment.tryAgain' | transloco }}
          </button>
        </div>
      }

      @if (activeQr()?.status === QrStatus.PENDIENTE) {
        <div class="qr-active-section">
          <div class="qr-amount-row">
            <span class="qr-amount-label">{{
              'public.tenantCreatePayment.totalToPay' | transloco
            }}</span>
            <span class="qr-amount-value">
              {{ currencySymbol() }}{{ activeQr()!.amount | number: '1.2-2' }}
              <small>{{ activeQr()!.currency }}</small>
            </span>
            <span class="qr-pending-chip">
              <lucide-icon [img]="Clock" [size]="13"></lucide-icon>
              {{ 'public.tenantCreatePayment.waitingPayment' | transloco }}
            </span>
          </div>

          <div class="qr-image-wrapper">
            @if (safeUrl()) {
              <img [src]="safeUrl()!" alt="Código QR de pago" class="qr-image" />
            } @else {
              <div class="qr-placeholder">
                <lucide-icon [img]="QrCode" [size]="72"></lucide-icon>
                <span>{{ 'public.tenantCreatePayment.generatingQr' | transloco }}</span>
              </div>
            }
          </div>

          <div class="qr-steps">
            <div class="step">
              <span class="step-no">1</span>{{ 'public.tenantCreatePayment.step1' | transloco }}
            </div>
            <div class="step">
              <span class="step-no">2</span>
              <span>
                {{ 'public.tenantCreatePayment.step2Before' | transloco }}
                <strong>{{ 'public.tenantCreatePayment.step2Action' | transloco }}</strong>
                {{ 'public.tenantCreatePayment.step2After' | transloco }}
              </span>
            </div>
            <div class="step">
              <span class="step-no">3</span>{{ 'public.tenantCreatePayment.step3' | transloco }}
            </div>
            <div class="step">
              <span class="step-no">4</span>{{ 'public.tenantCreatePayment.step4' | transloco }}
            </div>
          </div>

          @if (activeQr()?.expires_at) {
            <div class="qr-expires">
              <lucide-icon [img]="Clock" [size]="13"></lucide-icon>
              {{
                'public.tenantCreatePayment.expiresAt' | transloco: { date: formattedExpiration() }
              }}
              <span class="poll-label">
                · {{ 'public.tenantCreatePayment.pollingStatus' | transloco }}
              </span>
            </div>
          }

          <div class="qr-active-actions">
            <button
              type="button"
              class="outline-button"
              (click)="verify.emit()"
              [disabled]="polling()"
            >
              @if (polling()) {
                <span class="button-spinner"></span>
              } @else {
                <lucide-icon [img]="RefreshCw" [size]="16"></lucide-icon>
              }
              {{ 'public.tenantCreatePayment.verifyNow' | transloco }}
            </button>

            @if (safeUrl()) {
              <button type="button" class="outline-button" (click)="download.emit()">
                <lucide-icon [img]="Download" [size]="16"></lucide-icon>
                {{ 'public.tenantCreatePayment.downloadQr' | transloco }}
              </button>
            }

            <button
              type="button"
              class="outline-button danger"
              (click)="cancel.emit()"
              [disabled]="cancelling()"
            >
              @if (cancelling()) {
                <span class="button-spinner"></span>
              } @else {
                <lucide-icon [img]="XCircle" [size]="16"></lucide-icon>
              }
              {{ 'public.tenantCreatePayment.cancelQr' | transloco }}
            </button>
          </div>
        </div>
      }

      @if (!activeQr()) {
        <div class="form-actions">
          <button type="submit" class="primary-button" [disabled]="amountInvalid() || loading()">
            @if (loading()) {
              <span class="button-spinner"></span>
              {{ 'public.tenantCreatePayment.generatingBtn' | transloco }}
            } @else {
              <lucide-icon [img]="QrCode" [size]="20"></lucide-icon>
              {{ 'public.tenantCreatePayment.generateQrBtn' | transloco }}
            }
          </button>
          <button type="button" class="outline-button" (click)="back.emit()">
            {{ 'public.tenantCreatePayment.cancel' | transloco }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .form-section {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--app-color-border);
    }

    .form-section.last {
      border-bottom: 0;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .qr-info-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      color: #1e40af;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .qr-info-banner lucide-icon {
      margin-top: 2px;
      flex-shrink: 0;
      color: #3b82f6;
    }

    .qr-result-msg {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .qr-result-msg.expired {
      background: #fee2e2;
      color: var(--app-color-danger);
    }

    .qr-result-msg button {
      margin-left: auto;
    }

    .qr-active-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .qr-amount-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .qr-amount-label {
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 650;
      text-transform: uppercase;
    }

    .qr-amount-value {
      color: var(--app-color-text);
      font-size: 1.5rem;
      font-weight: 820;
    }

    .qr-amount-value small {
      color: var(--app-color-text-muted);
      font-size: 0.8rem;
      margin-left: 4px;
    }

    .qr-pending-chip {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 999px;
      background: #fef3c7;
      color: #92400e;
      font-size: 0.78rem;
      font-weight: 650;
      margin-left: auto;
    }

    .qr-image-wrapper {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--app-color-surface-muted);
      border-radius: 12px;
      padding: 16px;
      width: 100%;
      margin-bottom: 20px;
      box-sizing: border-box;
    }

    .qr-image {
      width: 100%;
      max-width: 480px;
      height: auto;
      aspect-ratio: 1;
      border-radius: 10px;
      border: 3px solid var(--app-color-border);
      display: block;
    }

    .qr-placeholder {
      width: 100%;
      max-width: 480px;
      aspect-ratio: 1;
      border: 3px dashed var(--app-color-border-strong);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: var(--app-color-text-muted);
    }

    .qr-steps {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      margin-bottom: 16px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--app-color-text-muted);
      font-size: 0.85rem;
    }

    .step-no {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--app-color-primary);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 760;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .qr-expires {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--app-color-text-muted);
      font-size: 0.78rem;
      width: 100%;
      margin-bottom: 16px;
    }

    .poll-label {
      color: var(--app-color-text-subtle);
      font-size: 0.72rem;
    }

    .qr-active-actions,
    .form-actions {
      display: flex;
      gap: 12px;
      width: 100%;
      padding-top: 16px;
      border-top: 1px solid var(--app-color-border);
    }

    .form-actions {
      justify-content: flex-end;
      margin-top: 8px;
    }

    .primary-button,
    .outline-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 10px;
      min-height: 40px;
      padding: 0 16px;
      font: inherit;
      font-weight: 760;
      cursor: pointer;
    }

    .primary-button {
      border: 1px solid var(--app-color-primary);
      background: var(--app-color-primary);
      color: #fff;
    }

    .outline-button {
      border: 1px solid var(--app-color-border-strong);
      background: var(--app-color-surface);
      color: var(--app-color-text);
    }

    .outline-button.danger {
      color: var(--app-color-danger);
      border-color: #fecaca;
    }

    .primary-button:disabled,
    .outline-button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .qr-active-actions .outline-button {
      flex: 1;
    }

    .button-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 999px;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .qr-active-actions,
      .form-actions {
        flex-direction: column;
      }

      .qr-amount-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .qr-pending-chip {
        margin-left: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantPaymentQrPanelComponent {
  readonly activeQr = input<QrPayment | null>(null);
  readonly safeUrl = input<SafeUrl | null>(null);
  readonly currencySymbol = input('');
  readonly formattedExpiration = input('');
  readonly polling = input(false);
  readonly cancelling = input(false);
  readonly loading = input(false);
  readonly amountInvalid = input(false);

  readonly reset = output<void>();
  readonly verify = output<void>();
  readonly download = output<void>();
  readonly cancel = output<void>();
  readonly back = output<void>();

  readonly QrStatus = QrPaymentStatus;
  readonly Clock = Clock;
  readonly Download = Download;
  readonly QrCode = QrCode;
  readonly RefreshCw = RefreshCw;
  readonly XCircle = XCircle;
}
