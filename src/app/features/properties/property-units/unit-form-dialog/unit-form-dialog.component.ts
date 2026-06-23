import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output,
  effect,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule, Save, Building2 } from 'lucide-angular';
import { UnitService } from '../../../../core/services/admin/unit.service';
import {
  Unit,
  UnitStatus,
  RentalType,
  UnitFormData,
  BookingMode,
  CancellationPolicy,
} from '../../../../core/models/unit.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { getApiErrorMessage } from '../../../../core/http/http-error.util';

@Component({
  selector: 'app-unit-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    TranslocoPipe,
  ],
  templateUrl: './unit-form-dialog.component.html',
  styleUrls: ['./unit-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitFormDialogComponent {
  readonly Save = Save;
  readonly Building2 = Building2;

  readonly UnitStatus = UnitStatus;
  readonly RentalType = RentalType;

  private fb = inject(FormBuilder);
  private unitService = inject(UnitService);
  private toast = inject(ToastService);
  private transloco = inject(TranslocoService);

  open = input(false);
  propertyId = input.required<number>();
  unit = input<Unit | null>(null);
  closed = output<void>();
  saved = output<Unit>();

  isSaving = signal(false);
  isEditMode = computed(() => !!this.unit());

  form = this.fb.group({
    unit_number: ['', [Validators.required, Validators.maxLength(20)]],
    floor: [null as number | string | null],
    bedrooms: [null as number | string | null, [Validators.min(0)]],
    bathrooms: [null as number | string | null, [Validators.min(0)]],
    square_meters: [null as number | string | null, [Validators.min(1)]],
    status: [UnitStatus.AVAILABLE, [Validators.required]],
    rental_type: [null as RentalType | null],
    price_per_month: [null as number | string | null, [Validators.min(0)]],
    price_per_night: [null as number | string | null, [Validators.min(0)]],
    deposit_amount: [null as number | string | null, [Validators.min(0)]],
    cleaning_fee: [null as number | string | null, [Validators.min(0)]],
    min_nights: [null as number | string | null, [Validators.min(1)]],
    max_nights: [null as number | string | null, [Validators.min(1)]],
    checkin_time: [''],
    checkout_time: [''],
    weekly_discount_pct: [null as number | string | null, [Validators.min(0), Validators.max(100)]],
    monthly_discount_pct: [
      null as number | string | null,
      [Validators.min(0), Validators.max(100)],
    ],
    weekend_adjustment_pct: [
      null as number | string | null,
      [Validators.min(-100), Validators.max(500)],
    ],
    early_bird_min_days: [null as number | string | null, [Validators.min(1)]],
    early_bird_discount_pct: [
      null as number | string | null,
      [Validators.min(0), Validators.max(100)],
    ],
    last_minute_max_days: [null as number | string | null, [Validators.min(0)]],
    last_minute_adjustment_pct: [
      null as number | string | null,
      [Validators.min(-100), Validators.max(500)],
    ],
    advance_notice_days: [null as number | string | null, [Validators.min(0)]],
    max_advance_days: [null as number | string | null, [Validators.min(1)]],
    booking_mode: ['instant' as BookingMode],
    cancellation_policy: ['moderate' as CancellationPolicy],
    deposit_to_confirm_pct: [
      null as number | string | null,
      [Validators.min(0), Validators.max(100)],
    ],
  });

  private readonly syncFormWithInput = effect(() => {
    if (!this.open()) return;

    const unit = this.unit();
    this.isSaving.set(false);
    this.form.reset({
      unit_number: unit?.unit_number ?? '',
      floor: unit?.floor ?? null,
      bedrooms: unit?.bedrooms ?? null,
      bathrooms: unit?.bathrooms ?? null,
      square_meters: unit?.square_meters ?? null,
      status: unit?.status ?? UnitStatus.AVAILABLE,
      rental_type: unit?.rental_type ?? null,
      price_per_month: unit?.price_per_month ?? null,
      price_per_night: unit?.price_per_night ?? null,
      deposit_amount: unit?.deposit_amount ?? null,
      cleaning_fee: unit?.cleaning_fee ?? null,
      min_nights: unit?.min_nights ?? null,
      max_nights: unit?.max_nights ?? null,
      checkin_time: unit?.checkin_time ?? '',
      checkout_time: unit?.checkout_time ?? '',
      weekly_discount_pct: unit?.weekly_discount_pct ?? null,
      monthly_discount_pct: unit?.monthly_discount_pct ?? null,
      weekend_adjustment_pct: unit?.weekend_adjustment_pct ?? null,
      early_bird_min_days: unit?.early_bird_min_days ?? null,
      early_bird_discount_pct: unit?.early_bird_discount_pct ?? null,
      last_minute_max_days: unit?.last_minute_max_days ?? null,
      last_minute_adjustment_pct: unit?.last_minute_adjustment_pct ?? null,
      advance_notice_days: unit?.advance_notice_days ?? null,
      max_advance_days: unit?.max_advance_days ?? null,
      booking_mode: unit?.booking_mode ?? 'instant',
      cancellation_policy: unit?.cancellation_policy ?? 'moderate',
      deposit_to_confirm_pct: unit?.deposit_to_confirm_pct ?? null,
    });
  });

  readonly statusOptions: AppSelectOption<UnitStatus>[] = [
    {
      value: UnitStatus.AVAILABLE,
      label: this.transloco.translate('propiedades.units.statuses.available'),
    },
    {
      value: UnitStatus.OCCUPIED,
      label: this.transloco.translate('propiedades.units.statuses.occupied'),
    },
    {
      value: UnitStatus.MAINTENANCE,
      label: this.transloco.translate('propiedades.units.statuses.maintenance'),
    },
    {
      value: UnitStatus.RESERVED,
      label: this.transloco.translate('propiedades.units.statuses.reserved'),
    },
  ];

  readonly rentalTypeOptions: AppSelectOption<RentalType>[] = [
    {
      value: RentalType.LONG_TERM,
      label: this.transloco.translate('propiedades.units.rentalTypes.LONG_TERM'),
    },
    {
      value: RentalType.SHORT_TERM,
      label: this.transloco.translate('propiedades.units.rentalTypes.SHORT_TERM'),
    },
    {
      value: RentalType.BOTH,
      label: this.transloco.translate('propiedades.units.rentalTypes.BOTH'),
    },
  ];

  readonly bookingModeOptions: AppSelectOption<BookingMode>[] = [
    {
      value: 'instant',
      label: this.transloco.translate('propiedades.units.bookingModes.instant'),
    },
    {
      value: 'request',
      label: this.transloco.translate('propiedades.units.bookingModes.request'),
    },
  ];

  readonly cancellationPolicyOptions: AppSelectOption<CancellationPolicy>[] = [
    {
      value: 'flexible',
      label: this.transloco.translate('propiedades.units.cancellationPolicies.flexible'),
    },
    {
      value: 'moderate',
      label: this.transloco.translate('propiedades.units.cancellationPolicies.moderate'),
    },
    {
      value: 'strict',
      label: this.transloco.translate('propiedades.units.cancellationPolicies.strict'),
    },
    {
      value: 'non_refundable',
      label: this.transloco.translate('propiedades.units.cancellationPolicies.non_refundable'),
    },
  ];

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const raw = this.form.getRawValue();

    const dto: Partial<UnitFormData> = {
      unit_number: raw.unit_number!,
      floor: this.toNumberOrUndefined(raw.floor),
      bedrooms: this.toNumberOrUndefined(raw.bedrooms),
      bathrooms: this.toNumberOrUndefined(raw.bathrooms),
      square_meters: this.toNumberOrUndefined(raw.square_meters),
      status: raw.status as UnitStatus,
      rental_type: raw.rental_type ?? undefined,
      price_per_month: this.toNumberOrUndefined(raw.price_per_month),
      price_per_night: this.toNumberOrUndefined(raw.price_per_night),
      deposit_amount: this.toNumberOrUndefined(raw.deposit_amount),
      cleaning_fee: this.toNumberOrUndefined(raw.cleaning_fee),
      min_nights: this.toNumberOrUndefined(raw.min_nights),
      max_nights: this.toNumberOrUndefined(raw.max_nights),
      checkin_time: raw.checkin_time || undefined,
      checkout_time: raw.checkout_time || undefined,
      weekly_discount_pct: this.toNumberOrUndefined(raw.weekly_discount_pct),
      monthly_discount_pct: this.toNumberOrUndefined(raw.monthly_discount_pct),
      weekend_adjustment_pct: this.toNumberOrUndefined(raw.weekend_adjustment_pct),
      early_bird_min_days: this.toNumberOrUndefined(raw.early_bird_min_days),
      early_bird_discount_pct: this.toNumberOrUndefined(raw.early_bird_discount_pct),
      last_minute_max_days: this.toNumberOrUndefined(raw.last_minute_max_days),
      last_minute_adjustment_pct: this.toNumberOrUndefined(raw.last_minute_adjustment_pct),
      advance_notice_days: this.toNumberOrUndefined(raw.advance_notice_days),
      max_advance_days: this.toNumberOrUndefined(raw.max_advance_days),
      booking_mode: raw.booking_mode ?? undefined,
      cancellation_policy: raw.cancellation_policy ?? undefined,
      deposit_to_confirm_pct: this.toNumberOrUndefined(raw.deposit_to_confirm_pct),
    };

    const currentUnit = this.unit();
    const request$ = this.isEditMode()
      ? this.unitService.update(this.propertyId(), currentUnit!.id, dto)
      : this.unitService.create(this.propertyId(), dto);

    request$.subscribe({
      next: (unit: Unit) => {
        this.isSaving.set(false);
        this.saved.emit(unit);
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.toast.error(
          this.resolveErrorMessage(error, this.transloco.translate('propiedades.units.saveError')),
        );
      },
    });
  }

  onCancel(): void {
    this.closed.emit();
  }

  private toNumberOrUndefined(value: number | string | null | undefined): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    return getApiErrorMessage(error, fallback);
  }
}
