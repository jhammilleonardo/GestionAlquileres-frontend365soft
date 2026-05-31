import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, CreditCard } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { PaymentMethod, PaymentType, Currency } from '../../../../core/models/payment.model';
import { PaymentOption } from '../tenant-create-payment.facade';
import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppSelectComponent } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-tenant-payment-basic-fields',
  standalone: true,
  imports: [
    AppDatePickerComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    LucideAngularModule,
    ReactiveFormsModule,
    TranslocoModule,
  ],
  template: `
    <div class="form-section" [formGroup]="form()">
      <div class="section-title">
        <span class="section-title-accent"></span>
        <lucide-icon [img]="CreditCard" [size]="15"></lucide-icon>
        {{ 'public.tenantCreatePayment.paymentInfo' | transloco }}
      </div>

      <div class="full-width">
        <app-select
          formControlName="payment_type"
          [label]="'public.tenantCreatePayment.paymentType' | transloco"
          [options]="paymentTypes()"
          [required]="true"
        />
        @if (showFieldError('payment_type', 'required')) {
          <p class="field-error">{{ 'public.tenantCreatePayment.typeRequired' | transloco }}</p>
        }
      </div>

      <div class="form-row">
        <div>
          <app-text-field
            formControlName="amount"
            [label]="'public.tenantCreatePayment.amount' | transloco"
            placeholder="0.00"
            type="number"
            inputMode="decimal"
          />
          @if (showFieldError('amount', 'required')) {
            <p class="field-error">
              {{ 'public.tenantCreatePayment.amountRequired' | transloco }}
            </p>
          }
          @if (form().get('amount')?.hasError('min')) {
            <p class="field-error">{{ 'public.tenantCreatePayment.amountMin' | transloco }}</p>
          }
        </div>

        <div>
          <app-select
            formControlName="currency"
            [label]="'public.tenantCreatePayment.currency' | transloco"
            [options]="currencyOptions()"
            [required]="true"
          />
          @if (showFieldError('currency', 'required')) {
            <p class="field-error">
              {{ 'public.tenantCreatePayment.currencyRequired' | transloco }}
            </p>
          }
        </div>
      </div>

      <div class="form-row">
        <div>
          <app-select
            formControlName="payment_method"
            [label]="'public.tenantCreatePayment.method' | transloco"
            [options]="paymentMethods()"
            [required]="true"
          />
          @if (showFieldError('payment_method', 'required')) {
            <p class="field-error">
              {{ 'public.tenantCreatePayment.methodRequired' | transloco }}
            </p>
          }
        </div>

        @if (!isQrMethod()) {
          <div>
            <app-date-picker
              formControlName="payment_date"
              [label]="'public.tenantCreatePayment.paymentDate' | transloco"
              [max]="maxDate()"
            />
            @if (showFieldError('payment_date', 'required')) {
              <p class="field-error">
                {{ 'public.tenantCreatePayment.dateRequired' | transloco }}
              </p>
            }
          </div>
        }
      </div>
    </div>
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

      .field-error {
        margin: 6px 0 0;
        color: #dc2626;
        font-size: 0.78rem;
        font-weight: 650;
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
export class TenantPaymentBasicFieldsComponent {
  readonly CreditCard = CreditCard;
  readonly form = input.required<FormGroup>();
  readonly paymentTypes = input.required<PaymentOption<PaymentType>[]>();
  readonly paymentMethods = input.required<PaymentOption<PaymentMethod>[]>();
  readonly currencyOptions = input.required<PaymentOption<Currency>[]>();
  readonly maxDate = input.required<string>();

  isQrMethod(): boolean {
    return this.form().get('payment_method')?.value === PaymentMethod.QR_MC4;
  }

  showFieldError(controlName: string, error: string): boolean {
    const control = this.form().get(controlName);
    return !!control?.hasError(error) && (control.touched || control.dirty);
  }
}
