import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface AppSelectOption<TValue extends string | number = string> {
  label: string;
  value: TValue;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSelectComponent),
      multi: true,
    },
  ],
  template: `
    <label class="app-select">
      @if (label()) {
        <span class="app-select__label">{{ label() }}</span>
      }

      <select
        class="app-select__control"
        [attr.aria-label]="ariaLabel() ?? label()"
        [disabled]="disabled() || externalDisabled()"
        [value]="stringValue()"
        (blur)="onTouched()"
        (change)="onSelect($event)"
      >
        @if (placeholder()) {
          <option value="" [disabled]="required()">{{ placeholder() }}</option>
        }

        @for (option of options(); track option.value) {
          <option [disabled]="option.disabled" [value]="option.value">
            {{ option.label }}
          </option>
        }
      </select>
    </label>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .app-select {
      display: grid;
      gap: var(--app-space-2);
      inline-size: 100%;
    }

    .app-select__label {
      color: var(--app-color-text);
      font-size: 0.8125rem;
      font-weight: 650;
    }

    .app-select__control {
      block-size: 44px;
      inline-size: 100%;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      color: var(--app-color-text);
      font: inherit;
      padding: 0 var(--app-space-3);
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }

    .app-select__control:focus {
      border-color: var(--app-color-primary);
      box-shadow: 0 0 0 3px rgb(37 99 235 / 14%);
      outline: none;
    }

    .app-select__control:disabled {
      cursor: not-allowed;
      opacity: 0.62;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSelectComponent<
  TValue extends string | number = string,
> implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly required = input(false);
  readonly externalDisabled = input(false, { alias: 'disabled' });
  readonly options = input<readonly AppSelectOption<TValue>[]>([]);
  readonly valueChanged = output<TValue | null>();

  protected readonly value = signal<TValue | null>(null);
  protected readonly disabled = signal(false);
  protected readonly stringValue = computed(() => {
    const value = this.value();
    return value === null ? '' : String(value);
  });

  private onChange: (value: TValue | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: TValue | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: TValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onSelect(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement).value;
    const option = this.options().find((item) => String(item.value) === rawValue);
    const value = option?.value ?? null;

    this.value.set(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }
}
