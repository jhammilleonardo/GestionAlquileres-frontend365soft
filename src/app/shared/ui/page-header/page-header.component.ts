import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="page-header__content">
        <p class="page-header__eyebrow">{{ eyebrow() }}</p>
        <h1>{{ title() }}</h1>

        @if (description()) {
          <p class="page-header__description">{{ description() }}</p>
        }
      </div>

      <div class="page-header__actions">
        <ng-content select="[actions]" />
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--app-space-6);
      margin-block-end: var(--app-space-6);
    }

    .page-header__content {
      min-inline-size: 0;
    }

    .page-header__eyebrow {
      margin: 0 0 0.25rem;
      color: var(--tui-text-secondary);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--tui-text-primary);
      font-size: clamp(1.5rem, 2vw, 2rem);
      font-weight: 760;
      line-height: 1.15;
    }

    .page-header__description {
      max-inline-size: 52rem;
      margin: 0.5rem 0 0;
      color: var(--tui-text-secondary);
      font-size: 0.925rem;
    }

    .page-header__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--app-space-2);
    }

    @media (max-width: 720px) {
      .page-header {
        flex-direction: column;
      }

      .page-header__actions {
        justify-content: flex-start;
        inline-size: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppPageHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
