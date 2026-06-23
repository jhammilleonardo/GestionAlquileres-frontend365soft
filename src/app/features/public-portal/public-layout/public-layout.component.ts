import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { SiteUnavailableComponent } from '../site-unavailable/site-unavailable.component';
import { SlugService } from '../../../core/services/slug.service';
import { PublicBrandingService } from '../../../core/services/public-branding.service';
import { readableTextColor } from '../../../core/utils/contrast.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, SiteUnavailableComponent],
  template: `
    @if (branding.status() === 'unavailable') {
      <app-site-unavailable />
    } @else {
      <div class="public-layout">
        <app-navbar></app-navbar>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
        <app-footer></app-footer>
      </div>
    }
  `,
  styles: [
    `
      .public-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .main-content {
        flex: 1;
      }
    `,
  ],
})
export class PublicLayoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private slugService = inject(SlugService);
  protected readonly branding = inject(PublicBrandingService);
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  // Color en vivo enviado por el editor admin (postMessage) cuando el portal va
  // embebido como preview. Tiene precedencia sobre el color guardado para dar
  // feedback inmediato mientras se elige el color, sin guardar ni recargar.
  private readonly previewPrimary = signal<string | null>(null);

  private readonly onBrandMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) {
      return;
    }
    const data = event.data as { type?: string; primary?: string } | null;
    if (data?.type === 'brand-preview' && typeof data.primary === 'string') {
      this.previewPrimary.set(data.primary);
    }
  };

  constructor() {
    window.addEventListener('message', this.onBrandMessage);
    this.destroyRef.onDestroy(() => window.removeEventListener('message', this.onBrandMessage));

    // Aplica los colores del tenant como variables CSS sobre el contenedor del
    // portal — así el tema queda acotado al portal público y no afecta al admin.
    effect(() => {
      const config = this.branding.branding();
      const el = this.host.nativeElement as HTMLElement;
      const primary = this.previewPrimary() ?? config?.primary_color;
      if (primary) {
        // El portal usa UN solo color de marca. El segundo tono (degradados,
        // hovers) se deriva automáticamente oscureciendo el primario, así todo
        // el portal queda monocromático y cohesivo con un único color.
        const secondary = `color-mix(in srgb, ${primary} 75%, #000)`;
        el.style.setProperty('--brand-primary', primary);
        el.style.setProperty('--brand-secondary', secondary);
        // Texto legible sobre el color de marca (WCAG AA): negro o blanco según
        // la luminancia del primario, para que un color claro no deje el texto
        // blanco ilegible en hero/CTA/botones.
        el.style.setProperty('--brand-on-primary', readableTextColor(primary));
        // Mapear el color de marca a las variables del design system (componentes
        // propios) y del acento de Taiga (botones tuiButton) para que TODO el
        // portal —incluidos los botones compartidos— use el color del tenant.
        el.style.setProperty('--app-color-primary', primary);
        el.style.setProperty('--app-color-primary-hover', secondary);
        el.style.setProperty('--tui-background-accent-1', primary);
        el.style.setProperty('--tui-background-accent-1-hover', secondary);
        el.style.setProperty('--tui-background-accent-1-pressed', secondary);
      }
      const hero = this.branding.heroImageUrl();
      // Defensa: solo inyectar la URL en el url() de CSS si no contiene
      // caracteres que permitan escapar del valor (comillas, paréntesis,
      // espacios). El path lo genera el servidor, pero validamos igualmente.
      if (hero && !/['"()\s]/.test(hero)) {
        el.style.setProperty('--brand-hero-image', `url('${hero}')`);
      } else {
        el.style.removeProperty('--brand-hero-image');
      }
    });
  }

  ngOnInit(): void {
    // Obtener el slug de la ruta padre y establecerlo en el servicio
    this.route.parent?.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.slugService.setSlug(slug);
        this.branding.load(slug);
      }
    });
  }
}
