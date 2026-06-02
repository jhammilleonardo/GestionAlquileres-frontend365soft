import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

export interface ReportBarDatum {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-report-bar-chart',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  template: `
    <article class="chart-card">
      <header>
        <span>{{ eyebrow() }}</span>
        <strong>{{ title() }}</strong>
      </header>

      <div class="bars" [class.bars--currency]="currency()">
        @for (bar of normalizedBars(); track bar.label) {
          <div class="bar-row">
            <span class="bar-row__label">{{ bar.label }}</span>
            <div class="bar-row__track">
              <i
                [style.inline-size.%]="bar.percent"
                [style.background]="bar.color ?? 'var(--app-color-primary)'"
              ></i>
            </div>
            <strong>
              @if (currency()) {
                {{ bar.value | currency: currency()! : 'symbol' : '1.0-0' }}
              } @else {
                {{ bar.value | number: '1.0-0' }}
              }
            </strong>
          </div>
        }
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .chart-card {
      display: grid;
      gap: var(--app-space-4);
      min-block-size: 100%;
      padding: var(--app-space-4);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
    }

    header {
      display: grid;
      gap: var(--app-space-1);
    }

    header span {
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    header strong {
      color: var(--app-color-text);
      font-size: 1rem;
      font-weight: 850;
    }

    .bars {
      display: grid;
      gap: var(--app-space-3);
    }

    .bar-row {
      align-items: center;
      display: grid;
      gap: var(--app-space-3);
      grid-template-columns: minmax(7rem, 0.8fr) minmax(8rem, 1fr) auto;
    }

    .bar-row__label {
      color: var(--app-color-text-muted);
      font-size: 0.8125rem;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bar-row__track {
      block-size: 0.7rem;
      overflow: hidden;
      border-radius: 999px;
      background: var(--app-color-surface-muted);
    }

    .bar-row__track i {
      block-size: 100%;
      border-radius: inherit;
      display: block;
      min-inline-size: 0.25rem;
    }

    .bar-row strong {
      color: var(--app-color-text);
      font-size: 0.8125rem;
      font-weight: 850;
      justify-self: end;
    }

    @media (max-width: 620px) {
      .bar-row {
        grid-template-columns: 1fr auto;
      }

      .bar-row__track {
        grid-column: 1 / -1;
        grid-row: 2;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportBarChartComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('Ranking');
  readonly data = input.required<readonly ReportBarDatum[]>();
  readonly currency = input<string | null>(null);

  protected readonly normalizedBars = computed(() => {
    const max = Math.max(...this.data().map((bar) => Math.abs(bar.value)), 1);

    return this.data().map((bar) => ({
      ...bar,
      percent: Math.max((Math.abs(bar.value) / max) * 100, 4),
    }));
  });
}
