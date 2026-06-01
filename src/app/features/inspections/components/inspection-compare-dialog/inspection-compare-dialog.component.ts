import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { InspectionComparisonItem } from '../../../../core/models/inspection.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppEmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-inspection-compare-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AppEmptyStateComponent,
    AppSelectComponent,
  ],
  templateUrl: './inspection-compare-dialog.component.html',
  styleUrl: '../../inspections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionCompareDialogComponent {
  readonly open = input.required<boolean>();
  readonly form = input.required<FormGroup>();
  readonly moveInOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly moveOutOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly comparing = input.required<boolean>();
  readonly comparison = input.required<readonly InspectionComparisonItem[] | null>();

  readonly closed = output<void>();
  readonly compared = output<void>();
}
