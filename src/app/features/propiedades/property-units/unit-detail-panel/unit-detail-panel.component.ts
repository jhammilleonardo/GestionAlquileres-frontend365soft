import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  LucideAngularModule,
  X,
  Pencil,
  Trash2,
  ExternalLink,
  BedDouble,
  Bath,
  Maximize2,
  DollarSign,
  Building2,
  Layers,
  Tag,
  Moon,
  CalendarDays,
} from 'lucide-angular';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { Unit, UnitStatus, RentalType } from '../../../../core/models/unit.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-unit-detail-panel',
  standalone: true,
  imports: [NgClass, LucideAngularModule, TenantCurrencyPipe, AppButtonComponent],
  templateUrl: './unit-detail-panel.component.html',
  styleUrls: ['./unit-detail-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitDetailPanelComponent {
  readonly X = X;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly ExternalLink = ExternalLink;
  readonly BedDouble = BedDouble;
  readonly Bath = Bath;
  readonly Maximize2 = Maximize2;
  readonly DollarSign = DollarSign;
  readonly Building2 = Building2;
  readonly Layers = Layers;
  readonly Tag = Tag;
  readonly Moon = Moon;
  readonly CalendarDays = CalendarDays;

  readonly UnitStatus = UnitStatus;

  unit = input.required<Unit>();
  propertySlug = input.required<string>();
  publicPropertyId = input.required<number>();

  close = output<void>();
  edit = output<Unit>();
  delete = output<Unit>();
  manageDates = output<Unit>();

  /** El bloqueo de fechas solo aplica a unidades con alquiler de corto plazo. */
  readonly isShortTerm = computed(() => {
    const type = this.unit().rental_type;
    return type === RentalType.SHORT_TERM || type === RentalType.BOTH;
  });

  statusConfig = computed(() => {
    const status = this.unit().status;
    const configs: Record<UnitStatus, { label: string; cssClass: string }> = {
      [UnitStatus.AVAILABLE]: { label: 'Disponible', cssClass: 'status-available' },
      [UnitStatus.OCCUPIED]: { label: 'Ocupada', cssClass: 'status-occupied' },
      [UnitStatus.MAINTENANCE]: { label: 'Mantenimiento', cssClass: 'status-maintenance' },
      [UnitStatus.RESERVED]: { label: 'Reservada', cssClass: 'status-reserved' },
    };
    return configs[status] ?? { label: status, cssClass: 'status-default' };
  });

  rentalTypeLabel = computed(() => {
    const labels: Record<RentalType, string> = {
      [RentalType.LONG_TERM]: 'Largo Plazo',
      [RentalType.SHORT_TERM]: 'Corto Plazo',
      [RentalType.BOTH]: 'Ambos',
    };
    return this.unit().rental_type ? labels[this.unit().rental_type!] : '—';
  });

  publicCatalogUrl = computed(
    () => `/${this.propertySlug()}/publico/propiedades/${this.publicPropertyId()}`,
  );

  onEdit(): void {
    this.edit.emit(this.unit());
  }

  onDelete(): void {
    this.delete.emit(this.unit());
  }

  onManageDates(): void {
    this.manageDates.emit(this.unit());
  }

  onClose(): void {
    this.close.emit();
  }
}
