import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule, CloudOff } from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

/**
 * Pantalla que se muestra cuando el portal de un tenant no está disponible
 * (sitio inexistente o despublicado). No revela si el tenant existe.
 */
@Component({
  selector: 'app-site-unavailable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  template: `
    <main class="unavailable" role="main">
      <div class="unavailable-card">
        <lucide-icon [img]="CloudOff" class="unavailable-icon" aria-hidden="true" />
        <h1 class="unavailable-title">{{ 'public.unavailable.title' | transloco }}</h1>
        <p class="unavailable-message">{{ 'public.unavailable.message' | transloco }}</p>
      </div>
    </main>
  `,
  styles: [
    `
      .unavailable {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      }

      .unavailable-card {
        max-width: 480px;
        width: 100%;
        text-align: center;
        background: #fff;
        padding: 3rem 2rem;
        border-radius: 1rem;
        box-shadow: 0 10px 40px rgba(37, 99, 235, 0.12);
        border: 1px solid #bfdbfe;
      }

      .unavailable-icon {
        width: 64px;
        height: 64px;
        color: #93c5fd;
        margin: 0 auto 1.25rem;
      }

      .unavailable-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 0.75rem;
      }

      .unavailable-message {
        color: #475569;
        line-height: 1.5;
      }
    `,
  ],
})
export class SiteUnavailableComponent {
  readonly CloudOff = CloudOff;
}
