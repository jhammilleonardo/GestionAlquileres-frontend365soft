import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { SeasonRulesFacade } from './season-rules.facade';
import { SeasonRule } from '../../../core/models/reservation-admin.model';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-season-rules-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantCurrencyPipe,
    TenantDatePipe,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
    AppTextFieldComponent,
  ],
  providers: [
    SeasonRulesFacade,
    provideTranslocoScope({ scope: 'reservas', alias: 'reservations' }),
  ],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'reservations.seasons.title' | transloco"
      [showFooter]="false"
      (closed)="closed.emit()"
    >
      @if (isLoading()) {
        <app-loading-state />
      } @else {
        @if (seasons().length === 0) {
          <p class="seasons-empty">{{ 'reservations.seasons.empty' | transloco }}</p>
        } @else {
          <ul class="seasons-list">
            @for (season of seasons(); track season.id) {
              <li class="season-item">
                <div class="season-info">
                  <strong>{{ season.name }}</strong>
                  <span class="season-range">
                    {{ season.start_date | tenantDate }} → {{ season.end_date | tenantDate }}
                  </span>
                  <span class="season-meta">
                    @if (season.price_per_night !== null) {
                      {{ season.price_per_night | tenantCurrency }}
                    }
                    @if (season.min_nights !== null) {
                      · {{ 'reservations.seasons.min' | transloco }}
                      {{ season.min_nights }}
                    }
                  </span>
                </div>
                <button
                  type="button"
                  class="season-delete"
                  [attr.aria-label]="'common.delete' | transloco"
                  (click)="onDelete(season)"
                >
                  <lucide-icon [img]="Trash2" [size]="16"></lucide-icon>
                </button>
              </li>
            }
          </ul>
        }

        <form [formGroup]="form" class="season-form">
          <h3 class="form-title">{{ 'reservations.seasons.add' | transloco }}</h3>
          <app-text-field
            [label]="'reservations.seasons.name' | transloco"
            formControlName="name"
          />
          <div class="form-row">
            <app-date-picker
              [label]="'reservations.seasons.start' | transloco"
              formControlName="start_date"
            />
            <app-date-picker
              [label]="'reservations.seasons.end' | transloco"
              formControlName="end_date"
            />
          </div>
          <div class="form-row">
            <app-text-field
              [label]="'reservations.seasons.price' | transloco"
              type="number"
              formControlName="price_per_night"
            />
            <app-text-field
              [label]="'reservations.seasons.minNights' | transloco"
              type="number"
              formControlName="min_nights"
            />
          </div>
          <app-button [loading]="isSaving()" [fullWidth]="true" (clicked)="submit()">
            {{ 'reservations.seasons.addButton' | transloco }}
          </app-button>
        </form>
      }
    </app-dialog>
  `,
  styles: [
    `
      .seasons-empty {
        font-size: 0.9rem;
        color: var(--color-text-muted, #6b7280);
      }
      .seasons-list {
        list-style: none;
        margin: 0 0 1.25rem;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .season-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.625rem;
        background: var(--color-surface-muted, #f9fafb);
      }
      .season-info {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .season-range {
        font-size: 0.82rem;
        color: var(--color-text, #374151);
      }
      .season-meta {
        font-size: 0.8rem;
        color: var(--color-text-muted, #6b7280);
      }
      .season-delete {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--color-danger, #dc2626);
        padding: 0.25rem;
      }
      .season-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        border-top: 1px solid var(--color-border, #e5e7eb);
        padding-top: 1rem;
      }
      .form-title {
        font-size: 0.95rem;
        font-weight: 600;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
    `,
  ],
})
export class SeasonRulesDialogComponent extends SeasonRulesFacade {
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

  onDelete(season: SeasonRule): void {
    void this.delete(season);
  }
}
