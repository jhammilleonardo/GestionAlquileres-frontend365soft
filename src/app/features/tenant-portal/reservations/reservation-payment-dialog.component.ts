import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { MyReservation } from '../../../core/services/reservation.service';
import { ReservationPaymentDialogFacade } from './reservation-payment-dialog.facade';
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
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
  ],
  providers: [ReservationPaymentDialogFacade],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'tenantReservations.payment.title' | transloco"
      (closed)="closed.emit()"
    >
      @if (reservation(); as r) {
        <form [formGroup]="form" class="payment-form">
          <p class="outstanding">
            {{ 'tenantReservations.payment.outstanding' | transloco }}:
            <strong>{{ outstanding(r) | tenantCurrency: r.currency }}</strong>
          </p>
          @if (confirmDepositDue(r) > 0) {
            <p class="confirm-hint">
              {{ 'tenantReservations.payment.depositToConfirm' | transloco }}:
              <strong>{{ confirmDepositDue(r) | tenantCurrency: r.currency }}</strong>
            </p>
          }

          <app-select
            [label]="'tenantReservations.payment.method' | transloco"
            [options]="methodOptions()"
            [required]="true"
            formControlName="payment_method"
          />

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
        </form>
      }

      <div class="dialog-actions" dialog-actions>
        <app-button appearance="outline" (clicked)="closed.emit()">
          {{ 'common.cancel' | transloco }}
        </app-button>
        <app-button [loading]="isSubmitting()" [disabled]="!reservation()" (clicked)="onSubmit()">
          {{ 'tenantReservations.payment.submit' | transloco }}
        </app-button>
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
      .outstanding {
        margin: 0 0 0.25rem;
        font-size: 0.9rem;
        color: var(--color-text-muted, #6b7280);
      }
      .confirm-hint {
        margin: 0 0 0.25rem;
        font-size: 0.9rem;
        color: var(--color-primary, #2563eb);
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

  onSubmit(): void {
    const reservation = this.reservation();
    if (!reservation) {
      return;
    }
    this.submit(reservation, () => this.paid.emit());
  }
}
