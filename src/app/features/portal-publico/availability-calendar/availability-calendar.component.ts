import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-angular';

import { AvailabilityStatus, ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';

interface CalendarCell {
  date: Date | null;
  iso: string;
  status: AvailabilityStatus | 'past';
  inRange: boolean;
  isCheckin: boolean;
  isCheckout: boolean;
}

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, TranslocoModule, LucideAngularModule, AppButtonComponent],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './availability-calendar.component.html',
  styleUrl: './availability-calendar.component.scss',
})
export class AvailabilityCalendarComponent implements OnInit {
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly CalendarCheck = CalendarCheck;

  readonly propertyId = input.required<number>();
  readonly unitId = input.required<number>();
  readonly pricePerNight = input(0);
  readonly cleaningFee = input(0);
  readonly minNights = input(1);
  readonly currency = input('USD');

  private readonly reservationService = inject(ReservationService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly viewDate = signal(new Date());
  readonly availability = signal<Map<string, AvailabilityStatus>>(new Map());
  readonly loading = signal(false);
  readonly checkin = signal<Date | null>(null);
  readonly checkout = signal<Date | null>(null);
  readonly submitting = signal(false);

  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  readonly monthLabel = computed(() =>
    this.viewDate().toLocaleDateString(this.transloco.getActiveLang(), {
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly nights = computed(() => {
    const ci = this.checkin();
    const co = this.checkout();
    if (!ci || !co) return 0;
    return Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000));
  });

  readonly totalCost = computed(() => this.nights() * this.pricePerNight() + this.cleaningFee());

  readonly cells = computed<CalendarCell[]>(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    // Lunes = 0
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ci = this.checkin();
    const co = this.checkout();
    const avail = this.availability();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < offset; i++) {
      cells.push({
        date: null,
        iso: `pad-${i}`,
        status: 'past',
        inRange: false,
        isCheckin: false,
        isCheckout: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = this.iso(date);
      let status: AvailabilityStatus | 'past' = avail.get(iso) ?? 'available';
      if (date < today) status = 'past';
      const inRange = !!ci && !!co && date > ci && date < co;
      cells.push({
        date,
        iso,
        status,
        inRange,
        isCheckin: !!ci && this.iso(ci) === iso,
        isCheckout: !!co && this.iso(co) === iso,
      });
    }
    return cells;
  });

  ngOnInit(): void {
    this.loadMonth();
  }

  private iso(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  loadMonth(): void {
    const view = this.viewDate();
    const month = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, '0')}`;
    this.loading.set(true);
    this.reservationService.getAvailability(this.propertyId(), month, this.unitId()).subscribe({
      next: (days) => {
        this.availability.set(new Map(days.map((d) => [d.date.slice(0, 10), d.status])));
        this.loading.set(false);
      },
      error: () => {
        this.availability.set(new Map());
        this.loading.set(false);
      },
    });
  }

  prevMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
    this.loadMonth();
  }

  nextMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
    this.loadMonth();
  }

  selectDay(cell: CalendarCell): void {
    if (
      !cell.date ||
      cell.status === 'past' ||
      cell.status === 'blocked' ||
      cell.status === 'booked'
    ) {
      return;
    }
    const ci = this.checkin();
    const co = this.checkout();
    // Reiniciar si ya hay un rango completo o si el nuevo día es anterior al check-in
    if (!ci || (ci && co) || cell.date <= ci) {
      this.checkin.set(cell.date);
      this.checkout.set(null);
      return;
    }
    // Validar que el rango no incluya días no disponibles
    if (this.rangeHasUnavailable(ci, cell.date)) {
      this.toast.error(this.transloco.translate('public.availability.rangeUnavailable'));
      return;
    }
    this.checkout.set(cell.date);
  }

  private rangeHasUnavailable(start: Date, end: Date): boolean {
    const avail = this.availability();
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor < end) {
      const status = avail.get(this.iso(cursor));
      if (status === 'blocked' || status === 'booked') return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }

  requestReservation(): void {
    const ci = this.checkin();
    const co = this.checkout();
    if (!ci || !co) return;
    if (this.nights() < this.minNights()) {
      this.toast.error(
        this.transloco.translate('public.availability.minNights', { n: this.minNights() }),
      );
      return;
    }
    this.submitting.set(true);
    this.reservationService
      .createReservation({
        property_id: this.propertyId(),
        unit_id: this.unitId(),
        checkin_date: this.iso(ci),
        checkout_date: this.iso(co),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success(this.transloco.translate('public.availability.requested'));
          this.checkin.set(null);
          this.checkout.set(null);
          this.loadMonth();
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting.set(false);
          this.toast.error(
            err.error?.message ?? this.transloco.translate('public.availability.requestError'),
          );
        },
      });
  }
}
