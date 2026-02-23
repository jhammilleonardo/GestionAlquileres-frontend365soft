import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, User, Mail, Phone, Calendar, CreditCard, Heart, Users, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-step-1-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    LucideAngularModule
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <h2>Información Personal</h2>
        <p>Por favor, completa tus datos personales básicos</p>
      </div>

      <!-- User Account Notice -->
      <mat-card class="account-notice">
        <div class="notice-content">
          <lucide-icon [img]="User" [size]="20" class="notice-icon"></lucide-icon>
          <p class="notice-text">
            Los campos con <strong>icono de candado</strong> provienen de tu cuenta y no se pueden editar aquí.
            Para modificarlos, ve a tu perfil de usuario.
          </p>
        </div>
      </mat-card>

      <div class="form-grid">
        <!-- Nombre Completo (Read-only) -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field readonly-field">
            <mat-label>Nombre Completo</mat-label>
            <lucide-icon matPrefix [img]="User" [size]="20"></lucide-icon>
            <input
              matInput
              [formControl]="getControl('full_name')"
              placeholder="Juan Pérez García"
              readonly
              class="readonly-input">
            <mat-icon matSuffix class="lock-icon">lock</mat-icon>
            <mat-hint>Este dato viene de tu cuenta</mat-hint>
          </mat-form-field>
        </div>

        <!-- Email (Read-only) -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field readonly-field">
            <mat-label>Correo Electrónico</mat-label>
            <lucide-icon matPrefix [img]="Mail" [size]="20"></lucide-icon>
            <input
              matInput
              type="email"
              [formControl]="getControl('email')"
              placeholder="correo@ejemplo.com"
              readonly
              class="readonly-input">
            <mat-icon matSuffix class="lock-icon">lock</mat-icon>
            <mat-hint>Este dato viene de tu cuenta</mat-hint>
          </mat-form-field>
        </div>

        <!-- Teléfono (Read-only) -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field readonly-field">
            <mat-label>Teléfono</mat-label>
            <lucide-icon matPrefix [img]="Phone" [size]="20"></lucide-icon>
            <input
              matInput
              type="tel"
              [formControl]="getControl('phone')"
              placeholder="+1 234 567 8900"
              readonly
              class="readonly-input">
            <mat-icon matSuffix class="lock-icon">lock</mat-icon>
            <mat-hint>Este dato viene de tu cuenta</mat-hint>
          </mat-form-field>
        </div>

        <!-- Fecha de Nacimiento -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>Fecha de Nacimiento</mat-label>
            <lucide-icon matPrefix [img]="Calendar" [size]="20"></lucide-icon>
            <input
              matInput
              type="date"
              [formControl]="getControl('birth_date')"
              [max]="maxDateValue">
            @if (form.get('birth_date')?.hasError('required') && form.get('birth_date')?.touched) {
              <mat-error>La fecha de nacimiento es requerida</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Documento de Identidad -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>DNI / Pasaporte</mat-label>
            <lucide-icon matPrefix [img]="CreditCard" [size]="20"></lucide-icon>
            <input
              matInput
              [formControl]="getControl('national_id')"
              placeholder="12345678">
            @if (form.get('national_id')?.hasError('required') && form.get('national_id')?.touched) {
              <mat-error>El documento es requerido</mat-error>
            }
            @if (form.get('national_id')?.hasError('minlength') && form.get('national_id')?.touched) {
              <mat-error>Mínimo 8 caracteres</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Estado Civil -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>Estado Civil</mat-label>
            <lucide-icon matPrefix [img]="Heart" [size]="20"></lucide-icon>
            <mat-select [formControl]="getControl('marital_status')">
              <mat-option value="soltero">Soltero/a</mat-option>
              <mat-option value="casado">Casado/a</mat-option>
              <mat-option value="divorciado">Divorciado/a</mat-option>
              <mat-option value="viudo">Viudo/a</mat-option>
              <mat-option value="union_libre">Unión Libre</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Número de Dependientes -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>Número de Dependientes</mat-label>
            <lucide-icon matPrefix [img]="Users" [size]="20"></lucide-icon>
            <input
              matInput
              type="number"
              min="0"
              [formControl]="getControl('number_of_dependents')"
              placeholder="0">
            @if (form.get('number_of_dependents')?.hasError('required') && form.get('number_of_dependents')?.touched) {
              <mat-error>El número es requerido</mat-error>
            }
            @if (form.get('number_of_dependents')?.hasError('min') && form.get('number_of_dependents')?.touched) {
              <mat-error>No puede ser negativo</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Dirección Actual -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>Dirección Actual</mat-label>
            <lucide-icon matPrefix [img]="MapPin" [size]="20"></lucide-icon>
            <input
              matInput
              [formControl]="getControl('current_address')"
              placeholder="Calle, número, ciudad, país">
            <mat-hint>Opcional: Tu dirección de residencia actual</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Helper Text -->
      <div class="step-footer">
        <mat-card class="info-card">
          <p class="info-text">
            <strong>💡 Tip:</strong> Asegúrate de que toda la información sea correcta.
            Estos datos serán verificados durante el proceso de aprobación.
          </p>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .step-content {
      padding: 24px 0;
    }

    .step-header {
      margin-bottom: 32px;
      text-align: center;
    }

    .step-header h2 {
      margin: 0 0 8px;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .step-header p {
      margin: 0;
      font-size: 1rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .account-notice {
      background: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
      border: 1px solid color-mix(in srgb, var(--mat-sys-primary) 20%, transparent);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .notice-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .notice-icon {
      color: var(--mat-sys-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .notice-text {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--mat-sys-on-surface);
      line-height: 1.5;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .form-field {
      width: 100%;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .custom-field {
      width: 100%;
    }

    .custom-field ::ng-deep .mat-mdc-text-field-wrapper {
      padding: 0;
    }

    .custom-field ::ng-deep .mat-mdc-form-field-icon-prefix {
      margin-right: 8px;
      display: flex;
      align-items: center;
      color: var(--mat-sys-on-surface-variant);
    }

    .readonly-field {
      opacity: 0.8;
    }

    .readonly-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: var(--mat-sys-surface-container-low);
    }

    .readonly-input {
      color: var(--mat-sys-on-surface-variant) !important;
      cursor: not-allowed;
    }

    .lock-icon {
      color: var(--mat-sys-on-surface-variant);
      font-size: 18px;
      opacity: 0.6;
    }

    .step-footer {
      margin-top: 32px;
    }

    .info-card {
      background: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
      border: 1px solid color-mix(in srgb, var(--mat-sys-primary) 20%, transparent);
      padding: 16px;
      border-radius: 8px;
    }

    .info-text {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--mat-sys-on-surface);
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .step-content {
        padding: 16px 0;
      }
    }
  `]
})
export class Step1PersonalInfoComponent implements OnInit {
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Calendar = Calendar;
  readonly CreditCard = CreditCard;
  readonly Heart = Heart;
  readonly Users = Users;
  readonly MapPin = MapPin;

  formGroup = input.required<FormGroup>();
  isValid = output<boolean>();

  // Computed property para acceder al formGroup sin paréntesis en el template
  get form(): FormGroup {
    return this.formGroup();
  }

  // Helpers para obtener controles de forma segura
  getControl(path: string): FormControl {
    return this.form.get(path) as FormControl;
  }

  // Calculated property for max date (18 years ago)
  maxDateValue = '';

  constructor() {
    const today = new Date();
    const minAge = 18;
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    this.maxDateValue = maxDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Emit validation status on form changes
    this.form.valueChanges.subscribe(() => {
      this.isValid.emit(this.form.valid);
    });
  }
}
