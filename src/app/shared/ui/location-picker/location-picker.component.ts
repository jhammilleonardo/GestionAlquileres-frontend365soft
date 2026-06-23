import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Search, Loader2, MapPin } from 'lucide-angular';
import * as L from 'leaflet';

import { GeocodingSearchResult, GeocodingService } from '../../../core/services/geocoding.service';

/** Dirección resuelta por el geocoder al elegir un resultado de búsqueda. */
export interface PickedAddress {
  /** Dirección completa legible (`display_name` de Nominatim). */
  full: string;
  /** Calle + número, si el resultado los trae. */
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/** Coordenada emitida al elegir una ubicación, ya redondeada a 8 decimales
 *  (coincide con numeric(10,8)/(11,8) en la BD). La dirección solo viene cuando
 *  se elige un resultado de búsqueda (no al hacer clic suelto en el mapa). */
export interface PickedLocation {
  lat: number;
  lng: number;
  address?: PickedAddress;
}

/**
 * Selector de ubicación sobre un mapa: el usuario hace clic (o arrastra el
 * marcador) y se obtienen lat/lng — sin tener que conocer las coordenadas.
 * Opcionalmente busca una dirección por texto (geocodificación Nominatim/OSM).
 *
 * No usa imágenes de marcador (divIcon CSS) para no depender de assets.
 */
@Component({
  selector: 'app-location-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslocoModule, LucideAngularModule],
  providers: [provideTranslocoScope({ scope: 'propiedades', alias: 'properties' })],
  template: `
    <div class="location-picker">
      @if (collapsed()) {
        <button type="button" class="open-map-btn" (click)="reveal()">
          <lucide-icon [img]="MapPin" [size]="18" aria-hidden="true" />
          <span>{{ 'properties.openMapBtn' | transloco }}</span>
        </button>
      }

      <div class="picker-body" [hidden]="collapsed()">
        <div class="search-shell">
          <div class="search-bar">
            <input
              type="text"
              class="search-input"
              [placeholder]="'properties.locationSearchPlaceholder' | transloco"
              [ngModel]="query()"
              (ngModelChange)="onQueryChange($event)"
              (keydown.enter)="search(); $event.preventDefault()"
              [attr.aria-label]="'properties.locationSearchPlaceholder' | transloco"
            />
            @if (query()) {
              <button
                type="button"
                class="clear-btn"
                (click)="clearQuery()"
                [attr.aria-label]="'common.clear' | transloco"
              >
                ×
              </button>
            }
            <button
              type="button"
              class="search-btn"
              (click)="search()"
              [disabled]="searching()"
              [attr.aria-label]="'properties.locationSearchBtn' | transloco"
            >
              @if (searching()) {
                <lucide-icon [img]="Loader2" [size]="16" class="spin" />
              } @else {
                <lucide-icon [img]="Search" [size]="16" />
              }
              <span>{{ 'properties.locationSearchBtn' | transloco }}</span>
            </button>
          </div>

          @if (suggestions().length > 0) {
            <div class="suggestions" role="listbox">
              @for (suggestion of suggestions(); track suggestion.display_name) {
                <button
                  type="button"
                  class="suggestion"
                  role="option"
                  [attr.aria-selected]="false"
                  (click)="selectSuggestion(suggestion)"
                >
                  <span class="suggestion__pin" aria-hidden="true"></span>
                  <span class="suggestion__text">
                    <strong>{{ suggestionTitle(suggestion) }}</strong>
                    <small>{{ suggestionSubtitle(suggestion) }}</small>
                  </span>
                </button>
              }
            </div>
          }
        </div>

        @if (searchError()) {
          <p class="picker-error" role="alert">
            {{ 'properties.locationSearchError' | transloco }}
          </p>
        }

        <div #mapEl class="map-canvas" role="application"></div>

        <p class="picker-hint">{{ 'properties.locationPickHint' | transloco }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .location-picker {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .picker-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .open-map-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        align-self: flex-start;
        height: 42px;
        padding: 0 18px;
        border: 1px solid var(--app-color-primary, #2563eb);
        border-radius: var(--app-radius-md, 10px);
        background: var(--app-color-primary, #2563eb);
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .open-map-btn:hover {
        filter: brightness(0.95);
      }
      .search-shell {
        position: relative;
        z-index: 20;
      }
      .search-bar {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
      }
      .search-input {
        flex: 1;
        min-width: 0;
        height: 42px;
        padding: 0 14px;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-md, 10px);
        background: var(--app-color-surface);
        color: var(--app-color-text);
        font-size: 14px;
      }
      .search-input:has(+ .clear-btn) {
        padding-inline-end: 40px;
      }
      .search-input:focus {
        outline: none;
        border-color: var(--app-color-primary);
      }
      .clear-btn {
        position: absolute;
        inset-block-start: 5px;
        inset-inline-end: 104px;
        display: inline-grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--app-color-text-muted);
        cursor: pointer;
        font-size: 22px;
        line-height: 1;
      }
      .clear-btn:hover,
      .clear-btn:focus-visible {
        background: var(--app-color-surface-muted);
        color: var(--app-color-text);
        outline: none;
      }
      .search-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 42px;
        padding: 0 16px;
        border: 0;
        border-radius: var(--app-radius-md, 10px);
        background: var(--app-color-primary);
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .search-btn:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .suggestions {
        position: absolute;
        inset-block-start: calc(100% + 6px);
        inset-inline: 0;
        z-index: 30;
        display: grid;
        max-height: 240px;
        overflow-y: auto;
        border: 1px solid var(--app-color-border);
        border-radius: 14px;
        background: var(--app-color-surface);
        box-shadow:
          0 10px 24px rgb(15 23 42 / 10%),
          0 2px 8px rgb(15 23 42 / 6%);
      }
      .suggestion {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        border: 0;
        border-bottom: 1px solid var(--app-color-border);
        background: transparent;
        color: var(--app-color-text);
        cursor: pointer;
        padding: 10px 12px;
        text-align: left;
      }
      .suggestion:last-child {
        border-bottom: 0;
      }
      .suggestion:hover,
      .suggestion:focus-visible {
        background: var(--app-color-surface-muted);
        outline: none;
      }
      .suggestion__pin {
        width: 14px;
        height: 14px;
        border-radius: 50% 50% 50% 0;
        background: #dc2626;
        transform: rotate(-45deg);
      }
      .suggestion__text {
        display: grid;
        min-width: 0;
        gap: 2px;
      }
      .suggestion__text strong,
      .suggestion__text small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .suggestion__text strong {
        font-size: 13px;
        font-weight: 750;
      }
      .suggestion__text small {
        color: var(--app-color-text-muted);
        font-size: 12px;
      }
      .map-canvas {
        touch-action: pan-y;
        width: 100%;
        height: 320px;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg, 14px);
        overflow: hidden;
        z-index: 0;
      }
      .picker-hint {
        margin: 0;
        font-size: 12px;
        color: var(--app-color-text-muted);
      }
      .picker-error {
        margin: 0;
        font-size: 12px;
        color: var(--app-color-danger);
      }
      .spin {
        animation: lp-spin 1s linear infinite;
      }
      @keyframes lp-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (max-width: 560px) {
        .map-canvas {
          height: 260px;
        }
        .search-btn span {
          display: none;
        }
        .clear-btn {
          inset-inline-end: 52px;
        }
      }
    `,
  ],
})
export class AppLocationPickerComponent {
  private readonly geocoding = inject(GeocodingService);

  readonly Search = Search;
  readonly Loader2 = Loader2;
  readonly MapPin = MapPin;

  /** Coordenadas iniciales (p. ej. al editar una propiedad existente). */
  readonly latitude = input<number | string | null>(null);
  readonly longitude = input<number | string | null>(null);
  /** Si es `true`, el mapa arranca oculto tras un botón "Buscar en el mapa". */
  readonly startCollapsed = input(false);

  /** Estado de plegado del mapa; se inicializa desde `startCollapsed`. */
  protected readonly collapsed = linkedSignal(() => this.startCollapsed());
  /** Dirección sugerida para prellenar el buscador (no dispara la búsqueda sola). */
  readonly address = input<string>('');
  readonly country = input<string>('');
  readonly region = input<string>('');
  readonly city = input<string>('');

  readonly locationChange = output<PickedLocation>();

  private readonly mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');

  readonly query = signal('');
  readonly searching = signal(false);
  readonly searchError = signal(false);
  readonly suggestions = signal<readonly GeocodingSearchResult[]>([]);
  private readonly queryTouched = signal(false);
  private readonly lastAutoQuery = signal('');
  private suggestionTimer?: ReturnType<typeof setTimeout>;
  private suggestionAbort?: AbortController;

  private map?: L.Map;
  private marker?: L.Marker;

  private readonly DEFAULT_CENTER: L.LatLngExpression = [4, -74];
  private readonly DEFAULT_ZOOM = 3;
  private readonly MARKER_ZOOM = 16;

  constructor() {
    afterNextRender(() => this.initMap());

    // Mantiene el buscador alineado con la dirección/cascada mientras el usuario no escriba otra búsqueda.
    effect(() => {
      const next = this.buildSuggestedQuery();
      if (!next) return;

      const current = this.query().trim();
      const canReplace =
        !this.queryTouched() || current.length === 0 || current === this.lastAutoQuery();

      if (canReplace) {
        this.query.set(next);
        this.lastAutoQuery.set(next);
      }
    });

    // Reflejar coordenadas que lleguen desde el padre (carga en edición) en el marcador.
    effect(() => {
      const lat = this.toNum(this.latitude());
      const lng = this.toNum(this.longitude());
      if (lat === null || lng === null || !this.map) return;
      const normalized = this.normalizeCoordinates(lat, lng);
      const current = this.marker?.getLatLng();
      if (current && current.lat === normalized.lat && current.lng === normalized.lng) return;
      this.placeMarker(normalized.lat, normalized.lng, false);
      this.map.setView([normalized.lat, normalized.lng], this.MARKER_ZOOM);
    });
  }

  private initMap(): void {
    const lat = this.toNum(this.latitude());
    const lng = this.toNum(this.longitude());
    const hasCoords = lat !== null && lng !== null;
    const center = hasCoords ? this.normalizeCoordinates(lat, lng) : null;

    this.map = L.map(this.mapEl().nativeElement, {
      boxZoom: true,
      doubleClickZoom: true,
      dragging: true,
      keyboard: true,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1,
      minZoom: 2,
      scrollWheelZoom: true,
      touchZoom: true,
      worldCopyJump: false,
    }).setView(
      center ? [center.lat, center.lng] : this.DEFAULT_CENTER,
      center ? this.MARKER_ZOOM : 2,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
      noWrap: true,
    }).addTo(this.map);

    if (center) this.placeMarker(center.lat, center.lng, false);

    this.map.on('click', (e: L.LeafletMouseEvent) =>
      this.placeMarker(e.latlng.lat, e.latlng.lng, true),
    );

    // El contenedor puede medir 0 al inicializarse dentro de un paso oculto del wizard.
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  onQueryChange(value: string): void {
    this.queryTouched.set(true);
    this.query.set(value);
    this.searchError.set(false);
    this.queueSuggestions();
  }

  clearQuery(): void {
    this.queryTouched.set(true);
    this.query.set('');
    this.lastAutoQuery.set('');
    this.suggestions.set([]);
    this.searchError.set(false);
  }

  selectSuggestion(suggestion: GeocodingSearchResult): void {
    this.queryTouched.set(true);
    this.query.set(suggestion.display_name);
    this.lastAutoQuery.set(suggestion.display_name);
    this.suggestions.set([]);
    this.applySearchResult(suggestion);
  }

  private placeMarker(
    lat: number,
    lng: number,
    emit: boolean,
    result?: GeocodingSearchResult,
  ): void {
    if (!this.map) return;
    const normalized = this.normalizeCoordinates(lat, lng);
    const pos: L.LatLngExpression = [normalized.lat, normalized.lng];

    if (!this.marker) {
      this.marker = L.marker(pos, { draggable: true, icon: this.pinIcon() }).addTo(this.map);
      this.marker.on('dragend', () => {
        const p = this.marker!.getLatLng();
        this.emit(p.lat, p.lng);
      });
    } else {
      this.marker.setLatLng(pos);
    }

    if (emit) this.emit(normalized.lat, normalized.lng, result);
  }

  private emit(lat: number, lng: number, result?: GeocodingSearchResult): void {
    const normalized = this.normalizeCoordinates(lat, lng);
    this.locationChange.emit({
      lat: this.round8(normalized.lat),
      lng: this.round8(normalized.lng),
      address: result ? this.toPickedAddress(result) : undefined,
    });
  }

  /** Arma una dirección estructurada a partir del resultado del geocoder. */
  private toPickedAddress(result: GeocodingSearchResult): PickedAddress {
    const a = result.address;
    const street = [a?.road, a?.house_number]
      .filter((part) => !!part)
      .join(' ')
      .trim();
    const city = a?.city || a?.town || a?.village || a?.municipality;
    return {
      full: result.display_name,
      street: street || undefined,
      city: city || undefined,
      state: a?.state || undefined,
      zipCode: a?.postcode || undefined,
    };
  }

  /**
   * Muestra el mapa (cuando arrancó colapsado) y lo centra en la zona indicada
   * por los campos de dirección. Leaflet necesita recalcular su tamaño porque
   * el contenedor estaba oculto, por eso el `invalidateSize` tras el render.
   */
  protected reveal(): void {
    this.collapsed.set(false);
    setTimeout(() => {
      this.map?.invalidateSize();
      void this.search();
    });
  }

  async search(): Promise<void> {
    if (this.suggestions().length > 0) {
      this.selectSuggestion(this.suggestions()[0]);
      return;
    }

    this.searching.set(true);
    this.searchError.set(false);
    try {
      const results = await this.fetchLocations(1);
      if (results.length > 0) {
        this.applySearchResult(results[0]);
      } else {
        this.searchError.set(true);
      }
    } catch {
      this.searchError.set(true);
    } finally {
      this.searching.set(false);
    }
  }

  protected suggestionTitle(suggestion: GeocodingSearchResult): string {
    return suggestion.display_name.split(',')[0]?.trim() || suggestion.display_name;
  }

  protected suggestionSubtitle(suggestion: GeocodingSearchResult): string {
    return suggestion.display_name.split(',').slice(1).join(',').trim();
  }

  private pinIcon(): L.DivIcon {
    return L.divIcon({
      className: 'location-picker-pin',
      html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#dc2626;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 22],
    });
  }

  private toNum(value: number | string | null): number | null {
    if (value === null || value === '') return null;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }

  private round8(n: number): number {
    return Math.round(n * 1e8) / 1e8;
  }

  private normalizeCoordinates(lat: number, lng: number): PickedLocation {
    return {
      lat: Math.max(-85, Math.min(85, lat)),
      lng: ((((lng + 180) % 360) + 360) % 360) - 180,
    };
  }

  private buildSearchQuery(): string {
    const parts = [this.query(), this.city(), this.region(), this.country()]
      .map((part) => part.trim())
      .filter(Boolean);

    return Array.from(new Set(parts)).join(', ');
  }

  private buildSuggestedQuery(): string {
    const address = this.address().trim();
    if (address) return address;

    const parts = [this.city(), this.region(), this.country()]
      .map((part) => part.trim())
      .filter(Boolean);

    return Array.from(new Set(parts)).join(', ');
  }

  private queueSuggestions(): void {
    if (this.suggestionTimer) {
      clearTimeout(this.suggestionTimer);
    }

    this.suggestionAbort?.abort();

    if (this.query().trim().length < 2) {
      this.suggestions.set([]);
      return;
    }

    this.suggestionTimer = setTimeout(() => void this.loadSuggestions(), 350);
  }

  private async loadSuggestions(): Promise<void> {
    try {
      const results = await this.fetchLocations(5);
      this.suggestions.set(results);
    } catch {
      this.suggestions.set([]);
    }
  }

  private async fetchLocations(limit: number): Promise<readonly GeocodingSearchResult[]> {
    const q = this.buildSearchQuery();
    if (!q) return [];

    this.suggestionAbort?.abort();
    const abortController = new AbortController();
    this.suggestionAbort = abortController;

    return this.geocoding.search({
      query: q,
      limit,
      country: this.country(),
      signal: abortController.signal,
    });
  }

  private applySearchResult(result: GeocodingSearchResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      this.searchError.set(true);
      return;
    }

    const normalized = this.normalizeCoordinates(lat, lng);
    this.map?.setView([normalized.lat, normalized.lng], this.MARKER_ZOOM);
    this.placeMarker(normalized.lat, normalized.lng, true, result);
  }
}
