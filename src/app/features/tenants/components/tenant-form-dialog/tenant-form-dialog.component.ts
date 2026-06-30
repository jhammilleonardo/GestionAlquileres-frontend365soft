import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AdminTenantUser, UpdateTenantUserDto } from '../../../../core/models/tenant-user.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

/**
 * Diálogo para editar los datos de contacto de un inquilino. Autocontenido:
 * mantiene su propio formulario y lo precarga cuando cambia el inquilino.
 */
@Component({
  selector: 'app-tenant-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AppTextFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog
      [open]="open()"
      [title]="'tenants.detail.editTitle' | transloco"
      [showFooter]="false"
      (closed)="closed.emit()"
    >
      <form [formGroup]="form" class="tenant-form" (ngSubmit)="submit()">
        <app-text-field
          formControlName="name"
          [label]="'tenants.form.name' | transloco"
          [placeholder]="'tenants.form.namePlaceholder' | transloco"
        />
        <app-text-field
          formControlName="email"
          [label]="'tenants.form.email' | transloco"
          type="email"
        />
        <app-text-field
          formControlName="phone"
          [label]="'tenants.form.phone' | transloco"
          type="tel"
        />
      </form>

      <div dialog-actions>
        <app-button appearance="secondary" (clicked)="closed.emit()">
          {{ 'common.cancel' | transloco }}
        </app-button>
        <app-button [disabled]="saving() || form.invalid" (clicked)="submit()">
          {{ 'common.save' | transloco }}
        </app-button>
      </div>
    </app-dialog>
  `,
  styles: `
    .tenant-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `,
})
export class TenantFormDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input(false);
  readonly tenant = input<AdminTenantUser | null>(null);
  readonly saving = input(false);

  readonly closed = output<void>();
  readonly saved = output<UpdateTenantUserDto>();

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  constructor() {
    effect(() => {
      const tenant = this.tenant();
      if (this.open() && tenant) {
        this.form.reset({
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone ?? '',
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.saved.emit({
      name: raw.name ?? undefined,
      email: raw.email ?? undefined,
      phone: raw.phone ?? undefined,
    });
  }
}
