import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  TenantUser,
  AdminTenantUser,
  TenantUserStats,
  TenantUserFilters,
  CreateTenantUserDto,
  UpdateTenantUserDto,
  UserRole,
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

  adminUsers = computed(() => this.usersSignal().filter((u) => u.role === UserRole.ADMIN));

  regularUsers = computed(() => this.usersSignal().filter((u) => u.role === UserRole.USER));

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

  /**
   * Load user statistics
   */
  loadStats(): void {
    // Mock stats - replace with real API endpoint when available
    const stats: TenantUserStats = {
      total_users: this.usersSignal().length,
      active_users: this.activeUsers().length,
      inactive_users: this.usersSignal().filter((u) => u.status === UserStatus.INACTIVE).length,
      new_this_month: 0,
      users_with_active_contracts: 0,
      users_with_pending_payments: 0,
    };
    this.statsSignal.set(stats);
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

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<AdminTenantUser> {
    const slug = this.getTenantSlug();
    return this.apiClient.get<AdminTenantUser>(`${slug}/users/${id}`);
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
    return this.apiClient.patch<TenantUser>(`${slug}/users/${id}`, userData).pipe(
      tap(() => {
        // Reload users after updating
        this.loadAllUsers();
      }),
    );
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
   * Get user contracts
   */
  getUserContracts(userId: number): Observable<Record<string, unknown>[]> {
    const slug = this.getTenantSlug();
    return this.apiClient.get<Record<string, unknown>[]>(`${slug}/users/${userId}/contracts`);
  }

  /**
   * Get user payments
   */
  getUserPayments(userId: number): Observable<Record<string, unknown>[]> {
    const slug = this.getTenantSlug();
    return this.apiClient.get<Record<string, unknown>[]>(`${slug}/users/${userId}/payments`);
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
