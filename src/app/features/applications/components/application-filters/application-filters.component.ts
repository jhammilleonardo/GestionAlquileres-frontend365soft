import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, X } from 'lucide-angular';

import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-application-filters',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './application-filters.component.html',
  styleUrl: '../../applications.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationFiltersComponent {
  readonly searchTerm = input.required<string>();
  readonly selectedStatus = input.required<string>();
  readonly statusOptions = input.required<readonly AppSelectOption<string>[]>();

  readonly searchTermChanged = output<string>();
  readonly selectedStatusChanged = output<string>();
  readonly searchCleared = output<void>();

  readonly X = X;
}
