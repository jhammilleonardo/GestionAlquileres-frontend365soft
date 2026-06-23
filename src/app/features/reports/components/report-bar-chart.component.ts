import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

export interface ReportBarDatum {
  label: string;
  value: number;
  color?: string;
}

interface Column {
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  labelY: number;
  valueText: string;
}

interface YLine {
  y: number;
  value: number;
  x1: number;
  x2: number;
}

const PAD_L = 52;
const PAD_R = 16;
const PAD_T = 32;
const PAD_B = 52;
const VIEW_W = 420;
const CHART_H = 130;
const BASE_Y = PAD_T + CHART_H;
const CHART_W = VIEW_W - PAD_L - PAD_R;

// Genera ticks limpios y únicos sin duplicados
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

      @if (isEmpty()) {
        <div class="no-data">
          <svg viewBox="0 0 40 28" width="40" height="28" aria-hidden="true">
            <rect x="3" y="18" width="9" height="8" rx="2" fill="var(--app-color-border)" />
            <rect x="15" y="10" width="9" height="16" rx="2" fill="var(--app-color-border)" />
            <rect x="27" y="14" width="9" height="12" rx="2" fill="var(--app-color-border)" />
          </svg>
          <span>{{ emptyMessage() }}</span>
        </div>
      } @else {
        <svg
          class="col-chart"
          [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH()"
          role="img"
          [attr.aria-label]="title()"
        >
          <!-- Y axis unit label (top-left) -->
          @if (valueUnit()) {
            <text [attr.x]="padL - 6" [attr.y]="PAD_T - 8" class="y-unit-label" text-anchor="end">
              {{ valueUnit() }}
            </text>
          }

          <!-- Y gridlines + labels -->
          @for (line of yLines(); track line.y) {
            <line
              [attr.x1]="line.x1"
              [attr.y1]="line.y"
              [attr.x2]="line.x2"
              [attr.y2]="line.y"
              class="grid-line"
            />
            <text [attr.x]="line.x1 - 6" [attr.y]="line.y + 4" class="y-label" text-anchor="end">
              @if (currency()) {
                {{ line.value | currency: currency()! : 'symbol' : '1.0-0' }}
              } @else {
                {{ line.value | number: '1.0-0' }}
              }
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

          <!-- Bars -->
          @for (col of columns(); track col.label) {
            <g>
              <rect
                [attr.x]="col.x"
                [attr.y]="col.y"
                [attr.width]="col.width"
                [attr.height]="col.height"
                [attr.fill]="col.color"
                rx="4"
                ry="4"
                class="bar-rect"
              />
              <text [attr.x]="col.cx" [attr.y]="col.y - 7" class="val-label" text-anchor="middle">
                {{ col.valueText }}
              </text>
              <text [attr.x]="col.cx" [attr.y]="col.labelY" class="cat-label" text-anchor="middle">
                {{ col.label }}
              </text>
            </g>
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

    .col-chart {
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

    .y-label {
      fill: var(--app-color-text-muted);
      font-size: 9px;
      font-weight: 600;
    }
    .y-unit-label {
      fill: var(--app-color-text-muted);
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .val-label {
      fill: var(--app-color-text);
      font-size: 10px;
      font-weight: 800;
    }
    .cat-label {
      fill: var(--app-color-text-muted);
      font-size: 10px;
      font-weight: 650;
    }

    .bar-rect {
      transition: opacity 0.15s;
    }
    .bar-rect:hover {
      opacity: 0.8;
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
      text-align: center;
      padding: 0 var(--app-space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportBarChartComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('Ranking');
  readonly data = input.required<readonly ReportBarDatum[]>();
  readonly currency = input<string | null>(null);
  readonly emptyMessage = input<string>('Sin datos para mostrar');
  readonly valueUnit = input<string | null>(null);

  protected readonly viewW = VIEW_W;
  protected readonly padL = PAD_L;
  protected readonly padR = PAD_R;
  protected readonly baseY = BASE_Y;
  protected readonly PAD_T = PAD_T;

  protected readonly isEmpty = computed(() => {
    const data = this.data();
    return data.length === 0 || data.every((d) => d.value === 0);
  });

  protected readonly viewH = computed(() => PAD_T + CHART_H + PAD_B);

  protected readonly niceMax = computed(() => {
    const ticks = computeNiceTicks(Math.max(...this.data().map((d) => Math.abs(d.value)), 0));
    return ticks[ticks.length - 1] || 1;
  });

  protected readonly yLines = computed<readonly YLine[]>(() => {
    const ticks = computeNiceTicks(Math.max(...this.data().map((d) => Math.abs(d.value)), 0));
    const chartMax = ticks[ticks.length - 1] || 1;
    return ticks.map((v) => ({
      y: PAD_T + CHART_H * (1 - v / chartMax),
      value: v,
      x1: PAD_L,
      x2: VIEW_W - PAD_R,
    }));
  });

  protected readonly columns = computed<readonly Column[]>(() => {
    const data = this.data();
    if (data.length === 0) return [];

    const chartMax = this.niceMax();
    const colW = CHART_W / data.length;
    const barW = data.length === 1 ? Math.min(colW * 0.25, 80) : Math.min(colW * 0.55, 72);
    const isCurrency = !!this.currency();
    const curr = this.currency();
    const unit = this.valueUnit();

    const fmt = new Intl.NumberFormat('es-BO', {
      style: isCurrency ? 'currency' : 'decimal',
      currency: isCurrency ? (curr ?? 'USD') : undefined,
      maximumFractionDigits: 0,
    });

    return data.map((d, i) => {
      const cx = PAD_L + colW * i + colW / 2;
      const barH = Math.max((Math.abs(d.value) / chartMax) * CHART_H, 4);
      const formatted = fmt.format(d.value);
      return {
        label: d.label,
        value: d.value,
        color: d.color ?? 'var(--app-color-primary)',
        x: cx - barW / 2,
        y: BASE_Y - barH,
        width: barW,
        height: barH,
        cx,
        labelY: BASE_Y + 20,
        valueText: unit ? `${formatted} ${unit}` : formatted,
      };
    });
  });
}
