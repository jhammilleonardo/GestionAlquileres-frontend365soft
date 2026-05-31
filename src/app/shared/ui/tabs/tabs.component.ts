import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface AppTabOption<TValue extends string = string> {
  label: string;
  value: TValue;
  badge?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTabsComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-tabs" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.value) {
        <button
          class="app-tabs__item"
          type="button"
          role="tab"
          [class.app-tabs__item--active]="tab.value === selected()"
          [attr.aria-selected]="tab.value === selected()"
          [disabled]="disabled() || tab.disabled"
          (click)="select(tab.value)"
        >
          <span>{{ tab.label }}</span>
          @if (tab.badge !== undefined) {
            <span class="app-tabs__badge">{{ tab.badge }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .app-tabs {
      display: inline-flex;
      flex-wrap: wrap;
      gap: var(--app-space-1);
      padding: var(--app-space-1);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface-muted);
    }

    .app-tabs__item {
      display: inline-flex;
      min-block-size: 2.25rem;
      align-items: center;
      justify-content: center;
      gap: var(--app-space-2);
      border: 0;
      border-radius: var(--app-radius-md);
      background: transparent;
      color: var(--app-color-text-muted);
      cursor: pointer;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 700;
      padding: 0 var(--app-space-3);
      transition:
        background 0.15s ease,
        color 0.15s ease,
        box-shadow 0.15s ease;
    }

    .app-tabs__item:hover:not(:disabled) {
      color: var(--app-color-text);
    }

    .app-tabs__item--active {
      background: var(--app-color-surface);
      color: var(--app-color-primary);
      box-shadow: var(--app-shadow-sm);
    }

    .app-tabs__item:focus-visible {
      outline: 3px solid rgb(37 99 235 / 18%);
      outline-offset: 2px;
    }

    .app-tabs__item:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .app-tabs__badge {
      min-inline-size: 1.25rem;
      border-radius: 999px;
      background: var(--app-color-primary);
      color: #fff;
      font-size: 0.75rem;
      line-height: 1.25rem;
      padding-inline: 0.375rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTabsComponent<TValue extends string = string> implements ControlValueAccessor {
  readonly tabs = input.required<readonly AppTabOption<TValue>[]>();
  readonly ariaLabel = input<string | null>(null);

  protected readonly selected = signal<TValue | null>(null);
  protected readonly disabled = signal(false);
  protected readonly firstEnabledValue = computed(
    () => this.tabs().find((tab) => !tab.disabled)?.value ?? null,
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
    this.onTouched();
  }
}
