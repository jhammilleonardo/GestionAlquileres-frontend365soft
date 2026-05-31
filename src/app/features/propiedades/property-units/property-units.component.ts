import { Component, ChangeDetectionStrategy, input, signal, computed, inject } from '@angular/core';
import {
  LucideAngularModule,
  Plus,
  Pencil,
  Trash2,
  Building2,
  BedDouble,
  Bath,
  Maximize2,
  DollarSign,
  Filter,
  RefreshCw,
} from 'lucide-angular';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { NgClass } from '@angular/common';
import { UnitService } from '../../../core/services/admin/unit.service';
import { Unit, UnitStatus } from '../../../core/models/unit.model';
import { UnitFormDialogComponent } from './unit-form-dialog/unit-form-dialog.component';
import { UnitDetailPanelComponent } from './unit-detail-panel/unit-detail-panel.component';
import { BlockDatesDialogComponent } from './block-dates-dialog/block-dates-dialog.component';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { getApiErrorMessage } from '../../../core/http/http-error.util';

@Component({
  selector: 'app-property-units',
  standalone: true,
  imports: [
    NgClass,
    LucideAngularModule,
    TenantCurrencyPipe,
    UnitDetailPanelComponent,
    UnitFormDialogComponent,
    BlockDatesDialogComponent,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
  ],
  templateUrl: './property-units.component.html',
  styleUrls: ['./property-units.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyUnitsComponent {
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Building2 = Building2;
  readonly BedDouble = BedDouble;
  readonly Bath = Bath;
  readonly Maximize2 = Maximize2;
  readonly DollarSign = DollarSign;
  readonly Filter = Filter;
  readonly RefreshCw = RefreshCw;

  readonly UnitStatus = UnitStatus;

  propertyId = input.required<number>();
  propertySlug = input.required<string>();

  private unitService = inject(UnitService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  units = signal<Unit[]>([]);
  isLoading = signal(true);
  selectedUnit = signal<Unit | null>(null);
  statusFilter = signal<UnitStatus | 'all'>('all');
  confirmingDeleteId = signal<number | null>(null);
  formDialogOpen = signal(false);
  formDialogUnit = signal<Unit | null>(null);
  blockDatesOpen = signal(false);
  blockDatesUnit = signal<Unit | null>(null);

  counters = computed(() => {
    const all = this.units();
    return {
      available: all.filter((u) => u.status === UnitStatus.AVAILABLE).length,
      occupied: all.filter((u) => u.status === UnitStatus.OCCUPIED).length,
      maintenance: all.filter((u) => u.status === UnitStatus.MAINTENANCE).length,
      reserved: all.filter((u) => u.status === UnitStatus.RESERVED).length,
      total: all.length,
    };
  });

  filteredUnits = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'all') return this.units();
    return this.units().filter((u) => u.status === filter);
  });

  constructor() {
    this.loadUnits();
  }

  loadUnits(): void {
    this.isLoading.set(true);
    this.unitService.findByProperty(this.propertyId()).subscribe({
      next: (units) => {
        this.units.set(units);
        this.isLoading.set(false);
        // Si la unidad seleccionada fue actualizada, refrescarla
        const sel = this.selectedUnit();
        if (sel) {
          const refreshed = units.find((u) => u.id === sel.id);
          this.selectedUnit.set(refreshed ?? null);
        }
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

    this.units.update((prev) => {
      if (!wasEdit) {
        return [...prev, unit];
      }

      return prev.map((current) => (current.id === unit.id ? unit : current));
    });

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

  async deleteUnit(unit: Unit): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar unidad',
      message: `Esta accion eliminara la unidad ${unit.unit_number}. No se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    this.confirmingDeleteId.set(unit.id);
    this.unitService.remove(this.propertyId(), unit.id).subscribe({
      next: () => {
        this.units.update((prev) => prev.filter((u) => u.id !== unit.id));
        if (this.selectedUnit()?.id === unit.id) {
          this.selectedUnit.set(null);
        }
        this.confirmingDeleteId.set(null);
        this.toast.success('Unidad eliminada');
      },
      error: (error: unknown) => {
        this.confirmingDeleteId.set(null);
        this.toast.error(this.resolveErrorMessage(error, 'Error al eliminar la unidad'));
      },
    });
  }

  getStatusConfig(status: UnitStatus): { label: string; cssClass: string } {
    const configs: Record<UnitStatus, { label: string; cssClass: string }> = {
      [UnitStatus.AVAILABLE]: { label: 'Disponible', cssClass: 'status-available' },
      [UnitStatus.OCCUPIED]: { label: 'Ocupada', cssClass: 'status-occupied' },
      [UnitStatus.MAINTENANCE]: { label: 'Mantenimiento', cssClass: 'status-maintenance' },
      [UnitStatus.RESERVED]: { label: 'Reservada', cssClass: 'status-reserved' },
    };
    return configs[status] ?? { label: status, cssClass: 'status-default' };
  }

  getRentalTypeLabel(type?: string): string {
    if (!type) return '—';
    const labels: Record<string, string> = {
      LONG_TERM: 'Largo Plazo',
      SHORT_TERM: 'Corto Plazo',
      BOTH: 'Ambos',
    };
    return labels[type] ?? type;
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    return getApiErrorMessage(error, fallback);
  }
}
