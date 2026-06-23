import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AppSkeletonComponent } from './skeleton.component';

/**
 * Placeholder con forma de grid de tarjetas para listados que aún cargan
 * (ej. propiedades). Reserva el espacio real de las tarjetas para evitar
 * saltos de layout (CLS).
 */
@Component({
  selector: 'app-skeleton-card-grid',
  imports: [AppSkeletonComponent, TranslocoModule],
  template: `
    <div
      class="sk-grid"
      role="status"
      aria-live="polite"
      [attr.aria-busy]="true"
      [attr.aria-label]="label() ?? ('common.loading' | transloco)"
    >
      @for (card of cards(); track $index) {
        <div class="sk-card" aria-hidden="true">
          <app-skeleton [height]="imageHeight()" radius="0" />
          <div class="sk-card__body">
            <app-skeleton height="1.1rem" width="75%" />
            <app-skeleton height="0.8rem" width="55%" />
            <div class="sk-card__footer">
              <app-skeleton height="0.8rem" width="40%" />
              <app-skeleton height="2rem" width="2rem" radius="var(--app-radius-md)" />
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .sk-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .sk-card {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      overflow: hidden;
    }

    .sk-card__body {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-3);
      padding: var(--app-space-4);
    }

    .sk-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-block-start: var(--app-space-2);
    }

    @media (max-width: 1024px) {
      .sk-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .sk-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSkeletonCardGridComponent {
  /** Número de tarjetas placeholder. */
  readonly cardCount = input<number>(6);
  /** Alto de la imagen placeholder (debe coincidir con la tarjeta real). */
  readonly imageHeight = input<string>('180px');
  /** Etiqueta accesible (cae a 'common.loading'). */
  readonly label = input<string | null>(null);

  protected readonly cards = computed(() => Array.from({ length: this.cardCount() }));
}
