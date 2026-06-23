import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Pencil,
  MapPin,
  DollarSign,
  Maximize2,
  BedDouble,
  Bath,
  Car,
  Calendar,
  CheckCircle2,
  XCircle,
  Home,
  PawPrint,
  Users,
  Package,
  Image as LucideImage,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  Building2,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { PropertyService } from '../../core/services/admin/property.service';
import { GeocodingService } from '../../core/services/geocoding.service';
import { SlugService } from '../../core/services/slug.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { Property } from '../../core/models/property.model';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { PropertyUnitsComponent } from './property-units/property-units.component';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppLocationMapComponent } from '../../shared/ui/location-map/location-map.component';
import { AppTabsComponent, AppTabOption } from '../../shared/ui/tabs/tabs.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

type PropertyDetailTab = 'information' | 'units';

@Component({
  selector: 'app-property-detail-admin',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    TenantCurrencyPipe,
    PropertyUnitsComponent,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppLocationMapComponent,
    AppTabsComponent,
  ],
  templateUrl: './property-detail-admin.component.html',
  styleUrls: ['./property-detail-admin.component.scss'],
  providers: [provideTranslocoScope({ scope: 'propiedades', alias: 'properties' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailAdminComponent {
  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Pencil = Pencil;
  readonly MapPin = MapPin;
  readonly DollarSign = DollarSign;
  readonly Maximize2 = Maximize2;
  readonly BedDouble = BedDouble;
  readonly Bath = Bath;
  readonly Car = Car;
  readonly Calendar = Calendar;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Home = Home;
  readonly PawPrint = PawPrint;
  readonly Users = Users;
  readonly Package = Package;
  readonly LucideImage = LucideImage;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly FileText = FileText;
  readonly Shield = Shield;
  readonly Building2 = Building2;

  property = signal<Property | null>(null);
  mapLocation = signal<{ lat: number; lng: number } | null>(null);
  currentImageIndex = signal(0);
  isLoading = signal(true);
  slug = signal('');
  activeTab: PropertyDetailTab = 'information';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly geocoding = inject(GeocodingService);
  private readonly slugService = inject(SlugService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  get tabs(): AppTabOption<PropertyDetailTab>[] {
    return [
      { label: this.transloco.translate('properties.units.infoTabLabel'), value: 'information' },
      { label: this.transloco.translate('properties.units.tabLabel'), value: 'units' },
    ];
  }

  constructor() {
    this.slug.set(this.slugService.getSlug() ?? '');
    const propertyIdStr = this.route.snapshot.paramMap.get('id');
    if (propertyIdStr) {
      const propertyId = parseInt(propertyIdStr, 10);
      this.loadPropertyDetail(propertyId);
    }
  }

  loadPropertyDetail(id: number): void {
    this.isLoading.set(true);
    this.propertyService.getAdminPropertyById(id).subscribe({
      next: (property) => {
        if (property) {
          this.property.set(property);
          void this.resolveMapLocation(property);
        } else {
          this.toast.error(this.transloco.translate('properties.actions.notFound'));
          this.goBack();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error(this.transloco.translate('properties.actions.loadDetailError'));
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  getImagesArray(): string[] {
    const prop = this.property();
    if (!prop?.images) return [];
    if (Array.isArray(prop.images)) return prop.images;
    return [];
  }

  getCurrentImage(): string {
    const images = this.getImagesArray();
    const index = this.currentImageIndex();
    return resolveMediaUrl(images[index] || '');
  }

  getThumbnailUrl(imagePath: string): string {
    return resolveMediaUrl(imagePath);
  }

  nextImage(): void {
    const images = this.getImagesArray();
    if (images.length > 0) {
      this.currentImageIndex.set((this.currentImageIndex() + 1) % images.length);
    }
  }

  previousImage(): void {
    const images = this.getImagesArray();
    if (images.length > 0) {
      const newIndex = (this.currentImageIndex() - 1 + images.length) % images.length;
      this.currentImageIndex.set(newIndex);
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  goBack(): void {
    const slug = this.slugService.getSlug() || '';
    void this.router.navigate([`/${slug}/propiedades`]);
  }

  editProperty(): void {
    const slug = this.slugService.getSlug() || '';
    void this.router.navigate([`/${slug}/propiedades`], {
      queryParams: { edit: this.property()?.id },
    });
  }

  getPropertyAddress(): string {
    const prop = this.property();
    if (prop?.addresses && prop.addresses.length > 0) {
      const addr = prop.addresses[0];
      return `${addr.street_address}, ${addr.city}, ${addr.country}`;
    }
    return this.transloco.translate('common.notAvailable');
  }

  propertyMapLocation(): { lat: number; lng: number } | null {
    return this.mapLocation();
  }

  getStatusClass(): string {
    const status = this.property()?.status;
    if (!status) return 'status-default';

    const classes: Record<string, string> = {
      DISPONIBLE: 'status-disponible',
      OCUPADO: 'status-ocupado',
      MANTENIMIENTO: 'status-mantenimiento',
      RESERVADO: 'status-reservado',
      INACTIVO: 'status-inactivo',
    };
    return classes[status] || 'status-default';
  }

  private toNumberOrNull(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private async resolveMapLocation(property: Property): Promise<void> {
    const lat = this.toNumberOrNull(property.latitude);
    const lng = this.toNumberOrNull(property.longitude);

    if (lat !== null && lng !== null) {
      this.mapLocation.set({ lat, lng });
      return;
    }

    const address = this.addressParts(property).join(', ');
    if (!address) {
      this.mapLocation.set(null);
      return;
    }

    const [result] = await this.geocoding.search({
      query: address,
      limit: 1,
      country: property.addresses?.[0]?.country,
    });
    const fallbackLat = this.toNumberOrNull(result?.lat);
    const fallbackLng = this.toNumberOrNull(result?.lon);

    this.mapLocation.set(
      fallbackLat !== null && fallbackLng !== null ? { lat: fallbackLat, lng: fallbackLng } : null,
    );
  }

  private addressParts(property: Property): string[] {
    const address = property.addresses?.[0];
    if (!address) return [];

    return [address.street_address, address.city, address.state, address.country].filter(
      (part): part is string => !!part && part.trim().length > 0,
    );
  }
}
