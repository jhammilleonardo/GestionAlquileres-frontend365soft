import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { CalendarSyncSource, CreateSyncSource } from '../../../core/models/reservation-admin.model';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/**
 * Fachada de gestión de calendarios externos (iCal) de una unidad: listado, alta,
 * sincronización manual y baja. UI-agnóstica salvo Toast/ConfirmDialog.
 */
@Injectable()
export class CalendarSyncFacade {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationAdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly sources = signal<CalendarSyncSource[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly busyId = signal<number | null>(null);

  private currentUnitId = 0;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    url: ['', [Validators.required]],
  });

  load(unitId: number): void {
    this.currentUnitId = unitId;
    this.form.reset();
    this.isLoading.set(true);
    this.reservationService.listSyncSources(unitId).subscribe({
      next: (sources) => {
        this.sources.set(sources);
        this.isLoading.set(false);
      },
      error: () => {
        this.sources.set([]);
        this.isLoading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dto = this.form.getRawValue() as CreateSyncSource;

    this.isSaving.set(true);
    this.reservationService.createSyncSource(this.currentUnitId, dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success(this.transloco.translate('reservations.calendarSync.added'));
        this.load(this.currentUnitId);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSaving.set(false);
        this.toast.error(
          err.error?.message ?? this.transloco.translate('reservations.calendarSync.addError'),
        );
      },
    });
  }

  syncNow(source: CalendarSyncSource): void {
    this.busyId.set(source.id);
    this.reservationService.syncSourceNow(this.currentUnitId, source.id).subscribe({
      next: (result) => {
        this.busyId.set(null);
        this.toast.success(
          this.transloco.translate('reservations.calendarSync.synced', {
            count: result.blocked,
          }),
        );
        this.load(this.currentUnitId);
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.transloco.translate('reservations.calendarSync.syncError'));
      },
    });
  }

  async remove(source: CalendarSyncSource): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('reservations.calendarSync.deleteTitle'),
      message: this.transloco.translate('reservations.calendarSync.deleteMessage', {
        name: source.name,
      }),
      confirmLabel: this.transloco.translate('common.delete'),
      cancelLabel: this.transloco.translate('common.cancel'),
    });
    if (!confirmed) return;

    this.reservationService.deleteSyncSource(this.currentUnitId, source.id).subscribe({
      next: () => {
        this.toast.success(this.transloco.translate('reservations.calendarSync.deleted'));
        this.load(this.currentUnitId);
      },
      error: () =>
        this.toast.error(this.transloco.translate('reservations.calendarSync.deleteError')),
    });
  }
}
