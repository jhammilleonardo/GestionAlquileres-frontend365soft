export enum UnitStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum RentalType {
  SHORT_TERM = 'SHORT_TERM',
  LONG_TERM = 'LONG_TERM',
  BOTH = 'BOTH',
}

export type BookingMode = 'instant' | 'request';

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

export interface Unit {
  id: number;
  property_id: number;
  unit_number: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  status: UnitStatus;
  rental_type?: RentalType;
  price_per_month?: number;
  price_per_night?: number;
  deposit_amount?: number;
  min_nights?: number;
  max_nights?: number;
  checkin_time?: string;
  checkout_time?: string;
  cleaning_fee?: number;
  weekly_discount_pct?: number;
  monthly_discount_pct?: number;
  weekend_adjustment_pct?: number;
  early_bird_min_days?: number;
  early_bird_discount_pct?: number;
  last_minute_max_days?: number;
  last_minute_adjustment_pct?: number;
  advance_notice_days?: number;
  max_advance_days?: number;
  booking_mode?: BookingMode;
  cancellation_policy?: CancellationPolicy;
  deposit_to_confirm_pct?: number | null;
  features?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UnitFormData {
  unit_number: string;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  status: UnitStatus;
  rental_type: RentalType | null;
  price_per_month: number | null;
  price_per_night: number | null;
  deposit_amount: number | null;
  cleaning_fee?: number;
  min_nights?: number;
  max_nights?: number;
  checkin_time?: string;
  checkout_time?: string;
  weekly_discount_pct?: number;
  monthly_discount_pct?: number;
  weekend_adjustment_pct?: number;
  early_bird_min_days?: number;
  early_bird_discount_pct?: number;
  last_minute_max_days?: number;
  last_minute_adjustment_pct?: number;
  advance_notice_days?: number;
  max_advance_days?: number;
  booking_mode?: BookingMode;
  cancellation_policy?: CancellationPolicy;
  deposit_to_confirm_pct?: number | null;
}

export interface UnitDialogData {
  propertyId: number;
  unit?: Unit;
}
