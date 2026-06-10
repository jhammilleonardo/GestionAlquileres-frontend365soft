import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, switchMap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SlugService } from '../slug.service';
import { SessionTokenService } from '../session-token.service';

import { getApiErrorMessage } from '../../http/http-error.util';
export interface TenantUser {
  id: number;
  userId?: number; // El backend a veces devuelve userId en lugar de id
  name: string;
  email: string;
  phone?: string;
  role: 'TENANT' | 'INQUILINO';
  tenant_slug: string;
  tenantSlug?: string; // El backend a veces devuelve tenantSlug en camelCase
  contract?: {
    id: number;
    contract_number: string;
    property_title: string;
    status: string;
  };
}

export interface LoginResponse {
  access_token: string;
  user: TenantUser;
}

/** Forma cruda del usuario que devuelve el backend (camelCase o snake_case). */
interface RawTenantUser {
  id?: number;
  userId?: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: 'TENANT' | 'INQUILINO';
  tenant_slug?: string;
  tenantSlug?: string;
  contract?: TenantUser['contract'];
}

@Injectable({
  providedIn: 'root',
})
export class TenantAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly sessionToken = inject(SessionTokenService);

  private readonly TOKEN_KEY = 'tenant_access_token';
  private readonly USER_KEY = 'tenant_user';

  // Reactive state with signals
  private currentUserSignal = signal<TenantUser | null>(this.loadUserFromStorage());
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Public computed values
  currentUser = this.currentUserSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    // Load user from storage if token exists
    const token = this.getToken();
    if (token) {
      const user = this.loadUserFromStorage();
      if (user) {
        this.currentUserSignal.set(user);
        // NOTE: Do NOT call slugService.setSlug() here.
        // The slug is set by tenantAuthGuard from the URL route param.
        // Setting it here can override the admin slug when both sessions
        // are stored in localStorage simultaneously.
      }
      // Validate token silently - if invalid (401), clear storage
      // This prevents 401 errors and login loops when JWT_SECRET changes
      this.validateTokenSilently();
    }
  }

  /**
   * Login with email and password
   */
  login(slug: string, email: string, password: string): Observable<TenantUser | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    // Set slug in SlugService
    this.slugService.setSlug(slug);

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}auth/${slug}/login`, { email, password })
      .pipe(
        tap((response) => {
          // Store token and initial user data immediately
          this.sessionToken.setToken('tenant', response.access_token);
          const normalizedUser = this.normalizeUserData(response.user);
          this.currentUserSignal.set(normalizedUser);
          this.saveUserToStorage(normalizedUser);
        }),
        // Chain with refreshUserData so the observable emits ONCE with full user data
        // This prevents double navigation (caller navigates only after user data is complete)
        switchMap(() => this.refreshUserData()),
        tap(() => {
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.isLoadingSignal.set(false);
          const message = getApiErrorMessage(error, 'Error al iniciar sesión');
          this.errorSignal.set(message);
          throw error;
        }),
      );
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    const slug = this.slugService.getSlug();

    this.sessionToken.clearToken('tenant');
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);

    // Clear slug from SlugService
    this.slugService.clearSlug();

    // Navigate to login with slug
    // Usar replaceUrl para limpiar el historial al cerrar sesión
    if (slug) {
      void this.router.navigate(['/', slug, 'login'], { replaceUrl: true });
    } else {
      void this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return this.sessionToken.getToken('tenant');
  }

  /**
   * Check if user has active contract
   */
  hasActiveContract(): boolean {
    const user = this.currentUserSignal();
    if (!user?.contract) return false;
    return ['ACTIVO', 'POR_VENCER'].includes(user.contract.status);
  }

  /**
   * Validate current token with backend
   */
  private validateToken(): void {
    const token = this.getToken();
    if (!token) return;

    this.http
      .get<TenantUser>(`${environment.apiUrl}auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        catchError(() => {
          this.logout();
          return of(null);
        }),
      )
      .subscribe((user) => {
        if (user) {
          this.currentUserSignal.set(user);
          this.saveUserToStorage(user);
        }
      });
  }

  /**
   * Refresh user data from backend
   * Call this when you need to update user info (e.g., after contract creation)
   */
  refreshUserData(): Observable<TenantUser | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // auth/me es un endpoint compartido sin /tenant/ en la URL: el interceptor
    // no puede inferir el contexto y caería al token de admin. Forzamos el de
    // inquilino explícitamente (el interceptor respeta un Authorization ya puesto).
    return this.http
      .get<RawTenantUser>(`${environment.apiUrl}auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        map((user) => {
          if (!user) return null;
          const normalizedUser = this.normalizeUserData(user);
          this.currentUserSignal.set(normalizedUser);
          this.saveUserToStorage(normalizedUser);
          return normalizedUser;
        }),
        catchError(() => of(null)),
      );
  }

  /**
   * Validate token silently on app init
   * Clears invalid tokens without redirecting to prevent 401 loops
   */
  private validateTokenSilently(): void {
    const token = this.getToken();
    if (!token) return;

    this.http
      .get<RawTenantUser>(`${environment.apiUrl}auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        catchError((error: { status?: number }) => {
          // Only clear storage if token is invalid (401)
          // Don't clear on network errors to avoid logout on connection issues
          if (error.status === 401) {
            this.sessionToken.clearToken('tenant');
            localStorage.removeItem(this.USER_KEY);
            this.currentUserSignal.set(null);
            this.slugService.clearSlug();
          }
          return of(null);
        }),
      )
      .subscribe((user) => {
        if (user) {
          // Token is valid — normalize and update user data
          const normalizedUser = this.normalizeUserData(user);
          this.currentUserSignal.set(normalizedUser);
          this.saveUserToStorage(normalizedUser);
        }
      });
  }

  /**
   * Normalize user data from backend to match TenantUser interface
   * Backend returns userId but we expect id, tenantSlug vs tenant_slug, etc.
   */
  private normalizeUserData(user: RawTenantUser): TenantUser {
    return {
      id: user.userId ?? user.id ?? 0,
      userId: user.userId ?? user.id, // Keep both for compatibility
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone,
      role: user.role ?? 'INQUILINO',
      tenant_slug: user.tenantSlug ?? user.tenant_slug ?? '',
      tenantSlug: user.tenantSlug ?? user.tenant_slug, // Keep both
      contract: user.contract,
    };
  }

  /**
   * Set session after successful login
   */
  private setSession(response: LoginResponse): void {
    this.sessionToken.setToken('tenant', response.access_token);
    const normalizedUser = this.normalizeUserData(response.user);
    this.saveUserToStorage(normalizedUser);
    this.currentUserSignal.set(normalizedUser);
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): TenantUser | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      const user = JSON.parse(userJson) as RawTenantUser;
      // Normalize the user data to handle both old and new formats
      return this.normalizeUserData(user);
    } catch {
      return null;
    }
  }

  /**
   * Save user to localStorage
   */
  private saveUserToStorage(user: TenantUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Set session from external auth (e.g., after registration)
   * Updates the signal so guards see the user as authenticated immediately.
   */
  setSessionFromToken(token: string, userData: RawTenantUser, slug?: string): void {
    this.sessionToken.setToken('tenant', token);
    if (slug) {
      this.slugService.setSlug(slug);
    }
    const normalized = this.normalizeUserData({
      ...userData,
      tenant_slug: userData.tenant_slug || userData.tenantSlug || slug || '',
    });
    this.currentUserSignal.set(normalized);
    this.saveUserToStorage(normalized);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
