export interface PropertyFormAddressValue {
  address_type?: string;
  street_address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
}

export interface PropertyFormOwnerValue {
  name?: string;
  is_company?: boolean;
  company_name?: string;
  primary_email?: string;
  phone_number?: string;
  ownership_percentage?: number | string | null;
  is_primary?: boolean;
}

export type PropertyRentalType = 'SHORT_TERM' | 'LONG_TERM' | 'BOTH';

export type PropertyBookingMode = 'instant' | 'request';
export type PropertyCancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

/**
 * Config de corto plazo que el wizard captura y que alimenta la unidad por
 * defecto al crear la propiedad (los mismos campos que el formulario de unidad).
 */
export interface PropertyShortTermConfig {
  cleaning_fee?: number | string | null;
  min_nights?: number | string | null;
  max_nights?: number | string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  weekly_discount_pct?: number | string | null;
  monthly_discount_pct?: number | string | null;
  weekend_adjustment_pct?: number | string | null;
  early_bird_min_days?: number | string | null;
  early_bird_discount_pct?: number | string | null;
  last_minute_max_days?: number | string | null;
  last_minute_adjustment_pct?: number | string | null;
  advance_notice_days?: number | string | null;
  max_advance_days?: number | string | null;
  booking_mode?: PropertyBookingMode | null;
  cancellation_policy?: PropertyCancellationPolicy | null;
  deposit_to_confirm_pct?: number | string | null;
}

export interface PropertyFormValue extends PropertyShortTermConfig {
  title?: string;
  description?: string;
  property_type_id?: number | string | null;
  property_subtype_id?: number | string | null;
  active?: boolean;
  rental_type?: PropertyRentalType;
  monthly_rent?: number | string | null;
  price_per_night?: number | string | null;
  currency?: string;
  security_deposit_amount?: number | string | null;
  square_meters?: number | string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  parking_spaces?: number | string | null;
  year_built?: number | string | null;
  is_furnished?: boolean;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  max_occupants?: number | string | null;
  min_lease_months?: number | string | null;
  amenities?: string[];
  included_items?: string[];
  latitude?: number | string | null;
  longitude?: number | string | null;
  addresses?: PropertyFormAddressValue[];
  new_owners?: PropertyFormOwnerValue[];
}

export interface PropertyRulesPayload {
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  max_occupants?: number;
  min_lease_months?: number;
}

export interface PropertySavePayload {
  title: string;
  property_type_id: number;
  property_subtype_id: number;
  addresses: PropertyFormAddressValue[];
  description?: string;
  rental_type?: PropertyRentalType;
  security_deposit_amount?: number;
  monthly_rent?: number;
  price_per_night?: number;
  currency?: string;
  square_meters?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  year_built?: number;
  is_furnished?: boolean;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  included_items?: string[];
  property_rules?: PropertyRulesPayload;
  new_owners?: PropertyFormOwnerValue[];
  // Config de corto plazo (alimenta la unidad por defecto al crear)
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
  booking_mode?: string;
  cancellation_policy?: string;
  deposit_to_confirm_pct?: number;
}
