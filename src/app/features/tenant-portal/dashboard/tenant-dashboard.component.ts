import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { InternalMessageService } from '../../../core/services/internal-message.service';
import { TenantDocumentService } from '../../../core/services/tenant/tenant-document.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  MaintenanceStatusLabels,
  MaintenancePriorityLabels,
  MaintenanceStatus,
} from '../../../core/models/maintenance-request.model';
import { PaymentStatus, PaymentStatusLabels } from '../../../core/models/payment.model';
import { TranslocoModule } from '@jsverse/transloco';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../shared/ui/status-badge/status-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppStatusBadgeComponent,
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
        <section class="property-card">
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
        </section>
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
              <div class="stat-value">{{ messageService.unread() }}</div>
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
        <section class="recent-requests">
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
                    <app-status-badge
                      [label]="statusLabels[request.status]"
                      [tone]="getMaintenanceStatusTone(request.status)"
                    />
                  </div>
                </a>
              }
            </div>
          }
        </section>

        <!-- Recent Payments -->
        <section class="recent-payments">
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
                  <app-status-badge
                    [label]="paymentStatusLabels[payment.status] || payment.status"
                    [tone]="getPaymentStatusTone(payment.status)"
                  />
                </div>
              }
            </div>
          }
        </section>
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
        color: var(--app-color-text);
        margin: 0 0 4px;
      }

      .welcome-content p {
        color: var(--app-color-text-muted);
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
        color: var(--app-color-text);
        font-size: 1rem;
      }

      .alert-content p {
        margin: 0;
        color: var(--app-color-text-muted);
      }

      .property-card {
        margin-bottom: 24px;
        padding: 20px;
        background: var(--app-color-primary);
        color: #fff;
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
        color: var(--app-color-text);
        margin: 0;
      }

      .view-all {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--app-color-primary);
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
        color: var(--app-color-text-muted);
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
        border-bottom: 1px solid var(--app-color-border);
        text-decoration: none;
        transition: background 0.2s;
      }

      .request-item:last-child {
        border-bottom: none;
      }

      .request-item:hover {
        background: var(--app-color-surface-muted);
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
        color: var(--app-color-primary);
      }

      .title {
        color: var(--app-color-text);
        font-weight: 500;
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
        border-bottom: 1px solid var(--app-color-border);
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
        color: var(--app-color-text-muted);
      }

      .payment-info .amount {
        color: var(--app-color-text);
        font-weight: 600;
        font-size: 15px;
      }

      .quick-actions h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--app-color-text);
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
        background: var(--app-color-surface);
        border-radius: 12px;
        border: 1px solid var(--app-color-border);
        text-decoration: none;
        color: var(--app-color-text-muted);
        transition: all 0.2s;
      }

      .action-card:hover {
        border-color: var(--app-color-primary);
        color: var(--app-color-primary);
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
        background: var(--app-color-surface);
        border: 1px solid var(--app-color-border);
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
        border-bottom: 1px solid var(--app-color-border);
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
export class TenantDashboardComponent {
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
  messageService = inject(InternalMessageService);
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

  getMaintenanceStatusTone(status: MaintenanceStatus): AppStatusTone {
    const tones: Record<MaintenanceStatus, AppStatusTone> = {
      [MaintenanceStatus.NEW]: 'info',
      [MaintenanceStatus.IN_PROGRESS]: 'warning',
      [MaintenanceStatus.COMPLETED]: 'success',
      [MaintenanceStatus.DEFERRED]: 'neutral',
      [MaintenanceStatus.CLOSED]: 'neutral',
    };

    return tones[status] ?? 'neutral';
  }

  getPaymentStatusTone(status: PaymentStatus): AppStatusTone {
    const tones: Record<PaymentStatus, AppStatusTone> = {
      [PaymentStatus.PENDING]: 'warning',
      [PaymentStatus.PROCESSING]: 'info',
      [PaymentStatus.APPROVED]: 'success',
      [PaymentStatus.REJECTED]: 'danger',
      [PaymentStatus.FAILED]: 'danger',
      [PaymentStatus.REFUNDED]: 'info',
      [PaymentStatus.REVERSED]: 'neutral',
      [PaymentStatus.DISPUTED]: 'warning',
    };

    return tones[status] ?? 'neutral';
  }

  constructor() {
    this.maintenanceService.loadMyRequests();
    this.maintenanceService.loadStats();
    this.paymentService.loadPayments();
    this.paymentService.loadStats();
    this.messageService.refreshUnread().subscribe({ error: () => undefined });
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
