import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  signal,
} from '@angular/core';
import { HelpCircle, LucideAngularModule } from 'lucide-angular';

/**
 * Icono de ayuda ("?") con una explicación breve. La burbuja aparece al pasar
 * el cursor o enfocar con teclado, y se puede fijar con un clic (útil en móvil
 * y para leer con calma). Accesible: botón con `aria-label`, burbuja `role=tooltip`.
 */
@Component({
  selector: 'app-info-hint',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <span class="info-hint">
      <button
        type="button"
        class="info-hint__btn"
        [attr.aria-label]="ariaLabel() || text()"
        [attr.aria-expanded]="open()"
        (click)="toggle($event)"
        (mouseenter)="hovered.set(true)"
        (mouseleave)="hovered.set(false)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        (keydown.escape)="pinned.set(false)"
      >
        <lucide-icon [img]="HelpIcon" [size]="size()" aria-hidden="true"></lucide-icon>
      </button>

      @if (open()) {
        <span class="info-hint__bubble" role="tooltip">{{ text() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .info-hint {
      position: relative;
      display: inline-flex;
    }

    .info-hint__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--tui-text-tertiary, #94a3b8);
      cursor: pointer;
      line-height: 0;
      border-radius: 999px;
    }

    .info-hint__btn:hover,
    .info-hint__btn:focus-visible {
      color: var(--tui-status-info, #2563eb);
    }

    .info-hint__btn:focus-visible {
      outline: 2px solid var(--tui-status-info, #2563eb);
      outline-offset: 2px;
    }

    .info-hint__bubble {
      position: absolute;
      inset-block-start: calc(100% + 0.375rem);
      inset-inline-start: 50%;
      transform: translateX(-50%);
      z-index: 60;
      inline-size: max-content;
      max-inline-size: 16rem;
      padding: 0.5rem 0.625rem;
      border-radius: 0.5rem;
      background: var(--tui-text-primary, #0f172a);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 400;
      line-height: 1.35;
      white-space: normal;
      box-shadow: 0 6px 20px rgb(15 23 42 / 25%);
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInfoHintComponent {
  /** Texto de la explicación (ya traducido por el consumidor). */
  readonly text = input.required<string>();
  /** Etiqueta accesible del botón; por defecto usa el propio texto. */
  readonly ariaLabel = input<string>('');
  readonly size = input(15);

  protected readonly HelpIcon = HelpCircle;

  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);
  protected readonly pinned = signal(false);

  protected readonly open = computed(() => this.hovered() || this.focused() || this.pinned());

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.pinned.update((value) => !value);
  }

  /** Un clic fuera del icono cierra la burbuja fijada. */
  @HostListener('document:click')
  protected closeOnOutsideClick(): void {
    if (this.pinned()) this.pinned.set(false);
  }
}
