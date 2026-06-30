import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { CurrencySymbols, Currency } from '../../../core/models/payment.model';
import { FormatService } from '../../../core/services/format.service';
import { MyReservation } from '../../../core/services/reservation.service';
import { ReservationPaymentDialogFacade } from './reservation-payment-dialog.facade';
import { TenantPaymentQrFlowFacade } from '../payments/tenant-payment-qr-flow.facade';
import { TenantPaymentQrPanelComponent } from '../payments/components/tenant-payment-qr-panel.component';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent } from '../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../../shared/ui/textarea/textarea.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reservation-payment-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    TenantCurrencyPipe,
    TenantPaymentQrPanelComponent,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
  ],
  providers: [ReservationPaymentDialogFacade, TenantPaymentQrFlowFacade],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'tenantReservations.payment.title' | transloco"
      (closed)="onClose()"
    >
      @if (reservation(); as r) {
        <form [formGroup]="form" class="payment-form" (ngSubmit)="onGenerateQr()">
          <section class="payment-summary" aria-live="polite">
            <div class="payment-summary__row">
              <span>{{ 'tenantReservations.payment.totalReservation' | transloco }}</span>
              <strong>{{ totalAmount(r) | tenantCurrency: r.currency }}</strong>
            </div>
            <div class="payment-summary__row payment-summary__row--now">
              <span>
                {{
                  'tenantReservations.payment.payNow'
                    | transloco: { percent: currentPaymentPercentOfTotal(r) }
                }}
              </span>
              <strong>{{ currentPaymentAmount(r) | tenantCurrency: r.currency }}</strong>
            </div>
            <div class="payment-summary__row">
              <span>{{ 'tenantReservations.payment.payLater' | transloco }}</span>
              <strong>{{ balanceAfterCurrentPayment(r) | tenantCurrency: r.currency }}</strong>
            </div>
          </section>

          <app-select
            [label]="'tenantReservations.payment.method' | transloco"
            [options]="methodOptions()"
            [required]="true"
            formControlName="payment_method"
          />

          @if (isQrMethod()) {
            @if (qrPaid()) {
              <p class="qr-paid">
                {{ 'tenantReservations.payment.qrPaid' | transloco }}
              </p>
            } @else {
              <app-tenant-payment-qr-panel
                [activeQr]="activeQr()"
                [safeUrl]="qrSafeUrl()"
                [currencySymbol]="currencySymbol(r.currency)"
                [formattedExpiration]="formattedExpiration()"
                [polling]="qrPolling()"
                [cancelling]="qrCancelling()"
                [loading]="qrService.isLoading()"
                [amountInvalid]="!!form.controls.amount.invalid"
                (reset)="clearQr()"
                (verify)="manualVerifyQr()"
                (download)="downloadQr()"
                (cancel)="cancelQr()"
                (back)="onClose()"
              />
              @if (qrError()) {
                <p class="qr-error">{{ qrError() }}</p>
              }
            }
          } @else {
            <app-text-field
              [label]="'tenantReservations.payment.amount' | transloco"
              type="number"
              formControlName="amount"
            />

            <app-date-picker
              [label]="'tenantReservations.payment.date' | transloco"
              formControlName="payment_date"
            />

            <app-text-field
              [label]="'tenantReservations.payment.reference' | transloco"
              formControlName="reference_number"
            />

            <app-textarea
              [label]="'tenantReservations.payment.notes' | transloco"
              formControlName="notes"
            />
          }
        </form>
      }

      <div class="dialog-actions" dialog-actions>
        @if (qrPaid()) {
          <app-button (clicked)="onPaid()">
            {{ 'common.done' | transloco }}
          </app-button>
        } @else if (!isQrMethod()) {
          <app-button appearance="outline" (clicked)="closed.emit()">
            {{ 'common.cancel' | transloco }}
          </app-button>
          <app-button [loading]="isSubmitting()" [disabled]="!reservation()" (clicked)="onSubmit()">
            {{ 'tenantReservations.payment.submit' | transloco }}
          </app-button>
        }
      </div>
    </app-dialog>
  `,
  styles: [
    `
      .payment-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .payment-summary {
        display: grid;
        gap: 0.65rem;
        padding: 0.85rem;
        border: 1px solid #dbeafe;
        border-radius: 0.75rem;
        background: #eff6ff;
      }
      .payment-summary__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        color: #475569;
        font-size: 0.9rem;
      }
      .payment-summary__row strong {
        color: #1f2937;
        white-space: nowrap;
      }
      .payment-summary__row--now {
        color: var(--color-primary, #2563eb);
        font-weight: 700;
      }
      .payment-summary__row--now strong {
        color: var(--color-primary, #2563eb);
      }
      .qr-paid {
        margin: 0;
        padding: 0.85rem 1rem;
        border-radius: 0.5rem;
        background: #ecfdf5;
        color: #047857;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .qr-error {
        margin: 0.5rem 0 0;
        color: var(--color-danger, #dc2626);
        font-size: 0.85rem;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.25rem;
      }
    `,
  ],
})
export class ReservationPaymentDialogComponent extends ReservationPaymentDialogFacade {
  readonly reservation = input<MyReservation | null>(null);
  readonly open = input(false);
  readonly closed = output<void>();
  readonly paid = output<void>();

  private readonly format = inject(FormatService);

  constructor() {
    super();
    // Al abrir el diálogo, precarga el formulario con el saldo y la fecha de hoy.
    effect(() => {
      const reservation = this.reservation();
      if (this.open() && reservation) {
        this.prefill(reservation);
      }
    });
  }

  currencySymbol(currency: string): string {
    return CurrencySymbols[currency as Currency] ?? currency;
  }

  formattedExpiration(): string {
    const expiresAt = this.activeQr()?.expires_at;
    return expiresAt ? this.format.formatDateTime(expiresAt) : '';
  }

  onGenerateQr(): void {
    const reservation = this.reservation();
    if (reservation) {
      this.generateQr(reservation);
    }
  }

  onSubmit(): void {
    const reservation = this.reservation();
    if (!reservation) {
      return;
    }
    this.submit(reservation, () => this.paid.emit());
  }

  onPaid(): void {
    this.clearQr();
    this.paid.emit();
  }

  onClose(): void {
    // Si el QR ya se pagó, cerrar debe recargar la lista (la reserva quedó
    // confirmada en backend), no solo cerrar el diálogo.
    if (this.qrPaid()) {
      this.onPaid();
      return;
    }
    this.clearQr();
    this.closed.emit();
  }
}
