import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Plus } from 'lucide-angular';

import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ViolationDetailDialogComponent } from './components/violation-detail-dialog/violation-detail-dialog.component';
import { ViolationFiltersComponent } from './components/violation-filters/violation-filters.component';
import { ViolationFormDialogComponent } from './components/violation-form-dialog/violation-form-dialog.component';
import { ViolationListComponent } from './components/violation-list/violation-list.component';
import { ViolationResolveDialogComponent } from './components/violation-resolve-dialog/violation-resolve-dialog.component';
import { ViolationsFacade } from './violations.facade';

@Component({
  selector: 'app-violations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    ViolationDetailDialogComponent,
    ViolationFiltersComponent,
    ViolationFormDialogComponent,
    ViolationListComponent,
    ViolationResolveDialogComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'violaciones', alias: 'violations' })],
  templateUrl: './violations.component.html',
  styleUrl: './violations.component.scss',
})
export class ViolationsComponent extends ViolationsFacade {
  readonly Plus = Plus;
}
