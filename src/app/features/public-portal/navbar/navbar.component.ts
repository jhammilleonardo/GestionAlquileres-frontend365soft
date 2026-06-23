import {
  Component,
  computed,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { LucideAngularModule, Home } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { SlugService } from '../../../core/services/slug.service';
import { LanguageService } from '../../../core/services/language.service';
import { PublicBrandingService } from '../../../core/services/public-branding.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  readonly Home = Home;
  readonly isMenuOpen = signal(false);
  readonly isScrolled = signal(false);
  readonly currentPath = signal('');

  readonly languageService = inject(LanguageService);
  private slugService = inject(SlugService);
  private brandingService = inject(PublicBrandingService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signal reactivo del slug — Angular lo lee eficientemente sin re-computar en cada ciclo
  readonly slug = this.slugService.currentSlug;

  // Marca del tenant (logo + nombre) para el portal público
  readonly logoUrl = computed(() => this.brandingService.logoUrl());
  readonly companyName = computed(() => this.brandingService.branding()?.company_name ?? null);

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 20);
      });
    }

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPath.set(this.router.url);
        // Al navegar, cerrar el menú móvil (auto-cierre al seleccionar opción).
        this.isMenuOpen.set(false);
      });
  }

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  getLoginPath(): string[] {
    const s = this.slug();
    return s ? ['/', s, 'login'] : ['/login'];
  }

  getRegisterPath(): string[] {
    const s = this.slug();
    return s ? ['/', s, 'register'] : ['/register'];
  }

  getPublicPath(path: string): string {
    const s = this.slug();
    return s ? `/${s}/publico/${path}` : `/publico/${path}`;
  }

  isActive(path: string): boolean {
    const fullPath = this.getPublicPath(path);
    const current = this.currentPath();
    return current === fullPath || current.startsWith(fullPath + '/');
  }
}
