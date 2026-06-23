import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

function computeNiceTicks(rawMax: number): number[] {
  if (rawMax <= 0) return [0];
  const NICE_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];
  const roughStep = rawMax / 4;
  const step = NICE_STEPS.find((s) => s >= roughStep) ?? rawMax;
  const niceMax = Math.ceil(rawMax / step) * step;
  const result: number[] = [];
  for (let v = 0; v <= niceMax; v += step) result.push(v);
  return result;
}

export interface ReportLineDatum {
  label: string;
  value: number;
}

interface ChartPoint {
  label: string;
  value: number;
  x: number;
  y: number;
}

const VIEW_W = 420;
const VIEW_H = 200;
const PAD_L = 56;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 48;
const CHART_W = VIEW_W - PAD_L - PAD_R;
const CHART_H = VIEW_H - PAD_T - PAD_B;

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

      @if (isEmpty()) {
        <div class="no-data">
          <svg viewBox="0 0 36 28" width="36" height="28" aria-hidden="true">
            <polyline points="4,22 14,10 24,16 32,6" class="nd-line" />
            <circle cx="4" cy="22" r="2.5" class="nd-dot" />
            <circle cx="14" cy="10" r="2.5" class="nd-dot" />
            <circle cx="24" cy="16" r="2.5" class="nd-dot" />
            <circle cx="32" cy="6" r="2.5" class="nd-dot" />
          </svg>
          <span>{{ emptyMessage() }}</span>
        </div>
      } @else {
        <svg
          class="line-chart"
          [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH"
          role="img"
          [attr.aria-label]="title()"
        >
          <!-- Y gridlines + labels -->
          @for (line of yLines(); track line.y) {
            <line
              [attr.x1]="padL"
              [attr.y1]="line.y"
              [attr.x2]="viewW - padR"
              [attr.y2]="line.y"
              class="grid-line"
            />
            <text [attr.x]="padL - 6" [attr.y]="line.y + 4" class="y-label" text-anchor="end">
              {{ line.value | currency: currency() : 'symbol' : '1.0-0' }}
            </text>
          }

          <!-- X baseline -->
          <line
            [attr.x1]="padL"
            [attr.y1]="baseY"
            [attr.x2]="viewW - padR"
            [attr.y2]="baseY"
            class="axis-line"
          />

          <!-- Area fill -->
          <path [attr.d]="areaPath()" class="area" />
          <!-- Line -->
          <polyline [attr.points]="linePoints()" class="line" />
          <!-- Points + X labels -->
          @for (pt of points(); track pt.label) {
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="5" class="dot" />
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" class="dot-inner" />
            <text [attr.x]="pt.x" [attr.y]="baseY + 18" class="x-label" text-anchor="middle">
              {{ pt.label }}
            </text>
            <text [attr.x]="pt.x" [attr.y]="baseY + 32" class="x-val" text-anchor="middle">
              {{ pt.value | currency: currency() : 'symbol' : '1.0-0' }}
            </text>
          }
        </svg>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .chart-card {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      box-shadow: var(--app-shadow-sm);
      display: grid;
      gap: var(--app-space-3);
      min-block-size: 100%;
      padding: var(--app-space-4);
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
      inline-size: 100%;
      block-size: auto;
      overflow: visible;
    }

    .grid-line {
      stroke: var(--app-color-border);
      stroke-width: 1;
      stroke-dasharray: 4 3;
    }

    .axis-line {
      stroke: var(--app-color-border);
      stroke-width: 1.5;
    }

    .empty-line {
      stroke: var(--app-color-border);
      stroke-width: 2;
      stroke-dasharray: 6 4;
    }

    .y-label {
      fill: var(--app-color-text-muted);
      font-size: 9px;
      font-weight: 600;
    }

    .x-label {
      fill: var(--app-color-text-muted);
      font-size: 10px;
      font-weight: 700;
    }

    .x-val {
      fill: var(--app-color-text);
      font-size: 10px;
      font-weight: 800;
    }

    .area {
      fill: color-mix(in srgb, var(--app-color-primary) 12%, transparent);
    }

    .line {
      fill: none;
      stroke: var(--app-color-primary);
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 3;
    }

    .dot {
      fill: color-mix(in srgb, var(--app-color-primary) 20%, transparent);
      stroke: var(--app-color-primary);
      stroke-width: 2;
    }

    .dot-inner {
      fill: var(--app-color-primary);
      stroke: var(--app-color-surface);
      stroke-width: 2;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 140px;
      color: var(--app-color-text-muted);
      font-size: 0.82rem;
      font-weight: 650;
    }

    .nd-line {
      fill: none;
      stroke: var(--app-color-border);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .nd-dot {
      fill: var(--app-color-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportLineChartComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('Tendencia');
  readonly data = input.required<readonly ReportLineDatum[]>();
  readonly currency = input<string>('USD');
  readonly emptyMessage = input<string>('Sin datos para mostrar');

  protected readonly viewW = VIEW_W;
  protected readonly viewH = VIEW_H;
  protected readonly padL = PAD_L;
  protected readonly padR = PAD_R;
  protected readonly baseY = PAD_T + CHART_H;

  protected readonly isEmpty = computed(() => this.data().every((d) => d.value === 0));

  protected readonly maxVal = computed(() => Math.max(...this.data().map((d) => d.value), 0));

  protected readonly niceMax = computed(() => {
    const ticks = computeNiceTicks(this.maxVal());
    return ticks[ticks.length - 1] || 1;
  });

  protected readonly yLines = computed(() => {
    const ticks = computeNiceTicks(this.maxVal());
    const chartMax = ticks[ticks.length - 1] || 1;
    return ticks.map((v) => ({
      y: PAD_T + CHART_H * (1 - v / chartMax),
      value: v,
    }));
  });

  protected readonly points = computed<ChartPoint[]>(() => {
    const data = this.data();
    if (data.length === 0) return [];
    const chartMax = this.niceMax();
    const min = 0;
    const range = Math.max(chartMax - min, 1);
    const step = data.length > 1 ? CHART_W / (data.length - 1) : 0;

    return data.map((d, i) => ({
      label: d.label,
      value: d.value,
      x: PAD_L + i * step,
      y: PAD_T + CHART_H - ((d.value - min) / range) * CHART_H,
    }));
  });

  protected readonly linePoints = computed(() =>
    this.points()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    const line = pts.map((p) => `L${p.x} ${p.y}`).join(' ');
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `M${first.x} ${PAD_T + CHART_H} ${line.replace(/^L/, 'L')} L${last.x} ${PAD_T + CHART_H} Z`;
  });
}
