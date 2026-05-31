import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiButtonLoading } from '@taiga-ui/kit';

export type AppButtonAppearance =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'flat'
  | 'accent'
  | 'destructive';

const APPEARANCE_MAP: Record<AppButtonAppearance, string> = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  flat: 'flat',
  accent: 'accent',
  destructive: 'negative',
};

@Component({
  selector: 'app-button',
  imports: [TuiButton, TuiButtonLoading],
  template: `
    <button
      tuiButton
      [type]="type()"
      class="app-button"
      [class.app-button--full-width]="fullWidth()"
      [attr.aria-label]="ariaLabel()"
      [appearance]="mappedAppearance"
      [disabled]="disabled() || loading()"
      [loading]="loading()"
      [size]="size()"
      (click)="clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .app-button {
      gap: 0.5rem;
      font-weight: 650;
    }

    .app-button--full-width {
      inline-size: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppButtonComponent {
  readonly appearance = input<AppButtonAppearance>('primary');
  readonly type = input<'button' | 'reset' | 'submit'>('button');
  readonly size = input<'xs' | 's' | 'm' | 'l' | 'xl'>('m');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly ariaLabel = input<string | null>(null);
  readonly clicked = output<MouseEvent>();

  get mappedAppearance(): string {
    return APPEARANCE_MAP[this.appearance()];
  }
}
