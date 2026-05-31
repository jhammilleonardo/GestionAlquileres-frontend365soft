import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <section class="empty-state">
      <div class="empty-state__icon">
        <ng-content select="[icon]" />
      </div>

      <h2>{{ title() }}</h2>

      @if (description()) {
        <p>{{ description() }}</p>
      }

      <div class="empty-state__actions">
        <ng-content select="[actions]" />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .empty-state {
      display: grid;
      justify-items: center;
      padding: 3rem 1.5rem;
      border: 1px dashed var(--tui-border-normal);
      border-radius: var(--app-radius-lg);
      background: var(--tui-background-neutral-1);
      color: var(--tui-text-secondary);
      text-align: center;
    }

    .empty-state__icon {
      display: inline-grid;
      place-items: center;
      inline-size: 3rem;
      block-size: 3rem;
      margin-block-end: 1rem;
      border-radius: 50%;
      background: var(--tui-background-base);
      color: var(--tui-text-tertiary);
    }

    h2 {
      margin: 0;
      color: var(--tui-text-primary);
      font-size: 1.125rem;
      font-weight: 760;
    }

    p {
      max-inline-size: 32rem;
      margin: 0.5rem 0 0;
    }

    .empty-state__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--app-space-2);
      margin-block-start: var(--app-space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
