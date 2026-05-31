import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Usuario del sistema
 */
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'SUPERADMIN' | 'USER' | 'INQUILINO' | 'EMPLEADO' | 'TECNICO';
  created_at: string;
}

/**
 * Filtros para listar usuarios
 */
export interface UserFilters {
  role?: 'ADMIN' | 'SUPERADMIN' | 'USER' | 'INQUILINO' | 'EMPLEADO' | 'TECNICO';
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  private apiClient = inject(ApiClientService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  // Signals para estado reactivo
  private usersSignal = signal<User[]>([]);
  private tenantsSignal = signal<User[]>([]); // Solo inquilinos
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Signals públicas de solo lectura
  users = this.usersSignal.asReadonly();
  tenants = this.tenantsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  /**
   * Obtener el slug actual
   */
  private get slug(): string {
    return this.slugService.getSlug() || '';
  }

  /**
   * Cargar todos los usuarios
   */
  loadUsers(filters?: UserFilters): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint('users');
    const params: Record<string, string> = {};

    if (filters?.role) params['role'] = filters.role;
    if (filters?.search) params['search'] = filters.search;

    this.apiClient
      .get<User[]>(endpoint, { params })
      .pipe(
        tap((users) => {
          this.usersSignal.set(users);
          this.isLoadingSignal.set(false);
        }),
        catchError((_e) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadUsers'));
          this.isLoadingSignal.set(false);
          return of([]);
        }),
      )
      .subscribe();
  }

  listUsers(filters?: UserFilters): Observable<User[]> {
    const endpoint = this.slugService.buildApiEndpoint('users');
    const params: Record<string, string> = {};

    if (filters?.role) params['role'] = filters.role;
    if (filters?.search) params['search'] = filters.search;

    return this.apiClient.get<User[]>(endpoint, { params }).pipe(
      map((users) =>
        users.filter((user) => {
          const roleMatches = filters?.role ? user.role === filters.role : true;
          const search = filters?.search?.trim().toLowerCase();
          const searchMatches = search
            ? `${user.name} ${user.email}`.toLowerCase().includes(search)
            : true;
          return roleMatches && searchMatches;
        }),
      ),
    );
  }

  /**
   * Cargar solo inquilinos (usuarios con rol USER o INQUILINO)
   */
  loadTenants(): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint('users');

    this.apiClient
      .get<User[]>(endpoint)
      .pipe(
        tap((users) => {
          // Filtrar solo usuarios con rol USER o INQUILINO
          const tenants = users.filter((u) => u.role === 'USER' || u.role === 'INQUILINO');
          this.tenantsSignal.set(tenants);
          this.isLoadingSignal.set(false);
        }),
        catchError((_e) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadTenants'));
          this.isLoadingSignal.set(false);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Obtener un usuario por ID
   */
  getUser(id: number): Observable<User> {
    if (!this.slug) {
      return of();
    }

    const endpoint = this.slugService.buildApiEndpoint(`users/${id}`);

    return this.apiClient.get<User>(endpoint).pipe(
      catchError((error) => {
        this.errorSignal.set(this.transloco.translate('common.errors.loadUser'));
        throw error;
      }),
    );
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Limpiar lista de usuarios
   */
  clearUsers(): void {
    this.usersSignal.set([]);
    this.tenantsSignal.set([]);
  }
}
