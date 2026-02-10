import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { LucideAngularModule, ArrowLeft, Wrench, Clock, Home, MessageSquare, Send, AlertCircle, CheckCircle2, FileText, User } from 'lucide-angular';
import { TenantMaintenanceService } from '../../../core/services/tenant-maintenance.service';
import { SlugService } from '../../../core/services/slug.service';
import {
    MaintenanceRequest,
    MaintenanceMessage,
    MaintenanceStatus,
    MaintenanceStatusLabels,
    MaintenancePriorityLabels,
    MaintenanceCategoryLabels,
    PermissionToEnterLabels
} from '../../../core/models/maintenance-request.model';

@Component({
    selector: 'app-tenant-request-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        LucideAngularModule
    ],
    template: `
        <div class="detail-container">
            <!-- Header -->
            <div class="page-header">
                <button mat-icon-button [routerLink]="mantenimientoUrl()" class="back-btn">
                    <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
                </button>
                <div>
                    <h1>Detalle de Solicitud</h1>
                    @if (request()) {
                        <p>{{ request()?.ticket_number }}</p>
                    }
                </div>
            </div>

            @if (isLoading()) {
                <div class="detail-grid">
                    <mat-card class="skeleton-main-card">
                        <div class="skeleton-header">
                            <div class="skeleton-badge"></div>
                            <div class="skeleton-badge"></div>
                        </div>
                        <div class="skeleton-line title"></div>
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                        <mat-divider></mat-divider>
                        <div class="skeleton-meta-grid">
                            <div class="skeleton-meta-item">
                                <div class="skeleton-icon"></div>
                                <div>
                                    <div class="skeleton-line short"></div>
                                    <div class="skeleton-line medium"></div>
                                </div>
                            </div>
                            <div class="skeleton-meta-item">
                                <div class="skeleton-icon"></div>
                                <div>
                                    <div class="skeleton-line short"></div>
                                    <div class="skeleton-line medium"></div>
                                </div>
                            </div>
                        </div>
                    </mat-card>

                    <mat-card class="skeleton-messages-card">
                        <div class="skeleton-line title"></div>
                        @for (i of [1,2]; track i) {
                            <div class="skeleton-message">
                                <div class="skeleton-line short"></div>
                                <div class="skeleton-line medium"></div>
                            </div>
                        }
                    </mat-card>
                </div>
            } @else if (request()) {
                <div class="detail-grid">
                    <!-- Main Info -->
                    <mat-card class="main-card">
                        <div class="card-header">
                            <div class="status-row">
                                <span class="status-badge" [class]="'status-' + request()!.status.toLowerCase()">
                                    {{ statusLabels[request()!.status] }}
                                </span>
                                <span class="priority-badge" [class]="'priority-' + request()!.priority.toLowerCase()">
                                    {{ priorityLabels[request()!.priority] }}
                                </span>
                            </div>
                            <span class="request-type">
                                {{ request()!.request_type === 'MAINTENANCE' ? 'Mantenimiento' : 'Consulta General' }}
                            </span>
                        </div>

                        <h2>{{ request()!.title }}</h2>

                        @if (request()!.category) {
                            <div class="category-tag">
                                <lucide-icon [img]="Wrench" [size]="16"></lucide-icon>
                                {{ categoryLabels[request()!.category!] }}
                            </div>
                        }

                        <p class="description">{{ request()!.description }}</p>

                        <mat-divider></mat-divider>

                        <!-- Meta Info -->
                        <div class="meta-grid">
                            @if (request()!.property) {
                                <div class="meta-item">
                                    <lucide-icon [img]="Home" [size]="18"></lucide-icon>
                                    <div>
                                        <span class="meta-label">Propiedad</span>
                                        <span class="meta-value">{{ request()!.property!.title }}</span>
                                    </div>
                                </div>
                            }
                            @if (request()!.contract) {
                                <div class="meta-item">
                                    <lucide-icon [img]="FileText" [size]="18"></lucide-icon>
                                    <div>
                                        <span class="meta-label">Contrato</span>
                                        <span class="meta-value">{{ request()!.contract!.contract_number }}</span>
                                    </div>
                                </div>
                            }
                            <div class="meta-item">
                                <lucide-icon [img]="Clock" [size]="18"></lucide-icon>
                                <div>
                                    <span class="meta-label">Creado</span>
                                    <span class="meta-value">{{ formatDate(request()!.created_at) }}</span>
                                </div>
                            </div>
                            @if (request()!.due_date) {
                                <div class="meta-item">
                                    <lucide-icon [img]="Clock" [size]="18"></lucide-icon>
                                    <div>
                                        <span class="meta-label">Fecha Limite</span>
                                        <span class="meta-value">{{ formatDate(request()!.due_date!) }}</span>
                                    </div>
                                </div>
                            }
                        </div>

                        <!-- Entry Permission (for maintenance) -->
                        @if (request()!.request_type === 'MAINTENANCE') {
                            <mat-divider></mat-divider>
                            <div class="entry-info">
                                <h4>Informacion de Acceso</h4>
                                <p><strong>Permiso de entrada:</strong> {{ permissionLabels[request()!.permission_to_enter] }}</p>
                                @if (request()!.has_pets) {
                                    <p class="pets-warning">
                                        <lucide-icon [img]="AlertCircle" [size]="16"></lucide-icon>
                                        Hay mascotas en la propiedad
                                    </p>
                                }
                                @if (request()!.entry_notes) {
                                    <p><strong>Notas:</strong> {{ request()!.entry_notes }}</p>
                                }
                            </div>
                        }
                    </mat-card>

                    <!-- Messages Section -->
                    <mat-card class="messages-card">
                        <div class="messages-header">
                            <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
                            <h3>Conversacion</h3>
                        </div>

                        @if (isLoadingMessages()) {
                            <div class="loading-messages">
                                <mat-spinner diameter="24"></mat-spinner>
                            </div>
                        } @else {
                            <div class="messages-list">
                                @if (messages().length === 0) {
                                    <div class="no-messages">
                                        <p>No hay mensajes aun</p>
                                    </div>
                                } @else {
                                    @for (message of messages(); track message.id) {
                                        <div class="message" [class.mine]="isMyMessage(message)">
                                            <div class="message-header">
                                                <span class="message-author">
                                                    {{ isMyMessage(message) ? 'Tu' : 'Administracion' }}
                                                </span>
                                                <span class="message-date">{{ formatMessageDate(message.created_at) }}</span>
                                            </div>
                                            <div class="message-content">{{ message.message }}</div>
                                            @if (message.attachments && message.attachments.length > 0) {
                                                <div class="message-attachments">
                                                    @for (att of message.attachments; track att.id) {
                                                        <a [href]="att.file_url" target="_blank" class="attachment">
                                                            {{ att.file_name }}
                                                        </a>
                                                    }
                                                </div>
                                            }
                                        </div>
                                    }
                                }
                            </div>

                            <!-- Send Message Form -->
                            @if (canSendMessage()) {
                                <div class="send-message">
                                    <mat-form-field appearance="outline" class="message-input">
                                        <mat-label>Escribe un mensaje...</mat-label>
                                        <textarea matInput [(ngModel)]="newMessage" rows="2"
                                            placeholder="Escribe tu mensaje aqui..."></textarea>
                                    </mat-form-field>
                                    <button mat-raised-button color="primary"
                                            (click)="sendMessage()"
                                            [disabled]="!newMessage.trim() || isSending()">
                                        @if (isSending()) {
                                            <mat-spinner diameter="18"></mat-spinner>
                                        } @else {
                                            <lucide-icon [img]="Send" [size]="18"></lucide-icon>
                                        }
                                        Enviar
                                    </button>
                                </div>
                            } @else {
                                <div class="messages-closed">
                                    <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                                    <p>Esta solicitud esta cerrada. No puedes enviar mas mensajes.</p>
                                </div>
                            }
                        }
                    </mat-card>
                </div>
            } @else {
                <div class="not-found">
                    <lucide-icon [img]="AlertCircle" [size]="48"></lucide-icon>
                    <h2>Solicitud no encontrada</h2>
                    <p>La solicitud que buscas no existe o no tienes acceso a ella.</p>
                    <button mat-raised-button color="primary" [routerLink]="mantenimientoUrl()">
                        Volver a Mis Solicitudes
                    </button>
                </div>
            }
        </div>
    `,
    styles: [`
        .detail-container {
            max-width: 1000px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .back-btn {
            color: #64748b;
        }

        .page-header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .page-header p {
            color: var(--mat-sys-primary);
            font-family: monospace;
            margin: 0;
        }

        .loading, .not-found {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px;
            color: #64748b;
            text-align: center;
        }

        .loading p, .not-found p {
            margin-top: 16px;
        }

        .not-found h2 {
            color: #1e293b;
            margin: 16px 0 8px;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 24px;
        }

        @media (max-width: 900px) {
            .detail-grid {
                grid-template-columns: 1fr;
            }

            .messages-card {
                order: 2;
            }
        }

        @media (max-width: 600px) {
            .main-card, .messages-card {
                padding: 20px;
            }

            .page-header h1 {
                font-size: 1.35rem;
            }

            .card-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .status-row {
                flex-wrap: wrap;
            }

            .meta-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }

            .send-message {
                flex-direction: column;
                align-items: stretch;
            }

            .send-message button {
                width: 100%;
                height: 48px;
            }

            .message-input {
                width: 100%;
            }
        }

        @media (max-width: 420px) {
            .main-card, .messages-card {
                padding: 16px;
            }

            .main-card h2 {
                font-size: 1.1rem;
            }

            .page-header {
                gap: 8px;
            }

            .messages-list {
                max-height: 300px;
            }
        }

        .main-card, .messages-card {
            padding: 24px;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .status-row {
            display: flex;
            gap: 8px;
        }

        .status-badge, .priority-badge {
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

        .priority-badge.priority-low { background: #d1fae5; color: #047857; }
        .priority-badge.priority-normal { background: #fef3c7; color: #b45309; }
        .priority-badge.priority-high { background: #fee2e2; color: #dc2626; }

        .request-type {
            font-size: 12px;
            color: #64748b;
        }

        .main-card h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 12px;
        }

        .category-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            background: var(--mat-sys-primary-container);
            color: var(--mat-sys-primary);
            border-radius: 20px;
            font-size: 13px;
            margin-bottom: 16px;
        }

        .description {
            color: #475569;
            line-height: 1.6;
            margin: 0 0 20px;
        }

        mat-divider {
            margin: 20px 0;
        }

        .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }

        .meta-item {
            display: flex;
            gap: 12px;
        }

        .meta-item lucide-icon {
            color: #64748b;
        }

        .meta-label {
            display: block;
            font-size: 12px;
            color: #64748b;
        }

        .meta-value {
            display: block;
            font-weight: 500;
            color: #1e293b;
        }

        .entry-info h4 {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 12px;
        }

        .entry-info p {
            margin: 8px 0;
            color: #475569;
        }

        .pets-warning {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #f59e0b !important;
        }

        /* Messages */
        .messages-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }

        .messages-header h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
        }

        .loading-messages {
            display: flex;
            justify-content: center;
            padding: 20px;
        }

        .messages-list {
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 16px;
        }

        .no-messages {
            text-align: center;
            padding: 40px;
            color: #64748b;
        }

        .message {
            padding: 12px;
            margin-bottom: 12px;
            background: #f8fafc;
            border-radius: 8px;
        }

        .message.mine {
            background: #eef2ff;
        }

        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .message-author {
            font-weight: 600;
            font-size: 13px;
            color: #1e293b;
        }

        .message-date {
            font-size: 12px;
            color: #64748b;
        }

        .message-content {
            color: #475569;
            line-height: 1.5;
        }

        .message-attachments {
            margin-top: 8px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .attachment {
            font-size: 12px;
            color: var(--mat-sys-primary);
            text-decoration: none;
        }

        .send-message {
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .message-input {
            flex: 1;
        }

        .send-message button {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 56px;
        }

        .messages-closed {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px;
            background: #f1f5f9;
            border-radius: 8px;
            color: #64748b;
        }

        .messages-closed p {
            margin: 0;
        }
    `]
})
export class TenantRequestDetailComponent implements OnInit {
    readonly ArrowLeft = ArrowLeft;
    readonly Wrench = Wrench;
    readonly Clock = Clock;
    readonly Home = Home;
    readonly MessageSquare = MessageSquare;
    readonly Send = Send;
    readonly AlertCircle = AlertCircle;
    readonly CheckCircle2 = CheckCircle2;
    readonly FileText = FileText;
    readonly User = User;

    private route = inject(ActivatedRoute);
    private maintenanceService = inject(TenantMaintenanceService);
    private slugService = inject(SlugService);

    statusLabels = MaintenanceStatusLabels;
    priorityLabels = MaintenancePriorityLabels;
    categoryLabels = MaintenanceCategoryLabels;
    permissionLabels = PermissionToEnterLabels;

    // URL para volver a la lista de mantenimiento
    mantenimientoUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento'));

    request = signal<MaintenanceRequest | null>(null);
    messages = signal<MaintenanceMessage[]>([]);
    isLoading = signal(true);
    isLoadingMessages = signal(false);
    isSending = signal(false);
    newMessage = '';

    // Store current user ID for message comparison
    private currentUserId: number | null = null;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadRequest(+id);
        }
    }

    loadRequest(id: number): void {
        this.isLoading.set(true);
        this.maintenanceService.getRequestById(id).subscribe({
            next: (request) => {
                this.request.set(request);
                this.currentUserId = request.tenant_id;
                this.isLoading.set(false);
                this.loadMessages(id);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    loadMessages(requestId: number): void {
        this.isLoadingMessages.set(true);
        this.maintenanceService.getMessages(requestId).subscribe({
            next: (messages) => {
                this.messages.set(messages);
                this.isLoadingMessages.set(false);
            },
            error: () => {
                this.isLoadingMessages.set(false);
            }
        });
    }

    sendMessage(): void {
        const message = this.newMessage.trim();
        if (!message || !this.request()) return;

        this.isSending.set(true);
        this.maintenanceService.sendMessage(this.request()!.id, { message }).subscribe({
            next: (msg) => {
                this.messages.update(msgs => [...msgs, msg]);
                this.newMessage = '';
                this.isSending.set(false);
            },
            error: () => {
                this.isSending.set(false);
            }
        });
    }

    canSendMessage(): boolean {
        const req = this.request();
        if (!req) return false;
        return ![MaintenanceStatus.COMPLETED, MaintenanceStatus.CLOSED].includes(req.status);
    }

    isMyMessage(message: MaintenanceMessage): boolean {
        return message.user_id === this.currentUserId;
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    formatMessageDate(date: Date): string {
        return new Date(date).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
