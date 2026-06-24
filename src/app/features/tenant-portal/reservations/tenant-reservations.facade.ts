import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  MyReservation,
  ReservationService,
  ReservationStatus,
} from '../../../core/services/reservation.service';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppStatusTone } from '../../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { TranslocoService } from '@jsverse/transloco';

/** Estados desde los que el huésped puede cancelar (espejo del backend). */
const CANCELABLE_STATUSES: readonly ReservationStatus[] = [
  'pending_payment',
  'pending',
  'confirmed',
];

/** Estados sobre los que se admite registrar un pago (espejo del backend). */
const PAYABLE_STATUSES: readonly ReservationStatus[] = [
  'pending_payment',
  'pending',
  'confirmed',
  'in_progress',
];

@Injectable()
export class TenantReservationsFacade {
  private readonly reservationService = inject(ReservationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly reservations = signal<MyReservation[]>([]);
  readonly isLoading = signal(true);
  readonly busyId = signal<number | null>(null);

  /**
   * Holds cuya cuenta regresiva ya venció en el cliente. Se ocultan de "Pagar"
   * de inmediato sin esperar al job del backend (que igual libera las fechas).
   */
  readonly expiredHoldIds = signal<ReadonlySet<number>>(new Set());

  /** Reserva cuyo diálogo de pago está abierto (null = cerrado). */
  readonly paymentTarget = signal<MyReservation | null>(null);

  /** Reserva cuyo diálogo de reseña está abierto (null = cerrado). */
  readonly reviewTarget = signal<MyReservation | null>(null);
  readonly extendTarget = signal<MyReservation | null>(null);

  // Próximas (no terminadas y con salida futura) primero; el resto, historial.
  readonly upcoming = computed(() =>
    this.reservations().filter((reservation) => this.isUpcoming(reservation)),
  );
  readonly past = computed(() =>
    this.reservations().filter((reservation) => !this.isUpcoming(reservation)),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.isLoading.set(false);
      },
      error: () => {
        this.reservations.set([]);
        this.isLoading.set(false);
        this.toast.error(this.transloco.translate('tenantReservations.loadError'));
      },
    });
  }

  // Campo flecha (no método) para pasarlo como input sin disparar unbound-method.
  readonly statusTone = (status: ReservationStatus): AppStatusTone => {
    switch (status) {
      case 'pending':
      case 'pending_payment':
        return 'warning';
      case 'confirmed':
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'declined':
      case 'no_show':
      case 'expired':
        return 'danger';
    }
  };

  canCancel(reservation: MyReservation): boolean {
    return CANCELABLE_STATUSES.includes(reservation.status);
  }

  canExtend(reservation: MyReservation): boolean {
    return (
      CANCELABLE_STATUSES.includes(reservation.status) &&
      new Date(reservation.checkin_date) > new Date()
    );
  }

  openExtend(reservation: MyReservation): void {
    this.extendTarget.set(reservation);
  }

  closeExtend(): void {
    this.extendTarget.set(null);
  }

  onExtended(): void {
    this.extendTarget.set(null);
    this.toast.success(this.transloco.translate('tenantReservations.extend.success'));
    this.load();
  }

  /** Saldo pendiente de la reserva (total − comprometido). */
  outstanding(reservation: MyReservation): number {
    return Math.max(0, Number(reservation.total_amount) - Number(reservation.paid_amount));
  }

  /**
   * El saldo pendiente solo tiene sentido en reservas activas (pagables): una
   * reserva expirada, cancelada o rechazada ya no se cobra, así que no debe
   * mostrar "saldo pendiente".
   */
  showOutstanding(reservation: MyReservation): boolean {
    return PAYABLE_STATUSES.includes(reservation.status) && this.outstanding(reservation) > 0;
  }

  /** Se puede pagar si está activa, queda saldo y el hold no venció. */
  canPay(reservation: MyReservation): boolean {
    return (
      PAYABLE_STATUSES.includes(reservation.status) &&
      this.outstanding(reservation) > 0 &&
      !this.expiredHoldIds().has(reservation.id)
    );
  }

  /** Hold de corto plazo pendiente de pago: muestra la cuenta regresiva. */
  showCountdown(reservation: MyReservation): boolean {
    return reservation.status === 'pending_payment' && !!reservation.expires_at;
  }

  /** El contador llegó a cero: oculta el pago y libera la fecha en la vista. */
  onHoldExpired(reservation: MyReservation): void {
    this.expiredHoldIds.update((ids) => {
      if (ids.has(reservation.id)) return ids;
      const next = new Set(ids);
      next.add(reservation.id);
      return next;
    });
  }

  openPayment(reservation: MyReservation): void {
    this.paymentTarget.set(reservation);
  }

  closePayment(): void {
    this.paymentTarget.set(null);
  }

  onPaid(): void {
    this.paymentTarget.set(null);
    this.load();
  }

  /** Se puede reseñar una reserva completada que aún no tiene reseña. */
  canReview(reservation: MyReservation): boolean {
    return reservation.status === 'completed' && !reservation.has_review;
  }

  openReview(reservation: MyReservation): void {
    this.reviewTarget.set(reservation);
  }

  closeReview(): void {
    this.reviewTarget.set(null);
  }

  onReviewed(): void {
    this.reviewTarget.set(null);
    this.load();
  }

  async cancel(reservation: MyReservation): Promise<void> {
    const message = await this.buildCancelMessage(reservation.id);
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('tenantReservations.cancelTitle'),
      message,
      confirmLabel: this.transloco.translate('tenantReservations.cancelConfirm'),
      cancelLabel: this.transloco.translate('common.cancel'),
    });
    if (!confirmed) return;

    this.busyId.set(reservation.id);
    this.reservationService.cancelReservation(reservation.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(this.transloco.translate('tenantReservations.cancelSuccess'));
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.transloco.translate('tenantReservations.cancelError'));
      },
    });
  }

  /**
   * Construye el mensaje de confirmación incluyendo el reembolso estimado según
   * la política. Si el preview falla, cae a un mensaje genérico (no bloquea la
   * cancelación por un problema de red).
   */
  private async buildCancelMessage(reservationId: number): Promise<string> {
    try {
      const preview = await firstValueFrom(
        this.reservationService.getCancellationPreview(reservationId),
      );
      if (preview.refund_amount > 0) {
        return this.transloco.translate('tenantReservations.cancelRefundMessage', {
          amount: preview.refund_amount,
          currency: preview.currency,
          pct: preview.refund_percentage,
        });
      }
      return this.transloco.translate('tenantReservations.cancelNoRefundMessage');
    } catch {
      return this.transloco.translate('tenantReservations.cancelMessage');
    }
  }

  private isUpcoming(reservation: MyReservation): boolean {
    const activeStatus =
      reservation.status === 'pending_payment' ||
      reservation.status === 'pending' ||
      reservation.status === 'confirmed' ||
      reservation.status === 'in_progress';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkout = new Date(reservation.checkout_date);
    return activeStatus && checkout >= today;
  }
}
