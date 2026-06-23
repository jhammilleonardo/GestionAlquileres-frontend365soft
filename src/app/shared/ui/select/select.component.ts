import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
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

let selectInstanceId = 0;

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
    <div class="app-select">
      @if (label()) {
        <span class="app-select__label" [id]="labelId">{{ label() }}</span>
      }

      <button
        type="button"
        class="app-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listId"
        [attr.aria-labelledby]="label() ? labelId : null"
        [attr.aria-label]="ariaLabel() ?? null"
        [attr.aria-activedescendant]="open() && activeIndex() >= 0 ? optionId(activeIndex()) : null"
        [disabled]="isDisabled()"
        [class.app-select__trigger--placeholder]="!selectedLabel()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
        (blur)="onTouched()"
      >
        <span class="app-select__value">{{ selectedLabel() || placeholder() || '' }}</span>
        <svg
          class="app-select__chevron"
          [class.app-select__chevron--open]="open()"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      @if (open()) {
        <ul
          class="app-select__panel"
          role="listbox"
          [id]="listId"
          [attr.aria-label]="label() ?? ariaLabel()"
          [style.inline-size.px]="panelWidth()"
          [style.inset-inline-start.px]="panelLeft()"
          [style.inset-block-start.px]="panelTop()"
          [style.inset-block-end.px]="panelBottom()"
          [style.max-block-size.px]="panelMaxHeight()"
        >
          @for (option of options(); track option.value; let i = $index) {
            <li
              class="app-select__option"
              role="option"
              [id]="optionId(i)"
              [attr.aria-selected]="option.value === value()"
              [attr.aria-disabled]="option.disabled || null"
              [class.app-select__option--active]="i === activeIndex()"
              [class.app-select__option--selected]="option.value === value()"
              [class.app-select__option--disabled]="option.disabled"
              (click)="selectOption(option)"
              (mouseenter)="activeIndex.set(i)"
            >
              {{ option.label }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .app-select {
      position: relative;
      display: grid;
      gap: var(--app-space-2);
      inline-size: 100%;
    }

    .app-select__label {
      color: var(--app-color-text);
      font-size: 0.8125rem;
      font-weight: 650;
    }

    .app-select__trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-2);
      block-size: 44px;
      inline-size: 100%;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      color: var(--app-color-text);
      font: inherit;
      text-align: start;
      padding: 0 var(--app-space-3);
      cursor: pointer;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }

    .app-select__trigger:focus-visible {
      border-color: var(--app-color-primary);
      box-shadow: 0 0 0 3px rgb(37 99 235 / 14%);
      outline: none;
    }

    .app-select__trigger:disabled {
      cursor: not-allowed;
      opacity: 0.62;
    }

    .app-select__trigger--placeholder .app-select__value {
      color: var(--app-color-text-muted);
    }

    .app-select__value {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .app-select__chevron {
      flex-shrink: 0;
      color: var(--app-color-text-muted);
      transition: transform 0.18s ease;
    }

    .app-select__chevron--open {
      transform: rotate(180deg);
    }

    .app-select__panel {
      position: fixed;
      z-index: 10020;
      margin: 0;
      overflow-y: auto;
      list-style: none;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      box-shadow:
        0 4px 12px rgb(23 32 42 / 8%),
        0 12px 32px rgb(23 32 42 / 12%);
      padding: var(--app-space-1);
    }

    .app-select__option {
      border-radius: var(--app-radius-sm);
      color: var(--app-color-text);
      cursor: pointer;
      padding: 0.5rem var(--app-space-3);
      font-size: 0.9rem;
      line-height: 1.3;
    }

    .app-select__option--active {
      background: var(--app-color-surface-muted);
    }

    .app-select__option--selected {
      color: var(--app-color-primary);
      font-weight: 700;
    }

    .app-select__option--disabled {
      color: var(--app-color-text-muted);
      cursor: not-allowed;
      opacity: 0.6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSelectComponent<
  TValue extends string | number = string,
> implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly uid = ++selectInstanceId;

  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly required = input(false);
  readonly externalDisabled = input(false, { alias: 'disabled' });
  readonly options = input<readonly AppSelectOption<TValue>[]>([]);
  readonly valueChanged = output<TValue | null>();

  protected readonly value = signal<TValue | null>(null);
  protected readonly disabled = signal(false);
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly panelLeft = signal(0);
  protected readonly panelTop = signal<number | null>(null);
  protected readonly panelBottom = signal<number | null>(null);
  protected readonly panelWidth = signal(0);
  protected readonly panelMaxHeight = signal(256);

  protected readonly labelId = `app-select-label-${this.uid}`;
  protected readonly listId = `app-select-list-${this.uid}`;

  protected readonly isDisabled = computed(() => this.disabled() || this.externalDisabled());

  protected readonly selectedLabel = computed(() => {
    const value = this.value();
    return this.options().find((option) => option.value === value)?.label ?? '';
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

  protected optionId(index: number): string {
    return `app-select-option-${this.uid}-${index}`;
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected selectOption(option: AppSelectOption<TValue>): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.valueChanged.emit(option.value);
    this.close();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.open()) {
          this.moveActive(1);
        } else {
          this.openPanel();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.open()) {
          this.moveActive(-1);
        } else {
          this.openPanel();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.open()) {
          const option = this.options()[this.activeIndex()];
          if (option) this.selectOption(option);
        } else {
          this.openPanel();
        }
        break;
      case 'Home':
        if (this.open()) {
          event.preventDefault();
          this.activeIndex.set(this.firstEnabledIndex());
        }
        break;
      case 'End':
        if (this.open()) {
          event.preventDefault();
          this.activeIndex.set(this.lastEnabledIndex());
        }
        break;
      case 'Escape':
      case 'Tab':
        this.close();
        break;
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.close();
  }

  private openPanel(): void {
    const selectedIndex = this.options().findIndex((option) => option.value === this.value());
    this.activeIndex.set(selectedIndex >= 0 ? selectedIndex : this.firstEnabledIndex());
    this.positionPanel();
    this.open.set(true);
  }

  private close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
  }

  private moveActive(step: number): void {
    const options = this.options();
    if (options.length === 0) return;

    let index = this.activeIndex();
    for (let i = 0; i < options.length; i++) {
      index = (index + step + options.length) % options.length;
      if (!options[index].disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private firstEnabledIndex(): number {
    return this.options().findIndex((option) => !option.disabled);
  }

  private lastEnabledIndex(): number {
    const options = this.options();
    for (let i = options.length - 1; i >= 0; i--) {
      if (!options[i].disabled) return i;
    }
    return -1;
  }

  private positionPanel(): void {
    if (typeof window === 'undefined') return;

    const trigger = this.host.nativeElement.querySelector('.app-select__trigger');
    if (!(trigger instanceof HTMLElement)) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const defaultMaxHeight = 256;
    const below = window.innerHeight - rect.bottom - gap;
    const above = rect.top - gap;
    const openAbove = below < 180 && above > below;
    const maxHeight = Math.max(140, Math.min(defaultMaxHeight, openAbove ? above : below));

    this.panelLeft.set(rect.left);
    this.panelWidth.set(rect.width);
    this.panelMaxHeight.set(maxHeight);

    if (openAbove) {
      this.panelTop.set(null);
      this.panelBottom.set(window.innerHeight - rect.top + gap);
    } else {
      this.panelTop.set(rect.bottom + gap);
      this.panelBottom.set(null);
    }
  }
}
