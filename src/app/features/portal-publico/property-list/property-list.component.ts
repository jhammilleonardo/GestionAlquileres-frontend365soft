import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property, PropertyFilters, PropertyStatus, PropertyType, PropertySubtype, SortOption } from '../../../core/models/property.model';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPropertyTypes();
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
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.isLoading = false;
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
    this.router.navigate(['/publico/propiedades', propertyId]);
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
