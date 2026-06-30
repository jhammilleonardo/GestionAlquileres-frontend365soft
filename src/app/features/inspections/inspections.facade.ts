import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';

import {
  CreateInspectionDto,
  CreateInspectionTemplateDto,
  DEFAULT_CHECKLIST,
  Inspection,
  InspectionArea,
  InspectionComparisonItem,
  InspectionStatus,
  InspectionTemplate,
  InspectionType,
  ItemCondition,
} from '../../core/models/inspection.model';
import { InspectionService } from '../../core/services/admin/inspection.service';
import { PropertyService } from '../../core/services/admin/property.service';
import { SlugService } from '../../core/services/slug.service';
import { toDateOnly } from '../../core/utils/date-only.util';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

export interface InspectionMetrics {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

@Injectable()
export class InspectionsFacade {
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
  readonly templates = signal<InspectionTemplate[]>([]);

  readonly dialogOpen = signal(false);
  readonly saving = signal(false);

  readonly compareOpen = signal(false);
  readonly comparison = signal<InspectionComparisonItem[] | null>(null);
  readonly comparing = signal(false);

  readonly templatesOpen = signal(false);
  readonly savingTemplate = signal(false);

  // Las traducciones del scope cargan async; este signal fuerza el recálculo de
  // las etiquetas cuando el scope termina de cargar (y al cambiar de idioma).
  private readonly translationsReady = toSignal(
    this.transloco.events$.pipe(filter((event) => event.type === 'translationLoadSuccess')),
    { initialValue: null },
  );

  readonly typeOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return Object.values(InspectionType).map((value) => ({
      value,
      label: this.transloco.translate(`inspections.type.${value}`),
    }));
  });

  readonly areaOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return Object.values(InspectionArea).map((value) => ({
      value,
      label: this.transloco.translate(`inspections.area.${value}`),
    }));
  });

  readonly statusFilterOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return [
      { value: '', label: this.transloco.translate('inspections.allStatuses') },
      ...Object.values(InspectionStatus).map((value) => ({
        value,
        label: this.transloco.translate(`inspections.status.${value}`),
      })),
    ];
  });

  readonly typeFilterOptions = computed<AppSelectOption<string>[]>(() => [
    { value: '', label: this.transloco.translate('inspections.allTypes') },
    ...this.typeOptions(),
  ]);

  readonly templateOptions = computed<AppSelectOption<number>[]>(() =>
    this.templates().map((template) => ({ value: template.id, label: template.name })),
  );

  readonly metrics = computed<InspectionMetrics>(() => {
    const list = this.inspections();
    const acc: InspectionMetrics = {
      total: list.length,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    };
    for (const inspection of list) {
      if (inspection.status === InspectionStatus.SCHEDULED) acc.scheduled++;
      else if (inspection.status === InspectionStatus.IN_PROGRESS) acc.inProgress++;
      else if (inspection.status === InspectionStatus.COMPLETED) acc.completed++;
      if (this.isOverdue(inspection)) acc.overdue++;
    }
    return acc;
  });

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
    template_id: [null as number | null],
  });

  readonly compareForm = this.fb.group({
    move_in: [null as number | null, Validators.required],
    move_out: [null as number | null, Validators.required],
  });

  constructor() {
    this.loadProperties();
    this.loadInspectors();
    this.loadTemplates();
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

  loadInspectors(): void {
    this.tenantUserService.getFilteredUsers({}).subscribe({
      next: (users) =>
        this.inspectorOptions.set(users.map((user) => ({ value: user.id, label: user.name }))),
      error: () => this.inspectorOptions.set([]),
    });
  }

  loadTemplates(): void {
    this.inspectionService.listTemplates().subscribe({
      next: (templates) => this.templates.set(templates),
      error: () => this.templates.set([]),
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

  isOverdue(inspection: Inspection): boolean {
    if (inspection.status === InspectionStatus.COMPLETED) {
      return false;
    }
    return new Date(inspection.scheduled_date) < new Date(new Date().toDateString());
  }

  openCreate(): void {
    const defaultTemplate = this.templates().find((template) => template.is_default);
    this.form.reset({
      type: InspectionType.MOVE_IN,
      scheduled_date: toDateOnly(new Date()),
      template_id: defaultTemplate?.id ?? null,
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

    this.saving.set(true);
    this.inspectionService.create(this.buildDto()).subscribe({
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
    const { move_in: moveIn, move_out: moveOut } = this.compareForm.getRawValue();
    this.comparing.set(true);
    this.inspectionService.compare(moveIn!, moveOut!).subscribe({
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

  // ─── Plantillas ─────────────────────────────────────────────────────────────

  openTemplates(): void {
    this.templatesOpen.set(true);
  }

  closeTemplates(): void {
    this.templatesOpen.set(false);
  }

  createTemplate(dto: CreateInspectionTemplateDto): void {
    this.savingTemplate.set(true);
    this.inspectionService.createTemplate(dto).subscribe({
      next: () => {
        this.savingTemplate.set(false);
        this.toast.success(this.transloco.translate('inspections.templateSaved'));
        this.loadTemplates();
      },
      error: (err: { error?: { message?: string } }) => {
        this.savingTemplate.set(false);
        this.toast.error(err.error?.message ?? this.transloco.translate('inspections.saveError'));
      },
    });
  }

  deleteTemplate(id: number): void {
    this.inspectionService.deleteTemplate(id).subscribe({
      next: () => {
        this.toast.success(this.transloco.translate('inspections.templateDeleted'));
        this.loadTemplates();
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error(err.error?.message ?? this.transloco.translate('inspections.saveError'));
      },
    });
  }

  conditionLabel(condition: ItemCondition | null): string {
    return condition ? this.transloco.translate(`inspections.condition.${condition}`) : '-';
  }

  moveInOptions(): AppSelectOption<number>[] {
    return this.inspections()
      .filter((inspection) => inspection.type === InspectionType.MOVE_IN)
      .map((inspection) => ({
        value: inspection.id,
        label: `#${inspection.id} · ${inspection.property_title} · ${inspection.scheduled_date.slice(0, 10)}`,
      }));
  }

  moveOutOptions(): AppSelectOption<number>[] {
    return this.inspections()
      .filter((inspection) => inspection.type === InspectionType.MOVE_OUT)
      .map((inspection) => ({
        value: inspection.id,
        label: `#${inspection.id} · ${inspection.property_title} · ${inspection.scheduled_date.slice(0, 10)}`,
      }));
  }

  private buildDto(): CreateInspectionDto {
    const raw = this.form.getRawValue();
    const base: CreateInspectionDto = {
      property_id: raw.property_id!,
      type: raw.type as InspectionType,
      scheduled_date: raw.scheduled_date!,
      inspector_user_id: raw.inspector_user_id ?? undefined,
    };

    // Con plantilla, el backend expande sus ítems. Sin plantilla y sin plantillas
    // cargadas, se cae al checklist base para no crear inspecciones vacías.
    if (raw.template_id) {
      return { ...base, template_id: raw.template_id };
    }
    if (this.templates().length === 0) {
      return {
        ...base,
        items: DEFAULT_CHECKLIST.flatMap((group) =>
          group.items.map((name) => ({
            area: group.area,
            item_name: name,
            condition: ItemCondition.GOOD,
          })),
        ),
      };
    }
    return base;
  }
}
