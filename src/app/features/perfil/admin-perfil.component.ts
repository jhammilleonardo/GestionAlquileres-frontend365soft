import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AlertCircle, CheckCircle2, Mail, Shield, User, LucideAngularModule } from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { AuthService } from '../../core/services/auth.service';
import {
  AppButtonComponent,
  AppPageHeaderComponent,
  AppTabOption,
  AppTabsComponent,
  AppTextFieldComponent,
} from '../../shared/ui';

type ProfileTab = 'profile' | 'password';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const newPass = form.get('new_password')?.value;
  const confirmPass = form.get('confirm_password')?.value;
  return newPass && confirmPass && newPass !== confirmPass ? { passwordMismatch: true } : null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-perfil',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppPageHeaderComponent,
    AppTabsComponent,
    AppTextFieldComponent,
  ],
  template: `
    <div class="profile-container">
      <app-page-header
        [title]="'perfil.title' | transloco"
        [description]="'perfil.subtitle' | transloco"
      />

      @if (authService.currentUser(); as user) {
        <div class="profile-grid">
          <aside class="info-card" aria-label="Perfil del usuario">
            <div class="user-avatar">
              <span class="avatar-initials">{{ getInitials(user.name) }}</span>
            </div>
            <h2>{{ user.name }}</h2>
            <p class="user-email">{{ user.email }}</p>
            <div class="user-role">
              <lucide-icon [img]="Shield" [size]="14"></lucide-icon>
              {{ getRoleLabel(user.role) }}
            </div>

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
          </aside>

          <section class="forms-container">
            <app-tabs
              [(ngModel)]="selectedTab"
              [tabs]="tabs"
              [ariaLabel]="'perfil.title' | transloco"
            />

            @if (selectedTab === 'profile') {
              <article class="form-card">
                @if (updateSuccess()) {
                  <div class="success-alert">
                    <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                    <span>{{ 'perfil.profileSaved' | transloco }}</span>
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
                    <label class="field-group">
                      <app-text-field
                        formControlName="name"
                        [label]="'perfil.nameLabel' | transloco"
                        [placeholder]="'perfil.namePlaceholder' | transloco"
                      />
                      @if (
                        profileForm.get('name')?.hasError('required') &&
                        profileForm.get('name')?.touched
                      ) {
                        <span class="field-error">{{ 'perfil.required' | transloco }}</span>
                      }
                    </label>

                    <label class="field-group">
                      <app-text-field
                        formControlName="email"
                        type="email"
                        [label]="'perfil.emailLabel' | transloco"
                        placeholder="correo@ejemplo.com"
                      />
                      @if (
                        profileForm.get('email')?.hasError('required') &&
                        profileForm.get('email')?.touched
                      ) {
                        <span class="field-error">{{ 'perfil.required' | transloco }}</span>
                      }
                      @if (profileForm.get('email')?.hasError('email')) {
                        <span class="field-error">{{ 'auth.emailInvalid' | transloco }}</span>
                      }
                    </label>
                  </div>

                  <label class="field-group">
                    <app-text-field
                      formControlName="phone"
                      type="tel"
                      [label]="'perfil.phoneLabel' | transloco"
                      [placeholder]="'perfil.phonePlaceholder' | transloco"
                    />
                  </label>

                  <div class="form-actions">
                    <app-button
                      appearance="outline"
                      type="button"
                      [disabled]="isUpdating()"
                      (clicked)="resetProfileForm()"
                    >
                      {{ 'common.cancel' | transloco }}
                    </app-button>
                    <app-button
                      type="submit"
                      [disabled]="profileForm.invalid || !profileForm.dirty"
                      [loading]="isUpdating()"
                    >
                      {{ 'perfil.saveProfile' | transloco }}
                    </app-button>
                  </div>
                </form>
              </article>
            }

            @if (selectedTab === 'password') {
              <article class="form-card">
                @if (passwordSuccess()) {
                  <div class="success-alert">
                    <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                    <span>{{ 'perfil.passwordChanged' | transloco }}</span>
                  </div>
                }
                @if (passwordError()) {
                  <div class="error-alert">
                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                    <span>{{ passwordError() }}</span>
                  </div>
                }

                <form [formGroup]="passwordForm" (ngSubmit)="savePassword()">
                  <label class="field-group">
                    <app-text-field
                      formControlName="current_password"
                      type="password"
                      [label]="'perfil.currentPassword' | transloco"
                    />
                    @if (
                      passwordForm.get('current_password')?.hasError('required') &&
                      passwordForm.get('current_password')?.touched
                    ) {
                      <span class="field-error">{{ 'perfil.required' | transloco }}</span>
                    }
                  </label>

                  <label class="field-group">
                    <app-text-field
                      formControlName="new_password"
                      type="password"
                      [label]="'perfil.newPassword' | transloco"
                    />
                    @if (
                      passwordForm.get('new_password')?.hasError('required') &&
                      passwordForm.get('new_password')?.touched
                    ) {
                      <span class="field-error">{{ 'perfil.required' | transloco }}</span>
                    }
                    @if (passwordForm.get('new_password')?.hasError('minlength')) {
                      <span class="field-error">{{ 'perfil.minChars6' | transloco }}</span>
                    }
                    <span class="field-hint">{{ 'perfil.passwordHint' | transloco }}</span>
                  </label>

                  <label class="field-group">
                    <app-text-field
                      formControlName="confirm_password"
                      type="password"
                      [label]="'perfil.confirmNewPassword' | transloco"
                    />
                    @if (
                      passwordForm.get('confirm_password')?.hasError('required') &&
                      passwordForm.get('confirm_password')?.touched
                    ) {
                      <span class="field-error">{{ 'perfil.required' | transloco }}</span>
                    }
                    @if (
                      passwordForm.hasError('passwordMismatch') &&
                      passwordForm.get('confirm_password')?.touched
                    ) {
                      <span class="field-error">{{ 'perfil.passwordMismatch' | transloco }}</span>
                    }
                  </label>

                  <div class="form-actions">
                    <app-button
                      appearance="outline"
                      type="button"
                      [disabled]="isUpdatingPassword()"
                      (clicked)="resetPasswordForm()"
                    >
                      {{ 'common.cancel' | transloco }}
                    </app-button>
                    <app-button
                      type="submit"
                      [disabled]="passwordForm.invalid"
                      [loading]="isUpdatingPassword()"
                    >
                      {{ 'perfil.changePassword' | transloco }}
                    </app-button>
                  </div>
                </form>
              </article>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .profile-container {
        max-width: 1100px;
        margin: 0 auto;
      }

      .profile-grid {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }

      .info-card,
      .form-card {
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
        background: var(--app-color-surface);
        box-shadow: var(--app-shadow-sm);
      }

      .info-card {
        padding: 32px 24px;
        text-align: center;
      }

      .user-avatar {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        background: var(--app-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }

      .avatar-initials {
        font-size: 1.75rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: 0;
      }

      .info-card h2 {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--app-color-text);
        margin: 0 0 4px;
      }

      .user-email {
        color: var(--app-color-text-muted);
        font-size: 13px;
        margin: 0 0 12px;
        word-break: break-all;
      }

      .user-role {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 14px;
        background: var(--app-color-primary-soft);
        color: var(--app-color-primary);
        border-radius: 999px;
        font-size: 13px;
        font-weight: 750;
      }

      .info-items {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--app-color-border);
        text-align: left;
      }

      .info-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        color: var(--app-color-text-muted);
        font-size: 13px;
        border-bottom: 1px solid var(--app-color-border);
      }

      .info-row:last-child {
        border-bottom: none;
      }

      .forms-container {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 16px;
      }

      .form-card {
        padding: 32px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      form,
      .field-group {
        display: flex;
        flex-direction: column;
      }

      form {
        gap: 16px;
      }

      .field-group {
        gap: 6px;
      }

      .field-error {
        color: var(--app-color-danger);
        font-size: 0.78rem;
        font-weight: 650;
      }

      .field-hint {
        color: var(--app-color-text-muted);
        font-size: 0.78rem;
      }

      .success-alert,
      .error-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: var(--app-radius-md);
        margin-bottom: 20px;
        font-size: 14px;
      }

      .success-alert {
        background: var(--app-color-success-soft);
        color: var(--app-color-success);
      }

      .error-alert {
        background: var(--app-color-danger-soft);
        color: var(--app-color-danger);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--app-color-border);
        margin-top: 8px;
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
      }
    `,
  ],
})
export class AdminPerfilComponent {
  readonly User = User;
  readonly Mail = Mail;
  readonly Shield = Shield;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;

  readonly tabs: readonly AppTabOption<ProfileTab>[] = [
    { label: 'Datos personales', value: 'profile' },
    { label: 'Contraseña', value: 'password' },
  ];

  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);

  selectedTab: ProfileTab = 'profile';
  updateSuccess = signal(false);
  updateError = signal<string | null>(null);
  isUpdating = signal(false);

  passwordSuccess = signal(false);
  passwordError = signal<string | null>(null);
  isUpdatingPassword = signal(false);

  readonly profileForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  readonly passwordForm = this.fb.group(
    {
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  constructor() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phoneNumber || '',
      });
    }
  }

  getInitials(name: string): string {
    if (!name) {
      return '??';
    }

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const key = 'perfil.roles.' + role.toUpperCase();
    const translated = this.transloco.translate(key);
    return translated !== key ? translated : role;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    this.isUpdating.set(true);
    this.updateSuccess.set(false);
    this.updateError.set(null);

    const { name, email, phone } = this.profileForm.getRawValue();
    this.authService
      .updateProfile(Number(user.id), { name: name!, email: email!, phone: phone || undefined })
      .subscribe({
        next: () => {
          this.isUpdating.set(false);
          this.updateSuccess.set(true);
          this.profileForm.markAsPristine();
          setTimeout(() => this.updateSuccess.set(false), 3000);
        },
        error: (err: Error) => {
          this.isUpdating.set(false);
          this.updateError.set(err.message || this.transloco.translate('perfil.profileError'));
          setTimeout(() => this.updateError.set(null), 3000);
        },
      });
  }

  resetProfileForm(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phoneNumber || '',
      });
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

    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    this.isUpdatingPassword.set(true);
    this.passwordSuccess.set(false);
    this.passwordError.set(null);

    const newPassword = this.passwordForm.getRawValue().new_password!;
    this.authService.changePassword(Number(user.id), newPassword).subscribe({
      next: () => {
        this.isUpdatingPassword.set(false);
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess.set(false), 3000);
      },
      error: (err: Error) => {
        this.isUpdatingPassword.set(false);
        this.passwordError.set(err.message || this.transloco.translate('perfil.passwordError'));
        setTimeout(() => this.passwordError.set(null), 3000);
      },
    });
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordSuccess.set(false);
    this.passwordError.set(null);
  }
}
