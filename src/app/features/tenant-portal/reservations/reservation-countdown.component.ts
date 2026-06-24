import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Cuenta regresiva del hold de pago de una reserva (`pending_payment`).
 *
 * Muestra el tiempo restante (mm:ss) hasta `expiresAt` para pagar el QR. Al
 * llegar a cero emite `holdExpired` una sola vez: el padre oculta el botón de
 * pago y refleja que las fechas se liberaron (el backend ya las libera al vencer).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reservation-countdown',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    @if (expiresAt()) {
      @if (isExpired()) {
        <p class="rc rc--expired" role="status">
          {{ 'tenantReservations.countdown.expired' | transloco }}
        </p>
      } @else {
        <p class="rc" role="timer">
          <span class="rc-label">{{ 'tenantReservations.countdown.label' | transloco }}</span>
          <strong class="rc-time" [class.rc-time--urgent]="isUrgent()">{{ display() }}</strong>
        </p>
      }
    }
  `,
  styles: [
    `
      .rc {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin: 0;
        font-size: 0.85rem;
        color: var(--color-text-muted, #6b7280);
      }
      .rc-time {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        color: var(--color-primary, #2563eb);
      }
      .rc-time--urgent {
        color: var(--color-danger-strong, #b91c1c);
      }
      .rc--expired {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--color-danger-strong, #b91c1c);
      }
    `,
  ],
})
export class ReservationCountdownComponent {
  /** Vencimiento del hold (ISO). null = sin contador. */
  readonly expiresAt = input<string | null>(null);
  /** Se emite una vez cuando el contador llega a cero. */
  readonly holdExpired = output<void>();

  private readonly now = signal(Date.now());
  private emitted = false;

  private readonly targetMs = computed(() => {
    const iso = this.expiresAt();
    if (!iso) return null;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? null : ms;
  });

  private readonly remainingMs = computed(() => {
    const target = this.targetMs();
    return target == null ? null : Math.max(0, target - this.now());
  });

  readonly isExpired = computed(() => this.remainingMs() === 0);

  /** Último minuto: resalta el tiempo en rojo. */
  readonly isUrgent = computed(() => {
    const remaining = this.remainingMs();
    return remaining != null && remaining > 0 && remaining <= 60_000;
  });

  readonly display = computed(() => {
    const remaining = this.remainingMs();
    if (remaining == null) return '';
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  constructor() {
    const intervalId = setInterval(() => {
      this.now.set(Date.now());
      // Emitir una sola vez al vencer; el padre decide qué hacer (ocultar pago).
      if (this.isExpired() && this.targetMs() != null && !this.emitted) {
        this.emitted = true;
        this.holdExpired.emit();
      }
    }, 1000);

    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }
}
