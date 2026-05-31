import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Eye, ShieldCheck } from 'lucide-angular';

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
  ];

  readonly actionOptions: AppSelectOption<string>[] = [
    { value: '', label: this.transloco.translate('audit.allActions') },
    ...this.actions.map((a) => ({
      value: a,
      label: this.transloco.translate(`audit.action.${a}`),
    })),
  ];

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
      return { key, before: b, after: a, changed: b !== a };
    });
  });

  constructor() {
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

  actionTone(action: string): AppStatusTone {
    switch (action) {
      case 'created':
      case 'approved':
      case 'signed':
        return 'success';
      case 'deleted':
      case 'rejected':
        return 'danger';
      case 'updated':
      case 'status_changed':
      case 'renewed':
      case 'permissions_updated':
        return 'warning';
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
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  }
}
