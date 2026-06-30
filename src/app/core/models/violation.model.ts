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
  IN_PROGRESS = 'in_progress',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ViolationFineStatus {
  NONE = 'none',
  CHARGED = 'charged',
  PAID = 'paid',
  WAIVED = 'waived',
}

export enum ViolationEventType {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  NOTIFIED = 'notified',
  FINE_CHARGED = 'fine_charged',
  FINE_WAIVED = 'fine_waived',
  FINE_PAID = 'fine_paid',
  EVIDENCE_ADDED = 'evidence_added',
  NOTE = 'note',
}

/** Estados que cuentan como cerrados (sin acciones pendientes). */
export const CLOSED_VIOLATION_STATUSES: readonly ViolationStatus[] = [
  ViolationStatus.RESOLVED,
  ViolationStatus.DISMISSED,
];

export interface ViolationEvent {
  id: number;
  event_type: ViolationEventType;
  note: string | null;
  metadata: Record<string, unknown>;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
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
  severity: ViolationSeverity;
  status: ViolationStatus;
  description: string;
  due_date?: string | null;
  evidence_photos: string[];
  fine_amount?: number | null;
  fine_currency?: string | null;
  fine_status: ViolationFineStatus;
  fine_paid_at?: string | null;
  notice_sent_at?: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolved_notes?: string | null;
  events?: ViolationEvent[];
}

export interface ViolationStats {
  total: number;
  open: number;
  overdue: number;
  escalated: number;
  fines_outstanding: number;
}

export interface CreateViolationDto {
  property_id: number;
  unit_id?: number;
  tenant_id: number;
  type: ViolationType;
  severity?: ViolationSeverity;
  description: string;
  due_date?: string;
  fine_amount?: number;
  evidence_photos?: string[];
}

export interface UpdateViolationStatusDto {
  status: ViolationStatus;
  resolved_notes?: string;
  due_date?: string;
}

export interface ChargeFineDto {
  amount: number;
  currency?: string;
  due_date?: string;
}

export interface PaginatedViolations {
  data: Violation[];
  total: number;
}

/** Indica si la infracción venció su plazo y sigue abierta. */
export function isViolationOverdue(violation: Violation): boolean {
  if (!violation.due_date) {
    return false;
  }
  if (CLOSED_VIOLATION_STATUSES.includes(violation.status)) {
    return false;
  }
  return new Date(violation.due_date) < new Date(new Date().toDateString());
}
