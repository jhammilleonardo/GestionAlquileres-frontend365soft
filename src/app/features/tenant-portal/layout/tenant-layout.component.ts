import { Component, OnDestroy, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  Wrench,
  MessageSquare,
  History,
  User,
  LogOut,
  Menu,
  Bell,
  FileText,
  Settings,
  CreditCard,
  Check,
  Trash2,
  Plus,
  FileEdit,
} from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { InternalMessageService } from '../../../core/services/internal-message.service';
import {
  TenantNotificationService,
  TenantNotification,
} from '../../../core/services/tenant/tenant-notification.service';
import { SlugService } from '../../../core/services/slug.service';
import { ContractService } from '../../../core/services/admin/contract.service';
import { TenantConfigService } from '../../../core/services/admin/tenant-config.service';
import { FormatService } from '../../../core/services/format.service';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LanguageService } from '../../../core/services/language.service';

interface NavItem {
  labelKey: string;
  route: string;
  icon: typeof Home;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './tenant-layout.component.html',
  styleUrls: ['./tenant-layout.component.scss'],
})
export class TenantLayoutComponent implements OnDestroy {
  readonly Home = Home;
  readonly Wrench = Wrench;
  readonly MessageSquare = MessageSquare;
  readonly History = History;
  readonly User = User;
  readonly LogOut = LogOut;
  readonly Menu = Menu;
  readonly Bell = Bell;
  readonly FileText = FileText;
  readonly Settings = Settings;
  readonly CreditCard = CreditCard;
  readonly Check = Check;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly FileEdit = FileEdit;

  authService = inject(TenantAuthService);
  messageService = inject(InternalMessageService);
  notificationService = inject(TenantNotificationService);
  contractService = inject(ContractService);
  private router = inject(Router);
  readonly languageService = inject(LanguageService);
  private slugService = inject(SlugService);
  private tenantConfigService = inject(TenantConfigService);
  private formatService = inject(FormatService);
  private translocoService = inject(TranslocoService);

  sidebarCollapsed = false;
  isNotificationsDropdownOpen = false;
  isUserMenuOpen = false;

  // Notifications
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;

  // Computed para generar rutas con slug dinámico
  // El sidebar es dinámico según el estado del contrato
  navItems = computed<NavItem[]>(() => {
    const hasContract = !!this.authService.currentUser()?.contract;

    if (!hasContract) {
      // SIDEBAR PRE-CONTRATO (simplificado)
      return [
        {
          labelKey: 'public.tenantLayout.navHome',
          route: this.slugService.buildUrl('/portal/home'),
          icon: this.Home,
        },
        {
          labelKey: 'public.tenantLayout.navNewApp',
          route: this.slugService.buildUrl('/portal/new-application'),
          icon: this.Plus,
        },
        {
          labelKey: 'public.tenantLayout.navMyApp',
          route: this.slugService.buildUrl('/portal/my-applications'),
          icon: this.FileEdit,
        },
      ];
    }

    // SIDEBAR COMPLETO (con contrato)
    return [
      {
        labelKey: 'public.tenantLayout.navHome',
        route: this.slugService.buildUrl('/portal/dashboard'),
        icon: this.Home,
      },
      {
        labelKey: 'public.tenantLayout.navMaintenance',
        route: this.slugService.buildUrl('/portal/mantenimiento'),
        icon: this.Wrench,
      },
      {
        labelKey: 'public.tenantLayout.navPayments',
        route: this.slugService.buildUrl('/portal/pagos'),
        icon: this.CreditCard,
      },
      {
        labelKey: 'public.tenantLayout.navDocuments',
        route: this.slugService.buildUrl('/portal/documentos'),
        icon: this.FileText,
      },
      {
        labelKey: 'public.tenantLayout.notifications',
        route: this.slugService.buildUrl('/portal/notificaciones'),
        icon: this.Bell,
      },
      {
        labelKey: 'public.tenantMessages.title',
        route: this.slugService.buildUrl('/portal/mensajes'),
        icon: this.MessageSquare,
      },
      {
        labelKey: 'public.tenantHistory.title',
        route: this.slugService.buildUrl('/portal/historial'),
        icon: this.History,
      },
    ];
  });

  // Computed para URLs con slug
  mensajesUrl = computed(() => this.slugService.buildUrl('/portal/mensajes'));
  notificacionesUrl = computed(() => this.slugService.buildUrl('/portal/notificaciones'));
  perfilUrl = computed(() => this.slugService.buildUrl('/portal/perfil'));
  configuracionUrl = computed(() => this.slugService.buildUrl('/portal/configuracion'));

  ngOnInit(): void {
    // Initialize sidebar state based on screen size
    if (typeof window !== 'undefined') {
      this.sidebarCollapsed = window.innerWidth <= 768;
    }

    // Contador de mensajes internos no leídos
    this.messageService.refreshUnread('tenant').subscribe({ error: () => undefined });

    // Check if user has contracts by querying the contract service directly
    const currentUser = this.authService.currentUser();

    if (currentUser) {
      // Solo redirigir al dashboard desde la página pre-contrato (/portal/home).
      // En cualquier otra ruta del portal el usuario ya tiene acceso válido.
      const isOnPreContractHome = /\/portal\/home(\/|$|\?)/.test(this.router.url);
      if (isOnPreContractHome) {
        this.contractService.hasAnyContracts().subscribe({
          next: (contracts) => {
            if (contracts && contracts.length > 0) {
              this.slugService.navigateTo(['portal', 'dashboard']);
            }
          },
          error: () => undefined,
        });
      }
    }

    const slug = this.slugService.getSlug();
    if (slug) {
      this.tenantConfigService.getConfig(slug).subscribe({
        next: (config) => this.formatService.setConfig(config),
      });
    }

    // Load notifications and stats
    this.notificationService.loadNotifications({ is_read: false, limit: 5 });
    this.notificationService.loadStats();

    // Start polling (1 minute)
    this.notificationService.startPolling(60000);
  }

  ngOnDestroy(): void {
    // Stop polling when component is destroyed
    this.notificationService.stopPolling();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onNavItemClick(): void {
    // Close sidebar on mobile when nav item is clicked
    if (window.innerWidth <= 768) {
      this.sidebarCollapsed = true;
    }
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name || '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }

  // Notification methods
  toggleNotificationsDropdown(): void {
    this.isNotificationsDropdownOpen = !this.isNotificationsDropdownOpen;
    if (this.isNotificationsDropdownOpen) {
      this.closeUserMenu();
    }
  }

  closeNotificationsDropdown(): void {
    this.isNotificationsDropdownOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.closeNotificationsDropdown();
    }
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  handleNotificationClick(notification: TenantNotification): void {
    // Mark as read
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Navigate based on event type
    this.navigateToRelatedPage(notification);
  }

  navigateToRelatedPage(notification: TenantNotification): void {
    const eventType = notification.event_type;

    if (eventType.includes('maintenance')) {
      const requestId = notification.metadata?.['maintenance_request_id'];
      if (requestId) {
        this.slugService.navigateTo(['portal', 'mantenimiento']);
      }
    } else if (eventType.includes('contract')) {
      this.slugService.navigateTo(['portal', 'documentos']);
    } else if (eventType.includes('payment')) {
      this.slugService.navigateTo(['portal', 'pagos']);
    }

    this.closeNotificationsDropdown();
  }

  goToNotifications(): void {
    void this.router.navigate([this.notificacionesUrl()]);
    this.closeNotificationsDropdown();
  }

  markNotificationRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return this.translocoService.translate('public.tenantLayout.now');
    if (minutes < 60) {
      return this.translocoService.translate('public.tenantLayout.minutesAgo', { count: minutes });
    }
    if (hours < 24) {
      return this.translocoService.translate('public.tenantLayout.hoursAgo', { count: hours });
    }
    return this.translocoService.translate('public.tenantLayout.daysAgo', { count: days });
  }

  getNotificationIcon(eventType: string): typeof Bell {
    if (eventType.includes('maintenance')) return this.Wrench;
    if (eventType.includes('contract')) return this.FileText;
    if (eventType.includes('payment')) return this.CreditCard;
    return this.Bell;
  }

  getNotificationIconClass(eventType: string): string {
    if (eventType.includes('maintenance')) return 'icon-maintenance';
    if (eventType.includes('contract')) return 'icon-contract';
    if (eventType.includes('payment')) return 'icon-payment';
    return 'icon-default';
  }
}
