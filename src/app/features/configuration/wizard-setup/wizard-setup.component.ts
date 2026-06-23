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

interface TimezoneDefinition {
  value: string;
  labelKey: string;
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

/**
 * Zonas horarias por país. El país se elige en el registro, por eso el wizard
 * no vuelve a preguntarlo: solo pide la zona horaria cuando hay más de una opción
 * (EE.UU.). Para países con una sola zona se fija automáticamente.
 */
export const COUNTRY_TIMEZONES: Record<string, TimezoneDefinition[]> = {
  BO: [{ value: 'America/La_Paz', labelKey: 'bolivia' }],
  US: [
    { value: 'America/New_York', labelKey: 'usEastern' },
    { value: 'America/Chicago', labelKey: 'usCentral' },
    { value: 'America/Denver', labelKey: 'usMountain' },
    { value: 'America/Phoenix', labelKey: 'usArizona' },
    { value: 'America/Los_Angeles', labelKey: 'usPacific' },
    { value: 'America/Anchorage', labelKey: 'usAlaska' },
    { value: 'America/Adak', labelKey: 'usAleutian' },
    { value: 'Pacific/Honolulu', labelKey: 'usHawaii' },
    { value: 'America/Puerto_Rico', labelKey: 'usAtlantic' },
    { value: 'Pacific/Pago_Pago', labelKey: 'usSamoa' },
    { value: 'Pacific/Guam', labelKey: 'usChamorro' },
  ],
  GT: [{ value: 'America/Guatemala', labelKey: 'guatemala' }],
  HN: [{ value: 'America/Tegucigalpa', labelKey: 'honduras' }],
};

type WizardStepKey = 'timezone' | 'payments' | 'rental' | 'summary';

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

  /** País elegido en el registro. El wizard no lo vuelve a pedir, solo lo usa. */
  readonly country = signal('BO');

  readonly countries = computed<AppSelectOption<string>[]>(() => [
    { value: 'BO', label: this.transloco.translate('wizard.countries.BO') },
    { value: 'US', label: this.transloco.translate('wizard.countries.US') },
    { value: 'GT', label: this.transloco.translate('wizard.countries.GT') },
    { value: 'HN', label: this.transloco.translate('wizard.countries.HN') },
  ]);

  /** Zonas horarias del país activo. Vacío ⇒ se usa el fallback de La Paz. */
  readonly timezonesForCountry = computed<AppSelectOption<string>[]>(() =>
    (COUNTRY_TIMEZONES[this.country()] ?? COUNTRY_TIMEZONES['BO']).map((timezone) => ({
      value: timezone.value,
      label: this.transloco.translate(`wizard.timezones.${timezone.labelKey}`),
    })),
  );

  /** Solo se pregunta la zona horaria cuando el país tiene más de una. */
  readonly needsTimezoneChoice = computed(() => this.timezonesForCountry().length > 1);

  /** Pasos del wizard. El paso de zona horaria solo existe en países multi-zona. */
  readonly steps = computed<{ key: WizardStepKey; label: string }[]>(() => {
    const steps: { key: WizardStepKey; label: string }[] = [];
    if (this.needsTimezoneChoice()) {
      steps.push({ key: 'timezone', label: this.transloco.translate('wizard.tzStepLabel') });
    }
    steps.push({ key: 'payments', label: this.transloco.translate('wizard.step2Label') });
    steps.push({ key: 'rental', label: this.transloco.translate('wizard.step3Label') });
    steps.push({ key: 'summary', label: this.transloco.translate('wizard.step4Label') });
    return steps;
  });

  readonly stepLabels = computed(() => this.steps().map((step) => step.label));

  readonly currentKey = computed<WizardStepKey>(
    () => this.steps()[this.currentStep()]?.key ?? 'payments',
  );

  private readonly rentalTypeKeys: Record<RentalType, string> = {
    LONG_TERM: 'wizard.longTerm',
    SHORT_TERM: 'wizard.shortTerm',
    BOTH: 'wizard.both',
  };

  readonly rentalTypeOptions = computed<AppSelectOption<RentalType>[]>(() =>
    (Object.keys(this.rentalTypeKeys) as RentalType[]).map((value) => ({
      value,
      label: this.transloco.translate(this.rentalTypeKeys[value]),
    })),
  );

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
    this.country.set(config.country);
    // El país tiene una sola zona ⇒ se fija sola; multi-zona ⇒ respeta la guardada.
    const timezone = this.needsTimezoneChoice()
      ? config.timezone
      : (this.timezonesForCountry()[0]?.value ?? config.timezone);
    this.countryStep.patchValue({ country: config.country, timezone });
    this.rentalStep.patchValue({
      rental_type: config.rental_type,
      grace_days: config.grace_days_late_fee,
      late_fee_pct: config.late_fee_percentage,
    });
    this.selectedPayments.set(config.payment_methods ?? []);
    this.updatePaymentOptions(config.country);
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
    const key = this.currentKey();
    if (key === 'payments' && this.selectedPayments().length === 0) return;
    if (key === 'rental' && this.rentalStep.invalid) return;

    this.currentStep.update((step) => Math.min(this.steps().length - 1, step + 1));
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
