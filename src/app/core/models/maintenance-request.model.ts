// Enums matching backend structure
export enum MaintenanceStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DEFERRED = 'DEFERRED',
  CLOSED = 'CLOSED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export enum MaintenanceCategory {
  GENERAL = 'GENERAL',
  ACCESORIOS = 'ACCESORIOS',
  ELECTRICO = 'ELECTRICO',
  CLIMATIZACION = 'CLIMATIZACION',
  LLAVE_CERRADURA = 'LLAVE_CERRADURA',
  ILUMINACION = 'ILUMINACION',
  AFUERA = 'AFUERA',
  PLOMERIA = 'PLOMERIA',
}

export enum MaintenanceRequestType {
  MAINTENANCE = 'MAINTENANCE',
  GENERAL = 'GENERAL',
}

export enum PermissionToEnter {
  YES = 'YES',
  NO = 'NO',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

// Comment/Message model
export interface MaintenanceMessage {
  id: number;
  maintenance_request_id: number;
  user_id: number;
  message: string;
  send_to_resident: boolean; // true = visible to tenant, false = internal note
  created_at: Date;
  attachments: MaintenanceAttachment[];
}

// Attachment model
export interface MaintenanceAttachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string; // 'image' | 'pdf'
  created_at: Date;
}

// Contract reference model
export interface ContractReference {
  id: number;
  contract_number: string;
}

// Property reference model
export interface PropertyReference {
  id: number;
  title: string;
  status?: string;
  address?: string;
}

// Tenant reference model
export interface TenantReference {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

// Main maintenance request model matching backend
export interface MaintenanceRequest {
  id: number;
  ticket_number: string;
  request_type: MaintenanceRequestType;
  category: MaintenanceCategory | null;
  title: string;
  description: string;
  permission_to_enter: PermissionToEnter;
  has_pets: boolean;
  entry_notes: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  due_date: Date | null;
  assigned_to: number | null;
  vendor_id?: number | null;
  vendor_name?: string | null;
  vendor_rating?: number | null;
  vendor_rating_comment?: string | null;
  tenant_id: number;
  property_id: number;
  contract_id: number;

  // Related data
  property?: PropertyReference;
  contract?: ContractReference;
  tenant?: TenantReference;

  messages: MaintenanceMessage[];
  attachments: MaintenanceAttachment[];

  created_at: Date;
  updated_at: Date;
}

// Statistics model matching backend
export interface MaintenanceStats {
  total: number;
  byStatus: {
    NEW: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    DEFERRED: number;
    CLOSED: number;
  };
  byPriority: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
  };
  newRequests: number;
  urgentRequests: number;
}

// DTOs for creating/updating requests
// NOTE: Only tenants can create requests. Admin panel is view/update only.
// This DTO is kept for reference (tenant portal use)
export interface CreateMaintenanceDto {
  request_type: MaintenanceRequestType;
  category?: MaintenanceCategory;
  title: string;
  description: string;
  permission_to_enter?: PermissionToEnter;
  has_pets?: boolean;
  entry_notes?: string;
  files?: string[]; // Array of file URLs (max 3)
  contract_id?: number; // Optional - backend auto-detects active contract
  // NOTE: property_id and tenant_id are NOT sent - obtained from contract
}

export interface UpdateMaintenanceDto {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  due_date?: string; // YYYY-MM-DD format
  assigned_to?: number | null;
}

export interface CreateMessageDto {
  message: string;
  send_to_resident?: boolean; // default true
  files?: string[]; // Array of file URLs (max 3)
}

// Helper functions for display labels (Spanish translations)
export const MaintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.NEW]: 'Nuevo',
  [MaintenanceStatus.IN_PROGRESS]: 'En Progreso',
  [MaintenanceStatus.COMPLETED]: 'Completado',
  [MaintenanceStatus.DEFERRED]: 'Diferido',
  [MaintenanceStatus.CLOSED]: 'Cerrado',
};

export const MaintenancePriorityLabels: Record<MaintenancePriority, string> = {
  [MaintenancePriority.LOW]: 'Baja',
  [MaintenancePriority.NORMAL]: 'Normal',
  [MaintenancePriority.HIGH]: 'Alta',
};

export const MaintenanceCategoryLabels: Record<MaintenanceCategory, string> = {
  [MaintenanceCategory.GENERAL]: 'General',
  [MaintenanceCategory.ACCESORIOS]: 'Accesorios',
  [MaintenanceCategory.ELECTRICO]: 'Eléctrico',
  [MaintenanceCategory.CLIMATIZACION]: 'Climatización',
  [MaintenanceCategory.LLAVE_CERRADURA]: 'Llave/Cerradura',
  [MaintenanceCategory.ILUMINACION]: 'Iluminación',
  [MaintenanceCategory.AFUERA]: 'Áreas Exteriores',
  [MaintenanceCategory.PLOMERIA]: 'Plomería',
};

export const MaintenanceRequestTypeLabels: Record<MaintenanceRequestType, string> = {
  [MaintenanceRequestType.MAINTENANCE]: 'Mantenimiento',
  [MaintenanceRequestType.GENERAL]: 'Consulta General',
};

export const PermissionToEnterLabels: Record<PermissionToEnter, string> = {
  [PermissionToEnter.YES]: 'Sí, pueden entrar',
  [PermissionToEnter.NO]: 'No, debo estar presente',
  [PermissionToEnter.NOT_APPLICABLE]: 'No aplica',
};
