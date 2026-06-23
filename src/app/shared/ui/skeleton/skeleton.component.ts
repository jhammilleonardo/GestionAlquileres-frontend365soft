import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Bloque base de carga (shimmer). Es decorativo: se marca `aria-hidden`
 * para que los lectores de pantalla no anuncien contenido falso. El estado
 * de carga debe anunciarlo el contenedor (ver `app-skeleton-table` /
 * `app-skeleton-card-grid`).
 */
@Component({
  selector: 'app-skeleton',
  template: `<span
    class="skeleton"
    [class.skeleton--circle]="circle()"
    [style.inline-size]="width()"
    [style.block-size]="height()"
    [style.border-radius]="resolvedRadius()"
    aria-hidden="true"
  ></span>`,
  styles: `
    :host {
      display: block;
    }

    .skeleton {
      display: block;
      background-color: var(--app-color-surface-muted);
      background-image: linear-gradient(
        90deg,
        var(--app-color-surface-muted) 25%,
        var(--app-color-border) 50%,
        var(--app-color-surface-muted) 75%
      );
      background-size: 200% 100%;
      animation: app-skeleton-shimmer 1.4s ease-in-out infinite;
    }

    .skeleton--circle {
      border-radius: 50% !important;
    }

    @keyframes app-skeleton-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    /* Respeta la preferencia del sistema de reducir movimiento (a11y / WCAG 2.3.3). */
    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background-image: none;
        opacity: 0.7;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSkeletonComponent {
  /** Ancho CSS (ej. '100%', '8rem'). */
  readonly width = input<string>('100%');
  /** Alto CSS (ej. '1rem', '220px'). */
  readonly height = input<string>('1rem');
  /** Radio de borde CSS. Si es círculo se ignora. */
  readonly radius = input<string>('var(--app-radius-sm)');
  /** Renderiza un círculo (avatares, íconos). */
  readonly circle = input<boolean>(false);

  protected readonly resolvedRadius = computed(() => (this.circle() ? '50%' : this.radius()));
}
