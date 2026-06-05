import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { NgClass } from '@angular/common';
import {
  LucideAngularModule,
  type LucideIconData,
  Bell,
  Check,
  Trash2,
  Filter,
  RefreshCw,
  Wrench,
  Home,
  User,
  FileText,
  CreditCard,
  Hash,
  MapPin,
  Tag,
  BellOff,
  ArrowUpRight,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { NotificationService, Notification } from '../../core/services/admin/notification.service';
import { SlugService } from '../../core/services/slug.service';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';

type NotificationFilter = 'all' | 'unread' | 'read';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notifications',
  standalone: true,
  imports: [
    NgClass,
    RouterModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope({ scope: 'notificaciones', alias: 'notifications' })],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements AfterViewInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private slugService = inject(SlugService);
  private destroyRef = inject(DestroyRef);
  private confirmDialog = inject(ConfirmDialogService);
  private transloco = inject(TranslocoService);

  @ViewChildren('notifCard') notifCards!: QueryList<ElementRef<HTMLElement>>;

  // Signals
  notifications = this.notificationService.notifications;
  stats = this.notificationService.stats;
  isLoading = this.notificationService.isLoading;
  error = this.notificationService.error;
  unreadCount = this.notificationService.unreadCount;

  // State
  readonly currentFilter = signal<NotificationFilter>('all');
  readonly highlightedId = signal<number | null>(null);

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

  constructor() {
    const highlightParam = this.route.snapshot.queryParamMap.get('highlight');
    if (highlightParam) this.highlightedId.set(Number(highlightParam));
    this.loadNotifications();
    this.loadStats();
    this.notificationService.startPolling(60000);
    this.destroyRef.onDestroy(() => this.notificationService.stopPolling());
  }

  ngAfterViewInit(): void {
    if (this.highlightedId()) {
      // Esperar que Angular renderice las tarjetas
      this.notifCards.changes
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.scrollToHighlighted());
      // Intentar inmediatamente también (por si ya estaban renderizadas)
      setTimeout(() => this.scrollToHighlighted(), 300);
    }
  }

  private scrollToHighlighted(): void {
    const highlightedId = this.highlightedId();
    if (!highlightedId) return;
    const card = this.notifCards.find(
      (el) => el.nativeElement.getAttribute('data-id') === String(highlightedId),
    );
    if (card) {
      card.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Quitar el highlight después de 3 segundos
      setTimeout(() => {
        this.highlightedId.set(null);
      }, 3000);
    }
  }

  loadNotifications(): void {
    const options: { is_read?: boolean; limit?: number } = { limit: 50 };

    if (this.currentFilter() === 'unread') {
      options.is_read = false;
    } else if (this.currentFilter() === 'read') {
      options.is_read = true;
    }

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
      title: this.transloco.translate('notifications.deleteDialog.title'),
      message: this.transloco.translate('notifications.deleteDialog.message'),
      confirmLabel: this.transloco.translate('common.delete'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });

    if (confirmed) {
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
    const slug = this.slugService.getSlug();
    if (!slug) return;

    if (eventType.includes('maintenance')) {
      const requestId = notification.metadata?.['maintenance_request_id'];
      void this.router.navigate(['/', slug, 'mantenimiento'], {
        queryParams: requestId ? { open: requestId } : {},
      });
    } else if (eventType.includes('property')) {
      const propertyId = notification.metadata?.['property_id'];
      if (propertyId) {
        void this.router.navigate(['/', slug, 'propiedades', propertyId]);
      }
    } else if (eventType.includes('user')) {
      const userId = notification.metadata?.['user_id'];
      if (userId) {
        void this.router.navigate(['/', slug, 'inquilinos', userId]);
      }
    } else if (eventType.includes('contract')) {
      const contractId = notification.metadata?.['contract_id'];
      if (contractId) {
        void this.router.navigate(['/', slug, 'contratos', contractId]);
      }
    } else if (eventType.includes('payment')) {
      const paymentId = notification.metadata?.['payment_id'];
      if (paymentId) {
        void this.router.navigate(['/', slug, 'pagos'], { queryParams: { id: paymentId } });
      } else {
        void this.router.navigate(['/', slug, 'pagos']);
      }
    }
  }

  getNotificationIcon(eventType: string): LucideIconData {
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
    return this.transloco.translate(`notifications.type.${eventType}`);
  }

  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return this.transloco.translate('notifications.time.now');
    if (minutes < 60) {
      return this.transloco.translate('notifications.time.minutesAgo', { count: minutes });
    }
    if (hours < 24) {
      return this.transloco.translate('notifications.time.hoursAgo', { count: hours });
    }
    if (days === 1) return this.transloco.translate('notifications.time.yesterday');
    if (days < 7) {
      return this.transloco.translate('notifications.time.daysAgo', { count: days });
    }
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
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
