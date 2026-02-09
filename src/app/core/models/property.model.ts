// ==================== PROPERTY MODELS ====================

export interface Property {
  id: number;
  title: string;
  description: string;
  property_type_id: number;
  property_subtype_id: number;
  status: PropertyStatus;
  active: boolean;
  latitude?: number;
  longitude?: number;
  images: string[];
  total_area?: number;
  built_area?: number;
  monthly_rent_amount?: number;
  security_deposit_amount?: number;
  availability_date?: Date | string;
  amenities: string[];
  included_items: string[];
  account_number?: string;
  account_type?: string;
  account_holder_name?: string;
  created_at: Date;
  updated_at: Date;
  property_type: PropertyType;
  property_subtype: PropertySubtype;
  addresses: PropertyAddress[];
  owners?: PropertyOwner[];
}

export interface PropertyType {
  id: number;
  name: string;
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
  INACTIVO = 'INACTIVO'
}

// ==================== FILTERS ====================

export interface PropertyFilters {
  status?: PropertyStatus | string;
  property_type_id?: number;
  property_subtype_id?: number;
  city?: string;
  country?: string;
  search?: string;
  sort_by?: SortOption;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export enum SortOption {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  TITLE = 'title'
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
