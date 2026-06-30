import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { debounceTime, filter } from 'rxjs';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  CLOSED_VIOLATION_STATUSES,
  CreateViolationDto,
  Violation,
  ViolationFineStatus,
  ViolationSeverity,
  ViolationStats,
  ViolationStatus,
  ViolationType,
  isViolationOverdue,
} from '../../core/models/violation.model';
import { FileDownloadService } from '../../core/services/file-download.service';
import { PropertyService } from '../../core/services/admin/property.service';
import { ViolationService } from '../../core/services/admin/violation.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

const EMPTY_STATS: ViolationStats = {
  total: 0,
  open: 0,
  overdue: 0,
  escalated: 0,
  fines_outstanding: 0,
};

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
  readonly stats = signal<ViolationStats>(EMPTY_STATS);

  readonly propertyOptions = signal<AppSelectOption<number>[]>([]);
  readonly tenantOptions = signal<AppSelectOption<number>[]>([]);

  readonly dialogOpen = signal(false);
  readonly saving = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly busyId = signal<number | null>(null);

  readonly resolveDialogOpen = signal(false);
  readonly resolvingId = signal<number | null>(null);
  readonly resolveNotes = signal('');

  // Panel de detalle (drawer) con línea de tiempo y acciones.
  readonly detailOpen = signal(false);
  readonly detail = signal<Violation | null>(null);
  readonly detailLoading = signal(false);
  readonly detailBusy = signal(false);
  readonly noteText = signal('');
  readonly fineAmount = signal<number | null>(null);

  readonly typeValues = Object.values(ViolationType);
  readonly statusValues = Object.values(ViolationStatus);
  readonly severityValues = Object.values(ViolationSeverity);

  // El scope de traducción se carga vía HTTP de forma asíncrona. Traducir en un
  // inicializador de campo devolvería la clave cruda porque corre antes de la
  // carga. Este signal emite cuando el scope termina de cargar (inicial y al
  // cambiar de idioma), forzando el recálculo de las etiquetas.
  private readonly translationsReady = toSignal(
    this.transloco.events$.pipe(filter((event) => event.type === 'translationLoadSuccess')),
    { initialValue: null },
  );

  readonly typeOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return this.typeValues.map((value) => ({
      value,
      label: this.transloco.translate(`violations.type.${value}`),
    }));
  });

  readonly severityOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return this.severityValues.map((value) => ({
      value,
      label: this.transloco.translate(`violations.severity.${value}`),
    }));
  });

  readonly statusOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return this.statusValues.map((value) => ({
      value,
      label: this.transloco.translate(`violations.status.${value}`),
    }));
  });

  readonly filterForm = this.fb.group({
    property_id: [null as number | null],
    status: [''],
    type: [''],
    severity: [''],
  });

  readonly statusFilterOptions = computed<AppSelectOption<string>[]>(() => [
    { value: '', label: this.transloco.translate('violations.allStatuses') },
    ...this.statusOptions(),
  ]);

  readonly typeFilterOptions = computed<AppSelectOption<string>[]>(() => [
    { value: '', label: this.transloco.translate('violations.allTypes') },
    ...this.typeOptions(),
  ]);

  readonly severityFilterOptions = computed<AppSelectOption<string>[]>(() => [
    { value: '', label: this.transloco.translate('violations.allSeverities') },
    ...this.severityOptions(),
  ]);

  readonly form = this.fb.group({
    property_id: [null as number | null, Validators.required],
    tenant_id: [null as number | null, Validators.required],
    type: [ViolationType.NOISE as string, Validators.required],
    severity: [ViolationSeverity.MEDIUM as string, Validators.required],
    description: ['', Validators.required],
    due_date: [null as string | null],
    fine_amount: [null as number | null, [Validators.min(0.01)]],
  });

  constructor() {
    this.loadProperties();
    this.loadTenants();
    this.load();
    this.loadStats();

    // Los filtros se aplican automáticamente al cambiar cualquier selector;
    // no requiere un botón "Aplicar".
    this.filterForm.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe(() => this.load());
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
    const params: Record<string, string | number> = { limit: 100 };
    if (filters.property_id) params['property_id'] = filters.property_id;
    if (filters.status) params['status'] = filters.status;
    if (filters.type) params['type'] = filters.type;
    if (filters.severity) params['severity'] = filters.severity;

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

  loadStats(): void {
    this.violationService.stats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(EMPTY_STATS),
    });
  }

  clearFilters(): void {
    // reset() emite valueChanges, lo que dispara load() automáticamente.
    this.filterForm.reset({ property_id: null, status: '', type: '', severity: '' });
  }

  statusTone(status: ViolationStatus): AppStatusTone {
    switch (status) {
      case ViolationStatus.OPEN:
        return 'warning';
      case ViolationStatus.NOTIFIED:
      case ViolationStatus.IN_PROGRESS:
        return 'info';
      case ViolationStatus.ESCALATED:
        return 'danger';
      case ViolationStatus.RESOLVED:
        return 'success';
      case ViolationStatus.DISMISSED:
        return 'neutral';
    }
  }

  severityTone(severity: ViolationSeverity): AppStatusTone {
    switch (severity) {
      case ViolationSeverity.LOW:
        return 'neutral';
      case ViolationSeverity.MEDIUM:
        return 'warning';
      case ViolationSeverity.HIGH:
        return 'danger';
    }
  }

  fineStatusTone(status: ViolationFineStatus): AppStatusTone {
    switch (status) {
      case ViolationFineStatus.CHARGED:
        return 'warning';
      case ViolationFineStatus.PAID:
        return 'success';
      case ViolationFineStatus.WAIVED:
      case ViolationFineStatus.NONE:
        return 'neutral';
    }
  }

  isOverdue(violation: Violation): boolean {
    return isViolationOverdue(violation);
  }

  openCreate(): void {
    this.form.reset({ type: ViolationType.NOISE, severity: ViolationSeverity.MEDIUM });
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

  // ─── Detalle / línea de tiempo ──────────────────────────────────────────────

  openDetail(violation: Violation): void {
    this.detail.set(violation);
    this.detailOpen.set(true);
    this.noteText.set('');
    this.fineAmount.set(violation.fine_amount ?? null);
    this.refreshDetail(violation.id);
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.detail.set(null);
  }

  changeStatus(status: ViolationStatus): void {
    const violation = this.detail();
    if (!violation) return;
    this.detailBusy.set(true);
    this.violationService.updateStatus(violation.id, status).subscribe({
      next: () => this.afterDetailMutation(violation.id, 'violations.statusUpdated'),
      error: (err: unknown) => this.detailError(err),
    });
  }

  addNote(): void {
    const violation = this.detail();
    const note = this.noteText().trim();
    if (!violation || !note) return;
    this.detailBusy.set(true);
    this.violationService.addNote(violation.id, note).subscribe({
      next: () => {
        this.noteText.set('');
        this.afterDetailMutation(violation.id, 'violations.noteAdded');
      },
      error: (err: unknown) => this.detailError(err),
    });
  }

  chargeFine(): void {
    const violation = this.detail();
    const amount = this.fineAmount();
    if (!violation || !amount || amount <= 0) {
      this.toast.error(this.transloco.translate('violations.fineAmountInvalid'));
      return;
    }
    this.detailBusy.set(true);
    this.violationService.chargeFine(violation.id, { amount }).subscribe({
      next: () => this.afterDetailMutation(violation.id, 'violations.fineCharged'),
      error: (err: unknown) => this.detailError(err),
    });
  }

  async waiveFine(): Promise<void> {
    const violation = this.detail();
    if (!violation) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('violations.waiveTitle'),
      message: this.transloco.translate('violations.waiveMessage'),
      confirmLabel: this.transloco.translate('violations.waive'),
      cancelLabel: this.transloco.translate('common.cancel'),
    });
    if (!confirmed) return;
    this.detailBusy.set(true);
    this.violationService.waiveFine(violation.id).subscribe({
      next: () => this.afterDetailMutation(violation.id, 'violations.fineWaived'),
      error: (err: unknown) => this.detailError(err),
    });
  }

  payFine(): void {
    const violation = this.detail();
    if (!violation) return;
    this.detailBusy.set(true);
    this.violationService.payFine(violation.id).subscribe({
      next: () => this.afterDetailMutation(violation.id, 'violations.finePaid'),
      error: (err: unknown) => this.detailError(err),
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
          this.refreshAll();
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
        if (this.detail()?.id === violation.id) {
          this.refreshDetail(violation.id);
        }
        this.refreshAll();
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.transloco.translate('violations.saveError'));
      },
    });
  }

  viewPdf(violation: Violation): void {
    this.fetchPdf(violation, (blob) => {
      // Abrir en pestaña nueva para visualizar; si el navegador bloquea el
      // popup, se descarga como respaldo.
      const opened = this.fileDownload.openBlob(blob);
      if (!opened) {
        this.downloadBlob(blob, `violacion_${violation.id}.pdf`);
      }
    });
  }

  isOpen(violation: Violation): boolean {
    return !CLOSED_VIOLATION_STATUSES.includes(violation.status);
  }

  isResolved(violation: Violation): boolean {
    return CLOSED_VIOLATION_STATUSES.includes(violation.status);
  }

  private afterDetailMutation(id: number, successKey: string): void {
    this.toast.success(this.transloco.translate(successKey));
    this.refreshDetail(id);
    this.refreshAll();
  }

  private detailError(err: unknown): void {
    this.detailBusy.set(false);
    this.toast.error(getApiErrorMessage(err, this.transloco.translate('violations.saveError')));
  }

  private refreshDetail(id: number): void {
    this.detailLoading.set(true);
    this.violationService.getById(id).subscribe({
      next: (violation) => {
        this.detail.set(violation);
        this.fineAmount.set(violation.fine_amount ?? null);
        this.detailLoading.set(false);
        this.detailBusy.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
        this.detailBusy.set(false);
      },
    });
  }

  private refreshAll(): void {
    this.load();
    this.loadStats();
  }

  private buildDto(): CreateViolationDto {
    const raw = this.form.getRawValue();
    return {
      property_id: raw.property_id!,
      tenant_id: raw.tenant_id!,
      type: raw.type as ViolationType,
      severity: raw.severity as ViolationSeverity,
      description: raw.description!,
      due_date: raw.due_date ?? undefined,
      fine_amount: raw.fine_amount ?? undefined,
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
    this.refreshAll();
  }

  private fetchPdf(violation: Violation, onBlob: (blob: Blob) => void): void {
    this.busyId.set(violation.id);
    this.violationService.downloadPdf(violation.id).subscribe({
      next: (blob) => {
        this.busyId.set(null);
        onBlob(blob);
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.transloco.translate('violations.pdfError'));
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    this.fileDownload.downloadBlob(blob, filename);
  }
}
