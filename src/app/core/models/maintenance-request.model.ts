export enum MaintenanceStatus {
    PENDING = 'Pendiente',
    IN_PROGRESS = 'En Progreso',
    COMPLETED = 'Completado',
    CANCELLED = 'Cancelado'
}

export enum MaintenancePriority {
    LOW = 'Baja',
    MEDIUM = 'Media',
    HIGH = 'Alta',
    EMERGENCY = 'Emergencia'
}

export enum MaintenanceCategory {
    PLUMBING = 'Plomería',
    ELECTRICAL = 'Eléctrico',
    HVAC = 'Climatización',
    APPLIANCES = 'Electrodomésticos',
    STRUCTURAL = 'Estructural',
    PAINTING = 'Pintura',
    CARPENTRY = 'Carpintería',
    CLEANING = 'Limpieza',
    PEST_CONTROL = 'Control de Plagas',
    LANDSCAPING = 'Jardinería',
    SECURITY = 'Seguridad',
    OTHER = 'Otro'
}

export interface MaintenanceComment {
    id: string;
    requestId: string;
    author: string;
    authorRole: 'admin' | 'tenant' | 'staff';
    content: string;
    createdAt: Date;
    isInternal: boolean; // Internal notes only visible to admin/staff
}

export interface MaintenanceRequest {
    id: string;
    propertyId: string;
    propertyName: string;
    propertyAddress: string;
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string;
    category: MaintenanceCategory;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    title: string;
    description: string;
    photos: string[]; // URLs to photos
    assignedTo?: string; // Staff member name
    assignedToId?: string; // Staff member ID
    preferredAccessTime?: string;
    permissionToEnter: boolean;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    estimatedCost?: number;
    actualCost?: number;
    comments: MaintenanceComment[];
}

export interface MaintenanceStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    byPriority: {
        low: number;
        medium: number;
        high: number;
        emergency: number;
    };
    byCategory: Map<MaintenanceCategory, number>;
    averageResolutionDays: number;
}
