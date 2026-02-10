import { Component, inject, computed, OnInit } from '@angular/core';
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
import { LucideAngularModule, Home, Wrench, MessageSquare, User, LogOut, Menu, Bell, FileText, Settings, CreditCard } from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';
import { TenantMessageService } from '../../../core/services/tenant-message.service';
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
                    <button
                        mat-icon-button
                        class="notification-btn"
                        [matBadge]="messageService.unreadCount()"
                        [matBadgeHidden]="messageService.unreadCount() === 0"
                        matBadgeColor="warn"
                        matBadgeSize="small"
                        [routerLink]="mensajesUrl()">
                        <lucide-icon [img]="Bell" [size]="20"></lucide-icon>
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
export class TenantLayoutComponent implements OnInit {
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

    authService = inject(TenantAuthService);
    messageService = inject(TenantMessageService);
    private router = inject(Router);
    private slugService = inject(SlugService);

    sidebarCollapsed = false;

    // Computed para generar rutas con slug dinámico
    navItems = computed<NavItem[]>(() => [
        { label: 'Inicio', route: this.slugService.buildUrl('/portal/dashboard'), icon: this.Home },
        { label: 'Mantenimiento', route: this.slugService.buildUrl('/portal/mantenimiento'), icon: this.Wrench },
        { label: 'Pagos', route: this.slugService.buildUrl('/portal/pagos'), icon: this.CreditCard },
        { label: 'Documentos', route: this.slugService.buildUrl('/portal/documentos'), icon: this.FileText },
        { label: 'Mensajes', route: this.slugService.buildUrl('/portal/mensajes'), icon: this.MessageSquare },
    ]);

    // Computed para URLs con slug
    mensajesUrl = computed(() => this.slugService.buildUrl('/portal/mensajes'));
    perfilUrl = computed(() => this.slugService.buildUrl('/portal/perfil'));
    configuracionUrl = computed(() => this.slugService.buildUrl('/portal/configuracion'));

    ngOnInit(): void {
        // Initialize sidebar state based on screen size
        if (typeof window !== 'undefined') {
            this.sidebarCollapsed = window.innerWidth <= 768;
        }
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
}
