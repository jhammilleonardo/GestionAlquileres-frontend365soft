import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { HousekeepingFacade } from './housekeeping.facade';
import { HousekeepingTask } from '../../../core/models/reservation-admin.model';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { AppSelectComponent } from '../../../shared/ui/select/select.component';
import { AppStatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-housekeeping',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    TenantDatePipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
  ],
  providers: [
    HousekeepingFacade,
    provideTranslocoScope({ scope: 'reservas', alias: 'reservations' }),
  ],
  template: `
    <div class="hk-page">
      <app-page-header
        eyebrow="365Soft"
        [title]="'reservations.housekeeping.title' | transloco"
        [description]="'reservations.housekeeping.subtitle' | transloco"
      />

      <form [formGroup]="filterForm" class="hk-filter">
        <app-select
          [label]="'reservations.housekeeping.filter' | transloco"
          [options]="statusOptions()"
          formControlName="status"
        />
      </form>

      @if (isLoading()) {
        <app-loading-state />
      } @else if (tasks().length === 0) {
        <app-empty-state
          [title]="'reservations.housekeeping.emptyTitle' | transloco"
          [description]="'reservations.housekeeping.emptyDescription' | transloco"
        />
      } @else {
        <ul class="hk-list">
          @for (task of tasks(); track task.id) {
            <li class="hk-card">
              <div class="hk-info">
                <div class="hk-head">
                  <app-status-badge
                    [label]="'reservations.housekeeping.status.' + task.status | transloco"
                    [tone]="statusTone(task.status)"
                  />
                  <span class="hk-date">{{ task.scheduled_date | tenantDate }}</span>
                </div>
                <strong class="hk-unit">
                  {{ task.property_name }}
                  @if (task.unit_number) {
                    · {{ 'reservations.housekeeping.unit' | transloco }} {{ task.unit_number }}
                  }
                </strong>
                @if (task.assignee_name) {
                  <span class="hk-assignee">{{ task.assignee_name }}</span>
                }
              </div>

              @if (nextStatus(task); as next) {
                <app-button
                  size="s"
                  [loading]="busyId() === task.id"
                  [disabled]="busyId() !== null"
                  (clicked)="advance(task)"
                >
                  {{ 'reservations.housekeeping.advance.' + next | transloco }}
                </app-button>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .hk-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.25rem;
      }
      @media (min-width: 1024px) {
        .hk-page {
          padding: 2rem;
        }
      }
      .hk-filter {
        max-width: 16rem;
      }
      .hk-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .hk-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 0.875rem;
        background: var(--color-surface, #fff);
      }
      .hk-info {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        min-width: 0;
      }
      .hk-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .hk-date {
        font-size: 0.82rem;
        color: var(--color-text-muted, #6b7280);
      }
      .hk-unit {
        font-size: 0.95rem;
        color: var(--color-text-strong, #1f2937);
      }
      .hk-assignee {
        font-size: 0.8rem;
        color: var(--color-text-muted, #6b7280);
      }
    `,
  ],
})
export class HousekeepingComponent extends HousekeepingFacade {
  onAdvance(task: HousekeepingTask): void {
    this.advance(task);
  }
}
