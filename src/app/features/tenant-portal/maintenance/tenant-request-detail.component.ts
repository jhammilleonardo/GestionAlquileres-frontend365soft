import { Component, inject, signal, OnInit, OnDestroy, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { LucideAngularModule, ArrowLeft, Wrench, Clock, Home, MessageSquare, Send, AlertCircle, CheckCircle2, FileText, User, Link, Paperclip, X, Image } from 'lucide-angular';
import { environment } from '../../../../environments/environment';
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
        MatChipsModule,
        LucideAngularModule
    ],
    template: `
        <div class="detail-container">

            <!-- ── PAGE HEADER ── -->
            <div class="page-header">
                <button mat-icon-button [routerLink]="mantenimientoUrl()" class="back-btn">
                    <lucide-icon [img]="ArrowLeft" [size]="22"></lucide-icon>
                </button>
                <div class="page-header-text">
                    <h1>Detalle de Solicitud</h1>
                    @if (request()) {
                        <span class="ticket-chip">{{ request()?.ticket_number }}</span>
                    }
                </div>
            </div>

            <!-- ── LOADING ── -->
            @if (isLoading()) {
                <div class="detail-grid">
                    <div class="skeleton-main">
                        <div class="sk-banner"></div>
                        <div class="sk-body">
                            <div class="sk-line w60"></div>
                            <div class="sk-line w40"></div>
                            <div class="sk-line w100"></div>
                            <div class="sk-line w80"></div>
                        </div>
                    </div>
                    <div class="skeleton-conv">
                        <div class="sk-line w40"></div>
                        @for (i of [1,2,3]; track i) {
                            <div class="sk-msg"></div>
                        }
                    </div>
                </div>

            <!-- ── CONTENT ── -->
            } @else if (request()) {
                <div class="detail-grid">

                    <!-- ════ LEFT ════ -->
                    <div class="rd-left">

                        <!-- Status Banner -->
                        <div class="status-banner" [class]="'banner-' + request()!.status.toLowerCase()">
                            <div class="banner-body">
                                <div class="banner-icon">
                                    <lucide-icon [img]="Wrench" [size]="22"></lucide-icon>
                                </div>
                                <div class="banner-text">
                                    <span class="banner-type">
                                        {{ request()!.request_type === 'MAINTENANCE' ? 'Mantenimiento' : 'Consulta General' }}
                                    </span>
                                    <span class="banner-title">{{ request()!.title }}</span>
                                </div>
                            </div>
                            <div class="banner-badges">
                                <mat-chip-set>
                                    <mat-chip
                                        [style.background]="getStatusBgColor(request()!.status)"
                                        [style.color]="getStatusTextColor(request()!.status)"
                                        [style.font-weight]="'700'"
                                        [style.font-size]="'12px'">
                                        {{ statusLabels[request()!.status] }}
                                    </mat-chip>
                                    <mat-chip
                                        [style.background]="getPriorityBgColor(request()!.priority)"
                                        [style.color]="getPriorityTextColor(request()!.priority)"
                                        [style.font-weight]="'700'"
                                        [style.font-size]="'12px'">
                                        {{ priorityLabels[request()!.priority] }}
                                    </mat-chip>
                                </mat-chip-set>
                            </div>
                        </div>

                        <!-- Content Card -->
                        <div class="content-card">

                            <!-- Category chip -->
                            @if (request()!.category) {
                                <div class="cc-row">
                                    <mat-chip-set>
                                        <mat-chip>
                                            <lucide-icon matChipAvatar [img]="Link" [size]="13"></lucide-icon>
                                            {{ categoryLabels[request()!.category!] }}
                                        </mat-chip>
                                    </mat-chip-set>
                                </div>
                            }

                            <!-- Description -->
                            <div class="cc-section">
                                <div class="cc-label">Descripción</div>
                                <div class="cc-desc">{{ request()!.description }}</div>
                            </div>

                            <!-- Information meta-cards -->
                            <div class="cc-section">
                                <div class="cc-label">Información</div>
                                <div class="meta-grid">
                                    @if (request()!.property) {
                                        <div class="meta-card">
                                            <div class="meta-icon home">
                                                <lucide-icon [img]="Home" [size]="16"></lucide-icon>
                                            </div>
                                            <div class="meta-text">
                                                <span class="meta-lbl">Propiedad</span>
                                                <span class="meta-val">{{ request()!.property!.title }}</span>
                                            </div>
                                        </div>
                                    }
                                    @if (request()!.contract) {
                                        <div class="meta-card">
                                            <div class="meta-icon contract">
                                                <lucide-icon [img]="FileText" [size]="16"></lucide-icon>
                                            </div>
                                            <div class="meta-text">
                                                <span class="meta-lbl">Contrato</span>
                                                <span class="meta-val">{{ request()!.contract!.contract_number }}</span>
                                            </div>
                                        </div>
                                    }
                                    <div class="meta-card">
                                        <div class="meta-icon created">
                                            <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                                        </div>
                                        <div class="meta-text">
                                            <span class="meta-lbl">Creado el</span>
                                            <span class="meta-val">{{ formatDate(request()!.created_at) }}</span>
                                        </div>
                                    </div>
                                    @if (request()!.due_date) {
                                        <div class="meta-card">
                                            <div class="meta-icon updated">
                                                <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                                            </div>
                                            <div class="meta-text">
                                                <span class="meta-lbl">Fecha Límite</span>
                                                <span class="meta-val">{{ formatDate(request()!.due_date!) }}</span>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>

                            <!-- Access row -->
                            @if (request()!.request_type === 'MAINTENANCE') {
                                <div class="cc-section access-section">
                                    <div class="cc-label">Acceso</div>
                                    <div class="access-row">
                                        <span class="access-key">Permiso de entrada</span>
                                        <span class="access-val">{{ permissionLabels[request()!.permission_to_enter] }}</span>
                                    </div>
                                    @if (request()!.has_pets) {
                                        <div class="pets-warning">
                                            <lucide-icon [img]="AlertCircle" [size]="14"></lucide-icon>
                                            Hay mascotas en la propiedad
                                        </div>
                                    }
                                    @if (request()!.entry_notes) {
                                        <div class="access-row">
                                            <span class="access-key">Notas</span>
                                            <span class="access-val">{{ request()!.entry_notes }}</span>
                                        </div>
                                    }
                                </div>
                            }

                        </div>
                    </div><!-- /rd-left -->

                    <!-- ════ RIGHT — CONVERSATION ════ -->
                    <div class="conv-panel">

                        <!-- Header -->
                        <div class="conv-header">
                            <div class="conv-header-icon">
                                <lucide-icon [img]="MessageSquare" [size]="16"></lucide-icon>
                            </div>
                            <span class="conv-title">Conversación</span>
                            @if (messages().length > 0) {
                                <span class="conv-badge">{{ messages().length }}</span>
                            }
                        </div>

                        <!-- Loading -->
                        @if (isLoadingMessages()) {
                            <div class="conv-loading">
                                <div class="sk-msg-item right"></div>
                                <div class="sk-msg-item left"></div>
                                <div class="sk-msg-item right"></div>
                                <div class="sk-msg-item left"></div>
                            </div>
                        } @else {

                            <!-- Messages list -->
                            <div class="conv-messages-wrap">
                            <div class="conv-messages" #msgContainer (scroll)="onMessagesScroll($event)">
                                @if (messages().length === 0) {
                                    <div class="conv-empty">
                                        <div class="conv-empty-icon">
                                            <lucide-icon [img]="MessageSquare" [size]="28"></lucide-icon>
                                        </div>
                                        <p class="conv-empty-title">Sin mensajes aún</p>
                                        <p class="conv-empty-sub">Inicia la conversación con el equipo de administración</p>
                                    </div>
                                } @else {
                                    @for (message of messages(); track message.id) {
                                        @if (isFirstPollingNew(message)) {
                                            <div class="new-polling-divider">
                                                <div class="new-polling-line"></div>
                                                <span class="new-polling-label">↓ mensajes nuevos</span>
                                                <div class="new-polling-line"></div>
                                            </div>
                                        }
                                        @if (isFirstUnread(message)) {
                                            <div class="unread-divider">
                                                <div class="unread-line"></div>
                                                <span class="unread-label">{{ unreadCountFromHere }} mensaje{{ unreadCountFromHere !== 1 ? 's' : '' }} no leído{{ unreadCountFromHere !== 1 ? 's' : '' }}</span>
                                                <div class="unread-line"></div>
                                            </div>
                                        }
                                        <div class="msg-row" [class.msg-mine]="isMyMessage(message)">
                                            @if (!isMyMessage(message)) {
                                                <div class="msg-avatar admin-avatar">A</div>
                                            }
                                            <div class="msg-group">
                                                <span class="msg-sender" [class.msg-sender-mine]="isMyMessage(message)">
                                                    {{ isMyMessage(message) ? 'Tú' : 'Administración' }}
                                                </span>
                                                <div class="msg-bubble" [class.bubble-mine]="isMyMessage(message)">
                                                    {{ message.message }}
                                                </div>
                                                @if (message.attachments && message.attachments.length > 0) {
                                                    <div class="msg-attachments" [class.msg-attachments-mine]="isMyMessage(message)">
                                                        @for (att of message.attachments; track att.id) {
                                                            <a [href]="getFileUrl(att.file_url)" target="_blank" class="att-chip" [class.att-chip-mine]="isMyMessage(message)">
                                                                <lucide-icon [img]="isImageAttachment(att.file_type) ? Image : FileText" [size]="12"></lucide-icon>
                                                                <span>{{ att.file_name }}</span>
                                                            </a>
                                                        }
                                                    </div>
                                                }
                                                <span class="msg-time">{{ formatMessageDate(message.created_at) }}</span>
                                            </div>
                                            @if (isMyMessage(message)) {
                                                <div class="msg-avatar tenant-avatar">Tú</div>
                                            }
                                        </div>
                                    }
                                }
                            </div>
                            </div><!-- /conv-messages-wrap -->

                            @if (newMessagesCount() > 0) {
                                <div class="new-msg-bar">
                                    <button class="new-msg-btn" (click)="scrollToNewMessages()">
                                        ↓ {{ newMessagesCount() }} mensaje{{ newMessagesCount() !== 1 ? 's' : '' }} nuevo{{ newMessagesCount() !== 1 ? 's' : '' }}
                                    </button>
                                </div>
                            }

                            <!-- Input -->
                            @if (canSendMessage()) {
                                <div class="conv-input-wrapper">
                                    <!-- Input oculto para archivos -->
                                    <input #fileInputRef type="file" multiple
                                           accept="image/jpeg,image/png,image/webp,application/pdf"
                                           style="display:none"
                                           (change)="onFileSelected($event)">

                                    <!-- Preview de archivos seleccionados -->
                                    @if (selectedFiles().length > 0) {
                                        <div class="file-preview">
                                            @for (file of selectedFiles(); track $index; let i = $index) {
                                                <div class="file-chip">
                                                    <lucide-icon [img]="Paperclip" [size]="11"></lucide-icon>
                                                    <span>{{ file.name }}</span>
                                                    <button class="file-remove" (click)="removeFile(i)">
                                                        <lucide-icon [img]="X" [size]="10"></lucide-icon>
                                                    </button>
                                                </div>
                                            }
                                        </div>
                                    }

                                    <div class="conv-input-area">
                                        <button class="attach-btn"
                                                type="button"
                                                (click)="fileInputRef.click()"
                                                [disabled]="selectedFiles().length >= 3"
                                                title="Adjuntar archivo (máx. 3)">
                                            <lucide-icon [img]="Paperclip" [size]="15"></lucide-icon>
                                            @if (selectedFiles().length > 0) {
                                                <span class="attach-count">{{ selectedFiles().length }}/3</span>
                                            }
                                        </button>
                                        <textarea class="conv-textarea"
                                            [(ngModel)]="newMessage"
                                            rows="1"
                                            placeholder="Escribe tu mensaje..."
                                            (keydown.enter)="$event.preventDefault(); sendMessage()"></textarea>
                                        <button class="send-btn"
                                                (click)="sendMessage()"
                                                [disabled]="!newMessage.trim() || isSending()">
                                            @if (isSending()) {
                                                <mat-spinner diameter="16"></mat-spinner>
                                            } @else {
                                                <lucide-icon [img]="Send" [size]="16"></lucide-icon>
                                            }
                                        </button>
                                    </div>
                                </div>
                            } @else {
                                <div class="conv-closed">
                                    <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                                    <p>Esta solicitud está cerrada</p>
                                </div>
                            }
                        }
                    </div><!-- /conv-panel -->

                </div>

            <!-- ── NOT FOUND ── -->
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
        /* ── Container ── */
        .detail-container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 4px;
        }

        /* ── Page Header ── */
        .page-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }
        .back-btn { color: #64748b; }
        .page-header-text h1 {
            font-size: 1.45rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 2px;
        }
        .ticket-chip {
            display: inline-block;
            font-size: 12px;
            font-family: monospace;
            color: var(--mat-sys-primary);
            background: #eff6ff;
            padding: 2px 8px;
            border-radius: 6px;
        }

        /* ── Grid ── */
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 360px;
            gap: 20px;
            align-items: start;
        }
        @media (max-width: 900px) {
            .detail-grid { grid-template-columns: 1fr; }
        }

        /* ── Left column ── */
        .rd-left { display: flex; flex-direction: column; gap: 0; }

        /* ── Status Banner ── */
        .status-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 22px;
            border-radius: 14px 14px 0 0;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #fff;
            gap: 12px;
            flex-wrap: wrap;
        }
        .status-banner.banner-new        { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .status-banner.banner-in_progress { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .status-banner.banner-completed   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .status-banner.banner-deferred    { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .status-banner.banner-closed      { background: linear-gradient(135deg, #3b82f6, #2563eb); }

        .banner-body {
            display: flex;
            align-items: center;
            gap: 14px;
            flex: 1;
            min-width: 0;
        }
        .banner-icon {
            width: 42px; height: 42px;
            border-radius: 50%;
            background: rgba(255,255,255,.2);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .banner-text { display: flex; flex-direction: column; min-width: 0; }
        .banner-type {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .6px;
            opacity: .85;
        }
        .banner-title {
            font-size: 1.1rem;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .banner-badges { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        .b-status, .b-priority {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(255,255,255,.2);
            color: #fff;
        }
        /* coloured overrides */
        .b-status.status-new         { background: #dbeafe; color: #1d4ed8; }
        .b-status.status-in_progress { background: #fef3c7; color: #b45309; }
        .b-status.status-completed   { background: #d1fae5; color: #047857; }
        .b-status.status-deferred    { background: #fed7aa; color: #c2410c; }
        .b-status.status-closed      { background: #e2e8f0; color: #475569; }
        .b-priority.priority-low      { background: #d1fae5; color: #047857; }
        .b-priority.priority-normal   { background: #fef3c7; color: #b45309; }
        .b-priority.priority-high     { background: #fee2e2; color: #dc2626; }

        /* ── Content card ── */
        .content-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 14px 14px;
            padding: 20px 22px 22px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        /* Category chip */
        .cc-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .cat-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 12px;
            background: #eff6ff;
            color: var(--mat-sys-primary, #2563eb);
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            border: 1px solid #bfdbfe;
        }

        /* Section labels */
        .cc-section { display: flex; flex-direction: column; gap: 8px; }
        .cc-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .6px;
            color: #94a3b8;
        }
        .cc-desc {
            color: #475569;
            font-size: 14px;
            line-height: 1.65;
            padding-left: 12px;
            border-left: 3px solid #e2e8f0;
        }

        /* Info Meta grid */
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        @media (max-width: 600px) { .meta-grid { grid-template-columns: 1fr; } }
        .meta-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        .meta-icon {
            width: 36px; height: 36px;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .meta-icon.home     { background: #eff6ff; color: #3b82f6; }
        .meta-icon.contract { background: #f5f3ff; color: #7c3aed; }
        .meta-icon.created  { background: #ecfdf5; color: #10b981; }
        .meta-icon.updated  { background: #fff7ed; color: #f59e0b; }
        .meta-text { display: flex; flex-direction: column; min-width: 0; }
        .meta-lbl { font-size: 11px; color: #94a3b8; font-weight: 500; }
        .meta-val { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Access section */
        .access-section { gap: 8px; }
        .access-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }
        .access-key { font-size: 13px; color: #64748b; }
        .access-val { font-size: 13px; font-weight: 600; color: #1e293b; }
        .pets-warning {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #f59e0b;
            padding: 8px 12px;
            background: #fffbeb;
            border-radius: 8px;
            border: 1px solid #fde68a;
        }

        /* ════ CONVERSATION PANEL ════ */
        .conv-panel {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            display: flex;
            flex-direction: column;
            height: 640px;
            overflow: hidden; /* clips rounded corners */
            box-shadow: 0 2px 12px rgba(0,0,0,.06);
        }

        /* Header */
        .conv-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 18px;
            border-bottom: 1px solid #e2e8f0;
            flex-shrink: 0;
            background: #fff;
        }
        .conv-header-icon {
            width: 30px; height: 30px;
            border-radius: 8px;
            background: #eff6ff;
            color: #3b82f6;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .conv-title { font-size: 14px; font-weight: 700; color: #1e293b; flex: 1; }
        .conv-badge {
            background: #3b82f6;
            color: #fff;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            min-width: 22px;
            text-align: center;
        }

        /* Loading skeletons */
        .conv-loading {
            flex: 1;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background: #f8fafc;
        }
        .sk-msg-item {
            height: 48px;
            width: 65%;
            border-radius: 14px;
            background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite;
        }
        .sk-msg-item.right { align-self: flex-end; }
        .sk-msg-item.left  { align-self: flex-start; }

        /* Messages area */
        .conv-messages-wrap {
            flex: 1;
            min-height: 0;
            position: relative;
        }
        .conv-messages {
            position: absolute;
            inset: 0;
            overflow-y: auto;
            padding: 16px 14px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background: #f8fafc;
        }
        .conv-messages::-webkit-scrollbar { width: 4px; }
        .conv-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .new-msg-bar {
            display: flex;
            justify-content: center;
            padding: 6px 12px;
            flex-shrink: 0;
        }
        .new-msg-btn {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 7px 18px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(59,130,246,.45);
            white-space: nowrap;
            animation: slideDown 0.2s ease;
        }
        .new-msg-btn:hover { background: #2563eb; }
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* Empty state */
        .conv-empty {
            flex: 1;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 8px; padding: 40px; text-align: center;
        }
        .conv-empty-icon {
            width: 56px; height: 56px;
            border-radius: 50%;
            background: #eff6ff;
            color: #93c5fd;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 4px;
        }
        .conv-empty-title { font-size: 14px; font-weight: 600; color: #475569; margin: 0; }
        .conv-empty-sub   { font-size: 12px; color: #94a3b8; margin: 0; max-width: 200px; }

        /* Message rows */
        .msg-row {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            max-width: 85%;
            align-self: flex-start;
        }
        .msg-row.msg-mine {
            align-self: flex-end;
            flex-direction: row-reverse;
        }
        .msg-avatar {
            width: 28px; height: 28px;
            border-radius: 50%;
            font-size: 10px;
            font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .admin-avatar  { background: #e0e7ff; color: #4338ca; }
        .tenant-avatar { background: #dbeafe; color: #1d4ed8; font-size: 9px; }

        .msg-group {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
        }
        .msg-sender {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            padding: 0 4px;
        }
        .msg-sender.msg-sender-mine { text-align: right; }

        .msg-bubble {
            padding: 10px 14px;
            border-radius: 4px 14px 14px 14px;
            font-size: 13px;
            line-height: 1.55;
            color: #1e293b;
            background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,.07);
            word-break: break-word;
            max-width: 100%;
        }
        .bubble-mine {
            background: #3b82f6;
            color: #fff;
            border-radius: 14px 4px 14px 14px;
            box-shadow: 0 2px 8px rgba(59,130,246,.35);
        }
        .msg-time {
            font-size: 10px;
            color: #94a3b8;
            padding: 0 4px;
        }
        .msg-sender.msg-sender-mine ~ * { align-self: flex-end; }

        /* Polling new messages divider */
        .new-polling-divider {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 4px 0;
            width: 100%;
        }
        .new-polling-line {
            flex: 1;
            height: 1px;
            background: #3b82f6;
            opacity: 0.5;
        }
        .new-polling-label {
            font-size: 11px;
            font-weight: 700;
            color: #1d4ed8;
            white-space: nowrap;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 20px;
            padding: 3px 12px;
        }

        /* Unread divider */
        .unread-divider {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 4px 0;
            width: 100%;
        }
        .unread-line {
            flex: 1;
            height: 1px;
            background: #f59e0b;
            opacity: 0.5;
        }
        .unread-label {
            font-size: 11px;
            font-weight: 700;
            color: #b45309;
            white-space: nowrap;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 20px;
            padding: 3px 12px;
        }

        /* Input area */
        .conv-input-area {
            display: flex;
            gap: 0;
            align-items: center;
            padding: 10px 12px;
            border-top: 1px solid #e2e8f0;
            background: #fff;
            flex-shrink: 0;
            gap: 8px;
        }
        .conv-textarea {
            flex: 1;
            resize: none;
            border: 1.5px solid #e2e8f0;
            border-radius: 22px;
            padding: 10px 16px;
            font-size: 13px;
            font-family: inherit;
            color: #1e293b;
            outline: none;
            transition: border-color .18s, box-shadow .18s;
            background: #f8fafc;
            min-height: 40px;
            max-height: 100px;
            line-height: 1.4;
        }
        .conv-textarea:focus {
            border-color: #3b82f6;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(59,130,246,.12);
        }
        .conv-textarea::placeholder { color: #94a3b8; }
        .send-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3b82f6;
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background .15s, transform .1s;
            box-shadow: 0 2px 8px rgba(59,130,246,.35);
        }
        .send-btn:hover:not(:disabled) { background: #2563eb; transform: scale(1.06); }
        .send-btn:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

        .conv-closed {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 13px;
            color: #64748b;
            background: #f8fafc;
            flex-shrink: 0;
        }
        .conv-closed p { margin: 0; }

        /* Skeletons */
        .skeleton-main, .skeleton-conv {
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .sk-banner { height: 80px; background: #dbeafe; }
        .sk-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .sk-line {
            height: 12px; border-radius: 6px;
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite;
        }
        .sk-line.w100 { width: 100%; }
        .sk-line.w80  { width: 80%; }
        .sk-line.w60  { width: 60%; }
        .sk-line.w40  { width: 40%; }
        .sk-msg { height: 40px; border-radius: 10px; background: #f1f5f9; margin: 8px 16px; }
        @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Not found */
        .not-found {
            display: flex; flex-direction: column; align-items: center;
            padding: 60px; color: #64748b; text-align: center; gap: 8px;
        }
        .not-found h2 { color: #1e293b; margin: 8px 0 4px; }

        /* ── File Upload ── */
        .conv-input-wrapper {
            border-top: 1px solid #e2e8f0;
            background: #fff;
            flex-shrink: 0;
        }
        .file-preview {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            padding: 8px 12px 0;
        }
        .file-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 20px;
            font-size: 11px;
            color: #1d4ed8;
            max-width: 160px;
        }
        .file-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-remove {
            display: flex; align-items: center; justify-content: center;
            width: 14px; height: 14px;
            border: none; background: none; cursor: pointer;
            color: #93c5fd; padding: 0; flex-shrink: 0;
        }
        .file-remove:hover { color: #1d4ed8; }
        .attach-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1.5px solid #e2e8f0;
            background: #f8fafc;
            color: #64748b;
            cursor: pointer;
            justify-content: center;
            flex-shrink: 0;
            transition: border-color .15s, color .15s, background .15s;
            position: relative;
        }
        .attach-btn:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
        .attach-btn:disabled { opacity: .5; cursor: not-allowed; }
        .attach-count {
            position: absolute;
            top: -4px; right: -4px;
            font-size: 9px; font-weight: 700;
            background: #3b82f6; color: #fff;
            border-radius: 10px; padding: 1px 4px;
        }
        .conv-input-area { border-top: none; }

        /* Adjuntos en burbujas */
        .msg-attachments {
            display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;
        }
        .msg-attachments-mine { justify-content: flex-end; }
        .att-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 9px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            font-size: 11px;
            color: #475569;
            text-decoration: none;
            transition: background .15s;
        }
        .att-chip:hover { background: #e2e8f0; color: #1e293b; }
        .att-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; }
        .att-chip.att-chip-mine {
            background: #e2e8f0;
            border-color: #cbd5e1;
            color: #1e293b;
        }
        .att-chip.att-chip-mine:hover { background: #cbd5e1; color: #0f172a; }
    `]
})
export class TenantRequestDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('msgContainer') private msgContainer!: ElementRef;
    @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

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
    readonly Link = Link;
    readonly Paperclip = Paperclip;
    readonly X = X;
    readonly Image = Image;

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
    selectedFiles = signal<File[]>([]);

    // Store current user ID for message comparison
    private currentUserId: number | null = null;

    // Unread tracking
    firstUnreadMessageId = 0;
    unreadCountFromHere = 0;

    // Polling
    private pollingSub: Subscription | null = null;
    private lastMessageId = 0;
    newMessagesCount = signal(0);
    pollingNewFromId = signal(0);  // ID del primer mensaje nuevo por polling

    ngAfterViewChecked(): void {}  // kept to satisfy implements, scroll is now direct

    ngOnDestroy(): void {
        this.pollingSub?.unsubscribe();
    }

    private doScroll(delay = 100): void {
        setTimeout(() => {
            const el = this.msgContainer?.nativeElement;
            if (el) el.scrollTop = el.scrollHeight;
        }, delay);
    }

    private isNearBottom(): boolean {
        const el = this.msgContainer?.nativeElement;
        if (!el) return true;
        return (el.scrollHeight - el.scrollTop - el.clientHeight) < 80;
    }

    private startPolling(requestId: number): void {
        this.pollingSub?.unsubscribe();
        this.pollingSub = interval(5000).subscribe(() => {
            if (document.hidden) return;
            this.maintenanceService.getMessages(requestId).subscribe({
                next: (messages) => {
                    const newLastId = messages.length > 0 ? messages[messages.length - 1].id : 0;
                    if (newLastId !== this.lastMessageId) {
                        const oldLastId = this.lastMessageId;
                        const incoming = messages.length - this.messages().length;
                        this.lastMessageId = newLastId;
                        const atBottom = this.isNearBottom();
                        // Marca el primer mensaje nuevo para el separador visual
                        const firstNew = messages.find(m => m.id > oldLastId);
                        if (firstNew) this.pollingNewFromId.set(firstNew.id);
                        this.messages.set(messages);
                        if (atBottom) {
                            this.doScroll(100);
                            this.newMessagesCount.set(0);
                            setTimeout(() => this.pollingNewFromId.set(0), 2000);
                        } else {
                            this.newMessagesCount.update(c => c + (incoming > 0 ? incoming : 1));
                        }
                    }
                },
                error: () => {}
            });
        });
    }

    isFirstPollingNew(message: MaintenanceMessage): boolean {
        return this.pollingNewFromId() > 0 && message.id === this.pollingNewFromId();
    }

    scrollToNewMessages(): void {
        this.newMessagesCount.set(0);
        this.doScroll(50);
        setTimeout(() => this.pollingNewFromId.set(0), 2500);
    }

    onMessagesScroll(event: Event): void {
        const el = event.target as HTMLElement;
        if ((el.scrollHeight - el.scrollTop - el.clientHeight) < 80) {
            this.newMessagesCount.set(0);
            this.pollingNewFromId.set(0);
        }
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                // Limpiar estado anterior antes de cargar la nueva solicitud
                this.request.set(null);
                this.messages.set([]);
                this.newMessage = '';
                this.loadRequest(+id);
            }
        });
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

    private getLastReadId(requestId: number): number {
        return parseInt(localStorage.getItem(`mnt_lastread_${requestId}`) ?? '0', 10);
    }

    private computeUnread(messages: MaintenanceMessage[], lastReadId: number): void {
        if (lastReadId === 0) { this.firstUnreadMessageId = 0; this.unreadCountFromHere = 0; return; }
        const unread = messages.filter(m => !this.isMyMessage(m) && m.id > lastReadId);
        this.unreadCountFromHere = unread.length;
        this.firstUnreadMessageId = unread.length > 0 ? unread[0].id : 0;
    }

    private markMessagesRead(messages: MaintenanceMessage[], requestId: number): void {
        if (messages.length > 0) {
            const lastId = Math.max(...messages.map(m => m.id));
            localStorage.setItem(`mnt_lastread_${requestId}`, String(lastId));
        }
        const adminCount = messages.filter(m => !this.isMyMessage(m)).length;
        localStorage.setItem(`mnt_read_${requestId}`, String(adminCount));
    }

    isFirstUnread(message: MaintenanceMessage): boolean {
        return this.firstUnreadMessageId > 0 && message.id === this.firstUnreadMessageId;
    }

    loadMessages(requestId: number): void {
        const lastReadId = this.getLastReadId(requestId);
        this.isLoadingMessages.set(true);
        this.messages.set([]);
        this.maintenanceService.getMessages(requestId).subscribe({
            next: (messages) => {
                this.computeUnread(messages, lastReadId);
                this.lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : 0;
                this.messages.set(messages);
                this.isLoadingMessages.set(false);
                this.doScroll(150);
                this.markMessagesRead(messages, requestId);
                this.startPolling(requestId);
            },
            error: () => {
                this.isLoadingMessages.set(false);
            }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files) return;
        const newFiles = Array.from(input.files);
        const remaining = 3 - this.selectedFiles().length;
        this.selectedFiles.update(files => [...files, ...newFiles.slice(0, remaining)]);
        input.value = '';
    }

    removeFile(index: number): void {
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    }

    getFileUrl(url: string): string {
        return environment.apiUrl.replace(/\/$/, '') + url;
    }

    isImageAttachment(fileType: string): boolean {
        return fileType === 'image';
    }

    sendMessage(): void {
        const message = this.newMessage.trim();
        if (!message || !this.request()) return;

        this.isSending.set(true);

        const send = (fileUrls: string[]) => {
            const dto = {
                message,
                ...(fileUrls.length > 0 && { files: fileUrls })
            };
            this.maintenanceService.sendMessage(this.request()!.id, dto).subscribe({
                next: (msg) => {
                    this.messages.update(msgs => [...msgs, msg]);
                    this.lastMessageId = msg.id;
                    this.newMessage = '';
                    this.selectedFiles.set([]);
                    this.isSending.set(false);
                    this.doScroll(50);
                },
                error: () => {
                    this.isSending.set(false);
                }
            });
        };

        if (this.selectedFiles().length > 0) {
            this.maintenanceService.uploadFiles(this.request()!.id, this.selectedFiles()).subscribe({
                next: (attachments) => send(attachments.map(a => a.file_url)),
                error: () => {
                    this.isSending.set(false);
                }
            });
        } else {
            send([]);
        }
    }

    canSendMessage(): boolean {
        const req = this.request();
        if (!req) return false;
        return ![MaintenanceStatus.COMPLETED, MaintenanceStatus.CLOSED].includes(req.status);
    }

    getStatusColor(status: MaintenanceStatus): string {
        const map: Record<string, string> = {
            NEW: 'status-new', IN_PROGRESS: 'status-in_progress',
            COMPLETED: 'status-completed', DEFERRED: 'status-deferred', CLOSED: 'status-closed'
        };
        return map[status] ?? '';
    }

    getPriorityColor(priority: string): string {
        const map: Record<string, string> = {
            LOW: 'priority-low', NORMAL: 'priority-normal', HIGH: 'priority-high'
        };
        return map[priority] ?? '';
    }

    getStatusBgColor(status: string): string {
        const map: Record<string, string> = {
            NEW: '#dbeafe', IN_PROGRESS: '#fef3c7',
            COMPLETED: '#d1fae5', DEFERRED: '#fed7aa', CLOSED: '#e2e8f0'
        };
        return map[status] ?? '#e2e8f0';
    }

    getStatusTextColor(status: string): string {
        const map: Record<string, string> = {
            NEW: '#1d4ed8', IN_PROGRESS: '#b45309',
            COMPLETED: '#047857', DEFERRED: '#c2410c', CLOSED: '#475569'
        };
        return map[status] ?? '#475569';
    }

    getPriorityBgColor(priority: string): string {
        const map: Record<string, string> = {
            LOW: '#d1fae5', NORMAL: '#fef3c7', HIGH: '#fee2e2'
        };
        return map[priority] ?? '#f1f5f9';
    }

    getPriorityTextColor(priority: string): string {
        const map: Record<string, string> = {
            LOW: '#047857', NORMAL: '#b45309', HIGH: '#dc2626'
        };
        return map[priority] ?? '#475569';
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
