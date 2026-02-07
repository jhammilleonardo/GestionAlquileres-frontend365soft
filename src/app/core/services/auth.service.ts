import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { ApiHttpService } from './api-http.service';

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    tenant_id: number;
  };
}

interface RegisterAdminResponse {
  message: string;
  tenant: {
    id: number;
    company_name: string;
    slug: string;
    currency: string;
    locale: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    tenant_id: number;
  };
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();
  private tokenKey = 'access_token';
  private tenantSlugKey = 'tenant_slug';

  constructor(private apiHttp: ApiHttpService) {
    this.loadUserFromStorage();
  }

  /**
   * Load user and token from localStorage on service init
   */
  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem('current_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSignal.set(user);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }

  /**
   * Login to backend with slug/email/password
   */
  login(slug: string, email: string, password: string): Observable<LoginResponse> {
    return this.apiHttp.post<LoginResponse>(`auth/${slug}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response, slug);
        })
      );
  }

  /**
   * Register new admin and tenant
   */
  registerAdmin(data: {
    company_name: string;
    slug?: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    currency?: string;
    locale?: string;
  }): Observable<RegisterAdminResponse> {
    return this.apiHttp.post<RegisterAdminResponse>('auth/register-admin', data)
      .pipe(
        tap(response => {
          this.setSession(
            { access_token: response.access_token, user: response.user },
            response.tenant.slug
          );
        })
      );
  }

  /**
   * Set authentication session
   */
  private setSession(authResult: LoginResponse, slug: string): void {
    localStorage.setItem(this.tokenKey, authResult.access_token);
    localStorage.setItem(this.tenantSlugKey, slug);

    const user: User = {
      id: authResult.user.id.toString(),
      name: authResult.user.name,
      email: authResult.user.email,
      role: authResult.user.role.toLowerCase() as 'admin' | 'manager' | 'tenant' | 'owner',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authResult.user.name)}&background=0D8ABC&color=fff`
    };

    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get current tenant slug
   */
  getTenantSlug(): string | null {
    return localStorage.getItem(this.tenantSlugKey);
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tenantSlugKey);
    localStorage.removeItem('current_user');
    this.currentUserSignal.set(null);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null && this.currentUserSignal() !== null;
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
}
