import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  Bath,
  Car,
  Heart,
  Home,
  LucideAngularModule,
  MapPin,
  Maximize,
  Sofa,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { resolveMediaUrl } from '../../../../core/utils/media-url.util';
import { Property, rentalTypeLabelKey } from '../../../../core/models/property.model';

interface PublicPriceDisplay {
  amount: number;
  labelKey: string;
}

/**
 * Tarjeta pública de propiedad reutilizable.
 * Fuente única de verdad para el listado de propiedades y la sección
 * "Propiedades Destacadas" del inicio — así ambas vistas se ven idénticas.
 */
@Component({
  selector: 'app-public-property-card',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './property-card.component.html',
  styleUrls: ['./property-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPropertyCardComponent {
  readonly Heart = Heart;
  readonly Home = Home;
  readonly MapPin = MapPin;
  readonly Maximize = Maximize;
  readonly Bath = Bath;
  readonly Car = Car;
  readonly Sofa = Sofa;

  readonly property = input.required<Property>();
  readonly favorite = input(false);

  readonly view = output<number>();
  readonly favoriteToggle = output<number>();

  private readonly transloco = inject(TranslocoService);

  onView(): void {
    this.view.emit(this.property().id);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit(this.property().id);
  }

  getPropertyImageUrl(property: Property): string {
    const imagePath = property.first_image ?? property.images?.[0] ?? null;
    return resolveMediaUrl(imagePath);
  }

  getPropertyAddress(property: Property): string {
    const address = property.addresses?.[0];
    if (!address) return '';

    return [address.city, address.state, address.country].filter(Boolean).join(', ');
  }

  rentalTypeLabel(property: Property): string {
    return rentalTypeLabelKey(property.rental_type);
  }

  getPriceDisplay(property: Property): PublicPriceDisplay | null {
    if (this.hasShortTermPrice(property)) {
      return {
        amount: property.min_price_per_night ?? 0,
        labelKey: 'public.properties.priceNight',
      };
    }

    const monthlyRent = property.monthly_rent ?? property.monthly_rent_amount;
    if (!monthlyRent) return null;

    return {
      amount: monthlyRent,
      labelKey: 'public.properties.priceMonth',
    };
  }

  private hasShortTermPrice(property: Property): boolean {
    const rentalType = (property.rental_type ?? '').toUpperCase();
    return (
      (rentalType === 'SHORT_TERM' || rentalType === 'BOTH') &&
      Number(property.min_price_per_night ?? 0) > 0
    );
  }

  handleImageError(event: Event): void {
    const text = this.transloco.translate('public.properties.noImage');
    const target = event.target as HTMLImageElement;
    if (target.dataset['placeholder'] === 'true') return;
    target.dataset['placeholder'] = 'true';
    target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="260"%3E%3Crect width="400" height="260" fill="%23dbeafe"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="15" fill="%2393c5fd"%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
  }
}
