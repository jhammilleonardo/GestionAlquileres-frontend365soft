import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import {
  LucideAngularModule,
  Building2,
  Globe,
  CreditCard,
  Home,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Percent,
  Clock,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  TenantConfigService,
  TenantConfig,
  UpdateTenantConfigDto,
} from '../../../core/services/admin/tenant-config.service';
import { SlugService } from '../../../core/services/slug.service';

interface PaymentOption {
  value: string;
  label: string;
  countries: string[];
}

const ALL_PAYMENT_OPTIONS: PaymentOption[] = [
  { value: 'qr_accl', label: 'QR Pago (ACCL)', countries: ['BO'] },
  { value: 'transferencia', label: 'Transferencia bancaria', countries: ['BO', 'GT', 'HN'] },
  { value: 'stripe', label: 'Stripe', countries: ['US', 'GT'] },
  { value: 'paypal', label: 'PayPal', countries: ['US'] },
  { value: 'ach', label: 'ACH', countries: ['US'] },
  { value: 'payu', label: 'PayU', countries: ['GT', 'HN'] },
  { value: 'tarjeta', label: 'Tarjeta de crédito', countries: ['GT', 'HN'] },
];

@Component({
  selector: 'app-wizard-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope({ scope: 'configuracion', alias: 'config' })],
  template: `
    <div class="wizard-page">
      <!-- Header -->
      <div class="wizard-header">
        <div class="wizard-logo">
          <lucide-icon [img]="Building2" [size]="28"></lucide-icon>
          <span>365Soft</span>
        </div>
        <p class="wizard-subtitle">{{ 'wizard.subtitle' | transloco }}</p>
      </div>

      <div class="wizard-container">
        @if (loadError()) {
          <div class="error-banner">
            <lucide-icon [img]="CheckCircle2" [size]="18"></lucide-icon>
            <span>{{ loadError() }}</span>
          </div>
        }

        <mat-stepper [linear]="true" #stepper class="wizard-stepper" labelPosition="bottom">
          <!-- ─── Paso 1: País y zona horaria ─── -->
          <mat-step [stepControl]="countryStep" [label]="'wizard.step1Label' | transloco">
            <form [formGroup]="countryStep" class="step-body">
              <div class="step-icon"><lucide-icon [img]="Globe" [size]="36"></lucide-icon></div>
              <h2 class="step-title">{{ 'wizard.step1Title' | transloco }}</h2>
              <p class="step-desc">{{ 'wizard.step1Desc' | transloco }}</p>

              <mat-form-field appearance="outline" class="full-field">
                <mat-label>{{ 'wizard.step1Label' | transloco }}</mat-label>
                <mat-select
                  formControlName="country"
                  (selectionChange)="onCountryChange($event.value)"
                >
                  @for (c of countries; track c.value) {
                    <mat-option [value]="c.value">{{ c.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-field">
                <mat-label>{{ 'wizard.timezone' | transloco }}</mat-label>
                <mat-select formControlName="timezone">
                  @for (tz of timezones; track tz.value) {
                    <mat-option [value]="tz.value">{{ tz.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="step-actions">
                <span></span>
                <button
                  mat-raised-button
                  color="primary"
                  matStepperNext
                  [disabled]="countryStep.invalid"
                  class="btn-next"
                >
                  {{ 'wizard.next' | transloco }}
                  <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- ─── Paso 2: Pagos ─── -->
          <mat-step [stepControl]="paymentsStep" [label]="'wizard.step2Label' | transloco">
            <form [formGroup]="paymentsStep" class="step-body">
              <div class="step-icon">
                <lucide-icon [img]="CreditCard" [size]="36"></lucide-icon>
              </div>
              <h2 class="step-title">{{ 'wizard.step2Title' | transloco }}</h2>
              <p class="step-desc">{{ 'wizard.step2Desc' | transloco }}</p>

              <div class="payment-options">
                @for (opt of availablePaymentOptions(); track opt.value) {
                  <label class="payment-option" [class.selected]="isPaymentSelected(opt.value)">
                    <input
                      type="checkbox"
                      [checked]="isPaymentSelected(opt.value)"
                      (change)="togglePayment(opt.value)"
                    />
                    <span class="option-label">{{
                      'wizard.paymentMethods.' + opt.value | transloco
                    }}</span>
                    <span class="checkmark">✓</span>
                  </label>
                }
              </div>

              @if (selectedPayments().length === 0) {
                <p class="payments-error">{{ 'wizard.paymentsRequired' | transloco }}</p>
              }

              <div class="step-actions">
                <button mat-button matStepperPrevious class="btn-back">
                  <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
                  {{ 'wizard.back' | transloco }}
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  matStepperNext
                  [disabled]="selectedPayments().length === 0"
                  class="btn-next"
                >
                  {{ 'wizard.next' | transloco }}
                  <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- ─── Paso 3: Tipo de arriendo ─── -->
          <mat-step [stepControl]="rentalStep" [label]="'wizard.step3Label' | transloco">
            <form [formGroup]="rentalStep" class="step-body">
              <div class="step-icon"><lucide-icon [img]="Home" [size]="36"></lucide-icon></div>
              <h2 class="step-title">{{ 'wizard.step3Title' | transloco }}</h2>
              <p class="step-desc">{{ 'wizard.step3Desc' | transloco }}</p>

              <mat-form-field appearance="outline" class="full-field">
                <mat-label>{{ 'wizard.rentalTypeLabel' | transloco }}</mat-label>
                <mat-select formControlName="rental_type">
                  <mat-option value="LONG_TERM">{{ 'wizard.longTerm' | transloco }}</mat-option>
                  <mat-option value="SHORT_TERM">{{ 'wizard.shortTerm' | transloco }}</mat-option>
                  <mat-option value="BOTH">{{ 'wizard.both' | transloco }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="fee-row">
                <mat-form-field appearance="outline" class="half-field">
                  <mat-label>{{ 'contracts.create.graceDays' | transloco }}</mat-label>
                  <input matInput type="number" formControlName="grace_days" min="0" max="30" />
                  <lucide-icon matIconSuffix [img]="Clock" [size]="18"></lucide-icon>
                  <mat-hint>{{ 'wizard.graceDaysHint' | transloco }}</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-field">
                  <mat-label>{{ 'wizard.lateFeeLabel' | transloco }}</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="late_fee_pct"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <lucide-icon matIconSuffix [img]="Percent" [size]="18"></lucide-icon>
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious class="btn-back">
                  <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
                  {{ 'wizard.back' | transloco }}
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  matStepperNext
                  [disabled]="rentalStep.invalid"
                  class="btn-next"
                >
                  {{ 'wizard.next' | transloco }}
                  <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- ─── Paso 4: Resumen ─── -->
          <mat-step [label]="'wizard.step4Label' | transloco">
            <div class="step-body summary-step">
              <div class="step-icon success">
                <lucide-icon [img]="Rocket" [size]="40"></lucide-icon>
              </div>
              <h2 class="step-title">{{ 'wizard.step4Title' | transloco }}</h2>
              <p class="step-desc">{{ 'wizard.step4Desc' | transloco }}</p>

              <div class="summary-card">
                <div class="summary-row">
                  <span class="summary-label">{{ 'wizard.step1Label' | transloco }}</span>
                  <span class="summary-value">{{ countryLabel() }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-row">
                  <span class="summary-label">{{ 'wizard.timezone' | transloco }}</span>
                  <span class="summary-value">{{ countryStep.value.timezone }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-row">
                  <span class="summary-label">{{ 'wizard.step2Title' | transloco }}</span>
                  <span class="summary-value">{{ paymentLabels() }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-row">
                  <span class="summary-label">{{ 'wizard.rentalTypeLabel' | transloco }}</span>
                  <span class="summary-value">{{ rentalTypeLabel() }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-row">
                  <span class="summary-label">{{ 'contracts.create.graceDays' | transloco }}</span>
                  <span class="summary-value"
                    >{{ rentalStep.value.grace_days }} {{ 'wizard.summaryDays' | transloco }}</span
                  >
                </div>
                <mat-divider></mat-divider>
                <div class="summary-row">
                  <span class="summary-label">{{ 'wizard.summaryLateFee' | transloco }}</span>
                  <span class="summary-value">{{ rentalStep.value.late_fee_pct }}%</span>
                </div>
              </div>

              @if (saveError()) {
                <div class="error-banner">{{ saveError() }}</div>
              }

              <div class="step-actions">
                <button mat-button matStepperPrevious class="btn-back" [disabled]="isSaving()">
                  <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
                  {{ 'wizard.back' | transloco }}
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  (click)="finishSetup()"
                  [disabled]="isSaving()"
                  class="btn-finish"
                >
                  @if (isSaving()) {
                    <mat-spinner diameter="20" color="accent"></mat-spinner>
                    <span>{{ 'wizard.saving' | transloco }}</span>
                  } @else {
                    <lucide-icon [img]="Rocket" [size]="18"></lucide-icon>
                    <span>{{ 'wizard.goToDashboard' | transloco }}</span>
                  }
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f8fafc;
      }

      .wizard-page {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .wizard-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        padding: 24px 40px;
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .wizard-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .wizard-subtitle {
        margin: 0;
        font-size: 0.9375rem;
        opacity: 0.8;
      }

      .wizard-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px;
      }

      .wizard-stepper {
        width: 100%;
        max-width: 680px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        padding: 32px;
      }

      .step-body {
        padding: 24px 0 8px;
      }

      .step-icon {
        width: 72px;
        height: 72px;
        background: #eff6ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        color: #3b82f6;
      }

      .step-icon.success {
        background: #f0fdf4;
        color: #22c55e;
      }

      .step-title {
        text-align: center;
        font-size: 1.375rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 8px;
      }

      .step-desc {
        text-align: center;
        color: #64748b;
        font-size: 0.9375rem;
        margin: 0 0 28px;
      }

      .full-field {
        width: 100%;
        margin-bottom: 16px;
      }

      .fee-row {
        display: flex;
        gap: 16px;
      }

      .half-field {
        flex: 1;
      }

      .payment-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 24px;
      }

      .payment-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        position: relative;
      }

      .payment-option input[type='checkbox'] {
        display: none;
      }

      .payment-option.selected {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .option-label {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 500;
        color: #334155;
      }

      .checkmark {
        font-size: 1rem;
        color: #3b82f6;
        opacity: 0;
        transition: opacity 0.15s;
      }

      .payment-option.selected .checkmark {
        opacity: 1;
      }

      .payments-error {
        color: #ef4444;
        font-size: 0.8125rem;
        margin-top: -16px;
        margin-bottom: 16px;
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 32px;
        gap: 12px;
      }

      .btn-next,
      .btn-back,
      .btn-finish {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 44px;
        padding: 0 20px;
      }

      .btn-finish {
        margin-left: auto;
      }

      /* Summary */
      .summary-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 28px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 14px 20px;
        font-size: 0.9375rem;
      }

      .summary-label {
        color: #64748b;
        font-weight: 500;
      }

      .summary-value {
        color: #0f172a;
        font-weight: 600;
        text-align: right;
        max-width: 60%;
      }

      .summary-step .step-actions {
        justify-content: space-between;
      }

      .error-banner {
        background: #fef2f2;
        border-left: 4px solid #ef4444;
        color: #dc2626;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 0.875rem;
        margin-bottom: 20px;
      }

      ::ng-deep .mat-stepper-horizontal {
        background: transparent;
      }
      ::ng-deep .mat-step-header {
        background: transparent !important;
      }
      ::ng-deep .mat-step-header:hover {
        background: transparent !important;
      }

      @media (max-width: 640px) {
        .wizard-header {
          flex-direction: column;
          gap: 8px;
          padding: 20px;
        }
        .wizard-stepper {
          padding: 20px 16px;
        }
        .payment-options {
          grid-template-columns: 1fr;
        }
        .fee-row {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class WizardSetupComponent implements OnInit {
  readonly Building2 = Building2;
  readonly Globe = Globe;
  readonly CreditCard = CreditCard;
  readonly Home = Home;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowRight = ArrowRight;
  readonly ArrowLeft = ArrowLeft;
  readonly Rocket = Rocket;
  readonly Percent = Percent;
  readonly Clock = Clock;

  private fb = inject(FormBuilder);
  private configService = inject(TenantConfigService);
  private slugService = inject(SlugService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  isSaving = signal(false);
  saveError = signal<string | null>(null);
  loadError = signal<string | null>(null);
  selectedPayments = signal<string[]>([]);
  availablePaymentOptions = signal<PaymentOption[]>([]);

  readonly countries = [
    { value: 'BO', label: 'Bolivia' },
    { value: 'US', label: 'Estados Unidos' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'HN', label: 'Honduras' },
  ];

  readonly timezones = [
    { value: 'America/La_Paz', label: 'América/La Paz (BOT, UTC-4)' },
    { value: 'America/New_York', label: 'América/Nueva York (ET)' },
    { value: 'America/Chicago', label: 'América/Chicago (CT)' },
    { value: 'America/Los_Angeles', label: 'América/Los Ángeles (PT)' },
    { value: 'America/Guatemala', label: 'América/Guatemala (CST, UTC-6)' },
    { value: 'America/Tegucigalpa', label: 'América/Tegucigalpa (CST, UTC-6)' },
  ];

  private readonly rentalTypeKeys: Record<string, string> = {
    LONG_TERM: 'wizard.longTerm',
    SHORT_TERM: 'wizard.shortTerm',
    BOTH: 'wizard.both',
  };

  countryStep = this.fb.group({
    country: ['BO', Validators.required],
    timezone: ['America/La_Paz', Validators.required],
  });

  paymentsStep = this.fb.group({});

  rentalStep = this.fb.group({
    rental_type: ['BOTH', Validators.required],
    grace_days: [5, [Validators.required, Validators.min(0)]],
    late_fee_pct: [2, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const slug = this.slugService.getSlug();
    if (!slug) return;

    this.configService.getConfig(slug).subscribe({
      next: (config) => this.applyConfig(config),
      error: () => this.loadError.set(this.transloco.translate('wizard.loadError')),
    });
  }

  private applyConfig(config: TenantConfig): void {
    this.countryStep.patchValue({
      country: config.country,
      timezone: config.timezone,
    });
    this.rentalStep.patchValue({
      rental_type: config.rental_type,
      grace_days: config.grace_days_late_fee,
      late_fee_pct: config.late_fee_percentage,
    });
    this.selectedPayments.set(config.payment_methods ?? []);
    this.updatePaymentOptions(config.country);
  }

  onCountryChange(country: string): void {
    this.updatePaymentOptions(country);
    // Reset to country defaults
    const defaults: Record<string, string[]> = {
      BO: ['qr_accl', 'transferencia'],
      US: ['stripe', 'ach'],
      GT: ['payu', 'tarjeta'],
      HN: ['payu', 'transferencia'],
    };
    this.selectedPayments.set(defaults[country] ?? []);

    const tzDefaults: Record<string, string> = {
      BO: 'America/La_Paz',
      US: 'America/New_York',
      GT: 'America/Guatemala',
      HN: 'America/Tegucigalpa',
    };
    this.countryStep.patchValue({ timezone: tzDefaults[country] ?? 'America/La_Paz' });
  }

  private updatePaymentOptions(country: string): void {
    this.availablePaymentOptions.set(
      ALL_PAYMENT_OPTIONS.filter((opt) => opt.countries.includes(country)),
    );
  }

  isPaymentSelected(value: string): boolean {
    return this.selectedPayments().includes(value);
  }

  togglePayment(value: string): void {
    this.selectedPayments.update((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }

  countryLabel(): string {
    return this.countries.find((c) => c.value === this.countryStep.value.country)?.label ?? '';
  }

  paymentLabels(): string {
    return this.selectedPayments()
      .map((v) => this.transloco.translate(`wizard.paymentMethods.${v}`))
      .join(', ');
  }

  rentalTypeLabel(): string {
    const key = this.rentalTypeKeys[this.rentalStep.value.rental_type ?? 'BOTH'];
    return key ? this.transloco.translate(key) : '';
  }

  finishSetup(): void {
    const slug = this.slugService.getSlug();
    if (!slug) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    const payload: UpdateTenantConfigDto = {
      country: this.countryStep.value.country!,
      timezone: this.countryStep.value.timezone!,
      payment_methods: this.selectedPayments(),
      rental_type: this.rentalStep.value.rental_type as 'LONG_TERM' | 'SHORT_TERM' | 'BOTH',
      grace_days_late_fee: Number(this.rentalStep.value.grace_days),
      late_fee_percentage: Number(this.rentalStep.value.late_fee_pct),
    };

    this.configService.updateConfig(slug, payload).subscribe({
      next: () => {
        this.configService.markSetupComplete(slug).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.router.navigate(['/', slug, 'dashboard']);
          },
          error: (err) => {
            this.isSaving.set(false);
            this.saveError.set(
              err.error?.message ?? this.transloco.translate('wizard.finishError'),
            );
          },
        });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(
          err.error?.message ?? this.transloco.translate('wizard.saveConfigError'),
        );
      },
    });
  }
}
