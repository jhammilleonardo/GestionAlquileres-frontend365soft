import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  CreateVendorDto,
  Vendor,
  VendorHistoryItem,
  VendorSpecialty,
} from '../../core/models/vendor.model';
import { VendorService } from '../../core/services/admin/vendor.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Injectable()
export class VendorsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly vendorService = inject(VendorService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly stars = [1, 2, 3, 4, 5];

  readonly vendors = signal<Vendor[]>([]);
  readonly isLoading = signal(true);
  readonly specialtyFilter = signal<VendorSpecialty | ''>('');

  readonly selectedVendor = signal<Vendor | null>(null);
  readonly history = signal<VendorHistoryItem[]>([]);
  readonly historyLoading = signal(false);

  readonly creatingAccount = signal(false);
  readonly accountCredentials = signal<{ email: string; temporaryPassword: string } | null>(null);

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

  // Recalcula las etiquetas cuando el scope lazy termina de cargar o cambia el
  // idioma. Sin esto, las opciones se construirían antes de que el JSON del
  // scope esté disponible y mostrarían las claves crudas (ej. "vendors.specialty.painting").
  private readonly translationsReady = toSignal(
    this.transloco.events$.pipe(
      filter((event) => event.type === 'translationLoadSuccess' || event.type === 'langChanged'),
    ),
  );

  readonly specialtyOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return Object.values(VendorSpecialty).map((value) => ({
      value,
      label: this.transloco.translate(`vendors.specialty.${value}`),
    }));
  });

  readonly specialtyFilterOptions = computed<AppSelectOption<string>[]>(() => [
    { value: '', label: this.transloco.translate('vendors.allSpecialties') },
    ...this.specialtyOptions(),
  ]);

  readonly filteredVendors = computed(() => {
    const specialty = this.specialtyFilter();
    const all = this.vendors();
    return specialty ? all.filter((vendor) => vendor.specialty === specialty) : all;
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

    const dto = this.buildDto();
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
      error: (err: unknown) => {
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

  createAccount(vendor: Vendor): void {
    this.creatingAccount.set(true);
    this.accountCredentials.set(null);
    this.vendorService.createAccount(vendor.id).subscribe({
      next: (credentials) => {
        this.creatingAccount.set(false);
        this.accountCredentials.set(credentials);
        this.toast.success(this.transloco.translate('vendors.account.created'));
      },
      error: (err: unknown) => {
        this.creatingAccount.set(false);
        this.toast.error(
          getApiErrorMessage(err, this.transloco.translate('vendors.account.error')),
        );
      },
    });
  }

  openDetail(vendor: Vendor): void {
    this.selectedVendor.set(vendor);
    this.history.set([]);
    this.accountCredentials.set(null);
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

  private buildDto(): CreateVendorDto {
    const raw = this.form.getRawValue();
    return {
      name: raw.name!,
      specialty: raw.specialty!,
      phone: raw.phone || undefined,
      email: raw.email || undefined,
      rate_per_hour: raw.rate_per_hour ?? undefined,
      rate_flat: raw.rate_flat ?? undefined,
      notes: raw.notes || undefined,
    };
  }
}
