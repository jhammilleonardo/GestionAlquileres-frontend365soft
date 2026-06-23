import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArrowRight, CheckCircle, Home, LucideAngularModule, Search, Star } from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule } from '@jsverse/transloco';

import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { PublicBrandingService } from '../../../core/services/public-branding.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  SortOption,
} from '../../../core/models/property.model';
import { PublicPropertyCardComponent } from '../components/property-card/property-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule, PublicPropertyCardComponent],
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

  readonly featuredProperties = signal<Property[]>([]);
  readonly isLoadingProperties = signal(true);
  readonly favorites = signal<Set<number>>(new Set());

  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly slugService = inject(SlugService);
  private readonly brandingService = inject(PublicBrandingService);
  private readonly destroyRef = inject(DestroyRef);

  // Título/subtítulo/imagen del hero personalizados por el tenant (con fallback a i18n)
  readonly heroTitle = computed(() => this.brandingService.branding()?.hero_title || null);
  readonly heroSubtitle = computed(() => this.brandingService.branding()?.hero_subtitle || null);
  readonly heroImage = computed(() => this.brandingService.heroImageUrl());

  // Íconos fijos por posición — el tenant edita texto, el ícono se asigna por orden
  private readonly featureIcons = [CheckCircle, Star, Home];

  // "Features" de inicio personalizadas por el tenant (con fallback a las i18n por defecto)
  readonly features = computed(() =>
    (this.brandingService.branding()?.home_features ?? []).map((f, i) => ({
      icon: this.featureIcons[i % this.featureIcons.length],
      title: f.title,
      description: f.description,
    })),
  );
  readonly hasCustomFeatures = computed(() => this.features().length > 0);

  // Sección CTA final personalizada por el tenant (con fallback a i18n)
  readonly ctaTitle = computed(() => this.brandingService.branding()?.cta_title || null);
  readonly ctaSubtitle = computed(() => this.brandingService.branding()?.cta_subtitle || null);

  constructor() {
    this.loadFeaturedProperties();
    this.propertyService.favorites$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((favs) => this.favorites.set(favs));
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

  isFavorite(propertyId: number): boolean {
    return this.favorites().has(propertyId);
  }

  toggleFavorite(propertyId: number): void {
    this.propertyService.toggleFavorite(propertyId);
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
