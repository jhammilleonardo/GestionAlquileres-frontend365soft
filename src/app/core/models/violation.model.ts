export enum ViolationType {
  NOISE = 'noise',
  PETS = 'pets',
  PARKING = 'parking',
  DAMAGE = 'damage',
  CLEANLINESS = 'cleanliness',
  OTHER = 'other',
}

export enum ViolationStatus {
  OPEN = 'open',
  NOTIFIED = 'notified',
  RESOLVED = 'resolved',
}

export interface Violation {
  id: number;
  property_id: number;
  property_title?: string;
  unit_id?: number | null;
  unit_number?: string | null;
  tenant_id: number;
  tenant_name?: string;
  tenant_email?: string;
  type: ViolationType;
  status: ViolationStatus;
  description: string;
  evidence_photos: string[];
  resolved_notes?: string | null;
  created_at: string;
}

export interface CreateViolationDto {
  property_id: number;
  unit_id?: number;
  tenant_id: number;
  type: ViolationType;
  description: string;
  evidence_photos?: string[];
}

export interface PaginatedViolations {
  data: Violation[];
  total: number;
}
