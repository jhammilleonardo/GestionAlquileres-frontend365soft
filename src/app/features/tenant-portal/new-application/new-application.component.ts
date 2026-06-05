import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoModule } from '@jsverse/transloco';
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
import { Property } from '../../../core/models/property.model';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { AvailabilityCalendarComponent } from '../../public-portal/availability-calendar/availability-calendar.component';
import {
  AppButtonComponent,
  AppDialogComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppSelectComponent,
  AppTextFieldComponent,
} from '../../../shared/ui';
import { NewApplicationFacade } from './new-application.facade';

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
  providers: [provideTranslocoScope('rentalApp'), NewApplicationFacade],
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
          [label]="'tenantApplications.marketplace.rentalMode' | transloco"
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
                    <strong>{{ getShortTermPrice(property) | tenantCurrency }}</strong>
                    <span>{{ 'tenantApplications.marketplace.priceNight' | transloco }}</span>
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
                      {{ 'tenantApplications.marketplace.reserveStay' | transloco }}
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
              {{ 'common.previous' | transloco }}
            </app-button>
            <span>{{ currentPage() + 1 }} / {{ totalPages() }}</span>
            <app-button
              appearance="outline"
              [disabled]="currentPage() + 1 >= totalPages()"
              (clicked)="nextPage()"
            >
              {{ 'common.next' | transloco }}
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
          <app-loading-state
            [label]="'tenantApplications.marketplace.loadingAvailability' | transloco"
          />
        } @else if (selectedReservationProperty(); as reservationProperty) {
          @if (shortTermUnits().length === 0) {
            <app-empty-state
              [title]="'tenantApplications.marketplace.noShortTermUnitsTitle' | transloco"
              [description]="'tenantApplications.marketplace.noShortTermUnitsDesc' | transloco"
            />
          } @else {
            <div class="reservation-panel">
              @if (shortTermUnits().length > 1) {
                <app-select
                  [ngModel]="selectedReservationUnitId()"
                  [label]="'tenantApplications.marketplace.unit' | transloco"
                  [options]="shortTermUnitOptions()"
                  (ngModelChange)="selectedReservationUnitId.set($event)"
                />
              }

              @if (selectedReservationUnit(); as unit) {
                <div class="reservation-summary">
                  <div>
                    <span>{{ 'tenantApplications.marketplace.nightlyPrice' | transloco }}</span>
                    <strong>{{ unit.price_per_night ?? 0 | tenantCurrency }}</strong>
                  </div>
                  <div>
                    <span>{{ 'tenantApplications.marketplace.cleaningFee' | transloco }}</span>
                    <strong>{{ unit.cleaning_fee ?? 0 | tenantCurrency }}</strong>
                  </div>
                  <div>
                    <span>{{ 'tenantApplications.marketplace.minStay' | transloco }}</span>
                    <strong>{{
                      'tenantApplications.marketplace.nightsCount'
                        | transloco: { count: unit.min_nights ?? 1 }
                    }}</strong>
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

  private readonly facade = inject(NewApplicationFacade);

  protected readonly isLoading = this.facade.isLoading;
  protected readonly isLoadingReservationProperty = this.facade.isLoadingReservationProperty;
  protected readonly selectedReservationProperty = this.facade.selectedReservationProperty;
  protected readonly selectedReservationUnitId = this.facade.selectedReservationUnitId;
  protected readonly initialReservationCheckin = this.facade.initialReservationCheckin;
  protected readonly initialReservationCheckout = this.facade.initialReservationCheckout;
  protected readonly currentPage = this.facade.currentPage;
  protected readonly propertyTypeOptions = this.facade.propertyTypeOptions;
  protected readonly sortOptions = this.facade.sortOptions;
  protected readonly rentalModeOptions = this.facade.rentalModeOptions;
  protected readonly reservationDialogOpen = this.facade.reservationDialogOpen;
  protected readonly reservationDialogTitle = this.facade.reservationDialogTitle;
  protected readonly shortTermUnits = this.facade.shortTermUnits;
  protected readonly shortTermUnitOptions = this.facade.shortTermUnitOptions;
  protected readonly selectedReservationUnit = this.facade.selectedReservationUnit;

  protected get filters() {
    return this.facade.filters;
  }

  protected filteredProperties(): Property[] {
    return this.facade.filteredProperties();
  }

  protected paginatedProperties(): Property[] {
    return this.facade.paginatedProperties();
  }

  protected totalPages(): number {
    return this.facade.totalPages();
  }

  constructor() {
    this.facade.initialize();
  }

  protected loadProperties(): void {
    this.facade.loadProperties();
  }

  protected resetPage(): void {
    this.facade.resetPage();
  }

  protected clearFilters(): void {
    this.facade.clearFilters();
  }

  protected previousPage(): void {
    this.facade.previousPage();
  }

  protected nextPage(): void {
    this.facade.nextPage();
  }

  protected applyLongTerm(property: Property): void {
    this.facade.applyLongTerm(property);
  }

  protected reserveShortTerm(property: Property): void {
    this.facade.reserveShortTerm(property);
  }

  protected closeReservationDialog(): void {
    this.facade.closeReservationDialog();
  }

  protected supportsLongTerm(property: Property): boolean {
    return this.facade.supportsLongTerm(property);
  }

  protected supportsShortTerm(property: Property): boolean {
    return this.facade.supportsShortTerm(property);
  }

  protected rentalModeLabel(property: Property): string {
    return this.facade.rentalModeLabel(property);
  }

  protected getShortTermPrice(property: Property): number {
    return this.facade.getShortTermPrice(property);
  }
}
