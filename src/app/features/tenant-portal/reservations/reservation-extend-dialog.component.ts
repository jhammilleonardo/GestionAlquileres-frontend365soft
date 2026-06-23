import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, of, switchMap, tap } from 'rxjs';

import {
  AvailabilityStatus,
  ExtensionQuote,
  MyReservation,
  ReservationService,
} from '../../../core/services/reservation.service';
import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { AvailabilityCalendarGridComponent } from '../../public-portal/availability-calendar/availability-calendar-grid.component';

@Component({
  selector: 'app-reservation-extend-dialog',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AvailabilityCalendarGridComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog
      [open]="open()"
      [title]="'tenantReservations.extend.title' | transloco"
      [showFooter]="false"
      (closed)="closed.emit()"
    >
      <div class="extend-body">
        <p class="extend-help">{{ 'tenantReservations.extend.pickDate' | transloco }}</p>

        <div class="extend-calendar">
          <app-availability-calendar-grid
            [viewDate]="viewDate()"
            [availability]="availability()"
            [checkin]="anchorDate()"
            [checkout]="selectedCheckout()"
            [minDate]="minSelectable()"
            [anchorStart]="true"
            [locale]="localeCode()"
            (monthChange)="onMonthChange($event)"
            (daySelected)="onDaySelected($event)"
          />
          <div class="extend-markers">
            <span class="mk mk-anchor">{{
              'tenantReservations.extend.currentCheckout' | transloco
            }}</span>
            <span class="mk mk-new">{{ 'tenantReservations.extend.newCheckout' | transloco }}</span>
          </div>
        </div>

        <div class="extend-dates">
          <div>
            <span>{{ 'tenantReservations.extend.currentCheckout' | transloco }}</span>
            <strong>{{ anchorDate() | date: 'dd/MM/yyyy' }}</strong>
          </div>
          <div>
            <span>{{ 'tenantReservations.extend.newCheckout' | transloco }}</span>
            <strong>{{ selectedCheckout() | date: 'dd/MM/yyyy' }}</strong>
          </div>
        </div>

        @if (error()) {
          <p class="extend-error" role="alert">{{ error() }}</p>
        }
        @if (quoteLoading()) {
          <p class="extend-status">{{ 'tenantReservations.extend.calculating' | transloco }}</p>
        } @else if (quote(); as currentQuote) {
          <div class="extend-summary">
            <div>
              <span>{{ 'tenantReservations.extend.additionalNights' | transloco }}</span>
              <strong>{{ currentQuote.additional_nights }}</strong>
            </div>
            <div>
              <span>{{ 'tenantReservations.extend.additionalAmount' | transloco }}</span>
              <strong>
                {{ currentQuote.amount_difference | number: '1.0-2' }}
                {{ currentQuote.currency }}
              </strong>
            </div>
            <div class="extend-total">
              <span>{{ 'tenantReservations.extend.newTotal' | transloco }}</span>
              <strong>
                {{ currentQuote.new_total | number: '1.0-2' }} {{ currentQuote.currency }}
              </strong>
            </div>
          </div>
        }

        <div class="extend-actions">
          <app-button appearance="outline" type="button" (clicked)="closed.emit()">
            {{ 'common.cancel' | transloco }}
          </app-button>
          <app-button
            [loading]="saving()"
            [disabled]="form.invalid || quoteLoading() || !quote()"
            (clicked)="submit()"
          >
            {{ 'tenantReservations.extend.confirm' | transloco }}
          </app-button>
        </div>
      </div>
    </app-dialog>
  `,
  styles: `
    .extend-body {
      display: grid;
      gap: 1rem;
    }
    .extend-help {
      margin: 0;
      color: #475569;
      font-size: 0.9rem;
    }
    .extend-markers {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
      font-size: 0.72rem;
      color: #475569;
    }
    .mk {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .mk::before {
      content: '';
      width: 12px;
      height: 12px;
      border-radius: 4px;
    }
    .mk-anchor::before {
      background: #fff;
      box-shadow: inset 0 0 0 2px var(--app-color-primary, #2563eb);
    }
    .mk-new::before {
      background: var(--app-color-primary, #2563eb);
    }
    .extend-dates {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .extend-dates div {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: #fff;
      padding: 0.6rem 0.75rem;
    }
    .extend-dates span {
      display: block;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
    }
    .extend-dates strong {
      color: #111827;
      font-size: 0.9rem;
    }
    .extend-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .extend-error {
      margin: 0;
      color: #b91c1c;
      font-size: 0.875rem;
    }
    .extend-status {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }
    .extend-summary {
      display: grid;
      gap: 0.65rem;
      padding: 0.9rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }
    .extend-summary div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    .extend-summary span {
      color: #64748b;
    }
    .extend-total {
      padding-top: 0.65rem;
      border-top: 1px solid #e2e8f0;
    }
  `,
})
export class ReservationExtendDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationService);
  private readonly transloco = inject(TranslocoService);

  readonly open = input(false);
  readonly reservation = input<MyReservation | null>(null);
  readonly closed = output<void>();
  readonly extended = output<void>();
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly quote = signal<ExtensionQuote | null>(null);
  readonly quoteLoading = signal(false);

  readonly viewDate = signal(new Date());
  readonly availability = signal<Map<string, AvailabilityStatus>>(new Map());
  readonly selectedCheckout = signal<Date | null>(null);

  /** Salida actual de la reserva: ancla desde la que se extiende. */
  readonly anchorDate = computed(() => {
    const reservation = this.reservation();
    return reservation ? this.parseIso(reservation.checkout_date) : null;
  });

  /** Primer día seleccionable: el siguiente a la salida actual. */
  readonly minSelectable = computed(() => {
    const anchor = this.anchorDate();
    if (!anchor) return null;
    const next = new Date(anchor);
    next.setDate(next.getDate() + 1);
    return next;
  });

  readonly form = this.fb.group({ checkout_date: ['', Validators.required] });

  private readonly syncReservation = effect(() => {
    const reservation = this.reservation();
    if (!reservation) return;
    const anchor = this.parseIso(reservation.checkout_date);
    const next = new Date(anchor);
    next.setDate(next.getDate() + 1);
    this.viewDate.set(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    this.selectedCheckout.set(next);
    this.error.set(null);
    this.form.reset({ checkout_date: this.iso(next) });
    this.loadAvailability();
  });

  constructor() {
    this.form.controls.checkout_date.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => {
          this.quote.set(null);
          this.error.set(null);
        }),
        switchMap((checkoutDate) => {
          const reservation = this.reservation();
          if (!reservation || !checkoutDate) return of(null);
          this.quoteLoading.set(true);
          return this.reservationService.quoteExtension(reservation.id, checkoutDate).pipe(
            catchError((error: unknown) => {
              this.error.set(
                getApiErrorMessage(
                  error,
                  this.transloco.translate('tenantReservations.extend.quoteError'),
                ),
              );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((quote) => {
        this.quoteLoading.set(false);
        this.quote.set(quote);
      });
  }

  localeCode(): string {
    return this.transloco.getActiveLang();
  }

  onDaySelected(date: Date): void {
    const min = this.minSelectable();
    if (min && date < min) return;
    this.selectedCheckout.set(date);
    this.form.controls.checkout_date.setValue(this.iso(date));
  }

  onMonthChange(delta: number): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() + delta, 1));
    this.loadAvailability();
  }

  submit(): void {
    const reservation = this.reservation();
    const checkoutDate = this.form.controls.checkout_date.value;
    if (!reservation || !checkoutDate || this.form.invalid || !this.quote()) return;

    this.saving.set(true);
    this.reservationService.extendReservation(reservation.id, checkoutDate).subscribe({
      next: () => {
        this.saving.set(false);
        this.extended.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(
          getApiErrorMessage(
            error,
            this.transloco.translate('tenantReservations.extend.quoteError'),
          ),
        );
      },
    });
  }

  /** Carga la disponibilidad de los dos meses visibles para colorear la grilla. */
  private loadAvailability(): void {
    const reservation = this.reservation();
    if (!reservation) return;
    const first = this.viewDate();
    const months = [
      this.monthKey(first),
      this.monthKey(new Date(first.getFullYear(), first.getMonth() + 1, 1)),
    ];
    forkJoin(
      months.map((month) =>
        this.reservationService.getAvailability(
          reservation.property_id,
          month,
          reservation.unit_id,
        ),
      ),
    ).subscribe({
      next: (responses) => {
        const entries = responses
          .flat()
          .map((day) => [day.date.slice(0, 10), day.status] as [string, AvailabilityStatus]);
        this.availability.set(new Map(entries));
      },
      error: () => this.availability.set(new Map()),
    });
  }

  private parseIso(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private iso(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
