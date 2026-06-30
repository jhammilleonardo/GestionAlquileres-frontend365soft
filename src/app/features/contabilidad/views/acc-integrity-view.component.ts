import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, CheckCircle2, ReceiptText, ShieldAlert } from 'lucide-angular';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppStatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ContabilidadFacade } from '../contabilidad.facade';

/** Auditoría de integridad financiera + acciones de remediación. */
@Component({
  selector: 'app-acc-integrity-view',
  standalone: true,
  imports: [
    DatePipe,
    TranslocoModule,
    LucideAngularModule,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (f.integrity(); as report) {
      <section class="acc-integrity-hero" [class.clean]="report.ok">
        <div class="acc-integrity-icon">
          <lucide-icon [img]="report.ok ? CheckCircle2 : ShieldAlert" [size]="22" />
        </div>
        <div>
          <span>{{ 'accounting.integrity.title' | transloco }}</span>
          <strong>
            {{
              report.ok
                ? ('accounting.integrity.okTitle' | transloco)
                : ('accounting.integrity.issueTitle' | transloco: { count: report.issue_count })
            }}
          </strong>
          <p>
            {{
              'accounting.integrity.generatedAt'
                | transloco: { date: (report.generated_at | date: 'dd/MM/yyyy HH:mm') }
            }}
          </p>
        </div>
        <app-status-badge
          [label]="
            (report.ok ? 'accounting.integrity.clean' : 'accounting.integrity.review') | transloco
          "
          [tone]="report.ok ? 'success' : 'danger'"
        />
      </section>

      <section class="acc-integrity-summary">
        <article>
          <span>{{ 'accounting.integrity.totalIssues' | transloco }}</span>
          <strong>{{ report.issue_count }}</strong>
        </article>
        <article>
          <span>{{ 'accounting.integrity.errors' | transloco }}</span>
          <strong>{{ f.integrityErrors() }}</strong>
        </article>
        <article>
          <span>{{ 'accounting.integrity.warnings' | transloco }}</span>
          <strong>{{ f.integrityWarnings() }}</strong>
        </article>
      </section>

      @if (f.hasUnpostedPaymentIssue()) {
        <section class="acc-integrity-remediation">
          <div>
            <strong>{{ 'accounting.integrity.remediation.title' | transloco }}</strong>
            <p>{{ 'accounting.integrity.remediation.text' | transloco }}</p>
            @if (f.remediationResult(); as result) {
              <small>
                {{
                  'accounting.integrity.remediation.result'
                    | transloco
                      : {
                          enqueued: result.enqueued_payments,
                          processed: result.processed_events,
                        }
                }}
              </small>
            }
            @if (f.remediationError(); as error) {
              <small class="remediation-error">{{ error }}</small>
            }
          </div>
          <button
            type="button"
            class="acc-remediation-button"
            [disabled]="f.remediationLoading()"
            (click)="f.reprocessPaymentPostings()"
          >
            <lucide-icon [img]="ReceiptText" [size]="16" />
            {{
              (f.remediationLoading()
                ? 'accounting.integrity.remediation.processing'
                : 'accounting.integrity.remediation.action'
              ) | transloco
            }}
          </button>
        </section>
      }

      @if (f.hasUnpostedExpenseIssue()) {
        <section class="acc-integrity-remediation">
          <div>
            <strong>{{ 'accounting.integrity.expenseRemediation.title' | transloco }}</strong>
            <p>{{ 'accounting.integrity.expenseRemediation.text' | transloco }}</p>
            @if (f.expenseRemediationResult(); as result) {
              <small>
                {{
                  'accounting.integrity.expenseRemediation.result'
                    | transloco
                      : {
                          expenses: result.enqueued_expenses,
                          payments: result.enqueued_expense_payments,
                          processed: result.processed_events,
                        }
                }}
              </small>
            }
            @if (f.expenseRemediationError(); as error) {
              <small class="remediation-error">{{ error }}</small>
            }
          </div>
          <button
            type="button"
            class="acc-remediation-button"
            [disabled]="f.expenseRemediationLoading()"
            (click)="f.reprocessExpensePostings()"
          >
            <lucide-icon [img]="ReceiptText" [size]="16" />
            {{
              (f.expenseRemediationLoading()
                ? 'accounting.integrity.expenseRemediation.processing'
                : 'accounting.integrity.expenseRemediation.action'
              ) | transloco
            }}
          </button>
        </section>
      }

      @if (report.ok) {
        <section class="acc-integrity-empty">
          <lucide-icon [img]="CheckCircle2" [size]="24" />
          <strong>{{ 'accounting.integrity.noIssues' | transloco }}</strong>
          <p>{{ 'accounting.integrity.noIssuesDetail' | transloco }}</p>
        </section>
      } @else {
        <section class="acc-integrity-list">
          @for (issue of f.integrityIssues(); track issue.code) {
            <article class="acc-integrity-issue" [class.error]="issue.severity === 'error'">
              <header>
                <div>
                  <h3>{{ f.integrityTitle(issue) }}</h3>
                  <p>{{ issue.description }}</p>
                </div>
                <div class="acc-integrity-badges">
                  <app-status-badge
                    [label]="'accounting.integrity.severity.' + issue.severity | transloco"
                    [tone]="f.integrityTone(issue)"
                  />
                  <strong>{{ issue.count }}</strong>
                </div>
              </header>

              @if (issue.sample.length > 0) {
                <ul class="acc-integrity-samples">
                  @for (row of issue.sample.slice(0, 5); track $index) {
                    <li>{{ f.samplePreview(row) }}</li>
                  }
                </ul>
              }
            </article>
          }
        </section>
      }
    } @else if (f.integrity() === null) {
      <app-empty-state [title]="'accounting.error' | transloco" />
    } @else {
      <app-loading-state [label]="'common.loading' | transloco" />
    }
  `,
})
export class AccIntegrityViewComponent {
  protected readonly f = inject(ContabilidadFacade);
  readonly CheckCircle2 = CheckCircle2;
  readonly ShieldAlert = ShieldAlert;
  readonly ReceiptText = ReceiptText;
}
