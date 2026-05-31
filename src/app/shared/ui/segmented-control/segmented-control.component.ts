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

export interface AppSegmentedControlOption<TValue extends string = string> {
  label: string;
  value: TValue;
  disabled?: boolean;
}

@Component({
  selector: 'app-segmented-control',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSegmentedControlComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-segmented" role="radiogroup" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
        <button
          class="app-segmented__item"
          type="button"
          role="radio"
          [class.app-segmented__item--active]="option.value === selected()"
          [attr.aria-checked]="option.value === selected()"
          [disabled]="disabled() || option.disabled"
          (click)="select(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .app-segmented {
      display: inline-flex;
      gap: var(--app-space-1);
      padding: var(--app-space-1);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface-muted);
    }

    .app-segmented__item {
      min-block-size: 2.25rem;
      border: 0;
      border-radius: var(--app-radius-md);
      background: transparent;
      color: var(--app-color-text-muted);
      cursor: pointer;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 750;
      padding-inline: var(--app-space-3);
      transition:
        background 0.15s,
        color 0.15s,
        box-shadow 0.15s;
    }

    .app-segmented__item:hover:not(:disabled) {
      color: var(--app-color-text);
    }

    .app-segmented__item--active {
      background: var(--app-color-surface);
      color: var(--app-color-primary);
      box-shadow: var(--app-shadow-sm);
    }

    .app-segmented__item:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSegmentedControlComponent<
  TValue extends string = string,
> implements ControlValueAccessor {
  readonly options = input.required<readonly AppSegmentedControlOption<TValue>[]>();
  readonly ariaLabel = input<string | null>(null);
  readonly valueChanged = output<TValue | null>();

  protected readonly selected = signal<TValue | null>(null);
  protected readonly disabled = signal(false);
  protected readonly firstEnabledValue = computed(
    () => this.options().find((option) => !option.disabled)?.value ?? null,
  );

  private onChange: (value: TValue | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: TValue | null): void {
    this.selected.set(value ?? this.firstEnabledValue());
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

  protected select(value: TValue): void {
    this.selected.set(value);
    this.onChange(value);
    this.valueChanged.emit(value);
    this.onTouched();
  }
}
