import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ArrowRight, LucideAngularModule, Wrench } from 'lucide-angular';

import {
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../../core/models/maintenance-request.model';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-dashboard-maintenance-list',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule, AppStatusBadgeComponent],
  templateUrl: './tenant-dashboard-maintenance-list.component.html',
  styleUrl: './tenant-dashboard-maintenance-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDashboardMaintenanceListComponent {
  readonly loading = input(false);
  readonly requests = input<readonly MaintenanceRequest[]>([]);
  readonly viewAllUrl = input.required<string>();
  readonly statusLabels = input.required<Record<MaintenanceStatus, string>>();
  readonly statusTone = input.required<(status: MaintenanceStatus) => AppStatusTone>();
  readonly detailUrl = input.required<(id: number) => string>();

  readonly Wrench = Wrench;
  readonly ArrowRight = ArrowRight;
}
