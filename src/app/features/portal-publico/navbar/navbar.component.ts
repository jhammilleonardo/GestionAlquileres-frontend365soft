import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { SlugService } from '../../../core/services/slug.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  readonly Home = Home;
  isMenuOpen = false;
  isScrolled = false;
  currentPath: string = '';

  readonly languageService = inject(LanguageService);
  private slugService = inject(SlugService);
  private router = inject(Router);

  // Signal reactivo del slug — Angular lo lee eficientemente sin re-computar en cada ciclo
  readonly slug = this.slugService.currentSlug;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 20;
      });
    }

    this.router.events.subscribe(() => {
      this.currentPath = this.router.url;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
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
    return this.currentPath === fullPath || this.currentPath.startsWith(fullPath + '/');
  }
}
