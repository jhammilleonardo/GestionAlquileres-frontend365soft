import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  Layers,
  List,
  LocateFixed,
  LucideAngularModule,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import * as L from 'leaflet';

import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { GeocodingService } from '../../../core/services/geocoding.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  SortOption,
} from '../../../core/models/property.model';
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';

type RentalTypeValue = 'any' | 'short_term' | 'long_term';

/** Sugerencia de ubicación derivada del geocoder, lista para el desplegable. */
interface GeoSuggestion {
  label: string;
  lat: number;
  lon: number;
}

// Valor centinela para "Cualquiera" en el select de dormitorios (app-select no admite null).
const ANY_BEDROOMS = 0;

// Máximo de sugerencias de ubicación a mostrar en el autocompletado.
const SUGGESTION_LIMIT = 5;

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [FormsModule, RouterModule, TranslocoModule, LucideAngularModule, AppSelectComponent],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-map.component.html',
  styleUrls: ['./property-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyMapComponent {
  readonly List = List;
  readonly Search = Search;
  readonly X = X;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Layers = Layers;
  readonly LocateFixed = LocateFixed;
  readonly MapPin = MapPin;
  readonly ANY_BEDROOMS = ANY_BEDROOMS;

  readonly properties = signal<Property[]>([]);
  readonly isLoading = signal(true);
  readonly zoneNotFound = signal(false);
  // Total real devuelto por el backend (puede superar lo mostrado por el límite).
  readonly total = signal(0);
  // Propiedades del resultado sin coordenadas (no se pueden dibujar en el mapa).
  readonly missingLocationCount = signal(0);
  // El backend devolvió error al cargar propiedades (distinto de "sin resultados").
  readonly loadError = signal(false);
  // Autocompletado de ubicaciones.
  readonly suggestions = signal<GeoSuggestion[]>([]);
  // Geolocalización del usuario.
  readonly isLocatingMe = signal(false);
  readonly geoError = signal(false);
  // Filtros colapsables: ocultos por defecto, se abren con el botón de filtros.
  readonly filtersExpanded = signal(false);
  readonly isSatellite = signal(false);

  // Modo modal: muestra botón "Cerrar" en vez del enlace "Ver en lista".
  readonly inModal = input(false);
  readonly closed = output<void>();

  readonly search = signal('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly bedrooms = signal<number | null>(null);
  readonly rentalType = signal<RentalTypeValue>('any');

  private map?: L.Map;
  private markers: L.Marker[] = [];
  private streetLayer?: L.TileLayer;
  private satelliteLayer?: L.TileLayer;
  private userMarker?: L.Marker;
  private userCircle?: L.Circle;
  // Corta el spinner si la Geolocation API se cuelga (p. ej. con cert no confiable).
  private locateWatchdog?: ReturnType<typeof setTimeout>;
  private geoWatchId?: number;
  // Cuando el usuario centra manualmente (su ubicación o una sugerencia), no
  // dejamos que el reencuadre automático de propiedades le mueva el mapa.
  private manualCenter = false;
  // Cancela la petición de autocompletado en vuelo al teclear de nuevo o al destruir.
  private suggestAbort?: AbortController;

  // Disparador con debounce para auto-aplicar filtros al cambiar selects/inputs.
  private readonly filterChange$ = new Subject<void>();
  // Texto del buscador con debounce para el autocompletado de ubicaciones.
  private readonly searchInput$ = new Subject<string>();

  public readonly propertyService = inject(PropertyService);
  public readonly slugService = inject(SlugService);
  private readonly geocoding = inject(GeocodingService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  // Tic reactivo: recomputa las etiquetas de app-select al cargar el scope y al cambiar idioma.
  private readonly i18nTick = toSignal(this.transloco.events$, { initialValue: null });

  private t(key: string): string {
    this.i18nTick();
    return this.transloco.translate(`public.${key}`);
  }

  readonly bedroomSelectOptions = computed<AppSelectOption<number>[]>(() => [
    { value: ANY_BEDROOMS, label: this.t('properties.anyOption') },
    ...[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}+` })),
  ]);

  readonly rentalTypeSelectOptions = computed<AppSelectOption<RentalTypeValue>[]>(() => [
    { value: 'any', label: this.t('properties.rentalAny') },
    { value: 'short_term', label: this.t('properties.rentalShort') },
    { value: 'long_term', label: this.t('properties.rentalLong') },
  ]);

  /**
   * Aviso informativo de cobertura: combina "se truncó el listado" y "hay
   * propiedades sin ubicación". Devuelve null cuando no hay nada que avisar.
   */
  readonly coverageMessage = computed<string | null>(() => {
    this.i18nTick();
    if (this.loadError() || this.isLoading()) {
      return null;
    }
    const shown = this.properties().length;
    const parts: string[] = [];
    if (this.total() > shown) {
      parts.push(
        this.transloco.translate('public.map.partialNotice', { shown, total: this.total() }),
      );
    }
    if (this.missingLocationCount() > 0) {
      parts.push(
        this.transloco.translate('public.map.noLocationNotice', {
          count: this.missingLocationCount(),
        }),
      );
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  });

  constructor() {
    this.filterChange$
      .pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadProperties());

    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => void this.fetchSuggestions(query));

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.locateWatchdog);
      this.stopWatching();
      this.suggestAbort?.abort();
      this.map?.remove();
    });

    // El contenedor #map-container ya está en el DOM tras el primer render.
    afterNextRender(() => {
      this.initMap();
      this.loadProperties();
      // Como Google Maps: intenta centrar en el usuario al abrir (silencioso).
      this.autoLocate();
    });
  }

  private initMap(): void {
    // Vista por defecto: regional amplia (Américas). No se fija una ciudad
    // concreta para no insinuar una ubicación errónea; se reencuadra a las
    // propiedades al cargarlas o a la ubicación real del usuario si la concede.
    const center: L.LatLngExpression = [-17, -64];
    // Zoom en la esquina inferior para no quedar tapado por el buscador flotante.
    this.map = L.map('map-container', { zoomControl: false }).setView(center, 5);
    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

    // Capa "mapa" estilo claro (CartoDB Voyager) y capa "satélite" (Esri), gratuitas.
    this.streetLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    );
    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 20,
        attribution: 'Tiles &copy; Esri',
      },
    );
    this.streetLayer.addTo(this.map);

    // El contenedor se dimensiona por layout absoluto; forzar recálculo para que
    // las tiles cubran toda el área visible (evita el mapa "a medias" en móvil/modal).
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  /** Alterna entre vista de mapa y vista satélite. */
  toggleLayer(): void {
    if (!this.map || !this.streetLayer || !this.satelliteLayer) {
      return;
    }
    const toSatellite = !this.isSatellite();
    this.isSatellite.set(toSatellite);
    if (toSatellite) {
      this.streetLayer.remove();
      this.satelliteLayer.addTo(this.map);
    } else {
      this.satelliteLayer.remove();
      this.streetLayer.addTo(this.map);
    }
  }

  loadProperties(): void {
    this.isLoading.set(true);
    // El buscador es de ubicaciones (recentra el mapa), no filtra por palabra clave.
    const filters: PropertyFilters = {
      status: PropertyStatus.DISPONIBLE,
      min_price: this.minPrice() ?? undefined,
      max_price: this.maxPrice() ?? undefined,
      bedrooms: this.bedrooms() ?? undefined,
      rental_type: this.rentalType(),
      sort_by: SortOption.CREATED_AT,
      sort_order: 'DESC',
      page: 1,
      limit: 100,
    };

    this.propertyService
      .getFilteredProperties(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.loadError.set(result.error ?? false);
          this.total.set(result.total);
          this.properties.set(result.items);
          this.isLoading.set(false);
          this.renderMarkers();
        },
        error: () => {
          this.loadError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  /** Auto-aplica filtros con debounce al cambiar inputs/selects. */
  onFilterChange(): void {
    // Al cambiar filtros, libera el centrado manual para reencuadrar a los nuevos resultados.
    this.manualCenter = false;
    this.filterChange$.next();
  }

  /** Cada tecla en el buscador: actualiza el texto y pide sugerencias con debounce. */
  onSearchInput(event: Event): void {
    const value = this.inputValue(event);
    this.search.set(value);
    this.zoneNotFound.set(false);
    this.searchInput$.next(value);
  }

  /** Enter: elige la primera sugerencia disponible. */
  onSearchEnter(): void {
    const first = this.suggestions()[0];
    if (first) {
      this.selectSuggestion(first);
    } else if (this.search().trim()) {
      this.zoneNotFound.set(true);
    }
  }

  /** Oculta el desplegable tras un breve margen para permitir el clic en una opción. */
  onSearchBlur(): void {
    setTimeout(() => this.suggestions.set([]), 150);
  }

  clearSearch(): void {
    this.search.set('');
    this.suggestions.set([]);
    this.zoneNotFound.set(false);
    this.manualCenter = false;
  }

  /** Centra el mapa en la ubicación elegida del autocompletado. */
  selectSuggestion(suggestion: GeoSuggestion): void {
    this.search.set(this.shortLabel(suggestion.label));
    this.suggestions.set([]);
    this.manualCenter = true;
    this.map?.setView([suggestion.lat, suggestion.lon], 14);
  }

  /** Acorta el display_name de Nominatim a las dos primeras partes (ciudad, zona). */
  shortLabel(label: string): string {
    return label.split(',').slice(0, 2).join(', ').trim();
  }

  /** Consulta el geocoder (servicio compartido) y publica sugerencias de ubicación. */
  private async fetchSuggestions(query: string): Promise<void> {
    const q = query.trim();
    if (q.length < 3) {
      this.suggestions.set([]);
      return;
    }
    // Aborta la petición anterior: evita respuestas fuera de orden y libera la conexión.
    this.suggestAbort?.abort();
    const controller = new AbortController();
    this.suggestAbort = controller;
    try {
      const results = await this.geocoding.search({
        query: q,
        limit: SUGGESTION_LIMIT,
        signal: controller.signal,
      });
      this.suggestions.set(
        results.map((r) => ({
          label: r.display_name,
          lat: Number(r.lat),
          lon: Number(r.lon),
        })),
      );
    } catch (error) {
      // Una cancelación (AbortError) no es un fallo: la respuesta válida llegará en la nueva petición.
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.suggestions.set([]);
      }
    }
  }

  /**
   * Intento silencioso al abrir el mapa (como Google Maps): si el usuario ya
   * concedió el permiso, centra en su ubicación; si lo deniega o se cuelga, no
   * muestra spinner ni error y se queda en la vista regional por defecto.
   */
  private autoLocate(): void {
    if (!('permissions' in navigator)) {
      return;
    }
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        // Solo auto-localiza si ya está concedido: no dispara el prompt al abrir.
        if (status.state === 'granted') {
          this.locateMe(true);
        }
      })
      .catch(() => {
        /* Permissions API no disponible: se omite el auto-centrado. */
      });
  }

  /** Centra el mapa en la ubicación actual del usuario (Geolocation API). */
  locateMe(silent = false): void {
    if (!('geolocation' in navigator) || !this.map) {
      if (!silent) {
        this.geoError.set(true);
      }
      return;
    }
    this.stopWatching();
    if (!silent) {
      this.isLocatingMe.set(true);
      this.geoError.set(false);
    }

    let hasFix = false;
    let bestAccuracy = Infinity;

    // watchPosition entrega lecturas sucesivas que se van afinando: la primera
    // suele ser la "última conocida" (cacheada) y las siguientes el fix real.
    this.geoWatchId = navigator.geolocation.watchPosition(
      (position) => {
        hasFix = true;
        this.isLocatingMe.set(false);
        const accuracy = position.coords.accuracy;
        // Recentra solo cuando mejora la precisión (no retroceder a una peor).
        if (accuracy <= bestAccuracy) {
          bestAccuracy = accuracy;
          this.onPositionFound(position);
        }
        // Fix preciso (GPS): deja de observar.
        if (accuracy <= 50) {
          this.stopWatching();
          clearTimeout(this.locateWatchdog);
        }
      },
      () => {
        if (!hasFix) {
          this.stopWatching();
          clearTimeout(this.locateWatchdog);
          this.isLocatingMe.set(false);
          if (!silent) {
            this.geoError.set(true);
          }
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );

    // Tras 20s deja de observar y conserva el mejor fix; si no hubo ninguno, error.
    clearTimeout(this.locateWatchdog);
    this.locateWatchdog = setTimeout(() => {
      this.stopWatching();
      this.isLocatingMe.set(false);
      if (!hasFix && !silent) {
        this.geoError.set(true);
      }
    }, 20000);
  }

  private stopWatching(): void {
    if (this.geoWatchId !== undefined) {
      navigator.geolocation.clearWatch(this.geoWatchId);
      this.geoWatchId = undefined;
    }
  }

  private onPositionFound(position: GeolocationPosition): void {
    if (!this.map) {
      return;
    }
    const { latitude, longitude, accuracy } = position.coords;
    const point: L.LatLngExpression = [latitude, longitude];
    this.manualCenter = true;

    this.userMarker?.remove();
    this.userCircle?.remove();
    this.userMarker = L.marker(point, { icon: this.userLocationIcon() }).addTo(this.map);
    // Círculo que comunica la precisión real reportada por el navegador.
    this.userCircle = L.circle(point, {
      radius: accuracy,
      color: '#2563eb',
      weight: 1,
      fillColor: '#2563eb',
      fillOpacity: 0.12,
    }).addTo(this.map);

    // Si la precisión es pobre (IP/WiFi), encuadra el círculo en vez de
    // aparentar exactitud con un zoom cerrado.
    if (accuracy > 100) {
      this.map.fitBounds(this.userCircle.getBounds(), { padding: [40, 40] });
    } else {
      this.map.setView(point, 16);
    }
  }

  private userLocationIcon(): L.DivIcon {
    return L.divIcon({
      className: 'user-location',
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.3)"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  private renderMarkers(): void {
    if (!this.map) {
      return;
    }

    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    const bounds = L.latLngBounds([]);
    let missing = 0;

    this.properties().forEach((prop) => {
      if (prop.latitude && prop.longitude) {
        const marker = L.marker([prop.latitude, prop.longitude], {
          icon: this.pricePin(prop),
        })
          .addTo(this.map!)
          .bindPopup(this.popupHtml(prop));

        this.markers.push(marker);
        bounds.extend([prop.latitude, prop.longitude]);
      } else {
        missing++;
      }
    });

    // Propiedades del resultado que no se pueden situar en el mapa (sin coordenadas).
    this.missingLocationCount.set(missing);

    // Solo reencuadra cuando el usuario no ha centrado el mapa manualmente
    // ("mi ubicación" o una sugerencia de zona); al filtrar se libera ese bloqueo.
    if (this.markers.length > 0 && !this.manualCenter) {
      this.map.fitBounds(bounds, { padding: [60, 60] });
    }
  }

  /** Marcador-píldora azul con el precio (estilo Zillow/Redfin). */
  private pricePin(prop: Property): L.DivIcon {
    const text = this.escapeHtml(this.pinPriceLabel(prop));
    const width = Math.max(46, text.length * 8.5 + 22);
    const height = 28;
    return L.divIcon({
      className: 'price-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#2563eb;color:#fff;font-weight:700;font-size:12.5px;border-radius:999px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);white-space:nowrap">${text}</div>`,
      iconSize: [width, height],
      iconAnchor: [width / 2, height / 2],
      popupAnchor: [0, -height / 2 - 2],
    });
  }

  private popupHtml(prop: Property): string {
    const title = this.escapeHtml(prop.title);
    const price = this.escapeHtml(this.priceLabel(prop));
    const imageUrl = this.escapeHtml(this.propertyService.getPropertyImageUrl(prop));
    const viewDetails = this.escapeHtml(this.transloco.translate('public.map.viewDetails'));
    const href = `/${this.slugService.getSlug()}/publico/propiedades/${prop.id}`;
    return `
      <div style="width:210px">
        <img src="${imageUrl}" alt="${title}" loading="lazy"
             style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px">
        <h3 style="font-size:1rem;font-weight:700;margin:0 0 2px;color:#1e293b">${title}</h3>
        <p style="color:#2563eb;font-weight:700;margin:0 0 8px">${price}</p>
        <a href="${href}"
           style="display:block;text-align:center;background:#2563eb;color:#fff;padding:8px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem">${viewDetails}</a>
      </div>`;
  }

  hasActiveFilters(): boolean {
    return (
      this.minPrice() !== null ||
      this.maxPrice() !== null ||
      this.bedrooms() !== null ||
      this.rentalType() !== 'any'
    );
  }

  clearFilters(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.bedrooms.set(null);
    this.rentalType.set('any');
    this.manualCenter = false;
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

  /** Precio completo con sufijo (/mes o /noche) para el popup. */
  priceLabel(prop: Property): string {
    const base = this.propertyService.getPropertyPrice(prop);
    if (base === 'N/A') return base;
    const isShortTerm = (prop.rental_type ?? '').toUpperCase() === 'SHORT_TERM';
    const suffix = this.transloco.translate(
      isShortTerm ? 'public.map.perNight' : 'public.map.perMonth',
    );
    return `${base}${suffix}`;
  }

  /** Precio compacto para la píldora del marcador (ej. "Bs 3.5k", "$1.2M"). */
  private pinPriceLabel(prop: Property): string {
    const value = prop.monthly_rent ?? prop.monthly_rent_amount ?? prop.min_price_per_night ?? null;
    if (!value) {
      return '—';
    }
    return `${this.currencySymbol(prop.currency)}${this.compactNumber(value)}`;
  }

  private compactNumber(n: number): string {
    if (n >= 1_000_000) {
      return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (n >= 1_000) {
      return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `${n}`;
  }

  private currencySymbol(currency?: string): string {
    switch ((currency ?? 'BOB').toUpperCase()) {
      case 'USD':
        return '$';
      case 'BOB':
        return 'Bs ';
      case 'GTQ':
        return 'Q';
      case 'HNL':
        return 'L ';
      default:
        return `${currency} `;
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };

      return entities[character] ?? character;
    });
  }
}
