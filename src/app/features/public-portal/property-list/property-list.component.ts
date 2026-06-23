import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { Home, LucideAngularModule, Map, Search, X } from 'lucide-angular';
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
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';
import { PublicPropertyCardComponent } from '../components/property-card/property-card.component';
import { PropertyMapComponent } from '../property-map/property-map.component';

type RentalTypeValue = 'any' | 'short_term' | 'long_term';

// Valor centinela para "Cualquiera" en el select de dormitorios (app-select no admite null).
const ANY_BEDROOMS = 0;

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppSelectComponent,
    PublicPropertyCardComponent,
    PropertyMapComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyListComponent {
  readonly Search = Search;
  readonly Home = Home;
  readonly X = X;
  readonly Map = Map;

  readonly skeletonItems = Array(6).fill(0);

  readonly filteredProperties = signal<Property[]>([]);
  readonly favorites = signal<Set<number>>(new Set());
  readonly isLoading = signal(true);
  // El backend falló al cargar (distinto de "sin resultados").
  readonly loadError = signal(false);

  readonly search = signal('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly bedrooms = signal<number | null>(null);
  readonly rentalType = signal<RentalTypeValue>('any');
  readonly sortBy = signal<SortOption>(SortOption.CREATED_AT);
  readonly ANY_BEDROOMS = ANY_BEDROOMS;

  // Modal del mapa de propiedades.
  readonly mapOpen = signal(false);

  // Disparador con debounce para auto-aplicar al escribir/seleccionar (sin botón Aplicar)
  private readonly filterChange$ = new Subject<void>();

  private readonly slugService = inject(SlugService);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  // Tic reactivo: events$ emite al cargar el scope y al cambiar de idioma, para
  // recomputar las etiquetas (app-select no usa el pipe transloco, traducimos en TS).
  private readonly i18nTick = toSignal(this.transloco.events$, { initialValue: null });

  /** Traduce leyendo i18nTick primero para recomputar cuando el scope termina de cargar. */
  private t(key: string): string {
    this.i18nTick();
    return this.transloco.translate(`public.${key}`);
  }

  // Opciones para app-select (etiquetas ya traducidas)
  readonly sortSelectOptions = computed<AppSelectOption<SortOption>[]>(() => [
    { value: SortOption.CREATED_AT, label: this.t('properties.sortLatest') },
    { value: SortOption.TITLE, label: this.t('properties.sortTitleAZ') },
  ]);

  readonly bedroomSelectOptions = computed<AppSelectOption<number>[]>(() => [
    { value: ANY_BEDROOMS, label: this.t('properties.anyOption') },
    ...[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}+` })),
  ]);

  readonly rentalTypeSelectOptions = computed<AppSelectOption<RentalTypeValue>[]>(() => [
    { value: 'any', label: this.t('properties.rentalAny') },
    { value: 'short_term', label: this.t('properties.rentalShort') },
    { value: 'long_term', label: this.t('properties.rentalLong') },
  ]);

  constructor() {
    this.propertyService.favorites$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((favs) => this.favorites.set(favs));

    // Auto-aplicar filtros con un pequeño debounce para no disparar una petición por tecla
    this.filterChange$
      .pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadProperties());

    // Bloquea el scroll del fondo mientras el modal del mapa está abierto.
    effect(() => {
      document.body.style.overflow = this.mapOpen() ? 'hidden' : '';
    });
    this.destroyRef.onDestroy(() => (document.body.style.overflow = ''));

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
      min_price: this.minPrice() ?? undefined,
      max_price: this.maxPrice() ?? undefined,
      bedrooms: this.bedrooms() ?? undefined,
      rental_type: this.rentalType(),
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
          this.loadError.set(result.error ?? false);
          this.filteredProperties.set(result.items);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  /** Aplica inmediatamente (botón Buscar / Enter / limpiar). */
  applyFilters(): void {
    this.loadProperties();
  }

  /** Auto-aplica con debounce (barra de filtros siempre visible). */
  onFilterChange(): void {
    this.filterChange$.next();
  }

  hasActiveFilters(): boolean {
    return (
      !!this.search() ||
      this.minPrice() !== null ||
      this.maxPrice() !== null ||
      this.bedrooms() !== null ||
      this.rentalType() !== 'any'
    );
  }

  clearFilters(): void {
    this.search.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.bedrooms.set(null);
    this.rentalType.set('any');
    this.sortBy.set(SortOption.CREATED_AT);
    this.loadProperties();
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  /** Lee un input numérico devolviendo null si está vacío (no 0, para no filtrar de más). */
  numberValue(event: Event): number | null {
    const raw = event.target instanceof HTMLInputElement ? event.target.value : '';
    if (raw === '') {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  onBedroomsChange(value: number): void {
    this.bedrooms.set(value === ANY_BEDROOMS ? null : value);
    this.onFilterChange();
  }

  onRentalTypeChange(value: RentalTypeValue): void {
    this.rentalType.set(value);
    this.onFilterChange();
  }

  onSortChange(value: SortOption): void {
    this.sortBy.set(value);
    this.applyFilters();
  }

  toggleFavorite(propertyId: number): void {
    this.propertyService.toggleFavorite(propertyId);
  }

  isFavorite(propertyId: number): boolean {
    return this.favorites().has(propertyId);
  }

  openMap(): void {
    this.mapOpen.set(true);
  }

  closeMap(): void {
    this.mapOpen.set(false);
  }

  viewProperty(propertyId: number): void {
    const slug = this.slugService.getSlug();
    if (slug) {
      void this.router.navigate(['/', slug, 'publico', 'propiedades', propertyId]);
    } else {
      void this.router.navigate([propertyId], { relativeTo: this.route });
    }
  }
}
