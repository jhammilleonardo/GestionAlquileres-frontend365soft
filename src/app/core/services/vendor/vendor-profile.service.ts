import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ChangeVendorPasswordDto, VendorPortalProfile } from '../../models/vendor.model';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

/**
 * Servicio del perfil del proveedor en su portal. Opera sobre `/:slug/vendor/me`
 * y `/:slug/vendor/password`, que el backend acota al proveedor autenticado.
 */
@Injectable({ providedIn: 'root' })
export class VendorProfileService {
  private readonly apiClient = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  private readonly profileSignal = signal<VendorPortalProfile | null>(null);
  private readonly loadingSignal = signal(false);

  readonly profile = this.profileSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  load(): void {
    const endpoint = this.slugService.buildApiEndpoint('vendor/me');
    this.loadingSignal.set(true);
    this.apiClient.get<VendorPortalProfile>(endpoint).subscribe({
      next: (profile) => {
        this.profileSignal.set(this.normalize(profile));
        this.loadingSignal.set(false);
      },
      error: () => {
        this.profileSignal.set(null);
        this.loadingSignal.set(false);
      },
    });
  }

  changePassword(dto: ChangeVendorPasswordDto): Observable<{ message: string }> {
    const endpoint = this.slugService.buildApiEndpoint('vendor/password');
    return this.apiClient.patch<{ message: string }, ChangeVendorPasswordDto>(endpoint, dto);
  }

  /** Los montos y el rating llegan como string desde Postgres numeric. */
  private normalize(profile: VendorPortalProfile): VendorPortalProfile {
    return {
      ...profile,
      average_rating: this.toNumber(profile.average_rating),
      compliance_score: this.toNumber(profile.compliance_score),
      total_orders: this.toNumber(profile.total_orders),
      open_orders: this.toNumber(profile.open_orders),
      completed_orders: this.toNumber(profile.completed_orders),
      pending_balance: this.toNumber(profile.pending_balance),
      paid_total: this.toNumber(profile.paid_total),
      rate_per_hour: this.toNumber(profile.rate_per_hour),
      rate_flat: this.toNumber(profile.rate_flat),
    };
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
