import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { ReservationAnalyticsFacade } from './reservation-analytics.facade';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { AppDatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reservation-analytics',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    TenantCurrencyPipe,
    AppDatePickerComponent,
    AppLoadingStateComponent,
  ],
  providers: [
    ReservationAnalyticsFacade,
    provideTranslocoScope({ scope: 'reservas', alias: 'reservations' }),
  ],
  template: `
    <section class="analytics">
      <header class="analytics-header">
        <h2 class="analytics-title">{{ 'reservations.analytics.title' | transloco }}</h2>
        <form [formGroup]="form" class="analytics-range">
          <app-date-picker
            [label]="'reservations.analytics.from' | transloco"
            formControlName="from"
          />
          <app-date-picker [label]="'reservations.analytics.to' | transloco" formControlName="to" />
        </form>
      </header>

      @if (isLoading()) {
        <app-loading-state />
      } @else if (analytics(); as a) {
        <div class="kpis">
          <article class="kpi">
            <span class="kpi-label">{{ 'reservations.analytics.occupancy' | transloco }}</span>
            <strong class="kpi-value">{{ occupancyPct() }}%</strong>
            <span class="kpi-sub">
              {{ a.booked_nights }} / {{ a.available_nights }}
              {{ 'reservations.analytics.nights' | transloco }}
            </span>
          </article>
          <article class="kpi">
            <span class="kpi-label">{{ 'reservations.analytics.revenue' | transloco }}</span>
            <strong class="kpi-value">{{ a.revenue | tenantCurrency: a.currency }}</strong>
          </article>
          <article class="kpi">
            <span class="kpi-label">{{ 'reservations.analytics.adr' | transloco }}</span>
            <strong class="kpi-value">{{ a.adr | tenantCurrency: a.currency }}</strong>
            <span class="kpi-sub">{{ 'reservations.analytics.adrSub' | transloco }}</span>
          </article>
          <article class="kpi">
            <span class="kpi-label">{{ 'reservations.analytics.units' | transloco }}</span>
            <strong class="kpi-value">{{ a.short_term_units }}</strong>
          </article>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .analytics {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 0.875rem;
        background: var(--color-surface, #fff);
        margin-bottom: 1.5rem;
      }
      .analytics-header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
      }
      .analytics-title {
        font-size: 1.05rem;
        font-weight: 600;
      }
      .analytics-range {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .kpis {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      @media (min-width: 640px) {
        .kpis {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 1024px) {
        .kpis {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      .kpi {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 1rem;
        border-radius: 0.75rem;
        background: var(--color-surface-muted, #f9fafb);
      }
      .kpi-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-text-muted, #6b7280);
      }
      .kpi-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--color-text-strong, #111827);
      }
      .kpi-sub {
        font-size: 0.78rem;
        color: var(--color-text-muted, #6b7280);
      }
    `,
  ],
})
export class ReservationAnalyticsComponent extends ReservationAnalyticsFacade {}
