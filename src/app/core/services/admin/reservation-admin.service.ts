import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';
import {
  AdminReservation,
  PaginatedReservations,
  ReservationAction,
  ReservationAnalytics,
  SeasonRule,
  CreateSeasonRule,
  AdminReview,
  CalendarSyncSource,
  CreateSyncSource,
} from '../../models/reservation-admin.model';

/**
 * Capa de datos (HTTP) para la gestión admin de reservas. No contiene lógica de
 * negocio ni estado; sólo traduce a llamadas a la API. La orquestación vive en
 * `ReservationsAdminFacade`.
 */
@Injectable({ providedIn: 'root' })
export class ReservationAdminService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly slugService = inject(SlugService);

  list(params: QueryParams = {}): Observable<PaginatedReservations> {
    return this.api.get<PaginatedReservations>(this.endpoint('admin/reservations'), { params });
  }

  getOne(id: number): Observable<AdminReservation> {
    return this.api.get<AdminReservation>(this.endpoint(`admin/reservations/${id}`));
  }

  getAnalytics(from: string, to: string): Observable<ReservationAnalytics> {
    return this.api.get<ReservationAnalytics>(this.endpoint('admin/reservations/analytics'), {
      params: { from, to },
    });
  }

  /** Descarga el calendario de ocupación de una unidad como texto iCal (.ics). */
  getUnitCalendar(unitId: number): Observable<string> {
    const url = `${environment.apiUrl}${this.endpoint(`admin/units/${unitId}/calendar.ics`)}`;
    return this.http.get(url, { responseType: 'text' });
  }

  listReviews(propertyId?: number): Observable<AdminReview[]> {
    const params: QueryParams = propertyId ? { property_id: propertyId } : {};
    return this.api.get<AdminReview[]>(this.endpoint('admin/reviews'), { params });
  }

  listSyncSources(unitId: number): Observable<CalendarSyncSource[]> {
    return this.api.get<CalendarSyncSource[]>(
      this.endpoint(`admin/units/${unitId}/calendar-sources`),
    );
  }

  createSyncSource(unitId: number, dto: CreateSyncSource): Observable<CalendarSyncSource> {
    return this.api.post<CalendarSyncSource, CreateSyncSource>(
      this.endpoint(`admin/units/${unitId}/calendar-sources`),
      dto,
    );
  }

  syncSourceNow(unitId: number, id: number): Observable<{ blocked: number }> {
    return this.api.post<{ blocked: number }, Record<string, never>>(
      this.endpoint(`admin/units/${unitId}/calendar-sources/${id}/sync`),
      {},
    );
  }

  deleteSyncSource(unitId: number, id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/units/${unitId}/calendar-sources/${id}`));
  }

  listSeasons(unitId: number): Observable<SeasonRule[]> {
    return this.api.get<SeasonRule[]>(this.endpoint(`admin/units/${unitId}/seasons`));
  }

  createSeason(unitId: number, dto: CreateSeasonRule): Observable<SeasonRule> {
    return this.api.post<SeasonRule, CreateSeasonRule>(
      this.endpoint(`admin/units/${unitId}/seasons`),
      dto,
    );
  }

  deleteSeason(unitId: number, id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/units/${unitId}/seasons/${id}`));
  }

  updateStatus(
    id: number,
    action: ReservationAction,
    reason?: string,
  ): Observable<AdminReservation> {
    return this.api.patch<AdminReservation, { action: ReservationAction; reason?: string }>(
      this.endpoint(`admin/reservations/${id}/status`),
      { action, reason },
    );
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
