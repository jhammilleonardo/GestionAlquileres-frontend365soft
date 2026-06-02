import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  ArrowRight,
  Bath,
  Bed,
  CalendarCheck,
  Home,
  MapPin,
  Maximize,
  SlidersHorizontal,
  Users,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { PropertyService } from '../../../core/services/admin/property.service';
import { CatalogUnit, Property } from '../../../core/models/property.model';
import { SlugService } from '../../../core/services/slug.service';
import { ReservationIntentionService } from '../../../core/services/tenant/reservation-intention.service';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { AvailabilityCalendarComponent } from '../../public-portal/availability-calendar/availability-calendar.component';
import {
  AppButtonComponent,
  AppDialogComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppSelectComponent,
  AppSelectOption,
  AppTextFieldComponent,
  ToastService,
} from '../../../shared/ui';

type MarketplaceSort = 'created_at' | 'price_asc' | 'price_desc' | 'area';
type RentalModeFilter = 'ALL' | 'LONG_TERM' | 'SHORT_TERM';

interface MarketplaceFilters {
  search: string;
  propertyType: string;
  rentalMode: RentalModeFilter;
  sort: MarketplaceSort;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-new-application',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppDialogComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    AvailabilityCalendarComponent,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <section class="marketplace-page">
      <app-page-header
        [eyebrow]="'tenantApplications.marketplace.eyebrow' | transloco"
        [title]="'tenantApplications.marketplace.title' | transloco"
        [description]="'tenantApplications.marketplace.subtitle' | transloco"
      />

      <section
        class="filters-panel"
        [attr.aria-label]="'tenantApplications.marketplace.title' | transloco"
      >
        <app-text-field
          [(ngModel)]="filters.search"
          type="search"
          [label]="'tenantApplications.marketplace.searchPlaceholder' | transloco"
          [placeholder]="'tenantApplications.marketplace.searchPlaceholder' | transloco"
          (ngModelChange)="resetPage()"
        />

        <app-select
          [(ngModel)]="filters.propertyType"
          [label]="'tenantApplications.marketplace.typePlaceholder' | transloco"
          [options]="propertyTypeOptions()"
          (ngModelChange)="resetPage()"
        />

        <app-select
          [(ngModel)]="filters.rentalMode"
          label="Modalidad"
          [options]="rentalModeOptions()"
          (ngModelChange)="resetPage()"
        />

        <app-select
          [(ngModel)]="filters.sort"
          [label]="'tenantApplications.marketplace.sortBy' | transloco"
          [options]="sortOptions()"
          (ngModelChange)="resetPage()"
        />

        <app-button appearance="outline" (clicked)="clearFilters()">
          <lucide-icon [img]="SlidersHorizontal" [size]="16"></lucide-icon>
          {{ 'tenantApplications.marketplace.clearFilters' | transloco }}
        </app-button>
      </section>

      @if (isLoading()) {
        <div class="state-box">
          <app-loading-state [label]="'tenantApplications.marketplace.loading' | transloco" />
        </div>
      } @else if (filteredProperties().length === 0) {
        <app-empty-state
          [title]="'tenantApplications.marketplace.noResultsTitle' | transloco"
          [description]="'tenantApplications.marketplace.noResultsDesc' | transloco"
        >
          <lucide-icon icon [img]="Home" [size]="28"></lucide-icon>
          <app-button actions appearance="primary" (clicked)="clearFilters()">
            {{ 'tenantApplications.marketplace.clearFilters' | transloco }}
          </app-button>
        </app-empty-state>
      } @else {
        <div class="properties-grid">
          @for (property of paginatedProperties(); track property.id) {
            <article class="property-card">
              <div class="property-image">
                @if (property.first_image) {
                  <img [src]="property.first_image" [alt]="property.title" />
                } @else {
                  <div class="image-placeholder">
                    <lucide-icon [img]="Home" [size]="44"></lucide-icon>
                  </div>
                }

                <div class="property-price">
                  @if (supportsLongTerm(property)) {
                    <strong>{{ property.monthly_rent | tenantCurrency }}</strong>
                    <span>{{ 'tenantApplications.marketplace.priceMonth' | transloco }}</span>
                  } @else {
                    <strong>Corto plazo</strong>
                    <span>por noche</span>
                  }
                </div>
              </div>

              <div class="property-content">
                <h2>{{ property.title }}</h2>

                <p class="property-location">
                  <lucide-icon [img]="MapPin" [size]="16"></lucide-icon>
                  <span
                    >{{ property.addresses?.[0]?.city }},
                    {{ property.addresses?.[0]?.country }}</span
                  >
                </p>

                <div class="property-features">
                  <span class="rental-mode">
                    <lucide-icon [img]="CalendarCheck" [size]="16"></lucide-icon>
                    {{ rentalModeLabel(property) }}
                  </span>
                  @if (property.bedrooms) {
                    <span>
                      <lucide-icon [img]="Bed" [size]="16"></lucide-icon>
                      {{
                        (property.bedrooms === 1
                          ? 'tenantApplications.marketplace.bedrooms'
                          : 'tenantApplications.marketplace.bedroomsPlural'
                        ) | transloco: { count: property.bedrooms }
                      }}
                    </span>
                  }
                  @if (property.bathrooms) {
                    <span>
                      <lucide-icon [img]="Bath" [size]="16"></lucide-icon>
                      {{
                        (property.bathrooms === 1
                          ? 'tenantApplications.marketplace.bathrooms'
                          : 'tenantApplications.marketplace.bathroomsPlural'
                        ) | transloco: { count: property.bathrooms }
                      }}
                    </span>
                  }
                  @if (property.square_meters) {
                    <span>
                      <lucide-icon [img]="Maximize" [size]="16"></lucide-icon>
                      {{ property.square_meters }}m2
                    </span>
                  }
                  @if (property.property_rules?.max_occupants) {
                    <span>
                      <lucide-icon [img]="Users" [size]="16"></lucide-icon>
                      {{
                        'tenantApplications.marketplace.occupants'
                          | transloco: { count: property.property_rules?.max_occupants }
                      }}
                    </span>
                  }
                </div>

                <div class="property-actions">
                  @if (supportsLongTerm(property)) {
                    <app-button
                      appearance="primary"
                      [fullWidth]="true"
                      (clicked)="applyLongTerm(property)"
                    >
                      {{ 'tenantApplications.marketplace.apply' | transloco }}
                      <lucide-icon [img]="ArrowRight" [size]="16"></lucide-icon>
                    </app-button>
                  }

                  @if (supportsShortTerm(property)) {
                    <app-button
                      appearance="outline"
                      [fullWidth]="true"
                      (clicked)="reserveShortTerm(property)"
                    >
                      Reservar estadía
                      <lucide-icon [img]="CalendarCheck" [size]="16"></lucide-icon>
                    </app-button>
                  }
                </div>
              </div>
            </article>
          }
        </div>

        @if (totalPages() > 1) {
          <nav
            class="pagination"
            [attr.aria-label]="'tenantApplications.marketplace.paginationLabel' | transloco"
          >
            <app-button
              appearance="outline"
              [disabled]="currentPage() === 0"
              (clicked)="previousPage()"
            >
              Anterior
            </app-button>
            <span>{{ currentPage() + 1 }} / {{ totalPages() }}</span>
            <app-button
              appearance="outline"
              [disabled]="currentPage() + 1 >= totalPages()"
              (clicked)="nextPage()"
            >
              Siguiente
            </app-button>
          </nav>
        }
      }

      <app-dialog
        [open]="reservationDialogOpen()"
        [title]="reservationDialogTitle()"
        [showFooter]="false"
        (closed)="closeReservationDialog()"
      >
        @if (isLoadingReservationProperty()) {
          <app-loading-state label="Cargando disponibilidad..." />
        } @else if (selectedReservationProperty(); as reservationProperty) {
          @if (shortTermUnits().length === 0) {
            <app-empty-state
              title="No hay unidades de corto plazo"
              description="Esta propiedad no tiene unidades configuradas con precio por noche."
            />
          } @else {
            <div class="reservation-panel">
              @if (shortTermUnits().length > 1) {
                <app-select
                  [ngModel]="selectedReservationUnitId()"
                  label="Unidad"
                  [options]="shortTermUnitOptions()"
                  (ngModelChange)="selectedReservationUnitId.set($event)"
                />
              }

              @if (selectedReservationUnit(); as unit) {
                <div class="reservation-summary">
                  <div>
                    <span>Precio por noche</span>
                    <strong>{{ unit.price_per_night ?? 0 | tenantCurrency }}</strong>
                  </div>
                  <div>
                    <span>Limpieza</span>
                    <strong>{{ unit.cleaning_fee ?? 0 | tenantCurrency }}</strong>
                  </div>
                  <div>
                    <span>Estadía mínima</span>
                    <strong>{{ unit.min_nights ?? 1 }} noche(s)</strong>
                  </div>
                </div>

                <app-availability-calendar
                  [propertyId]="reservationProperty.id"
                  [unitId]="unit.id"
                  [propertyTitle]="reservationProperty.title"
                  [unitNumber]="unit.unit_number"
                  [pricePerNight]="unit.price_per_night ?? 0"
                  [cleaningFee]="unit.cleaning_fee ?? 0"
                  [minNights]="unit.min_nights ?? 1"
                  [currency]="reservationProperty.currency ?? 'USD'"
                  [initialCheckin]="initialReservationCheckin()"
                  [initialCheckout]="initialReservationCheckout()"
                  (reservationCreated)="closeReservationDialog()"
                />
              }
            </div>
          }
        }
      </app-dialog>
    </section>
  `,
  styles: `
    .marketplace-page {
      max-inline-size: 1240px;
      margin-inline: auto;
    }

    .filters-panel {
      display: grid;
      grid-template-columns:
        minmax(220px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr)
        minmax(160px, 1fr) auto;
      gap: var(--app-space-3);
      align-items: end;
      margin-block-end: var(--app-space-6);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface-muted);
      padding: var(--app-space-4);
    }

    .state-box {
      display: grid;
      min-block-size: 20rem;
      place-items: center;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: var(--app-space-4);
    }

    .property-card {
      overflow: hidden;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        transform 0.15s ease;
    }

    .property-card:hover,
    .property-card:focus-visible {
      border-color: var(--app-color-primary);
      box-shadow: var(--app-shadow-md);
      outline: none;
      transform: translateY(-2px);
    }

    .property-image {
      position: relative;
      block-size: 210px;
      overflow: hidden;
      background: var(--app-color-surface-muted);
    }

    .property-image img {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      display: grid;
      block-size: 100%;
      place-items: center;
      color: var(--app-color-text-muted);
    }

    .property-price {
      position: absolute;
      inset-block-start: var(--app-space-3);
      inset-inline-end: var(--app-space-3);
      display: grid;
      justify-items: end;
      border-radius: var(--app-radius-md);
      background: rgb(15 23 42 / 82%);
      color: #fff;
      padding: var(--app-space-2) var(--app-space-3);
    }

    .property-price strong {
      font-size: 1.05rem;
      line-height: 1;
    }

    .property-price span {
      font-size: 0.75rem;
      opacity: 0.84;
    }

    .property-content {
      display: grid;
      gap: var(--app-space-3);
      padding: var(--app-space-4);
    }

    .property-content h2 {
      display: -webkit-box;
      min-block-size: 2.7rem;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      margin: 0;
      color: var(--app-color-text);
      font-size: 1.05rem;
      font-weight: 800;
      line-height: 1.32;
    }

    .property-location,
    .property-features span {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-1);
      color: var(--app-color-text-muted);
      font-size: 0.85rem;
    }

    .property-location {
      margin: 0;
    }

    .property-features {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-3);
      min-block-size: 1.5rem;
    }

    .rental-mode {
      color: var(--app-color-primary) !important;
      font-weight: 800;
    }

    .property-actions {
      display: grid;
      gap: var(--app-space-2);
    }

    .reservation-panel {
      display: grid;
      gap: var(--app-space-4);
    }

    .reservation-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--app-space-3);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
      padding: var(--app-space-3);
    }

    .reservation-summary div {
      display: grid;
      gap: 0.25rem;
    }

    .reservation-summary span {
      color: var(--app-color-text-muted);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .reservation-summary strong {
      color: var(--app-color-text);
      font-size: 0.95rem;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--app-space-3);
      margin-block-start: var(--app-space-6);
    }

    .pagination span {
      color: var(--app-color-text);
      font-weight: 800;
    }

    @media (max-width: 900px) {
      .filters-panel {
        grid-template-columns: 1fr;
      }

      .reservation-summary {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class NewApplicationComponent {
  protected readonly Home = Home;
  protected readonly MapPin = MapPin;
  protected readonly Users = Users;
  protected readonly Bed = Bed;
  protected readonly Bath = Bath;
  protected readonly Maximize = Maximize;
  protected readonly ArrowRight = ArrowRight;
  protected readonly SlidersHorizontal = SlidersHorizontal;
  protected readonly CalendarCheck = CalendarCheck;

  private readonly slugService = inject(SlugService);
  private readonly propertyService = inject(PropertyService);
  private readonly reservationIntentionService = inject(ReservationIntentionService);
  private readonly translocoService = inject(TranslocoService);
  private readonly toast = inject(ToastService);

  protected readonly isLoading = signal(false);
  protected readonly isLoadingReservationProperty = signal(false);
  protected readonly allProperties = signal<Property[]>([]);
  protected readonly selectedReservationProperty = signal<Property | null>(null);
  protected readonly selectedReservationUnitId = signal<number | null>(null);
  protected readonly initialReservationCheckin = signal<string | null>(null);
  protected readonly initialReservationCheckout = signal<string | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly pageSize = signal(12);

  protected filters: MarketplaceFilters = {
    search: '',
    propertyType: 'ALL',
    rentalMode: 'ALL',
    sort: 'created_at',
  };

  protected readonly propertyTypes = signal<string[]>([
    'Apartamento',
    'Casa',
    'Estudio',
    'Loft',
    'Penthouse',
  ]);

  protected readonly propertyTypeOptions = computed<readonly AppSelectOption<string>[]>(() => [
    {
      label: this.translocoService.translate('tenantApplications.marketplace.allTypes'),
      value: 'ALL',
    },
    ...this.propertyTypes().map((type) => ({ label: type, value: type })),
  ]);

  protected readonly sortOptions = computed<readonly AppSelectOption<MarketplaceSort>[]>(() => [
    {
      label: this.translocoService.translate('tenantApplications.marketplace.recent'),
      value: 'created_at',
    },
    {
      label: this.translocoService.translate('tenantApplications.marketplace.priceLow'),
      value: 'price_asc',
    },
    {
      label: this.translocoService.translate('tenantApplications.marketplace.priceHigh'),
      value: 'price_desc',
    },
    {
      label: this.translocoService.translate('tenantApplications.marketplace.area'),
      value: 'area',
    },
  ]);

  protected readonly rentalModeOptions = computed<readonly AppSelectOption<RentalModeFilter>[]>(
    () => [
      { label: 'Todas las modalidades', value: 'ALL' },
      { label: 'Largo plazo', value: 'LONG_TERM' },
      { label: 'Corto plazo', value: 'SHORT_TERM' },
    ],
  );

  protected readonly reservationDialogOpen = computed(
    () => this.isLoadingReservationProperty() || this.selectedReservationProperty() !== null,
  );

  protected readonly reservationDialogTitle = computed(() => {
    const property = this.selectedReservationProperty();
    return property ? `Reservar ${property.title}` : 'Reservar estadía';
  });

  protected readonly shortTermUnits = computed<CatalogUnit[]>(() =>
    (this.selectedReservationProperty()?.units ?? []).filter(
      (unit) =>
        this.supportsShortTermType(unit.rental_type) && Number(unit.price_per_night ?? 0) > 0,
    ),
  );

  protected readonly shortTermUnitOptions = computed<readonly AppSelectOption<number>[]>(() =>
    this.shortTermUnits().map((unit) => ({
      value: unit.id,
      label: `${unit.unit_number} - ${unit.price_per_night ?? 0}/noche`,
    })),
  );

  protected readonly selectedReservationUnit = computed<CatalogUnit | null>(() => {
    const selectedId = this.selectedReservationUnitId();
    return (
      this.shortTermUnits().find((unit) => unit.id === selectedId) ??
      this.shortTermUnits()[0] ??
      null
    );
  });

  protected filteredProperties(): Property[] {
    const search = this.filters.search.trim().toLowerCase();
    const propertyType = this.filters.propertyType;

    const filtered = this.allProperties().filter((property) => {
      const matchesSearch =
        !search ||
        property.title.toLowerCase().includes(search) ||
        property.addresses?.[0]?.city?.toLowerCase().includes(search) ||
        property.addresses?.[0]?.street_address?.toLowerCase().includes(search);

      const matchesType =
        propertyType === 'ALL' ||
        property.property_type?.name === propertyType ||
        property.property_type_name === propertyType;

      const matchesRentalMode =
        this.filters.rentalMode === 'ALL' ||
        (this.filters.rentalMode === 'LONG_TERM' && this.supportsLongTerm(property)) ||
        (this.filters.rentalMode === 'SHORT_TERM' && this.supportsShortTerm(property));

      return matchesSearch && matchesType && matchesRentalMode;
    });

    return this.sortProperties(filtered);
  }

  protected paginatedProperties(): Property[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredProperties().slice(start, start + this.pageSize());
  }

  protected totalPages(): number {
    return Math.ceil(this.filteredProperties().length / this.pageSize());
  }

  constructor() {
    this.loadProperties();
    this.openReservationIntentionIfAny();
  }

  protected loadProperties(): void {
    this.isLoading.set(true);
    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        this.allProperties.set(properties);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error(
          this.translocoService.translate('tenantApplications.marketplace.loadError'),
        );
      },
    });
  }

  protected resetPage(): void {
    this.currentPage.set(0);
  }

  protected clearFilters(): void {
    this.filters = {
      search: '',
      propertyType: 'ALL',
      rentalMode: 'ALL',
      sort: 'created_at',
    };
    this.currentPage.set(0);
  }

  protected previousPage(): void {
    this.currentPage.update((page) => Math.max(0, page - 1));
  }

  protected nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages() - 1, page + 1));
  }

  protected applyLongTerm(property: Property): void {
    this.slugService.navigateTo(['portal', 'application-wizard', property.id.toString()]);
  }

  protected reserveShortTerm(property: Property): void {
    this.initialReservationCheckin.set(null);
    this.initialReservationCheckout.set(null);
    this.isLoadingReservationProperty.set(true);
    this.selectedReservationProperty.set(null);
    this.selectedReservationUnitId.set(null);

    this.propertyService.getPropertyById(property.id).subscribe({
      next: (propertyDetail) => {
        this.isLoadingReservationProperty.set(false);
        const detail = propertyDetail ?? property;
        this.selectedReservationProperty.set(detail);
        const firstUnit = (detail.units ?? []).find(
          (unit) =>
            this.supportsShortTermType(unit.rental_type) && Number(unit.price_per_night ?? 0) > 0,
        );
        this.selectedReservationUnitId.set(firstUnit?.id ?? null);
      },
      error: () => {
        this.isLoadingReservationProperty.set(false);
        this.toast.error('No se pudo cargar la disponibilidad de la propiedad.');
      },
    });
  }

  protected closeReservationDialog(): void {
    this.isLoadingReservationProperty.set(false);
    this.selectedReservationProperty.set(null);
    this.selectedReservationUnitId.set(null);
    this.initialReservationCheckin.set(null);
    this.initialReservationCheckout.set(null);
    this.reservationIntentionService.clearIntention();
  }

  protected supportsLongTerm(property: Property): boolean {
    const type = this.normalizeRentalType(property.rental_type);
    return !type || type === 'LONG_TERM' || type === 'BOTH';
  }

  protected supportsShortTerm(property: Property): boolean {
    const type = this.normalizeRentalType(property.rental_type);
    return type === 'SHORT_TERM' || type === 'BOTH';
  }

  protected rentalModeLabel(property: Property): string {
    const type = this.normalizeRentalType(property.rental_type);
    if (type === 'SHORT_TERM') return 'Corto plazo';
    if (type === 'LONG_TERM') return 'Largo plazo';
    if (type === 'BOTH') return 'Largo y corto plazo';
    return 'Largo plazo';
  }

  private supportsShortTermType(type: string | null | undefined): boolean {
    const normalized = this.normalizeRentalType(type);
    return normalized === 'SHORT_TERM' || normalized === 'BOTH';
  }

  private normalizeRentalType(
    type: string | null | undefined,
  ): 'SHORT_TERM' | 'LONG_TERM' | 'BOTH' | null {
    const normalized = (type ?? '').toUpperCase();
    if (normalized === 'SHORT_TERM' || normalized === 'SHORT') return 'SHORT_TERM';
    if (normalized === 'LONG_TERM' || normalized === 'LONG') return 'LONG_TERM';
    if (normalized === 'BOTH') return 'BOTH';
    return null;
  }

  private openReservationIntentionIfAny(): void {
    const intention = this.reservationIntentionService.getIntention();
    if (!intention) return;

    this.isLoadingReservationProperty.set(true);
    this.selectedReservationProperty.set(null);
    this.selectedReservationUnitId.set(null);
    this.initialReservationCheckin.set(intention.checkinDate);
    this.initialReservationCheckout.set(intention.checkoutDate);

    this.propertyService.getPropertyById(intention.propertyId).subscribe({
      next: (propertyDetail) => {
        this.isLoadingReservationProperty.set(false);
        if (!propertyDetail) {
          this.toast.error('No se pudo recuperar la propiedad de la reserva.');
          this.reservationIntentionService.clearIntention();
          return;
        }

        this.selectedReservationProperty.set(propertyDetail);
        const units = propertyDetail.units ?? [];
        const intendedUnit = units.find((unit) => unit.id === intention.unitId);
        const fallbackUnit = units.find(
          (unit) =>
            this.supportsShortTermType(unit.rental_type) && Number(unit.price_per_night ?? 0) > 0,
        );
        this.selectedReservationUnitId.set(intendedUnit?.id ?? fallbackUnit?.id ?? null);
      },
      error: () => {
        this.isLoadingReservationProperty.set(false);
        this.toast.error('No se pudo recuperar la reserva pendiente.');
        this.reservationIntentionService.clearIntention();
      },
    });
  }

  private sortProperties(properties: Property[]): Property[] {
    return [...properties].sort((a, b) => {
      if (this.filters.sort === 'price_asc') {
        return Number(a.monthly_rent || 0) - Number(b.monthly_rent || 0);
      }
      if (this.filters.sort === 'price_desc') {
        return Number(b.monthly_rent || 0) - Number(a.monthly_rent || 0);
      }
      if (this.filters.sort === 'area') {
        return Number(b.square_meters || 0) - Number(a.square_meters || 0);
      }

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }
}
