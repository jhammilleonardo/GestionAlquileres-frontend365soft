import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of, interval, startWith, Subscription } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { SlugService } from '../slug.service';

export interface TenantNotificationMetadata {
  ticket_number?: string;
  maintenance_request_id?: number;
  property_id?: number;
  property_title?: string;
  category?: string;
  priority?: string;
  description?: string;
  old_status?: string;
  new_status?: string;
  sender_name?: string;
  sender_id?: number;
  message_preview?: string;
  is_from_admin?: boolean;
  contract_id?: number;
  contract_number?: string;
  payment_id?: number;
  payment_amount?: number;
  payment_due_date?: string;
  [key: string]: unknown;
}

export interface TenantNotification {
  id: number;
  user_id: number;
  event_type: string;
  title: string;
  message: string;
  metadata?: TenantNotificationMetadata;
  is_read: boolean;
  read_at?: Date | null;
  created_at: Date;
}

export interface TenantNotificationStats {
  total: number;
  unread: number;
  read: number;
  by_type?: { [key: string]: number };
}

const APPLICATION_STATUS_LABEL_KEYS: Record<string, string> = {
  PENDIENTE: 'public.tenantNotifications.status.PENDIENTE',
  EN_REVISION: 'public.tenantNotifications.status.EN_REVISION',
  APROBADA: 'public.tenantNotifications.status.APROBADA',
  RECHAZADA: 'public.tenantNotifications.status.RECHAZADA',
};

@Injectable({
  providedIn: 'root',
})
export class TenantNotificationService {
  private http = inject(HttpClient);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  // Signal-based reactive state
  private notificationsSignal = signal<TenantNotification[]>([]);
  private statsSignal = signal<TenantNotificationStats | null>(null);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Polling subscription
  private pollingSubscription: Subscription | null = null;
  private destroyRef = inject(DestroyRef);

  // Public readonly signals
  notifications = this.notificationsSignal.asReadonly();
  stats = this.statsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  // Computed values
  unreadCount = computed(() => this.statsSignal()?.unread || 0);
  unreadNotifications = computed(() => this.notificationsSignal().filter((n) => !n.is_read));

  private get slug(): string {
    return this.slugService.getSlug() || '';
  }

  /**
   * Cargar notificaciones con filtros opcionales
   */
  loadNotifications(options?: {
    is_read?: boolean;
    event_type?: string;
    limit?: number;
    offset?: number;
  }): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    let params = new HttpParams();
    if (options?.is_read !== undefined) {
      params = params.set('is_read', options.is_read.toString());
    }
    if (options?.event_type) {
      params = params.set('event_type', options.event_type);
    }
    if (options?.limit) {
      params = params.set('limit', options.limit.toString());
    }
    if (options?.offset) {
      params = params.set('offset', options.offset.toString());
    }

    this.http
      .get<TenantNotification[]>(`${environment.apiUrl}${this.slug}/notifications`, {
        params,
      })
      .pipe(
        tap((notifications) => {
          const processedNotifications = notifications.map((n) => ({
            ...n,
            created_at: new Date(n.created_at),
          }));
          this.notificationsSignal.set(processedNotifications);
          this.isLoadingSignal.set(false);
        }),
        catchError((_e) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadNotifications'));
          this.isLoadingSignal.set(false);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Cargar estadísticas de notificaciones
   */
  loadStats(): void {
    if (!this.slug) return;

    this.http
      .get<TenantNotificationStats>(`${environment.apiUrl}${this.slug}/notifications/stats`)
      .pipe(
        tap((stats) => {
          this.statsSignal.set(stats);
        }),
        catchError((_e) => {
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Obtener una notificación específica
   */
  getNotification(id: number): Observable<TenantNotification> {
    return this.http
      .get<TenantNotification>(`${environment.apiUrl}${this.slug}/notifications/${id}`)
      .pipe(
        tap((notification) => {
          const processedNotification = {
            ...notification,
            created_at: new Date(notification.created_at),
          };

          // Actualizar en la lista si existe
          this.notificationsSignal.update((notifications) =>
            notifications.map((n) =>
              n.id === processedNotification.id ? processedNotification : n,
            ),
          );
        }),
      );
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(id: number): Observable<void> {
    return this.http
      .patch<void>(`${environment.apiUrl}${this.slug}/notifications/${id}/read`, {})
      .pipe(
        tap(() => {
          // Actualizar en la lista
          this.notificationsSignal.update((notifications) =>
            notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
          );

          // Actualizar estadísticas
          this.loadStats();
        }),
        catchError((_e) => {
          return of(undefined);
        }),
      );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead(): Observable<void> {
    return this.http
      .patch<void>(`${environment.apiUrl}${this.slug}/notifications/read-all`, {})
      .pipe(
        tap(() => {
          // Actualizar todas en la lista
          this.notificationsSignal.update((notifications) =>
            notifications.map((n) => ({ ...n, is_read: true })),
          );

          // Actualizar estadísticas
          this.loadStats();
        }),
        catchError((_e) => {
          this.errorSignal.set(this.transloco.translate('common.errors.markAllRead'));
          return of(undefined);
        }),
      );
  }

  /**
   * Eliminar una notificación
   */
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}${this.slug}/notifications/${id}`).pipe(
      tap(() => {
        // Remover de la lista
        this.notificationsSignal.update((notifications) =>
          notifications.filter((n) => n.id !== id),
        );

        // Actualizar estadísticas
        this.loadStats();
      }),
      catchError((_e) => {
        this.errorSignal.set(this.transloco.translate('common.errors.deleteNotification'));
        return of(undefined);
      }),
    );
  }

  /**
   * Refrescar notificaciones y estadísticas
   */
  refresh(): void {
    this.loadNotifications();
    this.loadStats();
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  getDisplayTitle(notification: TenantNotification): string {
    const eventType = notification.event_type;

    if (eventType === 'maintenance.message.received') {
      return this.transloco.translate(
        'public.tenantNotifications.messages.maintenanceMessageTitle',
      );
    }

    if (eventType === 'application.status.changed') {
      return this.transloco.translate(
        'public.tenantNotifications.messages.applicationStatusChangedTitle',
      );
    }

    if (eventType === 'contract.created') {
      return this.transloco.translate('public.tenantNotifications.messages.contractCreatedTitle');
    }

    if (eventType === 'contract.signed') {
      return this.transloco.translate('public.tenantNotifications.messages.contractSignedTitle');
    }

    if (eventType === 'payment.approved') {
      return this.transloco.translate('public.tenantNotifications.messages.paymentApprovedTitle');
    }

    if (eventType === 'payment.rejected') {
      return this.transloco.translate('public.tenantNotifications.messages.paymentRejectedTitle');
    }

    return notification.title;
  }

  getDisplayMessage(notification: TenantNotification): string {
    const eventType = notification.event_type;
    const metadata = notification.metadata ?? {};

    if (eventType === 'maintenance.message.received') {
      const sender =
        this.getStringMetadata(metadata, 'sender_name') ??
        this.transloco.translate('public.tenantNotifications.messages.maintenanceMessageSender');
      const ticket = this.getStringMetadata(metadata, 'ticket_number') ?? '';
      const preview = this.getStringMetadata(metadata, 'message_preview') ?? '';

      return this.transloco.translate(
        'public.tenantNotifications.messages.maintenanceMessageBody',
        { sender, ticket, preview },
      );
    }

    if (eventType === 'application.status.changed') {
      const status = this.getStringMetadata(metadata, 'status');
      const propertyTitle =
        this.getStringMetadata(metadata, 'property_title') ??
        this.extractApplicationPropertyTitle(notification.message);
      const statusLabel = status ? this.translateApplicationStatus(status) : null;

      if (propertyTitle && statusLabel) {
        return this.transloco.translate(
          'public.tenantNotifications.messages.applicationStatusChangedMessage',
          { property: propertyTitle, status: statusLabel },
        );
      }

      if (statusLabel) {
        return this.transloco.translate(
          'public.tenantNotifications.messages.applicationStatusChangedMessageGeneric',
          { status: statusLabel },
        );
      }
    }

    if (eventType === 'contract.created') {
      return this.transloco.translate(
        'public.tenantNotifications.messages.contractCreatedMessage',
        {
          contract: this.getStringMetadata(metadata, 'contract_number') ?? '',
        },
      );
    }

    if (eventType === 'contract.signed') {
      return this.transloco.translate('public.tenantNotifications.messages.contractSignedMessage', {
        contract: this.getStringMetadata(metadata, 'contract_number') ?? '',
      });
    }

    if (eventType === 'payment.approved') {
      return this.transloco.translate('public.tenantNotifications.messages.paymentApprovedMessage');
    }

    if (eventType === 'payment.rejected') {
      return this.transloco.translate('public.tenantNotifications.messages.paymentRejectedMessage');
    }

    return notification.message;
  }

  private translateApplicationStatus(status: string): string {
    const key = APPLICATION_STATUS_LABEL_KEYS[status];
    return key ? this.transloco.translate(key) : status;
  }

  private getStringMetadata(
    metadata: TenantNotificationMetadata,
    key: keyof TenantNotificationMetadata,
  ): string | null {
    const value = metadata[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private extractApplicationPropertyTitle(message: string): string | null {
    const match = message.match(/propiedad\s+(.+?)\s+ha cambiado/i);
    return match?.[1]?.trim() || null;
  }

  /**
   * Iniciar polling para verificar nuevas notificaciones
   * @param intervalMs Intervalo en milisegundos (default: 60000 = 1 minuto)
   */
  startPolling(intervalMs: number = 60000): void {
    // Detener polling existente si hay uno
    this.stopPolling();

    this.pollingSubscription = interval(intervalMs)
      .pipe(
        startWith(0), // Ejecutar inmediatamente al inicio
      )
      .subscribe(() => {
        this.loadStats();
      });

    // Limpiar automáticamente cuando el componente se destruye
    this.destroyRef.onDestroy(() => {
      this.stopPolling();
    });
  }

  /**
   * Detener el polling de notificaciones
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
