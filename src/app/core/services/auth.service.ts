import { Injectable, signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { SlugService } from './slug.service';
import { PermissionsService } from './permissions.service';
import { getApiErrorMessage } from '../http/http-error.util';
import { SessionTokenService } from './session-token.service';
import { SessionExpirationService } from './session-expiration.service';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  tenant_slug?: string;
}

export interface LoginResponse {
  access_token?: string;
  user: AdminUser;
}

export interface AdminMfaRequiredResponse {
  mfa_required: true;
  challenge_id: string;
  email_masked: string;
  expires_in_seconds: number;
}

export type AdminLoginResponse = LoginResponse | AdminMfaRequiredResponse;

export function isAdminMfaRequiredResponse(
  response: AdminLoginResponse,
): response is AdminMfaRequiredResponse {
  return 'mfa_required' in response && response.mfa_required === true;
}

export interface RegisterAdminResponse {
  message: string;
  tenant: {
    id: number;
    company_name: string;
    slug: string;
    currency: string;
    locale: string;
  };
  user: AdminUser;
  access_token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private slugService = inject(SlugService);
  private permissionsService = inject(PermissionsService);
  private sessionTokens = inject(SessionTokenService);
  private sessionExpiration = inject(SessionExpirationService);

  private readonly USER_KEY = 'admin_user';

  // Reactive state with signals
  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());
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
      this.permissionsService.clear();
      this.slugService.clearSlug();
    });

    // Clean up old mock data
    this.cleanupOldData();

    // La cookie HttpOnly no es legible desde JavaScript. El usuario persistido
    // permite restaurar el estado síncrono durante un refresh/HMR y luego
    // `auth/me` confirma en segundo plano que la cookie sigue siendo válida.
    const user = this.loadUserFromStorage();
    if (user) {
      this.currentUserSignal.set(user);
      if (user.tenant_slug) {
        this.slugService.setSlug(user.tenant_slug);
      }
      this.validateTokenSilently();
    } else {
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Clean up old mock data from previous implementation
   */
  private cleanupOldData(): void {
    const user = this.loadUserFromStorage();
    const token = this.getToken();
    const isLegacyMockToken = token === 'mock-token' || token?.startsWith('mock-') === true;

    // Versiones anteriores guardaban un admin mock con id/email iguales al seed real.
    // La ausencia de token en storage es normal con cookies HttpOnly.
    if (user && user.id === '1' && user.email === 'admin@365soft.com' && isLegacyMockToken) {
      this.clearStoredAdminSession();
    }
  }

  /**
   * Login with email and password
   * @param slug Tenant slug from URL
   * @param email User email
   * @param password User password
   * @param rememberMe Whether to remember session
   */
  login(
    slug: string,
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    // Set slug in SlugService
    this.slugService.setSlug(slug);

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}auth/${slug}/login`, { email, password })
      .pipe(
        tap((response) => {
          this.setSession(response, rememberMe);
          this.isLoadingSignal.set(false);
        }),
        catchError((error: unknown) => {
          this.isLoadingSignal.set(false);
          this.errorSignal.set(getApiErrorMessage(error, 'Error al iniciar sesión'));
          throw error;
        }),
      );
  }

  /**
   * Login admin without slug (public endpoint)
   */
  loginAdmin(
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Observable<AdminLoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<AdminLoginResponse>(`${environment.apiUrl}auth/login-admin`, { email, password })
      .pipe(
        tap((response) => {
          if (!isAdminMfaRequiredResponse(response)) {
            this.setSession(response, rememberMe);
            // Set slug from response after successful login
            if (response.user?.tenant_slug) {
              this.slugService.setSlug(response.user.tenant_slug);
            }
          }
          this.isLoadingSignal.set(false);
        }),
        catchError((error: unknown) => {
          this.isLoadingSignal.set(false);
          this.errorSignal.set(getApiErrorMessage(error, 'Error al iniciar sesión'));
          throw error;
        }),
      );
  }

  verifyAdminMfa(
    challengeId: string,
    code: string,
    rememberMe: boolean = false,
  ): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}auth/login-admin/mfa`, {
        challenge_id: challengeId,
        code,
      })
      .pipe(
        tap((response) => {
          this.setSession(response, rememberMe);
          if (response.user?.tenant_slug) {
            this.slugService.setSlug(response.user.tenant_slug);
          }
          this.isLoadingSignal.set(false);
        }),
        catchError((error: unknown) => {
          this.isLoadingSignal.set(false);
          this.errorSignal.set(getApiErrorMessage(error, 'Codigo de verificacion invalido'));
          throw error;
        }),
      );
  }

  /**
   * Get current tenant slug from user
   * @deprecated Use SlugService.getSlug() instead
   */
  getCurrentSlug(): string | null {
    return this.slugService.getSlug();
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    // Revoca el refresh token y limpia las cookies HttpOnly en el backend.
    // Best-effort: la limpieza local procede aunque la llamada falle.
    this.http
      .post(`${environment.apiUrl}auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();

    this.clearStoredAdminSession();
    this.currentUserSignal.set(null);

    // Limpiar slug y permisos en caché
    this.slugService.clearSlug();
    this.permissionsService.clear();

    // Redirect to login page
    void this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return this.sessionTokens.getToken('admin');
  }

  /**
   * Check if user is authenticated
   */
  isAuth(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSignal();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Validate current token with backend
   */
  private validateToken(): void {
    if (!this.currentUserSignal()) return;

    this.http
      .get<AdminUser>(`${environment.apiUrl}auth/me`)
      .pipe(
        catchError(() => {
          this.logout();
          return of(null);
        }),
      )
      .subscribe((userData) => {
        if (userData) {
          const user: User = {
            id: userData.id.toString(),
            name: userData.name,
            email: userData.email,
            role: userData.role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`,
          };
          this.currentUserSignal.set(user);
          this.saveUserToStorage(user);
        }
      });
  }

  /**
   * Validate token silently on app init
   * Clears invalid tokens without redirecting to prevent 401 loops
   */
  /**
   * Validate token silently on app init
   * Clears invalid tokens without redirecting to prevent 401 loops
   */
  private validateTokenSilently(): void {
    if (!this.currentUserSignal()) return;

    this.http
      .get<AdminUser>(`${environment.apiUrl}auth/me`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // Only clear storage if token is invalid (401)
          // Don't clear on network errors to avoid logout on connection issues
          if (error.status === 401) {
            this.clearStoredAdminSession();
            this.currentUserSignal.set(null);
            this.slugService.clearSlug();
          }
          return of(null);
        }),
      )
      .subscribe((userData) => {
        if (userData && userData.id) {
          // Token is valid, update user data in case it changed
          const user: User = {
            id: userData.id.toString(),
            name: userData.name,
            email: userData.email,
            role: userData.role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`,
            tenant_slug: userData.tenant_slug,
          };
          this.currentUserSignal.set(user);
          this.saveUserToStorage(user);
        }
      });
  }

  /**
   * Set session after successful login
   */
  private setSession(response: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    const user: User = {
      id: response.user.id.toString(),
      name: response.user.name,
      email: response.user.email,
      role: response.user.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.name)}&background=0D8ABC&color=fff`,
      tenant_slug: response.user.tenant_slug,
    };

    // Save user data in the correct client context. The access token is emitted
    // by the backend as an HttpOnly cookie and must not be mirrored to storage.
    if (response.user.role === 'INQUILINO') {
      localStorage.removeItem('tenant_user');
      sessionStorage.removeItem('tenant_user');
      storage.setItem('tenant_user', JSON.stringify(response.user));
    } else {
      // Admin: la sesión va en la cookie HttpOnly emitida por el backend; el
      // JWT ya no se guarda en localStorage (mitiga robo por XSS). Sólo se
      // persiste el objeto user como señal de sesión del lado cliente.
      this.saveUserToStorage(user, storage);
      this.currentUserSignal.set(user);
    }
  }

  /**
   * Load user from storage
   */
  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }

  /**
   * Save user to storage
   */
  private saveUserToStorage(user: User, storage?: Storage): void {
    const targetStorage = storage ?? this.getCurrentUserStorage();
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    targetStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getCurrentUserStorage(): Storage {
    return localStorage.getItem(this.USER_KEY) ? localStorage : sessionStorage;
  }

  private clearStoredAdminSession(): void {
    this.sessionTokens.clearToken('admin');
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  /**
   * Update user profile
   */
  updateProfile(
    id: number,
    data: { name?: string; email?: string; phone?: string },
  ): Observable<User> {
    const slug = this.slugService.getSlug();
    return this.http.patch<AdminUser>(`${environment.apiUrl}${slug}/users/${id}`, data).pipe(
      map((updatedUser) => {
        const user: User = {
          id: updatedUser.id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedUser.name)}&background=0D8ABC&color=fff`,
          tenant_slug: updatedUser.tenant_slug,
        };
        this.currentUserSignal.set(user);
        this.saveUserToStorage(user);
        return user;
      }),
    );
  }

  /**
   * Change user password
   */
  changePassword(id: number, newPassword: string, currentPassword?: string): Observable<void> {
    const slug = this.slugService.getSlug();
    return this.http.post<void>(`${environment.apiUrl}${slug}/users/${id}/reset-password`, {
      password: newPassword,
      current_password: currentPassword,
    });
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}auth/forgot-password`, {
      email,
    });
  }

  resetPassword(
    token: string,
    password: string,
  ): Observable<{ message: string; role: string | null; tenantSlug: string }> {
    return this.http.post<{ message: string; role: string | null; tenantSlug: string }>(
      `${environment.apiUrl}auth/reset-password`,
      {
        token,
        password,
      },
    );
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Register new admin and tenant
   */
  registerAdmin(data: {
    company_name: string;
    slug?: string;
    country: string;
    rental_type?: 'SHORT_TERM' | 'LONG_TERM' | 'BOTH';
    name: string;
    email: string;
    password: string;
    phone?: string;
    currency?: string;
    locale?: string;
  }): Observable<RegisterAdminResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<RegisterAdminResponse>(`${environment.apiUrl}auth/register-admin`, data)
      .pipe(
        tap((response) => {
          // Set session after successful registration
          const loginResponse: LoginResponse = {
            user: response.user,
          };
          this.setSession(loginResponse, true); // Remember by default
          // Set slug from response
          if (response.tenant.slug) {
            this.slugService.setSlug(response.tenant.slug);
          }
          this.isLoadingSignal.set(false);
        }),
        catchError((error: unknown) => {
          this.isLoadingSignal.set(false);
          this.errorSignal.set(getApiErrorMessage(error, 'Error al registrar'));
          throw error;
        }),
      );
  }
}
