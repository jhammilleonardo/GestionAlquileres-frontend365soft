import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Heart,
  Home,
  LucideAngularModule,
  MapPin,
  Maximize,
  Search,
  Settings,
  X,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  SortOption,
} from '../../../core/models/property.model';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    RouterModule,
    DecimalPipe,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppLoadingStateComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyListComponent {
  readonly Heart = Heart;
  readonly MapPin = MapPin;
  readonly Search = Search;
  readonly Settings = Settings;
  readonly Home = Home;
  readonly Maximize = Maximize;
  readonly X = X;

  readonly filteredProperties = signal<Property[]>([]);
  readonly favorites = signal<Set<number>>(new Set());
  readonly isLoading = signal(true);
  readonly showFilters = signal(false);

  readonly search = signal('');
  readonly city = signal('');
  readonly country = signal('');
  readonly sortBy = signal<SortOption>(SortOption.CREATED_AT);

  private readonly slugService = inject(SlugService);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sortOptions = [
    { value: SortOption.CREATED_AT, label: 'public.properties.sortLatest' },
    { value: SortOption.TITLE, label: 'public.properties.sortTitleAZ' },
  ];

  constructor() {
    this.propertyService.favorites$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((favs) => this.favorites.set(favs));

    this.initSlugAndLoad();
  }

  private initSlugAndLoad(): void {
    const slug = this.slugService.getSlug();
    if (slug) {
      this.loadProperties();
    } else {
      this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        const slugFromRoute = params.get('slug');
        if (slugFromRoute) {
          this.slugService.setSlug(slugFromRoute);
          setTimeout(() => this.loadProperties(), 100);
        }
      });
    }
  }

  loadProperties(): void {
    this.isLoading.set(true);
    const filters: PropertyFilters = {
      search: this.search(),
      status: PropertyStatus.DISPONIBLE,
      city: this.city(),
      country: this.country(),
      sort_by: this.sortBy(),
      sort_order: 'DESC',
      page: 1,
      limit: 20,
    };
    this.propertyService
      .getFilteredProperties(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.filteredProperties.set(result.items);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  applyFilters(): void {
    this.loadProperties();
  }

  clearFilters(): void {
    this.search.set('');
    this.city.set('');
    this.country.set('');
    this.sortBy.set(SortOption.CREATED_AT);
    this.loadProperties();
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  setSortFromEvent(event: Event): void {
    const value =
      event.target instanceof HTMLSelectElement
        ? (event.target.value as SortOption)
        : SortOption.CREATED_AT;
    this.sortBy.set(value);
    this.applyFilters();
  }

  toggleFavorite(propertyId: number, event: Event): void {
    event.stopPropagation();
    this.propertyService.toggleFavorite(propertyId);
  }

  isFavorite(propertyId: number): boolean {
    return this.favorites().has(propertyId);
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  viewProperty(propertyId: number): void {
    const slug = this.slugService.getSlug();
    if (slug) {
      void this.router.navigate(['/', slug, 'publico', 'propiedades', propertyId]);
    } else {
      void this.router.navigate([propertyId], { relativeTo: this.route });
    }
  }

  getPropertyLocation(property: Property): string {
    if (property.addresses?.length) {
      const addr = property.addresses[0];
      return `${addr.city}, ${addr.country}`;
    }
    return '';
  }

  getPropertyAddress(property: Property): string {
    return property.addresses?.[0]?.street_address ?? '';
  }

  getPropertyImageUrl(property: Property): string {
    const imagePath = property.first_image ?? property.images?.[0] ?? null;
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  }

  handleImageError(event: Event): void {
    const text = this.translocoService.translate('public.properties.noImage');
    const target = event.target as HTMLImageElement;
    target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="260"%3E%3Crect width="400" height="260" fill="%23dbeafe"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="15" fill="%2393c5fd"%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
  }
}
