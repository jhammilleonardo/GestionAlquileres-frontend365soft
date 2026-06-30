import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  LucideAngularModule,
  Wrench,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Star,
} from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { MaintenanceRequest, MaintenanceStatus } from '../../core/models/maintenance-request.model';
import { VendorAuthService } from '../../core/services/vendor/vendor-auth.service';
import { VendorMaintenanceService } from '../../core/services/vendor/vendor-maintenance.service';
import { VendorProfileService } from '../../core/services/vendor/vendor-profile.service';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { VendorOrderDetailComponent } from './components/vendor-order-detail.component';

type FilterTab =
  | 'all'
  | MaintenanceStatus.NEW
  | MaintenanceStatus.IN_PROGRESS
  | MaintenanceStatus.COMPLETED;

@Component({
  selector: 'app-vendor-portal',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    AppLoadingStateComponent,
    TenantCurrencyPipe,
    VendorOrderDetailComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'vendorPortal', alias: 'vendorPortal' })],
  templateUrl: './vendor-portal.component.html',
  styleUrl: './vendor-portal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorPortalComponent {
  readonly Wrench = Wrench;
  readonly RefreshCw = RefreshCw;
  readonly ChevronRight = ChevronRight;
  readonly AlertCircle = AlertCircle;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly Star = Star;
  readonly stars = [1, 2, 3, 4, 5];

  private readonly vendorAuth = inject(VendorAuthService);
  private readonly maintenance = inject(VendorMaintenanceService);
  private readonly profileService = inject(VendorProfileService);

  readonly MaintenanceStatus = MaintenanceStatus;

  readonly vendor = this.vendorAuth.currentVendor;
  readonly profile = this.profileService.profile;
  readonly isLoading = this.maintenance.isLoading;
  readonly counts = this.maintenance.countByStatus;

  readonly activeTab = signal<FilterTab>('all');
  readonly selectedRequest = signal<MaintenanceRequest | null>(null);

  readonly filteredRequests = computed(() => {
    const tab = this.activeTab();
    const all = this.maintenance.requests();
    if (tab === 'all') return all;
    return all.filter((r) => r.status === tab);
  });

  constructor() {
    this.maintenance.loadAssigned();
    this.profileService.load();
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  refresh(): void {
    this.maintenance.loadAssigned();
    this.profileService.load();
  }

  filledStars(rating: number | null | undefined): number {
    return Math.round(rating ?? 0);
  }

  openOrder(request: MaintenanceRequest): void {
    this.selectedRequest.set(request);
  }

  closeOrder(): void {
    this.selectedRequest.set(null);
    this.maintenance.loadAssigned();
  }

  onStatusAdvanced(updated: MaintenanceRequest): void {
    this.selectedRequest.set(updated);
    this.maintenance.loadAssigned();
  }
}
