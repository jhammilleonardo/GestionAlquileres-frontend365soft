import { Injectable, signal, computed } from '@angular/core';
import {
    MaintenanceRequest,
    MaintenanceStatus,
    MaintenancePriority,
    MaintenanceCategory,
    MaintenanceComment,
    MaintenanceStats
} from '../models/maintenance-request.model';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    // Signal-based reactive state
    private requestsSignal = signal<MaintenanceRequest[]>(this.generateMockData());

    // Computed signals for filtered data
    requests = this.requestsSignal.asReadonly();

    stats = computed(() => this.calculateStats(this.requestsSignal()));

    constructor() { }

    // CRUD Operations
    getAllRequests(): MaintenanceRequest[] {
        return this.requestsSignal();
    }

    getRequestById(id: string): MaintenanceRequest | undefined {
        return this.requestsSignal().find(req => req.id === id);
    }

    createRequest(request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): MaintenanceRequest {
        const newRequest: MaintenanceRequest = {
            ...request,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            comments: []
        };

        this.requestsSignal.update(requests => [...requests, newRequest]);
        return newRequest;
    }

    updateRequest(id: string, updates: Partial<MaintenanceRequest>): MaintenanceRequest | undefined {
        const index = this.requestsSignal().findIndex(req => req.id === id);
        if (index === -1) return undefined;

        const updatedRequest = {
            ...this.requestsSignal()[index],
            ...updates,
            updatedAt: new Date()
        };

        this.requestsSignal.update(requests => {
            const newRequests = [...requests];
            newRequests[index] = updatedRequest;
            return newRequests;
        });

        return updatedRequest;
    }

    deleteRequest(id: string): boolean {
        const initialLength = this.requestsSignal().length;
        this.requestsSignal.update(requests => requests.filter(req => req.id !== id));
        return this.requestsSignal().length < initialLength;
    }

    // Status Management
    updateStatus(id: string, status: MaintenanceStatus): MaintenanceRequest | undefined {
        const updates: Partial<MaintenanceRequest> = { status };

        if (status === MaintenanceStatus.COMPLETED) {
            updates.completedAt = new Date();
        }

        return this.updateRequest(id, updates);
    }

    // Priority Management
    updatePriority(id: string, priority: MaintenancePriority): MaintenanceRequest | undefined {
        return this.updateRequest(id, { priority });
    }

    // Assignment
    assignToStaff(id: string, staffName: string, staffId: string): MaintenanceRequest | undefined {
        return this.updateRequest(id, {
            assignedTo: staffName,
            assignedToId: staffId,
            status: MaintenanceStatus.IN_PROGRESS
        });
    }

    unassignStaff(id: string): MaintenanceRequest | undefined {
        return this.updateRequest(id, {
            assignedTo: undefined,
            assignedToId: undefined
        });
    }

    // Comments
    addComment(requestId: string, comment: Omit<MaintenanceComment, 'id' | 'requestId' | 'createdAt'>): MaintenanceComment | undefined {
        const request = this.getRequestById(requestId);
        if (!request) return undefined;

        const newComment: MaintenanceComment = {
            ...comment,
            id: this.generateId(),
            requestId,
            createdAt: new Date()
        };

        request.comments.push(newComment);
        this.updateRequest(requestId, { comments: request.comments });

        return newComment;
    }

    // Filtering
    filterByStatus(status: MaintenanceStatus): MaintenanceRequest[] {
        return this.requestsSignal().filter(req => req.status === status);
    }

    filterByPriority(priority: MaintenancePriority): MaintenanceRequest[] {
        return this.requestsSignal().filter(req => req.priority === priority);
    }

    filterByCategory(category: MaintenanceCategory): MaintenanceRequest[] {
        return this.requestsSignal().filter(req => req.category === category);
    }

    filterByProperty(propertyId: string): MaintenanceRequest[] {
        return this.requestsSignal().filter(req => req.propertyId === propertyId);
    }

    filterByTenant(tenantId: string): MaintenanceRequest[] {
        return this.requestsSignal().filter(req => req.tenantId === tenantId);
    }

    // Search
    search(query: string): MaintenanceRequest[] {
        const lowerQuery = query.toLowerCase();
        return this.requestsSignal().filter(req =>
            req.title.toLowerCase().includes(lowerQuery) ||
            req.description.toLowerCase().includes(lowerQuery) ||
            req.propertyName.toLowerCase().includes(lowerQuery) ||
            req.propertyAddress.toLowerCase().includes(lowerQuery) ||
            req.tenantName.toLowerCase().includes(lowerQuery) ||
            req.id.toLowerCase().includes(lowerQuery)
        );
    }

    // Statistics
    private calculateStats(requests: MaintenanceRequest[]): MaintenanceStats {
        const stats: MaintenanceStats = {
            total: requests.length,
            pending: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            byPriority: {
                low: 0,
                medium: 0,
                high: 0,
                emergency: 0
            },
            byCategory: new Map(),
            averageResolutionDays: 0
        };

        let totalResolutionDays = 0;
        let completedCount = 0;

        requests.forEach(req => {
            // Count by status
            switch (req.status) {
                case MaintenanceStatus.PENDING:
                    stats.pending++;
                    break;
                case MaintenanceStatus.IN_PROGRESS:
                    stats.inProgress++;
                    break;
                case MaintenanceStatus.COMPLETED:
                    stats.completed++;
                    if (req.completedAt) {
                        const days = Math.floor((req.completedAt.getTime() - req.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                        totalResolutionDays += days;
                        completedCount++;
                    }
                    break;
                case MaintenanceStatus.CANCELLED:
                    stats.cancelled++;
                    break;
            }

            // Count by priority
            switch (req.priority) {
                case MaintenancePriority.LOW:
                    stats.byPriority.low++;
                    break;
                case MaintenancePriority.MEDIUM:
                    stats.byPriority.medium++;
                    break;
                case MaintenancePriority.HIGH:
                    stats.byPriority.high++;
                    break;
                case MaintenancePriority.EMERGENCY:
                    stats.byPriority.emergency++;
                    break;
            }

            // Count by category
            const categoryCount = stats.byCategory.get(req.category) || 0;
            stats.byCategory.set(req.category, categoryCount + 1);
        });

        stats.averageResolutionDays = completedCount > 0 ? Math.round(totalResolutionDays / completedCount) : 0;

        return stats;
    }

    // Utility Methods
    private generateId(): string {
        return 'MNT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Mock Data Generator
    private generateMockData(): MaintenanceRequest[] {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        return [
            {
                id: 'MNT-001',
                propertyId: 'PROP-101',
                propertyName: 'Apartamento Vista Mar',
                propertyAddress: 'Av. Costanera 1234, Apt 5B',
                tenantId: 'TEN-201',
                tenantName: 'María González',
                tenantEmail: 'maria.gonzalez@email.com',
                tenantPhone: '+1-555-0101',
                category: MaintenanceCategory.PLUMBING,
                priority: MaintenancePriority.HIGH,
                status: MaintenanceStatus.PENDING,
                title: 'Fuga de agua en el baño',
                description: 'Hay una fuga de agua debajo del lavabo del baño principal. El agua está goteando constantemente y está mojando el gabinete.',
                photos: [],
                permissionToEnter: true,
                preferredAccessTime: 'Lunes a Viernes, 9:00 AM - 5:00 PM',
                createdAt: yesterday,
                updatedAt: yesterday,
                comments: [
                    {
                        id: 'CMT-001',
                        requestId: 'MNT-001',
                        author: 'María González',
                        authorRole: 'tenant',
                        content: 'La fuga ha empeorado desde ayer. Por favor, atiendan pronto.',
                        createdAt: now,
                        isInternal: false
                    }
                ]
            },
            {
                id: 'MNT-002',
                propertyId: 'PROP-102',
                propertyName: 'Casa Los Pinos',
                propertyAddress: 'Calle Los Pinos 567',
                tenantId: 'TEN-202',
                tenantName: 'Carlos Rodríguez',
                tenantEmail: 'carlos.rodriguez@email.com',
                tenantPhone: '+1-555-0102',
                category: MaintenanceCategory.ELECTRICAL,
                priority: MaintenancePriority.EMERGENCY,
                status: MaintenanceStatus.IN_PROGRESS,
                title: 'Cortocircuito en la cocina',
                description: 'Los enchufes de la cocina dejaron de funcionar y huele a quemado. Necesito asistencia urgente.',
                photos: [],
                assignedTo: 'Juan Electricista',
                assignedToId: 'STAFF-301',
                permissionToEnter: true,
                preferredAccessTime: 'Cualquier momento',
                createdAt: threeDaysAgo,
                updatedAt: yesterday,
                comments: [
                    {
                        id: 'CMT-002',
                        requestId: 'MNT-002',
                        author: 'Admin',
                        authorRole: 'admin',
                        content: 'Asignado a Juan. Prioridad máxima.',
                        createdAt: threeDaysAgo,
                        isInternal: true
                    },
                    {
                        id: 'CMT-003',
                        requestId: 'MNT-002',
                        author: 'Juan Electricista',
                        authorRole: 'staff',
                        content: 'Visitaré la propiedad hoy a las 2 PM para evaluar el problema.',
                        createdAt: yesterday,
                        isInternal: false
                    }
                ]
            },
            {
                id: 'MNT-003',
                propertyId: 'PROP-103',
                propertyName: 'Departamento Centro',
                propertyAddress: 'Av. Principal 890, Piso 3',
                tenantId: 'TEN-203',
                tenantName: 'Ana Martínez',
                tenantEmail: 'ana.martinez@email.com',
                tenantPhone: '+1-555-0103',
                category: MaintenanceCategory.HVAC,
                priority: MaintenancePriority.MEDIUM,
                status: MaintenanceStatus.COMPLETED,
                title: 'Aire acondicionado no enfría',
                description: 'El aire acondicionado está encendido pero no enfría. Solo sale aire caliente.',
                photos: [],
                assignedTo: 'Pedro Técnico',
                assignedToId: 'STAFF-302',
                permissionToEnter: true,
                preferredAccessTime: 'Martes y Jueves, 10:00 AM - 2:00 PM',
                createdAt: twoWeeksAgo,
                updatedAt: weekAgo,
                completedAt: weekAgo,
                estimatedCost: 150,
                actualCost: 120,
                comments: [
                    {
                        id: 'CMT-004',
                        requestId: 'MNT-003',
                        author: 'Pedro Técnico',
                        authorRole: 'staff',
                        content: 'Problema resuelto. Era el filtro sucio y bajo nivel de refrigerante. Recargado y limpiado.',
                        createdAt: weekAgo,
                        isInternal: false
                    }
                ]
            },
            {
                id: 'MNT-004',
                propertyId: 'PROP-104',
                propertyName: 'Casa Jardines del Sol',
                propertyAddress: 'Urbanización Jardines, Lote 15',
                tenantId: 'TEN-204',
                tenantName: 'Roberto Silva',
                tenantEmail: 'roberto.silva@email.com',
                tenantPhone: '+1-555-0104',
                category: MaintenanceCategory.APPLIANCES,
                priority: MaintenancePriority.LOW,
                status: MaintenanceStatus.PENDING,
                title: 'Refrigerador hace ruido extraño',
                description: 'El refrigerador funciona pero hace un ruido fuerte, especialmente de noche.',
                photos: [],
                permissionToEnter: false,
                preferredAccessTime: 'Sábados, 9:00 AM - 12:00 PM (debo estar presente)',
                createdAt: threeDaysAgo,
                updatedAt: threeDaysAgo,
                comments: []
            },
            {
                id: 'MNT-005',
                propertyId: 'PROP-105',
                propertyName: 'Loft Moderno',
                propertyAddress: 'Calle Arte 456, Loft 2A',
                tenantId: 'TEN-205',
                tenantName: 'Laura Fernández',
                tenantEmail: 'laura.fernandez@email.com',
                tenantPhone: '+1-555-0105',
                category: MaintenanceCategory.STRUCTURAL,
                priority: MaintenancePriority.HIGH,
                status: MaintenanceStatus.IN_PROGRESS,
                title: 'Grieta en la pared del dormitorio',
                description: 'Apareció una grieta vertical en la pared del dormitorio principal. Parece estar creciendo.',
                photos: [],
                assignedTo: 'Miguel Constructor',
                assignedToId: 'STAFF-303',
                permissionToEnter: true,
                preferredAccessTime: 'Lunes a Viernes, 8:00 AM - 6:00 PM',
                createdAt: weekAgo,
                updatedAt: threeDaysAgo,
                estimatedCost: 500,
                comments: [
                    {
                        id: 'CMT-005',
                        requestId: 'MNT-005',
                        author: 'Miguel Constructor',
                        authorRole: 'staff',
                        content: 'Inspeccioné la grieta. Es superficial, no estructural. Procederé con la reparación esta semana.',
                        createdAt: threeDaysAgo,
                        isInternal: false
                    }
                ]
            },
            {
                id: 'MNT-006',
                propertyId: 'PROP-106',
                propertyName: 'Apartamento Bella Vista',
                propertyAddress: 'Torre Bella Vista, Piso 12, Apt 1201',
                tenantId: 'TEN-206',
                tenantName: 'Diego Morales',
                tenantEmail: 'diego.morales@email.com',
                tenantPhone: '+1-555-0106',
                category: MaintenanceCategory.PAINTING,
                priority: MaintenancePriority.LOW,
                status: MaintenanceStatus.PENDING,
                title: 'Pintura descascarada en el balcón',
                description: 'La pintura del balcón se está descascarando debido a la humedad. Necesita repintado.',
                photos: [],
                permissionToEnter: true,
                preferredAccessTime: 'Cualquier día laborable',
                createdAt: weekAgo,
                updatedAt: weekAgo,
                comments: []
            },
            {
                id: 'MNT-007',
                propertyId: 'PROP-107',
                propertyName: 'Casa Familiar Robles',
                propertyAddress: 'Barrio Los Robles, Casa 23',
                tenantId: 'TEN-207',
                tenantName: 'Patricia Vargas',
                tenantEmail: 'patricia.vargas@email.com',
                tenantPhone: '+1-555-0107',
                category: MaintenanceCategory.PEST_CONTROL,
                priority: MaintenancePriority.MEDIUM,
                status: MaintenanceStatus.IN_PROGRESS,
                title: 'Problema de hormigas en la cocina',
                description: 'Hay una invasión de hormigas en la cocina, especialmente cerca del fregadero.',
                photos: [],
                assignedTo: 'Control Plagas Pro',
                assignedToId: 'STAFF-304',
                permissionToEnter: true,
                preferredAccessTime: 'Miércoles, 1:00 PM - 4:00 PM',
                createdAt: threeDaysAgo,
                updatedAt: yesterday,
                estimatedCost: 80,
                comments: [
                    {
                        id: 'CMT-006',
                        requestId: 'MNT-007',
                        author: 'Control Plagas Pro',
                        authorRole: 'staff',
                        content: 'Programada visita para mañana. Aplicaremos tratamiento especializado.',
                        createdAt: yesterday,
                        isInternal: false
                    }
                ]
            },
            {
                id: 'MNT-008',
                propertyId: 'PROP-108',
                propertyName: 'Estudio Urbano',
                propertyAddress: 'Calle Urbana 789, Estudio 4C',
                tenantId: 'TEN-208',
                tenantName: 'Andrés Castillo',
                tenantEmail: 'andres.castillo@email.com',
                tenantPhone: '+1-555-0108',
                category: MaintenanceCategory.SECURITY,
                priority: MaintenancePriority.HIGH,
                status: MaintenanceStatus.PENDING,
                title: 'Cerradura de puerta principal no funciona',
                description: 'La cerradura de la puerta principal está atascada. No puedo cerrar con llave desde afuera.',
                photos: [],
                permissionToEnter: true,
                preferredAccessTime: 'Urgente - Cualquier momento',
                createdAt: yesterday,
                updatedAt: yesterday,
                comments: []
            }
        ];
    }
}
