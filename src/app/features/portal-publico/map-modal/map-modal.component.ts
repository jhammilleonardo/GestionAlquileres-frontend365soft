import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../shared/pipes/safe.pipe';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, MapPin, Map, Building2, Mailbox, X } from 'lucide-angular';

@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [CommonModule, SafePipe, TranslocoModule, LucideAngularModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.css'],
})
export class MapModalComponent {
  @Input() location: any;
  @Output() close = new EventEmitter<void>();

  readonly MapPin = MapPin;
  readonly Map = Map;
  readonly Building2 = Building2;
  readonly Mailbox = Mailbox;
  readonly X = X;

  get openStreetMapUrl(): string {
    if (!this.location || !this.location.coordinates) {
      const defaultLat = -17.7833;
      const defaultLng = -63.1833;
      return `https://www.openstreetmap.org/?mlat=${defaultLat}&mlon=${defaultLng}#map=15/${defaultLat}/${defaultLng}`;
    }

    const { lat, lng } = this.location.coordinates;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Default to Santa Cruz, Bolivia if invalid or zero
    if (isNaN(latitude) || isNaN(longitude) || (latitude === 0 && longitude === 0)) {
      const defaultLat = -17.7833;
      const defaultLng = -63.1833;
      return `https://www.openstreetmap.org/?mlat=${defaultLat}&mlon=${defaultLng}#map=15/${defaultLat}/${defaultLng}`;
    }

    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
  }

  get embedMapUrl(): string {
    if (!this.location || !this.location.coordinates) {
      const defaultLat = -17.7833;
      const defaultLng = -63.1833;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${defaultLng - 0.01},${defaultLat - 0.01},${defaultLng + 0.01},${defaultLat + 0.01}&layer=mapnik&marker=${defaultLat},${defaultLng}`;
    }

    const { lat, lng } = this.location.coordinates;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Default to Santa Cruz, Bolivia if invalid or zero
    if (isNaN(latitude) || isNaN(longitude) || (latitude === 0 && longitude === 0)) {
      const defaultLat = -17.7833;
      const defaultLng = -63.1833;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${defaultLng - 0.01},${defaultLat - 0.01},${defaultLng + 0.01},${defaultLat + 0.01}&layer=mapnik&marker=${defaultLat},${defaultLng}`;
    }

    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  }

  closeModal() {
    this.close.emit();
  }

  openInNewTab() {
    if (!this.location) return;

    let query = '';
    if (this.location.coordinates) {
      const lat = parseFloat(this.location.coordinates.lat);
      const lng = parseFloat(this.location.coordinates.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        query = `${lat},${lng}`;
      }
    }

    if (!query && this.location.address) {
      query = encodeURIComponent(this.location.address);
    }

    if (query) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    } else {
      // Default to Santa Cruz, Bolivia
      window.open('https://www.google.com/maps/search/?api=1&query=-17.7833,-63.1833', '_blank');
    }
  }
}
