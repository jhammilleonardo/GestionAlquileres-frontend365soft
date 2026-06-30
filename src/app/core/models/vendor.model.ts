export enum VendorSpecialty {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  CLEANING = 'cleaning',
  PAINTING = 'painting',
  GENERAL = 'general',
  OTHER = 'other',
}

export interface Vendor {
  id: number;
  name: string;
  specialty: VendorSpecialty;
  specialty_other?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_id?: string | null;
  license_number?: string | null;
  insurance_expires_at?: string | null;
  rate_per_hour?: number | null;
  rate_flat?: number | null;
  notes?: string | null;
  is_active: boolean;
  average_rating?: number | null;
  total_orders?: number | null;
  open_orders?: number | null;
  completed_orders?: number | null;
  expenses_count?: number | null;
  pending_balance?: number | null;
  paid_total?: number | null;
  compliance_score?: number | null;
  has_account?: boolean;
}

export interface VendorHistoryItem {
  id: number;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  current_stage: string;
  vendor_rating: number | null;
  vendor_rating_comment: string | null;
  vendor_rated_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CreateVendorDto {
  name: string;
  specialty: VendorSpecialty;
  specialty_other?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  license_number?: string;
  insurance_expires_at?: string;
  rate_per_hour?: number;
  rate_flat?: number;
  notes?: string;
  is_active?: boolean;
}

export type UpdateVendorDto = Partial<CreateVendorDto>;

export interface VendorInvite {
  email: string;
  inviteUrl: string;
  expiresAt: string;
  created: boolean;
}

/** Perfil que el proveedor ve en su propio portal (`GET /:slug/vendor/me`). */
export interface VendorPortalProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  specialty: VendorSpecialty;
  specialty_other: string | null;
  tax_id: string | null;
  license_number: string | null;
  insurance_expires_at: string | null;
  rate_per_hour: number | null;
  rate_flat: number | null;
  average_rating: number | null;
  compliance_score: number | null;
  total_orders: number | null;
  open_orders: number | null;
  completed_orders: number | null;
  pending_balance: number | null;
  paid_total: number | null;
}

export interface ChangeVendorPasswordDto {
  currentPassword: string;
  newPassword: string;
}
