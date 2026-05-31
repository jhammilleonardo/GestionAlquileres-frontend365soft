import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { SafePipe } from '../../../shared/pipes/safe.pipe';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

export interface MapLocation {
  coordinates: { lat: number; lng: number };
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map-modal',
  standalone: true,
  imports: [SafePipe, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.css'],
})
export class MapModalComponent {
  readonly location = input<MapLocation | null>(null);
  readonly close = output<void>();

  get openStreetMapUrl(): string {
    const coords = this.location()?.coordinates;
    if (!coords) {
      return '';
    }
    const { lat, lng } = coords;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  }

  get embedMapUrl(): string {
    const coords = this.location()?.coordinates;
    if (!coords) {
      return '';
    }
    const { lat, lng } = coords;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  }

  closeModal() {
    this.close.emit();
  }

  openInNewTab() {
    window.open(this.openStreetMapUrl, '_blank');
  }
}
