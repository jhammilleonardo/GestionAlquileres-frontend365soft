import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import {
  LucideAngularModule,
  Wrench,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Home,
  FileText,
  CreditCard,
  MessageSquare,
  DollarSign,
  AlertCircle,
} from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { TenantMaintenanceService } from '../../../core/services/tenant/tenant-maintenance.service';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { TenantMessageService } from '../../../core/services/tenant/tenant-message.service';
import { TenantDocumentService } from '../../../core/services/tenant/tenant-document.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  MaintenanceStatusLabels,
  MaintenancePriorityLabels,
} from '../../../core/models/maintenance-request.model';
import { PaymentStatusLabels } from '../../../core/models/payment.model';
import { TranslocoModule } from '@jsverse/transloco';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
  ],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1>{{ 'public.tenantDashboard.greeting' | transloco: { name: getFirstName() } }}</h1>
          <p>{{ 'public.tenantDashboard.subtitle' | transloco }}</p>
        </div>
      </div>

      <!-- Property Card -->
      @if (authService.currentUser()?.contract) {
        <mat-card class="property-card">
          <div class="property-header">
            <lucide-icon [img]="Home" [size]="24"></lucide-icon>
            <span>{{ 'public.tenantDashboard.myProperty' | transloco }}</span>
          </div>
          <div class="property-content">
            <h2>{{ authService.currentUser()?.contract?.property_title }}</h2>
            <div class="property-meta">
              <div class="meta-item">
                <lucide-icon [img]="FileText" [size]="16"></lucide-icon>
                <span>{{ authService.currentUser()?.contract?.contract_number }}</span>
              </div>
              <span
                class="contract-status"
                [class]="'status-' + authService.currentUser()?.contract?.status?.toLowerCase()"
              >
                {{ authService.currentUser()?.contract?.status }}
              </span>
            </div>
          </div>
        </mat-card>
      }

      <!-- Stats Grid -->
      @if (maintenanceService.isLoading() || paymentService.isLoading()) {
        <div class="stats-grid">
          <div class="stat-card skeleton">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
            </div>
          </div>
          <div class="stat-card skeleton">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
            </div>
          </div>
          <div class="stat-card skeleton">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
            </div>
          </div>
        </div>
      } @else {
        <div class="stats-grid">
          <!-- Maintenance Stats -->
          <div class="stat-card maintenance">
            <div class="stat-icon">
              <lucide-icon [img]="Wrench" [size]="24"></lucide-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ maintenanceService.stats()?.active || 0 }}</div>
              <div class="stat-label">
                {{ 'public.tenantDashboard.activeRequests' | transloco }}
              </div>
            </div>
          </div>

          <!-- Messages Stats -->
          <div class="stat-card messages">
            <div class="stat-icon">
              <lucide-icon [img]="MessageSquare" [size]="24"></lucide-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ messageService.unreadCount() }}</div>
              <div class="stat-label">
                {{ 'public.tenantDashboard.unreadMessages' | transloco }}
              </div>
            </div>
          </div>

          <!-- Documents Stats -->
          <div class="stat-card documents">
            <div class="stat-icon">
              <lucide-icon [img]="FileText" [size]="24"></lucide-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ documentService.documents().length }}</div>
              <div class="stat-label">{{ 'public.tenantDashboard.documents' | transloco }}</div>
            </div>
          </div>
        </div>
      }

      <div class="dashboard-grid">
        <!-- Recent Maintenance Requests -->
        <mat-card class="recent-requests">
          <div class="card-header">
            <h3>{{ 'public.tenantDashboard.recentRequests' | transloco }}</h3>
            <a [routerLink]="mantenimientoUrl()" class="view-all">
              {{ 'public.tenantDashboard.viewAll' | transloco }}
              <lucide-icon [img]="ArrowRight" [size]="16"></lucide-icon>
            </a>
          </div>

          @if (maintenanceService.isLoading()) {
            <div class="skeleton-list">
              @for (i of [1, 2, 3]; track i) {
                <div class="skeleton-request-item">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line medium"></div>
                  <div class="skeleton-line short"></div>
                </div>
              }
            </div>
          } @else if (maintenanceService.requests().length === 0) {
            <div class="empty-state">
              <lucide-icon [img]="Wrench" [size]="48"></lucide-icon>
              <p>{{ 'public.tenantDashboard.noRequests' | transloco }}</p>
            </div>
          } @else {
            <div class="requests-list">
              @for (request of maintenanceService.requests().slice(0, 5); track request.id) {
                <a class="request-item" [routerLink]="buildRequestDetailUrl(request.id)">
                  <div class="request-info">
                    <span class="ticket">{{ request.ticket_number }}</span>
                    <span class="title">{{ request.title }}</span>
                  </div>
                  <div class="request-status">
                    <span class="status-badge" [class]="'status-' + request.status.toLowerCase()">
                      {{ statusLabels[request.status] }}
                    </span>
                  </div>
                </a>
              }
            </div>
          }
        </mat-card>

        <!-- Recent Payments -->
        <mat-card class="recent-payments">
          <div class="card-header">
            <h3>{{ 'public.tenantDashboard.recentPayments' | transloco }}</h3>
            <a [routerLink]="pagosUrl()" class="view-all">
              {{ 'public.tenantDashboard.viewAllPayments' | transloco }}
              <lucide-icon [img]="ArrowRight" [size]="16"></lucide-icon>
            </a>
          </div>

          @if (paymentService.isLoading()) {
            <div class="skeleton-list">
              @for (i of [1, 2, 3]; track i) {
                <div class="skeleton-payment-item">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line medium"></div>
                </div>
              }
            </div>
          } @else if (paymentService.payments().length === 0) {
            <div class="empty-state">
              <lucide-icon [img]="CreditCard" [size]="48"></lucide-icon>
              <p>{{ 'public.tenantDashboard.noPayments' | transloco }}</p>
            </div>
          } @else {
            <div class="payments-list">
              @for (payment of paymentService.payments().slice(0, 5); track payment.id) {
                <div class="payment-item">
                  <div class="payment-info">
                    <span class="date">{{ payment.payment_date | tenantDate }}</span>
                    <span class="amount">{{ payment.amount | tenantCurrency }}</span>
                  </div>
                  <mat-chip-set>
                    <mat-chip
                      [style.background]="getPaymentChipBg(payment.status)"
                      [style.color]="getPaymentChipColor(payment.status)"
                      [style.font-weight]="'700'"
                      [style.font-size]="'11px'"
                    >
                      {{ paymentStatusLabels[payment.status] || payment.status }}
                    </mat-chip>
                  </mat-chip-set>
                </div>
              }
            </div>
          }
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>{{ 'public.tenantDashboard.quickActions' | transloco }}</h3>
        <div class="actions-grid">
          <a [routerLink]="mantenimientoNuevoUrl()" class="action-card">
            <lucide-icon [img]="Wrench" [size]="32"></lucide-icon>
            <span>{{ 'public.tenantDashboard.reportIssue' | transloco }}</span>
          </a>
          <a [routerLink]="pagosNuevoUrl()" class="action-card">
            <lucide-icon [img]="CreditCard" [size]="32"></lucide-icon>
            <span>{{ 'public.tenantDashboard.registerPayment' | transloco }}</span>
          </a>
          <a [routerLink]="mensajesUrl()" class="action-card">
            <lucide-icon [img]="MessageSquare" [size]="32"></lucide-icon>
            <span>{{ 'public.tenantDashboard.sendMessage' | transloco }}</span>
          </a>
          <a [routerLink]="documentosUrl()" class="action-card">
            <lucide-icon [img]="FileText" [size]="32"></lucide-icon>
            <span>{{ 'public.tenantDashboard.viewDocs' | transloco }}</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .welcome-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .welcome-content h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
        margin: 0 0 4px;
      }

      .welcome-content p {
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }

      .alert-card {
        padding: 20px;
        margin-bottom: 24px;
        background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
        border-left: 4px solid #f59e0b;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .alert-card lucide-icon {
        color: #f59e0b;
        flex-shrink: 0;
      }

      .alert-content {
        flex: 1;
      }

      .alert-content h3 {
        margin: 0 0 4px;
        color: var(--mat-sys-on-surface);
        font-size: 1rem;
      }

      .alert-content p {
        margin: 0;
        color: var(--mat-sys-on-surface-variant);
      }

      .property-card {
        margin-bottom: 24px;
        padding: 20px;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
      }

      .property-header {
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0.9;
        margin-bottom: 12px;
      }

      .property-content h2 {
        font-size: 1.5rem;
        margin: 0 0 8px;
      }

      .property-meta {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .property-meta .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        opacity: 0.9;
      }

      .contract-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.2);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-bottom: 24px;
      }

      .stat-card {
        border-radius: 16px;
        padding: 28px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        color: white;
        cursor: pointer;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        }
      }

      .stat-card.maintenance {
        background: #3b82f6;
      }

      .stat-card.messages {
        background: #f59e0b;
      }

      .stat-card.documents {
        background: #28589e;
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.25);
        color: white;
        flex-shrink: 0;
      }

      .stat-icon lucide-icon {
        width: 28px;
        height: 28px;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-value {
        font-size: 40px;
        font-weight: 700;
        color: white;
        line-height: 1;
      }

      .stat-label {
        font-size: 15px;
        color: rgba(255, 255, 255, 0.95);
        font-weight: 500;
        line-height: 1.2;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
      }

      .recent-requests,
      .recent-payments {
        padding: 20px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .card-header h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
        margin: 0;
      }

      .view-all {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--mat-sys-primary);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
      }

      .loading {
        display: flex;
        justify-content: center;
        padding: 40px;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--mat-sys-on-surface-variant);
      }

      .empty-state lucide-icon {
        opacity: 0.5;
        margin-bottom: 16px;
      }

      .requests-list {
        display: flex;
        flex-direction: column;
      }

      .request-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        text-decoration: none;
        transition: background 0.2s;
      }

      .request-item:last-child {
        border-bottom: none;
      }

      .request-item:hover {
        background: var(--mat-sys-surface-container-low);
        margin: 0 -20px;
        padding: 12px 20px;
      }

      .request-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .ticket {
        font-size: 12px;
        font-family: monospace;
        color: var(--mat-sys-primary);
      }

      .title {
        color: var(--mat-sys-on-surface);
        font-weight: 500;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 700;
      }

      .status-badge.status-new {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-badge.status-in_progress {
        background: #bfdbfe;
        color: #1d4ed8;
      }
      .status-badge.status-completed {
        background: #1d4ed8;
        color: #fff;
      }
      .status-badge.status-deferred {
        background: #e0e7ff;
        color: #3730a3;
      }
      .status-badge.status-closed {
        background: #f1f5f9;
        color: #475569;
      }

      .payments-list {
        display: flex;
        flex-direction: column;
      }

      .payment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      .payment-item:last-child {
        border-bottom: none;
      }

      .payment-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .payment-info .date {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }

      .payment-info .amount {
        color: var(--mat-sys-on-surface);
        font-weight: 600;
        font-size: 15px;
      }

      .quick-actions h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
        margin: 0 0 16px;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
      }

      .action-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 24px;
        background: var(--mat-sys-surface);
        border-radius: 12px;
        border: 1px solid var(--mat-sys-outline-variant);
        text-decoration: none;
        color: var(--mat-sys-on-surface-variant);
        transition: all 0.2s;
      }

      .action-card:hover {
        border-color: var(--mat-sys-primary);
        color: var(--mat-sys-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .action-card span {
        font-weight: 500;
      }

      /* Skeleton Loaders */
      @keyframes shimmer {
        0% {
          background-position: -1000px 0;
        }
        100% {
          background-position: 1000px 0;
        }
      }

      .skeleton {
        pointer-events: none;
        opacity: 0.7;
      }

      .skeleton-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }

      .skeleton-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }

      .skeleton-value {
        width: 80px;
        height: 40px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }

      .skeleton-label {
        width: 120px;
        height: 16px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }

      .skeleton-card {
        padding: 20px;
        border-radius: 12px;
        background: var(--mat-sys-surface);
        border: 1px solid var(--mat-sys-outline-variant);
      }

      .skeleton-line {
        height: 16px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        margin-bottom: 12px;
      }

      .skeleton-line.title {
        height: 24px;
        width: 60%;
      }

      .skeleton-line.short {
        width: 40%;
      }

      .skeleton-line.medium {
        width: 70%;
      }

      .skeleton-list {
        padding: 16px 0;
      }

      .skeleton-request-item,
      .skeleton-payment-item {
        padding: 12px 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      .skeleton-request-item:last-child,
      .skeleton-payment-item:last-child {
        border-bottom: none;
      }

      @media (max-width: 1024px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .welcome-content h1 {
          font-size: 1.5rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .stat-card {
          padding: 20px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
        }

        .stat-value {
          font-size: 32px;
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .actions-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .property-card {
          padding: 16px;
        }

        .property-content h2 {
          font-size: 1.25rem;
        }
      }

      @media (max-width: 480px) {
        .tenant-main {
          padding: 16px;
        }

        .welcome-content h1 {
          font-size: 1.35rem;
        }

        .alert-card {
          flex-direction: column;
          text-align: center;
          padding: 16px;
        }

        .alert-content h3 {
          font-size: 0.95rem;
        }

        .actions-grid {
          grid-template-columns: 1fr;
        }

        .action-card {
          padding: 20px;
        }

        .card-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .view-all {
          font-size: 13px;
        }
      }
    `,
  ],
})
export class TenantDashboardComponent implements OnInit {
  readonly Wrench = Wrench;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Plus = Plus;
  readonly ArrowRight = ArrowRight;
  readonly Home = Home;
  readonly FileText = FileText;
  readonly CreditCard = CreditCard;
  readonly MessageSquare = MessageSquare;
  readonly DollarSign = DollarSign;
  readonly AlertCircle = AlertCircle;

  authService = inject(TenantAuthService);
  maintenanceService = inject(TenantMaintenanceService);
  paymentService = inject(TenantPaymentService);
  messageService = inject(TenantMessageService);
  documentService = inject(TenantDocumentService);
  private slugService = inject(SlugService);

  statusLabels = MaintenanceStatusLabels;
  priorityLabels = MaintenancePriorityLabels;
  paymentStatusLabels = PaymentStatusLabels;

  // URLs computadas con slug
  pagosNuevoUrl = computed(() => this.slugService.buildUrl('/portal/pagos/nuevo'));
  mantenimientoUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento'));
  mantenimientoNuevoUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento/nueva'));
  pagosUrl = computed(() => this.slugService.buildUrl('/portal/pagos'));
  mensajesUrl = computed(() => this.slugService.buildUrl('/portal/mensajes'));
  documentosUrl = computed(() => this.slugService.buildUrl('/portal/documentos'));

  buildRequestDetailUrl(requestId: number): string {
    return this.slugService.buildUrl(`/portal/mantenimiento/${requestId}`);
  }

  getPaymentChipBg(status: string): string {
    const map: Record<string, string> = {
      PENDING: '#fef3c7',
      PROCESSING: '#dbeafe',
      APPROVED: '#d1fae5',
      REJECTED: '#fee2e2',
      FAILED: '#fee2e2',
      REFUNDED: '#e0e7ff',
      REVERSED: '#f1f5f9',
      DISPUTED: '#fde68a',
    };
    return map[status] ?? '#f1f5f9';
  }

  getPaymentChipColor(status: string): string {
    const map: Record<string, string> = {
      PENDING: '#92400e',
      PROCESSING: '#1e40af',
      APPROVED: '#065f46',
      REJECTED: '#991b1b',
      FAILED: '#991b1b',
      REFUNDED: '#3730a3',
      REVERSED: '#475569',
      DISPUTED: '#78350f',
    };
    return map[status] ?? '#475569';
  }

  ngOnInit(): void {
    this.maintenanceService.loadMyRequests();
    this.maintenanceService.loadStats();
    this.paymentService.loadPayments();
    this.paymentService.loadStats();
    // TODO: Implementar endpoints de mensajes y documentos en el backend
    // this.messageService.loadMessages();
    // this.documentService.loadDocuments();
  }

  getFirstName(): string {
    const name = this.authService.currentUser()?.name || '';
    return name.split(' ')[0] || 'Usuario';
  }

  pagosListUrl(): string {
    return this.slugService.buildUrl('/portal/pagos');
  }

  isPaymentDueSoon(date: Date): boolean {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }
}
