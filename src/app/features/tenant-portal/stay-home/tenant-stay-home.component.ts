import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import {
  Bell,
  CalendarCheck,
  CircleCheck,
  ClipboardList,
  CreditCard,
  LucideAngularModule,
  MessageSquare,
  Moon,
  Wrench,
  Wallet,
} from 'lucide-angular';

import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceStatusLabels,
} from '../../../core/models/maintenance-request.model';
import { InternalMessageService } from '../../../core/services/internal-message.service';
import {
  MyReservation,
  ReservationService,
  ReservationStatus,
} from '../../../core/services/reservation.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantMaintenanceService } from '../../../core/services/tenant/tenant-maintenance.service';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../shared/ui/status-badge/status-badge.component';
import { ReservationPaymentDialogComponent } from '../reservations/reservation-payment-dialog.component';

const ACTIVE_STAY_STATUSES = new Set<ReservationStatus>(['confirmed', 'in_progress']);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-stay-home',
  standalone: true,
  imports: [
    RouterModule,
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    TenantDatePipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
    ReservationPaymentDialogComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'tenant-reservas', alias: 'tenantReservations' })],
  template: `
    <section class="stay-page">
      <app-page-header
        [title]="'tenantReservations.stay.title' | transloco"
        [description]="'tenantReservations.stay.subtitle' | transloco"
      />

      @if (isLoading()) {
        <app-loading-state [label]="'tenantReservations.loading' | transloco" />
      } @else if (!activeReservation()) {
        <app-empty-state
          [title]="'tenantReservations.emptyTitle' | transloco"
          [description]="'tenantReservations.emptyDescription' | transloco"
        >
          <lucide-icon icon [img]="CalendarCheck" [size]="40"></lucide-icon>
        </app-empty-state>
      } @else {
        @let reservation = activeReservation()!;
        <section class="welcome-section">
          <div>
            <h1>{{ 'tenantReservations.stay.title' | transloco }}</h1>
            <p>{{ 'tenantReservations.stay.subtitle' | transloco }}</p>
          </div>
        </section>

        <article class="stay-panel">
          <header class="stay-head">
            <div>
              <span class="eyebrow">{{ 'tenantReservations.stay.activeStay' | transloco }}</span>
              <h2>
                {{
                  reservation.property_name || ('tenantReservations.unknownProperty' | transloco)
                }}
              </h2>
              @if (reservation.unit_number) {
                <p>{{ 'tenantReservations.unit' | transloco }} {{ reservation.unit_number }}</p>
              }
            </div>
            <app-status-badge
              [label]="'tenantReservations.status.' + reservation.status | transloco"
              [tone]="statusTone(reservation.status)"
            />
          </header>

          <section class="stats-grid" aria-label="Resumen de estadía">
            <div class="stat-card">
              <lucide-icon [img]="CalendarCheck" [size]="22"></lucide-icon>
              <span>{{ 'tenantReservations.payment.totalReservation' | transloco }}</span>
              <strong>{{ totalAmount() | tenantCurrency: reservation.currency }}</strong>
            </div>
            <div class="stat-card">
              <lucide-icon [img]="CircleCheck" [size]="22"></lucide-icon>
              <span>{{ 'tenantReservations.stay.paid' | transloco }}</span>
              <strong>{{ paidAmount() | tenantCurrency: reservation.currency }}</strong>
            </div>
            <div class="stat-card" [class.stat-card--attention]="remaining() > 0">
              <lucide-icon [img]="Wallet" [size]="22"></lucide-icon>
              <span>{{ 'tenantReservations.payment.payLater' | transloco }}</span>
              <strong>{{ remaining() | tenantCurrency: reservation.currency }}</strong>
            </div>
            <div class="stat-card">
              <lucide-icon [img]="Wrench" [size]="22"></lucide-icon>
              <span>{{ 'tenantReservations.stay.openTickets' | transloco }}</span>
              <strong>{{ activeRequestCount() }}</strong>
            </div>
          </section>

          <dl class="stay-dates">
            <div>
              <dt>{{ 'tenantReservations.checkin' | transloco }}</dt>
              <dd>{{ reservation.checkin_date | tenantDate }}</dd>
            </div>
            <div>
              <dt>{{ 'tenantReservations.checkoutLabel' | transloco }}</dt>
              <dd>{{ reservation.checkout_date | tenantDate }}</dd>
            </div>
            <div>
              <dt>{{ 'tenantReservations.stay.duration' | transloco }}</dt>
              <dd>
                <lucide-icon [img]="Moon" [size]="16"></lucide-icon>
                {{ 'tenantReservations.nights' | transloco: { count: reservation.nights } }}
              </dd>
            </div>
          </dl>

          <section class="balance-panel">
            <div>
              <span class="eyebrow">{{ 'tenantReservations.stay.balance' | transloco }}</span>
              <h3>{{ remaining() | tenantCurrency: reservation.currency }}</h3>
              <p>
                {{
                  remaining() > 0
                    ? ('tenantReservations.stay.balanceDescription' | transloco)
                    : ('tenantReservations.stay.noBalance' | transloco)
                }}
              </p>
            </div>
            @if (remaining() > 0) {
              <app-button (clicked)="openPayment(reservation)">
                <lucide-icon [img]="CreditCard" [size]="18"></lucide-icon>
                {{ 'tenantReservations.stay.payBalance' | transloco }}
              </app-button>
            } @else {
              <span class="paid-pill">
                <lucide-icon [img]="CircleCheck" [size]="16"></lucide-icon>
                {{ 'tenantReservations.stay.balancePaid' | transloco }}
              </span>
            }
          </section>
        </article>

        <section class="quick-actions">
          <h3>{{ 'tenantReservations.stay.quickActions' | transloco }}</h3>
          <div class="quick-grid">
            <a class="quick-card" [routerLink]="maintenanceCreateUrl()">
              <lucide-icon [img]="Wrench" [size]="28"></lucide-icon>
              <span>{{ 'tenantReservations.stay.createTicket' | transloco }}</span>
            </a>
            @if (remaining() > 0) {
              <button type="button" class="quick-card" (click)="openPayment(reservation)">
                <lucide-icon [img]="CreditCard" [size]="28"></lucide-icon>
                <span>{{ 'tenantReservations.stay.payBalance' | transloco }}</span>
              </button>
            } @else {
              <div class="quick-card quick-card--muted">
                <lucide-icon [img]="CircleCheck" [size]="28"></lucide-icon>
                <span>{{ 'tenantReservations.stay.balancePaid' | transloco }}</span>
              </div>
            }
            <a class="quick-card" [routerLink]="messagesUrl()">
              <lucide-icon [img]="MessageSquare" [size]="28"></lucide-icon>
              <span>{{ 'tenantReservations.stay.contact' | transloco }}</span>
            </a>
            <a class="quick-card" [routerLink]="reservationsUrl()">
              <lucide-icon [img]="CalendarCheck" [size]="28"></lucide-icon>
              <span>{{ 'tenantReservations.stay.viewReservations' | transloco }}</span>
            </a>
          </div>
        </section>

        <section class="dashboard-grid">
          <article class="panel-card">
            <header class="panel-header">
              <div>
                <h3>{{ 'tenantReservations.stay.latestTickets' | transloco }}</h3>
                <p>{{ 'tenantReservations.stay.ticketsDescription' | transloco }}</p>
              </div>
              <a [routerLink]="maintenanceUrl()">{{
                'tenantReservations.stay.viewTickets' | transloco
              }}</a>
            </header>
            @if (recentRequests().length > 0) {
              <div class="ticket-list">
                @for (request of recentRequests(); track request.id) {
                  <a class="ticket-row" [routerLink]="requestDetailUrl(request.id)">
                    <span>
                      <strong>{{ request.title }}</strong>
                      <small>{{ request.ticket_number }}</small>
                    </span>
                    <em>{{ maintenanceStatusLabel(request) }}</em>
                  </a>
                }
              </div>
            } @else {
              <div class="empty-panel">
                <lucide-icon [img]="ClipboardList" [size]="32"></lucide-icon>
                <p>{{ 'tenantReservations.stay.noTickets' | transloco }}</p>
              </div>
            }
          </article>

          <article class="panel-card">
            <header class="panel-header">
              <div>
                <h3>{{ 'tenantReservations.stay.supportTitle' | transloco }}</h3>
                <p>{{ 'tenantReservations.stay.supportDescription' | transloco }}</p>
              </div>
            </header>
            <div class="support-list">
              <a [routerLink]="maintenanceCreateUrl()">
                <lucide-icon [img]="Wrench" [size]="20"></lucide-icon>
                <span>{{ 'tenantReservations.stay.createTicket' | transloco }}</span>
              </a>
              <a [routerLink]="messagesUrl()">
                <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
                <span>{{ 'tenantReservations.stay.contact' | transloco }}</span>
              </a>
              <a [routerLink]="notificationsUrl()">
                <lucide-icon [img]="Bell" [size]="20"></lucide-icon>
                <span>{{ 'tenantReservations.stay.notifications' | transloco }}</span>
                @if (unreadMessages() > 0) {
                  <strong>{{ unreadMessages() }}</strong>
                }
              </a>
            </div>
          </article>
        </section>
      }
    </section>

    <app-reservation-payment-dialog
      [reservation]="paymentTarget()"
      [open]="paymentTarget() !== null"
      (closed)="closePayment()"
      (paid)="onPaid()"
    />
  `,
  styles: `
    .stay-page {
      display: grid;
      gap: 1.25rem;
      max-width: 1180px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    app-page-header {
      display: none;
    }

    .welcome-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .welcome-section h1 {
      margin: 0 0 0.25rem;
      color: var(--app-color-text);
      font-size: 1.75rem;
      font-weight: 700;
    }

    .welcome-section p {
      margin: 0;
      color: var(--app-color-text-muted);
    }

    .stay-panel,
    .panel-card,
    .quick-card {
      border: 1px solid var(--app-color-border);
      border-radius: 8px;
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
    }

    .stay-panel {
      display: grid;
      gap: 1.25rem;
      padding: 1.25rem;
    }

    .panel-card {
      display: grid;
      align-content: start;
      gap: 1rem;
      padding: 1.25rem;
    }

    .stay-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .eyebrow {
      color: var(--app-color-text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    h2,
    p {
      margin: 0;
    }

    h2 {
      margin-top: 0.2rem;
      font-size: 1.35rem;
    }

    p {
      color: var(--app-color-text-muted);
    }

    .stats-grid,
    .stay-dates {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .stay-dates {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .stat-card,
    .stay-dates div,
    .balance-panel {
      border-radius: 8px;
      background: var(--app-color-background-soft);
      padding: 0.9rem;
    }

    .stat-card {
      display: grid;
      gap: 0.35rem;
    }

    .stat-card lucide-icon {
      color: var(--app-color-primary);
    }

    .stat-card--attention {
      background: #eef6ff;
      border: 1px solid #bfd9ff;
    }

    dt,
    .stat-card span {
      color: var(--app-color-text-muted);
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    dd {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0.35rem 0 0;
      font-weight: 700;
    }

    .stat-card strong {
      font-size: 1.05rem;
    }

    .balance-panel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: #eef6ff;
      border: 1px solid #bfd9ff;
    }

    .balance-panel h3 {
      margin: 0.2rem 0;
      font-size: 1.5rem;
    }

    .paid-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      padding: 0.45rem 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .quick-actions,
    .dashboard-grid {
      display: grid;
      gap: 0.85rem;
    }

    .quick-actions h3,
    .panel-header h3 {
      margin: 0;
      font-size: 1.05rem;
    }

    .panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .panel-header p {
      margin: 0.25rem 0 0;
      font-size: 0.9rem;
    }

    .panel-header a {
      color: var(--app-color-primary);
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
    }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .dashboard-grid {
      grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
    }

    .quick-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 88px;
      padding: 1rem;
      color: var(--app-color-text);
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    .quick-card--muted {
      color: var(--app-color-text-muted);
      cursor: default;
      opacity: 0.72;
    }

    button.quick-card {
      border: 1px solid var(--app-color-border);
      font: inherit;
      text-align: left;
    }

    .ticket-list,
    .support-list {
      display: grid;
      gap: 0.65rem;
    }

    .ticket-row,
    .support-list a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid var(--app-color-border);
      border-radius: 8px;
      color: var(--app-color-text);
      padding: 0.8rem;
      text-decoration: none;
    }

    .ticket-row span,
    .support-list a span {
      display: grid;
      gap: 0.15rem;
    }

    .ticket-row small {
      color: var(--app-color-text-muted);
    }

    .ticket-row em {
      border-radius: 999px;
      background: var(--app-color-background-soft);
      color: var(--app-color-text-muted);
      font-size: 0.78rem;
      font-style: normal;
      font-weight: 700;
      padding: 0.3rem 0.55rem;
      white-space: nowrap;
    }

    .support-list a {
      justify-content: flex-start;
      font-weight: 700;
    }

    .support-list a strong {
      margin-left: auto;
      border-radius: 999px;
      background: var(--app-color-danger, #ef4444);
      color: #fff;
      min-width: 1.45rem;
      padding: 0.15rem 0.45rem;
      text-align: center;
    }

    .empty-panel {
      display: grid;
      justify-items: center;
      gap: 0.5rem;
      border: 1px dashed var(--app-color-border);
      border-radius: 8px;
      color: var(--app-color-text-muted);
      padding: 2rem 1rem;
      text-align: center;
    }

    .empty-panel p {
      margin: 0;
    }

    @media (max-width: 760px) {
      .stay-page {
        padding: 1rem;
      }

      .stay-head,
      .balance-panel,
      .panel-header {
        flex-direction: column;
      }

      .stats-grid,
      .stay-dates,
      .quick-grid,
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class TenantStayHomeComponent {
  readonly Bell = Bell;
  readonly CalendarCheck = CalendarCheck;
  readonly CircleCheck = CircleCheck;
  readonly ClipboardList = ClipboardList;
  readonly CreditCard = CreditCard;
  readonly MessageSquare = MessageSquare;
  readonly Moon = Moon;
  readonly Wrench = Wrench;
  readonly Wallet = Wallet;

  private readonly maintenanceService = inject(TenantMaintenanceService);
  private readonly messageService = inject(InternalMessageService);
  private readonly reservationService = inject(ReservationService);
  private readonly slugService = inject(SlugService);

  readonly isLoading = signal(true);
  readonly reservations = signal<MyReservation[]>([]);
  readonly paymentTarget = signal<MyReservation | null>(null);
  readonly maintenanceRequests = this.maintenanceService.requests;
  readonly unreadMessages = this.messageService.unread;
  readonly activeReservation = computed(
    () =>
      this.reservations().find((reservation) => ACTIVE_STAY_STATUSES.has(reservation.status)) ??
      null,
  );
  readonly totalAmount = computed(() => Number(this.activeReservation()?.total_amount ?? 0));
  readonly paidAmount = computed(() => Number(this.activeReservation()?.paid_amount ?? 0));
  readonly remaining = computed(() => {
    return Math.max(0, this.totalAmount() - this.paidAmount());
  });
  readonly reservationsUrl = computed(() => this.slugService.buildUrl('/portal/reservas'));
  readonly maintenanceUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento'));
  readonly maintenanceCreateUrl = computed(() =>
    this.slugService.buildUrl('/portal/mantenimiento/nueva'),
  );
  readonly messagesUrl = computed(() => this.slugService.buildUrl('/portal/mensajes'));
  readonly notificationsUrl = computed(() => this.slugService.buildUrl('/portal/notificaciones'));
  readonly recentRequests = computed(() =>
    this.maintenanceRequests()
      .slice()
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 3),
  );
  readonly activeRequestCount = computed(
    () =>
      this.maintenanceRequests().filter(
        (request) =>
          request.status !== MaintenanceStatus.COMPLETED &&
          request.status !== MaintenanceStatus.CLOSED,
      ).length,
  );

  constructor() {
    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.isLoading.set(false);
      },
      error: () => {
        this.reservations.set([]);
        this.isLoading.set(false);
      },
    });
    this.maintenanceService.loadMyRequests();
    this.maintenanceService.loadStats();
    this.messageService.refreshUnread('tenant').subscribe({ error: () => undefined });
  }

  statusTone(status: ReservationStatus): AppStatusTone {
    return status === 'in_progress' ? 'success' : 'info';
  }

  openPayment(reservation: MyReservation): void {
    if (this.remaining() <= 0) return;
    this.paymentTarget.set(reservation);
  }

  requestDetailUrl(requestId: number): string {
    return this.slugService.buildUrl(`/portal/mantenimiento/${requestId}`);
  }

  maintenanceStatusLabel(request: MaintenanceRequest): string {
    return MaintenanceStatusLabels[request.status] ?? request.status;
  }

  closePayment(): void {
    this.paymentTarget.set(null);
  }

  onPaid(): void {
    this.paymentTarget.set(null);
    this.reloadReservations();
  }

  private reloadReservations(): void {
    this.isLoading.set(true);
    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.isLoading.set(false);
      },
      error: () => {
        this.reservations.set([]);
        this.isLoading.set(false);
      },
    });
  }
}
