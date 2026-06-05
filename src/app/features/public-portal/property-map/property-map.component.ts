import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { Property } from '../../../core/models/property.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, MapPin, List, Home } from 'lucide-angular';
import * as L from 'leaflet';

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, LucideAngularModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-map.component.html',
  styleUrls: ['./property-map.component.css'],
})
export class PropertyMapComponent implements OnInit, OnDestroy {
  readonly MapPin = MapPin;
  readonly List = List;
  readonly Home = Home;

  properties: Property[] = [];
  isLoading = true;
  private map?: L.Map;
  private markers: L.Marker[] = [];

  public propertyService = inject(PropertyService);
  private cdr = inject(ChangeDetectorRef);
  public slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  ngOnInit(): void {
    this.loadProperties();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private loadProperties(): void {
    this.propertyService.getProperties().subscribe({
      next: (props) => {
        this.properties = props;
        this.isLoading = false;
        this.cdr.detectChanges();

        // Initialize map after properties are loaded and view is updated
        setTimeout(() => this.initMap(), 100);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private initMap(): void {
    // Default center (can be dynamic based on properties)
    let center: L.LatLngExpression = [-16.5, -68.15]; // La Paz, Bolivia as default

    if (this.properties.length > 0) {
      const validProps = this.properties.filter((p) => p.latitude && p.longitude);
      if (validProps.length > 0) {
        center = [validProps[0].latitude!, validProps[0].longitude!];
      }
    }

    this.map = L.map('map-container').setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.addMarkers();
  }

  private addMarkers(): void {
    if (!this.map) return;

    // Fix for Leaflet default icon paths in Angular/Webpack
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

    const bounds = L.latLngBounds([]);

    this.properties.forEach((prop) => {
      if (prop.latitude && prop.longitude) {
        const title = this.escapeHtml(prop.title);
        const price = this.escapeHtml(this.propertyService.getPropertyPrice(prop));
        const imageUrl = this.escapeHtml(this.propertyService.getPropertyImageUrl(prop));
        const viewDetails = this.escapeHtml(this.transloco.translate('public.map.viewDetails'));
        const marker = L.marker([prop.latitude, prop.longitude]).addTo(this.map!).bindPopup(`
            <div class="map-popup">
              <img src="${imageUrl}" alt="${title}" class="popup-img">
              <div class="popup-info">
                <h3 class="popup-title">${title}</h3>
                <p class="popup-price">${price}</p>
                <a href="/${this.slugService.getSlug()}/publico/propiedades/${prop.id}" class="popup-link">${viewDetails}</a>
              </div>
            </div>
          `);

        this.markers.push(marker);
        bounds.extend([prop.latitude, prop.longitude]);
      }
    });

    if (this.markers.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
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
