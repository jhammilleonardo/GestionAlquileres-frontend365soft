import { Component, inject, computed } from '@angular/core';
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
                        routerLink="/portal/mensajes">
                        <lucide-icon [img]="Bell" [size]="20"></lucide-icon>
                    </button>

                    <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
                        <div class="user-avatar">
                            {{ getUserInitials() }}
                        </div>
                        <span class="user-name">{{ authService.currentUser()?.name }}</span>
                    </button>

                    <mat-menu #userMenu="matMenu">
                        <button mat-menu-item routerLink="/portal/perfil">
                            <lucide-icon [img]="User" [size]="18"></lucide-icon>
                            <span>Mi Perfil</span>
                        </button>
                        <button mat-menu-item routerLink="/portal/configuracion">
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
                <!-- Sidebar -->
                <aside class="tenant-sidebar" [class.collapsed]="sidebarCollapsed">
                    <nav class="sidebar-nav">
                        @for (item of navItems; track item.route) {
                            <a class="nav-item"
                               [routerLink]="item.route"
                               routerLinkActive="active"
                               [routerLinkActiveOptions]="{ exact: item.route === '/portal/dashboard' }">
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
            padding: 0 20px;
            height: 64px;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
        }

        .menu-toggle {
            display: none;
            color: #64748b;
        }

        .brand {
            display: flex;
            align-items: center;
        }

        .brand-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .notification-btn {
            color: #64748b;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .notification-btn:hover {
            background: #f1f5f9;
            color: #1e293b;
        }

        .user-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 12px;
            border-radius: 10px;
            min-height: 48px;
            transition: all 0.2s;
        }

        .user-btn:hover {
            background: #f1f5f9 !important;
        }

        .user-btn::before,
        .user-btn .mat-mdc-button-persistent-ripple {
            display: none !important;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--mat-sys-primary) 0%, #6366f1 100%);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.5px;
            flex-shrink: 0;
        }

        .user-name {
            color: #1e293b;
            font-weight: 600;
            font-size: 14px;
            white-space: nowrap;
        }

        .layout-body {
            display: flex;
            flex: 1;
            overflow: hidden;
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

        ::ng-deep .mat-mdc-menu-panel {
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            margin-top: 8px;
            min-width: 220px;
        }

        ::ng-deep .mat-mdc-menu-item {
            min-height: 44px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: #1e293b;
        }

        ::ng-deep .mat-mdc-menu-item:hover {
            background: #f1f5f9;
        }

        ::ng-deep .mat-mdc-menu-item lucide-icon {
            opacity: 0.7;
        }

        .logout-btn {
            color: #dc2626 !important;
        }

        ::ng-deep .logout-btn:hover {
            background: #fee2e2 !important;
        }

        @media (max-width: 768px) {
            .menu-toggle {
                display: flex;
            }

            .brand-text {
                font-size: 1.1rem;
            }

            .tenant-sidebar {
                position: fixed;
                left: 0;
                top: 64px;
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

            .header-right {
                gap: 4px;
            }
        }

        @media (max-width: 480px) {
            .brand-text {
                font-size: 1rem;
            }

            .tenant-header {
                padding: 0 12px;
            }
        }
    `]
})
export class TenantLayoutComponent {
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

    sidebarCollapsed = false;

    navItems: NavItem[] = [
        { label: 'Inicio', route: '/portal/dashboard', icon: this.Home },
        { label: 'Mantenimiento', route: '/portal/mantenimiento', icon: this.Wrench },
        { label: 'Pagos', route: '/portal/pagos', icon: this.CreditCard },
        { label: 'Documentos', route: '/portal/documentos', icon: this.FileText },
        { label: 'Mensajes', route: '/portal/mensajes', icon: this.MessageSquare },
    ];

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
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
