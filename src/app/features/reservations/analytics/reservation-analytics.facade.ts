import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { ReservationAnalytics } from '../../../core/models/reservation-admin.model';

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Fachada del panel de métricas de reservas. Orquesta el rango de fechas
 * (auto-apply) y la carga de las métricas; el componente sólo pinta KPIs.
 */
@Injectable()
export class ReservationAnalyticsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationAdminService);

  readonly analytics = signal<ReservationAnalytics | null>(null);
  readonly isLoading = signal(true);

  /** Ocupación en porcentaje (0–100) para mostrar. */
  readonly occupancyPct = computed(() => {
    const value = this.analytics();
    return value ? Math.round(value.occupancy_rate * 1000) / 10 : 0;
  });

  readonly form = this.fb.group({
    from: [this.defaultFrom()],
    to: [this.defaultTo()],
  });

  constructor() {
    this.load();
    // Auto-apply: cualquier cambio de fechas recarga (con un pequeño debounce).
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  load(): void {
    const { from, to } = this.form.value;
    if (!from || !to || to < from) return;

    this.isLoading.set(true);
    this.reservationService.getAnalytics(from, to).subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.analytics.set(null);
        this.isLoading.set(false);
      },
    });
  }

  private defaultFrom(): string {
    const now = new Date();
    return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  private defaultTo(): string {
    const now = new Date();
    return isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }
}
