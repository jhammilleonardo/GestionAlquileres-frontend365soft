import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  LucideAngularModule,
  Home,
  Search,
  MapPin,
  DollarSign,
  Users,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-angular';
import { PropertyService } from '../../../core/services/admin/property.service';
import { Property, PropertyStatus, PropertyFilters } from '../../../core/models/property.model';
import { SlugService } from '../../../core/services/slug.service';

@Component({
  selector: 'app-new-application',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    LucideAngularModule,
  ],
  template: `
    <div class="new-application">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <lucide-icon [img]="SlidersHorizontal" [size]="28"></lucide-icon>
          </div>
          <div class="header-text">
            <h1>Nueva Solicitud de Alquiler</h1>
            <p class="subtitle">Selecciona una propiedad para enviar tu solicitud</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-row">
          <div class="filter-group search-group">
            <lucide-icon [img]="Search" [size]="20"></lucide-icon>
            <input
              type="text"
              placeholder="Buscar por título, ciudad o dirección..."
              [value]="filters().search"
              (input)="updateFilter('search', $any($event.target).value)"
              class="search-input"
            />
          </div>

          <div class="filter-group">
            <mat-select
              placeholder="Tipo de propiedad"
              [value]="filters().property_type_id"
              (selectionChange)="updateFilter('property_type_id', $event.value)"
              class="filter-select"
            >
              <mat-option [value]="null">Todos los tipos</mat-option>
              @for (type of propertyTypes(); track type) {
                <mat-option [value]="type">{{ type }}</mat-option>
              }
            </mat-select>
          </div>

          <div class="filter-group">
            <mat-select
              placeholder="Ordenar por"
              [value]="filters().sort_by"
              (selectionChange)="updateFilter('sort_by', $event.value)"
              class="filter-select"
            >
              <mat-option value="created_at">Más recientes</mat-option>
              <mat-option value="price_asc">Precio: Menor a Mayor</mat-option>
              <mat-option value="price_desc">Precio: Mayor a Menor</mat-option>
              <mat-option value="area">Área: Mayor a Menor</mat-option>
            </mat-select>
          </div>
        </div>
      </div>

      <!-- Properties Grid -->
      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Cargando propiedades disponibles...</p>
        </div>
      } @else if (filteredProperties().length === 0) {
        <div class="empty-state">
          <lucide-icon [img]="Home" [size]="64" class="empty-icon"></lucide-icon>
          <h3>No se encontraron propiedades</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
          <button mat-raised-button color="primary" (click)="clearFilters()">
            Limpiar Filtros
          </button>
        </div>
      } @else {
        <div class="properties-grid">
          @for (property of paginatedProperties(); track property.id) {
            <mat-card class="property-card" (click)="selectProperty(property)">
              <div class="property-image">
                @if (property.first_image) {
                  <img [src]="property.first_image" [alt]="property.title" />
                } @else {
                  <div class="image-placeholder">
                    <lucide-icon [img]="Home" [size]="48"></lucide-icon>
                  </div>
                }
                <div class="property-price">
                  <span class="price-amount">\${{ property.monthly_rent }}</span>
                  <span class="price-period">/mes</span>
                </div>
              </div>

              <div class="property-content">
                <h3 class="property-title">{{ property.title }}</h3>

                <div class="property-location">
                  <lucide-icon [img]="MapPin" [size]="16"></lucide-icon>
                  <span
                    >{{ property.addresses?.[0]?.city }},
                    {{ property.addresses?.[0]?.country }}</span
                  >
                </div>

                <div class="property-features">
                  @if (property.bedrooms) {
                    <div class="feature">
                      <lucide-icon [img]="Bed" [size]="16"></lucide-icon>
                      <span
                        >{{ property.bedrooms }}
                        {{ property.bedrooms === 1 ? 'Dorm' : 'Dorms' }}</span
                      >
                    </div>
                  }
                  @if (property.bathrooms) {
                    <div class="feature">
                      <lucide-icon [img]="Bath" [size]="16"></lucide-icon>
                      <span
                        >{{ property.bathrooms }}
                        {{ property.bathrooms === 1 ? 'Baño' : 'Baños' }}</span
                      >
                    </div>
                  }
                  @if (property.square_meters) {
                    <div class="feature">
                      <lucide-icon [img]="Maximize" [size]="16"></lucide-icon>
                      <span>{{ property.square_meters }}m²</span>
                    </div>
                  }
                  @if (property.property_rules && property.property_rules.max_occupants) {
                    <div class="feature">
                      <lucide-icon [img]="Users" [size]="16"></lucide-icon>
                      <span>{{ property.property_rules.max_occupants }} pers.</span>
                    </div>
                  }
                </div>

                <button
                  mat-flat-button
                  color="primary"
                  class="apply-btn"
                  (click)="$event.stopPropagation(); selectProperty(property)"
                >
                  Aplicar
                  <lucide-icon [img]="ArrowRight" [size]="16"></lucide-icon>
                </button>
              </div>
            </mat-card>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination-section">
            <mat-paginator
              [length]="filteredProperties().length"
              [pageSize]="pageSize()"
              [pageIndex]="currentPage()"
              [showFirstLastButtons]="true"
              (page)="onPageChange($event)"
              label="Propiedades"
            >
            </mat-paginator>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .new-application {
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px;
      }

      .page-header {
        margin-bottom: 32px;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-icon {
        width: 56px;
        height: 56px;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-text h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
      }

      .subtitle {
        margin: 4px 0 0;
        font-size: 1rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .filters-section {
        background: var(--mat-sys-surface-container-low);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 32px;
        border: 1px solid var(--mat-sys-outline-variant);
      }

      .filter-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .filter-group {
        flex: 1;
        min-width: 200px;
      }

      .search-group {
        flex: 2;
        min-width: 280px;
        position: relative;
        display: flex;
        align-items: center;
        background: var(--mat-sys-surface);
        border-radius: 8px;
        border: 1px solid var(--mat-sys-outline);
        padding: 0 16px;
      }

      .search-group lucide-icon {
        color: var(--mat-sys-on-surface-variant);
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 12px 8px;
        font-size: 0.9375rem;
        color: var(--mat-sys-on-surface);
        outline: none;
      }

      .search-input::placeholder {
        color: var(--mat-sys-on-surface-variant);
      }

      .filter-select {
        width: 100%;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 64px 24px;
        color: var(--mat-sys-on-surface-variant);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 64px 24px;
        text-align: center;
      }

      .empty-icon {
        color: var(--mat-sys-outline-variant);
        opacity: 0.3;
      }

      .empty-state h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .empty-state p {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .properties-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
      }

      .property-card {
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid var(--mat-sys-outline-variant);
        overflow: hidden;
      }

      .property-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: var(--mat-sys-primary);
      }

      .property-image {
        position: relative;
        width: 100%;
        height: 200px;
        overflow: hidden;
        background: var(--mat-sys-surface-container-low);
      }

      .property-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--mat-sys-outline-variant);
      }

      .property-price {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        backdrop-filter: blur(10px);
      }

      .price-amount {
        font-size: 1.125rem;
        font-weight: 700;
        line-height: 1;
      }

      .price-period {
        font-size: 0.75rem;
        opacity: 0.8;
      }

      .property-content {
        padding: 16px;
      }

      .property-title {
        margin: 0 0 8px;
        font-size: 1.0625rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .property-location {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 12px;
      }

      .property-location lucide-icon {
        flex-shrink: 0;
      }

      .property-features {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 16px;
      }

      .feature {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .feature lucide-icon {
        flex-shrink: 0;
      }

      .apply-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: 40px;
        font-weight: 600;
        border-radius: 8px;
      }

      .pagination-section {
        display: flex;
        justify-content: center;
        padding: 24px 0;
      }

      @media (max-width: 768px) {
        .new-application {
          padding: 16px;
        }

        .filter-row {
          flex-direction: column;
        }

        .filter-group {
          min-width: 100%;
        }

        .search-group {
          min-width: 100%;
        }

        .properties-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }
    `,
  ],
})
export class NewApplicationComponent implements OnInit {
  readonly Home = Home;
  readonly Search = Search;
  readonly MapPin = MapPin;
  readonly DollarSign = DollarSign;
  readonly Users = Users;
  readonly Bed = Bed;
  readonly Bath = Bath;
  readonly Maximize = Maximize;
  readonly ArrowRight = ArrowRight;
  readonly SlidersHorizontal = SlidersHorizontal;

  private router = inject(Router);
  private slugService = inject(SlugService);
  private propertyService = inject(PropertyService);

  // Signals - Managing state locally
  isLoading = signal(false);
  allProperties = signal<Property[]>([]);

  // Filter state
  filters = signal<PropertyFilters>({
    status: PropertyStatus.DISPONIBLE,
    search: '',
    property_type_id: undefined,
    sort_by: 'created_at' as any,
    sort_order: 'DESC' as 'ASC' | 'DESC',
  });

  // Pagination
  currentPage = signal(0);
  pageSize = signal(12);

  // Computed properties
  filteredProperties = computed(() => {
    const props = this.allProperties();
    const search = this.filters().search?.toLowerCase() || '';

    if (!search) return props;

    return props.filter(
      (p: Property) =>
        p.title.toLowerCase().includes(search) ||
        p.addresses?.[0]?.city.toLowerCase().includes(search) ||
        p.addresses?.[0]?.street_address.toLowerCase().includes(search),
    );
  });

  paginatedProperties = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredProperties().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredProperties().length / this.pageSize()));

  propertyTypes = signal<string[]>(['Apartamento', 'Casa', 'Estudio', 'Loft', 'Penthouse']);

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.propertyService.getProperties().subscribe({
      next: (props) => {
        this.allProperties.set(props);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  updateFilter(key: keyof PropertyFilters, value: any): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.currentPage.set(0);
    this.loadProperties();
  }

  clearFilters(): void {
    this.filters.set({
      status: PropertyStatus.DISPONIBLE,
      search: '',
      property_type_id: undefined,
      sort_by: 'created_at' as any,
      sort_order: 'DESC' as 'ASC' | 'DESC',
    });
    this.currentPage.set(0);
    this.loadProperties();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  selectProperty(property: Property): void {
    this.slugService.navigateTo(['portal', 'application-wizard', property.id.toString()]);
  }
}
