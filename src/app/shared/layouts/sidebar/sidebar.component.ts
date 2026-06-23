import {
  Component,
  inject,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
  effect,
  signal,
} from '@angular/core';
import { NavigationEnd, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
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
  BookOpen,
  Settings,
  Bell,
  FileCheck,
  User,
  UserCog,
  AlertCircle,
  Globe,
  MessageSquare,
  ShieldCheck,
  CalendarCheck,
  Star,
  Sparkles,
  KeyRound,
  LogOut,
  ChevronDown,
  BriefcaseBusiness,
  Landmark,
  SlidersHorizontal,
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
  BookOpen,
  Settings,
  Bell,
  User,
  UserCog,
  AlertCircle,
  Globe,
  MessageSquare,
  ShieldCheck,
  CalendarCheck,
  Star,
  Sparkles,
  KeyRound,
  BriefcaseBusiness,
  Landmark,
  SlidersHorizontal,
};

const GROUP_ICON_MAP: Readonly<Record<string, string>> = {
  'sidebar.groups.operations': 'BriefcaseBusiness',
  'sidebar.groups.finance': 'Landmark',
  'sidebar.groups.management': 'SlidersHorizontal',
  'sidebar.groups.system': 'Settings',
};

/** Orden fijo de las secciones del menú (claves i18n). */
const GROUP_ORDER: readonly string[] = [
  'sidebar.groups.operations',
  'sidebar.groups.finance',
  'sidebar.groups.management',
  'sidebar.groups.system',
];

const OPEN_GROUPS_STORAGE_PREFIX = 'admin_sidebar_open_groups';

/** Una sección renderizable: etiqueta opcional + sus items. */
interface MenuSection {
  /** Clave i18n de la sección; null para los items sueltos (ej. Dashboard). */
  label: string | null;
  items: MenuOption[];
  badgeCount?: number;
}

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

  readonly LogOut = LogOut;
  readonly ChevronDown = ChevronDown;

  expanded = this.sidebarService.expanded;
  isMobileOpen = this.sidebarService.mobileOpen;
  readonly openGroups = signal<ReadonlySet<string>>(this.loadOpenGroups());
  private readonly currentUrl = signal(this.router.url);

  /** Items filtrados por permisos + slug prefijado en la ruta */
  private menuOptions = computed<MenuOption[]>(() =>
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

  /** Item de perfil (va al pie, separado del resto). */
  readonly profileItem = computed(() =>
    this.menuOptions().find((o) => o.route.endsWith('/perfil')),
  );

  /**
   * Items agrupados en secciones ordenadas. Los items sin `group` (Dashboard) van
   * primero sin etiqueta; el perfil se excluye (se muestra aparte en el footer).
   */
  readonly sections = computed<MenuSection[]>(() => {
    const items = this.menuOptions().filter((o) => !o.route.endsWith('/perfil'));
    const ungrouped = items.filter((o) => !o.group);
    const result: MenuSection[] = [];

    if (ungrouped.length > 0) {
      result.push({ label: null, items: ungrouped });
    }
    for (const groupKey of GROUP_ORDER) {
      const groupItems = items.filter((o) => o.group === groupKey);
      if (groupItems.length > 0) {
        result.push({
          label: groupKey,
          items: groupItems,
          badgeCount: groupItems.reduce((total, item) => total + (item.badgeCount ?? 0), 0),
        });
      }
    }
    return result;
  });

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

    effect(() => {
      const url = this.currentUrl();
      const activeSection = this.sections().find(
        (section) => section.label && section.items.some((item) => url.startsWith(item.route)),
      );
      if (activeSection?.label) {
        this.openGroups.update((current) => {
          if (current.has(activeSection.label!)) return current;
          return new Set([...current, activeSection.label!]);
        });
      }
    });

    effect(() => this.saveOpenGroups(this.openGroups()));

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  getIconComponent(iconName: string): LucideIconData {
    return ICON_MAP[iconName] ?? Settings;
  }

  formatBadgeCount(count?: number): string {
    if (!count) return '';
    return count > 99 ? '99+' : count.toString();
  }

  getGroupIcon(sectionLabel: string): LucideIconData {
    return this.getIconComponent(GROUP_ICON_MAP[sectionLabel] ?? 'Settings');
  }

  isSectionOpen(sectionLabel: string): boolean {
    return this.openGroups().has(sectionLabel);
  }

  isSectionActive(section: MenuSection): boolean {
    const url = this.currentUrl();
    return section.items.some((item) => url.startsWith(item.route));
  }

  toggleSection(sectionLabel: string): void {
    const wasCollapsed = !this.expanded();
    if (wasCollapsed) {
      this.sidebarService.expand();
    }
    this.openGroups.update((current) => {
      const next = new Set(current);
      if (wasCollapsed) {
        next.add(sectionLabel);
      } else if (next.has(sectionLabel)) {
        next.delete(sectionLabel);
      } else {
        next.add(sectionLabel);
      }
      return next;
    });
  }

  sectionPanelId(index: number): string {
    return `sidebar-section-${index}`;
  }

  private loadOpenGroups(): ReadonlySet<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const value: unknown = JSON.parse(
        window.localStorage.getItem(this.openGroupsStorageKey()) ?? '[]',
      );
      if (!Array.isArray(value)) return new Set();
      return new Set(
        value.filter(
          (group): group is string => typeof group === 'string' && GROUP_ORDER.includes(group),
        ),
      );
    } catch {
      return new Set();
    }
  }

  private saveOpenGroups(groups: ReadonlySet<string>): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.openGroupsStorageKey(), JSON.stringify([...groups]));
  }

  private openGroupsStorageKey(): string {
    return `${OPEN_GROUPS_STORAGE_PREFIX}:${this.slugService.getSlug() ?? 'default'}`;
  }

  closeMobileMenu(): void {
    if (this.sidebarService.isMobile()) {
      this.sidebarService.closeMobile();
    }
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
