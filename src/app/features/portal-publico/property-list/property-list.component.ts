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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import {
  LucideAngularModule,
  Heart,
  MapPin,
  Search,
  Settings,
  Home,
  Maximize,
  X,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  PropertyType,
  PropertySubtype,
  SortOption,
} from '../../../core/models/property.model';

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
    MatPaginatorModule,
    MatChipsModule,
    MatIconModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css'],
})
export class PropertyListComponent implements OnInit {
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  totalResultsCount = 0;
  favorites = new Set<number>();
  isLoading = true;

  propertyTypes: PropertyType[] = [];
  propertySubtypes: PropertySubtype[] = [];

  filters: PropertyFilters = {
    search: '',
    status: undefined,
    property_type_id: undefined,
    property_subtype_id: undefined,
    city: '',
    country: '',
    min_price: undefined,
    max_price: undefined,
    bedrooms: undefined,
    sort_by: 'newest',
    sort_order: 'DESC',
    rental_type: 'any',
    page: 1,
    limit: 20,
  };

  sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'price_asc', label: 'Precio más bajo' },
    { value: 'price_desc', label: 'Precio más alto' },
    { value: 'available', label: 'Disponibilidad' },
  ];

  showFilters = false;
  propertyImagesIndex: { [propertyId: number]: number } = {};

  // Lucide icons
  readonly Heart = Heart;
  readonly MapPin = MapPin;
  readonly Search = Search;
  readonly Settings = Settings;
  readonly Home = Home;
  readonly Maximize = Maximize;
  readonly X = X;

  private slugService = inject(SlugService);
  private translocoService = inject(TranslocoService);

  constructor(
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.waitForSlugAndLoadProperties();
  }

  private waitForSlugAndLoadProperties(): void {
    // Intento 1: Desde el servicio (si ya está)
    let slug = this.slugService.getSlug();

    // Intento 2: Desde la URL directamente (lo más fiable)
    if (!slug) {
      const pathParts = window.location.pathname.split('/');
      // En /inmobiliaria-prueba/publico/propiedades, el slug es el primer segmento
      slug = pathParts[1];
    }

    if (slug && slug !== 'publico') {
      console.log('PropertyListComponent - Slug detectado:', slug);
      this.slugService.setSlug(slug);

      // Resetear filtros para asegurar visibilidad total inicial
      this.filters = {
        ...this.filters,
        status: undefined,
        search: '',
        property_type_id: undefined,
        property_subtype_id: undefined,
      };

      this.loadProperties();
    } else {
      // Intento 3: Suscripción reactiva como último recurso
      this.route.paramMap.subscribe((params) => {
        const s = params.get('slug') || this.route.snapshot.parent?.paramMap.get('slug');
        if (s) {
          this.slugService.setSlug(s);
          this.loadProperties();
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
      },
    });
  }

  loadProperties(): void {
    this.isLoading = true;

    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.applyLocalFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Favorites handling
  loadFavorites(): void {
    this.propertyService.favorites$.subscribe((favorites) => {
      this.favorites = favorites;
    });
  }

  applyFilters(): void {
    this.applyLocalFilters();
  }

  applyLocalFilters(): void {
    let filtered = [...this.properties];

    // Búsqueda por texto
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search),
      );
    }

    // Tipo de Alquiler
    if (this.filters.rental_type && this.filters.rental_type !== 'any') {
      filtered = filtered.filter((p: any) => p.rental_type === this.filters.rental_type);
    }

    // Precio mínimo
    if (this.filters.min_price) {
      filtered = filtered.filter((p) => {
        const price = p.monthly_rent || p.monthly_rent_amount || 0;
        return price >= this.filters.min_price!;
      });
    }

    // Precio máximo
    if (this.filters.max_price) {
      filtered = filtered.filter((p) => {
        const price = p.monthly_rent || p.monthly_rent_amount || 0;
        return price <= this.filters.max_price!;
      });
    }

    // Habitaciones
    if (this.filters.bedrooms) {
      filtered = filtered.filter((p) => p.bedrooms === this.filters.bedrooms);
    }

    this.filteredProperties = filtered;
    this.totalResultsCount = filtered.length;
  }

  onPageChange(event: PageEvent): void {
    this.filters.page = event.pageIndex + 1;
    this.filters.limit = event.pageSize;
    this.applyFilters();
  }

  onSortChange(): void {
    if (this.filters.sort_by === SortOption.PRICE) {
      // Toggle logic if we wanted, or assume default. Let's rely on radio/select order for now.
      // Actually, the user can select 'ASC' or 'DESC' elsewhere or we create compound options.
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: PropertyStatus.DISPONIBLE,
      property_type_id: undefined,
      property_subtype_id: undefined,
      city: '',
      country: '',
      min_price: undefined,
      max_price: undefined,
      bedrooms: undefined,
      sort_by: SortOption.CREATED_AT,
      sort_order: 'DESC',
      rental_type: 'any',
      page: 1,
      limit: 20,
    };
    this.loadProperties();
  }

  // Paginación
  get totalResults(): number {
    return this.totalResultsCount;
  }

  get visibleResultsStart(): number {
    return (this.filters.page! - 1) * this.filters.limit! + 1;
  }

  get visibleResultsEnd(): number {
    const end = this.filters.page! * this.filters.limit!;
    return end > this.totalResults ? this.totalResults : end;
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

  viewProperty(property: any): void {
    const slug = this.slugService.getSlug();
    const propSlug = property.slug || property.id;
    if (slug) {
      this.router.navigate(['/', slug, 'publico', 'propiedades', propSlug]);
    } else {
      this.router.navigate([propSlug], { relativeTo: this.route });
    }
  }

  goToMap(): void {
    const slug = this.slugService.getSlug();
    if (slug) {
      this.router.navigate(['/', slug, 'publico', 'mapa']);
    }
  }

  getPropertyLocation(property: Property): string {
    if (property.addresses && property.addresses.length > 0) {
      const address = property.addresses[0];
      return `${address.city}, ${address.country}`;
    }
    return 'public.properties.locationNotAvailable';
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
    const index = this.propertyImagesIndex[property.id] || 0;

    if (property.images && Array.isArray(property.images) && property.images.length > index) {
      imagePath = property.images[index];
    } else if (
      property.images &&
      typeof property.images === 'object' &&
      Object.keys(property.images).length > index
    ) {
      const keys = Object.keys(property.images);
      imagePath = (property.images as any)[keys[index]];
    } else if (property.first_image && index === 0) {
      imagePath = property.first_image;
    }

    if (imagePath) {
      if (imagePath.startsWith('http')) return imagePath;
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `http://localhost:3000${normalizedPath}`;
    }

    return '';
  }

  hasMultipleImages(property: Property): boolean {
    if (property.images && Array.isArray(property.images)) {
      return property.images.length > 1;
    }
    if (property.images && typeof property.images === 'object') {
      return Object.keys(property.images).length > 1;
    }
    return false;
  }

  nextImage(event: Event, property: Property): void {
    event.stopPropagation();
    const current = this.propertyImagesIndex[property.id] || 0;
    const length = Array.isArray(property.images)
      ? property.images.length
      : property.images
        ? Object.keys(property.images).length
        : 1;
    this.propertyImagesIndex[property.id] = (current + 1) % length;
  }

  prevImage(event: Event, property: Property): void {
    event.stopPropagation();
    const current = this.propertyImagesIndex[property.id] || 0;
    const length = Array.isArray(property.images)
      ? property.images.length
      : property.images
        ? Object.keys(property.images).length
        : 1;
    this.propertyImagesIndex[property.id] = (current - 1 + length) % length;
  }

  handleImageError(event: any): void {
    const text = this.translocoService.translate('public.properties.noImage');
    event.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="260"%3E%3Crect width="400" height="260" fill="%23dbeafe"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="15" fill="%2393c5fd"%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
  }
}
