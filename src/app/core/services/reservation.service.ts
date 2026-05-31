import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../http/api-client.service';
import { SlugService } from './slug.service';

export type AvailabilityStatus = 'available' | 'blocked' | 'booked';

export interface AvailabilityDay {
  date: string;
  status: AvailabilityStatus;
}

export interface CreateReservationDto {
  property_id: number;
  unit_id: number;
  checkin_date: string;
  checkout_date: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  /** Disponibilidad mensual de una propiedad/unidad (catálogo público). month = 'YYYY-MM'. */
  getAvailability(
    propertyId: number,
    month: string,
    unitId?: number,
  ): Observable<AvailabilityDay[]> {
    const params: Record<string, string | number> = { month };
    if (unitId) params['unit_id'] = unitId;
    return this.api.get<AvailabilityDay[]>(
      this.endpoint(`catalog/properties/${propertyId}/availability`),
      { params },
    );
  }

  createReservation(dto: CreateReservationDto): Observable<{ id: number }> {
    return this.api.post<{ id: number }, CreateReservationDto>(
      this.endpoint('tenant/reservations'),
      dto,
    );
  }

  /** Bloquear/desbloquear fechas (admin). */
  blockDates(
    propertyId: number,
    unitId: number,
    dates: string[],
    block: boolean,
  ): Observable<{ count: number }> {
    return this.api.post<{ count: number }, { dates: string[]; block: boolean }>(
      this.endpoint(`admin/properties/${propertyId}/units/${unitId}/block-dates`),
      { dates, block },
    );
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
