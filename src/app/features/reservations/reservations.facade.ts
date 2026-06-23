import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { debounceTime, filter } from 'rxjs';

import {
  AdminReservation,
  ReservationAction,
  ReservationStatus,
  RESERVATION_ACTIONS_BY_STATUS,
} from '../../core/models/reservation-admin.model';
import { PropertyService } from '../../core/services/admin/property.service';
import { ReservationAdminService } from '../../core/services/admin/reservation-admin.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

const PAGE_SIZE = 20;

/** Acciones cuya confirmación pedimos por ser irreversibles / negativas. */
const CONFIRMABLE_ACTIONS: readonly ReservationAction[] = [
  ReservationAction.CANCEL,
  ReservationAction.DECLINE,
  ReservationAction.NO_SHOW,
];

@Injectable()
export class ReservationsAdminFacade {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationAdminService);
  private readonly propertyService = inject(PropertyService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly reservations = signal<AdminReservation[]>([]);
  readonly isLoading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly busyId = signal<number | null>(null);

  readonly pageSize = PAGE_SIZE;
  readonly statusValues = Object.values(ReservationStatus);

  readonly propertyOptions = signal<AppSelectOption<number>[]>([]);

  // El scope Transloco carga async; este signal emite al terminar la carga
  // (inicial y al cambiar de idioma) para recalcular las etiquetas.
  private readonly translationsReady = toSignal(
    this.transloco.events$.pipe(filter((event) => event.type === 'translationLoadSuccess')),
    { initialValue: null },
  );

  readonly filterForm = this.fb.group({
    property_id: [null as number | null],
    status: [''],
  });

  readonly statusFilterOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return [
      { value: '', label: this.transloco.translate('reservations.allStatuses') },
      ...this.statusValues.map((value) => ({
        value,
        label: this.transloco.translate(`reservations.status.${value}`),
      })),
    ];
  });

  constructor() {
    this.loadProperties();
    this.load();

    // Filtros auto-apply: cualquier cambio recarga desde la primera página.
    this.filterForm.valueChanges.pipe(debounceTime(250), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  loadProperties(): void {
    this.propertyService.getAdminProperties().subscribe({
      next: (properties) =>
        this.propertyOptions.set(
          properties.map((property) => ({ value: property.id, label: property.title })),
        ),
      error: () => this.propertyOptions.set([]),
    });
  }

  load(): void {
    this.isLoading.set(true);
    const raw = this.filterForm.value;
    const params: Record<string, string | number> = {
      page: this.page(),
      limit: PAGE_SIZE,
    };
    if (raw.property_id) params['property_id'] = raw.property_id;
    if (raw.status) params['status'] = raw.status;

    this.reservationService.list(params).subscribe({
      next: (res) => {
        this.reservations.set(res.data);
        this.total.set(res.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.reservations.set([]);
        this.total.set(0);
        this.isLoading.set(false);
      },
    });
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  clearFilters(): void {
    // reset() emite valueChanges → dispara load() automáticamente.
    this.filterForm.reset({ property_id: null, status: '' });
  }

  // Campos flecha (no métodos) para poder pasarlos como input a componentes
  // hijos sin disparar la regla unbound-method.
  readonly availableActions = (reservation: AdminReservation): readonly ReservationAction[] =>
    RESERVATION_ACTIONS_BY_STATUS[reservation.status] ?? [];

  readonly statusTone = (status: ReservationStatus): AppStatusTone => {
    switch (status) {
      case ReservationStatus.PENDING:
      case ReservationStatus.PENDING_PAYMENT:
        return 'warning';
      case ReservationStatus.CONFIRMED:
        return 'info';
      case ReservationStatus.IN_PROGRESS:
        return 'info';
      case ReservationStatus.COMPLETED:
        return 'success';
      case ReservationStatus.CANCELLED:
      case ReservationStatus.DECLINED:
      case ReservationStatus.NO_SHOW:
      case ReservationStatus.EXPIRED:
        return 'danger';
    }
  };

  async applyAction(reservation: AdminReservation, action: ReservationAction): Promise<void> {
    if (CONFIRMABLE_ACTIONS.includes(action)) {
      const actionLabel: string = this.transloco.translate(`reservations.action.${action}`);
      const confirmed = await this.confirmDialog.confirm({
        title: actionLabel,
        message: this.transloco.translate('reservations.confirmAction', {
          action: actionLabel,
        }),
        confirmLabel: actionLabel,
        cancelLabel: this.transloco.translate('common.cancel'),
      });
      if (!confirmed) return;
    }

    this.busyId.set(reservation.id);
    this.reservationService.updateStatus(reservation.id, action).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(this.transloco.translate('reservations.actionSuccess'));
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.transloco.translate('reservations.actionError'));
      },
    });
  }
}
