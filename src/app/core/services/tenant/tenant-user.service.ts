import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import {
  TenantUser,
  AdminTenantUser,
  TenantUserStats,
  TenantUserFilters,
  CreateTenantUserDto,
  UpdateTenantUserDto,
  TenantLedger,
  TenantMaintenanceItem,
  UserStatus,
} from '../../models/tenant-user.model';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

@Injectable({
  providedIn: 'root',
})
export class TenantUserService {
  private apiClient = inject(ApiClientService);
  private slugService = inject(SlugService);

  // Signal-based reactive state
  private usersSignal = signal<AdminTenantUser[]>([]);
  private statsSignal = signal<TenantUserStats | null>(null);
  private isLoadingSignal = signal(false);

  // Public readonly signals
  users = this.usersSignal.asReadonly();
  stats = this.statsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  // Computed
  activeUsers = computed(() =>
    this.usersSignal().filter(
      (u) => u.status !== UserStatus.INACTIVE && u.status !== UserStatus.SUSPENDED,
    ),
  );

  adminUsers = computed(() => this.usersSignal().filter((u) => String(u.role) === 'ADMIN'));

  regularUsers = computed(() => this.usersSignal().filter((u) => String(u.role) === 'USER'));

  tenantsWithActiveContracts = computed(() =>
    this.usersSignal().filter((user) => user.lease_status === 'active'),
  );

  private getTenantSlug(): string {
    return this.slugService.getSlug() || '';
  }

  constructor() {
    // Do NOT load users in constructor - wait until slug is available from route
  }

  /**
   * Load all users for the current tenant
   */
  loadAllUsers(): void {
    const slug = this.getTenantSlug();
    if (!slug) {
      return;
    }
    this.isLoadingSignal.set(true);
    this.apiClient
      .get<AdminTenantUser[]>(`${slug}/users`)
      .pipe(tap(() => this.isLoadingSignal.set(false)))
      .subscribe({
        next: (users) => {
          this.usersSignal.set(users);
        },
        error: (_e) => {
          this.isLoadingSignal.set(false);
        },
      });
  }

  loadTenants(filters: TenantUserFilters = {}): void {
    const slug = this.getTenantSlug();
    if (!slug) {
      return;
    }

    const params = this.buildTenantParams(filters);
    this.isLoadingSignal.set(true);
    this.apiClient
      .get<AdminTenantUser[]>(`${slug}/users/tenants`, { params })
      .pipe(finalize(() => this.isLoadingSignal.set(false)))
      .subscribe({
        next: (users) => {
          this.usersSignal.set(users);
          this.setStatsFromUsers(users);
        },
        error: () => undefined,
      });
  }

  /**
   * Load user statistics
   */
  loadStats(): void {
    this.setStatsFromUsers(this.usersSignal());
  }

  /**
   * Get users with filters
   */
  getFilteredUsers(filters: TenantUserFilters): Observable<AdminTenantUser[]> {
    const slug = this.getTenantSlug();
    const params: Record<string, string> = {};

    if (filters.role) params['role'] = filters.role;
    if (filters.status) params['status'] = filters.status;
    if (filters.search) params['search'] = filters.search;
    if (filters.date_from) params['date_from'] = filters.date_from;
    if (filters.date_to) params['date_to'] = filters.date_to;

    return this.apiClient
      .get<AdminTenantUser[]>(`${slug}/users`, { params })
      .pipe(tap((users) => this.usersSignal.set(users)));
  }

  getFilteredTenants(filters: TenantUserFilters): Observable<AdminTenantUser[]> {
    const slug = this.getTenantSlug();
    const params = this.buildTenantParams(filters);

    return this.apiClient.get<AdminTenantUser[]>(`${slug}/users/tenants`, { params }).pipe(
      tap((users) => {
        this.usersSignal.set(users);
        this.setStatsFromUsers(users);
      }),
    );
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<AdminTenantUser> {
    const slug = this.getTenantSlug();
    return this.apiClient.get<AdminTenantUser>(`${slug}/users/${id}`);
  }

  getTenantById(id: number): Observable<AdminTenantUser> {
    const slug = this.getTenantSlug();
    return this.apiClient.get<AdminTenantUser>(`${slug}/users/tenants/${id}`);
  }

  /**
   * Create new user
   */
  createUser(userData: CreateTenantUserDto): Observable<TenantUser> {
    const slug = this.getTenantSlug();
    return this.apiClient.post<TenantUser>(`${slug}/users`, userData).pipe(
      tap(() => {
        // Reload users after creating
        this.loadAllUsers();
        this.loadStats();
      }),
    );
  }

  /**
   * Update user
   */
  updateUser(id: number, userData: UpdateTenantUserDto): Observable<TenantUser> {
    const slug = this.getTenantSlug();
    // El llamador decide cómo refrescar su vista (lista de inquilinos vs. todos
    // los usuarios), para no sobrescribir el estado con un dataset que no le toca.
    return this.apiClient.patch<TenantUser>(`${slug}/users/${id}`, userData);
  }

  /**
   * Delete user
   */
  deleteUser(id: number): Observable<void> {
    const slug = this.getTenantSlug();
    return this.apiClient.delete<void>(`${slug}/users/${id}`).pipe(
      tap(() => {
        // Remove from local state
        const updatedUsers = this.usersSignal().filter((u) => u.id !== id);
        this.usersSignal.set(updatedUsers);
        this.loadStats();
      }),
    );
  }

  /**
   * Change user status
   */
  changeUserStatus(id: number, status: UserStatus): Observable<TenantUser> {
    return this.updateUser(id, { status });
  }

  /**
   * Reset user password (admin action)
   */
  resetUserPassword(id: number, newPassword: string): Observable<void> {
    const slug = this.getTenantSlug();
    return this.apiClient.post<void>(`${slug}/users/${id}/reset-password`, {
      password: newPassword,
    });
  }

  /**
   * Rent ledger del inquilino: movimientos con saldo acumulado + resumen.
   */
  getTenantLedger(tenantId: number): Observable<TenantLedger> {
    const slug = this.getTenantSlug();
    return this.apiClient.get<TenantLedger>(`${slug}/users/tenants/${tenantId}/ledger`);
  }

  /**
   * Historial de solicitudes de mantenimiento del inquilino.
   */
  getTenantMaintenance(tenantId: number): Observable<TenantMaintenanceItem[]> {
    const slug = this.getTenantSlug();
    return this.apiClient.get<TenantMaintenanceItem[]>(
      `${slug}/users/tenants/${tenantId}/maintenance`,
    );
  }

  private buildTenantParams(filters: TenantUserFilters): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters.status && filters.status !== 'all') {
      params['status'] = filters.status;
    }

    if (filters.search) {
      params['search'] = filters.search;
    }

    if (filters.hasActiveContract !== undefined) {
      params['hasActiveContract'] = String(filters.hasActiveContract);
    }

    return params;
  }

  private setStatsFromUsers(users: AdminTenantUser[]): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const numberValue = (value: number | string | null | undefined): number => Number(value ?? 0);

    const stats: TenantUserStats = {
      total_users: users.length,
      active_users: users.filter((u) => u.status !== UserStatus.INACTIVE && u.is_active !== false)
        .length,
      inactive_users: users.filter((u) => u.status === UserStatus.INACTIVE || u.is_active === false)
        .length,
      new_this_month: users.filter((user) => {
        const createdAt = user.created_at ? new Date(user.created_at) : null;
        return (
          createdAt instanceof Date &&
          !Number.isNaN(createdAt.getTime()) &&
          createdAt.getMonth() === currentMonth &&
          createdAt.getFullYear() === currentYear
        );
      }).length,
      users_with_active_contracts: users.filter((u) => u.lease_status === 'active').length,
      users_with_pending_payments: users.filter((u) => numberValue(u.pending_payments) > 0).length,
      total_balance_due: users.reduce((sum, user) => sum + numberValue(user.balance_due), 0),
      total_paid: users.reduce((sum, user) => sum + numberValue(user.total_paid), 0),
    };

    this.statsSignal.set(stats);
  }

  /**
   * Update local stats based on current users
   */
  updateLocalStats(): void {
    const users = this.usersSignal();
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: TenantUserStats = {
      total_users: users.length,
      active_users: users.filter(
        (u) => u.status !== UserStatus.INACTIVE && u.status !== UserStatus.SUSPENDED,
      ).length,
      inactive_users: users.filter((u) => u.status === UserStatus.INACTIVE).length,
      new_this_month: users.filter((u) => new Date(u.created_at) >= thisMonthStart).length,
      users_with_active_contracts: users.filter((u) => u.active_contracts && u.active_contracts > 0)
        .length,
      users_with_pending_payments: users.filter((u) => u.pending_payments && u.pending_payments > 0)
        .length,
    };

    this.statsSignal.set(stats);
  }
}
