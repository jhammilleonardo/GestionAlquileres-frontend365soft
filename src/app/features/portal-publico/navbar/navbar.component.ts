import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isMenuOpen = false;
  isScrolled = false;
  slug: string | null = null;

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
}
