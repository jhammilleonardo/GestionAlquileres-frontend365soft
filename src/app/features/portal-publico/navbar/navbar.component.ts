import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';
import { SlugService } from '../../../core/services/slug.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  readonly Home = Home;
  isMenuOpen = false;
  isScrolled = false;
  currentPath: string = '';

  private slugService = inject(SlugService);
  private router = inject(Router);

  // Obtiene el slug desde SlugService (ya es establecido por PublicLayoutComponent)
  get slug(): string | null {
    return this.slugService.getSlug();
  }

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
    return this.slug ? ['/', this.slug, 'login'] : ['/login'];
  }

  getRegisterPath(): string[] {
    return this.slug ? ['/', this.slug, 'register'] : ['/register'];
  }

  getPublicPath(path: string): string {
    return this.slug ? `/${this.slug}/publico/${path}` : `/publico/${path}`;
  }

  isActive(path: string): boolean {
    const fullPath = this.getPublicPath(path);
    return this.currentPath === fullPath || this.currentPath.startsWith(fullPath + '/');
  }
}
