import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Bath,
  Bed,
  Car,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  LucideAngularModule,
  Mail,
  MapPin,
  Star,
  Maximize,
  MessageSquare,
  Phone,
  PhoneCall,
  Share2,
  User,
  X,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { PropertyService } from '../../../core/services/admin/property.service';
import { ReservationService, PropertyRating } from '../../../core/services/reservation.service';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationIntentionService } from '../../../core/services/tenant/application-intention.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { resolveMediaUrl } from '../../../core/utils/media-url.util';
import { PublicBrandingService } from '../../../core/services/public-branding.service';
import { Property } from '../../../core/models/property.model';
import { ApplicationModalComponent } from '../application-modal/application-modal.component';
import { ContactModalComponent } from '../contact-modal/contact-modal.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { AvailabilityCalendarComponent } from '../availability-calendar/availability-calendar.component';
import { AppLocationMapComponent } from '../../../shared/ui/location-map/location-map.component';

interface PropertyLocation {
  coordinates: { lat: number; lng: number };
  address: string;
}

interface PublicPriceDisplay {
  amount: number;
  labelKey: string;
}

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [
    RouterModule,
    DatePipe,
    DecimalPipe,
    LucideAngularModule,
    ApplicationModalComponent,
    ContactModalComponent,
    MapModalComponent,
    AvailabilityCalendarComponent,
    AppLocationMapComponent,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailComponent {
  readonly MapPin = MapPin;
  readonly Star = Star;
  readonly Home = Home;
  readonly Heart = Heart;
  readonly Share2 = Share2;
  readonly Maximize = Maximize;
  readonly Bed = Bed;
  readonly Bath = Bath;
  readonly Car = Car;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MessageSquare = MessageSquare;
  readonly PhoneCall = PhoneCall;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly X = X;

  readonly property = signal<Property | null>(null);
  readonly rating = signal<PropertyRating | null>(null);

  /** Primera unidad de alquiler corto plazo con precio configurado (para el calendario). */
  readonly shortTermUnit = computed(() =>
    (this.property()?.units ?? []).find(
      (u) => this.supportsShortTerm(u.rental_type) && Number(u.price_per_night ?? 0) > 0,
    ),
  );

  readonly currentImageIndex = signal(0);
  readonly showLightbox = signal(false);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly isFavorite = signal(false);
  readonly showApplicationModal = signal(false);
  readonly showContactModal = signal(false);
  readonly showMapModal = signal(false);

  private readonly slugService = inject(SlugService);
  private readonly brandingService = inject(PublicBrandingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(PropertyService);
  private readonly reservationService = inject(ReservationService);
  private readonly intentionService = inject(ApplicationIntentionService);
  private readonly authService = inject(TenantAuthService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  private supportsShortTerm(type: string | null | undefined): boolean {
    const normalized = (type ?? '').toUpperCase();
    return normalized === 'SHORT_TERM' || normalized === 'BOTH';
  }

  protected supportsLongTermProperty(property: Property): boolean {
    const normalized = (property.rental_type ?? '').toUpperCase();
    return !normalized || normalized === 'LONG_TERM' || normalized === 'BOTH';
  }

  protected getPriceDisplay(property: Property): PublicPriceDisplay | null {
    if (this.hasShortTermPrice(property)) {
      return {
        amount: property.min_price_per_night ?? 0,
        labelKey: 'public.propertyDetail.perNight',
      };
    }

    const monthlyRent = property.monthly_rent ?? property.monthly_rent_amount;
    if (!monthlyRent) return null;

    return {
      amount: monthlyRent,
      labelKey: 'public.propertyDetail.perMonth',
    };
  }

  protected hasShortTermPrice(property: Property): boolean {
    const normalized = (property.rental_type ?? '').toUpperCase();
    return (
      (normalized === 'SHORT_TERM' || normalized === 'BOTH') &&
      Number(property.min_price_per_night ?? 0) > 0
    );
  }

  constructor() {
    this.loadPropertyFromRoute();
  }

  private loadPropertyFromRoute(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.isLoading.set(true);
          this.hasError.set(false);
          this.property.set(null);

          let slug = params.get('slug');
          if (!slug) {
            let current: ActivatedRoute | null = this.route;
            while (current) {
              const s = current.snapshot.paramMap.get('slug');
              if (s) {
                slug = s;
                break;
              }
              current = current.parent;
            }
          }
          if (!slug) {
            const urlParts = this.router.url.split('/').filter(Boolean);
            if (urlParts.length > 0) slug = urlParts[0];
          }
          if (slug) this.slugService.setSlug(slug);

          const idStr = params.get('id');
          const propertyId = idStr ? parseInt(idStr, 10) : NaN;
          if (isNaN(propertyId)) {
            this.isLoading.set(false);
            this.hasError.set(true);
            return of(undefined);
          }

          this.propertyService
            .isFavorite(propertyId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((isFav) => this.isFavorite.set(isFav));

          // Rating agregado (best-effort: no bloquea la carga del detalle).
          this.reservationService
            .getPropertyRating(propertyId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (rating) => this.rating.set(rating),
              error: () => this.rating.set(null),
            });

          return this.propertyService.getPropertyById(propertyId);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (property) => {
          this.property.set(property ?? null);
          this.isLoading.set(false);
          this.hasError.set(!property);
        },
        error: () => {
          this.property.set(null);
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });
  }

  getImagesArray(): string[] {
    const raw = this.property()?.images;
    if (!Array.isArray(raw)) return [];
    return raw.map((img) => this.buildImageUrl(img));
  }

  hasMultipleImages(): boolean {
    return this.getImagesArray().length > 1;
  }

  /** Miniaturas visibles en una sola fila. */
  private readonly MAX_THUMBS = 6;

  /** Primeras N imágenes que se muestran como miniaturas. */
  getVisibleThumbs(): { url: string; index: number }[] {
    return this.getImagesArray()
      .slice(0, this.MAX_THUMBS)
      .map((url, index) => ({ url, index }));
  }

  /** Cantidad de imágenes que no caben en la fila de miniaturas. */
  getExtraThumbsCount(): number {
    return Math.max(0, this.getImagesCount() - this.MAX_THUMBS);
  }

  /** Última miniatura con overlay "+N": abre el visor para recorrer todas. */
  isMoreThumb(index: number): boolean {
    return index === this.MAX_THUMBS - 1 && this.getExtraThumbsCount() > 0;
  }

  onThumbClick(index: number): void {
    if (this.isMoreThumb(index)) {
      this.openLightbox(index);
    } else {
      this.selectImage(index);
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  openLightbox(index: number): void {
    this.currentImageIndex.set(index);
    this.showLightbox.set(true);
  }

  closeLightbox(): void {
    this.showLightbox.set(false);
  }

  getCurrentImage(): string {
    return this.getImagesArray()[this.currentImageIndex()] ?? '';
  }

  getImagesCount(): number {
    return this.getImagesArray().length;
  }

  private buildImageUrl(imagePath: string): string {
    return resolveMediaUrl(imagePath);
  }

  toggleFavorite(): void {
    const prop = this.property();
    if (!prop) return;
    this.propertyService.toggleFavorite(prop.id);
    this.isFavorite.update((v) => !v);
  }

  nextImage(): void {
    const images = this.getImagesArray();
    if (!images.length) return;
    this.currentImageIndex.update((i) => (i + 1) % images.length);
  }

  previousImage(): void {
    const images = this.getImagesArray();
    if (!images.length) return;
    this.currentImageIndex.update((i) => (i - 1 + images.length) % images.length);
  }

  openApplicationModal(): void {
    const prop = this.property();
    if (!prop) return;
    const slug = this.slugService.getSlug();
    if (this.authService.isAuthenticated()) {
      this.intentionService.setIntention(prop.id, prop.title);
      if (slug) this.intentionService.navigateToApplication(slug);
    } else {
      if (slug) {
        this.intentionService.navigateToLoginWithIntention(slug, prop.id, prop.title);
      }
    }
  }

  closeApplicationModal(): void {
    this.showApplicationModal.set(false);
  }
  openContactModal(): void {
    this.showContactModal.set(true);
  }
  closeContactModal(): void {
    this.showContactModal.set(false);
  }
  openMapModal(): void {
    this.showMapModal.set(true);
  }
  closeMapModal(): void {
    this.showMapModal.set(false);
  }

  shareProperty(): void {
    const prop = this.property();
    if (navigator.share && prop) {
      void navigator.share({
        title: prop.title,
        text: `Mira esta propiedad: ${prop.title}`,
        url: window.location.href,
      });
    } else {
      void navigator.clipboard
        .writeText(window.location.href)
        .then(() =>
          this.toast.success(this.transloco.translate('public.propertyDetail.linkCopied')),
        );
    }
  }

  printProperty(): void {
    window.print();
  }

  getPropertyAddress(): string {
    const prop = this.property();
    if (prop?.addresses?.length) {
      const addr = prop.addresses[0];
      return [addr.city, addr.state, addr.country].filter(Boolean).join(', ');
    }
    return '';
  }

  getLocationForMap(): PropertyLocation | null {
    const prop = this.property();
    const lat = this.toNumberOrNull(prop?.latitude);
    const lng = this.toNumberOrNull(prop?.longitude);

    if (lat !== null && lng !== null) {
      return {
        coordinates: { lat, lng },
        address: this.getPropertyAddress(),
      };
    }
    return null;
  }

  getGoogleMapsUrl(): string {
    const location = this.getLocationForMap();
    if (location) {
      const { lat, lng } = location.coordinates;
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      this.getPropertyAddress(),
    )}`;
  }

  getPublicContactName(): string {
    return this.brandingService.branding()?.company_name ?? '';
  }

  getPublicContactEmail(): string {
    return this.brandingService.branding()?.contact_email ?? '';
  }

  getPublicContactPhone(): string {
    return this.brandingService.branding()?.contact_phone ?? '';
  }

  getPropertyTypeName(): string {
    return this.property()?.property_type?.name ?? this.transloco.translate('common.notAvailable');
  }

  getPropertySubtypeName(): string {
    return this.property()?.property_subtype?.name ?? '';
  }

  private toNumberOrNull(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
}
