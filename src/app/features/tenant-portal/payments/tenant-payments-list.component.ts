import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { LucideAngularModule, CreditCard, Download, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Plus, XCircle } from 'lucide-angular';
import { TenantPaymentService } from '../../../core/services/tenant-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import { Payment, PaymentStatus, PaymentStatusLabels, PaymentTypeLabels, PaymentMethodLabels, PaymentStatusColors, Currency, CurrencyLabels, CurrencySymbols } from '../../../core/models/payment.model';

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
                <button mat-raised-button color="primary" [routerLink]="nuevoPagoUrl()">
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
                            <div class="stat-value">{{ stats.total_payments }}</div>
                            <div class="stat-label">Total Pagos</div>
                        </div>
                    </mat-card>

                    <mat-card class="stat-card">
                        <div class="stat-icon pending">
                            <lucide-icon [img]="Clock" [size]="24"></lucide-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.total_pending }}</div>
                            <div class="stat-label">Pendientes</div>
                            <p class="stat-amount">{{ formatCurrency(stats.total_amount_pending, Currency.USD) }}</p>
                        </div>
                    </mat-card>

                    <mat-card class="stat-card">
                        <div class="stat-icon success">
                            <lucide-icon [img]="CheckCircle2" [size]="24"></lucide-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.total_approved }}</div>
                            <div class="stat-label">Aprobados</div>
                            <p class="stat-amount">{{ formatCurrency(stats.total_amount_approved, Currency.USD) }}</p>
                        </div>
                    </mat-card>

                    <mat-card class="stat-card">
                        <div class="stat-icon rejected">
                            <lucide-icon [img]="XCircle" [size]="24"></lucide-icon>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.total_rejected }}</div>
                            <div class="stat-label">Rechazados</div>
                        </div>
                    </mat-card>
                </div>
            }

            <!-- Payment List -->
            @if (paymentService.isLoading()) {
                <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Cargando pagos...</p>
                </div>
            } @else if (paymentService.payments().length === 0) {
                <mat-card>
                    <div class="empty-state">
                        <lucide-icon [img]="CreditCard" [size]="64"></lucide-icon>
                        <h2>No hay pagos registrados</h2>
                        <p>Aún no tienes pagos en tu historial</p>
                        <button mat-raised-button color="primary" [routerLink]="nuevoPagoUrl()">
                            <lucide-icon [img]="Plus" [size]="20"></lucide-icon>
                            Registrar Primer Pago
                        </button>
                    </div>
                </mat-card>
            } @else {
                <mat-card>
                    <div class="payments-table-container">
                        <table class="payments-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Método</th>
                                    <th>Referencia</th>
                                    <th>Monto</th>
                                    <th>Moneda</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (payment of paymentService.payments(); track payment.id) {
                                    <tr>
                                        <td>{{ formatPaymentDate(payment.payment_date) }}</td>
                                        <td>{{ paymentTypeLabels[payment.payment_type] }}</td>
                                        <td>{{ paymentMethodLabels[payment.payment_method] }}</td>
                                        <td>
                                            <span class="reference">{{ payment.reference_number || '-' }}</span>
                                        </td>
                                        <td class="amount">{{ formatCurrency(payment.amount, payment.currency) }}</td>
                                        <td>{{ payment.currency || 'USD' }}</td>
                                        <td>
                                            <span class="status-badge"
                                                  [style.background-color]="getStatusColor(payment.status)"
                                                  style="color: white;">
                                                {{ paymentStatusLabels[payment.status] }}
                                            </span>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </mat-card>
            }
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

        .stat-icon.total { background: #3b82f6; }
        .stat-icon.pending { background: #f59e0b; }
        .stat-icon.success { background: #10b981; }
        .stat-icon.rejected { background: #ef4444; }

        .stat-amount {
            font-size: 0.875rem;
            color: #64748b;
            margin: 4px 0 0 0;
        }

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

        /* Skeleton Loaders */
        @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }

        .skeleton-row {
            pointer-events: none;
        }

        .skeleton-line {
            height: 16px;
            border-radius: 4px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
        }

        .skeleton-line.short {
            width: 60px;
        }

        .skeleton-line.medium {
            width: 100px;
        }

        .skeleton-badge {
            width: 80px;
            height: 24px;
            border-radius: 20px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
        }

        @media (max-width: 1024px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .next-payment {
                grid-column: span 1;
            }
        }

        @media (max-width: 768px) {
            .page-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }

            .header-content h1 {
                font-size: 1.35rem;
            }

            .page-header button {
                width: 100%;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .next-payment {
                grid-column: span 1;
            }

            .stat-card {
                padding: 16px;
            }

            .payments-table-container {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }

            .payments-table {
                min-width: 720px;
            }

            .payments-table th,
            .payments-table td {
                padding: 12px 8px;
                font-size: 13px;
            }

            .schedule-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }

            .schedule-date {
                width: 100%;
                flex-direction: row;
                justify-content: space-between;
                padding: 8px 16px;
            }

            .schedule-status {
                width: 100%;
                justify-content: flex-start;
            }
        }

        @media (max-width: 600px) {
            .stat-value {
                font-size: 1.25rem;
            }

            .stat-label {
                font-size: 12px;
            }

            .tabs {
                font-size: 14px;
            }

            .payments-table {
                min-width: 670px;
            }

            .schedule-item {
                padding: 16px;
            }

            .schedule-content h3 {
                font-size: 1rem;
            }

            .schedule-content .amount {
                font-size: 1.1rem;
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

            .stat-icon {
                width: 40px;
                height: 40px;
            }

            .stat-value {
                font-size: 1.1rem;
            }

            .page-header button {
                font-size: 14px;
                padding: 8px 16px;
            }
        }
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
    readonly XCircle = XCircle;

    paymentService = inject(TenantPaymentService);
    private slugService = inject(SlugService);

    PaymentStatus = PaymentStatus;
    Currency = Currency;
    paymentStatusLabels = PaymentStatusLabels;
    paymentTypeLabels = PaymentTypeLabels;
    paymentMethodLabels = PaymentMethodLabels;
    paymentStatusColors = PaymentStatusColors;
    currencyLabels = CurrencyLabels;
    currencySymbols = CurrencySymbols;

    // URL para registrar nuevo pago
    nuevoPagoUrl = computed(() => this.slugService.buildUrl('/portal/pagos/nuevo'));

    ngOnInit(): void {
        this.paymentService.loadPayments();
        this.paymentService.loadStats();
    }

    formatPaymentDate(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatCurrency(amount: number | string, currency?: Currency): string {
        const curr = currency || Currency.USD;
        const symbol = CurrencySymbols[curr];
        // Convert to number if it's a string (backend sometimes returns strings)
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        // Handle NaN or invalid values
        if (isNaN(numAmount)) return `${symbol}0.00`;
        return `${symbol}${numAmount.toFixed(2)}`;
    }

    getStatusColor(status: PaymentStatus): string {
        return PaymentStatusColors[status];
    }
}
