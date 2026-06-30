import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppTableComponent } from '../../../shared/ui/table/table.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Libro diario + acceso al alta de asiento manual. */
@Component({
  selector: 'app-acc-journal-view',
  standalone: true,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppTableComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="journal-toolbar">
      <app-button size="s" (clicked)="f.openJournalDialog()">
        <lucide-icon [img]="Plus" [size]="16" aria-hidden="true" />
        {{ 'accounting.journalEntry.new' | transloco }}
      </app-button>
    </div>
    @if (f.journal()) {
      <app-table
        [columns]="f.journalColumns"
        [items]="f.journalEntries()"
        [emptyText]="'accounting.empty' | transloco"
        [ariaLabel]="'accounting.views.journal' | transloco"
      />
    } @else if (f.journal() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccJournalViewComponent {
  protected readonly f = inject(ContabilidadFacade);
  readonly Plus = Plus;
}
