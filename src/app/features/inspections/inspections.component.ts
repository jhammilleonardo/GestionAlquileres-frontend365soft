import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, GitCompareArrows, Plus } from 'lucide-angular';

import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { InspectionCompareDialogComponent } from './components/inspection-compare-dialog/inspection-compare-dialog.component';
import { InspectionFiltersComponent } from './components/inspection-filters/inspection-filters.component';
import { InspectionFormDialogComponent } from './components/inspection-form-dialog/inspection-form-dialog.component';
import { InspectionTableComponent } from './components/inspection-table/inspection-table.component';
import { InspectionsFacade } from './inspections.facade';

@Component({
  selector: 'app-inspections',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    InspectionCompareDialogComponent,
    InspectionFiltersComponent,
    InspectionFormDialogComponent,
    InspectionTableComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'inspecciones', alias: 'inspections' })],
  templateUrl: './inspections.component.html',
  styleUrl: './inspections.component.scss',
})
export class InspectionsComponent extends InspectionsFacade {
  readonly Plus = Plus;
  readonly GitCompareArrows = GitCompareArrows;
}
