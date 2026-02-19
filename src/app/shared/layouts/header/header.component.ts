import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { LucideAngularModule, Menu, Bell, Search, User, Settings, LogOut, Check, Trash2 } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { SlugService } from '../../../core/services/slug.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  private slugService = inject(SlugService);
  notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  sidebarExpanded = this.sidebarService.expanded;

  // Notification state
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  isNotificationsDropdownOpen = false;

  // Lucide icons
  readonly Menu = Menu;
  readonly Bell = Bell;
  readonly Search = Search;
  readonly User = User;
  readonly Settings = Settings;
  readonly LogOut = LogOut;
  readonly Check = Check;
  readonly Trash2 = Trash2;

  ngOnInit(): void {
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
    // En móvil, abrir el sidebar como overlay
    if (this.sidebarService.isMobile()) {
      this.sidebarService.toggleMobile();
    } else {
      this.sidebarService.toggle();
    }
  }

  getUserInitials(): string {
    const name = this.currentUser()?.name || '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  goToProfile(): void {
    this.slugService.navigateTo(['perfil']);
  }

  goToSettings(): void {
    this.slugService.navigateTo(['configuracion']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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

  toggleNotificationsDropdown(): void {
    this.isNotificationsDropdownOpen = !this.isNotificationsDropdownOpen;
  }

  closeNotificationsDropdown(): void {
    this.isNotificationsDropdownOpen = false;
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.is_read) {
      this.markNotificationRead(notification.id);
    }

    // Navigate based on event type
    this.navigateToRelatedPage(notification);
  }

  navigateToRelatedPage(notification: Notification): void {
    const eventType = notification.event_type;

    if (eventType.includes('maintenance')) {
      const requestId = notification.metadata?.['maintenance_request_id'];
      if (requestId) {
        this.router.navigate(['/mantenimiento', requestId]);
      }
    } else if (eventType.includes('property')) {
      const propertyId = notification.metadata?.['property_id'];
      if (propertyId) {
        this.router.navigate(['/propiedades', propertyId]);
      }
    } else if (eventType.includes('user')) {
      const userId = notification.metadata?.['user_id'];
      if (userId) {
        this.router.navigate(['/inquilinos', userId]);
      }
    } else if (eventType.includes('contract')) {
      const contractId = notification.metadata?.['contract_id'];
      if (contractId) {
        this.router.navigate(['/contratos', contractId]);
      }
    }

    this.closeNotificationsDropdown();
  }

  goToNotifications(): void {
    this.router.navigate(['/notificaciones']);
    this.closeNotificationsDropdown();
  }

  getNotificationIcon(eventType: string): string {
    if (eventType.includes('maintenance')) return '🔧';
    if (eventType.includes('property')) return '🏠';
    if (eventType.includes('user')) return '👤';
    if (eventType.includes('contract')) return '📄';
    if (eventType.includes('payment')) return '💳';
    return '🔔';
  }

  getNotificationIconColor(eventType: string): string {
    if (eventType.includes('maintenance')) return 'text-blue-600';
    if (eventType.includes('property')) return 'text-green-600';
    if (eventType.includes('user')) return 'text-purple-600';
    if (eventType.includes('contract')) return 'text-orange-600';
    if (eventType.includes('payment')) return 'text-red-600';
    return 'text-gray-600';
  }
}
