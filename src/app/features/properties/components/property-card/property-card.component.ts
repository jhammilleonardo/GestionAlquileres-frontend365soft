import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  BedDouble,
  Building2,
  CalendarRange,
  CheckCircle2,
  DollarSign,
  Eye,
  Home,
  LucideAngularModule,
  MapPin,
  Maximize2,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-angular';

import { FormatService } from '../../../../core/services/format.service';
import {
  Property,
  PropertyStatus,
  rentalTypeLabelKey,
} from '../../../../core/models/property.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule, AppButtonComponent, AppStatusBadgeComponent],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyCardComponent {
  private readonly formatService = inject(FormatService);

  readonly property = input.required<Property>();
  readonly imageUrl = input('');

  readonly viewed = output<Property>();
  readonly edited = output<Property>();
  readonly statusToggled = output<Property>();
  readonly deleted = output<Property>();
  readonly imageFailed = output<{ property: Property; url: string }>();

  readonly Building2 = Building2;
  readonly CalendarRange = CalendarRange;
  readonly CheckCircle2 = CheckCircle2;
  readonly DollarSign = DollarSign;
  readonly Eye = Eye;
  readonly Home = Home;
  readonly MapPin = MapPin;
  readonly Maximize2 = Maximize2;
  readonly BedDouble = BedDouble;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly XCircle = XCircle;

  getPropertyAddress(property: Property): string {
    const address = property.addresses?.[0];
    if (!address) return 'Sin dirección';
    return `${address.street_address || ''}, ${address.city || ''}, ${address.country || ''}`;
  }

  rentalTypeLabel(property: Property): string {
    return rentalTypeLabelKey(property.rental_type);
  }

  /** True para corto plazo puro (solo precio por noche, sin mensual). */
  isShortTermOnly(property: Property): boolean {
    return (property.rental_type ?? '').toUpperCase() === 'SHORT_TERM';
  }

  getPropertyPrice(property: Property): string {
    if (this.isShortTermOnly(property)) {
      const nightly = property.min_price_per_night;
      return nightly ? this.formatService.formatCurrency(nightly) : 'N/A';
    }

    const price = property.monthly_rent || property.monthly_rent_amount;
    return price ? this.formatService.formatCurrency(price) : 'N/A';
  }

  /** Clave de traducción del periodo de precio (mensual o por noche). */
  getPriceLabelKey(property: Property): string {
    return this.isShortTermOnly(property) ? 'properties.nightlyPrice' : 'properties.monthlyPrice';
  }

  getPropertyArea(property: Property): string {
    const area = property.square_meters || property.total_area;
    return area ? `${area} m²` : 'N/A';
  }

  getStatusTone(status: PropertyStatus | undefined): AppStatusTone {
    switch (status) {
      case PropertyStatus.DISPONIBLE:
        return 'success';
      case PropertyStatus.OCUPADO:
      case PropertyStatus.RESERVADO:
        return 'info';
      case PropertyStatus.MANTENIMIENTO:
        return 'warning';
      case PropertyStatus.INACTIVO:
      default:
        return 'neutral';
    }
  }
}
