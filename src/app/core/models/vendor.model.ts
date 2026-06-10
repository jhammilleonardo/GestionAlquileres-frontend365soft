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
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  rate_per_hour?: number | null;
  rate_flat?: number | null;
  notes?: string | null;
  is_active: boolean;
  average_rating?: number | null;
  total_orders?: number | null;
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
  phone?: string;
  email?: string;
  address?: string;
  rate_per_hour?: number;
  rate_flat?: number;
  notes?: string;
  is_active?: boolean;
}

export type UpdateVendorDto = Partial<CreateVendorDto>;
