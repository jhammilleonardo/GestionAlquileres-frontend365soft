import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import { environment } from '../../../environments/environment';
import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  CreateViolationDto,
  Violation,
  ViolationStatus,
  ViolationType,
} from '../../core/models/violation.model';
import { FileDownloadService } from '../../core/services/file-download.service';
import { PropertyService } from '../../core/services/admin/property.service';
import { ViolationService } from '../../core/services/admin/violation.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Injectable()
export class ViolationsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly violationService = inject(ViolationService);
  private readonly propertyService = inject(PropertyService);
  private readonly tenantUserService = inject(TenantUserService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly violations = signal<Violation[]>([]);
  readonly isLoading = signal(true);

  readonly propertyOptions = signal<AppSelectOption<number>[]>([]);
  readonly tenantOptions = signal<AppSelectOption<number>[]>([]);

  readonly dialogOpen = signal(false);
  readonly saving = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly busyId = signal<number | null>(null);

  readonly resolveDialogOpen = signal(false);
  readonly resolvingId = signal<number | null>(null);
  readonly resolveNotes = signal('');

  readonly typeValues = Object.values(ViolationType);
  readonly typeOptions: AppSelectOption<string>[] = this.typeValues.map((value) => ({
    value,
    label: this.transloco.translate(`violations.type.${value}`),
  }));

  readonly statusValues = Object.values(ViolationStatus);

  readonly filterForm = this.fb.group({
    property_id: [null as number | null],
    status: [''],
    type: [''],
  });

  readonly statusFilterOptions: AppSelectOption<string>[] = [
    { value: '', label: this.transloco.translate('violations.allStatuses') },
    ...this.statusValues.map((value) => ({
      value,
      label: this.transloco.translate(`violations.status.${value}`),
    })),
  ];
  readonly typeFilterOptions: AppSelectOption<string>[] = [
    { value: '', label: this.transloco.translate('violations.allTypes') },
    ...this.typeOptions,
  ];

  readonly form = this.fb.group({
    property_id: [null as number | null, Validators.required],
    tenant_id: [null as number | null, Validators.required],
    type: [ViolationType.NOISE as string, Validators.required],
    description: ['', Validators.required],
  });

  readonly openCount = computed(
    () => this.violations().filter((violation) => violation.status === ViolationStatus.OPEN).length,
  );

  constructor() {
    this.loadProperties();
    this.loadTenants();
    this.load();
  }

  loadProperties(): void {
    this.propertyService.getAdminProperties().subscribe({
      next: (properties) =>
        this.propertyOptions.set(
          properties.map((property) => ({ value: property.id, label: property.title })),
        ),
      error: () => this.propertyOptions.set([]),
    });
  }

  loadTenants(): void {
    this.tenantUserService.getFilteredUsers({}).subscribe({
      next: (users) =>
        this.tenantOptions.set(users.map((user) => ({ value: user.id, label: user.name }))),
      error: () => this.tenantOptions.set([]),
    });
  }

  load(): void {
    this.isLoading.set(true);
    const filters = this.filterForm.value;
    const params: Record<string, string | number> = { limit: 200 };
    if (filters.property_id) params['property_id'] = filters.property_id;
    if (filters.status) params['status'] = filters.status;
    if (filters.type) params['type'] = filters.type;

    this.violationService.list(params).subscribe({
      next: (res) => {
        this.violations.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.violations.set([]);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.filterForm.reset({ property_id: null, status: '', type: '' });
    this.load();
  }

  statusTone(status: ViolationStatus): AppStatusTone {
    switch (status) {
      case ViolationStatus.OPEN:
        return 'warning';
      case ViolationStatus.NOTIFIED:
        return 'info';
      case ViolationStatus.RESOLVED:
        return 'success';
    }
  }

  photoUrl(path: string): string {
    return path.startsWith('http') ? path : `${environment.apiUrl.replace(/\/$/, '')}${path}`;
  }

  openCreate(): void {
    this.form.reset({ type: ViolationType.NOISE });
    this.selectedFiles.set([]);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
  }

  onFilesSelected(files: File[]): void {
    this.selectedFiles.set(files);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.violationService.create(this.buildDto()).subscribe({
      next: (created) => this.uploadEvidenceOrFinish(created.id),
      error: (err: unknown) => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(err, this.transloco.translate('violations.saveError')));
      },
    });
  }

  openResolve(violation: Violation): void {
    this.resolvingId.set(violation.id);
    this.resolveNotes.set('');
    this.resolveDialogOpen.set(true);
  }

  closeResolve(): void {
    this.resolveDialogOpen.set(false);
  }

  textareaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  confirmResolve(): void {
    const id = this.resolvingId();
    if (!id) return;
    this.violationService
      .updateStatus(id, ViolationStatus.RESOLVED, this.resolveNotes())
      .subscribe({
        next: () => {
          this.resolveDialogOpen.set(false);
          this.toast.success(this.transloco.translate('violations.resolved'));
          this.load();
        },
        error: () => this.toast.error(this.transloco.translate('violations.saveError')),
      });
  }

  async notify(violation: Violation): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('violations.notifyTitle'),
      message: this.transloco.translate('violations.notifyMessage', {
        name: violation.tenant_name ?? '',
      }),
      confirmLabel: this.transloco.translate('violations.notify'),
      cancelLabel: this.transloco.translate('common.cancel'),
    });
    if (!confirmed) return;

    this.busyId.set(violation.id);
    this.violationService.notify(violation.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(this.transloco.translate('violations.notified'));
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.transloco.translate('violations.saveError'));
      },
    });
  }

  downloadPdf(violation: Violation): void {
    this.busyId.set(violation.id);
    this.violationService.downloadPdf(violation.id).subscribe({
      next: (blob) => {
        this.busyId.set(null);
        this.downloadBlob(blob, `violacion_${violation.id}.pdf`);
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.transloco.translate('violations.pdfError'));
      },
    });
  }

  isOpen(violation: Violation): boolean {
    return violation.status === ViolationStatus.OPEN;
  }

  isResolved(violation: Violation): boolean {
    return violation.status === ViolationStatus.RESOLVED;
  }

  private buildDto(): CreateViolationDto {
    const raw = this.form.getRawValue();
    return {
      property_id: raw.property_id!,
      tenant_id: raw.tenant_id!,
      type: raw.type as ViolationType,
      description: raw.description!,
    };
  }

  private uploadEvidenceOrFinish(id: number): void {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.finishSave();
      return;
    }

    this.violationService.uploadEvidence(id, files).subscribe({
      next: () => this.finishSave(),
      error: () => this.finishSave(),
    });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.dialogOpen.set(false);
    this.toast.success(this.transloco.translate('violations.created'));
    this.load();
  }

  private downloadBlob(blob: Blob, filename: string): void {
    this.fileDownload.downloadBlob(blob, filename);
  }
}
