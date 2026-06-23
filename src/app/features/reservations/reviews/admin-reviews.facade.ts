import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { PropertyService } from '../../../core/services/admin/property.service';
import { AdminReview } from '../../../core/models/reservation-admin.model';
import { AppSelectOption } from '../../../shared/ui/select/select.component';

/**
 * Fachada del listado admin de reseñas. Orquesta el filtro por propiedad
 * (auto-apply) y la carga; el componente sólo pinta. El promedio se deriva de
 * las reseñas cargadas.
 */
@Injectable()
export class AdminReviewsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationAdminService);
  private readonly propertyService = inject(PropertyService);

  readonly reviews = signal<AdminReview[]>([]);
  readonly isLoading = signal(true);
  // value 0 = "todas las propiedades" (AppSelectOption sólo admite string|number).
  readonly propertyOptions = signal<AppSelectOption<number>[]>([]);

  readonly average = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  readonly filterForm = this.fb.group({
    property_id: [0],
  });

  constructor() {
    this.loadProperties();
    this.load();
    this.filterForm.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  load(): void {
    this.isLoading.set(true);
    const propertyId = this.filterForm.value.property_id || undefined;
    this.reservationService.listReviews(propertyId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.isLoading.set(false);
      },
      error: () => {
        this.reviews.set([]);
        this.isLoading.set(false);
      },
    });
  }

  /** Estrellas (1–5) como array para pintar; true = llena. */
  stars(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map((value) => value <= rating);
  }

  private loadProperties(): void {
    this.propertyService.getAdminProperties().subscribe({
      next: (properties) =>
        this.propertyOptions.set([
          { value: 0, label: '' },
          ...properties.map((property) => ({
            value: property.id,
            label: property.title,
          })),
        ]),
      error: () => this.propertyOptions.set([]),
    });
  }
}
