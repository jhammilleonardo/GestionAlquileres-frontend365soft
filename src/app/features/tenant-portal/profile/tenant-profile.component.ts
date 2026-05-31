import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { AlertCircle, CheckCircle2, FileText, Home, User } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import {
  AppButtonComponent,
  AppPageHeaderComponent,
  AppStatusBadgeComponent,
  AppTabsComponent,
  AppTabOption,
  AppTextFieldComponent,
} from '../../../shared/ui';

type TenantProfileTab = 'personal' | 'password';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('new_password')?.value as string | undefined;
  const confirmPassword = control.get('confirm_password')?.value as string | undefined;

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-profile',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
    AppTabsComponent,
    AppTextFieldComponent,
  ],
  template: `
    <section class="profile-page">
      <app-page-header
        [eyebrow]="'public.tenantProfile.role' | transloco"
        [title]="'public.tenantProfile.title' | transloco"
        [description]="'public.tenantProfile.subtitle' | transloco"
      />

      @if (authService.currentUser(); as user) {
        <div class="profile-grid">
          <aside class="profile-card">
            <div class="user-avatar">
              <lucide-icon [img]="User" [size]="46"></lucide-icon>
            </div>

            <h2>{{ user.name }}</h2>
            <p>{{ user.email }}</p>
            <app-status-badge [label]="'public.tenantProfile.role' | transloco" tone="info" />

            @if (user.contract) {
              <section class="contract-summary">
                <h3>{{ 'public.tenantProfile.contractInfo' | transloco }}</h3>
                <div class="summary-row">
                  <lucide-icon [img]="Home" [size]="16"></lucide-icon>
                  <span>{{ user.contract.property_title }}</span>
                </div>
                <div class="summary-row">
                  <lucide-icon [img]="FileText" [size]="16"></lucide-icon>
                  <span>{{ user.contract.contract_number }}</span>
                </div>
                <app-status-badge
                  [label]="user.contract.status"
                  [tone]="contractTone(user.contract.status)"
                />
              </section>
            }
          </aside>

          <section class="profile-forms">
            <app-tabs
              [(ngModel)]="activeTab"
              [tabs]="tabs"
              [ariaLabel]="'public.tenantProfile.title' | transloco"
            />

            @if (activeTab === 'personal') {
              <article class="form-panel">
                @if (updateSuccess()) {
                  <div class="alert alert--success">
                    <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                    <span>{{ 'public.tenantProfile.profileUpdated' | transloco }}</span>
                  </div>
                }

                @if (updateError()) {
                  <div class="alert alert--error">
                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                    <span>{{ updateError() }}</span>
                  </div>
                }

                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                  <app-text-field
                    formControlName="name"
                    [label]="'public.tenantProfile.fullName' | transloco"
                    placeholder="Juan Perez"
                    autocomplete="name"
                  />
                  @if (
                    profileForm.controls.name.hasError('required') &&
                    profileForm.controls.name.touched
                  ) {
                    <p class="field-error">{{ 'public.tenantProfile.nameRequired' | transloco }}</p>
                  }

                  <app-text-field
                    formControlName="email"
                    type="email"
                    [label]="'public.tenantProfile.email' | transloco"
                    placeholder="correo@ejemplo.com"
                    autocomplete="email"
                  />
                  @if (
                    profileForm.controls.email.hasError('required') &&
                    profileForm.controls.email.touched
                  ) {
                    <p class="field-error">
                      {{ 'public.tenantProfile.emailRequired' | transloco }}
                    </p>
                  }
                  @if (
                    profileForm.controls.email.hasError('email') &&
                    profileForm.controls.email.touched
                  ) {
                    <p class="field-error">{{ 'public.tenantProfile.emailInvalid' | transloco }}</p>
                  }

                  <app-text-field
                    formControlName="phone"
                    type="tel"
                    [label]="'public.tenantProfile.phone' | transloco"
                    placeholder="+591 70000000"
                    autocomplete="tel"
                  />

                  <footer class="form-actions">
                    <app-button
                      type="button"
                      appearance="outline"
                      [disabled]="isUpdating()"
                      (clicked)="resetProfileForm()"
                    >
                      {{ 'public.tenantProfile.cancel' | transloco }}
                    </app-button>
                    <app-button
                      type="submit"
                      appearance="primary"
                      [disabled]="profileForm.invalid || !profileForm.dirty || isUpdating()"
                      [loading]="isUpdating()"
                    >
                      {{
                        isUpdating()
                          ? ('public.tenantProfile.updating' | transloco)
                          : ('public.tenantProfile.saveChanges' | transloco)
                      }}
                    </app-button>
                  </footer>
                </form>
              </article>
            } @else {
              <article class="form-panel">
                @if (passwordSuccess()) {
                  <div class="alert alert--success">
                    <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                    <span>{{ 'public.tenantProfile.passwordUpdated' | transloco }}</span>
                  </div>
                }

                @if (passwordError()) {
                  <div class="alert alert--error">
                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                    <span>{{ passwordError() }}</span>
                  </div>
                }

                <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
                  <app-text-field
                    formControlName="current_password"
                    type="password"
                    [label]="'public.tenantProfile.currentPassword' | transloco"
                    autocomplete="current-password"
                  />
                  @if (
                    passwordForm.controls.current_password.hasError('required') &&
                    passwordForm.controls.current_password.touched
                  ) {
                    <p class="field-error">
                      {{ 'public.tenantProfile.currentPasswordRequired' | transloco }}
                    </p>
                  }

                  <app-text-field
                    formControlName="new_password"
                    type="password"
                    [label]="'public.tenantProfile.newPassword' | transloco"
                    autocomplete="new-password"
                  />
                  @if (
                    passwordForm.controls.new_password.hasError('required') &&
                    passwordForm.controls.new_password.touched
                  ) {
                    <p class="field-error">
                      {{ 'public.tenantProfile.newPasswordRequired' | transloco }}
                    </p>
                  }
                  @if (
                    passwordForm.controls.new_password.hasError('minlength') &&
                    passwordForm.controls.new_password.touched
                  ) {
                    <p class="field-error">{{ 'public.tenantProfile.min8Chars' | transloco }}</p>
                  }

                  <app-text-field
                    formControlName="confirm_password"
                    type="password"
                    [label]="'public.tenantProfile.confirmNewPassword' | transloco"
                    autocomplete="new-password"
                  />
                  @if (
                    passwordForm.controls.confirm_password.hasError('required') &&
                    passwordForm.controls.confirm_password.touched
                  ) {
                    <p class="field-error">
                      {{ 'public.tenantProfile.confirmRequired' | transloco }}
                    </p>
                  }
                  @if (
                    passwordForm.hasError('passwordMismatch') &&
                    passwordForm.controls.confirm_password.touched
                  ) {
                    <p class="field-error">
                      {{ 'public.tenantProfile.passwordsMismatch' | transloco }}
                    </p>
                  }

                  <p class="field-hint">{{ 'public.tenantProfile.min8Chars' | transloco }}</p>

                  <footer class="form-actions">
                    <app-button
                      type="button"
                      appearance="outline"
                      [disabled]="isUpdatingPassword()"
                      (clicked)="resetPasswordForm()"
                    >
                      {{ 'public.tenantProfile.cancel' | transloco }}
                    </app-button>
                    <app-button
                      type="submit"
                      appearance="primary"
                      [disabled]="passwordForm.invalid || isUpdatingPassword()"
                      [loading]="isUpdatingPassword()"
                    >
                      {{
                        isUpdatingPassword()
                          ? ('public.tenantProfile.updating' | transloco)
                          : ('public.tenantProfile.changePasswordBtn' | transloco)
                      }}
                    </app-button>
                  </footer>
                </form>
              </article>
            }
          </section>
        </div>
      }
    </section>
  `,
  styles: `
    .profile-page {
      max-inline-size: 1160px;
      margin-inline: auto;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: var(--app-space-5);
      align-items: start;
    }

    .profile-card,
    .form-panel {
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
    }

    .profile-card {
      display: grid;
      justify-items: center;
      padding: var(--app-space-6);
      text-align: center;
    }

    .user-avatar {
      display: inline-grid;
      place-items: center;
      inline-size: 6rem;
      block-size: 6rem;
      border-radius: 50%;
      background: var(--app-color-primary);
      color: #fff;
      margin-block-end: var(--app-space-4);
    }

    .profile-card h2 {
      margin: 0;
      color: var(--app-color-text);
      font-size: 1.25rem;
      font-weight: 820;
      line-height: 1.25;
    }

    .profile-card p {
      margin: 0.25rem 0 var(--app-space-3);
      color: var(--app-color-text-muted);
      overflow-wrap: anywhere;
    }

    .contract-summary {
      display: grid;
      justify-items: start;
      inline-size: 100%;
      gap: var(--app-space-2);
      margin-block-start: var(--app-space-5);
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-4);
      text-align: start;
    }

    .contract-summary h3 {
      margin: 0 0 var(--app-space-1);
      color: var(--app-color-text);
      font-size: 0.82rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .summary-row {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      color: var(--app-color-text-muted);
      font-size: 0.88rem;
      line-height: 1.4;
    }

    .profile-forms {
      display: grid;
      gap: var(--app-space-4);
      min-inline-size: 0;
    }

    .form-panel {
      padding: var(--app-space-6);
    }

    form {
      display: grid;
      gap: var(--app-space-3);
    }

    .alert {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      border-radius: var(--app-radius-md);
      margin-block-end: var(--app-space-4);
      padding: var(--app-space-3);
      font-size: 0.9rem;
      font-weight: 700;
    }

    .alert--success {
      background: var(--tui-status-positive-pale);
      color: var(--tui-status-positive);
    }

    .alert--error {
      background: var(--tui-status-negative-pale);
      color: var(--tui-status-negative);
    }

    .field-error,
    .field-hint {
      margin: -0.35rem 0 0;
      font-size: 0.78rem;
    }

    .field-error {
      color: var(--tui-status-negative);
      font-weight: 700;
    }

    .field-hint {
      color: var(--app-color-text-muted);
    }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--app-space-2);
      border-top: 1px solid var(--app-color-border);
      margin-block-start: var(--app-space-2);
      padding-block-start: var(--app-space-4);
    }

    @media (max-width: 980px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .profile-card,
      .form-panel {
        padding: var(--app-space-4);
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions app-button {
        inline-size: 100%;
      }
    }
  `,
})
export class TenantProfileComponent {
  protected readonly User = User;
  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly AlertCircle = AlertCircle;
  protected readonly Home = Home;
  protected readonly FileText = FileText;

  protected readonly tabs: readonly AppTabOption<TenantProfileTab>[] = [
    {
      label: 'Informacion personal',
      value: 'personal',
    },
    {
      label: 'Contrasena',
      value: 'password',
    },
  ];

  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(TenantAuthService);

  protected activeTab: TenantProfileTab = 'personal';
  protected readonly updateSuccess = signal(false);
  protected readonly updateError = signal<string | null>(null);
  protected readonly isUpdating = signal(false);
  protected readonly passwordSuccess = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly isUpdatingPassword = signal(false);

  protected readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    },
    {
      validators: passwordMatchValidator,
    },
  );

  constructor() {
    this.resetProfileForm();
  }

  protected contractTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
    const normalized = status.toUpperCase();
    if (normalized === 'ACTIVE' || normalized === 'ACTIVO' || normalized === 'FIRMADO') {
      return 'success';
    }
    if (normalized === 'PENDING' || normalized === 'PENDIENTE' || normalized === 'BORRADOR') {
      return 'warning';
    }
    if (normalized === 'VENCIDO' || normalized === 'CANCELADO') {
      return 'danger';
    }
    return 'info';
  }

  protected updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isUpdating.set(true);
    this.updateSuccess.set(false);
    this.updateError.set(null);

    window.setTimeout(() => {
      this.isUpdating.set(false);
      this.updateSuccess.set(true);
      this.profileForm.markAsPristine();

      window.setTimeout(() => this.updateSuccess.set(false), 3000);
    }, 1000);
  }

  protected resetProfileForm(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
      this.profileForm.markAsPristine();
    }
    this.updateSuccess.set(false);
    this.updateError.set(null);
  }

  protected updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isUpdatingPassword.set(true);
    this.passwordSuccess.set(false);
    this.passwordError.set(null);

    window.setTimeout(() => {
      this.isUpdatingPassword.set(false);
      this.passwordSuccess.set(true);
      this.passwordForm.reset();

      window.setTimeout(() => this.passwordSuccess.set(false), 3000);
    }, 1000);
  }

  protected resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordSuccess.set(false);
    this.passwordError.set(null);
  }
}
