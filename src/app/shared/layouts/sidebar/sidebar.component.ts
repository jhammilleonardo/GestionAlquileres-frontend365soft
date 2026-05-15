import {
  Component,
  inject,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  LucideAngularModule,
  type LucideIconData,
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
  UserCog,
} from 'lucide-angular';

import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { LanguageService } from '../../../core/services/language.service';
import { MenuOption } from '../../../core/models/user.model';
import { TranslocoModule } from '@jsverse/transloco';
import { PaymentService } from '../../../core/services/admin/payment.service';
import { PermissionsService } from '../../../core/services/permissions.service';

const ICON_MAP: Record<string, LucideIconData> = {
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
  UserCog,
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, TranslocoModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private slugService = inject(SlugService);
  private destroyRef = inject(DestroyRef);
  private paymentService = inject(PaymentService);
  private permissionsService = inject(PermissionsService);
  readonly languageService = inject(LanguageService);

  expanded = this.sidebarService.expanded;
  isMobileOpen = this.sidebarService.mobileOpen;

  /** Items filtrados por permisos + slug prefijado en la ruta */
  menuOptions = computed<MenuOption[]>(() =>
    this.sidebarService.menuItems().map((option) => {
      const pending = this.paymentService.stats()?.total_pending ?? 0;
      const badgeCount = option.module === 'payments' && pending > 0 ? pending : undefined;
      return {
        ...option,
        badgeCount,
        route: this.slugService.buildUrl(option.route),
      };
    }),
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

    effect(() => {
      const role = this.permissionsService.role();
      if (!role || role === 'INQUILINO' || role === 'TECNICO') return;
      this.paymentService.loadStats();
    });
  }

  getIconComponent(iconName: string): LucideIconData {
    return ICON_MAP[iconName] ?? Settings;
  }

  formatBadgeCount(count?: number): string {
    if (!count) return '';
    return count > 99 ? '99+' : count.toString();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
