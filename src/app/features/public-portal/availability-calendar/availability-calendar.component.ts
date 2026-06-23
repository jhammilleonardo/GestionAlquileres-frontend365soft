import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, CalendarCheck } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { Subject, catchError, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  AvailabilityStatus,
  QuoteBreakdown,
  QuoteLineConcept,
  ReservationService,
} from '../../../core/services/reservation.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { ReservationIntentionService } from '../../../core/services/tenant/reservation-intention.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AvailabilityCalendarGridComponent } from './availability-calendar-grid.component';

import { getApiErrorMessage } from '../../../core/http/http-error.util';

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AvailabilityCalendarGridComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './availability-calendar.component.html',
  styleUrl: './availability-calendar.component.scss',
})
export class AvailabilityCalendarComponent implements OnInit {
  readonly CalendarCheck = CalendarCheck;

  readonly propertyId = input.required<number>();
  readonly unitId = input.required<number>();
  readonly pricePerNight = input(0);
  readonly cleaningFee = input(0);
  readonly minNights = input(1);
  readonly currency = input('USD');
  readonly propertyTitle = input('');
  readonly unitNumber = input('');
  readonly initialCheckin = input<string | null>(null);
  readonly initialCheckout = input<string | null>(null);
  readonly reservationCreated = output<void>();

  private readonly reservationService = inject(ReservationService);
  private readonly tenantAuthService = inject(TenantAuthService);
  private readonly reservationIntentionService = inject(ReservationIntentionService);
  private readonly slugService = inject(SlugService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly viewDate = signal(new Date());
  readonly availability = signal<Map<string, AvailabilityStatus>>(new Map());
  readonly loading = signal(false);
  readonly checkin = signal<Date | null>(null);
  readonly checkout = signal<Date | null>(null);
  readonly submitting = signal(false);
  readonly quote = signal<QuoteBreakdown | null>(null);
  readonly quoteLoading = signal(false);
  readonly quoteError = signal<string | null>(null);
  private readonly quoteRequests = new Subject<{ checkin: string; checkout: string }>();

  readonly nights = computed(() => {
    const ci = this.checkin();
    const co = this.checkout();
    if (!ci || !co) return 0;
    return Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000));
  });

  readonly totalCost = computed(
    () => this.quote()?.total_due ?? this.nights() * this.pricePerNight() + this.cleaningFee(),
  );

  constructor() {
    this.quoteRequests
      .pipe(
        tap(() => {
          this.quoteLoading.set(true);
          this.quoteError.set(null);
          this.quote.set(null);
        }),
        switchMap(({ checkin, checkout }) =>
          this.reservationService
            .getQuote(this.propertyId(), this.unitId(), {
              checkin_date: checkin,
              checkout_date: checkout,
            })
            .pipe(
              map((quote) => ({ quote, error: null as string | null })),
              catchError((error: unknown) =>
                of({
                  quote: null,
                  error: getApiErrorMessage(
                    error,
                    this.transloco.translate('public.availability.quoteError'),
                  ),
                }),
              ),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ quote, error }) => {
        this.quoteLoading.set(false);
        this.quote.set(quote);
        this.quoteError.set(error);
      });
  }

  ngOnInit(): void {
    this.restoreInitialRange();
    this.loadMonth();
  }

  /** Estado de un día concreto (pasado, o el de disponibilidad / disponible). */
  private statusFor(date: Date): AvailabilityStatus | 'past' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return 'past';
    return this.availability().get(this.iso(date)) ?? 'available';
  }

  private iso(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  loadMonth(): void {
    const first = this.monthStart(this.viewDate());
    const months = [
      this.monthKey(first),
      this.monthKey(new Date(first.getFullYear(), first.getMonth() + 1, 1)),
    ];
    this.loading.set(true);
    forkJoin(
      months.map((month) =>
        this.reservationService.getAvailability(this.propertyId(), month, this.unitId()),
      ),
    ).subscribe({
      next: (responses) => {
        const entries = responses
          .flat()
          .map((day) => [day.date.slice(0, 10), day.status] as [string, AvailabilityStatus]);
        this.availability.set(new Map(entries));
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

  /** Idioma activo para que la grilla formatee los nombres de mes. */
  localeCode(): string {
    return this.transloco.getActiveLang();
  }

  onMonthChange(delta: number): void {
    if (delta < 0) {
      this.prevMonth();
    } else {
      this.nextMonth();
    }
  }

  selectDay(date: Date): void {
    const status = this.statusFor(date);
    if (status === 'past' || status === 'blocked' || status === 'booked') {
      return;
    }
    const ci = this.checkin();
    const co = this.checkout();
    // Reiniciar si ya hay un rango completo o si el nuevo día es anterior al check-in
    if (!ci || (ci && co) || date <= ci) {
      this.checkin.set(date);
      this.checkout.set(null);
      this.clearQuote();
      return;
    }
    // Validar que el rango no incluya días no disponibles
    if (this.rangeHasUnavailable(ci, date)) {
      this.toast.error(this.transloco.translate('public.availability.rangeUnavailable'));
      return;
    }
    this.checkout.set(date);
    this.requestQuote();
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
    if (!this.quote()) {
      this.requestQuote();
      return;
    }
    if (this.nights() < this.minNights()) {
      this.toast.error(
        this.transloco.translate('public.availability.minNights', { n: this.minNights() }),
      );
      return;
    }

    if (!this.tenantAuthService.isAuthenticated()) {
      const slug = this.slugService.getSlug();
      if (!slug) {
        this.toast.error(this.transloco.translate('public.availability.missingSlug'));
        return;
      }

      this.reservationIntentionService.setIntention({
        propertyId: this.propertyId(),
        propertyTitle:
          this.propertyTitle().trim() ||
          this.transloco.translate('public.availability.selectedProperty'),
        unitId: this.unitId(),
        unitNumber: this.unitNumber().trim() || undefined,
        checkinDate: this.iso(ci),
        checkoutDate: this.iso(co),
      });
      this.toast.info(this.transloco.translate('public.availability.loginRequired'));
      this.reservationIntentionService.navigateToLogin(slug);
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
          this.reservationIntentionService.clearIntention();
          this.checkin.set(null);
          this.checkout.set(null);
          this.clearQuote();
          this.loadMonth();
          this.reservationCreated.emit();
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('public.availability.requestError')),
          );
        },
      });
  }

  private restoreInitialRange(): void {
    const checkin = this.parseIsoDate(this.initialCheckin());
    const checkout = this.parseIsoDate(this.initialCheckout());
    if (!checkin || !checkout || checkout <= checkin) return;

    this.checkin.set(checkin);
    this.checkout.set(checkout);
    this.viewDate.set(new Date(checkin.getFullYear(), checkin.getMonth(), 1));
    this.requestQuote();
  }

  private parseIsoDate(value: string | null): Date | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  quoteLineLabel(concept: QuoteLineConcept): string {
    return this.transloco.translate(`public.availability.priceLines.${concept}`);
  }

  private requestQuote(): void {
    const checkin = this.checkin();
    const checkout = this.checkout();
    if (!checkin || !checkout) return;
    this.quoteRequests.next({ checkin: this.iso(checkin), checkout: this.iso(checkout) });
  }

  private clearQuote(): void {
    this.quote.set(null);
    this.quoteError.set(null);
    this.quoteLoading.set(false);
  }
}
