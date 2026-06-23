import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  effect,
  input,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #mapEl
      class="location-map"
      role="img"
      [style.min-height.px]="height()"
      [attr.aria-label]="label()"
    ></div>
  `,
  styles: [
    `
      .location-map {
        width: 100%;
        min-height: 280px;
        border: 1px solid var(--app-color-border, #d7dee8);
        border-radius: 14px;
        overflow: hidden;
        z-index: 0;
      }
    `,
  ],
})
export class AppLocationMapComponent {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly label = input('Property location map');
  readonly height = input(280);

  private readonly mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');
  private map?: L.Map;
  private marker?: L.Marker;

  private readonly DEFAULT_ZOOM = 16;

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      if (!this.map) return;
      this.renderLocation();
    });
  }

  private initMap(): void {
    const center = this.normalizedLocation();

    this.map = L.map(this.mapEl().nativeElement, {
      attributionControl: true,
      boxZoom: false,
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      scrollWheelZoom: false,
      touchZoom: false,
      zoomControl: true,
    }).setView([center.lat, center.lng], this.DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
      noWrap: true,
    }).addTo(this.map);

    this.renderLocation();
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private renderLocation(): void {
    if (!this.map) return;
    const location = this.normalizedLocation();
    const position: L.LatLngExpression = [location.lat, location.lng];

    if (!this.marker) {
      this.marker = L.marker(position, { icon: this.pinIcon(), interactive: false }).addTo(
        this.map,
      );
    } else {
      this.marker.setLatLng(position);
    }

    this.map.setView(position, this.DEFAULT_ZOOM);
  }

  private normalizedLocation(): { lat: number; lng: number } {
    return {
      lat: Math.max(-85, Math.min(85, this.latitude())),
      lng: ((((this.longitude() + 180) % 360) + 360) % 360) - 180,
    };
  }

  private pinIcon(): L.DivIcon {
    return L.divIcon({
      className: 'location-map-pin',
      html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#dc2626;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 22],
    });
  }
}
