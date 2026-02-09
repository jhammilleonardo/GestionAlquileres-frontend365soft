import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    tenant_slug: string;
}

export interface LoginResponse {
    access_token: string;
    user: AdminUser;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private readonly TOKEN_KEY = 'admin_access_token';
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
        // Clean up old mock data
        this.cleanupOldData();

        // Check token validity on init
        if (this.getToken()) {
            this.validateToken();
        } else {
            // No token, clear everything
            this.currentUserSignal.set(null);
        }
    }

    /**
     * Clean up old mock data from previous implementation
     */
    private cleanupOldData(): void {
        const user = this.loadUserFromStorage();
        // If user exists but has string id '1' (mock data), clean it up
        if (user && user.id === '1' && user.email === 'admin@365soft.com') {
            localStorage.removeItem(this.USER_KEY);
            sessionStorage.removeItem(this.USER_KEY);
            localStorage.removeItem(this.TOKEN_KEY);
            sessionStorage.removeItem(this.TOKEN_KEY);
        }
    }

    /**
     * Login with email and password
     */
    login(slug: string, email: string, password: string, rememberMe: boolean = false): Observable<LoginResponse> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.post<LoginResponse>(
            `${environment.apiUrl}auth/${slug}/login`,
            { email, password }
        ).pipe(
            tap(response => {
                this.setSession(response, rememberMe);
                this.isLoadingSignal.set(false);
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
     * Login admin without slug (public endpoint)
     */
    loginAdmin(email: string, password: string, rememberMe: boolean = false): Observable<LoginResponse> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.post<LoginResponse>(
            `${environment.apiUrl}auth/admin/login`,
            { email, password }
        ).pipe(
            tap(response => {
                this.setSession(response, rememberMe);
                this.isLoadingSignal.set(false);
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
     * Get current tenant slug from user
     */
    getCurrentSlug(): string | null {
        const user = this.currentUserSignal();
        return user?.tenant_slug || null;
    }

    /**
     * Logout and clear session
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
    }

    /**
     * Get stored JWT token
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
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
        const token = this.getToken();
        if (!token) return;

        this.http.get<AdminUser>(`${environment.apiUrl}auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).pipe(
            catchError(() => {
                this.logout();
                return of(null);
            })
        ).subscribe(userData => {
            if (userData) {
                const user: User = {
                    id: userData.id.toString(),
                    name: userData.name,
                    email: userData.email,
                    role: userData.role.toLowerCase() as 'admin' | 'manager' | 'tenant' | 'owner',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`
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
            role: response.user.role.toLowerCase() as 'admin' | 'manager' | 'tenant' | 'owner',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.name)}&background=0D8ABC&color=fff`,
            tenant_slug: response.user.tenant_slug
        };

        storage.setItem(this.TOKEN_KEY, response.access_token);
        this.saveUserToStorage(user, storage);
        this.currentUserSignal.set(user);
    }

    /**
     * Load user from storage
     */
    private loadUserFromStorage(): User | null {
        const userJson = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        if (!userJson) return null;
        try {
            return JSON.parse(userJson);
        } catch {
            return null;
        }
    }

    /**
     * Save user to storage
     */
    private saveUserToStorage(user: User, storage: Storage = localStorage): void {
        storage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    /**
     * Clear error message
     */
    clearError(): void {
        this.errorSignal.set(null);
    }
}

