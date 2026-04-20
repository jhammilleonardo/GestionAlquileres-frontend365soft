import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  LucideAngularModule,
  MapPin,
  Home,
  Heart,
  Share2,
  Maximize,
  Bed,
  Bath,
  Car,
  User,
  Mail,
  Phone,
  MessageSquare,
  PhoneCall,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationIntentionService } from '../../../core/services/tenant/application-intention.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { Property } from '../../../core/models/property.model';
import { ApplicationModalComponent } from '../application-modal/application-modal.component';
import { ContactModalComponent } from '../contact-modal/contact-modal.component';
import { MapModalComponent } from '../map-modal/map-modal.component';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    ApplicationModalComponent,
    ContactModalComponent,
    MapModalComponent,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.css'],
})
export class PropertyDetailComponent implements OnInit, OnDestroy {
  readonly MapPin = MapPin;
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

  property: Property | null = null;
  currentImageIndex = 0;
  isLoading = true;
  hasError = false;
  isFavorite = false;
  showApplicationModal = false;
  showContactModal = false;
  showMapModal = false;

  private slugService = inject(SlugService);
  private router = inject(Router);
  private intentionService = inject(ApplicationIntentionService);
  private authService = inject(TenantAuthService);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
  ) {}

  ngOnInit(): void {
    this.loadPropertyFromRoute();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadPropertyFromRoute(): void {
    // With paramsInheritanceStrategy: 'always' (set in app.config.ts),
    // the slug from the parent ':slug' route is accessible here directly.
    const sub = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.isLoading = true;
          this.hasError = false;
          this.property = null;
          this.cdr.detectChanges();

          // Get slug from inherited params (paramsInheritanceStrategy: 'always')
          let slug = params.get('slug');

          // Fallback 1: traverse parent routes
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

          // Fallback 2: parse from router URL directly
          if (!slug) {
            const urlParts = this.router.url.split('/').filter(Boolean);
            if (urlParts.length > 0) slug = urlParts[0];
          }

          // Set slug in service if found
          if (slug) {
            this.slugService.setSlug(slug);
          }

          const idStr = params.get('id');
          const propertyId = idStr ? parseInt(idStr, 10) : NaN;

          if (isNaN(propertyId)) {
            this.isLoading = false;
            this.hasError = true;
            this.cdr.detectChanges();
            return of(undefined);
          }

          this.checkFavoriteStatus(propertyId);
          return this.propertyService.getPropertyById(propertyId);
        }),
      )
      .subscribe({
        next: (property) => {
          this.property = property || null;
          this.isLoading = false;
          this.hasError = !this.property;
          this.cdr.detectChanges();
        },
        error: () => {
          this.property = null;
          this.isLoading = false;
          this.hasError = true;
          this.cdr.detectChanges();
        },
      });

    this.subscriptions.push(sub);
  }
  checkFavoriteStatus(propertyId: number): void {
    this.propertyService.isFavorite(propertyId).subscribe((isFav) => {
      this.isFavorite = isFav;
      this.cdr.detectChanges();
    });
  }

  // Helper para obtener imágenes como array seguro (con URL completa)
  getImagesArray(): string[] {
    if (!this.property?.images) return [];
    const raw = Array.isArray(this.property.images) ? this.property.images : [];
    return raw.map((img) => this.buildImageUrl(img));
  }

  // Helper para verificar si tiene múltiples imágenes
  hasMultipleImages(): boolean {
    return this.getImagesArray().length > 1;
  }

  // Helper para obtener imagen actual (con URL completa)
  getCurrentImage(): string {
    const images = this.getImagesArray();
    return images[this.currentImageIndex] || '';
  }

  // Helper para obtener cantidad de imágenes
  getImagesCount(): number {
    return this.getImagesArray().length;
  }

  /** Construye la URL completa de una imagen del backend */
  private buildImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `http://localhost:3000${normalized}`;
  }

  toggleFavorite(): void {
    if (this.property) {
      this.propertyService.toggleFavorite(this.property.id);
      this.isFavorite = !this.isFavorite;
    }
  }

  nextImage(): void {
    const images = this.getImagesArray();
    if (images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
    }
  }

  previousImage(): void {
    const images = this.getImagesArray();
    if (images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  openApplicationModal(): void {
    console.log('🔘 Botón "Quiero Aplicar" clickeado');
    console.log('Property:', this.property);

    if (this.property) {
      const slug = this.slugService.getSlug();

      // Verificar si el usuario está autenticado como inquilino
      const isTenantAuthenticated = this.authService.isAuthenticated();

      if (isTenantAuthenticated) {
        // Usuario autenticado -> Ir directamente al formulario
        console.log('✅ Usuario autenticado, navegando al formulario');
        this.intentionService.setIntention(this.property.id, this.property.title);
        if (slug) {
          this.intentionService.navigateToApplication(slug);
        }
      } else {
        // Usuario NO autenticado -> Guardar intención y ir a login
        console.log('🔐 Usuario no autenticado, navegando al login con intención');
        if (slug) {
          this.intentionService.navigateToLoginWithIntention(
            slug,
            this.property.id,
            this.property.title,
          );
        }
      }
    } else {
      console.warn('⚠️ No hay property cargada');
    }
  }

  closeApplicationModal(): void {
    this.showApplicationModal = false;
  }

  openContactModal(): void {
    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
  }

  openMapModal(): void {
    this.showMapModal = true;
  }

  closeMapModal(): void {
    this.showMapModal = false;
  }

  shareProperty(): void {
    if (navigator.share && this.property) {
      navigator
        .share({
          title: this.property.title,
          text: `Mira esta propiedad: ${this.property.title}`,
          url: window.location.href,
        })
        .catch((err) => console.log('Error sharing:', err));
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  }

  printProperty(): void {
    window.print();
  }

  // Helper methods para adaptar el formato del backend
  getPropertyAddress(): string {
    if (this.property?.addresses && this.property.addresses.length > 0) {
      const addr = this.property.addresses[0];
      return `${addr.street_address}, ${addr.city}${addr.state ? ', ' + addr.state : ''}`;
    }
    return 'public.properties.locationNotAvailable';
  }

  getLocationForMap(): any {
    if (this.property?.latitude && this.property?.longitude) {
      return {
        coordinates: {
          lat: this.property.latitude,
          lng: this.property.longitude,
        },
        address: this.getPropertyAddress(),
      };
    }
    return null;
  }

  getOwnerName(): string {
    if (this.property?.owners && this.property.owners.length > 0) {
      return this.property.owners[0].name;
    }
    return 'No disponible';
  }

  getOwnerEmail(): string {
    if (this.property?.owners && this.property.owners.length > 0) {
      return this.property.owners[0].primary_email;
    }
    return '';
  }

  getOwnerPhone(): string {
    if (this.property?.owners && this.property.owners.length > 0) {
      return this.property.owners[0].phone_number;
    }
    return '';
  }

  getPropertyTypeName(): string {
    return this.property?.property_type?.name || 'N/A';
  }

  getPropertySubtypeName(): string {
    return this.property?.property_subtype?.name || '';
  }
}
