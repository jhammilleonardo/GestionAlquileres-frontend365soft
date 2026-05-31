import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AppStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-status-badge',
  template: `<span class="status-badge" [class]="toneClass()">{{ label() }}</span>`,
  styles: `
    :host {
      display: inline-flex;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      min-block-size: 1.5rem;
      padding: 0 0.625rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
    }

    .status-badge.neutral {
      background: var(--tui-background-neutral-1);
      color: var(--tui-text-secondary);
    }

    .status-badge.info {
      background: var(--tui-status-info-pale);
      color: var(--tui-status-info);
    }

    .status-badge.success {
      background: var(--tui-status-positive-pale);
      color: var(--tui-status-positive);
    }

    .status-badge.warning {
      background: var(--tui-status-warning-pale);
      color: var(--tui-status-warning);
    }

    .status-badge.danger {
      background: var(--tui-status-negative-pale);
      color: var(--tui-status-negative);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppStatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<AppStatusTone>('neutral');

  protected readonly toneClass = computed(() => `status-badge ${this.tone()}`);
}
