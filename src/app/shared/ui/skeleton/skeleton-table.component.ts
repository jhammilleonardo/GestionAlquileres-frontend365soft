import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppSkeletonComponent } from './skeleton.component';

/**
 * Placeholder con forma de tabla para listas que aún cargan.
 * Imita filas y columnas para evitar saltos de layout (CLS) y dar
 * sensación de carga más rápida que un spinner.
 */
@Component({
  selector: 'app-skeleton-table',
  imports: [AppSkeletonComponent, TranslocoModule],
  template: `
    <div
      class="sk-table"
      role="status"
      aria-live="polite"
      [attr.aria-busy]="true"
      [attr.aria-label]="label() ?? ('common.loading' | transloco)"
    >
      <div class="sk-table__header" aria-hidden="true">
        @for (col of cols(); track $index) {
          <div class="sk-table__cell">
            <app-skeleton height="0.75rem" [width]="headerWidth($index)" />
          </div>
        }
      </div>

      @for (row of rows(); track $index; let rowIdx = $index) {
        <div class="sk-table__row" aria-hidden="true">
          @for (col of cols(); track $index) {
            <div class="sk-table__cell">
              <app-skeleton height="0.875rem" [width]="cellWidth($index, rowIdx)" />
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .sk-table {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      overflow: hidden;
    }

    .sk-table__header,
    .sk-table__row {
      display: grid;
      grid-template-columns: var(--sk-grid-template);
      gap: var(--app-space-4);
      align-items: center;
      padding: 0.85rem 1rem;
    }

    .sk-table__header {
      background: var(--app-color-surface-muted);
    }

    .sk-table__row {
      border-block-start: 1px solid var(--app-color-border);
    }
  `,
  host: {
    '[style.--sk-grid-template]': 'gridTemplate()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSkeletonTableComponent {
  /** Número de filas placeholder. */
  readonly rowCount = input<number>(6);
  /** Número de columnas placeholder. */
  readonly columnCount = input<number>(6);
  /** Etiqueta accesible (cae a 'common.loading'). */
  readonly label = input<string | null>(null);

  protected readonly rows = computed(() => Array.from({ length: this.rowCount() }));
  protected readonly cols = computed(() => Array.from({ length: this.columnCount() }));
  protected readonly gridTemplate = computed(() => `repeat(${this.columnCount()}, 1fr)`);

  /** Ancho variado por columna para un encabezado de aspecto natural. */
  protected headerWidth(colIndex: number): string {
    const widths = ['60%', '70%', '50%', '65%', '55%'];
    return widths[colIndex % widths.length];
  }

  /** Ancho pseudo-aleatorio pero estable por celda (sin parpadeos entre renders). */
  protected cellWidth(colIndex: number, rowIndex: number): string {
    const widths = ['90%', '70%', '85%', '60%', '95%', '75%'];
    return widths[(colIndex + rowIndex) % widths.length];
  }
}
