import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  ArrowRight,
  Bath,
  Bed,
  CalendarCheck,
  Car,
  ChevronLeft,
  ChevronRight,
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
              <button
                type="button"
                class="property-image"
                (click)="openDetails(property)"
                [attr.aria-label]="
                  ('tenantApplications.marketplace.viewDetails' | transloco) + ': ' + property.title
                "
              >
                @if (cardImage(property)) {
                  <img
                    [src]="cardImage(property)"
                    [alt]="property.title"
                    loading="lazy"
                    (error)="handleImageError($event)"
                  />
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
              </button>

              <div class="property-content">
                <button type="button" class="property-title-btn" (click)="openDetails(property)">
                  <h2>{{ property.title }}</h2>
                </button>

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
                  <app-button
                    appearance="outline"
                    [fullWidth]="true"
                    (clicked)="openDetails(property)"
                  >
                    {{ 'tenantApplications.marketplace.viewDetails' | transloco }}
                  </app-button>

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

      <app-dialog
        [open]="detailDialogOpen()"
        [title]="detailDialogTitle()"
        [showFooter]="false"
        (closed)="closeDetails()"
      >
        @if (isLoadingDetailProperty()) {
          <app-loading-state [label]="'tenantApplications.marketplace.loadingDetail' | transloco" />
        } @else if (selectedDetailProperty(); as property) {
          <div class="detail">
            <div class="detail-gallery">
              @if (detailCurrentImage(); as image) {
                <img
                  [src]="image"
                  [alt]="property.title"
                  loading="lazy"
                  (error)="handleImageError($event)"
                />
              } @else {
                <div class="image-placeholder">
                  <lucide-icon [img]="Home" [size]="56"></lucide-icon>
                </div>
              }

              @if (detailImages().length > 1) {
                <button
                  type="button"
                  class="gallery-nav gallery-nav--prev"
                  [attr.aria-label]="'tenantApplications.marketplace.previousImage' | transloco"
                  (click)="previousDetailImage()"
                >
                  <lucide-icon [img]="ChevronLeft" [size]="20"></lucide-icon>
                </button>
                <button
                  type="button"
                  class="gallery-nav gallery-nav--next"
                  [attr.aria-label]="'tenantApplications.marketplace.nextImage' | transloco"
                  (click)="nextDetailImage()"
                >
                  <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
                </button>
                <span class="gallery-counter">
                  {{
                    'tenantApplications.marketplace.imageCounter'
                      | transloco: { current: detailImageIndex() + 1, total: detailImages().length }
                  }}
                </span>
              }
            </div>

            @if (detailImages().length > 1) {
              <div class="detail-thumbs">
                @for (image of detailImages(); track image; let i = $index) {
                  <button
                    type="button"
                    class="detail-thumb"
                    [class.is-active]="i === detailImageIndex()"
                    (click)="selectDetailImage(i)"
                    [attr.aria-label]="
                      'tenantApplications.marketplace.imageCounter'
                        | transloco: { current: i + 1, total: detailImages().length }
                    "
                  >
                    <img
                      [src]="image"
                      [alt]="property.title"
                      loading="lazy"
                      (error)="handleImageError($event)"
                    />
                  </button>
                }
              </div>
            }

            <div class="detail-head">
              <div class="detail-price">
                @if (supportsLongTerm(property)) {
                  <strong>{{ property.monthly_rent | tenantCurrency }}</strong>
                  <span>{{ 'tenantApplications.marketplace.priceMonth' | transloco }}</span>
                } @else {
                  <strong>{{ getShortTermPrice(property) | tenantCurrency }}</strong>
                  <span>{{ 'tenantApplications.marketplace.priceNight' | transloco }}</span>
                }
              </div>
              <span class="detail-mode">
                <lucide-icon [img]="CalendarCheck" [size]="16"></lucide-icon>
                {{ rentalModeLabel(property) }}
              </span>
            </div>

            <p class="detail-location">
              <lucide-icon [img]="MapPin" [size]="16"></lucide-icon>
              <span>
                {{ property.addresses?.[0]?.city || ('common.notAvailable' | transloco) }}
                @if (property.addresses?.[0]?.country) {
                  , {{ property.addresses?.[0]?.country }}
                }
              </span>
            </p>

            <section class="detail-section">
              <h3>{{ 'tenantApplications.marketplace.featuresTitle' | transloco }}</h3>
              <div class="detail-features">
                @if (property.bedrooms) {
                  <div class="feature">
                    <lucide-icon [img]="Bed" [size]="18"></lucide-icon>
                    <div>
                      <strong>{{ property.bedrooms }}</strong>
                      <span>{{
                        'tenantApplications.marketplace.featureBedrooms' | transloco
                      }}</span>
                    </div>
                  </div>
                }
                @if (property.bathrooms) {
                  <div class="feature">
                    <lucide-icon [img]="Bath" [size]="18"></lucide-icon>
                    <div>
                      <strong>{{ property.bathrooms }}</strong>
                      <span>{{
                        'tenantApplications.marketplace.featureBathrooms' | transloco
                      }}</span>
                    </div>
                  </div>
                }
                @if (property.square_meters) {
                  <div class="feature">
                    <lucide-icon [img]="Maximize" [size]="18"></lucide-icon>
                    <div>
                      <strong>{{ property.square_meters }}</strong>
                      <span>{{ 'tenantApplications.marketplace.featureArea' | transloco }}</span>
                    </div>
                  </div>
                }
                @if (property.parking_spaces) {
                  <div class="feature">
                    <lucide-icon [img]="Car" [size]="18"></lucide-icon>
                    <div>
                      <strong>{{ property.parking_spaces }}</strong>
                      <span>{{ 'tenantApplications.marketplace.featureParking' | transloco }}</span>
                    </div>
                  </div>
                }
                @if (property.property_rules?.max_occupants) {
                  <div class="feature">
                    <lucide-icon [img]="Users" [size]="18"></lucide-icon>
                    <div>
                      <strong>{{ property.property_rules?.max_occupants }}</strong>
                      <span>{{
                        'tenantApplications.marketplace.featureOccupants' | transloco
                      }}</span>
                    </div>
                  </div>
                }
                @if (property.year_built) {
                  <div class="feature">
                    <lucide-icon [img]="CalendarCheck" [size]="18"></lucide-icon>
                    <div>
                      <strong>{{ property.year_built }}</strong>
                      <span>{{ 'tenantApplications.marketplace.featureYear' | transloco }}</span>
                    </div>
                  </div>
                }
                @if (property.is_furnished !== undefined && property.is_furnished !== null) {
                  <div class="feature">
                    <lucide-icon [img]="Home" [size]="18"></lucide-icon>
                    <div>
                      <strong>{{
                        (property.is_furnished ? 'common.yes' : 'common.no') | transloco
                      }}</strong>
                      <span>{{
                        'tenantApplications.marketplace.featureFurnished' | transloco
                      }}</span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <section class="detail-section">
              <h3>{{ 'tenantApplications.marketplace.descriptionTitle' | transloco }}</h3>
              <p class="detail-description">
                {{
                  property.description ||
                    ('tenantApplications.marketplace.noDescription' | transloco)
                }}
              </p>
            </section>

            @if (property.amenities?.length) {
              <section class="detail-section">
                <h3>{{ 'tenantApplications.marketplace.amenitiesTitle' | transloco }}</h3>
                <div class="detail-chips">
                  @for (amenity of property.amenities; track amenity) {
                    <span class="chip">{{ amenity }}</span>
                  }
                </div>
              </section>
            }

            @if (property.included_items?.length) {
              <section class="detail-section">
                <h3>{{ 'tenantApplications.marketplace.includedTitle' | transloco }}</h3>
                <div class="detail-chips">
                  @for (item of property.included_items; track item) {
                    <span class="chip">{{ item }}</span>
                  }
                </div>
              </section>
            }

            <div class="detail-actions">
              @if (supportsLongTerm(property)) {
                <app-button
                  appearance="primary"
                  [fullWidth]="true"
                  (clicked)="applyLongTermFromDetail()"
                >
                  {{ 'tenantApplications.marketplace.apply' | transloco }}
                  <lucide-icon [img]="ArrowRight" [size]="16"></lucide-icon>
                </app-button>
              }
              @if (supportsShortTerm(property)) {
                <app-button
                  appearance="outline"
                  [fullWidth]="true"
                  (clicked)="reserveShortTermFromDetail()"
                >
                  {{ 'tenantApplications.marketplace.reserveStay' | transloco }}
                  <lucide-icon [img]="CalendarCheck" [size]="16"></lucide-icon>
                </app-button>
              }
            </div>
          </div>
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
      display: block;
      inline-size: 100%;
      block-size: 210px;
      overflow: hidden;
      border: 0;
      padding: 0;
      background: var(--app-color-surface-muted);
      cursor: pointer;
    }

    .property-image:focus-visible {
      outline: 2px solid var(--app-color-primary);
      outline-offset: -2px;
    }

    .property-title-btn {
      display: block;
      inline-size: 100%;
      border: 0;
      padding: 0;
      background: transparent;
      text-align: start;
      cursor: pointer;
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

    .detail {
      display: grid;
      gap: var(--app-space-4);
    }

    .detail-gallery {
      position: relative;
      block-size: clamp(220px, 42vh, 380px);
      overflow: hidden;
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface-muted);
    }

    .detail-gallery img {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }

    .detail-gallery .image-placeholder {
      display: grid;
      block-size: 100%;
      place-items: center;
      color: var(--app-color-text-muted);
    }

    .gallery-nav {
      position: absolute;
      inset-block-start: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2.5rem;
      block-size: 2.5rem;
      transform: translateY(-50%);
      border: 0;
      border-radius: 999px;
      background: rgb(15 23 42 / 62%);
      color: #fff;
      cursor: pointer;
    }

    .gallery-nav:hover {
      background: rgb(15 23 42 / 82%);
    }

    .gallery-nav--prev {
      inset-inline-start: var(--app-space-3);
    }

    .gallery-nav--next {
      inset-inline-end: var(--app-space-3);
    }

    .gallery-counter {
      position: absolute;
      inset-block-end: var(--app-space-3);
      inset-inline-end: var(--app-space-3);
      border-radius: var(--app-radius-md);
      background: rgb(15 23 42 / 72%);
      color: #fff;
      padding: 0.25rem 0.6rem;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .detail-thumbs {
      display: flex;
      gap: var(--app-space-2);
      overflow-x: auto;
      padding-block-end: var(--app-space-1);
    }

    .detail-thumb {
      flex: 0 0 auto;
      inline-size: 72px;
      block-size: 56px;
      overflow: hidden;
      border: 2px solid transparent;
      border-radius: var(--app-radius-md);
      padding: 0;
      background: var(--app-color-surface-muted);
      cursor: pointer;
    }

    .detail-thumb.is-active {
      border-color: var(--app-color-primary);
    }

    .detail-thumb img {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }

    .detail-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
    }

    .detail-price {
      display: flex;
      align-items: baseline;
      gap: var(--app-space-1);
    }

    .detail-price strong {
      color: var(--app-color-text);
      font-size: 1.5rem;
      font-weight: 800;
    }

    .detail-price span {
      color: var(--app-color-text-muted);
      font-size: 0.85rem;
    }

    .detail-mode {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-1);
      color: var(--app-color-primary);
      font-weight: 800;
    }

    .detail-location {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-1);
      margin: 0;
      color: var(--app-color-text-muted);
      font-size: 0.9rem;
    }

    .detail-section {
      display: grid;
      gap: var(--app-space-2);
    }

    .detail-section h3 {
      margin: 0;
      color: var(--app-color-text);
      font-size: 1rem;
      font-weight: 800;
    }

    .detail-features {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--app-space-3);
    }

    .feature {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
      padding: var(--app-space-3);
      color: var(--app-color-primary);
    }

    .feature div {
      display: grid;
    }

    .feature strong {
      color: var(--app-color-text);
      font-size: 1rem;
    }

    .feature span {
      color: var(--app-color-text-muted);
      font-size: 0.78rem;
    }

    .detail-description {
      margin: 0;
      color: var(--app-color-text-muted);
      line-height: 1.6;
      white-space: pre-line;
    }

    .detail-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
    }

    .chip {
      border: 1px solid var(--app-color-border);
      border-radius: 999px;
      background: var(--app-color-surface-muted);
      padding: 0.3rem 0.75rem;
      color: var(--app-color-text);
      font-size: 0.82rem;
    }

    .detail-actions {
      display: grid;
      gap: var(--app-space-2);
      position: sticky;
      inset-block-end: 0;
      /* Fondo opaco al quedar fijo abajo: si no, el contenido se ve por detrás
         del botón (era el bug del "Reservar estadía" encimado). El padding y el
         borde lo separan limpiamente del contenido que pasa por debajo. */
      background: var(--app-color-surface, #ffffff);
      padding-block: var(--app-space-3);
      border-block-start: 1px solid var(--app-color-border);
    }

    @media (min-width: 640px) {
      .detail-actions {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
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
  protected readonly Car = Car;
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronRight = ChevronRight;

  private readonly facade = inject(NewApplicationFacade);
  private readonly transloco = inject(TranslocoService);

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

  protected readonly isLoadingDetailProperty = this.facade.isLoadingDetailProperty;
  protected readonly selectedDetailProperty = this.facade.selectedDetailProperty;
  protected readonly detailDialogOpen = this.facade.detailDialogOpen;
  protected readonly detailDialogTitle = this.facade.detailDialogTitle;
  protected readonly detailImages = this.facade.detailImages;
  protected readonly detailImageIndex = this.facade.detailImageIndex;
  protected readonly detailCurrentImage = this.facade.detailCurrentImage;

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

  protected cardImage(property: Property): string {
    return this.facade.cardImage(property);
  }

  protected openDetails(property: Property): void {
    this.facade.openDetails(property);
  }

  protected closeDetails(): void {
    this.facade.closeDetails();
  }

  protected nextDetailImage(): void {
    this.facade.nextDetailImage();
  }

  protected previousDetailImage(): void {
    this.facade.previousDetailImage();
  }

  protected selectDetailImage(index: number): void {
    this.facade.selectDetailImage(index);
  }

  protected applyLongTermFromDetail(): void {
    this.facade.applyLongTermFromDetail();
  }

  protected reserveShortTermFromDetail(): void {
    this.facade.reserveShortTermFromDetail();
  }

  protected handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    const text = this.transloco.translate('tenantApplications.marketplace.noImage');
    target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="260"%3E%3Crect width="400" height="260" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="15" fill="%2394a3b8"%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
  }
}
