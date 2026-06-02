import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Save, X } from 'lucide-angular';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-contract-form-actions',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule, AppButtonComponent],
  templateUrl: './contract-form-actions.component.html',
  styleUrl: './contract-form-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractFormActionsComponent {
  readonly invalid = input(false);
  readonly submitting = input(false);
  readonly idleLabelKey = input.required<string>();
  readonly submittingLabelKey = input.required<string>();

  readonly cancelled = output<void>();

  readonly Save = Save;
  readonly X = X;
}
