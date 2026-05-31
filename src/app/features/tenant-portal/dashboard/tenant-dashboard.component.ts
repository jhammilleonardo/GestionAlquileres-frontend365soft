import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TenantDashboardMaintenanceListComponent } from './components/tenant-dashboard-maintenance-list.component';
import { TenantDashboardPaymentsListComponent } from './components/tenant-dashboard-payments-list.component';
import { TenantDashboardQuickActionsComponent } from './components/tenant-dashboard-quick-actions.component';
import { TenantDashboardStatsComponent } from './components/tenant-dashboard-stats.component';
import { TenantDashboardWelcomeComponent } from './components/tenant-dashboard-welcome.component';
import { TenantDashboardFacade } from './tenant-dashboard.facade';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-dashboard',
  standalone: true,
  providers: [TenantDashboardFacade],
  imports: [
    TenantDashboardMaintenanceListComponent,
    TenantDashboardPaymentsListComponent,
    TenantDashboardQuickActionsComponent,
    TenantDashboardStatsComponent,
    TenantDashboardWelcomeComponent,
  ],
  templateUrl: './tenant-dashboard.component.html',
  styleUrl: './tenant-dashboard.component.scss',
})
export class TenantDashboardComponent {
  readonly dashboard = inject(TenantDashboardFacade);
}
