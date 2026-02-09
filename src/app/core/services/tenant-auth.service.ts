import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantUser {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: 'TENANT';
    tenant_slug: string;
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

@Injectable({
    providedIn: 'root'
})
export class TenantAuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private readonly TOKEN_KEY = 'tenant_access_token';
    private readonly USER_KEY = 'tenant_user';
    private readonly SLUG_KEY = 'tenant_slug';

    // Reactive state with signals
    private currentUserSignal = signal<TenantUser | null>(this.loadUserFromStorage());
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public computed values
    currentUser = this.currentUserSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();
    isAuthenticated = computed(() => this.currentUserSignal() !== null);
    tenantSlug = computed(() => localStorage.getItem(this.SLUG_KEY) || '');

    constructor() {
        // Check token validity on init
        if (this.getToken()) {
            this.validateToken();
        }
    }

    /**
     * Login with email and password
     */
    login(slug: string, email: string, password: string): Observable<LoginResponse> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.post<LoginResponse>(
            `${environment.apiUrl}auth/${slug}/login`,
            { email, password }
        ).pipe(
            tap(response => {
                this.setSession(response, slug);
                this.isLoadingSignal.set(false);
                this.router.navigate(['/portal/dashboard']);
            }),
            catchError(error => {
                this.isLoadingSignal.set(false);
                const message = error.error?.message || 'Error al iniciar sesión';
                this.errorSignal.set(message);
                throw error;
            })
        );
    }

    /**
     * Logout and clear session
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.SLUG_KEY);
        this.currentUserSignal.set(null);
        this.router.navigate(['/portal/login']);
    }

    /**
     * Get stored JWT token
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
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

        this.http.get<TenantUser>(`${environment.apiUrl}auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).pipe(
            catchError(() => {
                this.logout();
                return of(null);
            })
        ).subscribe(user => {
            if (user) {
                this.currentUserSignal.set(user);
                this.saveUserToStorage(user);
            }
        });
    }

    /**
     * Set session after successful login
     */
    private setSession(response: LoginResponse, slug: string): void {
        localStorage.setItem(this.TOKEN_KEY, response.access_token);
        localStorage.setItem(this.SLUG_KEY, slug);
        this.saveUserToStorage(response.user);
        this.currentUserSignal.set(response.user);
    }

    /**
     * Load user from localStorage
     */
    private loadUserFromStorage(): TenantUser | null {
        const userJson = localStorage.getItem(this.USER_KEY);
        if (!userJson) return null;
        try {
            return JSON.parse(userJson);
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
     * Clear error message
     */
    clearError(): void {
        this.errorSignal.set(null);
    }
}
