import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  AlertCircle,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Info,
  Landmark,
  LucideAngularModule,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { Contract } from '../../../../core/services/tenant/tenant-contract.service';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';

@Component({
  selector: 'app-tenant-contract-payment-summary',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule, TranslocoModule, AppLoadingStateComponent],
  template: `
    @if (loading()) {
      <section class="contract-summary-card loading">
        <app-loading-state [label]="'public.tenantCreatePayment.loadingContract' | transloco" />
      </section>
    } @else if (contract(); as c) {
      <section class="contract-summary-card">
        <div class="summary-header">
          <span class="summary-icon">
            <lucide-icon [img]="FileText" [size]="16"></lucide-icon>
          </span>
          <h2>{{ 'public.tenantCreatePayment.contractSummaryTitle' | transloco }}</h2>
          <span class="contract-number">{{ c.contract_number }}</span>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="icon-wrap">
              <lucide-icon [img]="Home" [size]="16"></lucide-icon>
            </span>
            <div>
              <span class="summary-label">{{
                'public.tenantCreatePayment.property' | transloco
              }}</span>
              <span class="summary-value">{{
                c.property?.title || ('public.tenantCreatePayment.property' | transloco)
              }}</span>
            </div>
          </div>

          <div class="summary-item highlight">
            <span class="icon-wrap">
              <lucide-icon [img]="CreditCard" [size]="16"></lucide-icon>
            </span>
            <div>
              <span class="summary-label">{{
                'public.tenantCreatePayment.monthlyRent' | transloco
              }}</span>
              <span class="summary-value amount">
                {{ c.currency || 'USD' }} {{ c.monthly_rent | number: '1.2-2' }}
              </span>
            </div>
          </div>

          @if (c.payment_day) {
            <div class="summary-item">
              <span class="icon-wrap">
                <lucide-icon [img]="Calendar" [size]="16"></lucide-icon>
              </span>
              <div>
                <span class="summary-label">{{
                  'public.tenantCreatePayment.paymentDay' | transloco
                }}</span>
                <span class="summary-value">{{
                  'public.tenantCreatePayment.paymentDayDesc' | transloco: { day: c.payment_day }
                }}</span>
              </div>
            </div>
          }

          @if (c.payment_method) {
            <div class="summary-item">
              <span class="icon-wrap">
                <lucide-icon [img]="Info" [size]="16"></lucide-icon>
              </span>
              <div>
                <span class="summary-label">{{
                  'public.tenantCreatePayment.agreedMethod' | transloco
                }}</span>
                <span class="summary-value">{{ c.payment_method }}</span>
              </div>
            </div>
          }

          @if (c.bank_name) {
            <div class="summary-item bank-info">
              <span class="icon-wrap">
                <lucide-icon [img]="Landmark" [size]="16"></lucide-icon>
              </span>
              <div>
                <span class="summary-label">{{
                  'public.tenantCreatePayment.bankDestination' | transloco
                }}</span>
                <span class="summary-value">{{ c.bank_name }}</span>
                @if (c.bank_account_holder) {
                  <span class="summary-sub">
                    {{ 'public.tenantCreatePayment.holder' | transloco }}:
                    {{ c.bank_account_holder }}
                  </span>
                }
                @if (c.bank_account_number) {
                  <span class="summary-sub">
                    {{ 'public.tenantCreatePayment.account' | transloco }}:
                    {{ c.bank_account_number }}
                  </span>
                }
                @if (c.bank_account_type) {
                  <span class="summary-sub">
                    {{ 'public.tenantCreatePayment.accountType' | transloco }}:
                    {{ c.bank_account_type }}
                  </span>
                }
              </div>
            </div>
          }

          @if (c.grace_days || c.late_fee_percentage) {
            <div class="summary-item warning">
              <span class="icon-wrap">
                <lucide-icon [img]="AlertCircle" [size]="16"></lucide-icon>
              </span>
              <div>
                <span class="summary-label">{{
                  'public.tenantCreatePayment.latePenalty' | transloco
                }}</span>
                <span class="summary-value">
                  @if (c.grace_days) {
                    {{ 'public.tenantCreatePayment.graceDays' | transloco: { days: c.grace_days } }}
                    ·
                  }
                  @if (c.late_fee_percentage) {
                    {{
                      'public.tenantCreatePayment.lateFee'
                        | transloco: { fee: c.late_fee_percentage }
                    }}
                  }
                </span>
              </div>
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .contract-summary-card {
      margin-bottom: 24px;
      overflow: hidden;
      border: 1px solid var(--app-color-border);
      border-radius: 14px;
      background: var(--app-color-surface);
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
    }

    .contract-summary-card.loading {
      padding: 18px 24px;
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background: var(--app-color-primary);
      flex-wrap: wrap;
    }

    .summary-header h2 {
      margin: 0;
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.975rem;
      font-weight: 650;
      letter-spacing: 0.01em;
    }

    .summary-icon {
      display: flex;
      color: rgba(255, 255, 255, 0.9);
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 6px;
    }

    .contract-number {
      margin-left: auto;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.74);
      padding: 3px 10px;
      font-size: 0.75rem;
      font-weight: 650;
      letter-spacing: 0.03em;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      padding: 16px;
      background: var(--app-color-surface);
    }

    .summary-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      border: 1px solid var(--app-color-border);
      border-radius: 10px;
      background: var(--app-color-surface-muted);
      padding: 12px 14px;
      transition: box-shadow 0.15s;
    }

    .summary-item:hover {
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
    }

    .icon-wrap {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--app-color-border);
      color: var(--app-color-text-muted);
    }

    .summary-item.highlight {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .summary-item.highlight .icon-wrap {
      background: var(--app-color-primary);
      color: #fff;
    }

    .summary-item.bank-info {
      grid-column: 1 / -1;
      background: #f0f9ff;
      border-color: #bae6fd;
    }

    .summary-item.bank-info .icon-wrap {
      background: #0ea5e9;
      color: #fff;
    }

    .summary-item.warning {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .summary-item.warning .icon-wrap {
      background: #f59e0b;
      color: #fff;
    }

    .summary-label {
      display: block;
      margin-bottom: 3px;
      color: var(--app-color-text-subtle);
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 760;
    }

    .summary-value {
      display: block;
      color: var(--app-color-text);
      font-size: 0.9rem;
      font-weight: 520;
      line-height: 1.3;
    }

    .summary-value.amount {
      color: var(--app-color-primary);
      font-size: 1.2rem;
      font-weight: 820;
      letter-spacing: -0.01em;
    }

    .summary-sub {
      display: block;
      color: var(--app-color-text-muted);
      font-size: 0.8rem;
      margin-top: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantContractPaymentSummaryComponent {
  readonly loading = input(false);
  readonly contract = input<Contract | null>(null);

  readonly AlertCircle = AlertCircle;
  readonly Calendar = Calendar;
  readonly CreditCard = CreditCard;
  readonly FileText = FileText;
  readonly Home = Home;
  readonly Info = Info;
  readonly Landmark = Landmark;
}
