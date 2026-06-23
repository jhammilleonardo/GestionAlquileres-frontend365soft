import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
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
  Download,
  RefreshCw,
} from 'lucide-angular';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { Unit, UnitStatus, RentalType } from '../../../../core/models/unit.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-unit-detail-panel',
  standalone: true,
  imports: [NgClass, LucideAngularModule, TenantCurrencyPipe, AppButtonComponent, TranslocoPipe],
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
  readonly Download = Download;
  readonly RefreshCw = RefreshCw;

  readonly UnitStatus = UnitStatus;

  unit = input.required<Unit>();
  propertySlug = input.required<string>();
  publicPropertyId = input.required<number>();

  close = output<void>();
  edit = output<Unit>();
  delete = output<Unit>();
  manageDates = output<Unit>();
  exportCalendar = output<Unit>();
  manageSeasons = output<Unit>();
  manageCalendarSync = output<Unit>();

  /** El bloqueo de fechas solo aplica a unidades con alquiler de corto plazo. */
  readonly isShortTerm = computed(() => {
    const type = this.unit().rental_type;
    return type === RentalType.SHORT_TERM || type === RentalType.BOTH;
  });

  statusConfig = computed(() => {
    const status = this.unit().status;
    const configs: Record<UnitStatus, { cssClass: string }> = {
      [UnitStatus.AVAILABLE]: { cssClass: 'status-available' },
      [UnitStatus.OCCUPIED]: { cssClass: 'status-occupied' },
      [UnitStatus.MAINTENANCE]: { cssClass: 'status-maintenance' },
      [UnitStatus.RESERVED]: { cssClass: 'status-reserved' },
    };
    return configs[status] ?? { cssClass: 'status-default' };
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

  onExportCalendar(): void {
    this.exportCalendar.emit(this.unit());
  }

  onManageSeasons(): void {
    this.manageSeasons.emit(this.unit());
  }

  onManageCalendarSync(): void {
    this.manageCalendarSync.emit(this.unit());
  }

  onClose(): void {
    this.close.emit();
  }
}
