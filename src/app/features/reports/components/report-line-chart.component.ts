import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

export interface ReportLineDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'app-report-line-chart',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <article class="chart-card">
      <header>
        <span>{{ eyebrow() }}</span>
        <strong>{{ title() }}</strong>
      </header>

      <svg class="line-chart" viewBox="0 0 420 180" role="img" [attr.aria-label]="title()">
        <path class="grid" d="M24 24H396M24 78H396M24 132H396" />
        <path class="area" [attr.d]="areaPath()" />
        <polyline class="line" [attr.points]="polylinePoints()" />
        @for (point of points(); track point.label) {
          <circle class="point" [attr.cx]="point.x" [attr.cy]="point.y" r="4" />
        }
      </svg>

      <div class="line-legend">
        @for (point of data(); track point.label) {
          <span>{{ point.label }}</span>
          <strong>{{ point.value | currency: currency() : 'symbol' : '1.0-0' }}</strong>
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

    .line-chart {
      block-size: auto;
      inline-size: 100%;
      overflow: visible;
    }

    .grid {
      fill: none;
      stroke: var(--app-color-border);
      stroke-width: 1;
    }

    .area {
      fill: color-mix(in srgb, var(--app-color-primary) 14%, transparent);
      stroke: none;
    }

    .line {
      fill: none;
      stroke: var(--app-color-primary);
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 4;
    }

    .point {
      fill: var(--app-color-surface);
      stroke: var(--app-color-primary);
      stroke-width: 3;
    }

    .line-legend {
      align-items: center;
      display: grid;
      gap: var(--app-space-2);
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .line-legend span,
    .line-legend strong {
      min-inline-size: 0;
    }

    .line-legend span {
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 750;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .line-legend strong {
      color: var(--app-color-text);
      font-size: 0.875rem;
      font-weight: 850;
    }

    @media (max-width: 720px) {
      .line-legend {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportLineChartComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('Tendencia');
  readonly data = input.required<readonly ReportLineDatum[]>();
  readonly currency = input<string>('USD');

  protected readonly points = computed(() => {
    const data = this.data();
    const max = Math.max(...data.map((item) => item.value), 1);
    const min = Math.min(...data.map((item) => item.value), 0);
    const range = Math.max(max - min, 1);
    const step = data.length > 1 ? 372 / (data.length - 1) : 0;

    return data.map((item, index) => ({
      ...item,
      x: 24 + index * step,
      y: 150 - ((item.value - min) / range) * 126,
    }));
  });

  protected readonly polylinePoints = computed(() =>
    this.points()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const points = this.points();
    if (points.length === 0) return '';
    const line = points.map((point) => `L${point.x} ${point.y}`).join(' ');
    const first = points[0];
    const last = points[points.length - 1];
    return `M${first.x} 156 ${line.replace(/^L/, 'L')} L${last.x} 156 Z`;
  });
}
