import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';

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
  slug: string | null = null;
  currentPath: string = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 20;
      });
    }

    // Get slug from URL
    this.slug = this.route.snapshot.paramMap.get('slug');
    
    // Track current path for active link highlighting
    this.router.events.subscribe(() => {
      this.currentPath = this.router.url;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  getLoginPath(): string {
    return this.slug ? `/${this.slug}/login` : '/login';
  }

  getRegisterPath(): string {
    return this.slug ? `/${this.slug}/register` : '/register';
  }

  getPublicPath(path: string): string {
    return this.slug ? `/${this.slug}/publico/${path}` : `/publico/${path}`;
  }

  isActive(path: string): boolean {
    const fullPath = this.getPublicPath(path);
    return this.currentPath === fullPath || this.currentPath.startsWith(fullPath + '/');
  }
}
