import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { SlugService } from '../../../core/services/slug.service';
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
    ApplicationModalComponent,
    ContactModalComponent,
    MapModalComponent
  ],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.css']
})
export class PropertyDetailComponent implements OnInit {
  property: Property | null = null;
  currentImageIndex = 0;
  isLoading = true;
  isFavorite = false;
  showApplicationModal = false;
  showContactModal = false;
  showMapModal = false;

  private slugService = inject(SlugService);

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService
  ) { }

  ngOnInit(): void {
    // Wait for slug to be set before loading property details
    this.waitForSlugAndLoadProperty();
  }

  /**
   * Wait for the slug to be set in SlugService before loading property details
   * This fixes the race condition where property details are loaded before the slug is available
   */
  private waitForSlugAndLoadProperty(): void {
    const slug = this.slugService.getSlug();
    
    if (slug) {
      // Slug is already set, load property immediately
      console.log('PropertyDetailComponent - Slug ya disponible:', slug);
      this.loadPropertyById();
    } else {
      // Slug not set yet, get it from the route and set it
      console.log('PropertyDetailComponent - Esperando slug de la ruta...');
      this.route.parent?.paramMap.subscribe(params => {
        const slugFromRoute = params.get('slug');
        if (slugFromRoute) {
          console.log('PropertyDetailComponent - Slug obtenido de ruta:', slugFromRoute);
          this.slugService.setSlug(slugFromRoute);
          // Wait a small amount for the slug to be set in the service
          setTimeout(() => {
            this.loadPropertyById();
          }, 100);
        }
      });
    }
  }

  private loadPropertyById(): void {
    const propertyIdStr = this.route.snapshot.paramMap.get('id');
    if (propertyIdStr) {
      const propertyId = parseInt(propertyIdStr, 10);
      this.loadProperty(propertyId);
      this.checkFavoriteStatus(propertyId);
    }
  }
  // Helper para obtener imágenes como array seguro
  getImagesArray(): string[] {
    if (!this.property?.images) return [];
    if (Array.isArray(this.property.images)) return this.property.images;
    return [];
  }

  // Helper para verificar si tiene múltiples imágenes
  hasMultipleImages(): boolean {
    return this.getImagesArray().length > 1;
  }

  // Helper para obtener imagen actual
  getCurrentImage(): string {
    const images = this.getImagesArray();
    return images[this.currentImageIndex] || '';
  }

  // Helper para obtener cantidad de imágenes
  getImagesCount(): number {
    return this.getImagesArray().length;
  }
  loadProperty(id: number): void {
    this.isLoading = true;
    this.propertyService.getPropertyById(id).subscribe({
      next: (property) => {
        console.log('Property loaded:', property);
        this.property = property || null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading property:', error);
        this.property = null;
        this.isLoading = false;
      }
    });
  }

  checkFavoriteStatus(propertyId: number): void {
    this.propertyService.isFavorite(propertyId).subscribe(isFav => {
      this.isFavorite = isFav;
    });
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
    this.showApplicationModal = true;
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
      navigator.share({
        title: this.property.title,
        text: `Mira esta propiedad: ${this.property.title}`,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
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
    return 'Dirección no disponible';
  }

  getLocationForMap(): any {
    if (this.property?.latitude && this.property?.longitude) {
      return {
        coordinates: {
          lat: this.property.latitude,
          lng: this.property.longitude
        },
        address: this.getPropertyAddress()
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
