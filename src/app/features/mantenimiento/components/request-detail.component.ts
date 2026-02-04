import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { LucideAngularModule, X, User, Home, Calendar, Clock, DollarSign, MessageSquare, Wrench, AlertCircle } from 'lucide-angular';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, MaintenanceCategory } from '../../../core/models/maintenance-request.model';
import { MaintenanceService } from '../../../core/services/maintenance.service';

@Component({
    selector: 'app-request-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatDividerModule,
        MatChipsModule,
        LucideAngularModule
    ],
    templateUrl: './request-detail.component.html',
    styleUrl: './request-detail.component.scss'
})
export class RequestDetailComponent {
    // Icons
    readonly X = X;
    readonly User = User;
    readonly Home = Home;
    readonly Calendar = Calendar;
    readonly Clock = Clock;
    readonly DollarSign = DollarSign;
    readonly MessageSquare = MessageSquare;
    readonly Wrench = Wrench;
    readonly AlertCircle = AlertCircle;

    // Enums
    MaintenanceStatus = MaintenanceStatus;
    MaintenancePriority = MaintenancePriority;
    MaintenanceCategory = MaintenanceCategory;

    // State
    request: MaintenanceRequest;
    newComment = signal('');
    isInternalNote = signal(false);

    // Staff members (mock data)
    staffMembers = [
        { id: 'STAFF-301', name: 'Juan Electricista' },
        { id: 'STAFF-302', name: 'Pedro Técnico' },
        { id: 'STAFF-303', name: 'Miguel Constructor' },
        { id: 'STAFF-304', name: 'Control Plagas Pro' },
        { id: 'STAFF-305', name: 'Ana Plomera' }
    ];

    constructor(
        public dialogRef: MatDialogRef<RequestDetailComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { request: MaintenanceRequest },
        private maintenanceService: MaintenanceService
    ) {
        this.request = { ...data.request };
    }

    close(): void {
        this.dialogRef.close();
    }

    save(): void {
        this.maintenanceService.updateRequest(this.request.id, this.request);
        this.dialogRef.close(this.request);
    }

    delete(): void {
        if (confirm(`¿Estás seguro de eliminar la solicitud "${this.request.title}"?`)) {
            this.maintenanceService.deleteRequest(this.request.id);
            this.dialogRef.close({ deleted: true });
        }
    }

    addComment(): void {
        const commentText = this.newComment().trim();
        if (!commentText) return;

        this.maintenanceService.addComment(this.request.id, {
            author: 'Admin',
            authorRole: 'admin',
            content: commentText,
            isInternal: this.isInternalNote()
        });

        // Refresh request data
        const updated = this.maintenanceService.getRequestById(this.request.id);
        if (updated) {
            this.request = { ...updated };
        }

        this.newComment.set('');
        this.isInternalNote.set(false);
    }

    assignStaff(staffId: string, staffName: string): void {
        this.maintenanceService.assignToStaff(this.request.id, staffName, staffId);
        this.request.assignedTo = staffName;
        this.request.assignedToId = staffId;
    }

    onStaffAssignment(staffId: string): void {
        if (!staffId) {
            this.unassignStaff();
            return;
        }
        const staff = this.staffMembers.find(s => s.id === staffId);
        if (staff) {
            this.assignStaff(staff.id, staff.name);
        }
    }

    unassignStaff(): void {
        this.maintenanceService.unassignStaff(this.request.id);
        this.request.assignedTo = undefined;
        this.request.assignedToId = undefined;
    }

    updateStatus(status: MaintenanceStatus): void {
        this.maintenanceService.updateStatus(this.request.id, status);
        this.request.status = status;
    }

    updatePriority(priority: MaintenancePriority): void {
        this.maintenanceService.updatePriority(this.request.id, priority);
        this.request.priority = priority;
    }

    getStatusColor(status: MaintenanceStatus): string {
        switch (status) {
            case MaintenanceStatus.PENDING: return 'status-pending';
            case MaintenanceStatus.IN_PROGRESS: return 'status-in-progress';
            case MaintenanceStatus.COMPLETED: return 'status-completed';
            case MaintenanceStatus.CANCELLED: return 'status-cancelled';
            default: return '';
        }
    }

    getPriorityColor(priority: MaintenancePriority): string {
        switch (priority) {
            case MaintenancePriority.LOW: return 'priority-low';
            case MaintenancePriority.MEDIUM: return 'priority-medium';
            case MaintenancePriority.HIGH: return 'priority-high';
            case MaintenancePriority.EMERGENCY: return 'priority-emergency';
            default: return '';
        }
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusValues(): MaintenanceStatus[] {
        return Object.values(MaintenanceStatus);
    }

    getPriorityValues(): MaintenancePriority[] {
        return Object.values(MaintenancePriority);
    }
}
