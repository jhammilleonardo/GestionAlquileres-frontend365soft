import { Component, Inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, X, User, Home, Calendar, Clock, DollarSign, MessageSquare, Wrench, AlertCircle, Send, Lock } from 'lucide-angular';
import {
    MaintenanceRequest,
    MaintenanceStatus,
    MaintenancePriority,
    MaintenanceCategory,
    MaintenanceMessage,
    MaintenanceStatusLabels,
    MaintenancePriorityLabels,
    MaintenanceCategoryLabels,
    PermissionToEnterLabels,
    CreateMessageDto
} from '../../../core/models/maintenance-request.model';
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
        MatCheckboxModule,
        MatProgressSpinnerModule,
        LucideAngularModule
    ],
    templateUrl: './request-detail.component.html',
    styleUrl: './request-detail.component.scss'
})
export class RequestDetailComponent implements OnInit {
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
    readonly Send = Send;
    readonly Lock = Lock;

    // Enums
    MaintenanceStatus = MaintenanceStatus;
    MaintenancePriority = MaintenancePriority;
    MaintenanceCategory = MaintenanceCategory;

    // Labels for display
    statusLabels = MaintenanceStatusLabels;
    priorityLabels = MaintenancePriorityLabels;
    categoryLabels = MaintenanceCategoryLabels;
    permissionLabels = PermissionToEnterLabels;

    // State
    request: MaintenanceRequest;
    messages = signal<MaintenanceMessage[]>([]);
    newMessage = signal('');
    isInternalNote = signal(false);
    isLoadingMessages = signal(false);
    isSendingMessage = signal(false);
    isUpdating = signal(false);

    // Staff members (TODO: should come from API)
    staffMembers = [
        { id: 1, name: 'Juan Electricista' },
        { id: 2, name: 'Pedro Técnico' },
        { id: 3, name: 'Miguel Constructor' },
        { id: 4, name: 'Control Plagas Pro' },
        { id: 5, name: 'Ana Plomera' }
    ];

    constructor(
        public dialogRef: MatDialogRef<RequestDetailComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { request: MaintenanceRequest },
        private maintenanceService: MaintenanceService
    ) {
        this.request = { ...data.request };
    }

    ngOnInit(): void {
        this.loadMessages();
    }

    loadMessages(): void {
        this.isLoadingMessages.set(true);
        this.maintenanceService.getMessages(this.request.id).subscribe({
            next: (messages) => {
                this.messages.set(messages);
                this.isLoadingMessages.set(false);
            },
            error: (error) => {
                console.error('Error loading messages:', error);
                this.isLoadingMessages.set(false);
            }
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    save(): void {
        this.isUpdating.set(true);
        this.maintenanceService.updateRequest(this.request.id, {
            status: this.request.status,
            priority: this.request.priority,
            assigned_to: this.request.assigned_to || undefined,
            due_date: this.request.due_date ? this.formatDateForBackend(this.request.due_date) : undefined
        }).subscribe({
            next: (updated) => {
                this.request = updated;
                this.isUpdating.set(false);
                this.dialogRef.close(this.request);
            },
            error: (error) => {
                console.error('Error updating request:', error);
                alert('Error al actualizar la solicitud');
                this.isUpdating.set(false);
            }
        });
    }

    delete(): void {
        if (confirm(`¿Estás seguro de eliminar la solicitud "${this.request.title}"?`)) {
            this.maintenanceService.deleteRequest(this.request.id).subscribe({
                next: () => {
                    this.dialogRef.close({ deleted: true });
                },
                error: (error) => {
                    console.error('Error deleting request:', error);
                    alert('Error al eliminar la solicitud');
                }
            });
        }
    }

    addMessage(): void {
        const messageText = this.newMessage().trim();
        if (!messageText) return;

        this.isSendingMessage.set(true);

        const dto: CreateMessageDto = {
            message: messageText,
            send_to_resident: !this.isInternalNote()
        };

        this.maintenanceService.addMessage(this.request.id, dto).subscribe({
            next: (message) => {
                // Add message to local list
                this.messages.update(msgs => [...msgs, message]);
                this.newMessage.set('');
                this.isInternalNote.set(false);
                this.isSendingMessage.set(false);
            },
            error: (error) => {
                console.error('Error adding message:', error);
                alert('Error al enviar el mensaje');
                this.isSendingMessage.set(false);
            }
        });
    }

    onStaffAssignment(staffId: number | null): void {
        if (!staffId) {
            this.request.assigned_to = null;
            return;
        }
        this.request.assigned_to = staffId;
    }

    updateStatus(status: MaintenanceStatus): void {
        this.request.status = status;
    }

    updatePriority(priority: MaintenancePriority): void {
        this.request.priority = priority;
    }

    getStatusColor(status: MaintenanceStatus): string {
        switch (status) {
            case MaintenanceStatus.NEW: return 'status-new';
            case MaintenanceStatus.IN_PROGRESS: return 'status-in-progress';
            case MaintenanceStatus.COMPLETED: return 'status-completed';
            case MaintenanceStatus.DEFERRED: return 'status-deferred';
            case MaintenanceStatus.CLOSED: return 'status-closed';
            default: return '';
        }
    }

    getPriorityColor(priority: MaintenancePriority): string {
        switch (priority) {
            case MaintenancePriority.LOW: return 'priority-low';
            case MaintenancePriority.NORMAL: return 'priority-normal';
            case MaintenancePriority.HIGH: return 'priority-high';
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

    formatDateForBackend(date: Date): string {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getStatusValues(): MaintenanceStatus[] {
        return Object.values(MaintenanceStatus);
    }

    getPriorityValues(): MaintenancePriority[] {
        return Object.values(MaintenancePriority);
    }

    isMessageInternal(message: MaintenanceMessage): boolean {
        return !message.send_to_resident;
    }

    getMessageIcon(message: MaintenanceMessage): any {
        return this.isMessageInternal(message) ? this.Lock : this.MessageSquare;
    }
}
