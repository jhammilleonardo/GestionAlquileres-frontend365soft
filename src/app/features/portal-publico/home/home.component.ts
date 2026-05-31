import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ArrowRight,
  Bath,
  BedDouble,
  Car,
  CheckCircle,
  Heart,
  Home,
  LucideAngularModule,
  MapPin,
  Maximize,
  Search,
  Star,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule } from '@jsverse/transloco';

import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  SortOption,
} from '../../../core/models/property.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, DecimalPipe, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly Home = Home;
  readonly Search = Search;
  readonly CheckCircle = CheckCircle;
  readonly Star = Star;
  readonly ArrowRight = ArrowRight;
  readonly MapPin = MapPin;
  readonly Maximize = Maximize;
  readonly Heart = Heart;
  readonly BedDouble = BedDouble;
  readonly Bath = Bath;
  readonly Car = Car;

  readonly featuredProperties = signal<Property[]>([]);
  readonly isLoadingProperties = signal(true);

  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly slugService = inject(SlugService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadFeaturedProperties();
  }

  private loadFeaturedProperties(): void {
    const filters: PropertyFilters = {
      status: PropertyStatus.DISPONIBLE,
      sort_by: SortOption.CREATED_AT,
      sort_order: 'DESC',
      page: 1,
      limit: 6,
    };
    this.propertyService
      .getFilteredProperties(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.featuredProperties.set(result.items);
          this.isLoadingProperties.set(false);
        },
        error: () => this.isLoadingProperties.set(false),
      });
  }

  getPropertyImageUrl(property: Property): string {
    let imagePath: string | null = null;
    if (property.first_image) {
      imagePath = property.first_image;
    } else if (Array.isArray(property.images) && property.images.length) {
      imagePath = property.images[0];
    }
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  }

  getPropertyAddress(property: Property): string {
    if (property.addresses?.length) {
      const addr = property.addresses[0];
      return `${addr.street_address}, ${addr.city}`;
    }
    return 'Dirección no disponible';
  }

  viewProperty(propertyId: number): void {
    const slug = this.slugService.getSlug();
    if (slug) void this.router.navigate(['/', slug, 'publico', 'propiedades', propertyId]);
  }

  navigateToProperties(): void {
    const slug = this.slugService.getSlug();
    if (slug) void this.router.navigate(['/', slug, 'publico', 'propiedades']);
  }

  navigateToContact(): void {
    const slug = this.slugService.getSlug();
    if (slug) void this.router.navigate(['/', slug, 'publico', 'contacto']);
  }

  navigateToAbout(): void {
    const slug = this.slugService.getSlug();
    if (slug) void this.router.navigate(['/', slug, 'publico', 'nosotros']);
  }
}
