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
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
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
  template: `
    <div class="tenant-layout">
      <!-- Header -->
      <header class="tenant-header">
        <div class="header-left">
          <button type="button" class="icon-button menu-toggle" (click)="toggleSidebar()">
            <lucide-icon [img]="Menu" [size]="24"></lucide-icon>
          </button>
          <div class="brand">
            <span class="brand-text">{{ 'public.tenantLayout.portalName' | transloco }}</span>
          </div>
        </div>

        <div class="header-right">
          <!-- Language switcher -->
          <div class="lang-toggle" role="group" aria-label="Language / Idioma">
            <button
              class="lang-btn"
              [class.active]="languageService.isSpanish()"
              (click)="languageService.setLanguage('es')"
              aria-label="Español"
              title="Español"
            >
              ES
            </button>
            <button
              class="lang-btn"
              [class.active]="languageService.isEnglish()"
              (click)="languageService.setLanguage('en')"
              aria-label="English"
              title="English"
            >
              EN
            </button>
          </div>

          <!-- Notifications -->
          <div class="notification-container">
            <button
              type="button"
              class="icon-button notification-btn"
              (click)="toggleNotificationsDropdown()"
              [attr.aria-label]="'public.tenantLayout.notifications' | transloco"
            >
              <lucide-icon [img]="Bell" [size]="20"></lucide-icon>
              @if (unreadCount() > 0) {
                <span class="icon-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
              }
            </button>

            <!-- Notifications Dropdown -->
            @if (isNotificationsDropdownOpen) {
              <div class="notifications-dropdown">
                <div class="dropdown-header">
                  <h3>{{ 'public.tenantLayout.notifications' | transloco }}</h3>
                  <div class="header-actions-btns">
                    @if (unreadCount() > 0) {
                      <button
                        class="mark-all-btn"
                        (click)="markAllNotificationsRead(); $event.stopPropagation()"
                      >
                        {{ 'public.tenantLayout.markAllRead' | transloco }}
                      </button>
                    }
                  </div>
                </div>

                @if (notifications().length === 0) {
                  <div class="no-notifications">
                    <lucide-icon [img]="Bell" [size]="48" class="empty-icon"></lucide-icon>
                    <p>{{ 'public.tenantLayout.noNotifications' | transloco }}</p>
                  </div>
                } @else {
                  <ul class="notifications-list">
                    @for (notification of notifications(); track notification.id) {
                      <li
                        class="notification-item"
                        [class.unread]="!notification.is_read"
                        (click)="handleNotificationClick(notification)"
                      >
                        <div class="notification-icon">
                          {{ getNotificationIcon(notification.event_type) }}
                        </div>

                        <div class="notification-content">
                          <h4 class="notification-title">{{ notification.title }}</h4>
                          <p class="notification-message">{{ notification.message }}</p>
                          <span class="notification-time">
                            {{ formatNotificationTime(notification.created_at) }}
                          </span>
                        </div>

                        @if (!notification.is_read) {
                          <div class="unread-dot"></div>
                        }
                      </li>
                    }
                  </ul>
                }

                <div class="dropdown-footer">
                  <button
                    class="view-all-btn"
                    (click)="goToNotifications(); $event.stopPropagation()"
                  >
                    {{ 'public.tenantLayout.viewAllNotifications' | transloco }}
                  </button>
                </div>
              </div>

              <!-- Overlay para cerrar dropdown -->
              @if (isNotificationsDropdownOpen) {
                <div class="dropdown-overlay" (click)="closeNotificationsDropdown()"></div>
              }
            }
          </div>

          <!-- Messages -->
          <button
            type="button"
            class="icon-button messages-btn"
            [routerLink]="mensajesUrl()"
            [attr.aria-label]="'public.tenantMessages.title' | transloco"
          >
            <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
            @if (messageService.unread() > 0) {
              <span class="icon-badge info">{{
                messageService.unread() > 9 ? '9+' : messageService.unread()
              }}</span>
            }
          </button>

          <div class="user-menu-container">
            <button type="button" class="user-btn" (click)="toggleUserMenu()">
              <div class="user-avatar">
                {{ getUserInitials() }}
              </div>
              <span class="user-name">{{ authService.currentUser()?.name }}</span>
            </button>

            @if (isUserMenuOpen) {
              <div class="user-dropdown">
                <a class="user-menu-item" [routerLink]="perfilUrl()" (click)="closeUserMenu()">
                  <lucide-icon [img]="User" [size]="18"></lucide-icon>
                  <span>{{ 'public.tenantLayout.myProfile' | transloco }}</span>
                </a>
                <a
                  class="user-menu-item"
                  [routerLink]="configuracionUrl()"
                  (click)="closeUserMenu()"
                >
                  <lucide-icon [img]="Settings" [size]="18"></lucide-icon>
                  <span>{{ 'public.tenantLayout.settings' | transloco }}</span>
                </a>
                <div class="user-menu-divider"></div>
                <button type="button" class="user-menu-item logout-btn" (click)="logout()">
                  <lucide-icon [img]="LogOut" [size]="18"></lucide-icon>
                  <span>{{ 'public.tenantLayout.logout' | transloco }}</span>
                </button>
              </div>
              <div class="dropdown-overlay" (click)="closeUserMenu()"></div>
            }
          </div>
        </div>
      </header>

      <div class="layout-body">
        <!-- Mobile Overlay -->
        @if (!sidebarCollapsed) {
          <div class="sidebar-overlay" (click)="toggleSidebar()"></div>
        }

        <!-- Sidebar -->
        <aside class="tenant-sidebar" [class.collapsed]="sidebarCollapsed">
          <nav class="sidebar-nav">
            @for (item of navItems(); track item.route) {
              <a
                class="nav-item"
                [routerLink]="item.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.route.endsWith('/dashboard') }"
                (click)="onNavItemClick()"
              >
                <lucide-icon [img]="item.icon" [size]="20"></lucide-icon>
                <span class="nav-label">{{ item.labelKey | transloco }}</span>
              </a>
            }
          </nav>

          <!-- Contract Info -->
          @if (authService.currentUser()?.contract) {
            <div class="contract-info">
              <div class="contract-label">{{ 'public.tenantLayout.myProperty' | transloco }}</div>
              <div class="contract-value">
                {{ authService.currentUser()?.contract?.property_title }}
              </div>
              <div class="contract-number">
                {{ authService.currentUser()?.contract?.contract_number }}
              </div>
            </div>
          }
        </aside>

        <!-- Main Content -->
        <main class="tenant-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .tenant-layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--app-color-bg);
      }

      .tenant-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 64px;
        background: var(--app-color-surface);
        border-bottom: 1px solid var(--app-color-border);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .menu-toggle {
        display: none;
      }

      .icon-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: transparent;
        color: var(--app-color-text-muted);
        cursor: pointer;
        transition:
          background 0.2s ease,
          color 0.2s ease,
          border-color 0.2s ease;
      }

      .icon-button:hover {
        background: var(--app-color-surface-muted);
        color: var(--app-color-text);
      }

      .icon-badge {
        position: absolute;
        top: 3px;
        right: 2px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 999px;
        background: var(--app-color-danger);
        color: #fff;
        font-size: 0.65rem;
        font-weight: 800;
        line-height: 18px;
        text-align: center;
        box-shadow: 0 0 0 2px var(--app-color-surface);
      }

      .icon-badge.info {
        background: var(--app-color-primary);
      }

      .brand-text {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--app-color-text);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .lang-toggle {
        display: flex;
        align-items: center;
        gap: 2px;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 6px;
        padding: 2px;
      }

      .lang-btn {
        background: transparent;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.5);
        cursor: pointer;
        transition: all 0.15s;
        letter-spacing: 0.05em;
        line-height: 1;
      }

      .lang-btn:hover {
        color: rgba(0, 0, 0, 0.75);
        background: rgba(0, 0, 0, 0.06);
      }

      .lang-btn.active {
        background: white;
        color: #0f172a;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }

      // Notifications Dropdown Styles
      .notification-container {
        position: relative;
      }

      .notifications-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 380px;
        max-width: 90vw;
        background: var(--app-color-surface);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--app-color-border);
        z-index: 1000;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        animation: slideDown 0.2s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--app-color-border);

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--app-color-text);
        }

        .header-actions-btns {
          display: flex;
          gap: 8px;
        }
      }

      .mark-all-btn {
        padding: 6px 12px;
        font-size: 0.75rem;
        background: var(--app-color-primary);
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;

        &:hover {
          background: var(--app-color-primary-hover);
        }
      }

      .no-notifications {
        padding: 48px 24px;
        text-align: center;
        color: var(--app-color-text-muted);

        .empty-icon {
          opacity: 0.3;
          margin-bottom: 12px;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
        }
      }

      .notifications-list {
        list-style: none;
        margin: 0;
        padding: 8px;
        max-height: 350px;
        overflow-y: auto;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--app-color-border-strong);
          border-radius: 3px;
        }
      }

      .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;

        &:hover {
          background: var(--app-color-surface-muted);
        }

        &.unread {
          background: var(--app-color-primary-soft);
        }
      }

      .notification-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--app-color-surface-muted);
        border-radius: 50%;
      }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-title {
        margin: 0 0 4px 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--app-color-text);
        line-height: 1.3;
      }

      .notification-message {
        margin: 0 0 6px 0;
        font-size: 0.8125rem;
        color: var(--app-color-text-muted);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .notification-time {
        font-size: 0.75rem;
        color: var(--app-color-text-muted);
        opacity: 0.7;
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        background: var(--app-color-primary);
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 6px;
      }

      .dropdown-footer {
        padding: 12px 16px;
        border-top: 1px solid var(--app-color-border);
      }

      .view-all-btn {
        width: 100%;
        padding: 10px;
        font-size: 0.875rem;
        font-weight: 500;
        background: var(--app-color-surface-muted);
        color: var(--app-color-text);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: var(--app-color-primary-soft);
        }
      }

      .dropdown-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
      }

      .user-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        border: 1px solid transparent;
        border-radius: 12px;
        background: transparent;
        padding: 4px 8px 4px 4px;
        cursor: pointer;
        transition:
          background 0.2s ease,
          border-color 0.2s ease;
      }

      .user-btn:hover {
        background: var(--app-color-surface-muted);
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--app-color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }

      .user-name {
        color: var(--app-color-text);
        font-weight: 500;
      }

      .user-menu-container {
        position: relative;
      }

      .user-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 220px;
        padding: 8px;
        border: 1px solid var(--app-color-border);
        border-radius: 12px;
        background: var(--app-color-surface);
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
        z-index: 1000;
      }

      .user-menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--app-color-text);
        font: inherit;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
      }

      .user-menu-item:hover {
        background: var(--app-color-surface-muted);
      }

      .user-menu-divider {
        height: 1px;
        margin: 6px 0;
        background: var(--app-color-border);
      }

      .layout-body {
        display: flex;
        flex: 1;
        overflow: hidden;
        position: relative;
      }

      .sidebar-overlay {
        display: none;
      }

      .tenant-sidebar {
        width: 260px;
        background: var(--app-color-surface);
        border-right: 1px solid var(--app-color-border);
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
      }

      .tenant-sidebar.collapsed {
        width: 0;
        overflow: hidden;
      }

      .sidebar-nav {
        padding: 16px;
        flex: 1;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 8px;
        color: var(--app-color-text-muted);
        text-decoration: none;
        margin-bottom: 4px;
        transition: all 0.2s;
      }

      .nav-item:hover {
        background: var(--app-color-surface-muted);
        color: var(--app-color-text);
      }

      .nav-item.active {
        background: var(--app-color-primary);
        color: #fff;
      }

      .nav-label {
        font-weight: 500;
      }

      .contract-info {
        padding: 16px;
        margin: 16px;
        background: var(--app-color-surface-muted);
        border-radius: 8px;
        border: 1px solid var(--app-color-border);
      }

      .contract-label {
        font-size: 12px;
        color: var(--app-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .contract-value {
        font-weight: 600;
        color: var(--app-color-text);
        margin-bottom: 4px;
      }

      .contract-number {
        font-size: 12px;
        color: var(--app-color-primary);
        font-family: monospace;
      }

      .tenant-main {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }

      .logout-btn {
        color: var(--app-color-danger);
      }

      @media (max-width: 768px) {
        .menu-toggle {
          display: flex;
        }

        .tenant-header {
          padding: 0 16px;
          height: 56px;
        }

        .brand-text {
          font-size: 1.1rem;
        }

        .sidebar-overlay {
          display: block;
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 98;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .tenant-sidebar {
          position: fixed;
          left: 0;
          top: 56px;
          bottom: 0;
          z-index: 99;
          width: 260px;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        }

        .tenant-sidebar.collapsed {
          transform: translateX(-100%);
        }

        .user-name {
          display: none;
        }

        .tenant-main {
          padding: 16px;
        }

        .contract-info {
          margin: 12px;
          padding: 12px;
        }
      }

      @media (max-width: 480px) {
        .tenant-header {
          padding: 0 12px;
        }

        .brand-text {
          font-size: 1rem;
        }

        .header-left {
          gap: 8px;
        }

        .header-right {
          gap: 4px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          font-size: 13px;
        }

        .tenant-sidebar {
          width: 240px;
        }

        .nav-item {
          padding: 10px 14px;
          font-size: 14px;
        }

        .contract-info {
          font-size: 13px;
        }

        .contract-value {
          font-size: 14px;
        }
      }

      @media (max-width: 360px) {
        .brand-text {
          display: none;
        }

        .tenant-sidebar {
          width: 220px;
        }

        .nav-label {
          font-size: 14px;
        }
      }
    `,
  ],
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
        labelKey: 'public.myProperty.title',
        route: this.slugService.buildUrl('/portal/mi-propiedad'),
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
    this.messageService.refreshUnread().subscribe({ error: () => undefined });

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

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  }

  getNotificationIcon(eventType: string): string {
    if (eventType.includes('maintenance')) return '🔧';
    if (eventType.includes('contract')) return '📄';
    if (eventType.includes('payment')) return '💳';
    return '🔔';
  }
}
