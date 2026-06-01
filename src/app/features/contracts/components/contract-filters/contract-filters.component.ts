import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, RefreshCw, X } from 'lucide-angular';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-contract-filters',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './contract-filters.component.html',
  styleUrl: '../../contracts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractFiltersComponent {
  readonly searchTerm = input.required<string>();
  readonly statusFilter = input.required<string>();
  readonly statusOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly hasActiveFilters = input.required<boolean>();

  readonly searchTermChanged = output<string>();
  readonly statusFilterChanged = output<string>();
  readonly filtersCleared = output<void>();
  readonly refreshed = output<void>();

  readonly X = X;
  readonly RefreshCw = RefreshCw;
}
