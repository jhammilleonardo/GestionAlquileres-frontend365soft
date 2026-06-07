import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Landmark } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { PaymentMethod } from '../../../../core/models/payment.model';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-tenant-payment-method-details',
  standalone: true,
  imports: [AppTextFieldComponent, LucideAngularModule, ReactiveFormsModule, TranslocoModule],
  template: `
    @if (shouldShow()) {
      <div class="form-section" [formGroup]="form()">
        <div class="section-title">
          <span class="section-title-accent"></span>
          <lucide-icon [img]="Landmark" [size]="15"></lucide-icon>
          {{ 'public.tenantCreatePayment.methodData' | transloco }}
        </div>

        @if (isCard()) {
          <div class="form-row">
            <div>
              <app-text-field
                formControlName="card_last_4_digits"
                [label]="'public.tenantCreatePayment.last4Digits' | transloco"
                placeholder="1234"
                inputMode="numeric"
                [maxLength]="4"
                pattern="[0-9]{4}"
              />
              <p class="field-hint">{{ 'public.tenantCreatePayment.last4Hint' | transloco }}</p>
            </div>

            <app-text-field
              formControlName="card_holder_name"
              [label]="'public.tenantCreatePayment.cardHolder' | transloco"
              [placeholder]="'public.tenantCreatePayment.cardHolderPlaceholder' | transloco"
            />
          </div>

          <div class="form-row">
            <div>
              <app-text-field
                formControlName="card_expiry"
                [label]="'public.tenantCreatePayment.expiryDate' | transloco"
                placeholder="MM/YY"
                [maxLength]="5"
              />
              <p class="field-hint">{{ 'public.tenantCreatePayment.expiryHint' | transloco }}</p>
            </div>

            <app-text-field
              formControlName="reference_number"
              [label]="'public.tenantCreatePayment.authCode' | transloco"
              [placeholder]="'public.tenantCreatePayment.authCodePlaceholder' | transloco"
            />
          </div>
        }

        @if (method() === PaymentMethod.CHECK) {
          <div class="form-row">
            <app-text-field
              formControlName="check_number"
              [label]="'public.tenantCreatePayment.checkNumber' | transloco"
              [placeholder]="'public.tenantCreatePayment.checkNumberPlaceholder' | transloco"
            />

            <app-text-field
              formControlName="bank_name"
              [label]="'public.tenantCreatePayment.bankName' | transloco"
              [placeholder]="'public.tenantCreatePayment.bankNamePlaceholder' | transloco"
            />
          </div>

          <div class="full-width">
            <app-text-field
              formControlName="bank_account_last_4"
              [label]="'public.tenantCreatePayment.accTitle' | transloco"
              placeholder="5678"
              inputMode="numeric"
              [maxLength]="4"
            />
          </div>
        }

        @if (isTransfer()) {
          <div class="full-width">
            <app-text-field
              formControlName="reference_number"
              [label]="'public.tenantCreatePayment.refNumber' | transloco"
              [placeholder]="'public.tenantCreatePayment.refNumberPlaceholder' | transloco"
            />
            <p class="field-hint">{{ 'public.tenantCreatePayment.refHint' | transloco }}</p>
          </div>

          <div class="form-row">
            <app-text-field
              formControlName="bank_name"
              [label]="'public.tenantCreatePayment.originBank' | transloco"
              [placeholder]="'public.tenantCreatePayment.originBankPlaceholder' | transloco"
            />

            <app-text-field
              formControlName="bank_account_last_4"
              [label]="'public.tenantCreatePayment.accTitle' | transloco"
              placeholder="9012"
              inputMode="numeric"
              [maxLength]="4"
            />
          </div>
        }

        @if (method() === PaymentMethod.CASH) {
          <div class="form-row">
            <div>
              <app-text-field
                formControlName="received_by"
                [label]="'public.tenantCreatePayment.receivedBy' | transloco"
                [placeholder]="'public.tenantCreatePayment.receivedByPlaceholder' | transloco"
              />
              <p class="field-hint">
                {{ 'public.tenantCreatePayment.receivedByHint' | transloco }}
              </p>
            </div>

            <app-text-field
              formControlName="reference_number"
              [label]="'public.tenantCreatePayment.receiptNumber' | transloco"
              [placeholder]="'public.tenantCreatePayment.receiptNumberPlaceholder' | transloco"
            />
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .form-section {
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #f1f5f9;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 16px;
        letter-spacing: 0.01em;
      }

      .section-title-accent {
        display: block;
        width: 3px;
        height: 16px;
        background: #2563eb;
        border-radius: 99px;
        flex-shrink: 0;
      }

      .section-title lucide-icon {
        color: #2563eb;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .full-width {
        width: 100%;
        display: block;
        margin-bottom: 16px;
      }

      .field-hint {
        margin: 6px 0 0;
        color: #64748b;
        font-size: 0.78rem;
        line-height: 1.35;
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantPaymentMethodDetailsComponent {
  readonly Landmark = Landmark;
  readonly PaymentMethod = PaymentMethod;
  readonly form = input.required<FormGroup>();
  readonly method = input.required<PaymentMethod | null | undefined>();

  shouldShow(): boolean {
    return (
      this.method() === PaymentMethod.CREDIT_CARD ||
      this.method() === PaymentMethod.DEBIT_CARD ||
      this.method() === PaymentMethod.CHECK ||
      this.method() === PaymentMethod.TRANSFER ||
      this.method() === PaymentMethod.WIRE_TRANSFER ||
      this.method() === PaymentMethod.CASH
    );
  }

  isCard(): boolean {
    return (
      this.method() === PaymentMethod.CREDIT_CARD || this.method() === PaymentMethod.DEBIT_CARD
    );
  }

  isTransfer(): boolean {
    return (
      this.method() === PaymentMethod.TRANSFER || this.method() === PaymentMethod.WIRE_TRANSFER
    );
  }
}
