import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { MyReservation, ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/**
 * Fachada del diálogo de reseña. Aislada del componente de lista (SRP): conoce
 * el rating, el comentario y el envío. Recibe un callback de éxito para
 * permanecer agnóstica a la vista.
 */
@Injectable()
export class ReservationReviewDialogFacade {
  private readonly reservationService = inject(ReservationService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly rating = signal(0);
  readonly comment = signal('');
  readonly isSubmitting = signal(false);

  readonly stars = [1, 2, 3, 4, 5];

  reset(): void {
    this.rating.set(0);
    this.comment.set('');
    this.isSubmitting.set(false);
  }

  setRating(value: number): void {
    this.rating.set(value);
  }

  setComment(value: string): void {
    this.comment.set(value);
  }

  submit(reservation: MyReservation, onSuccess: () => void): void {
    if (this.rating() < 1) {
      this.toast.error(this.transloco.translate('tenantReservations.review.ratingRequired'));
      return;
    }

    this.isSubmitting.set(true);
    this.reservationService
      .createReview(reservation.id, {
        rating: this.rating(),
        comment: this.comment().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success(this.transloco.translate('tenantReservations.review.success'));
          onSuccess();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toast.error(this.transloco.translate('tenantReservations.review.error'));
        },
      });
  }
}
