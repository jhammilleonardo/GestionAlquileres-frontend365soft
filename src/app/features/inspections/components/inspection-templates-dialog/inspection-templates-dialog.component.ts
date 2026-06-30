import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';

import {
  CreateInspectionTemplateDto,
  InspectionArea,
  InspectionTemplate,
  InspectionTemplateItem,
} from '../../../../core/models/inspection.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-inspection-templates-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './inspection-templates-dialog.component.html',
  styleUrl: '../../inspections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionTemplatesDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input.required<boolean>();
  readonly templates = input.required<readonly InspectionTemplate[]>();
  readonly areaOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly saving = input.required<boolean>();

  readonly closed = output<void>();
  readonly created = output<CreateInspectionTemplateDto>();
  readonly deleted = output<number>();

  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  readonly draftItems = signal<InspectionTemplateItem[]>([]);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    area: [InspectionArea.LIVING_ROOM as string, Validators.required],
    item_name: [''],
  });

  readonly canSubmit = computed(() => this.draftItems().length > 0);

  areaLabel(area: string): string {
    return this.areaOptions().find((option) => option.value === area)?.label ?? area;
  }

  addItem(): void {
    const { area, item_name } = this.form.getRawValue();
    const name = (item_name ?? '').trim();
    if (!name) {
      return;
    }
    this.draftItems.update((items) => [
      ...items,
      { area: area as InspectionArea, item_name: name },
    ]);
    this.form.patchValue({ item_name: '' });
  }

  removeItem(index: number): void {
    this.draftItems.update((items) => items.filter((_, i) => i !== index));
  }

  submit(): void {
    const name = (this.form.getRawValue().name ?? '').trim();
    if (!name || this.draftItems().length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.created.emit({ name, items: this.draftItems() });
    this.resetDraft();
  }

  onClose(): void {
    this.resetDraft();
    this.closed.emit();
  }

  private resetDraft(): void {
    this.draftItems.set([]);
    this.form.reset({ name: '', area: InspectionArea.LIVING_ROOM, item_name: '' });
  }
}
