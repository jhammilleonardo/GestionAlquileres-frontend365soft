import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { LucideAngularModule, User, Mail, Phone, Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPass = form.get('new_password')?.value;
    const confirmPass = form.get('confirm_password')?.value;
    if (newPass && confirmPass && newPass !== confirmPass) {
        return { passwordMismatch: true };
    }
    return null;
}

@Component({
    selector: 'app-admin-perfil',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatTabsModule,
        LucideAngularModule
    ],
    template: `
        <div class="profile-container">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <lucide-icon [img]="User" [size]="32"></lucide-icon>
                    <div>
                        <h1>Mi Perfil</h1>
                        <p>Gestiona tu información personal y seguridad</p>
                    </div>
                </div>
            </div>

            @if (authService.currentUser(); as user) {
                <div class="profile-grid">
                    <!-- Info Card -->
                    <mat-card class="info-card">
                        <div class="user-avatar">
                            <span class="avatar-initials">{{ getInitials(user.name) }}</span>
                        </div>
                        <h2>{{ user.name }}</h2>
                        <p class="user-email">{{ user.email }}</p>
                        <div class="user-role">
                            <lucide-icon [img]="Shield" [size]="14"></lucide-icon>
                            {{ getRoleLabel(user.role) }}
                        </div>

                        <mat-divider style="margin: 20px 0;"></mat-divider>

                        <div class="info-items">
                            <div class="info-row">
                                <lucide-icon [img]="Mail" [size]="16"></lucide-icon>
                                <span>{{ user.email }}</span>
                            </div>
                            @if (user.tenant_slug) {
                                <div class="info-row">
                                    <lucide-icon [img]="Shield" [size]="16"></lucide-icon>
                                    <span>{{ user.tenant_slug }}</span>
                                </div>
                            }
                        </div>
                    </mat-card>

                    <!-- Forms -->
                    <div class="forms-container">
                        <mat-tab-group>
                            <!-- Personal Info Tab -->
                            <mat-tab label="Información Personal">
                                <mat-card class="form-card">
                                    @if (updateSuccess()) {
                                        <div class="success-alert">
                                            <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                                            <span>Información actualizada exitosamente</span>
                                        </div>
                                    }
                                    @if (updateError()) {
                                        <div class="error-alert">
                                            <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                                            <span>{{ updateError() }}</span>
                                        </div>
                                    }

                                    <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                                        <div class="form-row">
                                            <mat-form-field appearance="outline">
                                                <mat-label>Nombre Completo</mat-label>
                                                <lucide-icon matIconPrefix [img]="User" [size]="20"></lucide-icon>
                                                <input matInput formControlName="name" placeholder="Juan Pérez" required>
                                                @if (profileForm.get('name')?.hasError('required') && profileForm.get('name')?.touched) {
                                                    <mat-error>El nombre es requerido</mat-error>
                                                }
                                            </mat-form-field>

                                            <mat-form-field appearance="outline">
                                                <mat-label>Email</mat-label>
                                                <lucide-icon matIconPrefix [img]="Mail" [size]="20"></lucide-icon>
                                                <input matInput type="email" formControlName="email" placeholder="correo@ejemplo.com" required>
                                                @if (profileForm.get('email')?.hasError('required') && profileForm.get('email')?.touched) {
                                                    <mat-error>El email es requerido</mat-error>
                                                }
                                                @if (profileForm.get('email')?.hasError('email')) {
                                                    <mat-error>Email inválido</mat-error>
                                                }
                                            </mat-form-field>
                                        </div>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Teléfono</mat-label>
                                            <lucide-icon matIconPrefix [img]="Phone" [size]="20"></lucide-icon>
                                            <input matInput type="tel" formControlName="phone" placeholder="+591 7XXXXXXX">
                                        </mat-form-field>

                                        <div class="form-actions">
                                            <button type="button" mat-stroked-button (click)="resetProfileForm()" [disabled]="isUpdating()">
                                                Cancelar
                                            </button>
                                            <button type="submit" mat-raised-button color="primary"
                                                [disabled]="profileForm.invalid || !profileForm.dirty || isUpdating()">
                                                @if (isUpdating()) {
                                                    <mat-spinner diameter="20"></mat-spinner>
                                                    Guardando...
                                                } @else {
                                                    Guardar Cambios
                                                }
                                            </button>
                                        </div>
                                    </form>
                                </mat-card>
                            </mat-tab>

                            <!-- Password Tab -->
                            <mat-tab label="Cambiar Contraseña">
                                <mat-card class="form-card">
                                    @if (passwordSuccess()) {
                                        <div class="success-alert">
                                            <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                                            <span>Contraseña actualizada exitosamente</span>
                                        </div>
                                    }
                                    @if (passwordError()) {
                                        <div class="error-alert">
                                            <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                                            <span>{{ passwordError() }}</span>
                                        </div>
                                    }

                                    <form [formGroup]="passwordForm" (ngSubmit)="savePassword()">
                                        <mat-form-field appearance="outline">
                                            <mat-label>Contraseña Actual</mat-label>
                                            <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                                            <input matInput type="password" formControlName="current_password" required>
                                            @if (passwordForm.get('current_password')?.hasError('required') && passwordForm.get('current_password')?.touched) {
                                                <mat-error>La contraseña actual es requerida</mat-error>
                                            }
                                        </mat-form-field>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Nueva Contraseña</mat-label>
                                            <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                                            <input matInput type="password" formControlName="new_password" required>
                                            @if (passwordForm.get('new_password')?.hasError('required') && passwordForm.get('new_password')?.touched) {
                                                <mat-error>La nueva contraseña es requerida</mat-error>
                                            }
                                            @if (passwordForm.get('new_password')?.hasError('minlength')) {
                                                <mat-error>Mínimo 8 caracteres</mat-error>
                                            }
                                            <mat-hint>Mínimo 8 caracteres</mat-hint>
                                        </mat-form-field>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Confirmar Nueva Contraseña</mat-label>
                                            <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                                            <input matInput type="password" formControlName="confirm_password" required>
                                            @if (passwordForm.get('confirm_password')?.hasError('required') && passwordForm.get('confirm_password')?.touched) {
                                                <mat-error>Confirma tu contraseña</mat-error>
                                            }
                                            @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirm_password')?.touched) {
                                                <mat-error>Las contraseñas no coinciden</mat-error>
                                            }
                                        </mat-form-field>

                                        <div class="form-actions">
                                            <button type="button" mat-stroked-button (click)="resetPasswordForm()" [disabled]="isUpdatingPassword()">
                                                Cancelar
                                            </button>
                                            <button type="submit" mat-raised-button color="primary"
                                                [disabled]="passwordForm.invalid || isUpdatingPassword()">
                                                @if (isUpdatingPassword()) {
                                                    <mat-spinner diameter="20"></mat-spinner>
                                                    Actualizando...
                                                } @else {
                                                    Cambiar Contraseña
                                                }
                                            </button>
                                        </div>
                                    </form>
                                </mat-card>
                            </mat-tab>
                        </mat-tab-group>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .profile-container {
            max-width: 1100px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
        }

        .header-content {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-content h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .header-content p {
            color: #64748b;
            margin: 0;
            font-size: 14px;
        }

        .profile-grid {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 24px;
            align-items: start;
        }

        .info-card {
            padding: 32px 24px;
            text-align: center;
        }

        .user-avatar {
            width: 88px;
            height: 88px;
            border-radius: 50%;
            background: var(--mat-sys-primary, #3f51b5);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
        }

        .avatar-initials {
            font-size: 1.75rem;
            font-weight: 700;
            color: white;
            letter-spacing: 1px;
        }

        .info-card h2 {
            font-size: 1.15rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .user-email {
            color: #64748b;
            font-size: 13px;
            margin: 0 0 12px;
            word-break: break-all;
        }

        .user-role {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 14px;
            background: var(--mat-sys-primary-container, #e8eaf6);
            color: var(--mat-sys-primary, #3f51b5);
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .info-items {
            text-align: left;
        }

        .info-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            color: #64748b;
            font-size: 13px;
            border-bottom: 1px solid #f1f5f9;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .forms-container {
            display: flex;
            flex-direction: column;
        }

        .form-card {
            padding: 32px;
            margin-top: 16px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        mat-form-field {
            width: 100%;
        }

        .success-alert {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background: #d1fae5;
            color: #047857;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .error-alert {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background: #fee2e2;
            color: #dc2626;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            margin-top: 8px;
        }

        button[type="submit"] {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        @media (max-width: 960px) {
            .profile-grid {
                grid-template-columns: 1fr;
            }

            .form-row {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 600px) {
            .form-card {
                padding: 20px;
            }

            .form-actions {
                flex-direction: column-reverse;
            }

            .form-actions button {
                width: 100%;
            }
        }
    `]
})
export class AdminPerfilComponent implements OnInit {
    readonly User = User;
    readonly Mail = Mail;
    readonly Phone = Phone;
    readonly Lock = Lock;
    readonly CheckCircle2 = CheckCircle2;
    readonly AlertCircle = AlertCircle;
    readonly Shield = Shield;

    private fb = inject(FormBuilder);
    authService = inject(AuthService);

    updateSuccess = signal(false);
    updateError = signal<string | null>(null);
    isUpdating = signal(false);

    passwordSuccess = signal(false);
    passwordError = signal<string | null>(null);
    isUpdatingPassword = signal(false);

    profileForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['']
    });

    passwordForm = this.fb.group({
        current_password: ['', Validators.required],
        new_password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    ngOnInit(): void {
        const user = this.authService.currentUser();
        if (user) {
            this.profileForm.patchValue({
                name: user.name,
                email: user.email,
                phone: user.phoneNumber || ''
            });
        }
    }

    getInitials(name: string): string {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            admin: 'Administrador',
            manager: 'Gerente',
            owner: 'Propietario',
            tenant: 'Inquilino'
        };
        return labels[role] || role;
    }

    saveProfile(): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        this.isUpdating.set(true);
        this.updateSuccess.set(false);
        this.updateError.set(null);

        const user = this.authService.currentUser();
        if (!user) return;

        const { name, email, phone } = this.profileForm.value;
        this.authService.updateProfile(parseInt(user.id), { name: name!, email: email!, phone: phone || undefined }).subscribe({
            next: () => {
                this.isUpdating.set(false);
                this.updateSuccess.set(true);
                this.profileForm.markAsPristine();
                setTimeout(() => this.updateSuccess.set(false), 3000);
            },
            error: (err) => {
                this.isUpdating.set(false);
                this.updateError.set(err.message || 'Error al actualizar el perfil');
                setTimeout(() => this.updateError.set(null), 3000);
            }
        });
    }

    resetProfileForm(): void {
        const user = this.authService.currentUser();
        if (user) {
            this.profileForm.patchValue({ name: user.name, email: user.email, phone: user.phoneNumber || '' });
            this.profileForm.markAsPristine();
        }
        this.updateSuccess.set(false);
        this.updateError.set(null);
    }

    savePassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.isUpdatingPassword.set(true);
        this.passwordSuccess.set(false);
        this.passwordError.set(null);

        const user = this.authService.currentUser();
        if (!user) return;

        const newPassword = this.passwordForm.value.new_password!;
        this.authService.changePassword(parseInt(user.id), newPassword).subscribe({
            next: () => {
                this.isUpdatingPassword.set(false);
                this.passwordSuccess.set(true);
                this.passwordForm.reset();
                setTimeout(() => this.passwordSuccess.set(false), 3000);
            },
            error: (err) => {
                this.isUpdatingPassword.set(false);
                this.passwordError.set(err.message || 'Error al cambiar la contraseña');
                setTimeout(() => this.passwordError.set(null), 3000);
            }
        });
    }

    resetPasswordForm(): void {
        this.passwordForm.reset();
        this.passwordSuccess.set(false);
        this.passwordError.set(null);
    }
}
