import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TuiInput } from '@taiga-ui/core';

let nextTextFieldId = 0;

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
        [id]="inputId"
        [attr.autocomplete]="autocomplete()"
        [attr.inputmode]="inputMode()"
        [attr.max]="max()"
        [attr.maxlength]="maxLength()"
        [attr.min]="min()"
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
        <label tuiLabel [attr.for]="inputId">{{ label() }}</label>
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
  /** Id único para asociar el <label for> con el <input> (a11y). */
  protected readonly inputId = `app-text-field-${nextTextFieldId++}`;
  readonly label = input<string | null>(null);
  readonly placeholder = input('');
  readonly type = input<
    'date' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url'
  >('text');
  readonly size = input<'s' | 'm' | 'l'>('m');
  readonly readonly = input(false);
  readonly autocomplete = input<string | null>(null);
  readonly inputMode = input<string | null>(null);
  readonly min = input<string | number | null>(null);
  readonly max = input<string | number | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly pattern = input<string | null>(null);
  /** Sanea el valor en cada cambio (bloquea caracteres inválidos al escribir/pegar). */
  readonly inputFilter = input<((value: string) => string) | null>(null);

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
    const input = event.target as HTMLInputElement;
    const filter = this.inputFilter();
    const value = filter ? filter(input.value) : input.value;

    // Si el saneador descartó caracteres, reflejarlo de inmediato en el <input>
    // para que el usuario no vea texto inválido "pegado" en el campo.
    if (value !== input.value) {
      input.value = value;
    }

    this.value.set(value);
    this.onChange(value);
  }
}
