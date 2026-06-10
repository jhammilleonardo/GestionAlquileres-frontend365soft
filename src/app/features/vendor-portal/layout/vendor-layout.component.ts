import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Wrench, Menu, LogOut, User, UserCircle } from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { LanguageService } from '../../../core/services/language.service';
import { SlugService } from '../../../core/services/slug.service';
import { VendorAuthService } from '../../../core/services/vendor/vendor-auth.service';

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'vendorPortal', alias: 'vendorPortal' })],
  templateUrl: './vendor-layout.component.html',
  styleUrl: './vendor-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorLayoutComponent {
  readonly Home = Home;
  readonly Wrench = Wrench;
  readonly Menu = Menu;
  readonly LogOut = LogOut;
  readonly User = User;
  readonly UserCircle = UserCircle;

  readonly languageService = inject(LanguageService);
  private readonly vendorAuth = inject(VendorAuthService);
  private readonly slugService = inject(SlugService);
  private readonly router = inject(Router);

  readonly vendor = this.vendorAuth.currentVendor;
  readonly sidebarCollapsed = signal(typeof window !== 'undefined' && window.innerWidth <= 768);
  readonly isUserMenuOpen = signal(false);

  readonly homeUrl = computed(() => this.slugService.buildUrl('/vendor'));
  readonly profileUrl = computed(() => this.slugService.buildUrl('/vendor/perfil'));

  readonly initials = computed(() => {
    const name = this.vendor()?.name ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  onNavItemClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.sidebarCollapsed.set(true);
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    const slug = this.vendor()?.tenant_slug ?? this.slugService.getSlug();
    this.vendorAuth.logout();
    void this.router.navigate(slug ? ['/', slug, 'vendor', 'login'] : ['/login']);
  }
}
