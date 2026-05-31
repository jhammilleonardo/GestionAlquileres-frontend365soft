import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Building2,
  Globe,
  CreditCard,
  Home,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Rocket,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  TenantConfigService,
  TenantConfig,
  UpdateTenantConfigDto,
} from '../../../core/services/admin/tenant-config.service';
import { SlugService } from '../../../core/services/slug.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';
import { AppStepperComponent } from '../../../shared/ui/stepper/stepper.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

type RentalType = 'LONG_TERM' | 'SHORT_TERM' | 'BOTH';

interface PaymentOption {
  value: string;
  label: string;
  countries: string[];
}

interface ApiErrorLike {
  error?: {
    message?: string;
  };
}

const ALL_PAYMENT_OPTIONS: PaymentOption[] = [
  { value: 'qr_accl', label: 'QR Pago (ACCL)', countries: ['BO'] },
  { value: 'transferencia', label: 'Transferencia bancaria', countries: ['BO', 'GT', 'HN'] },
  { value: 'stripe', label: 'Stripe', countries: ['US', 'GT'] },
  { value: 'paypal', label: 'PayPal', countries: ['US'] },
  { value: 'ach', label: 'ACH', countries: ['US'] },
  { value: 'payu', label: 'PayU', countries: ['GT', 'HN'] },
  { value: 'tarjeta', label: 'Tarjeta de credito', countries: ['GT', 'HN'] },
];

@Component({
  selector: 'app-wizard-setup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppSelectComponent,
    AppStepperComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'configuracion', alias: 'config' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wizard-page">
      <header class="wizard-header">
        <div class="wizard-logo">
          <lucide-icon [img]="Building2Icon" [size]="28" aria-hidden="true"></lucide-icon>
          <span>365Soft</span>
        </div>
        <p class="wizard-subtitle">{{ 'wizard.subtitle' | transloco }}</p>
      </header>

      <main class="wizard-main">
        <section class="wizard-card">
          @if (loadError()) {
            <div class="error-banner" role="alert">
              <lucide-icon [img]="AlertCircleIcon" [size]="18" aria-hidden="true"></lucide-icon>
              <span>{{ loadError() }}</span>
            </div>
          }

          <app-stepper [steps]="stepLabels()" [currentIndex]="currentStep()"></app-stepper>

          @switch (currentStep()) {
            @case (0) {
              <form [formGroup]="countryStep" class="step-body" novalidate>
                <div class="step-icon">
                  <lucide-icon [img]="GlobeIcon" [size]="36" aria-hidden="true"></lucide-icon>
                </div>
                <h1 class="step-title">{{ 'wizard.step1Title' | transloco }}</h1>
                <p class="step-desc">{{ 'wizard.step1Desc' | transloco }}</p>

                <app-select
                  formControlName="country"
                  [label]="'wizard.step1Label' | transloco"
                  [options]="countries"
                  (valueChanged)="onCountrySelected($event)"
                ></app-select>

                <app-select
                  formControlName="timezone"
                  [label]="'wizard.timezone' | transloco"
                  [options]="timezones"
                ></app-select>

                <div class="step-actions">
                  <span></span>
                  <app-button [disabled]="countryStep.invalid" (clicked)="goNext()">
                    {{ 'wizard.next' | transloco }}
                    <lucide-icon
                      [img]="ArrowRightIcon"
                      [size]="18"
                      aria-hidden="true"
                    ></lucide-icon>
                  </app-button>
                </div>
              </form>
            }

            @case (1) {
              <form [formGroup]="paymentsStep" class="step-body" novalidate>
                <div class="step-icon">
                  <lucide-icon [img]="CreditCardIcon" [size]="36" aria-hidden="true"></lucide-icon>
                </div>
                <h1 class="step-title">{{ 'wizard.step2Title' | transloco }}</h1>
                <p class="step-desc">{{ 'wizard.step2Desc' | transloco }}</p>

                <div class="payment-options">
                  @for (opt of availablePaymentOptions(); track opt.value) {
                    <label class="payment-option" [class.selected]="isPaymentSelected(opt.value)">
                      <input
                        type="checkbox"
                        [checked]="isPaymentSelected(opt.value)"
                        (change)="togglePayment(opt.value)"
                      />
                      <span class="option-label">{{ paymentLabel(opt.value) }}</span>
                      <span class="checkmark" aria-hidden="true">✓</span>
                    </label>
                  }
                </div>

                @if (selectedPayments().length === 0) {
                  <p class="payments-error">{{ 'wizard.paymentsRequired' | transloco }}</p>
                }

                <div class="step-actions">
                  <app-button appearance="outline" (clicked)="goBack()">
                    <lucide-icon [img]="ArrowLeftIcon" [size]="18" aria-hidden="true"></lucide-icon>
                    {{ 'wizard.back' | transloco }}
                  </app-button>
                  <app-button [disabled]="selectedPayments().length === 0" (clicked)="goNext()">
                    {{ 'wizard.next' | transloco }}
                    <lucide-icon
                      [img]="ArrowRightIcon"
                      [size]="18"
                      aria-hidden="true"
                    ></lucide-icon>
                  </app-button>
                </div>
              </form>
            }

            @case (2) {
              <form [formGroup]="rentalStep" class="step-body" novalidate>
                <div class="step-icon">
                  <lucide-icon [img]="HomeIcon" [size]="36" aria-hidden="true"></lucide-icon>
                </div>
                <h1 class="step-title">{{ 'wizard.step3Title' | transloco }}</h1>
                <p class="step-desc">{{ 'wizard.step3Desc' | transloco }}</p>

                <app-select
                  formControlName="rental_type"
                  [label]="'wizard.rentalTypeLabel' | transloco"
                  [options]="rentalTypeOptions()"
                ></app-select>

                <div class="fee-row">
                  <div class="field-with-hint">
                    <app-text-field
                      formControlName="grace_days"
                      type="number"
                      [label]="'contracts.create.graceDays' | transloco"
                      inputMode="numeric"
                    ></app-text-field>
                    <p>{{ 'wizard.graceDaysHint' | transloco }}</p>
                  </div>

                  <app-text-field
                    formControlName="late_fee_pct"
                    type="number"
                    [label]="'wizard.lateFeeLabel' | transloco"
                    inputMode="decimal"
                  ></app-text-field>
                </div>

                <div class="step-actions">
                  <app-button appearance="outline" (clicked)="goBack()">
                    <lucide-icon [img]="ArrowLeftIcon" [size]="18" aria-hidden="true"></lucide-icon>
                    {{ 'wizard.back' | transloco }}
                  </app-button>
                  <app-button [disabled]="rentalStep.invalid" (clicked)="goNext()">
                    {{ 'wizard.next' | transloco }}
                    <lucide-icon
                      [img]="ArrowRightIcon"
                      [size]="18"
                      aria-hidden="true"
                    ></lucide-icon>
                  </app-button>
                </div>
              </form>
            }

            @case (3) {
              <div class="step-body summary-step">
                <div class="step-icon success">
                  <lucide-icon [img]="RocketIcon" [size]="40" aria-hidden="true"></lucide-icon>
                </div>
                <h1 class="step-title">{{ 'wizard.step4Title' | transloco }}</h1>
                <p class="step-desc">{{ 'wizard.step4Desc' | transloco }}</p>

                <div class="summary-card">
                  <div class="summary-row">
                    <span class="summary-label">{{ 'wizard.step1Label' | transloco }}</span>
                    <span class="summary-value">{{ countryLabel() }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">{{ 'wizard.timezone' | transloco }}</span>
                    <span class="summary-value">{{ countryStep.value.timezone }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">{{ 'wizard.step2Title' | transloco }}</span>
                    <span class="summary-value">{{ paymentLabels() }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">{{ 'wizard.rentalTypeLabel' | transloco }}</span>
                    <span class="summary-value">{{ rentalTypeLabel() }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">{{
                      'contracts.create.graceDays' | transloco
                    }}</span>
                    <span class="summary-value">
                      {{ rentalStep.value.grace_days }} {{ 'wizard.summaryDays' | transloco }}
                    </span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">{{ 'wizard.summaryLateFee' | transloco }}</span>
                    <span class="summary-value">{{ rentalStep.value.late_fee_pct }}%</span>
                  </div>
                </div>

                @if (saveError()) {
                  <div class="error-banner" role="alert">{{ saveError() }}</div>
                }

                <div class="step-actions">
                  <app-button appearance="outline" [disabled]="isSaving()" (clicked)="goBack()">
                    <lucide-icon [img]="ArrowLeftIcon" [size]="18" aria-hidden="true"></lucide-icon>
                    {{ 'wizard.back' | transloco }}
                  </app-button>
                  <app-button
                    [loading]="isSaving()"
                    [disabled]="isSaving()"
                    (clicked)="finishSetup()"
                  >
                    <lucide-icon [img]="RocketIcon" [size]="18" aria-hidden="true"></lucide-icon>
                    {{ 'wizard.goToDashboard' | transloco }}
                  </app-button>
                </div>
              </div>
            }
          }
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--app-color-bg);
      }

      .wizard-page {
        min-height: 100vh;
      }

      .wizard-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem 2.5rem;
        background: #17202a;
        color: #fff;
      }

      .wizard-logo {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: 1.5rem;
        font-weight: 760;
      }

      .wizard-subtitle {
        margin: 0;
        color: rgb(255 255 255 / 78%);
        font-size: 0.9375rem;
      }

      .wizard-main {
        display: grid;
        place-items: start center;
        padding: 2.5rem 1.5rem;
      }

      .wizard-card {
        width: min(100%, 720px);
        padding: 2rem;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-xl);
        background: var(--app-color-surface);
        box-shadow: var(--app-shadow-lg);
      }

      .step-body {
        display: grid;
        gap: 1rem;
        padding-top: 1rem;
      }

      .step-icon {
        display: grid;
        width: 4.5rem;
        height: 4.5rem;
        place-items: center;
        margin: 0 auto 0.25rem;
        border-radius: 999px;
        background: var(--app-color-primary-soft);
        color: var(--app-color-primary);
      }

      .step-icon.success {
        background: #dcfce7;
        color: var(--app-color-success);
      }

      .step-title {
        margin: 0;
        color: var(--app-color-text);
        font-size: 1.375rem;
        font-weight: 760;
        text-align: center;
      }

      .step-desc {
        max-width: 34rem;
        margin: 0 auto 0.75rem;
        color: var(--app-color-text-muted);
        font-size: 0.9375rem;
        text-align: center;
      }

      .fee-row,
      .payment-options {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.875rem;
      }

      .field-with-hint {
        display: grid;
        gap: 0.35rem;
      }

      .field-with-hint p {
        margin: 0;
        color: var(--app-color-text-muted);
        font-size: 0.8125rem;
      }

      .payment-option {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.875rem 1rem;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-md);
        color: var(--app-color-text);
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }

      .payment-option input {
        accent-color: var(--app-color-primary);
      }

      .payment-option.selected {
        border-color: var(--app-color-primary);
        background: var(--app-color-primary-soft);
      }

      .option-label {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 650;
      }

      .checkmark {
        color: var(--app-color-primary);
        font-weight: 800;
        opacity: 0;
      }

      .payment-option.selected .checkmark {
        opacity: 1;
      }

      .payments-error,
      .error-banner {
        color: var(--app-color-danger);
      }

      .payments-error {
        margin: 0;
        font-size: 0.8125rem;
      }

      .error-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        border: 1px solid color-mix(in srgb, var(--app-color-danger) 30%, transparent);
        border-radius: var(--app-radius-md);
        background: color-mix(in srgb, var(--app-color-danger) 10%, transparent);
        font-size: 0.875rem;
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 1.25rem;
      }

      .summary-card {
        overflow: hidden;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.875rem 1.25rem;
        border-bottom: 1px solid var(--app-color-border);
        font-size: 0.9375rem;
      }

      .summary-row:last-child {
        border-bottom: 0;
      }

      .summary-label {
        color: var(--app-color-text-muted);
        font-weight: 650;
      }

      .summary-value {
        max-width: 60%;
        color: var(--app-color-text);
        font-weight: 750;
        text-align: right;
      }

      @media (max-width: 640px) {
        .wizard-header {
          flex-direction: column;
          gap: 0.5rem;
          padding: 1.25rem;
          text-align: center;
        }

        .wizard-card {
          padding: 1rem;
        }

        .fee-row,
        .payment-options {
          grid-template-columns: 1fr;
        }

        .step-actions {
          display: grid;
        }

        .summary-row {
          display: grid;
        }

        .summary-value {
          max-width: none;
          text-align: left;
        }
      }
    `,
  ],
})
export class WizardSetupComponent implements OnInit {
  readonly Building2Icon = Building2;
  readonly GlobeIcon = Globe;
  readonly CreditCardIcon = CreditCard;
  readonly HomeIcon = Home;
  readonly AlertCircleIcon = AlertCircle;
  readonly ArrowRightIcon = ArrowRight;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly RocketIcon = Rocket;

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
  currentStep = signal(0);

  readonly countries: AppSelectOption<string>[] = [
    { value: 'BO', label: 'Bolivia' },
    { value: 'US', label: 'Estados Unidos' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'HN', label: 'Honduras' },
  ];

  readonly timezones: AppSelectOption<string>[] = [
    { value: 'America/La_Paz', label: 'America/La Paz (BOT, UTC-4)' },
    { value: 'America/New_York', label: 'America/Nueva York (ET)' },
    { value: 'America/Chicago', label: 'America/Chicago (CT)' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles (PT)' },
    { value: 'America/Guatemala', label: 'America/Guatemala (CST, UTC-6)' },
    { value: 'America/Tegucigalpa', label: 'America/Tegucigalpa (CST, UTC-6)' },
  ];

  readonly stepLabels = computed(() => [
    this.transloco.translate('wizard.step1Label'),
    this.transloco.translate('wizard.step2Label'),
    this.transloco.translate('wizard.step3Label'),
    this.transloco.translate('wizard.step4Label'),
  ]);

  readonly rentalTypeOptions = computed<AppSelectOption<RentalType>[]>(() => [
    { value: 'LONG_TERM', label: this.transloco.translate('wizard.longTerm') },
    { value: 'SHORT_TERM', label: this.transloco.translate('wizard.shortTerm') },
    { value: 'BOTH', label: this.transloco.translate('wizard.both') },
  ]);

  private readonly rentalTypeKeys: Record<RentalType, string> = {
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
    rental_type: ['BOTH' as RentalType, Validators.required],
    grace_days: [5, [Validators.required, Validators.min(0)]],
    late_fee_pct: [2, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const slug = this.slugService.getSlug();
    this.updatePaymentOptions(this.countryStep.controls.country.value ?? 'BO');
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

  onCountrySelected(country: string | number | null): void {
    if (typeof country !== 'string') return;
    this.onCountryChange(country);
  }

  onCountryChange(country: string): void {
    this.updatePaymentOptions(country);
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

  paymentLabel(value: string): string {
    return this.transloco.translate(`wizard.paymentMethods.${value}`);
  }

  countryLabel(): string {
    return this.countries.find((c) => c.value === this.countryStep.value.country)?.label ?? '';
  }

  paymentLabels(): string {
    return this.selectedPayments()
      .map((value) => this.paymentLabel(value))
      .join(', ');
  }

  rentalTypeLabel(): string {
    const rentalType = (this.rentalStep.value.rental_type ?? 'BOTH') as RentalType;
    return this.transloco.translate(this.rentalTypeKeys[rentalType]);
  }

  goNext(): void {
    if (this.currentStep() === 0 && this.countryStep.invalid) return;
    if (this.currentStep() === 1 && this.selectedPayments().length === 0) return;
    if (this.currentStep() === 2 && this.rentalStep.invalid) return;

    this.currentStep.update((step) => Math.min(3, step + 1));
  }

  goBack(): void {
    this.currentStep.update((step) => Math.max(0, step - 1));
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
      rental_type: this.rentalStep.value.rental_type as RentalType,
      grace_days_late_fee: Number(this.rentalStep.value.grace_days),
      late_fee_percentage: Number(this.rentalStep.value.late_fee_pct),
    };

    this.configService.updateConfig(slug, payload).subscribe({
      next: () => {
        this.configService.markSetupComplete(slug).subscribe({
          next: () => {
            this.isSaving.set(false);
            void this.router.navigate(['/', slug, 'dashboard']);
          },
          error: (err: ApiErrorLike) => {
            this.isSaving.set(false);
            this.saveError.set(
              err.error?.message ?? this.transloco.translate('wizard.finishError'),
            );
          },
        });
      },
      error: (err: ApiErrorLike) => {
        this.isSaving.set(false);
        this.saveError.set(
          err.error?.message ?? this.transloco.translate('wizard.saveConfigError'),
        );
      },
    });
  }
}
