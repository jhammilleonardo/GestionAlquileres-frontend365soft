import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  CalendarDays,
  LucideAngularModule,
  TriangleAlert,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';
import { PaymentScheduleItem } from '../tenant-create-payment.facade';

@Component({
  selector: 'app-tenant-payment-schedule',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule, TranslocoModule, AppLoadingStateComponent],
  template: `
    @if (loading()) {
      <section class="calendar-card loading-cal">
        <app-loading-state [label]="'public.tenantPayments.loadingCalendar' | transloco" />
      </section>
    } @else if (schedule().length > 0) {
      <section class="calendar-card">
        <div class="calendar-header" (click)="toggleExpanded.emit()">
          <div class="calendar-title">
            <lucide-icon [img]="CalendarDays" [size]="20" class="cal-icon"></lucide-icon>
            <h2>{{ 'public.tenantPayments.calendarTitle' | transloco }}</h2>
            <span class="cal-badge">{{
              'public.tenantPayments.installmentsCount' | transloco: { count: schedule().length }
            }}</span>
          </div>

          <div class="cal-stepper">
            @for (item of schedule(); track item.label; let last = $last) {
              <div class="cal-step-item">
                <div class="cal-step-circle cal-step-{{ item.status }}" [title]="item.label">
                  @if (item.status === 'paid') {
                    <lucide-icon [img]="CheckCheck" [size]="9"></lucide-icon>
                  }
                </div>
                @if (!last) {
                  <div class="cal-step-line cal-step-line-{{ item.status }}"></div>
                }
              </div>
            }
            <span class="cal-stepper-label">{{ paidCount() }}/{{ schedule().length }}</span>
          </div>

          <button type="button" class="cal-toggle-btn" aria-label="Toggle calendar">
            @if (expanded()) {
              <lucide-icon [img]="ChevronUp" [size]="20"></lucide-icon>
            } @else {
              <lucide-icon [img]="ChevronDown" [size]="20"></lucide-icon>
            }
          </button>
        </div>

        @if (expanded()) {
          <div class="cal-legend">
            <span class="legend-item paid">
              <span class="legend-dot"></span>
              {{ 'public.tenantPayments.calPaid' | transloco }}
            </span>
            <span class="legend-item current">
              <span class="legend-dot"></span>
              {{ 'public.tenantPayments.calCurrent' | transloco }}
            </span>
            <span class="legend-item overdue">
              <span class="legend-dot"></span>
              {{ 'public.tenantPayments.calOverdue' | transloco }}
            </span>
            <span class="legend-item upcoming">
              <span class="legend-dot"></span>
              {{ 'public.tenantPayments.calUpcoming' | transloco }}
            </span>
          </div>

          <div class="cal-scroll-container">
            <div class="cal-track">
              @for (item of schedule(); track item.label) {
                <div class="cal-item cal-{{ item.status }}">
                  <div class="cal-item-body">
                    <div class="cal-month">{{ item.label }}</div>
                    <div class="cal-due">
                      {{
                        'public.tenantPayments.dueDayX' | transloco: { day: item.dueDate.getDate() }
                      }}
                    </div>
                    <div class="cal-amount">
                      {{ item.currency }}&nbsp;{{ item.amount | number: '1.2-2' }}
                    </div>
                    <div class="cal-status-row">
                      @switch (item.status) {
                        @case ('paid') {
                          <lucide-icon [img]="CheckCheck" [size]="11"></lucide-icon>
                        }
                        @case ('current') {
                          <lucide-icon [img]="CreditCard" [size]="11"></lucide-icon>
                        }
                        @case ('overdue') {
                          <lucide-icon [img]="TriangleAlert" [size]="11"></lucide-icon>
                        }
                        @case ('upcoming') {
                          <lucide-icon [img]="Clock" [size]="11"></lucide-icon>
                        }
                      }
                      <span class="cal-status-badge">{{ item.statusLabel }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .calendar-card {
      margin-bottom: 24px;
      overflow: hidden;
      border: 1px solid var(--app-color-border);
      border-radius: 14px;
      background: var(--app-color-surface);
      box-shadow: 0 2px 12px rgba(37, 99, 235, 0.08);
    }

    .loading-cal {
      padding: 18px 20px;
      color: var(--app-color-text-muted);
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid var(--app-color-border);
      background: var(--app-color-surface);
      transition: background 0.15s;
    }

    .calendar-header:hover {
      background: var(--app-color-surface-muted);
    }

    .calendar-title {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .calendar-title h2 {
      margin: 0;
      color: var(--app-color-text);
      font-size: 0.975rem;
      font-weight: 760;
    }

    .cal-icon {
      color: var(--app-color-primary);
      background: var(--app-color-primary-softer);
      border-radius: 8px;
      padding: 5px;
      display: flex;
    }

    .cal-badge {
      border-radius: 999px;
      background: var(--app-color-primary-softer);
      color: var(--app-color-primary);
      padding: 3px 9px;
      font-size: 0.72rem;
      font-weight: 760;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    .cal-toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 8px;
      background: var(--app-color-surface-muted);
      color: var(--app-color-text-muted);
      cursor: pointer;
    }

    .cal-stepper {
      display: flex;
      align-items: center;
      margin-left: auto;
      gap: 0;
      overflow-x: auto;
      scrollbar-width: none;
      max-width: 260px;
    }

    .cal-stepper::-webkit-scrollbar {
      display: none;
    }

    .cal-step-item {
      display: flex;
      align-items: center;
    }

    .cal-step-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.15s;
      cursor: default;
    }

    .cal-step-circle:hover {
      transform: scale(1.25);
    }

    .cal-step-paid {
      background: var(--app-color-success);
      color: #fff;
    }

    .cal-step-current {
      background: var(--app-color-primary);
      color: #fff;
      box-shadow: 0 0 0 3px var(--app-color-primary-softer);
    }

    .cal-step-overdue {
      background: var(--app-color-danger);
      color: #fff;
    }

    .cal-step-upcoming {
      border: 2px solid var(--app-color-border);
      background: var(--app-color-surface);
      color: var(--app-color-border-strong);
    }

    .cal-step-line {
      width: 18px;
      height: 2px;
      flex-shrink: 0;
    }

    .cal-step-line-paid {
      background: var(--app-color-success);
    }

    .cal-step-line-current {
      background: var(--app-color-primary-softer);
    }

    .cal-step-line-overdue {
      background: #fca5a5;
    }

    .cal-step-line-upcoming {
      background: var(--app-color-border);
    }

    .cal-stepper-label {
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .cal-legend {
      display: flex;
      gap: 16px;
      padding: 10px 20px;
      background: var(--app-color-surface-muted);
      border-bottom: 1px solid var(--app-color-border);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 650;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .legend-item.paid .legend-dot {
      background: var(--app-color-success);
    }

    .legend-item.current .legend-dot {
      background: var(--app-color-primary);
    }

    .legend-item.overdue .legend-dot {
      background: var(--app-color-danger);
    }

    .legend-item.upcoming .legend-dot {
      background: var(--app-color-border-strong);
    }

    .cal-scroll-container {
      overflow-x: auto;
      padding: 16px 20px 20px;
      background: var(--app-color-surface);
      scrollbar-width: thin;
      scrollbar-color: var(--app-color-border) transparent;
    }

    .cal-track {
      display: flex;
      gap: 10px;
      min-width: max-content;
    }

    .cal-item {
      min-width: 120px;
      max-width: 120px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      border: 1px solid transparent;
      background: var(--app-color-surface);
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
      transition:
        transform 0.15s,
        box-shadow 0.15s,
        border-color 0.15s;
    }

    .cal-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.1);
      border-color: var(--app-color-success);
    }

    .cal-current {
      box-shadow: 0 0 0 2px #93c5fd;
    }

    .cal-item-body {
      padding: 10px 11px 11px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }

    .cal-month {
      font-size: 0.82rem;
      font-weight: 800;
      text-transform: capitalize;
      letter-spacing: 0.01em;
    }

    .cal-due {
      color: var(--app-color-text-muted);
      font-size: 0.7rem;
      font-weight: 500;
    }

    .cal-amount {
      margin-top: 6px;
      font-size: 0.88rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .cal-status-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 3px 7px;
      border-radius: 999px;
      width: fit-content;
    }

    .cal-status-badge {
      font-size: 0.67rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .cal-paid .cal-month,
    .cal-paid .cal-status-row {
      color: #065f46;
    }

    .cal-paid .cal-amount {
      color: var(--app-color-success);
    }

    .cal-paid .cal-status-row {
      background: #d1fae5;
    }

    .cal-current .cal-month,
    .cal-current .cal-status-row {
      color: #1d4ed8;
    }

    .cal-current .cal-amount {
      color: var(--app-color-primary);
    }

    .cal-current .cal-status-row {
      background: var(--app-color-primary-softer);
    }

    .cal-overdue .cal-month,
    .cal-overdue .cal-status-row {
      color: #991b1b;
    }

    .cal-overdue .cal-amount {
      color: var(--app-color-danger);
    }

    .cal-overdue .cal-status-row {
      background: #fee2e2;
    }

    .cal-upcoming .cal-month,
    .cal-upcoming .cal-amount,
    .cal-upcoming .cal-status-row {
      color: var(--app-color-text-muted);
    }

    .cal-upcoming .cal-status-row {
      background: var(--app-color-surface-muted);
    }

    @media (max-width: 768px) {
      .calendar-header {
        align-items: flex-start;
        flex-wrap: wrap;
      }

      .cal-stepper {
        order: 3;
        width: 100%;
        max-width: 100%;
        margin-left: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantPaymentScheduleComponent {
  readonly loading = input(false);
  readonly schedule = input<readonly PaymentScheduleItem[]>([]);
  readonly expanded = input(true);
  readonly paidCount = input(0);
  readonly toggleExpanded = output<void>();

  readonly CalendarDays = CalendarDays;
  readonly CheckCheck = CheckCheck;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;
  readonly Clock = Clock;
  readonly CreditCard = CreditCard;
  readonly TriangleAlert = TriangleAlert;
}
