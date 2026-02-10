import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // No cargar types desde admin en portal público - requiere autenticación
    // this.loadPropertyTypes();
    this.loadProperties();
    this.loadFavorites();
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
    this.router.navigate([propertyId], { relativeTo: this.route });
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
}
