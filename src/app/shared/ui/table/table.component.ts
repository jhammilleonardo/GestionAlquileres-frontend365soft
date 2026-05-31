import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input, output } from '@angular/core';

export interface AppTableColumn<TItem> {
  key: keyof TItem & string;
  label: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (item: TItem) => string | number | null | undefined;
}

@Component({
  selector: 'app-table',
  template: `
    <div class="app-table" role="region" [attr.aria-label]="ariaLabel()">
      <table>
        <thead>
          <tr>
            @for (column of columns(); track column.key) {
              <th [class]="alignClass(column.align)">
                {{ column.label }}
              </th>
            }

            @if (hasActions()) {
              <th class="app-table__actions">Acciones</th>
            }
          </tr>
        </thead>

        <tbody>
          @for (item of items(); track trackByKey(item)) {
            <tr (click)="rowClicked.emit(item)">
              @for (column of columns(); track column.key) {
                <td [class]="alignClass(column.align)">
                  {{ resolveValue(item, column) }}
                </td>
              }

              @if (hasActions()) {
                <td class="app-table__actions">
                  <ng-container
                    [ngTemplateOutlet]="actionsTemplate()"
                    [ngTemplateOutletContext]="{ $implicit: item }"
                  />
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td
                class="app-table__empty"
                [attr.colspan]="columns().length + (hasActions() ? 1 : 0)"
              >
                {{ emptyText() }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  imports: [NgTemplateOutlet],
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .app-table {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      inline-size: 100%;
      overflow: auto;
    }

    table {
      border-collapse: collapse;
      inline-size: 100%;
      min-inline-size: 720px;
    }

    th,
    td {
      border-block-end: 1px solid var(--app-color-border);
      padding: 0.75rem 1rem;
      text-align: left;
      vertical-align: middle;
      white-space: nowrap;
    }

    th {
      background: var(--app-color-surface-muted);
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    td {
      color: var(--app-color-text);
      font-size: 0.875rem;
    }

    tbody tr {
      cursor: pointer;
      transition: background 0.15s;
    }

    tbody tr:hover {
      background: var(--app-color-primary-soft);
    }

    tbody tr:last-child td {
      border-block-end: 0;
    }

    .app-table__align-center {
      text-align: center;
    }

    .app-table__align-right,
    .app-table__actions {
      text-align: right;
    }

    .app-table__empty {
      color: var(--app-color-text-muted);
      padding: 2rem 1rem;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTableComponent<TItem extends Record<string, unknown>> {
  readonly columns = input.required<readonly AppTableColumn<TItem>[]>();
  readonly items = input<readonly TItem[]>([]);
  readonly emptyText = input('No hay datos para mostrar.');
  readonly ariaLabel = input('Tabla de datos');
  readonly trackBy = input<keyof TItem & string>('id' as keyof TItem & string);
  readonly actionsTemplate = input<TemplateRef<{ $implicit: TItem }> | null>(null);
  readonly rowClicked = output<TItem>();

  protected hasActions(): boolean {
    return Boolean(this.actionsTemplate());
  }

  protected trackByKey(item: TItem): unknown {
    return item[this.trackBy()] ?? item;
  }

  protected resolveValue(item: TItem, column: AppTableColumn<TItem>): string | number {
    const value = column.formatter ? column.formatter(item) : item[column.key];
    return value === null || value === undefined ? '-' : String(value);
  }

  protected alignClass(align: AppTableColumn<TItem>['align']): string {
    if (align === 'center') {
      return 'app-table__align-center';
    }

    if (align === 'right') {
      return 'app-table__align-right';
    }

    return '';
  }
}
