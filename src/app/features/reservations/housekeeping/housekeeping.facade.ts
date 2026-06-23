import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { debounceTime, filter } from 'rxjs';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { HousekeepingStatus, HousekeepingTask } from '../../../core/models/reservation-admin.model';
import { AppSelectOption } from '../../../shared/ui/select/select.component';
import { AppStatusTone } from '../../../shared/ui/status-badge/status-badge.component';

/** Próximo estado del flujo de limpieza (pending → in_progress → done). */
const NEXT_STATUS: Record<HousekeepingStatus, HousekeepingStatus | null> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: null,
};

/**
 * Fachada del tablero de limpieza. Orquesta el filtro por estado (auto-apply) y
 * el avance de cada tarea; el componente sólo pinta.
 */
@Injectable()
export class HousekeepingFacade {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationAdminService);
  private readonly transloco = inject(TranslocoService);

  readonly tasks = signal<HousekeepingTask[]>([]);
  readonly isLoading = signal(true);
  readonly busyId = signal<number | null>(null);

  private readonly translationsReady = toSignal(
    this.transloco.events$.pipe(filter((event) => event.type === 'translationLoadSuccess')),
    { initialValue: null },
  );

  readonly statusOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return [
      { value: '', label: this.transloco.translate('reservations.housekeeping.allStatuses') },
      ...(['pending', 'in_progress', 'done'] as const).map((value) => ({
        value,
        label: this.transloco.translate(`reservations.housekeeping.status.${value}`),
      })),
    ];
  });

  readonly filterForm = this.fb.group({ status: [''] });

  constructor() {
    this.load();
    this.filterForm.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  load(): void {
    this.isLoading.set(true);
    const status = (this.filterForm.value.status || undefined) as HousekeepingStatus | undefined;
    this.reservationService.listHousekeeping(status).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.tasks.set([]);
        this.isLoading.set(false);
      },
    });
  }

  nextStatus(task: HousekeepingTask): HousekeepingStatus | null {
    return NEXT_STATUS[task.status];
  }

  advance(task: HousekeepingTask): void {
    const next = this.nextStatus(task);
    if (!next) return;

    this.busyId.set(task.id);
    this.reservationService.updateHousekeeping(task.id, next).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: () => this.busyId.set(null),
    });
  }

  // Campo flecha para pasarlo a la vista sin disparar unbound-method.
  readonly statusTone = (status: HousekeepingStatus): AppStatusTone => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'done':
        return 'success';
    }
  };
}
