import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Plus,
  Star,
  Phone,
  Mail,
  Pencil,
  Trash2,
  Wrench,
  X,
} from 'lucide-angular';

import { VendorService } from '../../core/services/admin/vendor.service';
import {
  CreateVendorDto,
  Vendor,
  VendorHistoryItem,
  VendorSpecialty,
} from '../../core/models/vendor.model';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

import { getApiErrorMessage } from '../../core/http/http-error.util';
@Component({
  selector: 'app-vendors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
    AppSelectComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'vendors', alias: 'vendors' })],
  templateUrl: './vendors.component.html',
  styleUrl: './vendors.component.scss',
})
export class VendorsComponent {
  readonly Plus = Plus;
  readonly Star = Star;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Wrench = Wrench;
  readonly X = X;

  readonly stars = [1, 2, 3, 4, 5];

  private readonly fb = inject(FormBuilder);
  private readonly vendorService = inject(VendorService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly vendors = signal<Vendor[]>([]);
  readonly isLoading = signal(true);
  readonly specialtyFilter = signal<VendorSpecialty | ''>('');

  readonly selectedVendor = signal<Vendor | null>(null);
  readonly history = signal<VendorHistoryItem[]>([]);
  readonly historyLoading = signal(false);

  readonly dialogOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    specialty: [VendorSpecialty.GENERAL, Validators.required],
    phone: [''],
    email: ['', Validators.email],
    rate_per_hour: [null as number | null, Validators.min(0)],
    rate_flat: [null as number | null, Validators.min(0)],
    notes: [''],
  });

  readonly specialtyOptions: AppSelectOption<string>[] = Object.values(VendorSpecialty).map(
    (value) => ({ value, label: this.transloco.translate(`vendors.specialty.${value}`) }),
  );

  readonly specialtyFilterOptions: AppSelectOption<string>[] = [
    { value: '', label: this.transloco.translate('vendors.allSpecialties') },
    ...this.specialtyOptions,
  ];

  readonly filteredVendors = computed(() => {
    const specialty = this.specialtyFilter();
    const all = this.vendors();
    return specialty ? all.filter((v) => v.specialty === specialty) : all;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.vendorService.list().subscribe({
      next: (vendors) => {
        this.vendors.set(vendors);
        this.isLoading.set(false);
      },
      error: () => {
        this.vendors.set([]);
        this.isLoading.set(false);
      },
    });
  }

  onSpecialtyFilter(value: string): void {
    this.specialtyFilter.set(value as VendorSpecialty | '');
  }

  /** Devuelve la cantidad de estrellas llenas (redondeo) para un rating 0-5. */
  filledStars(rating: number | null | undefined): number {
    return Math.round(rating ?? 0);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ specialty: VendorSpecialty.GENERAL });
    this.dialogOpen.set(true);
  }

  openEdit(vendor: Vendor, event: Event): void {
    event.stopPropagation();
    this.editingId.set(vendor.id);
    this.form.reset({
      name: vendor.name,
      specialty: vendor.specialty,
      phone: vendor.phone ?? '',
      email: vendor.email ?? '',
      rate_per_hour: vendor.rate_per_hour ?? null,
      rate_flat: vendor.rate_flat ?? null,
      notes: vendor.notes ?? '',
    });
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateVendorDto = {
      name: raw.name!,
      specialty: raw.specialty!,
      phone: raw.phone || undefined,
      email: raw.email || undefined,
      rate_per_hour: raw.rate_per_hour ?? undefined,
      rate_flat: raw.rate_flat ?? undefined,
      notes: raw.notes || undefined,
    };

    this.saving.set(true);
    const id = this.editingId();
    const request$ = id ? this.vendorService.update(id, dto) : this.vendorService.create(dto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogOpen.set(false);
        this.toast.success(
          this.transloco.translate(id ? 'vendors.updated' : 'vendors.created', { name: dto.name }),
        );
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(err, this.transloco.translate('vendors.saveError')));
      },
    });
  }

  async deactivate(vendor: Vendor, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('vendors.deactivateTitle'),
      message: this.transloco.translate('vendors.deactivateMessage', { name: vendor.name }),
      confirmLabel: this.transloco.translate('vendors.deactivate'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;

    this.vendorService.remove(vendor.id).subscribe({
      next: () => {
        this.toast.success(this.transloco.translate('vendors.deactivated', { name: vendor.name }));
        if (this.selectedVendor()?.id === vendor.id) {
          this.selectedVendor.set(null);
        }
        this.load();
      },
      error: () => this.toast.error(this.transloco.translate('vendors.saveError')),
    });
  }

  openDetail(vendor: Vendor): void {
    this.selectedVendor.set(vendor);
    this.history.set([]);
    this.historyLoading.set(true);
    this.vendorService.getHistory(vendor.id).subscribe({
      next: (history) => {
        this.history.set(history);
        this.historyLoading.set(false);
      },
      error: () => {
        this.history.set([]);
        this.historyLoading.set(false);
      },
    });
  }

  closeDetail(): void {
    this.selectedVendor.set(null);
  }
}
