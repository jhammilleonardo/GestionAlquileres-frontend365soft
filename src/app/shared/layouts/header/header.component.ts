import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { LucideAngularModule, Menu, Bell, Search, User, Settings, LogOut } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { NotificationService } from '../../../core/services/notification.service';

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
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  sidebarExpanded = this.sidebarService.expanded;

  // Lucide icons
  readonly Menu = Menu;
  readonly Bell = Bell;
  readonly Search = Search;
  readonly User = User;
  readonly Settings = Settings;
  readonly LogOut = LogOut;

  ngOnInit(): void {
    // Load notifications - commented out until backend implements the endpoints
    // this.notificationService.loadNotifications({ is_read: false, limit: 10 });
    // this.notificationService.loadStats();
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
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
    this.router.navigate(['/perfil']);
  }

  goToSettings(): void {
    this.router.navigate(['/configuracion']);
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
}
