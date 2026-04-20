import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Check,
  Trash2,
  Wrench,
  Home,
  FileText,
  CreditCard,
  CheckCheck,
  X,
  ChevronRight,
} from 'lucide-angular';

import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import {
  NotificationService,
  Notification,
} from '../../../core/services/admin/notification.service';
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
    LucideAngularModule,
    TranslocoModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  private slugService = inject(SlugService);
  notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  sidebarExpanded = this.sidebarService.expanded;

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  isNotificationsDropdownOpen = false;

  readonly Menu = Menu;
  readonly Bell = Bell;
  readonly Search = Search;
  readonly User = User;
  readonly Settings = Settings;
  readonly LogOut = LogOut;
  readonly Check = Check;
  readonly Trash2 = Trash2;
  readonly Wrench = Wrench;
  readonly Home = Home;
  readonly FileText = FileText;
  readonly CreditCard = CreditCard;
  readonly CheckCheck = CheckCheck;
  readonly X = X;
  readonly ChevronRight = ChevronRight;

  ngOnInit(): void {
    this.notificationService.loadNotifications({ is_read: false, limit: 5 });
    this.notificationService.loadStats();
    this.notificationService.startPolling(60000);
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  toggleSidebar(): void {
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
    if (!notification.is_read) {
      this.markNotificationRead(notification.id);
    }
    this.navigateToRelatedPage(notification);
  }

  private getSlugFromCurrentUrl(): string | null {
    const url = this.router.url;
    const segments = url.split('/').filter((s) => s.length > 0);
    return segments.length > 0 ? segments[0] : null;
  }

  private navigateToSlugPath(path: string): void {
    const slug = this.getSlugFromCurrentUrl() || this.slugService.getSlug();
    if (slug) {
      this.router.navigateByUrl(`/${slug}/${path}`);
    }
    this.closeNotificationsDropdown();
  }

  navigateToRelatedPage(notification: Notification): void {
    const slug = this.getSlugFromCurrentUrl() || this.slugService.getSlug();
    if (slug) {
      this.router.navigate(['/', slug, 'notificaciones'], {
        queryParams: { highlight: notification.id },
      });
    }
    this.closeNotificationsDropdown();
  }

  goToNotifications(): void {
    this.navigateToSlugPath('notificaciones');
  }

  getNotificationIcon(eventType: string): any {
    if (eventType.includes('maintenance')) return this.Wrench;
    if (eventType.includes('property')) return this.Home;
    if (eventType.includes('contract')) return this.FileText;
    if (eventType.includes('payment')) return this.CreditCard;
    if (eventType.includes('user')) return this.User;
    return this.Bell;
  }

  getNotificationIconColor(eventType: string): string {
    if (eventType.includes('maintenance')) return 'icon-blue';
    if (eventType.includes('property')) return 'icon-green';
    if (eventType.includes('user')) return 'icon-purple';
    if (eventType.includes('contract')) return 'icon-orange';
    if (eventType.includes('payment')) return 'icon-red';
    return 'icon-gray';
  }
}
