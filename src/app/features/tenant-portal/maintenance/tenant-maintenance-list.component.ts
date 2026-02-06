import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { LucideAngularModule, Plus, Search, Wrench, Clock, Home, MessageSquare, AlertCircle, CheckCircle2, XCircle } from 'lucide-angular';
import { TenantMaintenanceService } from '../../../core/services/tenant-maintenance.service';
import {
    MaintenanceStatus,
    MaintenanceStatusLabels,
    MaintenancePriorityLabels,
    MaintenanceCategoryLabels
} from '../../../core/models/maintenance-request.model';

@Component({
    selector: 'app-tenant-maintenance-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        LucideAngularModule
    ],
    template: `
        <div class="maintenance-container">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <lucide-icon [img]="Wrench" [size]="32"></lucide-icon>
                    <div>
                        <h1>Mis Solicitudes</h1>
                        <p>Gestiona tus solicitudes de mantenimiento</p>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="stats-row">
                <mat-chip-listbox [value]="selectedStatus" (change)="onStatusChange($event)">
                    <mat-chip-option value="all" [selected]="selectedStatus === 'all'">
                        Todas ({{ maintenanceService.stats()?.total || 0 }})
                    </mat-chip-option>
                    <mat-chip-option value="NEW">
                        Nuevas
                    </mat-chip-option>
                    <mat-chip-option value="IN_PROGRESS">
                        En Proceso ({{ maintenanceService.stats()?.active || 0 }})
                    </mat-chip-option>
                    <mat-chip-option value="COMPLETED">
                        Completadas ({{ maintenanceService.stats()?.completed || 0 }})
                    </mat-chip-option>
                </mat-chip-listbox>
            </div>

            <!-- Search -->
            <mat-form-field appearance="outline" class="search-field">
                <lucide-icon matIconPrefix [img]="Search" [size]="20"></lucide-icon>
                <mat-label>Buscar solicitudes...</mat-label>
                <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()">
            </mat-form-field>

            <!-- Loading -->
            @if (maintenanceService.isLoading()) {
                <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Cargando solicitudes...</p>
                </div>
            }

            <!-- Empty State -->
            @else if (filteredRequests.length === 0) {
                <div class="empty-state">
                    <lucide-icon [img]="Wrench" [size]="64"></lucide-icon>
                    <h2>No hay solicitudes</h2>
                    @if (searchQuery || selectedStatus !== 'all') {
                        <p>No se encontraron solicitudes con los filtros aplicados</p>
                        <button mat-stroked-button (click)="clearFilters()">Limpiar Filtros</button>
                    } @else {
                        <p>Aun no has creado ninguna solicitud de mantenimiento</p>
                        <button mat-raised-button color="primary" routerLink="/portal/mantenimiento/nueva">
                            Crear Primera Solicitud
                        </button>
                    }
                </div>
            }

            <!-- Requests List -->
            @else {
                <div class="requests-grid">
                    @for (request of filteredRequests; track request.id) {
                        <mat-card class="request-card" [routerLink]="['/portal/mantenimiento', request.id]">
                            <div class="card-header">
                                <span class="ticket">{{ request.ticket_number }}</span>
                                <span class="status-badge" [class]="'status-' + request.status.toLowerCase()">
                                    {{ statusLabels[request.status] }}
                                </span>
                            </div>

                            <h3 class="request-title">{{ request.title }}</h3>

                            @if (request.category) {
                                <div class="category">
                                    <lucide-icon [img]="Wrench" [size]="14"></lucide-icon>
                                    {{ categoryLabels[request.category] }}
                                </div>
                            }

                            <p class="description">{{ request.description | slice:0:100 }}{{ request.description.length > 100 ? '...' : '' }}</p>

                            <div class="card-footer">
                                <div class="meta">
                                    <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                                    {{ formatDate(request.created_at) }}
                                </div>
                                @if (request.messages && request.messages.length > 0) {
                                    <div class="meta">
                                        <lucide-icon [img]="MessageSquare" [size]="14"></lucide-icon>
                                        {{ request.messages.length }}
                                    </div>
                                }
                                <div class="priority" [class]="'priority-' + request.priority.toLowerCase()">
                                    @if (request.priority === 'HIGH') {
                                        <lucide-icon [img]="AlertCircle" [size]="14"></lucide-icon>
                                    }
                                    {{ priorityLabels[request.priority] }}
                                </div>
                            </div>
                        </mat-card>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        .maintenance-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 16px;
        }

        .header-content {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-content h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .header-content p {
            color: #64748b;
            margin: 0;
        }

        .stats-row {
            margin-bottom: 16px;
        }

        .search-field {
            width: 100%;
            max-width: 400px;
            margin-bottom: 24px;
        }

        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px;
            color: #64748b;
        }

        .loading p {
            margin-top: 16px;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #64748b;
        }

        .empty-state lucide-icon {
            opacity: 0.5;
            margin-bottom: 16px;
        }

        .empty-state h2 {
            color: #1e293b;
            margin: 0 0 8px;
        }

        .empty-state p {
            margin: 0 0 24px;
        }

        .requests-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
        }

        .request-card {
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .request-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .ticket {
            font-family: monospace;
            font-size: 12px;
            color: var(--mat-sys-primary);
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        .status-badge.status-new { background: #dbeafe; color: #1d4ed8; }
        .status-badge.status-in_progress { background: #fef3c7; color: #b45309; }
        .status-badge.status-completed { background: #d1fae5; color: #047857; }
        .status-badge.status-deferred { background: #fed7aa; color: #c2410c; }
        .status-badge.status-closed { background: #e2e8f0; color: #475569; }

        .request-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px;
        }

        .category {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: var(--mat-sys-primary);
            margin-bottom: 8px;
        }

        .description {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 16px;
        }

        .card-footer {
            display: flex;
            align-items: center;
            gap: 16px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
        }

        .meta {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #64748b;
        }

        .priority {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .priority-low { color: #10b981; }
        .priority-normal { color: #f59e0b; }
        .priority-high { color: #ef4444; }
    `]
})
export class TenantMaintenanceListComponent implements OnInit {
    readonly Plus = Plus;
    readonly Search = Search;
    readonly Wrench = Wrench;
    readonly Clock = Clock;
    readonly Home = Home;
    readonly MessageSquare = MessageSquare;
    readonly AlertCircle = AlertCircle;
    readonly CheckCircle2 = CheckCircle2;
    readonly XCircle = XCircle;

    maintenanceService = inject(TenantMaintenanceService);

    statusLabels = MaintenanceStatusLabels;
    priorityLabels = MaintenancePriorityLabels;
    categoryLabels = MaintenanceCategoryLabels;

    searchQuery = '';
    selectedStatus: string = 'all';

    get filteredRequests() {
        let requests = this.maintenanceService.requests();

        // Filter by status
        if (this.selectedStatus !== 'all') {
            requests = requests.filter(r => r.status === this.selectedStatus);
        }

        // Filter by search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            requests = requests.filter(r =>
                r.title.toLowerCase().includes(query) ||
                r.description.toLowerCase().includes(query) ||
                r.ticket_number.toLowerCase().includes(query)
            );
        }

        return requests;
    }

    ngOnInit(): void {
        this.maintenanceService.loadMyRequests();
        this.maintenanceService.loadStats();
    }

    onStatusChange(event: MatChipListboxChange): void {
        this.selectedStatus = event.value;
    }

    filterByStatus(status: string): void {
        this.selectedStatus = status || 'all';
    }

    onSearch(): void {
        // Filtering is done reactively via the getter
    }

    clearFilters(): void {
        this.searchQuery = '';
        this.selectedStatus = 'all';
    }

    formatDate(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} dias`;

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
    }
}
