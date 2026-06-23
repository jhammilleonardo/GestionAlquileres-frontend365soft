import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CatalogUnit, Property } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { ReservationIntentionService } from '../../../core/services/tenant/reservation-intention.service';
import { AvailabilityCalendarComponent } from '../../public-portal/availability-calendar/availability-calendar.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

/**
 * Checkout de reserva de corto plazo del inquilino autenticado. Reutiliza el
 * mismo calendario de disponibilidad del catálogo público (`AvailabilityCalendarComponent`),
 * que ya resuelve disponibilidad, cotización en vivo y creación de la reserva.
 * Aquí sólo se cargan los datos de la unidad para alimentar el calendario y se
 * precargan las fechas elegidas antes del login (intención de reserva).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reservation-checkout',
  standalone: true,
  imports: [
    TranslocoModule,
    AvailabilityCalendarComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'tenant-reservas', alias: 'tenantReservations' })],
  template: `
    <div class="checkout-page">
      <app-page-header
        [title]="'tenantReservations.checkout.title' | transloco"
        [description]="'tenantReservations.checkout.subtitle' | transloco"
      />

      @if (isLoading()) {
        <app-loading-state [label]="'tenantReservations.checkout.calculating' | transloco" />
      } @else if (loadError()) {
        <p class="checkout-error" role="alert">{{ loadError() }}</p>
      } @else if (unit(); as u) {
        <div class="checkout-card">
          <app-availability-calendar
            [propertyId]="propertyId()"
            [unitId]="unitId()"
            [propertyTitle]="property()?.title ?? ''"
            [unitNumber]="u.unit_number"
            [pricePerNight]="u.price_per_night ?? 0"
            [cleaningFee]="u.cleaning_fee ?? 0"
            [minNights]="u.min_nights ?? 1"
            [currency]="property()?.currency ?? 'BOB'"
            [initialCheckin]="initialCheckin()"
            [initialCheckout]="initialCheckout()"
            (reservationCreated)="onReservationCreated()"
          />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .checkout-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.25rem;
      }
      .checkout-card {
        /* El calendario usa celdas con aspect-ratio 1 sobre una grilla de 7
           columnas; sin un ancho máximo las celdas crecen desproporcionadas al
           ocupar todo el ancho del portal. Acotamos para que se vea como en el
           catálogo público (dos meses ~280px cada uno). */
        max-width: 760px;
        padding: 1.25rem;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 0.875rem;
        background: var(--color-surface, #ffffff);
      }
      .checkout-error {
        font-size: 0.9rem;
        color: var(--color-danger-strong, #b91c1c);
      }
    `,
  ],
})
export class ReservationCheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(PropertyService);
  private readonly intentionService = inject(ReservationIntentionService);
  private readonly slugService = inject(SlugService);
  private readonly transloco = inject(TranslocoService);

  readonly propertyId = signal(Number(this.route.snapshot.paramMap.get('propertyId')));
  readonly unitId = signal(Number(this.route.snapshot.paramMap.get('unitId')));

  readonly property = signal<Property | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  /** Unidad de la propiedad cuyo `id` coincide con el de la ruta. */
  readonly unit = computed<CatalogUnit | null>(
    () => this.property()?.units?.find((u) => u.id === this.unitId()) ?? null,
  );

  /** Fechas precargadas desde la intención previa al login (si es la misma unidad). */
  readonly initialCheckin = signal<string | null>(null);
  readonly initialCheckout = signal<string | null>(null);

  constructor() {
    this.restoreIntentionDates();
    this.loadProperty();
  }

  onReservationCreated(): void {
    this.slugService.navigateTo(['portal', 'reservas']);
  }

  private restoreIntentionDates(): void {
    const intention = this.intentionService.getIntention();
    if (!intention || intention.unitId !== this.unitId()) return;
    this.initialCheckin.set(intention.checkinDate);
    this.initialCheckout.set(intention.checkoutDate);
  }

  private loadProperty(): void {
    this.propertyService
      .getPropertyById(this.propertyId())
      .pipe(
        catchError(() => of(undefined)),
        takeUntilDestroyed(),
      )
      .subscribe((property) => {
        this.property.set(property ?? null);
        const unitExists = property?.units?.some((u) => u.id === this.unitId()) ?? false;
        if (!unitExists) {
          this.loadError.set(this.transloco.translate('tenantReservations.checkout.loadError'));
        }
        this.isLoading.set(false);
      });
  }
}
