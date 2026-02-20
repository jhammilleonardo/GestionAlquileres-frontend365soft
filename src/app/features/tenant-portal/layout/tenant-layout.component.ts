import { Component, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { LucideAngularModule, Home, Wrench, MessageSquare, User, LogOut, Menu, Bell, FileText, Settings, CreditCard, Check, Trash2 } from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';
import { TenantMessageService } from '../../../core/services/tenant-message.service';
import { TenantNotificationService, TenantNotification } from '../../../core/services/tenant-notification.service';
import { SlugService } from '../../../core/services/slug.service';

interface NavItem {
    label: string;
    route: string;
    icon: any;
}

@Component({
    selector: 'app-tenant-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        MatListModule,
        MatSidenavModule,
        MatBadgeModule,
        LucideAngularModule
    ],
    template: `
        <div class="tenant-layout">
            <!-- Header -->
            <header class="tenant-header">
                <div class="header-left">
                    <button mat-icon-button class="menu-toggle" (click)="toggleSidebar()">
                        <lucide-icon [img]="Menu" [size]="24"></lucide-icon>
                    </button>
                    <div class="brand">
                        <span class="brand-text">Portal del Inquilino</span>
                    </div>
                </div>

                <div class="header-right">
                    <!-- Notifications -->
                    <div class="notification-container">
                        <button
                            mat-icon-button
                            class="notification-btn"
                            (click)="toggleNotificationsDropdown()"
                            [matBadge]="unreadCount() > 9 ? '9+' : unreadCount().toString()"
                            [matBadgeHidden]="unreadCount() === 0"
                            matBadgeColor="warn"
                            matBadgeSize="small">
                            <lucide-icon [img]="Bell" [size]="20"></lucide-icon>
                        </button>

                        <!-- Notifications Dropdown -->
                        @if (isNotificationsDropdownOpen) {
                            <div class="notifications-dropdown">
                                <div class="dropdown-header">
                                    <h3>Notificaciones</h3>
                                    <div class="header-actions-btns">
                                        @if (unreadCount() > 0) {
                                            <button
                                                class="mark-all-btn"
                                                (click)="markAllNotificationsRead(); $event.stopPropagation()">
                                                Marcar todas como leídas
                                            </button>
                                        }
                                    </div>
                                </div>

                                @if (notifications().length === 0) {
                                    <div class="no-notifications">
                                        <lucide-icon [img]="Bell" [size]="48" class="empty-icon"></lucide-icon>
                                        <p>No tienes notificaciones pendientes</p>
                                    </div>
                                } @else {
                                    <ul class="notifications-list">
                                        @for (notification of notifications(); track notification.id) {
                                            <li
                                                class="notification-item"
                                                [class.unread]="!notification.is_read"
                                                (click)="handleNotificationClick(notification)">

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
                                        (click)="goToNotifications(); $event.stopPropagation()">
                                        Ver todas las notificaciones
                                    </button>
                                </div>
                            </div>

                            <!-- Overlay para cerrar dropdown -->
                            @if (isNotificationsDropdownOpen) {
                                <div
                                    class="dropdown-overlay"
                                    (click)="closeNotificationsDropdown()">
                                </div>
                            }
                        }
                    </div>

                    <!-- Messages -->
                    <button
                        mat-icon-button
                        class="messages-btn"
                        [matBadge]="messageService.unreadCount()"
                        [matBadgeHidden]="messageService.unreadCount() === 0"
                        matBadgeColor="primary"
                        matBadgeSize="small"
                        [routerLink]="mensajesUrl()">
                        <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
                    </button>

                    <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
                        <div class="user-avatar">
                            {{ getUserInitials() }}
                        </div>
                        <span class="user-name">{{ authService.currentUser()?.name }}</span>
                    </button>

                    <mat-menu #userMenu="matMenu">
                        <button mat-menu-item [routerLink]="perfilUrl()">
                            <lucide-icon [img]="User" [size]="18"></lucide-icon>
                            <span>Mi Perfil</span>
                        </button>
                        <button mat-menu-item [routerLink]="configuracionUrl()">
                            <lucide-icon [img]="Settings" [size]="18"></lucide-icon>
                            <span>Configuracion</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="logout()" class="logout-btn">
                            <lucide-icon [img]="LogOut" [size]="18"></lucide-icon>
                            <span>Cerrar Sesion</span>
                        </button>
                    </mat-menu>
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
                            <a class="nav-item"
                               [routerLink]="item.route"
                               routerLinkActive="active"
                               [routerLinkActiveOptions]="{ exact: item.route.endsWith('/dashboard') }"
                               (click)="onNavItemClick()">
                                <lucide-icon [img]="item.icon" [size]="20"></lucide-icon>
                                <span class="nav-label">{{ item.label }}</span>
                            </a>
                        }
                    </nav>

                    <!-- Contract Info -->
                    @if (authService.currentUser()?.contract) {
                        <div class="contract-info">
                            <div class="contract-label">Mi Propiedad</div>
                            <div class="contract-value">{{ authService.currentUser()?.contract?.property_title }}</div>
                            <div class="contract-number">{{ authService.currentUser()?.contract?.contract_number }}</div>
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
    styles: [`
        .tenant-layout {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: var(--mat-sys-surface-container-low);
        }

        .tenant-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            height: 64px;
            background: var(--mat-sys-surface);
            border-bottom: 1px solid var(--mat-sys-outline-variant);
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

        .brand-text {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--mat-sys-on-surface);
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .notification-btn {
            color: var(--mat-sys-on-surface-variant);
        }

        .messages-btn {
            color: var(--mat-sys-on-surface-variant);
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
            background: var(--mat-sys-surface);
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            border: 1px solid var(--mat-sys-outline-variant);
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
            border-bottom: 1px solid var(--mat-sys-outline-variant);

            h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
                color: var(--mat-sys-on-surface);
            }

            .header-actions-btns {
                display: flex;
                gap: 8px;
            }
        }

        .mark-all-btn {
            padding: 6px 12px;
            font-size: 0.75rem;
            background: var(--mat-sys-primary);
            color: var(--mat-sys-on-primary);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;

            &:hover {
                background: color-mix(in srgb, var(--mat-sys-primary) 90%, black);
            }
        }

        .no-notifications {
            padding: 48px 24px;
            text-align: center;
            color: var(--mat-sys-on-surface-variant);

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
                background: var(--mat-sys-outline-variant);
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
                background: var(--mat-sys-surface-container-low);
            }

            &.unread {
                background: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
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
            background: var(--mat-sys-surface-container-low);
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
            color: var(--mat-sys-on-surface);
            line-height: 1.3;
        }

        .notification-message {
            margin: 0 0 6px 0;
            font-size: 0.8125rem;
            color: var(--mat-sys-on-surface-variant);
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .notification-time {
            font-size: 0.75rem;
            color: var(--mat-sys-on-surface-variant);
            opacity: 0.7;
        }

        .unread-dot {
            width: 8px;
            height: 8px;
            background: var(--mat-sys-primary);
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 6px;
        }

        .dropdown-footer {
            padding: 12px 16px;
            border-top: 1px solid var(--mat-sys-outline-variant);
        }

        .view-all-btn {
            width: 100%;
            padding: 10px;
            font-size: 0.875rem;
            font-weight: 500;
            background: var(--mat-sys-surface-container-low);
            color: var(--mat-sys-on-surface);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background: var(--mat-sys-surface-container);
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
        }

        .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--mat-sys-primary);
            color: var(--mat-sys-on-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
        }

        .user-name {
            color: var(--mat-sys-on-surface);
            font-weight: 500;
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
            background: var(--mat-sys-surface);
            border-right: 1px solid var(--mat-sys-outline-variant);
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
            color: var(--mat-sys-on-surface-variant);
            text-decoration: none;
            margin-bottom: 4px;
            transition: all 0.2s;
        }

        .nav-item:hover {
            background: var(--mat-sys-surface-container-low);
            color: var(--mat-sys-on-surface);
        }

        .nav-item.active {
            background: var(--mat-sys-primary);
            color: var(--mat-sys-on-primary);
        }

        .nav-label {
            font-weight: 500;
        }

        .contract-info {
            padding: 16px;
            margin: 16px;
            background: var(--mat-sys-surface-container-low);
            border-radius: 8px;
            border: 1px solid var(--mat-sys-outline-variant);
        }

        .contract-label {
            font-size: 12px;
            color: var(--mat-sys-on-surface-variant);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .contract-value {
            font-weight: 600;
            color: var(--mat-sys-on-surface);
            margin-bottom: 4px;
        }

        .contract-number {
            font-size: 12px;
            color: var(--mat-sys-primary);
            font-family: monospace;
        }

        .tenant-main {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
        }

        .logout-btn {
            color: var(--mat-sys-error);
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
                from { opacity: 0; }
                to { opacity: 1; }
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
    `]
})
export class TenantLayoutComponent implements OnInit, OnDestroy {
    readonly Home = Home;
    readonly Wrench = Wrench;
    readonly MessageSquare = MessageSquare;
    readonly User = User;
    readonly LogOut = LogOut;
    readonly Menu = Menu;
    readonly Bell = Bell;
    readonly FileText = FileText;
    readonly Settings = Settings;
    readonly CreditCard = CreditCard;
    readonly Check = Check;
    readonly Trash2 = Trash2;

    authService = inject(TenantAuthService);
    messageService = inject(TenantMessageService);
    notificationService = inject(TenantNotificationService);
    private router = inject(Router);
    private slugService = inject(SlugService);

    sidebarCollapsed = false;
    isNotificationsDropdownOpen = false;

    // Notifications
    notifications = this.notificationService.notifications;
    unreadCount = this.notificationService.unreadCount;

    // Computed para generar rutas con slug dinámico
    navItems = computed<NavItem[]>(() => [
        { label: 'Inicio', route: this.slugService.buildUrl('/portal/dashboard'), icon: this.Home },
        { label: 'Mantenimiento', route: this.slugService.buildUrl('/portal/mantenimiento'), icon: this.Wrench },
        { label: 'Pagos', route: this.slugService.buildUrl('/portal/pagos'), icon: this.CreditCard },
        { label: 'Documentos', route: this.slugService.buildUrl('/portal/documentos'), icon: this.FileText },
        { label: 'Notificaciones', route: this.slugService.buildUrl('/portal/notificaciones'), icon: this.Bell },
        { label: 'Mensajes', route: this.slugService.buildUrl('/portal/mensajes'), icon: this.MessageSquare },
    ]);

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
        this.authService.logout();
    }

    // Notification methods
    toggleNotificationsDropdown(): void {
        this.isNotificationsDropdownOpen = !this.isNotificationsDropdownOpen;
    }

    closeNotificationsDropdown(): void {
        this.isNotificationsDropdownOpen = false;
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
        this.router.navigate([this.notificacionesUrl()]);
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
