import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TuiInput } from '@taiga-ui/core';

@Component({
  selector: 'app-text-field',
  imports: [TuiInput],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTextFieldComponent),
      multi: true,
    },
  ],
  template: `
    <tui-textfield [tuiTextfieldSize]="size()">
      <input
        tuiInput
        [attr.autocomplete]="autocomplete()"
        [attr.inputmode]="inputMode()"
        [attr.maxlength]="maxLength()"
        [attr.pattern]="pattern()"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
        [readOnly]="readonly()"
        [type]="type()"
        [value]="value()"
        (blur)="onTouched()"
        (input)="onInput($event)"
      />

      @if (label()) {
        <label tuiLabel>{{ label() }}</label>
      }
    </tui-textfield>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTextFieldComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly placeholder = input('');
  readonly type = input<'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url'>(
    'text',
  );
  readonly size = input<'s' | 'm' | 'l'>('m');
  readonly readonly = input(false);
  readonly autocomplete = input<string | null>(null);
  readonly inputMode = input<string | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly pattern = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
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
    this.onChange(value);
  }
}
