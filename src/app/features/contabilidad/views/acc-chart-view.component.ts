import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppTableComponent } from '../../../shared/ui/table/table.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Vista del plan de cuentas. Lee del facade compartido (provisto por el padre). */
@Component({
  selector: 'app-acc-chart-view',
  standalone: true,
  imports: [TranslocoModule, AppTableComponent, AppEmptyStateComponent, AppLoadingStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (f.chart(); as accounts) {
      <app-table
        [columns]="f.chartColumns"
        [items]="accounts"
        trackBy="code"
        [emptyText]="'accounting.empty' | transloco"
        [ariaLabel]="'accounting.views.chart' | transloco"
      />
    } @else if (f.chart() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccChartViewComponent {
  protected readonly f = inject(ContabilidadFacade);
}
