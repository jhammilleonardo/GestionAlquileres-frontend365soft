import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import {
  LucideAngularModule,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Home,
  FileText,
  Calendar,
} from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';

@Component({
  selector: 'app-tenant-profile',
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
    LucideAngularModule,
  ],
  template: `
    <div class="profile-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <lucide-icon [img]="User" [size]="32"></lucide-icon>
          <div>
            <h1>Mi Perfil</h1>
            <p>Gestiona tu información personal</p>
          </div>
        </div>
      </div>

      <!-- Profile Card -->
      @if (authService.currentUser(); as user) {
        <div class="profile-grid">
          <!-- User Info Card -->
          <mat-card class="info-card">
            <div class="user-avatar">
              <lucide-icon [img]="User" [size]="48"></lucide-icon>
            </div>
            <h2>{{ user.name }}</h2>
            <p class="user-email">{{ user.email }}</p>
            <div class="user-role">Inquilino</div>

            @if (user.contract) {
              <mat-divider style="margin: 16px 0;"></mat-divider>
              <div class="contract-info">
                <h3>Información del Contrato</h3>
                <div class="info-item">
                  <lucide-icon [img]="Home" [size]="16"></lucide-icon>
                  <span>{{ user.contract.property_title }}</span>
                </div>
                <div class="info-item">
                  <lucide-icon [img]="FileText" [size]="16"></lucide-icon>
                  <span>{{ user.contract.contract_number }}</span>
                </div>
                <div class="status-badge" [class]="'status-' + user.contract.status.toLowerCase()">
                  {{ user.contract.status }}
                </div>
              </div>
            }
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

                  <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                    <mat-form-field appearance="outline">
                      <mat-label>Nombre Completo</mat-label>
                      <lucide-icon matIconPrefix [img]="User" [size]="20"></lucide-icon>
                      <input matInput formControlName="name" placeholder="Juan Pérez" required />
                      @if (
                        profileForm.get('name')?.hasError('required') &&
                        profileForm.get('name')?.touched
                      ) {
                        <mat-error>El nombre es requerido</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <lucide-icon matIconPrefix [img]="Mail" [size]="20"></lucide-icon>
                      <input
                        matInput
                        type="email"
                        formControlName="email"
                        placeholder="correo@ejemplo.com"
                        required
                      />
                      @if (
                        profileForm.get('email')?.hasError('required') &&
                        profileForm.get('email')?.touched
                      ) {
                        <mat-error>El email es requerido</mat-error>
                      }
                      @if (profileForm.get('email')?.hasError('email')) {
                        <mat-error>Email inválido</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Teléfono</mat-label>
                      <lucide-icon matIconPrefix [img]="Phone" [size]="20"></lucide-icon>
                      <input
                        matInput
                        type="tel"
                        formControlName="phone"
                        placeholder="+1 234 567 8900"
                      />
                    </mat-form-field>

                    <div class="form-actions">
                      <button
                        type="button"
                        mat-stroked-button
                        (click)="resetProfileForm()"
                        [disabled]="isUpdating()"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        mat-raised-button
                        color="primary"
                        [disabled]="profileForm.invalid || !profileForm.dirty || isUpdating()"
                      >
                        @if (isUpdating()) {
                          <mat-spinner diameter="20"></mat-spinner>
                          Actualizando...
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

                  <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
                    <mat-form-field appearance="outline">
                      <mat-label>Contraseña Actual</mat-label>
                      <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                      <input matInput type="password" formControlName="current_password" required />
                      @if (
                        passwordForm.get('current_password')?.hasError('required') &&
                        passwordForm.get('current_password')?.touched
                      ) {
                        <mat-error>La contraseña actual es requerida</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Nueva Contraseña</mat-label>
                      <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                      <input matInput type="password" formControlName="new_password" required />
                      @if (
                        passwordForm.get('new_password')?.hasError('required') &&
                        passwordForm.get('new_password')?.touched
                      ) {
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
                      <input matInput type="password" formControlName="confirm_password" required />
                      @if (
                        passwordForm.get('confirm_password')?.hasError('required') &&
                        passwordForm.get('confirm_password')?.touched
                      ) {
                        <mat-error>Confirma tu contraseña</mat-error>
                      }
                      @if (
                        passwordForm.hasError('passwordMismatch') &&
                        passwordForm.get('confirm_password')?.touched
                      ) {
                        <mat-error>Las contraseñas no coinciden</mat-error>
                      }
                    </mat-form-field>

                    <div class="form-actions">
                      <button
                        type="button"
                        mat-stroked-button
                        (click)="resetPasswordForm()"
                        [disabled]="isUpdatingPassword()"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        mat-raised-button
                        color="primary"
                        [disabled]="passwordForm.invalid || isUpdatingPassword()"
                      >
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
  styles: [
    `
      .profile-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
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
      }

      .profile-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 24px;
      }

      .info-card {
        padding: 32px;
        text-align: center;
        height: fit-content;
      }

      .user-avatar {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: var(--mat-sys-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin: 0 auto 16px;
      }

      .info-card h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }

      .user-email {
        color: #64748b;
        margin: 0 0 12px;
      }

      .user-role {
        display: inline-block;
        padding: 4px 16px;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
      }

      .contract-info {
        text-align: left;
      }

      .contract-info h3 {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        color: #64748b;
        font-size: 14px;
      }

      .status-badge {
        margin-top: 12px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
      }

      .status-badge.status-active {
        background: #d1fae5;
        color: #047857;
      }
      .status-badge.status-pending {
        background: #fef3c7;
        color: #b45309;
      }

      .forms-container {
        display: flex;
        flex-direction: column;
      }

      .form-card {
        padding: 32px;
        margin-top: 16px;
      }

      .success-alert {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #d1fae5;
        color: #047857;
        border-radius: 6px;
        margin-bottom: 24px;
        font-size: 14px;
      }

      .error-alert {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 6px;
        margin-bottom: 24px;
        font-size: 14px;
      }

      .form-card form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
        margin-top: 8px;
      }

      button[type='submit'] {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      @media (max-width: 1024px) {
        .profile-grid {
          grid-template-columns: 1fr;
        }

        .info-card {
          margin-bottom: 16px;
        }
      }

      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-content h1 {
          font-size: 1.35rem;
        }

        .form-card {
          padding: 24px;
        }
      }

      @media (max-width: 600px) {
        .info-card {
          padding: 24px;
        }

        .user-avatar {
          width: 80px;
          height: 80px;
        }

        .info-card h2 {
          font-size: 1.1rem;
        }

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

      @media (max-width: 420px) {
        .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .header-content lucide-icon {
          display: none;
        }

        .info-card {
          padding: 20px;
        }

        .user-avatar {
          width: 72px;
          height: 72px;
        }

        .contract-info h3 {
          font-size: 13px;
        }

        .info-item {
          font-size: 13px;
        }
      }
    `,
  ],
})
export class TenantProfileComponent implements OnInit {
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Lock = Lock;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly Home = Home;
  readonly FileText = FileText;
  readonly Calendar = Calendar;

  private fb = inject(FormBuilder);
  authService = inject(TenantAuthService);

  updateSuccess = signal(false);
  updateError = signal<string | null>(null);
  isUpdating = signal(false);

  passwordSuccess = signal(false);
  passwordError = signal<string | null>(null);
  isUpdatingPassword = signal(false);

  profileForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  passwordForm = this.fb.group(
    {
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    },
    {
      validators: this.passwordMatchValidator.bind(this),
    },
  );

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }

  passwordMatchValidator(form: any) {
    const newPassword = form.get('new_password')?.value;
    const confirmPassword = form.get('confirm_password')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isUpdating.set(true);
    this.updateSuccess.set(false);
    this.updateError.set(null);

    // Simulación - reemplazar con llamada real al API
    setTimeout(() => {
      this.isUpdating.set(false);
      this.updateSuccess.set(true);
      this.profileForm.markAsPristine();

      setTimeout(() => {
        this.updateSuccess.set(false);
      }, 3000);
    }, 1000);
  }

  resetProfileForm(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
      this.profileForm.markAsPristine();
    }
    this.updateSuccess.set(false);
    this.updateError.set(null);
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isUpdatingPassword.set(true);
    this.passwordSuccess.set(false);
    this.passwordError.set(null);

    // Simulación - reemplazar con llamada real al API
    setTimeout(() => {
      this.isUpdatingPassword.set(false);
      this.passwordSuccess.set(true);
      this.passwordForm.reset();

      setTimeout(() => {
        this.passwordSuccess.set(false);
      }, 3000);
    }, 1000);
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordSuccess.set(false);
    this.passwordError.set(null);
  }
}
