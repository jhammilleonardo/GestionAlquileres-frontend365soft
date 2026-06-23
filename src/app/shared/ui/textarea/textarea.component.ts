import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TuiTextarea } from '@taiga-ui/kit';

let nextTextareaId = 0;

@Component({
  selector: 'app-textarea',
  imports: [TuiTextarea],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTextareaComponent),
      multi: true,
    },
  ],
  template: `
    <tui-textfield [tuiTextfieldSize]="size()">
      <textarea
        tuiTextarea
        [id]="inputId"
        [disabled]="disabled()"
        [attr.maxlength]="maxLength()"
        [max]="maxRows()"
        [min]="minRows()"
        [placeholder]="placeholder()"
        [readOnly]="readonly()"
        [value]="value()"
        (blur)="onTouched()"
        (input)="onInput($event)"
      ></textarea>

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
export class AppTextareaComponent implements ControlValueAccessor {
  /** Id único para asociar el <label for> con el <textarea> (a11y). */
  protected readonly inputId = `app-textarea-${nextTextareaId++}`;
  readonly label = input<string | null>(null);
  readonly placeholder = input('');
  readonly size = input<'s' | 'm' | 'l'>('m');
  readonly readonly = input(false);
  readonly minRows = input(3);
  readonly maxRows = input(8);
  readonly maxLength = input<number | null>(null);

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
    const value = (event.target as HTMLTextAreaElement).value;
    this.value.set(value);
    this.onChange(value);
  }
}
