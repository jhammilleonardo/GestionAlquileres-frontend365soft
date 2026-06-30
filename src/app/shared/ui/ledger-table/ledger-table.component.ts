import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TenantCurrencyPipe } from '../../pipes/tenant-currency.pipe';
import { AppStatusBadgeComponent, AppStatusTone } from '../status-badge/status-badge.component';

/** Una línea de movimiento contable/financiero (rent ledger, owner ledger, etc.). */
export interface AppLedgerLine {
  date: string;
  concept: string;
  reference?: string | null;
  status?: { label: string; tone: AppStatusTone } | null;
  /** Monto del movimiento (positivo o negativo). */
  amount: number;
  /** Saldo acumulado hasta esta línea. */
  balance: number;
}

/**
 * Tabla de movimientos reutilizable: fecha · concepto · referencia · estado ·
 * monto · saldo. Presentacional (solo inputs); el contenedor pasa las etiquetas
 * ya traducidas para no acoplar el componente a un scope de i18n.
 */
@Component({
  selector: 'app-ledger-table',
  standalone: true,
  imports: [DatePipe, TenantCurrencyPipe, AppStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lines().length === 0) {
      <p class="ledger-empty">{{ emptyLabel() }}</p>
    } @else {
      <div class="ledger-wrapper">
        <table class="ledger-table">
          <thead>
            <tr>
              <th scope="col">{{ dateLabel() }}</th>
              <th scope="col">{{ conceptLabel() }}</th>
              <th scope="col" class="num">{{ amountLabel() }}</th>
              <th scope="col" class="num">{{ balanceLabel() }}</th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines(); track $index) {
              <tr>
                <td>{{ line.date | date: 'mediumDate' }}</td>
                <td>
                  <span class="concept">{{ line.concept }}</span>
                  @if (line.reference) {
                    <span class="reference">{{ line.reference }}</span>
                  }
                  @if (line.status) {
                    <app-status-badge [label]="line.status.label" [tone]="line.status.tone" />
                  }
                </td>
                <td class="num" [class.negative]="line.amount < 0">
                  {{ line.amount | tenantCurrency: currency() }}
                </td>
                <td class="num" [class.negative]="line.balance < 0">
                  {{ line.balance | tenantCurrency: currency() }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ledger-empty {
      margin: 0;
      padding: 1.5rem 0;
      color: var(--tui-text-secondary);
      text-align: center;
      font-size: 0.875rem;
    }

    .ledger-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .ledger-table {
      inline-size: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .ledger-table th,
    .ledger-table td {
      padding: 0.625rem 0.75rem;
      text-align: start;
      border-bottom: 1px solid var(--tui-background-neutral-1);
      white-space: nowrap;
    }

    .ledger-table th {
      font-weight: 600;
      color: var(--tui-text-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .ledger-table .num {
      text-align: end;
      font-variant-numeric: tabular-nums;
    }

    .ledger-table .negative {
      color: var(--tui-status-negative);
    }

    .concept {
      display: block;
      font-weight: 500;
    }

    .reference {
      display: block;
      margin-block-start: 0.125rem;
      color: var(--tui-text-secondary);
      font-size: 0.75rem;
    }

    app-status-badge {
      margin-block-start: 0.25rem;
    }
  `,
})
export class AppLedgerTableComponent {
  readonly lines = input.required<AppLedgerLine[]>();
  readonly currency = input<string>('BOB');

  readonly dateLabel = input<string>('Fecha');
  readonly conceptLabel = input<string>('Concepto');
  readonly amountLabel = input<string>('Monto');
  readonly balanceLabel = input<string>('Saldo');
  readonly emptyLabel = input<string>('Sin movimientos');
}
