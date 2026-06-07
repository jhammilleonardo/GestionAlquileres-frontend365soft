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

import { getApiErrorMessage } from '../../../core/http/http-error.util';
type RentalType = 'LONG_TERM' | 'SHORT_TERM' | 'BOTH';

interface PaymentOption {
  value: string;
  countries: string[];
}

interface ApiErrorLike {
  error?: {
    message?: string;
  };
}

const ALL_PAYMENT_OPTIONS: PaymentOption[] = [
  { value: 'qr_accl', countries: ['BO'] },
  { value: 'transferencia', countries: ['BO', 'GT', 'HN'] },
  { value: 'stripe', countries: ['US', 'GT'] },
  { value: 'paypal', countries: ['US'] },
  { value: 'ach', countries: ['US'] },
  { value: 'payu', countries: ['GT', 'HN'] },
  { value: 'tarjeta', countries: ['GT', 'HN'] },
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
  templateUrl: './wizard-setup.component.html',
  styleUrl: './wizard-setup.component.scss',
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

  readonly countries = computed<AppSelectOption<string>[]>(() => [
    { value: 'BO', label: this.transloco.translate('wizard.countries.BO') },
    { value: 'US', label: this.transloco.translate('wizard.countries.US') },
    { value: 'GT', label: this.transloco.translate('wizard.countries.GT') },
    { value: 'HN', label: this.transloco.translate('wizard.countries.HN') },
  ]);

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
    return this.countries().find((c) => c.value === this.countryStep.value.country)?.label ?? '';
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
              getApiErrorMessage(err, this.transloco.translate('wizard.finishError')),
            );
          },
        });
      },
      error: (err: ApiErrorLike) => {
        this.isSaving.set(false);
        this.saveError.set(
          getApiErrorMessage(err, this.transloco.translate('wizard.saveConfigError')),
        );
      },
    });
  }
}
