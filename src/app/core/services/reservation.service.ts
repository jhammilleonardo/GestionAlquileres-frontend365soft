import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../http/api-client.service';
import { SlugService } from './slug.service';

export type AvailabilityStatus = 'available' | 'blocked' | 'booked';

export interface PropertyRating {
  average: number;
  count: number;
}

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

export interface QuoteRequest {
  checkin_date: string;
  checkout_date: string;
  guests?: number;
}

export type QuoteLineConcept =
  | 'nightly'
  | 'cleaning_fee'
  | 'weekly_discount'
  | 'monthly_discount'
  | 'weekend_adjustment'
  | 'early_bird_discount'
  | 'last_minute_adjustment'
  | 'occupancy_tax'
  | 'security_deposit';

export interface QuoteLine {
  concept: QuoteLineConcept;
  type: 'charge' | 'discount';
  amount: number;
  detail?: Record<string, number>;
}

export interface QuoteBreakdown {
  property_id: number;
  unit_id: number;
  checkin_date: string;
  checkout_date: string;
  nights: number;
  price_per_night: number;
  currency: string;
  lines: QuoteLine[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  deposit: number;
  total_due: number;
  /** Adelanto necesario para confirmar (= total_due si se exige pago completo). */
  deposit_to_confirm: number;
}

export type ReservationStatus =
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'no_show'
  | 'declined';

export interface CancellationPreview {
  refund_percentage: number;
  refund_amount: number;
  currency: string;
  reason: string;
}

export interface ReviewRequest {
  rating: number;
  comment?: string;
}

export interface ReservationPaymentRequest {
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

export interface MyReservation {
  id: number;
  property_id: number;
  unit_id: number;
  property_name: string | null;
  unit_number: string | null;
  checkin_date: string;
  checkout_date: string;
  nights: number;
  price_per_night: string;
  cleaning_fee: string | null;
  total_amount: string;
  currency: string;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  paid_amount: string;
  has_review: boolean;
  /** Adelanto requerido para confirmar (null = pago completo). */
  deposit_required: string | null;
  /**
   * Momento en que vence el hold de la reserva (ISO). Para `pending_payment` es
   * el plazo (10 min) para pagar el QR antes de que se liberen las fechas.
   */
  expires_at: string | null;
}

export interface ExtendedReservation extends MyReservation {
  amount_difference: number;
}

export interface ExtensionQuote {
  previous_checkout: string;
  new_checkout: string;
  additional_nights: number;
  currency: string;
  lines: QuoteLine[];
  amount_difference: number;
  new_total: number;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  /** Rating agregado de una propiedad (catálogo público). */
  getPropertyRating(propertyId: number): Observable<PropertyRating> {
    return this.api.get<PropertyRating>(this.endpoint(`catalog/properties/${propertyId}/rating`));
  }

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
    const idempotencyKey = crypto.randomUUID();
    return this.api.post<{ id: number }, CreateReservationDto>(
      this.endpoint('tenant/reservations'),
      dto,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }

  /** Cotiza una reserva (desglose de precio) antes de reservar. Público. */
  getQuote(propertyId: number, unitId: number, request: QuoteRequest): Observable<QuoteBreakdown> {
    return this.api.post<QuoteBreakdown, QuoteRequest>(
      this.endpoint(`catalog/properties/${propertyId}/units/${unitId}/quote`),
      request,
    );
  }

  /** Lista las reservas del inquilino autenticado (portal). */
  getMyReservations(): Observable<MyReservation[]> {
    return this.api.get<MyReservation[]>(this.endpoint('tenant/reservations'));
  }

  /** Previsualiza el reembolso si se cancela la reserva ahora. */
  getCancellationPreview(id: number): Observable<CancellationPreview> {
    return this.api.get<CancellationPreview>(
      this.endpoint(`tenant/reservations/${id}/cancellation-preview`),
    );
  }

  /** Cancela una reserva propia del inquilino. */
  cancelReservation(id: number): Observable<MyReservation> {
    return this.api.patch<MyReservation, Record<string, never>>(
      this.endpoint(`tenant/reservations/${id}/cancel`),
      {},
    );
  }

  extendReservation(id: number, checkoutDate: string): Observable<ExtendedReservation> {
    return this.api.patch<ExtendedReservation, { checkout_date: string }>(
      this.endpoint(`tenant/reservations/${id}/extend`),
      { checkout_date: checkoutDate },
    );
  }

  quoteExtension(id: number, checkoutDate: string): Observable<ExtensionQuote> {
    return this.api.post<ExtensionQuote, { checkout_date: string }>(
      this.endpoint(`tenant/reservations/${id}/extension-quote`),
      { checkout_date: checkoutDate },
    );
  }

  /** Reseña una reserva completada propia. */
  createReview(reservationId: number, request: ReviewRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }, ReviewRequest>(
      this.endpoint(`tenant/reservations/${reservationId}/review`),
      request,
    );
  }

  /** Registra un pago contra una reserva propia (queda PENDING de aprobación). */
  createReservationPayment(
    reservationId: number,
    request: ReservationPaymentRequest,
  ): Observable<{ id: number }> {
    return this.api.post<{ id: number }, ReservationPaymentRequest>(
      this.endpoint(`tenant/reservations/${reservationId}/payments`),
      request,
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
