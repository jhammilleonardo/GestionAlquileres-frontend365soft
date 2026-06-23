import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { CreateSeasonRule, SeasonRule } from '../../../core/models/reservation-admin.model';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/**
 * Fachada de gestión de temporadas de una unidad. Orquesta el listado, el alta
 * (formulario) y la baja; el componente sólo pinta. UI-agnóstica salvo por el
 * ConfirmDialog/Toast compartidos.
 */
@Injectable()
export class SeasonRulesFacade {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationAdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly seasons = signal<SeasonRule[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  private currentUnitId = 0;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    start_date: ['', [Validators.required]],
    end_date: ['', [Validators.required]],
    price_per_night: [null as number | null, [Validators.min(0)]],
    min_nights: [null as number | null, [Validators.min(1)]],
  });

  load(unitId: number): void {
    this.currentUnitId = unitId;
    this.form.reset();
    this.isLoading.set(true);
    this.reservationService.listSeasons(unitId).subscribe({
      next: (seasons) => {
        this.seasons.set(seasons);
        this.isLoading.set(false);
      },
      error: () => {
        this.seasons.set([]);
        this.isLoading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateSeasonRule = {
      name: raw.name ?? '',
      start_date: raw.start_date ?? '',
      end_date: raw.end_date ?? '',
      price_per_night: raw.price_per_night ?? undefined,
      min_nights: raw.min_nights ?? undefined,
    };

    this.isSaving.set(true);
    this.reservationService.createSeason(this.currentUnitId, dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success(this.transloco.translate('reservations.seasons.created'));
        this.load(this.currentUnitId);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSaving.set(false);
        this.toast.error(
          err.error?.message ?? this.transloco.translate('reservations.seasons.createError'),
        );
      },
    });
  }

  async delete(season: SeasonRule): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('reservations.seasons.deleteTitle'),
      message: this.transloco.translate('reservations.seasons.deleteMessage', {
        name: season.name,
      }),
      confirmLabel: this.transloco.translate('common.delete'),
      cancelLabel: this.transloco.translate('common.cancel'),
    });
    if (!confirmed) return;

    this.reservationService.deleteSeason(this.currentUnitId, season.id).subscribe({
      next: () => {
        this.toast.success(this.transloco.translate('reservations.seasons.deleted'));
        this.load(this.currentUnitId);
      },
      error: () => this.toast.error(this.transloco.translate('reservations.seasons.deleteError')),
    });
  }
}
