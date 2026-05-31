import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, CreditCard, Wrench, Bell, History } from 'lucide-angular';
// DecimalPipe se usa programáticamente (formatAmount), no en el template.

import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { TenantMaintenanceService } from '../../../core/services/tenant/tenant-maintenance.service';
import { TenantNotificationService } from '../../../core/services/tenant/tenant-notification.service';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

type TimelineKind = 'payment' | 'maintenance' | 'notification';

interface TimelineItem {
  kind: TimelineKind;
  date: string;
  title: string;
  detail: string;
}

@Component({
  selector: 'app-tenant-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TranslocoModule, LucideAngularModule, AppEmptyStateComponent],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  template: `
    <section class="hist-page">
      <header class="hist-header">
        <h1>
          <lucide-icon [img]="History" [size]="22" /> {{ 'public.tenantHistory.title' | transloco }}
        </h1>
        <p>{{ 'public.tenantHistory.subtitle' | transloco }}</p>
      </header>

      @if (timeline().length === 0) {
        <app-empty-state [title]="'public.tenantHistory.empty' | transloco" />
      } @else {
        <ol class="timeline">
          @for (item of timeline(); track item.kind + item.date + item.title) {
            <li class="tl-item" [attr.data-kind]="item.kind">
              <span class="tl-dot">
                <lucide-icon [img]="iconFor(item.kind)" [size]="14" />
              </span>
              <div class="tl-body">
                <div class="tl-top">
                  <strong>{{ item.title }}</strong>
                  <span class="tl-date">{{ item.date | date: 'short' }}</span>
                </div>
                <span class="tl-detail">{{ item.detail }}</span>
              </div>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: `
    .hist-page {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      max-width: 760px;
      margin: 0 auto;
    }
    .hist-header h1 {
      margin: 0;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hist-header p {
      margin: 0.25rem 0 0;
      color: var(--app-color-text-muted);
    }
    .timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0;
    }
    .tl-item {
      position: relative;
      display: flex;
      gap: 0.9rem;
      padding: 0 0 1.1rem 0.2rem;
    }
    .tl-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 13px;
      top: 26px;
      bottom: 0;
      width: 2px;
      background: var(--app-color-border);
    }
    .tl-dot {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      z-index: 1;
    }
    .tl-item[data-kind='payment'] .tl-dot {
      background: #16a34a;
    }
    .tl-item[data-kind='maintenance'] .tl-dot {
      background: #2563eb;
    }
    .tl-item[data-kind='notification'] .tl-dot {
      background: #d97706;
    }
    .tl-body {
      flex: 1;
      min-width: 0;
    }
    .tl-top {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tl-date {
      color: var(--app-color-text-muted);
      font-size: 0.78rem;
      white-space: nowrap;
    }
    .tl-detail {
      color: var(--app-color-text-muted);
      font-size: 0.85rem;
    }
  `,
})
export class TenantHistoryComponent {
  readonly CreditCard = CreditCard;
  readonly Wrench = Wrench;
  readonly Bell = Bell;
  readonly History = History;

  private readonly paymentService = inject(TenantPaymentService);
  private readonly maintenanceService = inject(TenantMaintenanceService);
  private readonly notificationService = inject(TenantNotificationService);

  readonly timeline = computed<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    for (const p of this.paymentService.payments()) {
      const date = (p.payment_date ?? p.created_at) as string | undefined;
      items.push({
        kind: 'payment',
        date: date ?? '',
        title: `Pago ${this.formatAmount(p.amount)}`,
        detail: String(p.status ?? ''),
      });
    }

    for (const r of this.maintenanceService.requests()) {
      items.push({
        kind: 'maintenance',
        date: (r.created_at as unknown as string) ?? '',
        title: r.title,
        detail: String(r.status ?? ''),
      });
    }

    for (const n of this.notificationService.notifications()) {
      items.push({
        kind: 'notification',
        date: (n.created_at as unknown as string) ?? '',
        title: n.title,
        detail: n.message ?? '',
      });
    }

    return items
      .filter((i) => i.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  constructor() {
    this.paymentService.loadPayments();
    this.maintenanceService.loadMyRequests();
    this.notificationService.loadNotifications();
  }

  iconFor(kind: TimelineKind) {
    return kind === 'payment' ? this.CreditCard : kind === 'maintenance' ? this.Wrench : this.Bell;
  }

  private formatAmount(amount: number): string {
    return new DecimalPipe('en-US').transform(amount, '1.0-2') ?? String(amount);
  }
}
