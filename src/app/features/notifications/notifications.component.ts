import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Bell, Check, Trash2, Filter, RefreshCw,
  Wrench, Home, User, FileText, CreditCard,
  Hash, MapPin, Tag, BellOff, ArrowUpRight
} from 'lucide-angular';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { DestroyRef } from '@angular/core';

type NotificationFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LucideAngularModule
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals
  notifications = this.notificationService.notifications;
  stats = this.notificationService.stats;
  isLoading = this.notificationService.isLoading;
  error = this.notificationService.error;
  unreadCount = this.notificationService.unreadCount;

  // State
  currentFilter: NotificationFilter = 'all';

  // Lucide icons
  readonly Bell = Bell;
  readonly Check = Check;
  readonly Trash2 = Trash2;
  readonly Filter = Filter;
  readonly RefreshCw = RefreshCw;
  readonly Wrench = Wrench;
  readonly Home = Home;
  readonly User = User;
  readonly FileText = FileText;
  readonly CreditCard = CreditCard;
  readonly Hash = Hash;
  readonly MapPin = MapPin;
  readonly Tag = Tag;
  readonly BellOff = BellOff;
  readonly ArrowUpRight = ArrowUpRight;

  ngOnInit(): void {
    this.loadNotifications();
    this.loadStats();

    // Start polling (1 minute)
    this.notificationService.startPolling(60000);
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  loadNotifications(): void {
    let options: { is_read?: boolean; limit?: number } = { limit: 50 };

    if (this.currentFilter === 'unread') {
      options.is_read = false;
    } else if (this.currentFilter === 'read') {
      options.is_read = true;
    }

    this.notificationService.loadNotifications(options);
  }

  loadStats(): void {
    this.notificationService.loadStats();
  }

  setFilter(filter: NotificationFilter): void {
    this.currentFilter = filter;
    this.loadNotifications();
  }

  refresh(): void {
    this.loadNotifications();
    this.loadStats();
  }

  markAsRead(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Eliminar esta notificación?')) {
      this.notificationService.deleteNotification(id).subscribe();
    }
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe();
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
  }

  getNotificationIcon(eventType: string): any {
    if (eventType.includes('maintenance')) return Wrench;
    if (eventType.includes('property')) return Home;
    if (eventType.includes('user')) return User;
    if (eventType.includes('contract')) return FileText;
    if (eventType.includes('payment')) return CreditCard;
    return Bell;
  }

  getNotificationIconClass(eventType: string): string {
    if (eventType.includes('maintenance')) return 'icon-maintenance';
    if (eventType.includes('property')) return 'icon-property';
    if (eventType.includes('user')) return 'icon-user';
    if (eventType.includes('contract')) return 'icon-contract';
    if (eventType.includes('payment')) return 'icon-payment';
    return 'icon-default';
  }

  getNotificationTypeBadgeClass(eventType: string): string {
    if (eventType.includes('maintenance')) return 'type-maintenance';
    if (eventType.includes('property')) return 'type-property';
    if (eventType.includes('user')) return 'type-user';
    if (eventType.includes('contract')) return 'type-contract';
    if (eventType.includes('payment')) return 'type-payment';
    return 'type-default';
  }

  getNotificationTypeLabel(eventType: string): string {
    const types: { [key: string]: string } = {
      'maintenance.request.created': 'Nueva Solicitud',
      'maintenance.status.changed': 'Estado Actualizado',
      'maintenance.message.received': 'Nuevo Mensaje',
      'maintenance.assigned': 'Asignado',
      'maintenance.completed': 'Completado',
      'property.status.changed': 'Propiedad Actualizada',
      'property.available': 'Propiedad Disponible',
      'user.registered': 'Nuevo Usuario',
      'user.password.changed': 'Contraseña Cambiada'
    };
    return types[eventType] || 'Notificación';
  }

  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  clearError(): void {
    this.notificationService.clearError();
  }

  get readCount(): number {
    const total = this.stats()?.total || 0;
    const unread = this.stats()?.unread || 0;
    return total - unread;
  }
}
