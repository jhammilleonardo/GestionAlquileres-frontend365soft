import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule, MatChipSet } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, Heart, MapPin, Search, Settings, Home, Maximize, X } from 'lucide-angular';
import { PropertyService } from '../../../core/services/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { Property, PropertyFilters, PropertyStatus, PropertyType, PropertySubtype, SortOption } from '../../../core/models/property.model';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    LucideAngularModule
  ],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css']
})
export class PropertyListComponent implements OnInit {
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  favorites = new Set<number>();
  isLoading = true;

  propertyTypes: PropertyType[] = [];
  propertySubtypes: PropertySubtype[] = [];

  filters: PropertyFilters = {
    search: '',
    status: PropertyStatus.DISPONIBLE,
    property_type_id: undefined,
    property_subtype_id: undefined,
    city: '',
    country: '',
    sort_by: SortOption.CREATED_AT,
    sort_order: 'DESC',
    page: 1,
    limit: 20
  };

  sortOptions = [
    { value: SortOption.CREATED_AT, label: 'Más Recientes' },
    { value: SortOption.TITLE, label: 'Título A-Z' }
  ];

  showFilters = false;

  // Lucide icons
  readonly Heart = Heart;
  readonly MapPin = MapPin;
  readonly Search = Search;
  readonly Settings = Settings;
  readonly Home = Home;
  readonly Maximize = Maximize;
  readonly X = X;

  private slugService = inject(SlugService);

  constructor(
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // No cargar types desde admin en portal público - requiere autenticación
    // this.loadPropertyTypes();
    this.loadFavorites();

    // Wait for slug to be set before loading properties
    this.waitForSlugAndLoadProperties();
  }

  /**
   * Wait for the slug to be set in SlugService before loading properties
   * This fixes the race condition where properties are loaded before the slug is available
   */
  private waitForSlugAndLoadProperties(): void {
    const slug = this.slugService.getSlug();

    if (slug) {
      // Slug is already set, load properties immediately
      console.log('PropertyListComponent - Slug ya disponible:', slug);
      this.loadProperties();
    } else {
      // Slug not set yet, get it from the route and set it
      console.log('PropertyListComponent - Esperando slug de la ruta...');
      this.route.parent?.paramMap.subscribe(params => {
        const slugFromRoute = params.get('slug');
        if (slugFromRoute) {
          console.log('PropertyListComponent - Slug obtenido de ruta:', slugFromRoute);
          this.slugService.setSlug(slugFromRoute);
          // Wait a small amount for the slug to be set in the service
          setTimeout(() => {
            this.loadProperties();
          }, 100);
        }
      });
    }
  }

  loadPropertyTypes(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (types) => {
        this.propertyTypes = types;
      },
      error: (error) => {
        console.error('Error loading property types:', error);
      }
    });
  }

  loadProperties(): void {
    this.isLoading = true;
    this.propertyService.getFilteredProperties(this.filters).subscribe({
      next: (properties) => {
        this.filteredProperties = properties;
        this.isLoading = false;
        // Forzar detección de cambios para actualizar la vista
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadFavorites(): void {
    this.propertyService.favorites$.subscribe(favorites => {
      this.favorites = favorites;
    });
  }

  applyFilters(): void {
    this.loadProperties();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: PropertyStatus.DISPONIBLE,
      property_type_id: undefined,
      property_subtype_id: undefined,
      city: '',
      country: '',
      sort_by: SortOption.CREATED_AT,
      sort_order: 'DESC',
      page: 1,
      limit: 20
    };
    this.loadProperties();
  }

  toggleFavorite(propertyId: number, event: Event): void {
    event.stopPropagation();
    this.propertyService.toggleFavorite(propertyId);
  }

  isFavorite(propertyId: number): boolean {
    return this.favorites.has(propertyId);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  viewProperty(propertyId: number): void {
    const slug = this.slugService.getSlug();
    if (slug) {
      this.router.navigate(['/', slug, 'publico', 'propiedades', propertyId]);
    } else {
      this.router.navigate([propertyId], { relativeTo: this.route });
    }
  }

  getPropertyLocation(property: Property): string {
    if (property.addresses && property.addresses.length > 0) {
      const address = property.addresses[0];
      return `${address.city}, ${address.country}`;
    }
    return 'Ubicación no disponible';
  }

  getPropertyAddress(property: Property): string {
    if (property.addresses && property.addresses.length > 0) {
      return property.addresses[0].street_address;
    }
    return '';
  }

  /**
   * Construye la URL completa de imagen de una propiedad.
   * Las imágenes vienen del backend como rutas relativas (e.g. /uploads/...).
   * Se agrega el host del backend para que el browser pueda cargarlas.
   */
  getPropertyImageUrl(property: Property): string {
    let imagePath: string | null = null;

    if (property.first_image) {
      imagePath = property.first_image;
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      imagePath = property.images[0] as string;
    }

    if (imagePath) {
      if (imagePath.startsWith('http')) return imagePath;
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `http://localhost:3000${normalizedPath}`;
    }

    return '';
  }
}
