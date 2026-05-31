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
import { PropiedadesFacade } from './propiedades.facade';

@Component({
  selector: 'app-propiedades',
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
  templateUrl: './propiedades.component.html',
  styleUrl: './propiedades.component.scss',
  providers: [
    provideTranslocoScope({ scope: 'propiedades', alias: 'properties' }),
    PropiedadesFacade,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropiedadesComponent {
  readonly propiedades = inject(PropiedadesFacade);

  readonly Building2 = Building2;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
}
