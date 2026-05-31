import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CheckCircle2, LucideAngularModule } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';

export type TenantPaymentSuccessKind = 'manual' | 'qr';

@Component({
  selector: 'app-tenant-payment-success-state',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule, TranslocoModule, AppButtonComponent],
  template: `
    <section class="success-card">
      <lucide-icon [img]="CheckCircle2" [size]="48" class="success-icon"></lucide-icon>

      @if (kind() === 'qr') {
        <h2>{{ 'public.tenantCreatePayment.qrConfirmedTitle' | transloco }}</h2>
        <p>
          {{ 'public.tenantCreatePayment.qrConfirmedDescBefore' | transloco }}
          <strong>{{ currencySymbol() }}{{ amount() | number: '1.2-2' }}</strong>
          {{ 'public.tenantCreatePayment.qrConfirmedDescAfter' | transloco }}
        </p>
        @if (transactionId()) {
          <span class="tx-badge">TXN: {{ transactionId() }}</span>
        }
      } @else {
        <h2>{{ 'public.tenantCreatePayment.paymentRegisteredTitle' | transloco }}</h2>
        <p>{{ 'public.tenantCreatePayment.paymentRegisteredDesc' | transloco }}</p>
      }

      <div class="success-actions">
        <app-button type="button" (clicked)="back.emit()">
          {{ 'public.tenantCreatePayment.backToPayments' | transloco }}
        </app-button>
        <app-button type="button" appearance="outline" (clicked)="newPayment.emit()">
          {{
            kind() === 'qr'
              ? ('public.tenantCreatePayment.newPayment' | transloco)
              : ('public.tenantCreatePayment.registerAnotherPayment' | transloco)
          }}
        </app-button>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .success-card {
      border: 1px solid var(--app-color-border);
      border-radius: 14px;
      background: var(--app-color-surface);
      padding: 48px;
      text-align: center;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
    }

    .success-icon {
      color: var(--app-color-success);
      margin-bottom: 16px;
    }

    .success-card h2 {
      color: var(--app-color-text);
      margin: 0 0 8px;
    }

    .success-card p {
      color: var(--app-color-text-muted);
      margin: 0 0 24px;
    }

    .tx-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 0.82rem;
      background: var(--app-color-surface-muted);
      padding: 3px 10px;
      border-radius: 6px;
      margin-bottom: 20px;
      color: var(--app-color-text-muted);
    }

    .success-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .success-card {
        padding: 32px;
      }

      .success-actions {
        flex-direction: column;
      }

      .success-actions app-button {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .success-card {
        padding: 24px;
      }

      .success-card h2 {
        font-size: 1.25rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantPaymentSuccessStateComponent {
  readonly kind = input<TenantPaymentSuccessKind>('manual');
  readonly amount = input(0);
  readonly currencySymbol = input('');
  readonly transactionId = input<string | null>(null);

  readonly back = output<void>();
  readonly newPayment = output<void>();

  readonly CheckCircle2 = CheckCircle2;
}
