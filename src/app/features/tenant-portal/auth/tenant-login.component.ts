import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, Home, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';

@Component({
    selector: 'app-tenant-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        LucideAngularModule
    ],
    template: `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <div class="logo">
                        <lucide-icon [img]="Home" [size]="40"></lucide-icon>
                    </div>
                    <h1>Portal del Inquilino</h1>
                    <p>Inicia sesion para acceder a tu cuenta</p>
                </div>

                @if (authService.error()) {
                    <div class="error-alert">
                        <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                        <span>{{ authService.error() }}</span>
                    </div>
                }

                <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                    <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Empresa (slug)</mat-label>
                        <lucide-icon matIconPrefix [img]="Home" [size]="20"></lucide-icon>
                        <input matInput formControlName="slug" placeholder="mi-inmobiliaria">
                        @if (loginForm.get('slug')?.hasError('required') && loginForm.get('slug')?.touched) {
                            <mat-error>El slug es requerido</mat-error>
                        }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Correo electronico</mat-label>
                        <lucide-icon matIconPrefix [img]="Mail" [size]="20"></lucide-icon>
                        <input matInput type="email" formControlName="email" placeholder="correo&#64;ejemplo.com">
                        @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                            <mat-error>El correo es requerido</mat-error>
                        }
                        @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                            <mat-error>Ingresa un correo valido</mat-error>
                        }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Contrasena</mat-label>
                        <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                        <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password">
                        <button mat-icon-button matSuffix type="button" (click)="togglePassword()">
                            <lucide-icon [img]="showPassword() ? EyeOff : Eye" [size]="20"></lucide-icon>
                        </button>
                        @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                            <mat-error>La contrasena es requerida</mat-error>
                        }
                    </mat-form-field>

                    <button mat-raised-button color="primary" type="submit" class="login-btn"
                            [disabled]="loginForm.invalid || authService.isLoading()">
                        @if (authService.isLoading()) {
                            <mat-spinner diameter="20"></mat-spinner>
                            <span>Iniciando sesion...</span>
                        } @else {
                            <span>Iniciar Sesion</span>
                        }
                    </button>
                </form>

                <div class="login-footer">
                    <a href="#">¿Olvidaste tu contrasena?</a>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--mat-sys-surface);
            padding: 20px;
        }

        .login-card {
            width: 100%;
            max-width: 440px;
            padding: 48px 40px;
            background: var(--mat-sys-surface-container);
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid var(--mat-sys-outline-variant);
        }

        .login-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            background: var(--mat-sys-primary);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--mat-sys-on-primary);
        }

        .login-header h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--mat-sys-on-surface);
            margin: 0 0 8px;
        }

        .login-header p {
            color: var(--mat-sys-on-surface-variant);
            margin: 0;
            font-size: 0.95rem;
        }

        .error-alert {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            color: #dc2626;
            margin-bottom: 24px;
            font-size: 0.9rem;
        }

        .full-width {
            width: 100%;
            margin-bottom: 12px;
        }

        .login-btn {
            width: 100%;
            height: 48px;
            font-size: 15px;
            font-weight: 500;
            margin-top: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .login-footer {
            text-align: center;
            margin-top: 20px;
        }

        .login-footer a {
            color: var(--mat-sys-primary);
            text-decoration: none;
            font-size: 14px;
        }

        .login-footer a:hover {
            text-decoration: underline;
        }

        @media (max-width: 640px) {
            .login-card {
                padding: 32px 24px;
                border-radius: 12px;
            }

            .login-header h1 {
                font-size: 1.35rem;
            }
        }
    `]
})
export class TenantLoginComponent {
    readonly Home = Home;
    readonly Mail = Mail;
    readonly Lock = Lock;
    readonly Eye = Eye;
    readonly EyeOff = EyeOff;
    readonly AlertCircle = AlertCircle;

    authService = inject(TenantAuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);

    showPassword = signal(false);

    loginForm = this.fb.group({
        slug: ['mi-inmobiliaria', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
    });

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    onSubmit(): void {
        if (this.loginForm.invalid) return;

        const { slug, email, password } = this.loginForm.value;
        this.authService.clearError();

        this.authService.login(slug!, email!, password!).subscribe({
            next: () => {
                const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/portal/dashboard';
                this.router.navigateByUrl(returnUrl);
            },
            error: () => {
                // Error is handled by the service
            }
        });
    }
}
