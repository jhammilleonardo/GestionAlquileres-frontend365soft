import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideAngularModule, Building2, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Shield, BarChart3, Users, FileText } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { TenantAuthService } from '../../core/services/tenant-auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatCheckboxModule,
        LucideAngularModule
    ],
    template: `
        <div class="login-page">
            <!-- Left Side - Branding -->
            <div class="login-brand">
                <div class="brand-content">
                    <div class="brand-logo">
                        <lucide-icon [img]="Building2" [size]="56"></lucide-icon>
                    </div>
                    <h1>365Soft</h1>
                    <h2>Panel de Administración</h2>
                    <p class="brand-tagline">
                        Gestiona todas tus propiedades, inquilinos y contratos desde un solo lugar
                    </p>

                    <div class="features">
                        <div class="feature-item">
                            <lucide-icon [img]="BarChart3" [size]="20"></lucide-icon>
                            <span>Dashboard con métricas en tiempo real</span>
                        </div>
                        <div class="feature-item">
                            <lucide-icon [img]="Users" [size]="20"></lucide-icon>
                            <span>Gestión completa de inquilinos</span>
                        </div>
                        <div class="feature-item">
                            <lucide-icon [img]="FileText" [size]="20"></lucide-icon>
                            <span>Automatización de contratos y pagos</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Side - Login Form -->
            <div class="login-form-container">
                <div class="login-form-wrapper">
                    <div class="form-header">
                        <h3>Iniciar Sesión</h3>
                        <p>{{ slug ? 'Accede a tu portal de inquilino' : 'Accede al panel de administración' }}</p>
                    </div>

                    @if (errorMessage()) {
                        <div class="error-alert">
                            <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
                            <div class="error-content">
                                <strong>Error de autenticación</strong>
                                <span>{{ errorMessage() }}</span>
                            </div>
                        </div>
                    }

                    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
                        <mat-form-field appearance="outline" class="custom-field">
                            <mat-label>Correo electrónico</mat-label>
                            <lucide-icon matIconPrefix [img]="Mail" [size]="20"></lucide-icon>
                            <input
                                matInput
                                type="email"
                                formControlName="email"
                                placeholder="admin@empresa.com"
                                autocomplete="email">
                            @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                                <mat-error>El correo es requerido</mat-error>
                            }
                            @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                                <mat-error>Correo inválido</mat-error>
                            }
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="custom-field">
                            <mat-label>Contraseña</mat-label>
                            <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                            <input
                                matInput
                                [type]="showPassword() ? 'text' : 'password'"
                                formControlName="password"
                                placeholder="••••••••"
                                autocomplete="current-password">
                            <button mat-icon-button matSuffix type="button" (click)="togglePassword()" tabindex="-1">
                                <lucide-icon [img]="showPassword() ? EyeOff : Eye" [size]="18"></lucide-icon>
                            </button>
                            @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                                <mat-error>La contraseña es requerida</mat-error>
                            }
                        </mat-form-field>

                        <div class="form-options">
                            <mat-checkbox formControlName="rememberMe" color="primary">
                                Recordarme
                            </mat-checkbox>
                            <a routerLink="/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>
                        </div>

                        <button
                            mat-raised-button
                            color="primary"
                            type="submit"
                            class="submit-btn"
                            [disabled]="loginForm.invalid || isLoading()">
                            @if (isLoading()) {
                                <mat-spinner diameter="20" color="accent"></mat-spinner>
                                <span>Iniciando sesión...</span>
                            } @else {
                                <span>Iniciar Sesión</span>
                            }
                        </button>
                    </form>

                    <div class="form-footer">
                        <div class="security-badge">
                            <lucide-icon [img]="Shield" [size]="16"></lucide-icon>
                            <span>Conexión segura SSL</span>
                        </div>
                        <div class="help-links">
                            @if (!slug) {
                                <a routerLink="/register" class="help-link">¿No tienes cuenta? Regístrate</a>
                            } @else {
                                <a [routerLink]="['/', slug, 'register']" class="help-link">¿No tienes cuenta? Regístrate</a>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            height: 100vh;
        }

        .login-page {
            display: grid;
            grid-template-columns: 1fr 1fr;
            height: 100vh;
            overflow: hidden;
        }

        /* Left Side - Branding */
        .login-brand {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px;
            position: relative;
            overflow: hidden;
        }

        .login-brand::before {
            content: '';
            position: absolute;
            width: 500px;
            height: 500px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 50%;
            top: -200px;
            left: -200px;
        }

        .login-brand::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: rgba(59, 130, 246, 0.08);
            border-radius: 50%;
            bottom: -150px;
            right: -150px;
        }

        .brand-content {
            position: relative;
            z-index: 1;
            color: white;
            max-width: 480px;
        }

        .brand-logo {
            width: 80px;
            height: 80px;
            background: rgba(59, 130, 246, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 32px;
            border: 2px solid rgba(59, 130, 246, 0.3);
        }

        .brand-content h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 8px;
            letter-spacing: -0.5px;
        }

        .brand-content h2 {
            font-size: 1.5rem;
            font-weight: 400;
            margin: 0 0 24px;
            opacity: 0.95;
            color: #93c5fd;
        }

        .brand-tagline {
            font-size: 1.05rem;
            line-height: 1.6;
            opacity: 0.9;
            margin: 0 0 48px;
        }

        .features {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1rem;
            opacity: 0.95;
        }

        .feature-item lucide-icon {
            flex-shrink: 0;
            color: #60a5fa;
        }

        /* Right Side - Form */
        .login-form-container {
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px;
            overflow-y: auto;
        }

        .login-form-wrapper {
            width: 100%;
            max-width: 440px;
        }

        .form-header {
            margin-bottom: 32px;
        }

        .form-header h3 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 8px;
            letter-spacing: -0.5px;
        }

        .form-header p {
            font-size: 1rem;
            color: #64748b;
            margin: 0;
        }

        .error-alert {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .error-alert lucide-icon {
            color: #ef4444;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .error-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .error-content strong {
            color: #991b1b;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .error-content span {
            color: #dc2626;
            font-size: 0.875rem;
        }

        .login-form {
            display: flex;
            flex-direction: column;
        }

        .custom-field {
            width: 100%;
            margin-bottom: 16px;
        }

        .form-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }

        .form-options ::ng-deep .mat-mdc-checkbox {
            font-size: 0.875rem;
            color: #475569;
        }

        .forgot-link {
            font-size: 0.875rem;
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
        }

        .forgot-link:hover {
            color: #2563eb;
            text-decoration: underline;
        }

        .submit-btn {
            width: 100%;
            height: 52px;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 8px;
            text-transform: none;
            letter-spacing: 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .submit-btn:not(:disabled):hover {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .form-footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }

        .security-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #64748b;
            font-size: 0.8125rem;
        }

        .security-badge lucide-icon {
            color: #10b981;
        }

        .help-links {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.875rem;
        }

        .help-links a {
            color: #64748b;
            text-decoration: none;
            cursor: pointer;
            position: relative;
            z-index: 10;
        }

        .help-links a:hover {
            color: #3b82f6;
            text-decoration: underline;
        }

        .tenant-portal-link {
            pointer-events: auto;
        }

        .separator {
            color: #cbd5e1;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
            .login-page {
                grid-template-columns: 1fr;
            }

            .login-brand {
                display: none;
            }

            .login-form-container {
                padding: 40px 24px;
            }
        }

        @media (max-width: 640px) {
            .login-form-container {
                padding: 32px 20px;
            }

            .form-header h3 {
                font-size: 1.5rem;
            }

            .form-header p {
                font-size: 0.9375rem;
            }

            .login-form-wrapper {
                max-width: 100%;
            }

            .submit-btn {
                height: 48px;
                font-size: 0.9375rem;
            }
        }

        @media (max-width: 480px) {
            .login-form-container {
                padding: 24px 16px;
            }

            .form-header {
                margin-bottom: 24px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-options {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 20px;
            }
        }
    `]
})
export class LoginComponent {
    readonly Building2 = Building2;
    readonly Mail = Mail;
    readonly Lock = Lock;
    readonly Eye = Eye;
    readonly EyeOff = EyeOff;
    readonly AlertCircle = AlertCircle;
    readonly CheckCircle2 = CheckCircle2;
    readonly Shield = Shield;
    readonly BarChart3 = BarChart3;
    readonly Users = Users;
    readonly FileText = FileText;

    private authService = inject(AuthService);
    private tenantAuthService = inject(TenantAuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);

    showPassword = signal(false);
    isLoading = signal(false);
    errorMessage = signal<string | null>(null);

    // Slug from URL (null if accessing /login, has value if /:slug/login)
    slug: string | null = null;

    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        rememberMe: [false]
    });

    constructor() {
        // Get slug from URL
        this.slug = this.route.snapshot.paramMap.get('slug');

        // If already authenticated, redirect to appropriate dashboard
        // Check for admin token first (only when no slug in URL)
        const adminToken = this.authService.getToken();
        const isAdminAuth = this.authService.isAuth();

        if (isAdminAuth && adminToken && !this.slug) {
            // Admin user authenticated on /login (no slug)
            // Get slug from stored user data
            const userJson = localStorage.getItem('admin_user');
            if (userJson) {
                try {
                    const user = JSON.parse(userJson);
                    const userSlug = user.tenant_slug;
                    if (userSlug) {
                        this.router.navigate(['/', userSlug, 'dashboard']);
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing user data', e);
                }
            }
            // Fallback if no slug found
            this.router.navigate(['/dashboard']);
        }

        // If we have a slug, don't redirect automatically - let the user login
        // TenantAuthService will handle the redirect after successful login
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const { email, password, rememberMe } = this.loginForm.value;

        // If we have a slug, use TenantAuthService for tenant login
        if (this.slug) {
            // Tenant login - TenantAuthService handles everything including navigation
            this.tenantAuthService.login(this.slug, email!, password!).subscribe({
                next: () => {
                    this.isLoading.set(false);
                    // TenantAuthService already handles navigation to /portal/dashboard
                },
                error: (error) => {
                    console.error('Login error:', error);
                    this.isLoading.set(false);
                    this.errorMessage.set(error.error?.message || 'Credenciales inválidas. Por favor, intenta nuevamente.');
                }
            });
        } else {
            // Admin login - use AuthService
            this.isLoading.set(true);
            this.errorMessage.set(null);

            this.authService.loginAdmin(email!, password!, rememberMe!).subscribe({
                next: (response) => {
                    this.isLoading.set(false);
                    const userSlug = response.user.tenant_slug;

                    if (userSlug) {
                        this.router.navigate(['/', userSlug, 'dashboard']);
                    } else {
                        this.errorMessage.set('No se pudo determinar la organización');
                    }
                },
                error: (error) => {
                    console.error('Login error:', error);
                    this.isLoading.set(false);
                    this.errorMessage.set(error.error?.message || 'Credenciales inválidas. Por favor, intenta nuevamente.');
                }
            });
        }
    }
}
