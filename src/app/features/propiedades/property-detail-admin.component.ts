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
  CreditCard,
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
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { PropertyService } from '../../core/services/admin/property.service';
import { SlugService } from '../../core/services/slug.service';
import { Property } from '../../core/models/property.model';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { PropertyUnitsComponent } from './property-units/property-units.component';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
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
  readonly CreditCard = CreditCard;
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
  currentImageIndex = signal(0);
  isLoading = signal(true);
  slug = signal('');
  activeTab: PropertyDetailTab = 'information';
  readonly tabs: AppTabOption<PropertyDetailTab>[] = [
    { label: 'Informacion', value: 'information' },
    { label: 'Unidades', value: 'units' },
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly slugService = inject(SlugService);
  private readonly toast = inject(ToastService);

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
        } else {
          this.toast.error('Propiedad no encontrada');
          this.goBack();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la propiedad');
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
    const imagePath = images[index] || '';

    if (imagePath && !imagePath.startsWith('http')) {
      return `http://localhost:3000/${imagePath}`;
    }
    return imagePath;
  }

  getThumbnailUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000/${imagePath}`;
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
    this.router.navigate([`/${slug}/propiedades`]);
  }

  editProperty(): void {
    const slug = this.slugService.getSlug() || '';
    this.router.navigate([`/${slug}/propiedades`], { queryParams: { edit: this.property()?.id } });
  }

  getPropertyAddress(): string {
    const prop = this.property();
    if (prop?.addresses && prop.addresses.length > 0) {
      const addr = prop.addresses[0];
      return `${addr.street_address}, ${addr.city}, ${addr.country}`;
    }
    return 'Sin dirección';
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
}
