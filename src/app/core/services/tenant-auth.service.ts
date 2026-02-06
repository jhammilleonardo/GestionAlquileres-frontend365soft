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

    // Reactive state with signals
    private currentUserSignal = signal<TenantUser | null>(this.loadUserFromStorage());
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public computed values
    currentUser = this.currentUserSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();
    isAuthenticated = computed(() => this.currentUserSignal() !== null);
    tenantSlug = computed(() => this.currentUserSignal()?.tenant_slug || '');

    constructor() {
        // Check token validity on init
        if (this.getToken()) {
            this.validateToken();
        }
    }

    /**
     * Login with email and password
     * TODO: Replace with real API call when backend is ready
     */
    login(slug: string, email: string, password: string): Observable<LoginResponse> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        // SIMULACIÓN: Datos de prueba para desarrollo
        return of({
            access_token: 'demo-token-' + Date.now(),
            user: {
                id: 1,
                name: 'Juan Carlos Pérez',
                email: email,
                phone: '+34 612 345 678',
                role: 'TENANT' as const,
                tenant_slug: slug,
                contract: {
                    id: 1,
                    contract_number: 'CONT-2024-001',
                    property_title: 'Apartamento Centro Historico',
                    status: 'ACTIVO'
                }
            }
        }).pipe(
            tap(response => {
                setTimeout(() => {
                    this.setSession(response);
                    this.isLoadingSignal.set(false);
                    this.router.navigate(['/portal/dashboard']);
                }, 500); // Simular delay de red
            }),
            catchError(error => {
                this.isLoadingSignal.set(false);
                const message = 'Error al iniciar sesión';
                this.errorSignal.set(message);
                throw error;
            })
        );

        // PRODUCCIÓN: Descomentar cuando el backend esté listo
        /*
        return this.http.post<LoginResponse>(
            `${environment.apiUrl}auth/${slug}/login`,
            { email, password }
        ).pipe(
            tap(response => {
                this.setSession(response);
                this.isLoadingSignal.set(false);
            }),
            catchError(error => {
                this.isLoadingSignal.set(false);
                const message = error.error?.message || 'Error al iniciar sesión';
                this.errorSignal.set(message);
                throw error;
            })
        );
        */
    }

    /**
     * Logout and clear session
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
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
     * TODO: Replace with real API call when backend is ready
     */
    private validateToken(): void {
        const token = this.getToken();
        if (!token) return;

        // SIMULACIÓN: Por ahora, solo verificamos que exista el usuario en localStorage
        const user = this.loadUserFromStorage();
        if (user) {
            this.currentUserSignal.set(user);
        } else {
            this.logout();
        }

        // PRODUCCIÓN: Descomentar cuando el backend esté listo
        /*
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
        */
    }

    /**
     * Set session after successful login
     */
    private setSession(response: LoginResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.access_token);
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
