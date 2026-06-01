import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, Building2, Plus, Trash2 } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PropertyCardComponent } from './components/property-card/property-card.component';
import { PropertyFiltersComponent } from './components/property-filters/property-filters.component';
import { PropertyFormDialogComponent } from './components/property-form-dialog/property-form-dialog.component';
import { PropertiesFacade } from './properties.facade';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    PropertyCardComponent,
    PropertyFiltersComponent,
    PropertyFormDialogComponent,
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

  readonly Building2 = Building2;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
}
