import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import {
  AdminOperationsService,
  ApiRecord,
} from '../../core/services/admin/admin-operations.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppTableColumn, AppTableComponent } from '../../shared/ui/table/table.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';

import { getApiErrorMessage } from '../../core/http/http-error.util';
export type AdminResourceKind = 'vendors' | 'expenses' | 'violations' | 'inspections';

type FieldType = 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea';

interface ResourceField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: AppSelectOption[];
}

interface ResourceMeta {
  title: string;
  description: string;
  empty: string;
  columns: AppTableColumn<ApiRecord>[];
  createLabel: string;
  fields: ResourceField[];
}

const VENDOR_SPECIALTY_OPTIONS: AppSelectOption[] = [
  { value: 'plumbing', label: 'Plomería' },
  { value: 'electrical', label: 'Electricidad' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'painting', label: 'Pintura' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Otro' },
];

const VIOLATION_TYPE_OPTIONS: AppSelectOption[] = [
  { value: 'noise', label: 'Ruido' },
  { value: 'pets', label: 'Mascotas' },
  { value: 'parking', label: 'Estacionamiento' },
  { value: 'damage', label: 'Daño' },
  { value: 'cleanliness', label: 'Limpieza' },
  { value: 'other', label: 'Otro' },
];

const INSPECTION_TYPE_OPTIONS: AppSelectOption[] = [
  { value: 'move_in', label: 'Entrada' },
  { value: 'move_out', label: 'Salida' },
  { value: 'periodic', label: 'Periódica' },
];

const EXPENSE_CATEGORY_OPTIONS: AppSelectOption[] = [
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'INSURANCE', label: 'Seguro' },
  { value: 'TAX', label: 'Impuesto' },
  { value: 'UTILITIES', label: 'Servicios' },
  { value: 'MANAGEMENT_FEE', label: 'Comisión gestión' },
  { value: 'CLEANING', label: 'Limpieza' },
  { value: 'OTHER', label: 'Otro' },
];

const CURRENCY_OPTIONS: AppSelectOption[] = [
  { value: 'BOB', label: 'BOB — Boliviano' },
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'GTQ', label: 'GTQ — Quetzal' },
  { value: 'HNL', label: 'HNL — Lempira' },
];

const RESOURCE_META: Record<AdminResourceKind, ResourceMeta> = {
  vendors: {
    title: 'Proveedores',
    description: 'Directorio de proveedores externos y técnicos de confianza.',
    empty: 'No hay proveedores registrados.',
    createLabel: 'Nuevo proveedor',
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'specialty', label: 'Especialidad' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'email', label: 'Email' },
      { key: 'average_rating', label: 'Rating', align: 'right' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      {
        key: 'specialty',
        label: 'Especialidad',
        type: 'select',
        required: true,
        options: VENDOR_SPECIALTY_OPTIONS,
      },
      { key: 'phone', label: 'Teléfono', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
    ],
  },
  expenses: {
    title: 'Gastos',
    description: 'Registro operativo de gastos por propiedad, categoría y período.',
    empty: 'No hay gastos registrados.',
    createLabel: 'Nuevo gasto',
    columns: [
      { key: 'date', label: 'Fecha' },
      { key: 'category', label: 'Categoría' },
      { key: 'description', label: 'Descripción' },
      { key: 'amount', label: 'Monto', align: 'right' },
      { key: 'currency', label: 'Moneda' },
    ],
    fields: [
      { key: 'property_id', label: 'ID Propiedad', type: 'number', required: true },
      {
        key: 'category',
        label: 'Categoría',
        type: 'select',
        required: true,
        options: EXPENSE_CATEGORY_OPTIONS,
      },
      { key: 'amount', label: 'Monto', type: 'number', required: true },
      {
        key: 'currency',
        label: 'Moneda',
        type: 'select',
        required: true,
        options: CURRENCY_OPTIONS,
      },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'date', label: 'Fecha', type: 'date', required: true },
    ],
  },
  violations: {
    title: 'Violaciones',
    description: 'Seguimiento de infracciones, evidencia y notificaciones formales.',
    empty: 'No hay violaciones registradas.',
    createLabel: 'Nueva violación',
    columns: [
      { key: 'type', label: 'Tipo' },
      { key: 'description', label: 'Descripción' },
      { key: 'status', label: 'Estado' },
      { key: 'created_at', label: 'Fecha' },
    ],
    fields: [
      { key: 'property_id', label: 'ID Propiedad', type: 'number', required: true },
      { key: 'tenant_id', label: 'ID Inquilino', type: 'number', required: true },
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: VIOLATION_TYPE_OPTIONS,
      },
      { key: 'description', label: 'Descripción', type: 'textarea', required: true },
    ],
  },
  inspections: {
    title: 'Inspecciones',
    description: 'Inspecciones de entrada, salida y revisiones periódicas.',
    empty: 'No hay inspecciones registradas.',
    createLabel: 'Nueva inspección',
    columns: [
      { key: 'type', label: 'Tipo' },
      { key: 'status', label: 'Estado' },
      { key: 'scheduled_date', label: 'Programada' },
      { key: 'completed_date', label: 'Completada' },
    ],
    fields: [
      { key: 'property_id', label: 'ID Propiedad', type: 'number', required: true },
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: INSPECTION_TYPE_OPTIONS,
      },
      { key: 'scheduled_date', label: 'Fecha programada', type: 'date', required: true },
      { key: 'notes', label: 'Notas', type: 'textarea' },
    ],
  },
};

@Component({
  selector: 'app-admin-resource-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AppButtonComponent,
    AppDialogComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppTableComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
  ],
  template: `
    <section class="page">
      <app-page-header [title]="meta().title" [description]="meta().description">
        <div actions class="header-actions">
          <app-button appearance="secondary" size="s" (clicked)="load()">Recargar</app-button>
          @if (items().length > 0) {
            <app-button appearance="secondary" size="s" (clicked)="exportCsv()"
              >Exportar CSV</app-button
            >
          }
          <app-button size="s" (clicked)="openCreateDialog()">{{ meta().createLabel }}</app-button>
        </div>
      </app-page-header>

      @if (isLoading()) {
        <app-loading-state label="Cargando datos..." />
      } @else if (items().length === 0) {
        <app-empty-state
          [title]="meta().empty"
          description="Cuando existan datos aparecerán aquí."
        />
      } @else {
        <div class="table-wrapper">
          <app-table
            [columns]="meta().columns"
            [items]="items()"
            [emptyText]="meta().empty"
            [ariaLabel]="meta().title"
            [actionsTemplate]="rowActionsTpl"
          />
        </div>
      }

      <ng-template #rowActionsTpl let-item>
        <div class="row-actions">
          <button
            type="button"
            class="view-btn"
            (click)="openDetail(item)"
            aria-label="Ver detalle"
          >
            👁
          </button>
          <button
            type="button"
            class="delete-btn"
            (click)="deleteItem(item.id)"
            aria-label="Eliminar"
          >
            ✕
          </button>
        </div>
      </ng-template>
    </section>

    <!-- Detail Dialog (read-only) -->
    <app-dialog
      [open]="detailItem() !== null"
      [title]="meta().title + ' — detalle'"
      (closeDialog)="closeDetail()"
    >
      @if (detailItem(); as item) {
        <dl class="detail-list">
          @for (entry of detailEntries(); track entry.key) {
            <div class="detail-row">
              <dt>{{ entry.key }}</dt>
              <dd>{{ entry.value }}</dd>
            </div>
          }
        </dl>
      }
      <div class="dialog-actions">
        <app-button type="button" appearance="secondary" (clicked)="closeDetail()">
          Cerrar
        </app-button>
      </div>
    </app-dialog>

    <!-- Create Dialog -->
    <app-dialog
      [open]="showCreateDialog()"
      [title]="meta().createLabel"
      (closeDialog)="closeCreateDialog()"
    >
      <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="create-form">
        @for (field of meta().fields; track field.key) {
          <div class="field-group">
            @if (field.type === 'select') {
              <app-select
                [formControlName]="field.key"
                [label]="field.label"
                [options]="field.options ?? []"
                [required]="field.required ?? false"
              />
            } @else if (field.type === 'textarea') {
              <app-textarea [formControlName]="field.key" [label]="field.label" />
            } @else if (field.type === 'date') {
              <label class="native-label">
                {{ field.label }}
                <input
                  type="date"
                  class="native-date-input"
                  [formControlName]="field.key"
                  [required]="field.required ?? false"
                />
              </label>
            } @else {
              <app-text-field
                [formControlName]="field.key"
                [label]="field.label"
                [type]="
                  field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'
                "
                [required]="field.required ?? false"
              />
            }
          </div>
        }

        @if (createError()) {
          <div class="form-error" role="alert">{{ createError() }}</div>
        }

        <div class="dialog-actions">
          <app-button type="button" appearance="secondary" (clicked)="closeCreateDialog()">
            Cancelar
          </app-button>
          <app-button
            type="submit"
            [disabled]="createForm.invalid || saving()"
            [loading]="saving()"
          >
            Guardar
          </app-button>
        </div>
      </form>
    </app-dialog>
  `,
  styles: `
    .page {
      display: grid;
      gap: var(--app-space-5);
      padding: var(--app-space-6);
    }
    .header-actions {
      display: flex;
      gap: var(--app-space-2);
    }
    .table-wrapper {
      overflow-x: auto;
    }
    .row-actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
    }
    .view-btn,
    .delete-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: var(--app-radius-sm);
      font-size: 0.875rem;
    }
    .view-btn {
      color: var(--app-color-primary);
    }
    .view-btn:hover {
      background: color-mix(in srgb, var(--app-color-primary) 12%, transparent);
    }
    .delete-btn {
      color: #ef4444;
    }
    .delete-btn:hover {
      background: #fee2e2;
    }
    .detail-list {
      display: grid;
      gap: var(--app-space-2);
      margin: 0 0 var(--app-space-4);
    }
    .detail-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: var(--app-space-3);
      padding: var(--app-space-2) 0;
      border-bottom: 1px solid var(--app-color-border);
    }
    .detail-row dt {
      font-weight: 600;
      color: var(--app-color-text-muted);
      font-size: 0.8125rem;
      text-transform: capitalize;
    }
    .detail-row dd {
      margin: 0;
      color: var(--app-color-text);
      word-break: break-word;
    }
    .native-label {
      display: grid;
      gap: var(--app-space-1);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--app-color-text);
    }
    .native-date-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      font: inherit;
      font-size: 0.875rem;
      color: var(--app-color-text);
      background: var(--app-color-surface);
    }
    .create-form {
      display: grid;
      gap: var(--app-space-4);
    }
    .field-group {
      display: grid;
    }
    .form-error {
      padding: var(--app-space-3);
      background: #fee2e2;
      color: #dc2626;
      border-radius: var(--app-radius-md);
      font-size: 0.875rem;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--app-space-3);
      padding-top: var(--app-space-4);
      border-top: 1px solid var(--app-color-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminResourceListComponent {
  readonly kind = input.required<AdminResourceKind>();

  private readonly operations = inject(AdminOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal(true);
  readonly saving = signal(false);
  readonly items = signal<ApiRecord[]>([]);
  readonly showCreateDialog = signal(false);
  readonly createError = signal<string | null>(null);
  readonly detailItem = signal<ApiRecord | null>(null);
  readonly meta = computed(() => RESOURCE_META[this.kind()]);

  /** Pares clave/valor legibles del registro seleccionado para el detalle. */
  readonly detailEntries = computed<{ key: string; value: string }[]>(() => {
    const item = this.detailItem();
    if (!item) return [];
    return Object.entries(item)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => ({
        key: key.replace(/_/g, ' '),
        value: this.formatValue(value),
      }));
  });

  @ViewChild('rowActionsTpl') rowActionsTpl!: TemplateRef<{ $implicit: ApiRecord }>;

  readonly createForm: UntypedFormGroup = this.fb.group({});

  constructor() {
    queueMicrotask(() => this.load());
  }

  openDetail(item: ApiRecord): void {
    this.detailItem.set(item);
  }

  /** Exporta los registros visibles a un archivo CSV descargable. */
  exportCsv(): void {
    const rows = this.items();
    if (rows.length === 0) return;

    const columns = this.meta().columns.map((c) => c.key);
    const escape = (val: unknown): string => {
      const str = this.formatValue(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = columns.join(',');
    const body = rows
      .map((row) => columns.map((col) => escape((row as Record<string, unknown>)[col])).join(','))
      .join('\n');
    const csv = `${header}\n${body}`;

    const bom = String.fromCharCode(0xfeff); // BOM para que Excel reconozca UTF-8
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.kind()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('CSV exportado');
  }

  closeDetail(): void {
    this.detailItem.set(null);
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  }

  load(): void {
    this.isLoading.set(true);
    this.resolveLoader()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: (error: Error) => this.toast.error(error.message),
      });
  }

  openCreateDialog(): void {
    this.buildCreateForm();
    this.createError.set(null);
    this.showCreateDialog.set(true);
  }

  closeCreateDialog(): void {
    this.showCreateDialog.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.createError.set(null);
    const body = this.createForm.value as Record<string, unknown>;

    this.resolveCreator(body)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (created) => {
          this.items.update((prev) => [created, ...prev]);
          this.toast.success('Registro creado exitosamente');
          this.closeCreateDialog();
        },
        error: (err: { error?: { message?: string } }) => {
          this.createError.set(getApiErrorMessage(err, 'Error al crear el registro'));
        },
      });
  }

  async deleteItem(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar registro',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.resolveDeleter(id).subscribe({
      next: () => {
        this.items.update((prev) => prev.filter((item) => item.id !== id));
        this.toast.success('Registro eliminado');
      },
      error: (error: Error) => this.toast.error(error.message),
    });
  }

  private buildCreateForm(): void {
    Object.keys(this.createForm.controls).forEach((key) => this.createForm.removeControl(key));
    for (const field of this.meta().fields) {
      const defaultValue = field.type === 'number' ? null : '';
      this.createForm.addControl(
        field.key,
        this.fb.control(defaultValue, field.required ? [Validators.required] : []),
      );
    }
  }

  private resolveLoader(): Observable<ApiRecord[]> {
    switch (this.kind()) {
      case 'vendors':
        return this.operations.getVendors();
      case 'expenses':
        return this.operations.getExpenses();
      case 'violations':
        return this.operations.getViolations();
      case 'inspections':
        return this.operations.getInspections();
    }
  }

  private resolveCreator(body: Record<string, unknown>): Observable<ApiRecord> {
    switch (this.kind()) {
      case 'vendors':
        return this.operations.createVendor(body);
      case 'expenses':
        return this.operations.createExpense(body);
      case 'violations':
        return this.operations.createViolation(body);
      case 'inspections':
        return this.operations.createInspection(body);
    }
  }

  private resolveDeleter(id: number): Observable<void> {
    switch (this.kind()) {
      case 'vendors':
        return this.operations.deleteVendor(id);
      case 'expenses':
        return this.operations.deleteExpense(id);
      case 'violations':
        return this.operations.deleteViolation(id);
      case 'inspections':
        return this.operations.deleteInspection(id);
    }
  }
}
