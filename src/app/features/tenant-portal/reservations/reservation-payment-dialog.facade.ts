import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import {
  MyReservation,
  ReservationPaymentRequest,
  ReservationService,
} from '../../../core/services/reservation.service';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { AppSelectOption } from '../../../shared/ui/select/select.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/**
 * Fachada del diálogo de pago de una reserva. Aislada del componente de lista
 * (SRP): sólo conoce el formulario, los métodos de pago disponibles y el envío.
 * No emite eventos de UI directamente — recibe un callback de éxito para que la
 * fachada permanezca agnóstica a la vista.
 */
@Injectable()
export class ReservationPaymentDialogFacade {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationService);
  private readonly paymentService = inject(TenantPaymentService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly isSubmitting = signal(false);
  readonly methods = signal<{ method: string; label: string }[]>([]);

  readonly methodOptions = computed<AppSelectOption<string>[]>(() =>
    this.methods().map((m) => ({ value: m.method, label: m.label })),
  );

  readonly form = this.fb.group({
    payment_method: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    payment_date: ['', [Validators.required]],
    reference_number: [''],
    notes: [''],
  });

  constructor() {
    this.loadMethods();
  }

  loadMethods(): void {
    this.paymentService.getAvailablePaymentMethods().subscribe({
      next: (methods) => this.methods.set(methods),
      error: () => this.methods.set([]),
    });
  }

  /** Saldo pendiente de una reserva (total − comprometido). */
  outstanding(reservation: MyReservation): number {
    return Math.max(0, Number(reservation.total_amount) - Number(reservation.paid_amount));
  }

  /**
   * Adelanto que falta para confirmar la reserva. Mayor a 0 sólo si la reserva
   * está pendiente de pago y la unidad exige un adelanto parcial; en ese caso es
   * el monto sugerido para confirmar (el resto se paga después).
   */
  confirmDepositDue(reservation: MyReservation): number {
    if (reservation.status !== 'pending_payment' || reservation.deposit_required == null) {
      return 0;
    }
    const due = Number(reservation.deposit_required) - Number(reservation.paid_amount);
    return Math.max(0, Math.min(due, this.outstanding(reservation)));
  }

  /** Prepara el formulario al abrir el diálogo: monto = adelanto o saldo, fecha = hoy. */
  prefill(reservation: MyReservation): void {
    const confirmDue = this.confirmDepositDue(reservation);
    this.form.reset({
      payment_method: this.methods()[0]?.method ?? '',
      amount: confirmDue > 0 ? confirmDue : this.outstanding(reservation),
      payment_date: new Date().toISOString().slice(0, 10),
      reference_number: '',
      notes: '',
    });
  }

  submit(reservation: MyReservation, onSuccess: () => void): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: ReservationPaymentRequest = {
      amount: Number(raw.amount),
      payment_method: raw.payment_method ?? '',
      payment_date: raw.payment_date ?? '',
      reference_number: raw.reference_number || undefined,
      notes: raw.notes || undefined,
    };

    this.isSubmitting.set(true);
    this.reservationService.createReservationPayment(reservation.id, request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(this.transloco.translate('tenantReservations.payment.success'));
        onSuccess();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.error(this.transloco.translate('tenantReservations.payment.error'));
      },
    });
  }
}
