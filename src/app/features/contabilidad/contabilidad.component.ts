import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSegmentedControlComponent } from '../../shared/ui/segmented-control/segmented-control.component';
import { JournalEntryDialogComponent } from './components/journal-entry-dialog/journal-entry-dialog.component';
import { ContabilidadFacade } from './contabilidad.facade';
import { AccDashboardViewComponent } from './views/acc-dashboard-view.component';
import { AccBanksViewComponent } from './views/acc-banks-view.component';
import { AccIntegrityViewComponent } from './views/acc-integrity-view.component';
import { AccTrialBalanceViewComponent } from './views/acc-trial-balance-view.component';
import { AccBalanceSheetViewComponent } from './views/acc-balance-sheet-view.component';
import { AccIncomeStatementViewComponent } from './views/acc-income-statement-view.component';
import { AccChartViewComponent } from './views/acc-chart-view.component';
import { AccJournalViewComponent } from './views/acc-journal-view.component';

/**
 * Pantalla de contabilidad: solo el "chrome" (cabecera, filtros, selector de vista)
 * y el ruteo a la vista activa. El estado y la lógica viven en `ContabilidadFacade`
 * (provisto aquí e inyectado por cada sub-componente de vista). Estilos sin encapsular
 * (`ViewEncapsulation.None`) para que el scss `.acc-*` aplique a las vistas hijas.
 */
@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    AppPageHeaderComponent,
    AppSegmentedControlComponent,
    JournalEntryDialogComponent,
    AccDashboardViewComponent,
    AccBanksViewComponent,
    AccIntegrityViewComponent,
    AccTrialBalanceViewComponent,
    AccBalanceSheetViewComponent,
    AccIncomeStatementViewComponent,
    AccChartViewComponent,
    AccJournalViewComponent,
  ],
  providers: [
    provideTranslocoScope({ scope: 'accounting-ledger', alias: 'accounting' }),
    ContabilidadFacade,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './contabilidad.component.html',
  styleUrl: './contabilidad.component.scss',
})
export class ContabilidadComponent {
  protected readonly f = inject(ContabilidadFacade);
}
