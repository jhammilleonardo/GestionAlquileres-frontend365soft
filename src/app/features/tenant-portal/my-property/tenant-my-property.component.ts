import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Home,
  MapPin,
  MessageSquare,
  CheckCircle2,
  ScrollText,
} from 'lucide-angular';

import { TenantContractService } from '../../../core/services/tenant/tenant-contract.service';
import {
  TenantPropertyService,
  Property,
} from '../../../core/services/tenant/tenant-property.service';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tenant-my-property',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoModule,
    LucideAngularModule,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './tenant-my-property.component.html',
  styleUrl: './tenant-my-property.component.scss',
})
export class TenantMyPropertyComponent {
  readonly Home = Home;
  readonly MapPin = MapPin;
  readonly MessageSquare = MessageSquare;
  readonly CheckCircle2 = CheckCircle2;
  readonly ScrollText = ScrollText;

  private readonly contractService = inject(TenantContractService);
  private readonly propertyService = inject(TenantPropertyService);

  readonly contract = this.contractService.currentContract;
  readonly isLoading = this.contractService.isLoading;
  readonly property = signal<Property | null>(null);

  readonly photos = computed(() =>
    (this.property()?.images ?? []).map((img) => this.toUrl(img.image_url)),
  );
  readonly amenities = computed(() => this.property()?.amenities ?? []);

  private lastLoadedPropertyId: number | null = null;

  constructor() {
    this.contractService.loadCurrentContract();

    // Cuando el contrato se resuelve, carga el detalle de la propiedad (fotos/amenidades).
    effect(() => {
      const propertyId = this.contract()?.property_id ?? this.contract()?.property?.id ?? null;
      if (propertyId && propertyId !== this.lastLoadedPropertyId) {
        this.lastLoadedPropertyId = propertyId;
        this.propertyService.getProperty(propertyId).subscribe({
          next: (p) => this.property.set(p),
          error: () => this.property.set(null),
        });
      }
    });
  }

  private toUrl(path: string): string {
    return path.startsWith('http') ? path : `${environment.apiUrl.replace(/\/$/, '')}${path}`;
  }
}
