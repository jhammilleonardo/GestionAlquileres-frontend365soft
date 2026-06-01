import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Filter, LucideAngularModule } from 'lucide-angular';

import { PropertyFilters, PropertyStatus } from '../../../../core/models/property.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-property-filters',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './property-filters.component.html',
  styleUrl: './property-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFiltersComponent {
  readonly Filter = Filter;

  readonly filters = input.required<PropertyFilters>();
  readonly statusOptions = input.required<readonly AppSelectOption<PropertyStatus>[]>();
  readonly propertyTypeOptions = input.required<readonly AppSelectOption<number>[]>();

  readonly statusChanged = output<PropertyStatus | null>();
  readonly propertyTypeChanged = output<number | null>();
  readonly cleared = output<void>();
  readonly applied = output<void>();
}
