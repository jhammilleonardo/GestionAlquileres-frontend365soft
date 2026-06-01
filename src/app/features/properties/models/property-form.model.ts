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

export interface PropertyFormValue {
  title?: string;
  description?: string;
  property_type_id?: number | string | null;
  property_subtype_id?: number | string | null;
  active?: boolean;
  monthly_rent?: number | string | null;
  currency?: string;
  security_deposit_amount?: number | string | null;
  account_number?: string;
  account_type?: string;
  account_holder_name?: string;
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
  security_deposit_amount?: number;
  account_number?: string;
  account_type?: string;
  account_holder_name?: string;
  monthly_rent?: number;
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
}
