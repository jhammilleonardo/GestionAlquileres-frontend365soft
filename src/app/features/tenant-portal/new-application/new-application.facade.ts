import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { PropertyService } from '../../../core/services/admin/property.service';
import { CatalogUnit, Property } from '../../../core/models/property.model';
import { SlugService } from '../../../core/services/slug.service';
import { ReservationIntentionService } from '../../../core/services/tenant/reservation-intention.service';
import { AppSelectOption, ToastService } from '../../../shared/ui';
import { environment } from '../../../../environments/environment';

export type MarketplaceSort = 'created_at' | 'price_asc' | 'price_desc' | 'area';
export type RentalModeFilter = 'ALL' | 'LONG_TERM' | 'SHORT_TERM';

export interface MarketplaceFilters {
  search: string;
  propertyType: string;
  rentalMode: RentalModeFilter;
  sort: MarketplaceSort;
}

@Injectable()
export class NewApplicationFacade {
  private readonly slugService = inject(SlugService);
  private readonly propertyService = inject(PropertyService);
  private readonly reservationIntentionService = inject(ReservationIntentionService);
  private readonly translocoService = inject(TranslocoService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly isLoadingReservationProperty = signal(false);
  readonly allProperties = signal<Property[]>([]);
  readonly selectedReservationProperty = signal<Property | null>(null);
  readonly selectedReservationUnitId = signal<number | null>(null);
  readonly initialReservationCheckin = signal<string | null>(null);
  readonly initialReservationCheckout = signal<string | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(12);

  // Vista de detalle previa a la postulación.
  readonly isLoadingDetailProperty = signal(false);
  readonly selectedDetailProperty = signal<Property | null>(null);
  readonly detailImageIndex = signal(0);

  private readonly imageBaseUrl = environment.apiUrl.replace(/\/+$/, '');

  filters: MarketplaceFilters = {
    search: '',
    propertyType: 'ALL',
    rentalMode: 'ALL',
    sort: 'created_at',
  };

  readonly propertyTypes = signal<string[]>([
    'Apartamento',
    'Casa',
    'Estudio',
    'Loft',
    'Penthouse',
  ]);

  readonly propertyTypeOptions = computed<readonly AppSelectOption<string>[]>(() => [
    {
      label: this.translocoService.translate('tenantApplications.marketplace.allTypes'),
      value: 'ALL',
    },
    ...this.propertyTypes().map((type) => ({ label: type, value: type })),
  ]);

  readonly sortOptions = computed<readonly AppSelectOption<MarketplaceSort>[]>(() => [
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

  readonly rentalModeOptions = computed<readonly AppSelectOption<RentalModeFilter>[]>(() => [
    {
      label: this.translocoService.translate('tenantApplications.marketplace.rentalModeAll'),
      value: 'ALL',
    },
    {
      label: this.translocoService.translate('tenantApplications.marketplace.rentalModeLong'),
      value: 'LONG_TERM',
    },
    {
      label: this.translocoService.translate('tenantApplications.marketplace.rentalModeShort'),
      value: 'SHORT_TERM',
    },
  ]);

  readonly reservationDialogOpen = computed(
    () => this.isLoadingReservationProperty() || this.selectedReservationProperty() !== null,
  );

  readonly reservationDialogTitle = computed(() => {
    const property = this.selectedReservationProperty();
    return property
      ? this.translocoService.translate('tenantApplications.marketplace.reservePropertyTitle', {
          title: property.title,
        })
      : this.translocoService.translate('tenantApplications.marketplace.reserveStay');
  });

  readonly shortTermUnits = computed<CatalogUnit[]>(() =>
    (this.selectedReservationProperty()?.units ?? []).filter(
      (unit) =>
        this.supportsShortTermType(unit.rental_type) && Number(unit.price_per_night ?? 0) > 0,
    ),
  );

  readonly shortTermUnitOptions = computed<readonly AppSelectOption<number>[]>(() =>
    this.shortTermUnits().map((unit) => ({
      value: unit.id,
      label: this.translocoService.translate('tenantApplications.marketplace.unitOption', {
        unit: unit.unit_number,
        price: unit.price_per_night ?? 0,
      }),
    })),
  );

  readonly selectedReservationUnit = computed<CatalogUnit | null>(() => {
    const selectedId = this.selectedReservationUnitId();
    return (
      this.shortTermUnits().find((unit) => unit.id === selectedId) ??
      this.shortTermUnits()[0] ??
      null
    );
  });

  readonly detailDialogOpen = computed(
    () => this.isLoadingDetailProperty() || this.selectedDetailProperty() !== null,
  );

  readonly detailDialogTitle = computed(() => this.selectedDetailProperty()?.title ?? '');

  readonly detailImages = computed<string[]>(() => {
    const property = this.selectedDetailProperty();
    return property ? this.extractImages(property) : [];
  });

  readonly detailCurrentImage = computed<string | null>(() => {
    const images = this.detailImages();
    if (images.length === 0) return null;
    const index = Math.min(this.detailImageIndex(), images.length - 1);
    return images[index];
  });

  initialize(): void {
    this.loadProperties();
    this.openReservationIntentionIfAny();
  }

  filteredProperties(): Property[] {
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

  paginatedProperties(): Property[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredProperties().slice(start, start + this.pageSize());
  }

  totalPages(): number {
    return Math.ceil(this.filteredProperties().length / this.pageSize());
  }

  loadProperties(): void {
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

  resetPage(): void {
    this.currentPage.set(0);
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      propertyType: 'ALL',
      rentalMode: 'ALL',
      sort: 'created_at',
    };
    this.currentPage.set(0);
  }

  previousPage(): void {
    this.currentPage.update((page) => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages() - 1, page + 1));
  }

  applyLongTerm(property: Property): void {
    if (!this.supportsLongTerm(property)) {
      this.toast.error(
        this.translocoService.translate('tenantApplications.marketplace.longTermUnavailable'),
      );
      return;
    }

    this.slugService.navigateTo(['portal', 'application-wizard', property.id.toString()]);
  }

  reserveShortTerm(property: Property): void {
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
        this.toast.error(
          this.translocoService.translate('tenantApplications.marketplace.loadAvailabilityError'),
        );
      },
    });
  }

  closeReservationDialog(): void {
    this.isLoadingReservationProperty.set(false);
    this.selectedReservationProperty.set(null);
    this.selectedReservationUnitId.set(null);
    this.initialReservationCheckin.set(null);
    this.initialReservationCheckout.set(null);
    this.reservationIntentionService.clearIntention();
  }

  openDetails(property: Property): void {
    this.detailImageIndex.set(0);
    this.isLoadingDetailProperty.set(true);
    this.selectedDetailProperty.set(null);

    this.propertyService.getPropertyById(property.id).subscribe({
      next: (detail) => {
        this.isLoadingDetailProperty.set(false);
        this.selectedDetailProperty.set(detail ?? property);
      },
      error: () => {
        this.isLoadingDetailProperty.set(false);
        // Fallback al resumen del listado para no dejar el diálogo vacío.
        this.selectedDetailProperty.set(property);
      },
    });
  }

  closeDetails(): void {
    this.isLoadingDetailProperty.set(false);
    this.selectedDetailProperty.set(null);
    this.detailImageIndex.set(0);
  }

  nextDetailImage(): void {
    const total = this.detailImages().length;
    if (total === 0) return;
    this.detailImageIndex.update((index) => (index + 1) % total);
  }

  previousDetailImage(): void {
    const total = this.detailImages().length;
    if (total === 0) return;
    this.detailImageIndex.update((index) => (index - 1 + total) % total);
  }

  selectDetailImage(index: number): void {
    this.detailImageIndex.set(index);
  }

  applyLongTermFromDetail(): void {
    const property = this.selectedDetailProperty();
    if (!property) return;
    this.closeDetails();
    this.applyLongTerm(property);
  }

  reserveShortTermFromDetail(): void {
    const property = this.selectedDetailProperty();
    if (!property) return;
    this.closeDetails();
    this.reserveShortTerm(property);
  }

  cardImage(property: Property): string {
    return this.extractImages(property)[0] ?? '';
  }

  supportsLongTerm(property: Property): boolean {
    const type = this.normalizeRentalType(property.rental_type);
    return !type || type === 'LONG_TERM' || type === 'BOTH';
  }

  supportsShortTerm(property: Property): boolean {
    const type = this.normalizeRentalType(property.rental_type);
    return type === 'SHORT_TERM' || type === 'BOTH';
  }

  rentalModeLabel(property: Property): string {
    const type = this.normalizeRentalType(property.rental_type);
    if (type === 'SHORT_TERM') {
      return this.translocoService.translate('tenantApplications.marketplace.rentalModeShort');
    }
    if (type === 'LONG_TERM') {
      return this.translocoService.translate('tenantApplications.marketplace.rentalModeLong');
    }
    if (type === 'BOTH') {
      return this.translocoService.translate('tenantApplications.marketplace.rentalModeBoth');
    }
    return this.translocoService.translate('tenantApplications.marketplace.rentalModeLong');
  }

  getShortTermPrice(property: Property): number {
    if (Number(property.min_price_per_night ?? 0) > 0) {
      return Number(property.min_price_per_night);
    }

    const unitPrice = (property.units ?? [])
      .filter((unit) => this.supportsShortTermType(unit.rental_type))
      .map((unit) => Number(unit.price_per_night ?? 0))
      .filter((price) => price > 0)
      .sort((a, b) => a - b)[0];

    return unitPrice ?? 0;
  }

  private extractImages(property: Property): string[] {
    const raw = property.images;
    let paths: string[] = [];

    if (Array.isArray(raw)) {
      paths = raw;
    } else if (raw && typeof raw === 'object') {
      paths = Object.values(raw);
    }

    if (property.first_image && !paths.includes(property.first_image)) {
      paths = [property.first_image, ...paths];
    }

    return paths.map((path) => this.buildImageUrl(path)).filter((url) => url !== '');
  }

  private buildImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.imageBaseUrl}${normalized}`;
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
          this.toast.error(
            this.translocoService.translate('tenantApplications.marketplace.restorePropertyError'),
          );
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
        this.toast.error(
          this.translocoService.translate('tenantApplications.marketplace.restoreReservationError'),
        );
        this.reservationIntentionService.clearIntention();
      },
    });
  }

  private sortProperties(properties: Property[]): Property[] {
    return [...properties].sort((a, b) => {
      if (this.filters.sort === 'price_asc') {
        return this.getComparablePrice(a) - this.getComparablePrice(b);
      }
      if (this.filters.sort === 'price_desc') {
        return this.getComparablePrice(b) - this.getComparablePrice(a);
      }
      if (this.filters.sort === 'area') {
        return Number(b.square_meters || 0) - Number(a.square_meters || 0);
      }

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }

  private getComparablePrice(property: Property): number {
    if (this.filters.rentalMode === 'SHORT_TERM') {
      return this.getShortTermPrice(property);
    }

    const monthlyPrice = Number(property.monthly_rent ?? property.monthly_rent_amount ?? 0);
    if (this.filters.rentalMode === 'LONG_TERM') return monthlyPrice;

    const shortPrice = this.getShortTermPrice(property);
    if (monthlyPrice > 0 && shortPrice > 0) return Math.min(monthlyPrice, shortPrice);
    return monthlyPrice || shortPrice;
  }
}
