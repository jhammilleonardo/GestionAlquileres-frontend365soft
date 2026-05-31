import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  template: `
    <section class="app-toolbar" [attr.aria-label]="ariaLabel()">
      <div class="app-toolbar__content">
        <ng-content />
      </div>

      <div class="app-toolbar__actions">
        <ng-content select="[toolbar-actions]" />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .app-toolbar {
      align-items: center;
      display: flex;
      gap: var(--app-space-3);
      justify-content: space-between;
      padding: var(--app-space-3);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
    }

    .app-toolbar__content,
    .app-toolbar__actions {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
    }

    .app-toolbar__content {
      min-inline-size: 0;
    }

    @media (max-width: 720px) {
      .app-toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .app-toolbar__content,
      .app-toolbar__actions {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppToolbarComponent {
  readonly ariaLabel = input<string | null>(null);
}
