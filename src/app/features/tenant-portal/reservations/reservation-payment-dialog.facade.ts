import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import {
  MyReservation,
  ReservationPaymentRequest,
  ReservationService,
} from '../../../core/services/reservation.service';
import { Currency, PaymentType, QrPaymentStatus } from '../../../core/models/payment.model';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { TenantPaymentQrFlowFacade } from '../payments/tenant-payment-qr-flow.facade';
import { AppSelectOption } from '../../../shared/ui/select/select.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/** Códigos de método que disparan el flujo de pago con QR (MC4/SIP Bolivia). */
const QR_METHOD_CODES: ReadonlySet<string> = new Set(['qr_accl', 'qr_mc4', 'qr']);

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
  private readonly qrFlow = inject(TenantPaymentQrFlowFacade);
  readonly qrService = inject(TenantQrPaymentService);

  readonly isSubmitting = signal(false);
  readonly methods = signal<{ method: string; label: string }[]>([]);

  readonly methodOptions = computed<AppSelectOption<string>[]>(() =>
    this.methods().map((m) => ({ value: m.method, label: m.label })),
  );

  // Estado del flujo QR (delegado al facade compartido con el apartado de Pagos).
  readonly qrSafeUrl = this.qrFlow.safeUrl;
  readonly qrPolling = this.qrFlow.polling;
  readonly qrCancelling = this.qrFlow.cancelling;
  readonly qrError = this.qrFlow.error;
  readonly activeQr = this.qrService.activeQr;
  readonly qrPaid = computed(() => this.activeQr()?.status === QrPaymentStatus.PAGADO);

  private readonly methodControl = signal('');
  private readonly amountControl = signal(0);
  readonly isQrMethod = computed(() => QR_METHOD_CODES.has(this.methodControl().toLowerCase()));

  readonly form = this.fb.group({
    payment_method: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    payment_date: ['', [Validators.required]],
    reference_number: [''],
    notes: [''],
  });

  constructor() {
    this.loadMethods();
    // Refleja el método seleccionado en un signal para alternar entre el flujo
    // manual y el de QR de forma reactiva.
    this.form.controls.payment_method.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.methodControl.set(value ?? ''));
    this.form.controls.amount.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.amountControl.set(Number(value ?? 0)));
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

  /**
   * Porcentaje del total que el admin exige como adelanto para confirmar la
   * reserva (0 si exige el pago completo). Se muestra junto al monto para que el
   * inquilino entienda qué proporción está pagando por reservar.
   */
  depositPercentOfTotal(reservation: MyReservation): number {
    const total = Number(reservation.total_amount);
    if (reservation.deposit_required == null || total <= 0) {
      return 0;
    }
    return Math.round((Number(reservation.deposit_required) / total) * 100);
  }

  /** Prepara el formulario al abrir el diálogo: monto = adelanto o saldo, fecha = hoy. */
  prefill(reservation: MyReservation): void {
    this.qrFlow.clearActiveQr();
    const confirmDue = this.confirmDepositDue(reservation);
    const method = this.methods()[0]?.method ?? '';
    const amount = confirmDue > 0 ? confirmDue : this.outstanding(reservation);
    this.form.reset({
      payment_method: method,
      amount,
      payment_date: new Date().toISOString().slice(0, 10),
      reference_number: '',
      notes: '',
    });
    this.methodControl.set(method);
    this.amountControl.set(amount);
  }

  /** Monto a cobrar: el adelanto sugerido o, si no aplica, el saldo pendiente. */
  amountToPay(reservation: MyReservation): number {
    const confirmDue = this.confirmDepositDue(reservation);
    return confirmDue > 0 ? confirmDue : this.outstanding(reservation);
  }

  totalAmount(reservation: MyReservation): number {
    const total = Number(reservation.total_amount);
    return Number.isFinite(total) ? total : 0;
  }

  currentPaymentAmount(reservation: MyReservation): number {
    const amount = Number(this.amountControl());
    if (Number.isFinite(amount) && amount > 0) {
      return Math.min(amount, this.outstanding(reservation));
    }
    return this.amountToPay(reservation);
  }

  balanceAfterCurrentPayment(reservation: MyReservation): number {
    return Math.max(0, this.outstanding(reservation) - this.currentPaymentAmount(reservation));
  }

  currentPaymentPercentOfTotal(reservation: MyReservation): number {
    const total = this.totalAmount(reservation);
    if (total <= 0) return 0;
    return Math.round((this.currentPaymentAmount(reservation) / total) * 100);
  }

  /**
   * Genera el QR dinámico ligado a la reserva por el monto del formulario. El
   * polling del facade valida el pago automáticamente; al pasar a PAGADO el
   * backend registra el pago y confirma la reserva.
   */
  generateQr(reservation: MyReservation): void {
    const amount = Number(this.form.controls.amount.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.form.controls.amount.markAsTouched();
      return;
    }

    this.qrFlow.generate({
      amount,
      currency: (reservation.currency as Currency) ?? Currency.BOB,
      paymentType: PaymentType.RENT,
      notes: this.form.controls.notes.value || undefined,
      reservationId: reservation.id,
    });
  }

  manualVerifyQr(): void {
    this.qrFlow.verifyActive();
  }

  downloadQr(): void {
    this.qrFlow.downloadActive();
  }

  cancelQr(): void {
    this.qrFlow.cancelActive();
  }

  /** Limpia el QR activo y detiene el polling (al cerrar el diálogo o reintentar). */
  clearQr(): void {
    this.qrFlow.clearActiveQr();
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
