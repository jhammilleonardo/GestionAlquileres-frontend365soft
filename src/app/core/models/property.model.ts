// ==================== PROPERTY MODELS ====================

/** Unidad con configuración de alquiler (incl. corto plazo) expuesta en el catálogo. */
export interface CatalogUnit {
  id: number;
  unit_number: string;
  rental_type?: string | null;
  status?: string | null;
  price_per_night?: number | null;
  cleaning_fee?: number | null;
  min_nights?: number | null;
  max_nights?: number | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  deposit_amount?: number | null;
  deposit_to_confirm_pct?: number | null;
}

export interface Property {
  id: number;
  title: string;
  units?: CatalogUnit[];
  description?: string;
  property_type_id: number;
  property_subtype_id: number;
  status: PropertyStatus;
  active?: boolean;
  rental_type?: string | null;

  // Ubicación
  latitude?: number;
  longitude?: number;

  // Imágenes
  images?: string[] | Record<number, string>; // Puede ser array o objeto {0: "path", 1: "path"}
  first_image?: string; // Para el listado

  // Medidas y características (nombres actualizados según API)
  square_meters?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  year_built?: number;
  is_furnished?: boolean;

  // Financiero (nombres actualizados según API)
  monthly_rent?: number;
  min_price_per_night?: number | null;
  currency?: string;
  security_deposit_amount?: number;
  account_number?: string;
  account_type?: string;
  account_holder_name?: string;

  // Reglas de la propiedad
  property_rules?: {
    pets_allowed?: boolean;
    smoking_allowed?: boolean;
    max_occupants?: number;
    min_lease_months?: number;
  };

  // Amenidades
  amenities?: string[];
  included_items?: string[];

  // Campos legacy (mantener por compatibilidad)
  total_area?: number;
  built_area?: number;
  monthly_rent_amount?: number;
  availability_date?: Date | string;

  // Timestamps
  created_at?: Date;
  updated_at?: Date;

  // Relaciones
  property_type?: PropertyType;
  property_subtype?: PropertySubtype;
  addresses?: PropertyAddress[];
  owners?: PropertyOwner[];

  // Campos computados del listado (opcional)
  property_type_name?: string;
  property_type_code?: string;
  property_subtype_name?: string;
  property_subtype_code?: string;
  total_units?: number | null;
  available_units?: number | null;
  available_short_term_units?: number | null;
  available_long_term_units?: number | null;
}

/**
 * Clave de traducción (global) para el tipo de alquiler de una propiedad.
 * Corto plazo (por noche), largo plazo (mensual) o ambos.
 */
export function rentalTypeLabelKey(rentalType?: string | null): string {
  switch ((rentalType ?? 'LONG_TERM').toUpperCase()) {
    case 'SHORT_TERM':
      return 'rentalType.SHORT_TERM';
    case 'BOTH':
      return 'rentalType.BOTH';
    default:
      return 'rentalType.LONG_TERM';
  }
}

export interface PropertyType {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface PropertySubtype {
  id: number;
  name: string;
  description?: string;
  property_type_id?: number;
}

export interface PropertyAddress {
  id?: number;
  property_id?: number;
  address_type: string;
  street_address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
}

export interface PropertyOwner {
  id: number;
  name: string;
  company_name?: string;
  is_company: boolean;
  primary_email: string;
  phone_number: string;
  secondary_email?: string;
  secondary_phone?: string;
  notes?: string;
  ownership_percentage?: number;
  is_primary: boolean;
  created_at: Date;
}

// ==================== ENUMS ====================

export enum PropertyStatus {
  DISPONIBLE = 'DISPONIBLE',
  OCUPADO = 'OCUPADO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  RESERVADO = 'RESERVADO',
  INACTIVO = 'INACTIVO',
}

// ==================== FILTERS ====================

export interface PropertyFilters {
  status?: PropertyStatus | string;
  property_type_id?: number;
  property_subtype_id?: number;
  city?: string;
  country?: string;
  search?: string;
  sort_by?: SortOption | string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  rental_type?: 'SHORT_TERM' | 'LONG_TERM' | 'BOTH' | 'short_term' | 'long_term' | 'any';
}

export enum SortOption {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  TITLE = 'title',
  PRICE = 'monthly_rent',
  AVAILABILITY = 'status',
}

// ==================== RENTAL APPLICATION ====================

export interface RentalApplication {
  propertyId: number;
  applicantInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentAddress: string;
    employmentStatus: string;
    monthlyIncome: number;
    moveInDate: Date;
  };
  additionalInfo: string;
}

// ==================== TENANT/ORGANIZATION ====================

export interface TenantInfo {
  id: number;
  company_name: string;
  slug: string;
  currency: string;
  locale: string;
  is_active: boolean;
  logo_url?: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== PAGINATED RESPONSE ====================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
