import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Star } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { MyReservation } from '../../../core/services/reservation.service';
import { ReservationReviewDialogFacade } from './reservation-review-dialog.facade';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { AppTextareaComponent } from '../../../shared/ui/textarea/textarea.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reservation-review-dialog',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AppTextareaComponent,
  ],
  providers: [ReservationReviewDialogFacade],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'tenantReservations.review.title' | transloco"
      (closed)="closed.emit()"
    >
      @if (reservation(); as r) {
        <div class="review-body">
          <p class="review-prompt">
            {{ 'tenantReservations.review.prompt' | transloco }}
            <strong>{{ r.property_name }}</strong>
          </p>

          <div
            class="stars"
            role="radiogroup"
            [attr.aria-label]="'tenantReservations.review.ratingAria' | transloco"
          >
            @for (star of stars; track star) {
              <button
                type="button"
                class="star"
                [class.filled]="star <= rating()"
                [attr.aria-label]="star + '★'"
                [attr.aria-pressed]="star === rating()"
                (click)="setRating(star)"
              >
                <lucide-icon [img]="Star" [size]="28"></lucide-icon>
              </button>
            }
          </div>

          <app-textarea
            [label]="'tenantReservations.review.comment' | transloco"
            [ngModel]="comment()"
            (ngModelChange)="setComment($event)"
          />
        </div>
      }

      @if (reservation(); as r) {
        <div class="dialog-actions" dialog-actions>
          <app-button appearance="outline" (clicked)="closed.emit()">
            {{ 'common.cancel' | transloco }}
          </app-button>
          <app-button [disabled]="rating() < 1" [loading]="isSubmitting()" (clicked)="onSubmit(r)">
            {{ 'tenantReservations.review.submit' | transloco }}
          </app-button>
        </div>
      }
    </app-dialog>
  `,
  styles: [
    `
      .review-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .review-prompt {
        margin: 0;
        font-size: 0.9rem;
        color: var(--color-text-muted, #6b7280);
      }
      .stars {
        display: flex;
        gap: 0.25rem;
      }
      .star {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        color: var(--color-border-strong, #d1d5db);
        transition: color 0.12s ease;
      }
      .star.filled {
        color: var(--color-warning, #f59e0b);
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.25rem;
      }
    `,
  ],
})
export class ReservationReviewDialogComponent extends ReservationReviewDialogFacade {
  readonly Star = Star;

  readonly reservation = input<MyReservation | null>(null);
  readonly open = input(false);
  readonly closed = output<void>();
  readonly reviewed = output<void>();

  constructor() {
    super();
    effect(() => {
      if (this.open()) this.reset();
    });
  }

  onSubmit(reservation: MyReservation): void {
    this.submit(reservation, () => this.reviewed.emit());
  }
}
