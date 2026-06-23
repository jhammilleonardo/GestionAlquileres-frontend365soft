import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-stepper',
  imports: [TranslocoModule],
  template: `
    <ol class="app-stepper" [attr.aria-label]="'common.progress' | transloco">
      @for (step of steps(); track $index; let index = $index) {
        <li
          class="app-stepper__item"
          [class.app-stepper__item--active]="index === currentIndex()"
          [class.app-stepper__item--done]="index < currentIndex()"
          [class.app-stepper__item--interactive]="canSelectStep(index)"
          [attr.aria-current]="index === currentIndex() ? 'step' : null"
        >
          @if (canSelectStep(index)) {
            <button
              class="app-stepper__content"
              type="button"
              [attr.aria-label]="step"
              (click)="selectStep(index)"
            >
              <span class="app-stepper__marker">{{ index + 1 }}</span>
              <span class="app-stepper__label">{{ step }}</span>
            </button>
          } @else {
            <span class="app-stepper__content">
              <span class="app-stepper__marker">{{ index + 1 }}</span>
              <span class="app-stepper__label">{{ step }}</span>
            </span>
          }
        </li>
      }
    </ol>

    <p class="app-stepper__status" aria-live="polite">
      {{ steps()[currentIndex()] }}
    </p>
    <p class="app-stepper__mobile-current">
      {{ steps()[currentIndex()] }}
    </p>
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
      min-inline-size: 0;
      color: var(--app-color-text-muted);
      text-align: center;
    }

    .app-stepper__content {
      display: grid;
      justify-items: center;
      gap: 0.45rem;
      min-inline-size: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: center;
    }

    button.app-stepper__content {
      cursor: pointer;
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

    .app-stepper__item--interactive .app-stepper__content:hover .app-stepper__marker,
    .app-stepper__item--interactive .app-stepper__content:focus-visible .app-stepper__marker {
      box-shadow: 0 0 0 3px rgb(22 163 74 / 18%);
    }

    .app-stepper__content:focus-visible {
      border-radius: var(--app-radius-md);
      outline: 2px solid var(--app-color-primary);
      outline-offset: 3px;
    }

    .app-stepper__status {
      position: absolute;
      overflow: hidden;
      width: 1px;
      height: 1px;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .app-stepper__mobile-current {
      display: none;
      margin: -0.75rem 0 1.25rem;
      color: var(--app-color-primary);
      font-size: 0.8125rem;
      font-weight: 700;
      text-align: center;
    }

    @media (max-width: 480px) {
      .app-stepper__label {
        display: none;
      }

      .app-stepper__mobile-current {
        display: block;
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
  readonly navigable = input(false);
  readonly stepSelected = output<number>();

  protected canSelectStep(index: number): boolean {
    return this.navigable() && index < this.currentIndex();
  }

  protected selectStep(index: number): void {
    if (this.canSelectStep(index)) {
      this.stepSelected.emit(index);
    }
  }
}
