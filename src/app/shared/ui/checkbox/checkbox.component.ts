import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label class="app-checkbox">
      <input
        class="app-checkbox__input"
        type="checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        (blur)="onTouched()"
        (change)="onToggle($event)"
      />
      <span class="app-checkbox__box" aria-hidden="true"></span>
      <span class="app-checkbox__content">
        <ng-content />
      </span>
    </label>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .app-checkbox {
      align-items: flex-start;
      color: var(--app-color-text);
      cursor: pointer;
      display: inline-grid;
      gap: var(--app-space-2);
      grid-template-columns: 18px minmax(0, 1fr);
      line-height: 1.4;
      position: relative;
    }

    .app-checkbox__input {
      block-size: 18px;
      inline-size: 18px;
      margin: 0;
      opacity: 0;
      position: absolute;
    }

    .app-checkbox__box {
      block-size: 18px;
      border: 1px solid var(--app-color-border-strong);
      border-radius: var(--app-radius-sm);
      box-sizing: border-box;
      inline-size: 18px;
      transition:
        background 0.15s,
        border-color 0.15s,
        box-shadow 0.15s;
    }

    .app-checkbox__input:checked + .app-checkbox__box {
      background: var(--app-color-primary);
      border-color: var(--app-color-primary);
    }

    .app-checkbox__input:checked + .app-checkbox__box::after {
      block-size: 9px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      content: '';
      display: block;
      inline-size: 5px;
      margin: 2px 0 0 5px;
      transform: rotate(45deg);
    }

    .app-checkbox__input:focus-visible + .app-checkbox__box {
      box-shadow: 0 0 0 3px rgb(37 99 235 / 18%);
    }

    .app-checkbox:has(.app-checkbox__input:disabled) {
      cursor: not-allowed;
      opacity: 0.62;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCheckboxComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);

  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);

  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: boolean | null): void {
    this.checked.set(Boolean(value));
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checked.set(checked);
    this.onChange(checked);
  }
}
