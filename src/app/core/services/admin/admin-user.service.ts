import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiHttpService } from '../api-http.service';
import { SlugService } from '../slug.service';
import { AuthService } from '../auth.service';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Usuario del sistema
 */
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'USER' | 'INQUILINO';
  created_at: string;
}

/**
 * Filtros para listar usuarios
 */
export interface UserFilters {
  role?: 'ADMIN' | 'USER' | 'INQUILINO';
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  private apiHttp = inject(ApiHttpService);
  private slugService = inject(SlugService);
  private authService = inject(AuthService);
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
   * Obtener headers con autenticación
   */
  private get headers() {
    const token = this.authService.getToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Cargar todos los usuarios
   */
  loadUsers(filters?: UserFilters): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint('users');
    const params: any = {};

    if (filters?.role) params.role = filters.role;
    if (filters?.search) params.search = filters.search;

    this.apiHttp
      .get<User[]>(endpoint, params, this.headers)
      .pipe(
        tap((users) => {
          this.usersSignal.set(users);
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadUsers'));
          this.isLoadingSignal.set(false);
          console.error('Error loading users:', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Cargar solo inquilinos (usuarios con rol USER o INQUILINO)
   */
  loadTenants(): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint('users');

    this.apiHttp
      .get<User[]>(endpoint, {}, this.headers)
      .pipe(
        tap((users) => {
          // Filtrar solo usuarios con rol USER o INQUILINO
          const tenants = users.filter((u) => u.role === 'USER' || u.role === 'INQUILINO');
          this.tenantsSignal.set(tenants);
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadTenants'));
          this.isLoadingSignal.set(false);
          console.error('Error loading tenants:', error);
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

    return this.apiHttp.get<User>(endpoint, {}, this.headers).pipe(
      catchError((error) => {
        this.errorSignal.set(this.transloco.translate('common.errors.loadUser'));
        console.error('Error getting user:', error);
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
