import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, ClipboardCheck } from 'lucide-angular';

import { Inspection, InspectionStatus } from '../../../../core/models/inspection.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-inspection-table',
  standalone: true,
  imports: [
    SlicePipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './inspection-table.component.html',
  styleUrl: '../../inspections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionTableComponent {
  readonly inspections = input.required<readonly Inspection[]>();
  readonly isOverdue = input<(inspection: Inspection) => boolean>(() => false);
  readonly detailRequested = output<number>();

  readonly ClipboardCheck = ClipboardCheck;

  statusTone(status: InspectionStatus): AppStatusTone {
    switch (status) {
      case InspectionStatus.SCHEDULED:
        return 'info';
      case InspectionStatus.IN_PROGRESS:
        return 'warning';
      case InspectionStatus.COMPLETED:
        return 'success';
    }
  }
}
