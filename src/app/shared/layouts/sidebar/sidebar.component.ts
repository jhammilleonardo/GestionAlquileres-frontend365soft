import { Component, inject, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  LucideAngularModule,
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Wrench,
  Component as ComponentIcon,
  BarChart3,
  Settings,
  Bell,
  FileCheck,
  User,
} from 'lucide-angular';

import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { MenuOption } from '../../../core/models/user.model';

const ICON_MAP: Record<string, unknown> = {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  FileCheck,
  CreditCard,
  Wrench,
  Component: ComponentIcon,
  BarChart3,
  Settings,
  Bell,
  User,
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private slugService = inject(SlugService);
  private destroyRef = inject(DestroyRef);

  expanded = this.sidebarService.expanded;
  isMobileOpen = this.sidebarService.mobileOpen;

  /** Items filtrados por permisos + slug prefijado en la ruta */
  menuOptions = computed<MenuOption[]>(() =>
    this.sidebarService.menuItems().map((option) => ({
      ...option,
      route: this.slugService.buildUrl(option.route),
    })),
  );

  constructor() {
    const onResize = () => {
      if (!this.sidebarService.isMobile() && this.sidebarService.mobileOpen()) {
        this.sidebarService.closeMobile();
      }
    };

    window.addEventListener('resize', onResize);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = '';
    });
  }

  getIconComponent(iconName: string): unknown {
    return ICON_MAP[iconName] ?? Settings;
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
