import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { toDateOnly } from '../../../core/utils/date-only.util';

@Component({
  selector: 'app-date-picker',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <label class="app-date">
      @if (label()) {
        <span class="app-date__label">{{ label() }}</span>
      }

      <input
        class="app-date__control"
        type="date"
        [attr.aria-label]="ariaLabel() ?? label()"
        [disabled]="disabled()"
        [max]="max()"
        [min]="min()"
        [readOnly]="readonly()"
        [value]="value()"
        (blur)="onTouched()"
        (input)="onInput($event)"
      />
    </label>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .app-date {
      display: grid;
      gap: var(--app-space-2);
      inline-size: 100%;
    }

    .app-date__label {
      color: var(--app-color-text);
      font-size: 0.8125rem;
      font-weight: 650;
    }

    .app-date__control {
      block-size: 44px;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      box-sizing: border-box;
      color: var(--app-color-text);
      font: inherit;
      inline-size: 100%;
      padding: 0 var(--app-space-3);
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }

    .app-date__control:focus {
      border-color: var(--app-color-primary);
      box-shadow: 0 0 0 3px rgb(37 99 235 / 14%);
      outline: none;
    }

    .app-date__control:disabled {
      cursor: not-allowed;
      opacity: 0.62;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDatePickerComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly readonly = input(false);
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | Date | null): void {
    this.value.set(this.toInputValue(value));
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value || null);
  }

  private toInputValue(value: string | Date | null): string {
    if (!value) {
      return '';
    }

    return toDateOnly(value);
  }
}
