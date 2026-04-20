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
  Bell,
  Check,
  Trash2,
  Filter,
  RefreshCw,
  Wrench,
  Home,
  FileText,
  CreditCard,
  Hash,
  MapPin,
  Tag,
  BellOff,
  ArrowUpRight,
} from 'lucide-angular';
import {
  TenantNotificationService,
  TenantNotification,
} from '../../../core/services/tenant/tenant-notification.service';
import { SlugService } from '../../../core/services/slug.service';
import { DestroyRef } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

type NotificationFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-tenant-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  templateUrl: './tenant-notifications.component.html',
  styleUrl: './tenant-notifications.component.scss',
})
export class TenantNotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(TenantNotificationService);
  private router = inject(Router);
  private slugService = inject(SlugService);
  private destroyRef = inject(DestroyRef);
  private translocoService = inject(TranslocoService);

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
    const options: { is_read?: boolean; limit?: number } = { limit: 50 };

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
    if (confirm(this.translocoService.translate('public.tenantNotifications.confirmDelete'))) {
      this.notificationService.deleteNotification(id).subscribe();
    }
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
      this.slugService.navigateTo(['portal', 'mantenimiento']);
    } else if (eventType.includes('contract')) {
      this.slugService.navigateTo(['portal', 'documentos']);
    } else if (eventType.includes('payment')) {
      this.slugService.navigateTo(['portal', 'pagos']);
    }
  }

  getNotificationIcon(eventType: string): any {
    if (eventType.includes('maintenance')) return Wrench;
    if (eventType.includes('contract')) return FileText;
    if (eventType.includes('payment')) return CreditCard;
    return Bell;
  }

  getNotificationIconClass(eventType: string): string {
    if (eventType.includes('maintenance')) return 'icon-maintenance';
    if (eventType.includes('contract')) return 'icon-contract';
    if (eventType.includes('payment')) return 'icon-payment';
    return 'icon-default';
  }

  getNotificationTypeBadgeClass(eventType: string): string {
    if (eventType.includes('maintenance')) return 'type-maintenance';
    if (eventType.includes('contract')) return 'type-contract';
    if (eventType.includes('payment')) return 'type-payment';
    return 'type-default';
  }

  getNotificationTypeLabel(eventType: string): string {
    const types: { [key: string]: string } = {
      'maintenance.request.created': 'public.tenantNotifications.types.maintenanceCreated',
      'maintenance.status.changed': 'public.tenantNotifications.types.maintenanceUpdated',
      'maintenance.message.received': 'public.tenantNotifications.types.maintenanceMessage',
      'maintenance.assigned': 'public.tenantNotifications.types.maintenanceAssigned',
      'maintenance.completed': 'public.tenantNotifications.types.maintenanceCompleted',
      'contract.created': 'public.tenantNotifications.types.contractCreated',
      'contract.signed': 'public.tenantNotifications.types.contractSigned',
      'contract.expiring': 'public.tenantNotifications.types.contractExpiring',
      'payment.created': 'public.tenantNotifications.types.paymentCreated',
      'payment.approved': 'public.tenantNotifications.types.paymentApproved',
      'payment.rejected': 'public.tenantNotifications.types.paymentRejected',
    };
    return this.translocoService.translate(
      types[eventType] || 'public.tenantNotifications.types.default',
    );
  }

  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return this.translocoService.translate('public.tenantNotifications.now');
    if (minutes < 60)
      return this.translocoService.translate(
        minutes !== 1
          ? 'public.tenantNotifications.minutesAgoPlural'
          : 'public.tenantNotifications.minutesAgo',
        { count: minutes },
      );
    if (hours < 24)
      return this.translocoService.translate(
        hours !== 1
          ? 'public.tenantNotifications.hoursAgoPlural'
          : 'public.tenantNotifications.hoursAgo',
        { count: hours },
      );
    if (days === 1) return this.translocoService.translate('public.tenantNotifications.yesterday');
    if (days < 7)
      return this.translocoService.translate('public.tenantNotifications.daysAgo', { count: days });
    return new Date(date).toLocaleDateString(
      this.translocoService.getActiveLang() === 'es' ? 'es-ES' : 'en-US',
      {
        day: 'numeric',
        month: 'short',
        year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      },
    );
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
