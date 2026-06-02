import { computed, inject, Injectable, signal } from '@angular/core';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { Unit, UnitStatus } from '../../../core/models/unit.model';
import { UnitService } from '../../../core/services/admin/unit.service';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Injectable()
export class PropertyUnitsFacade {
  private readonly unitService = inject(UnitService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly units = signal<Unit[]>([]);
  readonly isLoading = signal(true);
  readonly selectedUnit = signal<Unit | null>(null);
  readonly statusFilter = signal<UnitStatus | 'all'>('all');
  readonly confirmingDeleteId = signal<number | null>(null);
  readonly formDialogOpen = signal(false);
  readonly formDialogUnit = signal<Unit | null>(null);
  readonly blockDatesOpen = signal(false);
  readonly blockDatesUnit = signal<Unit | null>(null);

  readonly counters = computed(() => {
    const all = this.units();

    return {
      available: all.filter((unit) => unit.status === UnitStatus.AVAILABLE).length,
      occupied: all.filter((unit) => unit.status === UnitStatus.OCCUPIED).length,
      maintenance: all.filter((unit) => unit.status === UnitStatus.MAINTENANCE).length,
      reserved: all.filter((unit) => unit.status === UnitStatus.RESERVED).length,
      total: all.length,
    };
  });

  readonly filteredUnits = computed(() => {
    const filter = this.statusFilter();

    if (filter === 'all') {
      return this.units();
    }

    return this.units().filter((unit) => unit.status === filter);
  });

  loadUnits(propertyId: number): void {
    this.isLoading.set(true);
    this.unitService.findByProperty(propertyId).subscribe({
      next: (units) => {
        this.units.set(units);
        this.refreshSelectedUnit(units);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Error al cargar las unidades');
      },
    });
  }

  openCreateDialog(): void {
    this.formDialogUnit.set(null);
    this.formDialogOpen.set(true);
  }

  openEditDialog(unit: Unit): void {
    this.formDialogUnit.set(unit);
    this.formDialogOpen.set(true);
  }

  closeFormDialog(): void {
    this.formDialogOpen.set(false);
    this.formDialogUnit.set(null);
  }

  handleUnitSaved(unit: Unit): void {
    const wasEdit = Boolean(this.formDialogUnit());

    this.units.update((currentUnits) =>
      wasEdit
        ? currentUnits.map((current) => (current.id === unit.id ? unit : current))
        : [...currentUnits, unit],
    );
    this.selectedUnit.set(unit);
    this.closeFormDialog();
    this.toast.success(wasEdit ? 'Unidad actualizada exitosamente' : 'Unidad creada exitosamente');
  }

  selectUnit(unit: Unit): void {
    this.selectedUnit.set(this.selectedUnit()?.id === unit.id ? null : unit);
  }

  closePanel(): void {
    this.selectedUnit.set(null);
  }

  openBlockDates(unit: Unit): void {
    this.blockDatesUnit.set(unit);
    this.blockDatesOpen.set(true);
  }

  closeBlockDates(): void {
    this.blockDatesOpen.set(false);
  }

  async deleteUnit(propertyId: number, unit: Unit): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar unidad',
      message: `Esta accion eliminara la unidad ${unit.unit_number}. No se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.confirmingDeleteId.set(unit.id);
    this.unitService.remove(propertyId, unit.id).subscribe({
      next: () => {
        this.units.update((units) => units.filter((current) => current.id !== unit.id));
        if (this.selectedUnit()?.id === unit.id) {
          this.selectedUnit.set(null);
        }
        this.confirmingDeleteId.set(null);
        this.toast.success('Unidad eliminada');
      },
      error: (error: unknown) => {
        this.confirmingDeleteId.set(null);
        this.toast.error(getApiErrorMessage(error, 'Error al eliminar la unidad'));
      },
    });
  }

  setStatusFilter(status: UnitStatus | 'all'): void {
    this.statusFilter.set(status);
  }

  private refreshSelectedUnit(units: readonly Unit[]): void {
    const selected = this.selectedUnit();

    if (!selected) {
      return;
    }

    this.selectedUnit.set(units.find((unit) => unit.id === selected.id) ?? null);
  }
}
