import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    page: 1,
    limit: 20,
  };

  sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'price_asc', label: 'Precio: Menor a Mayor' },
    { value: 'price_desc', label: 'Precio: Mayor a Menor' },
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
        property_subtype_id: undefined
      };
      
      this.loadProperties();
    } else {
      // Intento 3: Suscripción reactiva como último recurso
      this.route.paramMap.subscribe(params => {
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

  private http = inject(HttpClient);

  private buildHttpParams(): any {
    const params: any = {};
    if (this.filters.search) params.search = this.filters.search;
    
    // Mapear ID de tipo al código que espera el backend
    if (this.filters.property_type_id) {
      const type = this.propertyTypes.find(t => t.id === this.filters.property_type_id);
      if (type) {
        params.type = type.code || type.name.toLowerCase();
      }
    }
    if (this.filters.min_price !== undefined && this.filters.min_price !== null && (this.filters.min_price as any) !== '') {
      params.min_price = Number(this.filters.min_price);
    }
    if (this.filters.max_price !== undefined && this.filters.max_price !== null && (this.filters.max_price as any) !== '') {
      params.max_price = Number(this.filters.max_price);
    }
    if (this.filters.bedrooms !== undefined && this.filters.bedrooms !== null && (this.filters.bedrooms as any) !== '') {
      params.bedrooms = Number(this.filters.bedrooms);
    }
    if (this.filters.city) params.city = this.filters.city;
    if (this.filters.status) params.status = this.filters.status;
    
    // Sort mapping
    if (this.filters.sort_by) {
      params.sort = this.filters.sort_by;
    }
    
    return params;
  }

  loadProperties(): void {
    this.isLoading = true;
    
    const slug = this.slugService.getSlug();
    const url = `http://localhost:3000/${slug}/catalog/properties`;
    const params = this.buildHttpParams();
    
    this.http.get<any>(url, { params }).subscribe({
      next: (result: any) => {
        const items = result.data || result.items || (Array.isArray(result) ? result : []);
        
        // Filtro de seguridad local ultra-robusto (con logs para depuración interna)
        const filtered = items.filter((p: any) => {
          // Robust parse for price
          let propertyPrice = 0;
          const rawPrice = p.monthly_rent || p.monthly_rent_amount || p.price;
          if (typeof rawPrice === 'string') {
            propertyPrice = Number(rawPrice.replace(/[^0-9.]/g, ''));
          } else if (typeof rawPrice === 'number') {
            propertyPrice = rawPrice;
          }
          
          const propertyRooms = Number(p.bedrooms || p.rooms || 0);
          
          // Max price filter
          if (this.filters.max_price !== undefined && this.filters.max_price !== null && (this.filters.max_price as any) !== '') {
            if (propertyPrice > Number(this.filters.max_price)) return false;
          }

          // Min price filter
          if (this.filters.min_price !== undefined && this.filters.min_price !== null && (this.filters.min_price as any) !== '') {
            if (propertyPrice < Number(this.filters.min_price)) return false;
          }

          // Bedrooms filter
          if (this.filters.bedrooms !== undefined && this.filters.bedrooms !== null && (this.filters.bedrooms as any) !== '') {
            if (propertyRooms !== Number(this.filters.bedrooms)) return false;
          }
          
          // Search filter (Local fallback)
          if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            const titleMatch = p.title?.toLowerCase().includes(searchLower);
            const descMatch = p.description?.toLowerCase().includes(searchLower);
            const addressMatch = p.addresses?.some((a: any) => a.street_address?.toLowerCase().includes(searchLower));
            const cityMatch = p.city?.toLowerCase().includes(searchLower);
            
            if (!titleMatch && !descMatch && !addressMatch && !cityMatch) {
              return false;
            }
          }
          
          return true;
        });

        // Crear una NUEVA referencia de array para forzar la actualización de Angular
        const mappedResults = filtered.map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images.map((img: string) => 
            img.startsWith('http') ? img : `http://localhost:3000${img.startsWith('/') ? '' : '/'}${img}`
          ) : []
        }));

        this.filteredProperties = [...mappedResults];
        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error en carga directa:', error);
        // Reintentar con el servicio si falla el directo
        this.propertyService.getProperties().subscribe({
          next: (items: Property[]) => {
            this.filteredProperties = items;
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            console.error('Error loading properties via service:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // Favorites handling
  loadFavorites(): void {
    this.propertyService.favorites$.subscribe((favorites) => {
      this.favorites = favorites;
    });
  }

  applyFilters(): void {
    this.loadProperties();
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
      page: 1,
      limit: 20,
    };
    this.loadProperties();
  }

  // Paginación
  get totalResults(): number {
    return this.filteredProperties.length;
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
