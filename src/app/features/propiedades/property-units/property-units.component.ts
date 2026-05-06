import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { UnitService } from '../../../core/services/admin/unit.service';
import { Unit, UnitStatus } from '../../../core/models/unit.model';
import { UnitFormDialogComponent } from './unit-form-dialog/unit-form-dialog.component';
import { UnitDetailPanelComponent } from './unit-detail-panel/unit-detail-panel.component';

@Component({
  selector: 'app-property-units',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    UnitDetailPanelComponent,
  ],
  templateUrl: './property-units.component.html',
  styleUrls: ['./property-units.component.scss'],
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

  private unitService = inject(UnitService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  units = signal<Unit[]>([]);
  isLoading = signal(true);
  selectedUnit = signal<Unit | null>(null);
  statusFilter = signal<UnitStatus | 'all'>('all');
  confirmingDeleteId = signal<number | null>(null);

  displayedColumns = [
    'unit_number',
    'floor',
    'bedrooms',
    'bathrooms',
    'square_meters',
    'rental_type',
    'price',
    'status',
    'actions',
  ];

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

  ngOnInit(): void {
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
        this.snackBar.open('Error al cargar las unidades', 'Cerrar', { duration: 3000 });
      },
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UnitFormDialogComponent, {
      data: { propertyId: this.propertyId() },
      panelClass: 'unit-form-dialog-panel',
      disableClose: true,
    });

    ref.afterClosed().subscribe((unit?: Unit) => {
      if (unit) {
        this.units.update((prev) => [...prev, unit]);
        this.selectedUnit.set(unit);
        this.snackBar.open('Unidad creada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(unit: Unit): void {
    const ref = this.dialog.open(UnitFormDialogComponent, {
      data: { propertyId: this.propertyId(), unit },
      panelClass: 'unit-form-dialog-panel',
      disableClose: true,
    });

    ref.afterClosed().subscribe((updated?: Unit) => {
      if (updated) {
        this.units.update((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        this.selectedUnit.set(updated);
        this.snackBar.open('Unidad actualizada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  selectUnit(unit: Unit): void {
    this.selectedUnit.set(this.selectedUnit()?.id === unit.id ? null : unit);
  }

  closePanel(): void {
    this.selectedUnit.set(null);
  }

  deleteUnit(unit: Unit): void {
    this.confirmingDeleteId.set(unit.id);
    this.unitService.remove(this.propertyId(), unit.id).subscribe({
      next: () => {
        this.units.update((prev) => prev.filter((u) => u.id !== unit.id));
        if (this.selectedUnit()?.id === unit.id) {
          this.selectedUnit.set(null);
        }
        this.confirmingDeleteId.set(null);
        this.snackBar.open('Unidad eliminada', 'Cerrar', { duration: 3000 });
      },
      error: (err: any) => {
        this.confirmingDeleteId.set(null);
        const msg = err?.error?.message ?? 'Error al eliminar la unidad';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
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
}
