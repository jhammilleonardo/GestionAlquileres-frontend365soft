import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Filter, X, LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { PropertyFilters, PropertyStatus } from '../../../../core/models/property.model';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-property-filters',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './property-filters.component.html',
  styleUrl: './property-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFiltersComponent {
  readonly Filter = Filter;
  readonly X = X;

  private readonly destroyRef = inject(DestroyRef);

  readonly filters = input.required<PropertyFilters>();
  readonly statusOptions = input.required<readonly AppSelectOption<PropertyStatus>[]>();
  readonly propertyTypeOptions = input.required<readonly AppSelectOption<number>[]>();

  readonly searchChanged = output<string>();
  readonly statusChanged = output<PropertyStatus | null>();
  readonly propertyTypeChanged = output<number | null>();
  readonly cleared = output<void>();

  /**
   * Valor visible del buscador. Se reinicia solo cuando el padre reemplaza el
   * objeto de filtros (al limpiar); mientras el usuario escribe, manda lo local.
   */
  readonly searchValue = linkedSignal(() => this.filters().search ?? '');

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    // El buscador aplica solo, con un respiro para no consultar en cada tecla.
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.searchChanged.emit(value));
  }

  protected hasActiveFilters(): boolean {
    const f = this.filters();
    return !!((f.search && f.search.trim()) || f.status || f.property_type_id);
  }

  protected onSearchInput(value: string): void {
    this.searchValue.set(value);
    this.searchInput$.next(value);
  }

  protected onClear(): void {
    this.searchValue.set('');
    this.cleared.emit();
  }
}
