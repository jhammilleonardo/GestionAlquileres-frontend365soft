import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface ReportChartSegment {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-report-donut-chart',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <article class="chart-card">
      <header>
        <span>{{ eyebrow() }}</span>
        <strong>{{ title() }}</strong>
      </header>

      <div class="donut-layout">
        <div class="donut" [style.background]="gradient()">
          <div class="donut__center">
            <strong>{{ total() | number: '1.0-0' }}</strong>
            <span>Total</span>
          </div>
        </div>

        <ul class="legend">
          @for (segment of segments(); track segment.label) {
            <li>
              <i [style.background]="segment.color"></i>
              <span>{{ segment.label }}</span>
              <strong>{{ segment.value | number: '1.0-0' }}</strong>
            </li>
          }
        </ul>
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

    .donut-layout {
      align-items: center;
      display: grid;
      gap: var(--app-space-4);
      grid-template-columns: auto minmax(0, 1fr);
    }

    .donut {
      align-items: center;
      block-size: 9rem;
      border-radius: 50%;
      display: grid;
      inline-size: 9rem;
      justify-items: center;
    }

    .donut__center {
      align-content: center;
      background: var(--app-color-surface);
      block-size: 5.8rem;
      border-radius: 50%;
      display: grid;
      inline-size: 5.8rem;
      justify-items: center;
    }

    .donut__center strong {
      color: var(--app-color-text);
      font-size: 1.25rem;
      font-weight: 850;
    }

    .donut__center span {
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .legend {
      display: grid;
      gap: var(--app-space-2);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .legend li {
      align-items: center;
      display: grid;
      gap: var(--app-space-2);
      grid-template-columns: auto minmax(0, 1fr) auto;
      color: var(--app-color-text-muted);
      font-size: 0.875rem;
      font-weight: 650;
    }

    .legend i {
      block-size: 0.65rem;
      border-radius: 50%;
      inline-size: 0.65rem;
    }

    .legend strong {
      color: var(--app-color-text);
      font-weight: 850;
    }

    @media (max-width: 720px) {
      .donut-layout {
        grid-template-columns: 1fr;
        justify-items: center;
      }

      .legend {
        inline-size: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDonutChartComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('Distribución');
  readonly segments = input.required<readonly ReportChartSegment[]>();

  protected readonly total = computed(() =>
    this.segments().reduce((sum, segment) => sum + Math.max(segment.value, 0), 0),
  );

  protected readonly gradient = computed(() => {
    const total = this.total();
    if (total <= 0) return 'conic-gradient(var(--app-color-border) 0deg 360deg)';

    let cursor = 0;
    const stops = this.segments().map((segment) => {
      const start = cursor;
      const size = (Math.max(segment.value, 0) / total) * 360;
      cursor += size;
      return `${segment.color} ${start}deg ${cursor}deg`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  });
}
