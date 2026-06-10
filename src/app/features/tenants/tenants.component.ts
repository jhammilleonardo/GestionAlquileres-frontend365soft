import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { AdminTenantUser, TenantLeaseStatus } from '../../core/models/tenant-user.model';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import {
  AppButtonComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppStatusBadgeComponent,
  AppTextFieldComponent,
} from '../../shared/ui';
import type { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss',
})
export class TenantsComponent implements OnInit {
  private readonly tenantUserService = inject(TenantUserService);

  readonly tenants = this.tenantUserService.users;
  readonly stats = this.tenantUserService.stats;
  readonly isLoading = this.tenantUserService.isLoading;
  readonly search = signal('');
  readonly statusFilter = signal<TenantLeaseStatus | 'all'>('all');

  readonly filteredTenants = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.tenants().filter((tenant) => {
      const matchesStatus = status === 'all' || tenant.lease_status === status;
      const matchesSearch =
        !term ||
        [tenant.name, tenant.email, tenant.phone, tenant.property_title, tenant.unit_number]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.tenantUserService.loadTenants();
  }

  reload(): void {
    this.tenantUserService.loadTenants({
      search: this.search(),
      status: this.statusFilter(),
    });
  }

  updateSearch(value: string): void {
    this.search.set(value);
  }

  setStatusFilter(status: TenantLeaseStatus | 'all'): void {
    this.statusFilter.set(status);
  }

  balanceDue(tenant: AdminTenantUser): number {
    return Number(tenant.balance_due ?? 0);
  }

  monthlyRent(tenant: AdminTenantUser): number {
    return Number(tenant.monthly_rent ?? 0);
  }

  moneyLabel(amount: number, currency: string | null | undefined): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'BOB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  leaseTone(status: TenantLeaseStatus | undefined): AppStatusTone {
    const tones: Record<TenantLeaseStatus, AppStatusTone> = {
      active: 'success',
      pending: 'warning',
      past: 'neutral',
      none: 'info',
    };

    return tones[status ?? 'none'];
  }

  balanceTone(tenant: AdminTenantUser): AppStatusTone {
    return this.balanceDue(tenant) > 0 ? 'warning' : 'success';
  }

  leaseLabelKey(status: TenantLeaseStatus | undefined): string {
    return `tenants.leaseStatus.${status ?? 'none'}`;
  }
}
