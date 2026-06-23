import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Star } from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { AdminReviewsFacade } from './admin-reviews.facade';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { AppSelectComponent } from '../../../shared/ui/select/select.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
  ],
  providers: [
    AdminReviewsFacade,
    provideTranslocoScope({ scope: 'reservas', alias: 'reservations' }),
  ],
  template: `
    <div class="reviews-page">
      <app-page-header
        eyebrow="365Soft"
        [title]="'reservations.reviews.title' | transloco"
        [description]="'reservations.reviews.subtitle' | transloco"
      />

      <header class="reviews-toolbar">
        <form [formGroup]="filterForm">
          <app-select
            [label]="'reservations.reviews.property' | transloco"
            [options]="propertyOptions()"
            formControlName="property_id"
          />
        </form>
        @if (reviews().length > 0) {
          <div class="reviews-summary">
            <span class="summary-avg">
              <lucide-icon [img]="Star" [size]="18" class="star-filled"></lucide-icon>
              {{ average() }}
            </span>
            <span class="summary-count">
              {{ reviews().length }} {{ 'reservations.reviews.count' | transloco }}
            </span>
          </div>
        }
      </header>

      @if (isLoading()) {
        <app-loading-state />
      } @else if (reviews().length === 0) {
        <app-empty-state
          [title]="'reservations.reviews.emptyTitle' | transloco"
          [description]="'reservations.reviews.emptyDescription' | transloco"
        >
          <lucide-icon icon [img]="Star" [size]="40"></lucide-icon>
        </app-empty-state>
      } @else {
        <ul class="reviews-list">
          @for (review of reviews(); track review.id) {
            <li class="review-card">
              <div class="review-head">
                <div class="review-stars" [attr.aria-label]="review.rating + '/5'">
                  @for (filled of stars(review.rating); track $index) {
                    <lucide-icon
                      [img]="Star"
                      [size]="16"
                      [class.star-filled]="filled"
                      [class.star-empty]="!filled"
                    ></lucide-icon>
                  }
                </div>
                <span class="review-date">{{ review.created_at | tenantDate }}</span>
              </div>
              @if (review.comment) {
                <p class="review-comment">{{ review.comment }}</p>
              }
              <footer class="review-meta">
                {{ review.property_name }}
                @if (review.unit_number) {
                  · {{ 'reservations.reviews.unit' | transloco }} {{ review.unit_number }}
                }
                @if (review.guest_name) {
                  · {{ review.guest_name }}
                }
              </footer>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .reviews-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.25rem;
      }
      @media (min-width: 1024px) {
        .reviews-page {
          padding: 2rem;
        }
      }
      .reviews-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
      }
      .reviews-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .summary-avg {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 1.3rem;
        font-weight: 700;
      }
      .summary-count {
        font-size: 0.85rem;
        color: var(--color-text-muted, #6b7280);
      }
      .reviews-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      @media (min-width: 768px) {
        .reviews-list {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .review-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.1rem;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 0.875rem;
        background: var(--color-surface, #fff);
      }
      .review-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .review-stars {
        display: inline-flex;
        gap: 0.1rem;
      }
      .star-filled {
        color: var(--color-warning, #f59e0b);
      }
      .star-empty {
        color: var(--color-border-strong, #d1d5db);
      }
      .review-date {
        font-size: 0.78rem;
        color: var(--color-text-muted, #6b7280);
      }
      .review-comment {
        margin: 0;
        font-size: 0.9rem;
        color: var(--color-text, #374151);
      }
      .review-meta {
        font-size: 0.8rem;
        color: var(--color-text-muted, #6b7280);
      }
    `,
  ],
})
export class AdminReviewsComponent extends AdminReviewsFacade {
  readonly Star = Star;
}
