import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw, Trash2 } from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { CalendarSyncFacade } from './calendar-sync.facade';
import { CalendarSyncSource } from '../../../core/models/reservation-admin.model';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-calendar-sync-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    AppButtonComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
    AppTextFieldComponent,
  ],
  providers: [
    CalendarSyncFacade,
    provideTranslocoScope({ scope: 'reservas', alias: 'reservations' }),
  ],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'reservations.calendarSync.title' | transloco"
      [showFooter]="false"
      (closed)="closed.emit()"
    >
      @if (isLoading()) {
        <app-loading-state />
      } @else {
        @if (sources().length === 0) {
          <p class="cs-empty">{{ 'reservations.calendarSync.empty' | transloco }}</p>
        } @else {
          <ul class="cs-list">
            @for (source of sources(); track source.id) {
              <li class="cs-item">
                <div class="cs-info">
                  <strong>{{ source.name }}</strong>
                  <span class="cs-url">{{ source.url }}</span>
                  @if (source.last_synced_at) {
                    <span class="cs-synced">
                      {{ 'reservations.calendarSync.lastSync' | transloco }}:
                      {{ source.last_synced_at | tenantDate: true }}
                    </span>
                  }
                </div>
                <div class="cs-actions">
                  <button
                    type="button"
                    class="cs-icon"
                    [disabled]="busyId() !== null"
                    [attr.aria-label]="'reservations.calendarSync.syncNow' | transloco"
                    (click)="syncNow(source)"
                  >
                    <lucide-icon [img]="RefreshCw" [size]="16"></lucide-icon>
                  </button>
                  <button
                    type="button"
                    class="cs-icon cs-danger"
                    [attr.aria-label]="'common.delete' | transloco"
                    (click)="onRemove(source)"
                  >
                    <lucide-icon [img]="Trash2" [size]="16"></lucide-icon>
                  </button>
                </div>
              </li>
            }
          </ul>
        }

        <form [formGroup]="form" class="cs-form">
          <h3 class="cs-form-title">{{ 'reservations.calendarSync.add' | transloco }}</h3>
          <app-text-field
            [label]="'reservations.calendarSync.name' | transloco"
            formControlName="name"
          />
          <app-text-field
            [label]="'reservations.calendarSync.url' | transloco"
            placeholder="https://…/calendar.ics"
            formControlName="url"
          />
          <app-button [loading]="isSaving()" [fullWidth]="true" (clicked)="submit()">
            {{ 'reservations.calendarSync.addButton' | transloco }}
          </app-button>
        </form>
      }
    </app-dialog>
  `,
  styles: [
    `
      .cs-empty {
        font-size: 0.9rem;
        color: var(--color-text-muted, #6b7280);
      }
      .cs-list {
        list-style: none;
        margin: 0 0 1.25rem;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .cs-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.625rem;
        background: var(--color-surface-muted, #f9fafb);
      }
      .cs-info {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .cs-url {
        font-size: 0.78rem;
        color: var(--color-text-muted, #6b7280);
        word-break: break-all;
      }
      .cs-synced {
        font-size: 0.75rem;
        color: var(--color-text-muted, #9ca3af);
      }
      .cs-actions {
        display: flex;
        gap: 0.25rem;
      }
      .cs-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.3rem;
        color: var(--color-text-muted, #6b7280);
      }
      .cs-icon.cs-danger {
        color: var(--color-danger, #dc2626);
      }
      .cs-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        border-top: 1px solid var(--color-border, #e5e7eb);
        padding-top: 1rem;
      }
      .cs-form-title {
        font-size: 0.95rem;
        font-weight: 600;
      }
    `,
  ],
})
export class CalendarSyncDialogComponent extends CalendarSyncFacade {
  readonly RefreshCw = RefreshCw;
  readonly Trash2 = Trash2;

  readonly unitId = input(0);
  readonly open = input(false);
  readonly closed = output<void>();

  constructor() {
    super();
    effect(() => {
      if (this.open() && this.unitId() > 0) {
        this.load(this.unitId());
      }
    });
  }

  onRemove(source: CalendarSyncSource): void {
    void this.remove(source);
  }
}
