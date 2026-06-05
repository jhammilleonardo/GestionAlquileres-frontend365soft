import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-stepper',
  imports: [TranslocoModule],
  template: `
    <ol class="app-stepper" [attr.aria-label]="'common.progress' | transloco">
      @for (step of steps(); track step; let index = $index) {
        <li
          class="app-stepper__item"
          [class.app-stepper__item--active]="index === currentIndex()"
          [class.app-stepper__item--done]="index < currentIndex()"
        >
          <span class="app-stepper__marker">{{ index + 1 }}</span>
          <span class="app-stepper__label">{{ step }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .app-stepper {
      display: grid;
      grid-template-columns: repeat(var(--app-step-count, 3), minmax(0, 1fr));
      gap: 0.75rem;
      margin: 0 0 1.25rem;
      padding: 0;
      list-style: none;
    }

    .app-stepper__item {
      display: grid;
      justify-items: center;
      gap: 0.45rem;
      min-inline-size: 0;
      color: var(--app-color-text-muted);
      text-align: center;
    }

    .app-stepper__marker {
      display: inline-grid;
      width: 2rem;
      height: 2rem;
      place-items: center;
      border: 1px solid var(--app-color-border);
      border-radius: 999px;
      background: var(--app-color-surface);
      font-size: 0.875rem;
      font-weight: 750;
    }

    .app-stepper__label {
      overflow: hidden;
      max-inline-size: 100%;
      font-size: 0.8125rem;
      font-weight: 650;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .app-stepper__item--active {
      color: var(--app-color-primary);
    }

    .app-stepper__item--active .app-stepper__marker {
      border-color: var(--app-color-primary);
      background: rgb(37 99 235 / 10%);
    }

    .app-stepper__item--done {
      color: var(--app-color-success);
    }

    .app-stepper__item--done .app-stepper__marker {
      border-color: var(--app-color-success);
      background: rgb(22 163 74 / 12%);
    }

    @media (max-width: 480px) {
      .app-stepper__label {
        display: none;
      }
    }
  `,
  host: {
    '[style.--app-step-count]': 'steps().length',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppStepperComponent {
  readonly steps = input<readonly string[]>([]);
  readonly currentIndex = input(0);
}
