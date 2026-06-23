import { Injectable, signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, switchMap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SlugService } from '../slug.service';
import { SessionTokenService } from '../session-token.service';
import { SessionExpirationService } from '../session-expiration.service';

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
  access_token?: string;
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
  private readonly sessionExpiration = inject(SessionExpirationService);

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
    this.sessionExpiration.expired$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.currentUserSignal.set(null);
      this.slugService.clearSlug();
    });

    // La sesión vive en la cookie HttpOnly; el objeto user en storage es la
    // señal de sesión del lado cliente (el JWT ya no se guarda en localStorage).
    const user = this.loadUserFromStorage();
    if (user) {
      this.currentUserSignal.set(user);
      // NOTE: Do NOT call slugService.setSlug() here — lo hace tenantAuthGuard
      // desde el route param para no pisar el slug del admin.
      // Valida la sesión en silencio; si la cookie es inválida (401), limpia.
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
          // El JWT va en la cookie HttpOnly; sólo se persiste el objeto user.
          const normalizedUser = this.normalizeUserData(response.user);
          this.currentUserSignal.set(normalizedUser);
          this.saveUserToStorage(normalizedUser, sessionStorage);
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
   * Limpia el almacenamiento de la sesión del inquilino (token legacy, objeto
   * user y slug) sin navegar ni llamar al backend. Centraliza el conocimiento
   * de las claves de storage para que otros componentes no las toquen directo.
   */
  clearSession(): void {
    this.sessionToken.clearToken('tenant');
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('tenant_slug');
    sessionStorage.removeItem('tenant_slug');
    this.currentUserSignal.set(null);
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    const slug = this.slugService.getSlug();

    // Revoca el refresh y limpia las cookies en el backend (best-effort).
    this.http
      .post(`${environment.apiUrl}auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();

    this.sessionToken.clearToken('tenant');
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_KEY);
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
    this.http
      .get<TenantUser>(`${environment.apiUrl}auth/me`)
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
    // auth/me se autentica con la cookie HttpOnly; no dependemos de tokens en
    // local/sessionStorage para que el login tenant funcione sin exponer JWT.
    return this.http.get<RawTenantUser>(`${environment.apiUrl}auth/me`).pipe(
      map((user) => {
        if (!user) return null;
        const normalizedUser = this.normalizeUserData(user);
        this.currentUserSignal.set(normalizedUser);
        this.saveUserToStorage(normalizedUser, this.getCurrentUserStorage());
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
    // La sesión viaja por cookie HttpOnly (withCredentials lo agrega el
    // interceptor); se valida sólo si hay objeto user en storage.
    if (!this.currentUserSignal()) return;

    this.http
      .get<RawTenantUser>(`${environment.apiUrl}auth/me`)
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
          this.saveUserToStorage(normalizedUser, this.getCurrentUserStorage());
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
    const normalizedUser = this.normalizeUserData(response.user);
    this.saveUserToStorage(normalizedUser, sessionStorage);
    this.currentUserSignal.set(normalizedUser);
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): TenantUser | null {
    const userJson = localStorage.getItem(this.USER_KEY) ?? sessionStorage.getItem(this.USER_KEY);
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
  private saveUserToStorage(user: TenantUser, storage: Storage = sessionStorage): void {
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Set session from external auth (e.g., after registration)
   * Updates the signal so guards see the user as authenticated immediately.
   */
  setSessionFromToken(token: string, userData: RawTenantUser, slug?: string): void {
    // El JWT lo emite el backend como cookie HttpOnly durante el registro; aquí
    // sólo se actualiza el objeto user para que los guards vean la sesión.
    void token;
    if (slug) {
      this.slugService.setSlug(slug);
    }
    const normalized = this.normalizeUserData({
      ...userData,
      tenant_slug: userData.tenant_slug || userData.tenantSlug || slug || '',
    });
    this.currentUserSignal.set(normalized);
    this.saveUserToStorage(normalized, sessionStorage);
  }

  private getCurrentUserStorage(): Storage {
    return localStorage.getItem(this.USER_KEY) ? localStorage : sessionStorage;
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
