import { Component, ChangeDetectionStrategy, OnInit, input, inject } from '@angular/core';
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
import { Unit, UnitStatus } from '../../../core/models/unit.model';
import { UnitFormDialogComponent } from './unit-form-dialog/unit-form-dialog.component';
import { UnitDetailPanelComponent } from './unit-detail-panel/unit-detail-panel.component';
import { BlockDatesDialogComponent } from './block-dates-dialog/block-dates-dialog.component';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { PropertyUnitsFacade } from './property-units.facade';

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
  providers: [PropertyUnitsFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyUnitsComponent implements OnInit {
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

  protected readonly facade = inject(PropertyUnitsFacade);

  readonly counters = this.facade.counters;
  readonly filteredUnits = this.facade.filteredUnits;
  readonly isLoading = this.facade.isLoading;
  readonly selectedUnit = this.facade.selectedUnit;
  readonly statusFilter = this.facade.statusFilter;
  readonly confirmingDeleteId = this.facade.confirmingDeleteId;
  readonly formDialogOpen = this.facade.formDialogOpen;
  readonly formDialogUnit = this.facade.formDialogUnit;
  readonly blockDatesOpen = this.facade.blockDatesOpen;
  readonly blockDatesUnit = this.facade.blockDatesUnit;

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.facade.loadUnits(this.propertyId());
  }

  openCreateDialog(): void {
    this.facade.openCreateDialog();
  }

  openEditDialog(unit: Unit): void {
    this.facade.openEditDialog(unit);
  }

  closeFormDialog(): void {
    this.facade.closeFormDialog();
  }

  handleUnitSaved(unit: Unit): void {
    this.facade.handleUnitSaved(unit);
  }

  selectUnit(unit: Unit): void {
    this.facade.selectUnit(unit);
  }

  closePanel(): void {
    this.facade.closePanel();
  }

  openBlockDates(unit: Unit): void {
    this.facade.openBlockDates(unit);
  }

  closeBlockDates(): void {
    this.facade.closeBlockDates();
  }

  async deleteUnit(unit: Unit): Promise<void> {
    await this.facade.deleteUnit(this.propertyId(), unit);
  }

  setStatusFilter(status: UnitStatus | 'all'): void {
    this.facade.setStatusFilter(status);
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
}
