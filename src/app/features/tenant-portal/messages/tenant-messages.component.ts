import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule, MatFabButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { LucideAngularModule, MessageSquare, Send, Inbox, Archive, Plus, AlertCircle, User, ArrowLeft } from 'lucide-angular';
import { TenantMessageService } from '../../../core/services/tenant-message.service';
import { Message, MessagePriority, MessagePriorityLabels, MessageStatus } from '../../../core/models/message.model';

@Component({
    selector: 'app-tenant-messages',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        LucideAngularModule
    ],
    template: `
        <div class="messages-container">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <lucide-icon [img]="MessageSquare" [size]="32"></lucide-icon>
                    <div>
                        <h1>Mensajes</h1>
                        <p>Comunícate con tu administrador</p>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="stats-row">
                <mat-card class="stat-mini">
                    <lucide-icon [img]="Inbox" [size]="20"></lucide-icon>
                    <span>{{ messageService.messages().length }} Total</span>
                </mat-card>
                <mat-card class="stat-mini unread">
                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                    <span>{{ messageService.unreadCount() }} Sin Leer</span>
                </mat-card>
            </div>

            <div class="messages-layout">
                <!-- Messages List -->
                <div class="messages-list" [class.mobile-hidden]="showMobileDetail()">
                    <!-- Mobile New Message Button -->
                    <button mat-fab class="mobile-fab" color="primary" (click)="showNewMessage()">
                        <lucide-icon [img]="Plus" [size]="24"></lucide-icon>
                    </button>

                    <mat-card>
                        @if (messageService.isLoading()) {
                            @for (i of [1,2,3,4,5]; track i) {
                                <div class="skeleton-message-item">
                                    <div class="skeleton-avatar"></div>
                                    <div class="skeleton-message-content">
                                        <div class="skeleton-line short"></div>
                                        <div class="skeleton-line title"></div>
                                        <div class="skeleton-line medium"></div>
                                    </div>
                                </div>
                                <mat-divider></mat-divider>
                            }
                        } @else if (messageService.messages().length === 0) {
                            <div class="empty-state">
                                <lucide-icon [img]="MessageSquare" [size]="48"></lucide-icon>
                                <h3>No hay mensajes</h3>
                                <p>Comienza una conversación con tu administrador</p>
                                <button mat-raised-button color="primary" (click)="showNewMessage()">
                                    Nuevo Mensaje
                                </button>
                            </div>
                        } @else {
                            @for (message of messageService.messages(); track message.id) {
                                <div 
                                    class="message-item" 
                                    [class.unread]="message.status === 'UNREAD'"
                                    [class.selected]="selectedMessage()?.id === message.id"
                                    (click)="selectMessage(message)">
                                    <div class="message-avatar">
                                        <lucide-icon [img]="User" [size]="20"></lucide-icon>
                                    </div>
                                    <div class="message-preview">
                                        <div class="message-header">
                                            <span class="sender">{{ message.sender_name }}</span>
                                            <span class="date">{{ formatDate(message.created_at) }}</span>
                                        </div>
                                        <h4 class="subject">{{ message.subject }}</h4>
                                        <p class="preview">{{ message.body | slice:0:100 }}...</p>
                                    </div>
                                    @if (message.status === 'UNREAD') {
                                        <div class="unread-indicator"></div>
                                    }
                                </div>
                                <mat-divider></mat-divider>
                            }
                        }
                    </mat-card>
                </div>

                <!-- Message Detail / New Message -->
                <div class="message-detail" [class.mobile-visible]="showMobileDetail()">
                    @if (showNewMessageForm()) {
                        <mat-card class="compose-card">
                            <!-- Back button for mobile -->
                            <button mat-icon-button class="mobile-back-btn" (click)="backToList()">
                                <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
                            </button>
                            <h2>
                                <lucide-icon [img]="Send" [size]="24"></lucide-icon>
                                Nuevo Mensaje
                            </h2>

                            @if (messageService.error()) {
                                <div class="error-alert">
                                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                                    <span>{{ messageService.error() }}</span>
                                </div>
                            }

                            <form [formGroup]="messageForm" (ngSubmit)="sendMessage()">
                                <mat-form-field appearance="outline">
                                    <mat-label>Asunto</mat-label>
                                    <input 
                                        matInput 
                                        formControlName="subject" 
                                        placeholder="Escribe el asunto del mensaje"
                                        required>
                                    @if (messageForm.get('subject')?.hasError('required') && messageForm.get('subject')?.touched) {
                                        <mat-error>El asunto es requerido</mat-error>
                                    }
                                </mat-form-field>

                                <mat-form-field appearance="outline">
                                    <mat-label>Prioridad</mat-label>
                                    <mat-select formControlName="priority" required>
                                        @for (priority of priorities; track priority.value) {
                                            <mat-option [value]="priority.value">
                                                {{ priority.label }}
                                            </mat-option>
                                        }
                                    </mat-select>
                                </mat-form-field>

                                <mat-form-field appearance="outline">
                                    <mat-label>Mensaje</mat-label>
                                    <textarea 
                                        matInput 
                                        formControlName="body" 
                                        rows="8"
                                        placeholder="Escribe tu mensaje aquí..."
                                        required>
                                    </textarea>
                                    @if (messageForm.get('body')?.hasError('required') && messageForm.get('body')?.touched) {
                                        <mat-error>El mensaje es requerido</mat-error>
                                    }
                                </mat-form-field>

                                <div class="form-actions">
                                    <button 
                                        type="button" 
                                        mat-stroked-button 
                                        (click)="cancelNewMessage()">
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        mat-raised-button 
                                        color="primary"
                                        [disabled]="messageForm.invalid || messageService.isLoading()">
                                        <lucide-icon [img]="Send" [size]="18"></lucide-icon>
                                        Enviar
                                    </button>
                                </div>
                            </form>
                        </mat-card>
                    } @else if (selectedMessage()) {
                        <mat-card class="detail-card">
                            <!-- Back button for mobile -->
                            <button mat-icon-button class="mobile-back-btn" (click)="backToList()">
                                <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
                            </button>
                            <div class="detail-header">
                                <div class="sender-info">
                                    <div class="sender-avatar">
                                        <lucide-icon [img]="User" [size]="24"></lucide-icon>
                                    </div>
                                    <div>
                                        <h2>{{ selectedMessage()!.subject }}</h2>
                                        <p class="sender-name">
                                            De: {{ selectedMessage()!.sender_name }}
                                            <span class="sender-role">({{ selectedMessage()!.sender_role }})</span>
                                        </p>
                                        <p class="date">{{ formatDateLong(selectedMessage()!.created_at) }}</p>
                                    </div>
                                </div>
                                <div class="priority-badge" [class]="'priority-' + selectedMessage()!.priority.toLowerCase()">
                                    {{ messagePriorityLabels[selectedMessage()!.priority] }}
                                </div>
                            </div>

                            <mat-divider></mat-divider>

                            <div class="message-body">
                                {{ selectedMessage()!.body }}
                            </div>

                            <mat-divider></mat-divider>

                            <!-- Reply Form -->
                            <div class="reply-section">
                                <h3>Responder</h3>
                                <form [formGroup]="replyForm" (ngSubmit)="sendReply()">
                                    <mat-form-field appearance="outline">
                                        <mat-label>Tu respuesta</mat-label>
                                        <textarea 
                                            matInput 
                                            formControlName="body" 
                                            rows="4"
                                            placeholder="Escribe tu respuesta..."
                                            required>
                                        </textarea>
                                    </mat-form-field>

                                    <div class="reply-actions">
                                        <button 
                                            type="submit" 
                                            mat-raised-button 
                                            color="primary"
                                            [disabled]="replyForm.invalid || messageService.isLoading()">
                                            <lucide-icon [img]="Send" [size]="18"></lucide-icon>
                                            Enviar Respuesta
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </mat-card>
                    } @else {
                        <div class="no-selection">
                            <lucide-icon [img]="MessageSquare" [size]="64"></lucide-icon>
                            <h3>Selecciona un mensaje</h3>
                            <p>Elige un mensaje de la lista para verlo</p>
                        </div>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [`
        .messages-container {
            max-width: 1400px;
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
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
        }

        .stat-mini {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
        }

        .stat-mini.unread {
            color: var(--mat-sys-primary);
        }

        .messages-layout {
            display: grid;
            grid-template-columns: 400px 1fr;
            gap: 20px;
            min-height: 600px;
        }

        .messages-list mat-card {
            padding: 0;
            overflow-y: auto;
            max-height: 600px;
        }

        .message-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            cursor: pointer;
            position: relative;
            transition: background 0.2s;
        }

        .message-item:hover {
            background: #f8fafc;
        }

        .message-item.selected {
            background: #ede9fe;
        }

        .message-item.unread {
            background: #f0f9ff;
        }

        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--mat-sys-primary-container);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--mat-sys-primary);
            flex-shrink: 0;
        }

        .message-preview {
            flex: 1;
            min-width: 0;
        }

        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }

        .sender {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
        }

        .date {
            font-size: 12px;
            color: #94a3b8;
        }

        .subject {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .preview {
            font-size: 13px;
            color: #64748b;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .unread-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--mat-sys-primary);
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
        }

        .loading, .empty-state, .no-selection {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #64748b;
            text-align: center;
        }

        .empty-state lucide-icon, .no-selection lucide-icon {
            opacity: 0.5;
            margin-bottom: 16px;
        }

        .empty-state h3, .no-selection h3 {
            color: #1e293b;
            margin: 0 0 8px;
        }

        .empty-state p, .no-selection p {
            margin: 0 0 16px;
        }

        .compose-card, .detail-card {
            padding: 24px;
        }

        .compose-card h2, .detail-card h2 {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0 0 24px;
            color: #1e293b;
        }

        .compose-card form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .error-alert {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #fee2e2;
            color: #dc2626;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 14px;
        }

        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        button[type="submit"] {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }

        .sender-info {
            display: flex;
            gap: 16px;
        }

        .sender-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--mat-sys-primary-container);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--mat-sys-primary);
            flex-shrink: 0;
        }

        .sender-name {
            font-size: 14px;
            color: #64748b;
            margin: 4px 0;
        }

        .sender-role {
            font-weight: 600;
            color: var(--mat-sys-primary);
        }

        .priority-badge {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .priority-badge.priority-low { background: #d1fae5; color: #047857; }
        .priority-badge.priority-normal { background: #dbeafe; color: #1d4ed8; }
        .priority-badge.priority-high { background: #fef3c7; color: #b45309; }
        .priority-badge.priority-urgent { background: #fee2e2; color: #dc2626; }

        .message-body {
            padding: 24px 0;
            line-height: 1.6;
            color: #1e293b;
            white-space: pre-wrap;
        }

        .reply-section {
            padding-top: 20px;
        }

        .reply-section h3 {
            margin: 0 0 16px;
            color: #1e293b;
            font-size: 1rem;
        }

        .reply-section form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .reply-actions {
            display: flex;
            justify-content: flex-end;
        }

        .mobile-back-btn {
            display: none;
        }

        .mobile-hidden {
            display: block;
        }

        .mobile-visible {
            display: block;
        }

        .mobile-fab {
            display: none;
        }

        /* Skeleton Loaders */
        @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }

        .skeleton-message-item {
            display: flex;
            gap: 12px;
            padding: 16px;
        }

        .skeleton-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
            flex-shrink: 0;
        }

        .skeleton-message-content {
            flex: 1;
        }

        .skeleton-line {
            height: 14px;
            border-radius: 4px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
            margin-bottom: 8px;
        }

        .skeleton-line.title {
            height: 16px;
            width: 70%;
        }

        .skeleton-line.short {
            width: 30%;
        }

        .skeleton-line.medium {
            width: 85%;
        }

        @media (max-width: 1024px) {
            .messages-layout {
                grid-template-columns: 1fr;
                position: relative;
            }

            .messages-list {
                width: 100%;
            }

            .messages-list.mobile-hidden {
                display: none !important;
            }

            .messages-list mat-card {
                max-height: 400px;
            }

            .message-detail {
                display: none;
                min-height: 500px;
                width: 100%;
                position: relative;
            }

            .message-detail.mobile-visible {
                display: block;
            }

            .mobile-back-btn {
                display: flex;
                position: absolute;
                top: 16px;
                left: 16px;
                z-index: 10;
                background: var(--mat-sys-surface);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .compose-card,
            .detail-card {
                padding-top: 60px;
            }

            .mobile-fab {
                display: flex;
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 100;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .page-header button {
                display: none;
            }
        }

        @media (max-width: 768px) {
            .page-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .header-content h1 {
                font-size: 1.35rem;
            }

            .stats-row {
                flex-wrap: wrap;
            }

            .messages-list mat-card {
                max-height: 350px;
            }
        }

        @media (max-width: 600px) {
            .compose-card, .detail-card {
                padding: 20px;
            }

            .detail-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }

            .sender-info {
                width: 100%;
            }

            .priority-badge {
                align-self: flex-start;
            }

            .message-item {
                padding: 12px;
            }

            .message-avatar {
                width: 36px;
                height: 36px;
            }

            .sender-avatar {
                width: 48px;
                height: 48px;
            }
        }

        @media (max-width: 420px) {
            .header-content {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .header-content lucide-icon {
                display: none;
            }

            .compose-card h2 {
                font-size: 1.1rem;
            }

            .detail-card h2 {
                font-size: 1.1rem;
            }

            .form-actions {
                flex-direction: column-reverse;
            }

            .form-actions button {
                width: 100%;
            }

            .reply-actions button {
                width: 100%;
            }
        }
    `]
})
export class TenantMessagesComponent implements OnInit {
    readonly MessageSquare = MessageSquare;
    readonly Send = Send;
    readonly Inbox = Inbox;
    readonly Archive = Archive;
    readonly Plus = Plus;
    readonly AlertCircle = AlertCircle;
    readonly User = User;
    readonly ArrowLeft = ArrowLeft;

    private fb = inject(FormBuilder);
    messageService = inject(TenantMessageService);

    selectedMessage = signal<Message | null>(null);
    showNewMessageForm = signal(false);
    showMobileDetail = signal(false);

    messagePriorityLabels = MessagePriorityLabels;

    priorities = Object.keys(MessagePriority).map(key => ({
        value: MessagePriority[key as keyof typeof MessagePriority],
        label: MessagePriorityLabels[MessagePriority[key as keyof typeof MessagePriority]]
    }));

    messageForm = this.fb.group({
        subject: ['', Validators.required],
        body: ['', Validators.required],
        priority: [MessagePriority.NORMAL, Validators.required]
    });

    replyForm = this.fb.group({
        body: ['', Validators.required]
    });

    ngOnInit(): void {
        this.messageService.loadMessages();
    }

    showNewMessage(): void {
        this.showNewMessageForm.set(true);
        this.selectedMessage.set(null);
        this.showMobileDetail.set(true);
        this.messageForm.reset({ priority: MessagePriority.NORMAL });
    }

    cancelNewMessage(): void {
        this.showNewMessageForm.set(false);
        this.showMobileDetail.set(false);
    }

    selectMessage(message: Message): void {
        this.selectedMessage.set(message);
        this.showNewMessageForm.set(false);
        this.showMobileDetail.set(true);
        this.replyForm.reset();

        // Mark as read
        if (message.status === MessageStatus.UNREAD) {
            this.messageService.markAsRead(message.id).subscribe();
        }
    }

    backToList(): void {
        this.showMobileDetail.set(false);
        this.selectedMessage.set(null);
        this.showNewMessageForm.set(false);
    }

    sendMessage(): void {
        if (this.messageForm.invalid) {
            this.messageForm.markAllAsTouched();
            return;
        }

        const formValue = this.messageForm.value;
        this.messageService.createMessage({
            subject: formValue.subject!,
            body: formValue.body!,
            priority: formValue.priority!
        }).subscribe({
            next: () => {
                this.messageForm.reset({ priority: MessagePriority.NORMAL });
                this.showNewMessageForm.set(false);
                alert('Mensaje enviado exitosamente');
            },
            error: (error) => {
                console.error('Error sending message:', error);
            }
        });
    }

    sendReply(): void {
        if (this.replyForm.invalid || !this.selectedMessage()) {
            return;
        }

        this.messageService.replyMessage({
            body: this.replyForm.value.body!,
            parent_message_id: this.selectedMessage()!.id
        }).subscribe({
            next: () => {
                this.replyForm.reset();
                alert('Respuesta enviada exitosamente');
            },
            error: (error) => {
                console.error('Error sending reply:', error);
            }
        });
    }

    formatDate(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
    }

    formatDateLong(date: Date): string {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
