import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ArrowUpRight,
  Bell,
  BellOff,
  Check,
  CreditCard,
  FileText,
  Filter,
  Hash,
  Home,
  LucideAngularModule,
  MapPin,
  RefreshCw,
  Tag,
  Trash2,
  Wrench,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';

import {
  TenantNotification,
  TenantNotificationService,
} from '../../../core/services/tenant/tenant-notification.service';
import { SlugService } from '../../../core/services/slug.service';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';

type NotificationFilter = 'all' | 'unread' | 'read';

type LucideIcon = typeof Bell;

@Component({
  selector: 'app-tenant-notifications',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './tenant-notifications.component.html',
  styleUrl: './tenant-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantNotificationsComponent {
  private readonly notificationService = inject(TenantNotificationService);
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly notifications = this.notificationService.notifications;
  readonly stats = this.notificationService.stats;
  readonly isLoading = this.notificationService.isLoading;
  readonly error = this.notificationService.error;
  readonly unreadCount = this.notificationService.unreadCount;

  readonly currentFilter = signal<NotificationFilter>('all');

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

  constructor() {
    this.loadNotifications();
    this.loadStats();
    this.notificationService.startPolling(60000);
    this.destroyRef.onDestroy(() => this.notificationService.stopPolling());
  }

  get readCount(): number {
    return (this.stats()?.total ?? 0) - (this.stats()?.unread ?? 0);
  }

  loadNotifications(): void {
    const options: { is_read?: boolean; limit?: number } = { limit: 50 };
    const filter = this.currentFilter();
    if (filter === 'unread') options.is_read = false;
    else if (filter === 'read') options.is_read = true;
    this.notificationService.loadNotifications(options);
  }

  loadStats(): void {
    this.notificationService.loadStats();
  }

  setFilter(filter: NotificationFilter): void {
    this.currentFilter.set(filter);
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

  async deleteNotification(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmDialog.confirm({
      title: this.translocoService.translate('public.tenantNotifications.deleteTitle'),
      message: this.translocoService.translate('public.tenantNotifications.confirmDelete'),
      confirmLabel: this.translocoService.translate('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;
    this.notificationService.deleteNotification(id).subscribe();
  }

  handleNotificationClick(notification: TenantNotification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    this.navigateToRelatedPage(notification);
  }

  navigateToRelatedPage(notification: TenantNotification): void {
    const type = notification.event_type;
    if (type.includes('maintenance')) {
      this.slugService.navigateTo(['portal', 'mantenimiento']);
    } else if (type.includes('contract')) {
      this.slugService.navigateTo(['portal', 'documentos']);
    } else if (type.includes('payment')) {
      this.slugService.navigateTo(['portal', 'pagos']);
    }
  }

  getNotificationIcon(eventType: string): LucideIcon {
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
    const types: Record<string, string> = {
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
      types[eventType] ?? 'public.tenantNotifications.types.default',
    );
  }

  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const t = (k: string, p?: Record<string, number>) => this.translocoService.translate(k, p);

    if (minutes < 1) return t('public.tenantNotifications.now');
    if (minutes < 60)
      return t(
        minutes !== 1
          ? 'public.tenantNotifications.minutesAgoPlural'
          : 'public.tenantNotifications.minutesAgo',
        { count: minutes },
      );
    if (hours < 24)
      return t(
        hours !== 1
          ? 'public.tenantNotifications.hoursAgoPlural'
          : 'public.tenantNotifications.hoursAgo',
        { count: hours },
      );
    if (days === 1) return t('public.tenantNotifications.yesterday');
    if (days < 7) return t('public.tenantNotifications.daysAgo', { count: days });
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
}
