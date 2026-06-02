import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

import { Property } from '../../core/models/property.model';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PropertyDeleteDialogComponent } from './components/property-delete-dialog/property-delete-dialog.component';
import { PropertyFiltersComponent } from './components/property-filters/property-filters.component';
import { PropertyFormDialogComponent } from './components/property-form-dialog/property-form-dialog.component';
import { PropertyListSectionComponent } from './components/property-list-section/property-list-section.component';
import { PropertiesFacade } from './properties.facade';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppPageHeaderComponent,
    PropertyDeleteDialogComponent,
    PropertyFiltersComponent,
    PropertyFormDialogComponent,
    PropertyListSectionComponent,
  ],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
  providers: [
    provideTranslocoScope({ scope: 'propiedades', alias: 'properties' }),
    PropertiesFacade,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesComponent {
  readonly propiedades = inject(PropertiesFacade);

  readonly Plus = Plus;
  readonly resolvePropertyImage = (property: Property): string =>
    this.propiedades.getPropertyImage(property);
}
