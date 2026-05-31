import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Plus, GitCompareArrows, ClipboardCheck } from 'lucide-angular';

import { InspectionService } from '../../core/services/admin/inspection.service';
import { PropertyService } from '../../core/services/admin/property.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { SlugService } from '../../core/services/slug.service';
import {
  CreateInspectionDto,
  DEFAULT_CHECKLIST,
  Inspection,
  InspectionComparisonItem,
  InspectionStatus,
  InspectionType,
  ItemCondition,
} from '../../core/models/inspection.model';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppDatePickerComponent } from '../../shared/ui/date-picker/date-picker.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-inspections',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SlicePipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppDatePickerComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'inspecciones', alias: 'inspections' })],
  templateUrl: './inspections.component.html',
  styleUrl: './inspections.component.scss',
})
export class InspectionsComponent {
  readonly Plus = Plus;
  readonly GitCompareArrows = GitCompareArrows;
  readonly ClipboardCheck = ClipboardCheck;

  private readonly fb = inject(FormBuilder);
  private readonly inspectionService = inject(InspectionService);
  private readonly propertyService = inject(PropertyService);
  private readonly tenantUserService = inject(TenantUserService);
  private readonly slugService = inject(SlugService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly inspections = signal<Inspection[]>([]);
  readonly isLoading = signal(true);

  readonly propertyOptions = signal<AppSelectOption<number>[]>([]);
  readonly inspectorOptions = signal<AppSelectOption<number>[]>([]);

  readonly dialogOpen = signal(false);
  readonly saving = signal(false);

  readonly compareOpen = signal(false);
  readonly comparison = signal<InspectionComparisonItem[] | null>(null);
  readonly comparing = signal(false);

  readonly typeOptions: AppSelectOption<string>[] = Object.values(InspectionType).map((value) => ({
    value,
    label: this.transloco.translate(`inspections.type.${value}`),
  }));

  readonly statusFilterOptions: AppSelectOption<string>[] = [
    { value: '', label: this.transloco.translate('inspections.allStatuses') },
    ...Object.values(InspectionStatus).map((value) => ({
      value,
      label: this.transloco.translate(`inspections.status.${value}`),
    })),
  ];

  readonly filterForm = this.fb.group({
    property_id: [null as number | null],
    status: [''],
    type: [''],
  });

  readonly form = this.fb.group({
    property_id: [null as number | null, Validators.required],
    type: [InspectionType.MOVE_IN as string, Validators.required],
    scheduled_date: ['', Validators.required],
    inspector_user_id: [null as number | null],
  });

  // Comparativo
  readonly compareForm = this.fb.group({
    move_in: [null as number | null, Validators.required],
    move_out: [null as number | null, Validators.required],
  });

  constructor() {
    this.loadProperties();
    this.loadInspectors();
    this.load();
  }

  private loadProperties(): void {
    this.propertyService.getAdminProperties().subscribe({
      next: (properties) =>
        this.propertyOptions.set(properties.map((p) => ({ value: p.id, label: p.title }))),
      error: () => this.propertyOptions.set([]),
    });
  }

  private loadInspectors(): void {
    this.tenantUserService.getFilteredUsers({}).subscribe({
      next: (users) =>
        this.inspectorOptions.set(users.map((u) => ({ value: u.id, label: u.name }))),
      error: () => this.inspectorOptions.set([]),
    });
  }

  load(): void {
    this.isLoading.set(true);
    const filters = this.filterForm.value;
    const params: Record<string, string | number> = {};
    if (filters.property_id) params['property_id'] = filters.property_id;
    if (filters.status) params['status'] = filters.status;
    if (filters.type) params['type'] = filters.type;

    this.inspectionService.list(params).subscribe({
      next: (data) => {
        this.inspections.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.inspections.set([]);
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

  statusTone(status: InspectionStatus): AppStatusTone {
    switch (status) {
      case InspectionStatus.SCHEDULED:
        return 'info';
      case InspectionStatus.IN_PROGRESS:
        return 'warning';
      case InspectionStatus.COMPLETED:
        return 'success';
    }
  }

  // ── Crear ──
  openCreate(): void {
    this.form.reset({
      type: InspectionType.MOVE_IN,
      scheduled_date: new Date().toISOString().slice(0, 10),
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
    // Sembrar checklist por defecto (áreas agrupadas con ítems base, condición GOOD)
    const items = DEFAULT_CHECKLIST.flatMap((group) =>
      group.items.map((name) => ({
        area: group.area,
        item_name: name,
        condition: ItemCondition.GOOD,
      })),
    );
    const dto: CreateInspectionDto = {
      property_id: raw.property_id!,
      type: raw.type as InspectionType,
      scheduled_date: raw.scheduled_date!,
      inspector_user_id: raw.inspector_user_id ?? undefined,
      items,
    };

    this.saving.set(true);
    this.inspectionService.create(dto).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.dialogOpen.set(false);
        this.toast.success(this.transloco.translate('inspections.created'));
        this.openDetail(created.id);
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.toast.error(err.error?.message ?? this.transloco.translate('inspections.saveError'));
      },
    });
  }

  openDetail(id: number): void {
    const slug = this.slugService.getSlug();
    void this.router.navigate([slug, 'inspecciones', id]);
  }

  // ── Comparar ──
  openCompare(): void {
    this.comparison.set(null);
    this.compareForm.reset({ move_in: null, move_out: null });
    this.compareOpen.set(true);
  }

  closeCompare(): void {
    this.compareOpen.set(false);
  }

  runCompare(): void {
    if (this.compareForm.invalid) {
      this.compareForm.markAllAsTouched();
      return;
    }
    const { move_in, move_out } = this.compareForm.getRawValue();
    this.comparing.set(true);
    this.inspectionService.compare(move_in!, move_out!).subscribe({
      next: (result) => {
        this.comparing.set(false);
        this.comparison.set(result);
      },
      error: (err: { error?: { message?: string } }) => {
        this.comparing.set(false);
        this.toast.error(
          err.error?.message ?? this.transloco.translate('inspections.compareError'),
        );
      },
    });
  }

  conditionLabel(condition: ItemCondition | null): string {
    return condition ? this.transloco.translate(`inspections.condition.${condition}`) : '—';
  }

  // Inspecciones move_in / move_out para los selects del comparativo
  moveInOptions(): AppSelectOption<number>[] {
    return this.inspections()
      .filter((i) => i.type === InspectionType.MOVE_IN)
      .map((i) => ({
        value: i.id,
        label: `#${i.id} · ${i.property_title} · ${i.scheduled_date.slice(0, 10)}`,
      }));
  }

  moveOutOptions(): AppSelectOption<number>[] {
    return this.inspections()
      .filter((i) => i.type === InspectionType.MOVE_OUT)
      .map((i) => ({
        value: i.id,
        label: `#${i.id} · ${i.property_title} · ${i.scheduled_date.slice(0, 10)}`,
      }));
  }
}
