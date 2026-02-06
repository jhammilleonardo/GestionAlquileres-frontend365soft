import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { LucideAngularModule, CreditCard, Download, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-angular';
import { TenantPaymentService } from '../../../core/services/tenant-payment.service';
import { Payment, PaymentStatusLabels, PaymentTypeLabels, PaymentMethodLabels } from '../../../core/models/payment.model';

@Component({
    selector: 'app-tenant-payments-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatTabsModule,
        LucideAngularModule
    ],
    template: `
        <div class="payments-container">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <lucide-icon [img]="CreditCard" [size]="32"></lucide-icon>
                    <div>
                        <h1>Pagos</h1>
                        <p>Gestiona tus pagos y consulta tu historial</p>
                    </div>
                </div>
                <button mat-raised-button color="primary" routerLink="/portal/pagos/nuevo">
                    <lucide-icon [img]="Plus" [size]="20"></lucide-icon>
                    Registrar Pago
                </button>
            </div>

            <!-- Stats Cards -->
            @if (paymentService.stats(); as stats) {
                <div class="stats-grid">
                    <mat-card class="stat-card">
                        <div class="stat-icon total">
                            <lucide-icon [img]="DollarSign" [size]="24"></lucide-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">\${{ stats.total_paid.toLocaleString() }}</div>
                            <div class="stat-label">Total Pagado</div>
                        </div>
                    </mat-card>

                    <mat-card class="stat-card">
                        <div class="stat-icon pending">
                            <lucide-icon [img]="Clock" [size]="24"></lucide-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">\${{ stats.total_pending.toLocaleString() }}</div>
                            <div class="stat-label">Pendiente</div>
                        </div>
                    </mat-card>

                    @if (stats.next_payment_date) {
                        <mat-card class="stat-card next-payment">
                            <div class="stat-icon upcoming">
                                <lucide-icon [img]="Calendar" [size]="24"></lucide-icon>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value">\${{ stats.next_payment_amount?.toLocaleString() }}</div>
                                <div class="stat-label">
                                    Próximo Pago: {{ formatDate(stats.next_payment_date) }}
                                </div>
                            </div>
                        </mat-card>
                    }

                    <mat-card class="stat-card">
                        <div class="stat-icon success">
                            <lucide-icon [img]="TrendingUp" [size]="24"></lucide-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.on_time_payments }}</div>
                            <div class="stat-label">Pagos a Tiempo</div>
                        </div>
                    </mat-card>
                </div>
            }

            <!-- Tabs -->
            <mat-tab-group class="tabs">
                <mat-tab label="Historial de Pagos">
                    @if (paymentService.isLoading()) {
                        <div class="loading">
                            <mat-spinner diameter="40"></mat-spinner>
                            <p>Cargando pagos...</p>
                        </div>
                    } @else if (paymentService.payments().length === 0) {
                        <div class="empty-state">
                            <lucide-icon [img]="CreditCard" [size]="64"></lucide-icon>
                            <h2>No hay pagos registrados</h2>
                            <p>Aún no tienes pagos en tu historial</p>
                        </div>
                    } @else {
                        <div class="payments-table-container">
                            <table class="payments-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Método</th>
                                        <th>Referencia</th>
                                        <th>Monto</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (payment of paymentService.payments(); track payment.id) {
                                        <tr>
                                            <td>{{ formatDate(payment.payment_date || payment.due_date) }}</td>
                                            <td>{{ paymentTypeLabels[payment.payment_type] }}</td>
                                            <td>{{ paymentMethodLabels[payment.payment_method] }}</td>
                                            <td>
                                                <span class="reference">{{ payment.reference_number || '-' }}</span>
                                            </td>
                                            <td class="amount">\${{ payment.amount.toLocaleString() }}</td>
                                            <td>
                                                <span class="status-badge" [class]="'status-' + payment.status.toLowerCase()">
                                                    {{ paymentStatusLabels[payment.status] }}
                                                </span>
                                            </td>
                                            <td>
                                                @if (payment.status === 'COMPLETED') {
                                                    <button 
                                                        mat-icon-button 
                                                        (click)="downloadReceipt(payment.id)"
                                                        matTooltip="Descargar Recibo">
                                                        <lucide-icon [img]="Download" [size]="18"></lucide-icon>
                                                    </button>
                                                }
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    }
                </mat-tab>

                <mat-tab label="Calendario de Pagos">
                    @if (paymentService.schedule().length === 0) {
                        <div class="empty-state">
                            <lucide-icon [img]="Calendar" [size]="64"></lucide-icon>
                            <h2>No hay pagos programados</h2>
                            <p>No tienes pagos programados próximamente</p>
                        </div>
                    } @else {
                        <div class="schedule-list">
                            @for (item of paymentService.schedule(); track item.id) {
                                <mat-card class="schedule-item" [class.paid]="item.is_paid">
                                    <div class="schedule-date">
                                        <div class="date-day">{{ item.due_date.getDate() }}</div>
                                        <div class="date-month">{{ formatMonth(item.due_date) }}</div>
                                    </div>
                                    <div class="schedule-content">
                                        <h3>{{ paymentTypeLabels[item.payment_type] }}</h3>
                                        <p class="amount">\${{ item.amount.toLocaleString() }}</p>
                                    </div>
                                    <div class="schedule-status">
                                        @if (item.is_paid) {
                                            <lucide-icon [img]="CheckCircle2" [size]="24" class="icon-success"></lucide-icon>
                                            <span class="status-text success">Pagado</span>
                                        } @else if (isOverdue(item.due_date)) {
                                            <lucide-icon [img]="AlertCircle" [size]="24" class="icon-danger"></lucide-icon>
                                            <span class="status-text danger">Vencido</span>
                                        } @else {
                                            <lucide-icon [img]="Clock" [size]="24" class="icon-warning"></lucide-icon>
                                            <span class="status-text warning">Pendiente</span>
                                        }
                                    </div>
                                </mat-card>
                            }
                        </div>
                    }
                </mat-tab>
            </mat-tab-group>
        </div>
    `,
    styles: [`
        .payments-container {
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

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .stat-card {
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .stat-icon.total { background: var(--mat-sys-primary); }
        .stat-icon.pending { background: #f59e0b; }
        .stat-icon.upcoming { background: var(--mat-sys-primary); }
        .stat-icon.success { background: #10b981; }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
        }

        .stat-label {
            color: #64748b;
            font-size: 13px;
        }

        .next-payment {
            grid-column: span 2;
        }

        .tabs {
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

        .payments-table-container {
            overflow-x: auto;
        }

        .payments-table {
            width: 100%;
            border-collapse: collapse;
        }

        .payments-table th {
            text-align: left;
            padding: 12px;
            background: #f8fafc;
            color: #64748b;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .payments-table td {
            padding: 16px 12px;
            border-bottom: 1px solid #e2e8f0;
        }

        .payments-table tr:hover {
            background: #f8fafc;
        }

        .reference {
            font-family: monospace;
            font-size: 13px;
            color: var(--mat-sys-primary);
        }

        .amount {
            font-weight: 600;
            color: #1e293b;
            font-size: 15px;
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
        }

        .status-badge.status-pending { background: #fef3c7; color: #b45309; }
        .status-badge.status-completed { background: #d1fae5; color: #047857; }
        .status-badge.status-failed { background: #fee2e2; color: #dc2626; }
        .status-badge.status-cancelled { background: #e2e8f0; color: #475569; }
        .status-badge.status-refunded { background: #dbeafe; color: #1d4ed8; }

        .schedule-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px 0;
        }

        .schedule-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
        }

        .schedule-item.paid {
            opacity: 0.6;
        }

        .schedule-date {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px;
            background: var(--mat-sys-primary);
            color: white;
            border-radius: 8px;
            min-width: 60px;
        }

        .date-day {
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1;
        }

        .date-month {
            font-size: 12px;
            text-transform: uppercase;
        }

        .schedule-content {
            flex: 1;
        }

        .schedule-content h3 {
            margin: 0 0 4px;
            color: #1e293b;
        }

        .schedule-content .amount {
            margin: 0;
            font-size: 1.25rem;
        }

        .schedule-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .status-text {
            font-weight: 600;
            font-size: 14px;
        }

        .status-text.success { color: #10b981; }
        .status-text.warning { color: #f59e0b; }
        .status-text.danger { color: #ef4444; }

        .icon-success { color: #10b981; }
        .icon-warning { color: #f59e0b; }
        .icon-danger { color: #ef4444; }
    `]
})
export class TenantPaymentsListComponent implements OnInit {
    readonly CreditCard = CreditCard;
    readonly Download = Download;
    readonly Calendar = Calendar;
    readonly DollarSign = DollarSign;
    readonly TrendingUp = TrendingUp;
    readonly AlertCircle = AlertCircle;
    readonly CheckCircle2 = CheckCircle2;
    readonly Clock = Clock;
    readonly Plus = Plus;

    paymentService = inject(TenantPaymentService);

    paymentStatusLabels = PaymentStatusLabels;
    paymentTypeLabels = PaymentTypeLabels;
    paymentMethodLabels = PaymentMethodLabels;

    ngOnInit(): void {
        this.paymentService.loadPayments();
        this.paymentService.loadSchedule();
        this.paymentService.loadStats();
    }

    downloadReceipt(paymentId: number): void {
        this.paymentService.downloadReceipt(paymentId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `recibo-${paymentId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                console.error('Error downloading receipt:', error);
                alert('Error al descargar el recibo');
            }
        });
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatMonth(date: Date): string {
        return date.toLocaleDateString('es-ES', { month: 'short' });
    }

    isOverdue(date: Date): boolean {
        return date < new Date();
    }
}
