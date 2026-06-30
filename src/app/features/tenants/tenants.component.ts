import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, EMPTY } from 'rxjs';
import {
  AdminTenantUser,
  TenantLeaseStatus,
  TenantLedger,
  TenantMaintenanceItem,
  UpdateTenantUserDto,
} from '../../core/models/tenant-user.model';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import {
  AppButtonComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppStatusBadgeComponent,
  AppTextFieldComponent,
} from '../../shared/ui';
import { ToastService } from '../../shared/ui/toast/toast.service';
import type { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { TenantDetailPanelComponent } from './components/tenant-detail-panel/tenant-detail-panel.component';
import { TenantFormDialogComponent } from './components/tenant-form-dialog/tenant-form-dialog.component';

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
    TenantDetailPanelComponent,
    TenantFormDialogComponent,
  ],
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss',
})
export class TenantsComponent implements OnInit {
  private readonly tenantUserService = inject(TenantUserService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tenants = this.tenantUserService.users;
  readonly stats = this.tenantUserService.stats;
  readonly isLoading = this.tenantUserService.isLoading;
  readonly search = signal('');
  readonly statusFilter = signal<TenantLeaseStatus | 'all'>('all');

  // Detalle (panel lateral)
  readonly selectedTenant = signal<AdminTenantUser | null>(null);
  readonly ledger = signal<TenantLedger | null>(null);
  readonly ledgerLoading = signal(false);
  readonly maintenance = signal<TenantMaintenanceItem[]>([]);
  readonly maintenanceLoading = signal(false);

  // Edición (diálogo)
  readonly editOpen = signal(false);
  readonly saving = signal(false);

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

  openDetail(tenant: AdminTenantUser): void {
    this.selectedTenant.set(tenant);
    this.loadLedger(tenant.id);
    this.loadMaintenance(tenant.id);
  }

  closeDetail(): void {
    this.selectedTenant.set(null);
    this.ledger.set(null);
    this.maintenance.set([]);
  }

  openEdit(): void {
    this.editOpen.set(true);
  }

  closeEdit(): void {
    this.editOpen.set(false);
  }

  saveEdit(dto: UpdateTenantUserDto): void {
    const tenant = this.selectedTenant();
    if (!tenant) return;

    this.saving.set(true);
    this.tenantUserService
      .updateUser(tenant.id, dto)
      .pipe(
        catchError(() => {
          this.saving.set(false);
          this.toast.error(this.transloco.translate('tenants.detail.saveError'));
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.saving.set(false);
        this.editOpen.set(false);
        this.selectedTenant.update((prev) => (prev ? { ...prev, ...dto } : prev));
        this.toast.success(this.transloco.translate('tenants.detail.saveSuccess'));
        this.reload();
      });
  }

  private loadLedger(tenantId: number): void {
    this.ledgerLoading.set(true);
    this.ledger.set(null);
    this.tenantUserService
      .getTenantLedger(tenantId)
      .pipe(
        catchError(() => {
          this.ledgerLoading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((ledger) => {
        this.ledger.set(ledger);
        this.ledgerLoading.set(false);
      });
  }

  private loadMaintenance(tenantId: number): void {
    this.maintenanceLoading.set(true);
    this.maintenance.set([]);
    this.tenantUserService
      .getTenantMaintenance(tenantId)
      .pipe(
        catchError(() => {
          this.maintenanceLoading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this.maintenance.set(items);
        this.maintenanceLoading.set(false);
      });
  }
}
