import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Eye, ShieldCheck, Download } from 'lucide-angular';

import { AuditLog, AuditService } from '../../core/services/admin/audit.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppDatePickerComponent } from '../../shared/ui/date-picker/date-picker.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';

interface DiffRow {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppTextFieldComponent,
    AppSelectComponent,
    AppDatePickerComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'auditoria', alias: 'audit' })],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss',
})
export class AuditComponent {
  readonly Eye = Eye;
  readonly ShieldCheck = ShieldCheck;
  readonly Download = Download;

  private readonly fb = inject(FormBuilder);
  private readonly auditService = inject(AuditService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly logs = signal<AuditLog[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly isLoading = signal(false);
  readonly loadingMore = signal(false);

  readonly selected = signal<AuditLog | null>(null);
  readonly isExporting = signal(false);

  private readonly limit = 20;

  readonly actions = [
    'created',
    'updated',
    'deleted',
    'approved',
    'rejected',
    'status_changed',
    'signed',
    'renewed',
    'permissions_updated',
    'logged_in',
    'login_failed',
    'logged_out',
    'password_changed',
  ];

  /**
   * Se recalcula cada vez que Transloco emite (carga del scope lazy `auditoria` o
   * cambio de idioma). Sin esto, al construirse el componente el scope aún no está
   * cargado y `translate(...)` devolvería las claves crudas en el desplegable.
   */
  private readonly translationTick = signal(0);

  readonly actionOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationTick();
    return [
      { value: '', label: this.transloco.translate('audit.allActions') },
      ...this.actions.map((a) => ({
        value: a,
        label: this.transloco.translate(`audit.action.${a}`),
      })),
    ];
  });

  readonly filterForm = this.fb.group({
    user_id: [''],
    entity_type: [''],
    action: [''],
    from: [''],
    to: [''],
  });

  readonly hasMore = computed(() => this.logs().length < this.total());

  readonly diffRows = computed<DiffRow[]>(() => {
    const log = this.selected();
    if (!log) return [];
    const before = log.old_values ?? {};
    const after = log.new_values ?? {};
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    return keys.map((key) => {
      const b = this.fmt(before[key]);
      const a = this.fmt(after[key]);
      return { key, label: this.fieldLabel(key), before: b, after: a, changed: b !== a };
    });
  });

  constructor() {
    // Reconstruye las opciones traducidas cuando el scope lazy termina de cargar
    // o cuando cambia el idioma en runtime.
    this.transloco.events$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.translationTick.update((n) => n + 1));
    this.load(true);
  }

  load(reset: boolean): void {
    if (reset) {
      this.page.set(1);
      this.isLoading.set(true);
    } else {
      this.loadingMore.set(true);
    }
    const f = this.filterForm.value;
    const params: Record<string, string | number> = { page: this.page(), limit: this.limit };
    if (f.user_id) params['user_id'] = f.user_id;
    if (f.entity_type) params['entity_type'] = f.entity_type;
    if (f.action) params['action'] = f.action;
    if (f.from) params['from'] = f.from;
    if (f.to) params['to'] = f.to;

    this.auditService.list(params).subscribe({
      next: (res) => {
        this.total.set(res.total);
        this.logs.update((prev) => (reset ? res.data : [...prev, ...res.data]));
        this.isLoading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadingMore.set(false);
        this.toast.error(this.transloco.translate('audit.loadError'));
      },
    });
  }

  applyFilters(): void {
    this.load(true);
  }

  clearFilters(): void {
    this.filterForm.reset({ user_id: '', entity_type: '', action: '', from: '', to: '' });
    this.load(true);
  }

  loadMore(): void {
    this.page.update((p) => p + 1);
    this.load(false);
  }

  exportCsv(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    const f = this.filterForm.value;
    const params: Record<string, string> = {};
    if (f.user_id) params['user_id'] = f.user_id;
    if (f.entity_type) params['entity_type'] = f.entity_type;
    if (f.action) params['action'] = f.action;
    if (f.from) params['from'] = f.from;
    if (f.to) params['to'] = f.to;

    this.auditService.exportCsv(params).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `auditoria-${new Date().toISOString().slice(0, 10)}.csv`);
        this.isExporting.set(false);
      },
      error: () => {
        this.isExporting.set(false);
        this.toast.error(this.transloco.translate('audit.exportError'));
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  userLabel(log: AuditLog): string {
    if (log.user_name) return log.user_name;
    if (log.user_email) return log.user_email;
    if (log.user_id != null) {
      return `${this.transloco.translate('audit.userId')} #${log.user_id}`;
    }
    return this.transloco.translate('audit.system');
  }

  roleLabel(role: string | null): string | null {
    if (!role) return null;
    return this.translateOrRaw('audit.role.', role);
  }

  entityLabel(log: AuditLog): string {
    const typeName = this.translateOrRaw('audit.entityType.', log.entity_type);
    // Si la entidad sigue existiendo mostramos su nombre/número legible; si fue
    // eliminada caemos al id interno para no perder la trazabilidad.
    return log.entity_label ? `${typeName}: ${log.entity_label}` : `${typeName} #${log.entity_id}`;
  }

  fieldLabel(key: string): string {
    return this.translateOrRaw('audit.fields.', key);
  }

  /** Traduce un token con el prefijo dado; si no hay traducción, devuelve el valor crudo. */
  private translateOrRaw(prefix: string, token: string): string {
    const key = `${prefix}${token}`;
    const translated = this.transloco.translate(key);
    return translated === key ? token : translated;
  }

  actionTone(action: string): AppStatusTone {
    switch (action) {
      case 'created':
      case 'approved':
      case 'signed':
      case 'logged_in':
        return 'success';
      case 'deleted':
      case 'rejected':
      case 'login_failed':
        return 'danger';
      case 'updated':
      case 'status_changed':
      case 'renewed':
      case 'permissions_updated':
      case 'password_changed':
        return 'warning';
      case 'logged_out':
        return 'info';
      default:
        return 'neutral';
    }
  }

  openDetail(log: AuditLog): void {
    this.selected.set(log);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  private fmt(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') {
      return this.transloco.translate(value ? 'common.yes' : 'common.no');
    }
    if (typeof value === 'string') return this.translateOrRaw('audit.value.', value);
    if (typeof value === 'number') return String(value);
    return JSON.stringify(value);
  }
}
