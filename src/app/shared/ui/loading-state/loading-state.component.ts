import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { TuiLoader } from '@taiga-ui/core';

@Component({
  selector: 'app-loading-state',
  imports: [TuiLoader, TranslocoModule],
  template: `
    <div class="loading-state" role="status" aria-live="polite">
      <tui-loader [inheritColor]="true" [loading]="true" size="m" />
      <span>{{ label() ?? ('common.loading' | transloco) }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .loading-state {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-2);
      color: var(--tui-text-secondary);
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLoadingStateComponent {
  readonly label = input<string | null>(null);
}
