import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../shared/pipes/safe.pipe';


@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [CommonModule, SafePipe],
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.css']
})
export class MapModalComponent {
  @Input() location: any;
  @Output() close = new EventEmitter<void>();

  get openStreetMapUrl(): string {
    const { lat, lng } = this.location.coordinates;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  }

  get embedMapUrl(): string {
    const { lat, lng } = this.location.coordinates;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  }

  closeModal() {
    this.close.emit();
  }

  openInNewTab() {
    window.open(this.openStreetMapUrl, '_blank');
  }
}

