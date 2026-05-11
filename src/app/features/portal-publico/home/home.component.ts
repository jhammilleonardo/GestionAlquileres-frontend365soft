import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  LucideAngularModule,
  Home,
  Search,
  CheckCircle,
  Star,
  ArrowRight,
  MapPin,
  Maximize,
  Heart,
  BedDouble,
  Bath,
  Car,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
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
  imports: [CommonModule, RouterModule, MatButtonModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
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

  featuredProperties: Property[] = [];
  isLoadingProperties = true;

  private router = inject(Router);
  public propertyService = inject(PropertyService);
  private slugService = inject(SlugService);

  ngOnInit(): void {
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
    this.propertyService.getFilteredProperties(filters).subscribe({
      next: (result) => {
        this.featuredProperties = result.items;
        this.isLoadingProperties = false;
      },
      error: () => {
        this.isLoadingProperties = false;
      },
    });
  }

  getPropertyImageUrl(property: Property): string {
    return this.propertyService.getPropertyImageUrl(property);
  }

  getPropertyAddress(property: Property): string {
    return this.propertyService.getPropertyAddress(property);
  }

  viewProperty(propertyId: number): void {
    const slug = this.slugService.getSlug();
    if (slug) {
      this.router.navigate(['/', slug, 'publico', 'propiedades', propertyId]);
    }
  }

  navigateToProperties() {
    const slug = this.slugService.getSlug();
    if (slug) {
      this.router.navigate(['/', slug, 'publico', 'propiedades']);
    }
  }

  navigateToContact() {
    const slug = this.slugService.getSlug();
    if (slug) {
      this.router.navigate(['/', slug, 'publico', 'contacto']);
    }
  }

  navigateToAbout() {
    const slug = this.slugService.getSlug();
    if (slug) {
      this.router.navigate(['/', slug, 'publico', 'nosotros']);
    }
  }
}
