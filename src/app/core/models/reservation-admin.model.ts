/**
 * Modelo de reservas para la gestión administrativa (back-office).
 * Espeja el contrato del backend `:slug/admin/reservations`.
 */

export enum ReservationStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  NO_SHOW = 'no_show',
  DECLINED = 'declined',
}

export enum ReservationAction {
  CONFIRM = 'confirm',
  DECLINE = 'decline',
  CANCEL = 'cancel',
  CHECK_IN = 'check_in',
  NO_SHOW = 'no_show',
  COMPLETE = 'complete',
}

export interface AdminReservation {
  id: number;
  property_id: number;
  unit_id: number;
  tenant_id: number;
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
  property_name: string | null;
  unit_number: string | null;
  tenant_name: string | null;
}

export interface PaginatedReservations {
  data: AdminReservation[];
  total: number;
  page: number;
  limit: number;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  property_id?: number;
  unit_id?: number;
  checkin_from?: string;
  checkin_to?: string;
  page?: number;
  limit?: number;
}

/**
 * Acciones de gestión válidas por estado (espeja `RESERVATION_TRANSITIONS` del
 * backend). Fuente única de verdad para habilitar botones en la UI; el backend
 * vuelve a validar la transición, esto sólo evita acciones imposibles.
 */
export const RESERVATION_ACTIONS_BY_STATUS: Readonly<
  Record<ReservationStatus, readonly ReservationAction[]>
> = {
  [ReservationStatus.PENDING_PAYMENT]: [ReservationAction.CANCEL],
  [ReservationStatus.PENDING]: [
    ReservationAction.CONFIRM,
    ReservationAction.DECLINE,
    ReservationAction.CANCEL,
  ],
  [ReservationStatus.CONFIRMED]: [
    ReservationAction.CHECK_IN,
    ReservationAction.NO_SHOW,
    ReservationAction.CANCEL,
  ],
  [ReservationStatus.IN_PROGRESS]: [ReservationAction.COMPLETE],
  [ReservationStatus.COMPLETED]: [],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.EXPIRED]: [],
  [ReservationStatus.NO_SHOW]: [],
  [ReservationStatus.DECLINED]: [],
};

export interface ReservationAnalytics {
  from: string;
  to: string;
  range_nights: number;
  short_term_units: number;
  available_nights: number;
  booked_nights: number;
  /** Ocupación 0–1. */
  occupancy_rate: number;
  revenue: number;
  currency: string;
  adr: number;
  reservations_by_status: Record<string, number>;
}

export interface SeasonRule {
  id: number;
  unit_id: number;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number | null;
  min_nights: number | null;
}

export interface CreateSeasonRule {
  name: string;
  start_date: string;
  end_date: string;
  price_per_night?: number;
  min_nights?: number;
}

export interface AdminReview {
  id: number;
  reservation_id: number;
  property_id: number;
  unit_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  property_name: string | null;
  unit_number: string | null;
  guest_name: string | null;
}

export interface CalendarSyncSource {
  id: number;
  unit_id: number;
  name: string;
  url: string;
  last_synced_at: string | null;
}

export interface CreateSyncSource {
  name: string;
  url: string;
}
