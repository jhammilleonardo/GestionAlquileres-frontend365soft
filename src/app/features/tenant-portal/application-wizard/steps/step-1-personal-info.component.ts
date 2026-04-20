import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import {
  LucideAngularModule,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Heart,
  Users,
  MapPin,
  ArrowRight,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <div class="step-content">
      <div class="step-header">
        <h2>{{ 'rentalApp.step1Title' | transloco }}</h2>
        <p>{{ 'rentalApp.step1Subtitle' | transloco }}</p>
      </div>

      <!-- User Account Notice -->
      <mat-card class="account-notice">
        <div class="notice-content">
          <lucide-icon [img]="User" [size]="20" class="notice-icon"></lucide-icon>
          <p class="notice-text">{{ 'rentalApp.accountNotice' | transloco }}</p>
        </div>
      </mat-card>

      <div class="form-grid">
        <!-- Nombre Completo (Read-only) -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field readonly-field">
            <mat-label>{{ 'rentalApp.fullName' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="User" [size]="20"></lucide-icon>
            <input
              matInput
              [formControl]="getControl('full_name')"
              placeholder="Juan Pérez García"
              readonly
              class="readonly-input"
            />
            <mat-icon matSuffix class="lock-icon">lock</mat-icon>
            <mat-hint>{{ 'rentalApp.accountHint' | transloco }}</mat-hint>
          </mat-form-field>
        </div>

        <!-- Email (Read-only) -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field readonly-field">
            <mat-label>{{ 'rentalApp.emailLabel' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="Mail" [size]="20"></lucide-icon>
            <input
              matInput
              type="email"
              [formControl]="getControl('email')"
              placeholder="correo@ejemplo.com"
              readonly
              class="readonly-input"
            />
            <mat-icon matSuffix class="lock-icon">lock</mat-icon>
            <mat-hint>{{ 'rentalApp.accountHint' | transloco }}</mat-hint>
          </mat-form-field>
        </div>

        <!-- Teléfono (Read-only) -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field readonly-field">
            <mat-label>{{ 'rentalApp.phone' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="Phone" [size]="20"></lucide-icon>
            <input
              matInput
              type="tel"
              [formControl]="getControl('phone')"
              placeholder="+1 234 567 8900"
              readonly
              class="readonly-input"
            />
            <mat-icon matSuffix class="lock-icon">lock</mat-icon>
            <mat-hint>{{ 'rentalApp.accountHint' | transloco }}</mat-hint>
          </mat-form-field>
        </div>

        <!-- Fecha de Nacimiento -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>{{ 'rentalApp.birthDate' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="Calendar" [size]="20"></lucide-icon>
            <input
              matInput
              [matDatepicker]="birthDatePicker"
              [formControl]="getControl('birth_date')"
              [max]="maxDate"
              placeholder="DD/MM/YYYY"
            />
            <mat-datepicker-toggle matSuffix [for]="birthDatePicker"></mat-datepicker-toggle>
            <mat-datepicker
              #birthDatePicker
              startView="multi-year"
              [startAt]="startAtDate"
            ></mat-datepicker>
            @if (form.get('birth_date')?.hasError('required') && form.get('birth_date')?.touched) {
              <mat-error>{{ 'rentalApp.birthDateRequired' | transloco }}</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Documento de Identidad -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>{{ 'rentalApp.nationalId' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="CreditCard" [size]="20"></lucide-icon>
            <input matInput [formControl]="getControl('national_id')" placeholder="12345678" />
            @if (
              form.get('national_id')?.hasError('required') && form.get('national_id')?.touched
            ) {
              <mat-error>{{ 'rentalApp.nationalIdRequired' | transloco }}</mat-error>
            }
            @if (
              form.get('national_id')?.hasError('minlength') && form.get('national_id')?.touched
            ) {
              <mat-error>{{ 'rentalApp.nationalIdMinLength' | transloco }}</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Estado Civil -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>{{ 'rentalApp.maritalStatusLabel' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="Heart" [size]="20"></lucide-icon>
            <mat-select [formControl]="getControl('marital_status')">
              <mat-option value="soltero">{{
                'rentalApp.maritalStatus.soltero' | transloco
              }}</mat-option>
              <mat-option value="casado">{{
                'rentalApp.maritalStatus.casado' | transloco
              }}</mat-option>
              <mat-option value="divorciado">{{
                'rentalApp.maritalStatus.divorciado' | transloco
              }}</mat-option>
              <mat-option value="viudo">{{
                'rentalApp.maritalStatus.viudo' | transloco
              }}</mat-option>
              <mat-option value="union_libre">{{
                'rentalApp.maritalStatus.union_libre' | transloco
              }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Número de Dependientes -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>{{ 'rentalApp.dependents' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="Users" [size]="20"></lucide-icon>
            <input
              matInput
              type="number"
              min="0"
              [formControl]="getControl('number_of_dependents')"
              placeholder="0"
            />
            @if (
              form.get('number_of_dependents')?.hasError('required') &&
              form.get('number_of_dependents')?.touched
            ) {
              <mat-error>{{ 'rentalApp.dependentsRequired' | transloco }}</mat-error>
            }
            @if (
              form.get('number_of_dependents')?.hasError('min') &&
              form.get('number_of_dependents')?.touched
            ) {
              <mat-error>{{ 'rentalApp.dependentsMin' | transloco }}</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Dirección Actual -->
        <div class="form-field full-width">
          <mat-form-field appearance="outline" class="custom-field">
            <mat-label>{{ 'rentalApp.address' | transloco }}</mat-label>
            <lucide-icon matPrefix [img]="MapPin" [size]="20"></lucide-icon>
            <input
              matInput
              [formControl]="getControl('current_address')"
              placeholder="Calle, número, ciudad, país"
            />
            <mat-hint>{{ 'rentalApp.addressHint' | transloco }}</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Helper Text -->
      <div class="step-footer">
        <mat-card class="info-card">
          <p class="info-text"><strong>💡 Tip:</strong> {{ 'rentalApp.tipText' | transloco }}</p>
        </mat-card>
      </div>

      <!-- Navigation -->
      <div class="step-nav">
        <span></span>
        <button
          mat-raised-button
          color="primary"
          matStepperNext
          class="nav-btn"
          [disabled]="form.invalid"
        >
          <span>{{ 'rentalApp.next' | transloco }}</span>
          <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
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

      .step-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }

      .nav-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 44px;
        padding: 0 24px;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 8px;
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
    `,
  ],
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
  readonly ArrowRight = ArrowRight;

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

  // Max selectable date: must be at least 18 years old
  maxDate: Date;
  // Picker opens around the year 1990 — a sensible default for adults
  startAtDate: Date;

  constructor() {
    const today = new Date();
    this.maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    this.startAtDate = new Date(1990, 0, 1);
  }

  ngOnInit(): void {
    // Emit validation status on form changes
    this.form.valueChanges.subscribe(() => {
      this.isValid.emit(this.form.valid);
    });
  }
}
