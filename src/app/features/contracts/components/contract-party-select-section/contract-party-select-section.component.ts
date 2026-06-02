import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-contract-party-select-section',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, AppSelectComponent],
  templateUrl: './contract-party-select-section.component.html',
  styleUrl: './contract-party-select-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractPartySelectSectionComponent {
  readonly form = input.required<FormGroup>();
  readonly tenantOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();

  hasError(controlName: string): boolean {
    const control = this.form().get(controlName);
    return Boolean(control?.invalid && control?.touched);
  }
}
