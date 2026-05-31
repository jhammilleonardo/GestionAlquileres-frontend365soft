import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    <nav class="app-pagination" [attr.aria-label]="ariaLabel()">
      <p class="app-pagination__summary">
        {{ summaryText() }}
      </p>

      <div class="app-pagination__actions">
        <button
          class="app-pagination__button"
          type="button"
          [disabled]="page() <= 1"
          (click)="goTo(page() - 1)"
        >
          Anterior
        </button>

        <span class="app-pagination__page">{{ page() }} / {{ totalPages() }}</span>

        <button
          class="app-pagination__button"
          type="button"
          [disabled]="page() >= totalPages()"
          (click)="goTo(page() + 1)"
        >
          Siguiente
        </button>
      </div>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }

    .app-pagination {
      align-items: center;
      display: flex;
      gap: var(--app-space-3);
      justify-content: space-between;
      padding-block: var(--app-space-3);
    }

    .app-pagination__summary {
      color: var(--app-color-text-muted);
      font-size: 0.875rem;
      margin: 0;
    }

    .app-pagination__actions {
      align-items: center;
      display: inline-flex;
      gap: var(--app-space-2);
    }

    .app-pagination__button {
      min-block-size: 2.25rem;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      color: var(--app-color-text);
      cursor: pointer;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 700;
      padding-inline: var(--app-space-3);
      transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
    }

    .app-pagination__button:hover:not(:disabled) {
      border-color: var(--app-color-primary);
      color: var(--app-color-primary);
    }

    .app-pagination__button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .app-pagination__page {
      color: var(--app-color-text-muted);
      font-size: 0.875rem;
      font-weight: 700;
      min-inline-size: 4rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .app-pagination {
        align-items: stretch;
        flex-direction: column;
      }

      .app-pagination__actions {
        justify-content: space-between;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppPaginationComponent {
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly total = input(0);
  readonly ariaLabel = input('Paginacion');
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly summaryText = computed(() => {
    if (this.total() === 0) {
      return 'Sin resultados';
    }

    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(this.page() * this.pageSize(), this.total());
    return `Mostrando ${from}-${to} de ${this.total()}`;
  });

  protected goTo(page: number): void {
    const nextPage = Math.min(Math.max(page, 1), this.totalPages());
    if (nextPage !== this.page()) {
      this.pageChange.emit(nextPage);
    }
  }
}
