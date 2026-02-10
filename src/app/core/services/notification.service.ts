import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantAuthService } from './tenant-auth.service';
import { SlugService } from './slug.service';

export interface Notification {
    id: number;
    user_id: number;
    event_type: string;
    message: string;
    is_read: boolean;
    created_at: Date;
}

export interface NotificationStats {
    total: number;
    unread: number;
    read: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private authService = inject(TenantAuthService);
    private slugService = inject(SlugService);

    // Signal-based reactive state
    private notificationsSignal = signal<Notification[]>([]);
    private statsSignal = signal<NotificationStats | null>(null);
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    notifications = this.notificationsSignal.asReadonly();
    stats = this.statsSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();

    // Computed values
    unreadCount = computed(() => this.statsSignal()?.unread || 0);
    unreadNotifications = computed(() =>
        this.notificationsSignal().filter(n => !n.is_read)
    );

    private get slug(): string {
        return this.slugService.getSlug() || '';
    }

    private get headers(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
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

        this.http.get<Notification[]>(
            `${environment.apiUrl}${this.slug}/notifications`,
            { headers: this.headers, params }
        ).pipe(
            tap(notifications => {
                const processedNotifications = notifications.map(n => ({
                    ...n,
                    created_at: new Date(n.created_at)
                }));
                this.notificationsSignal.set(processedNotifications);
                this.isLoadingSignal.set(false);
            }),
            catchError(error => {
                this.errorSignal.set('Error al cargar las notificaciones');
                this.isLoadingSignal.set(false);
                console.error('Error loading notifications:', error);
                return of([]);
            })
        ).subscribe();
    }

    /**
     * Cargar estadísticas de notificaciones
     */
    loadStats(): void {
        if (!this.slug) return;

        this.http.get<NotificationStats>(
            `${environment.apiUrl}${this.slug}/notifications/stats`,
            { headers: this.headers }
        ).pipe(
            tap(stats => {
                this.statsSignal.set(stats);
            }),
            catchError(error => {
                console.error('Error loading notification stats:', error);
                return of(null);
            })
        ).subscribe();
    }

    /**
     * Obtener una notificación específica
     */
    getNotification(id: number): Observable<Notification> {
        return this.http.get<Notification>(
            `${environment.apiUrl}${this.slug}/notifications/${id}`,
            { headers: this.headers }
        ).pipe(
            tap(notification => {
                const processedNotification = {
                    ...notification,
                    created_at: new Date(notification.created_at)
                };

                // Actualizar en la lista si existe
                this.notificationsSignal.update(notifications =>
                    notifications.map(n => n.id === processedNotification.id ? processedNotification : n)
                );
            })
        );
    }

    /**
     * Marcar notificación como leída
     */
    markAsRead(id: number): Observable<void> {
        return this.http.patch<void>(
            `${environment.apiUrl}${this.slug}/notifications/${id}/read`,
            {},
            { headers: this.headers }
        ).pipe(
            tap(() => {
                // Actualizar en la lista
                this.notificationsSignal.update(notifications =>
                    notifications.map(n =>
                        n.id === id ? { ...n, is_read: true } : n
                    )
                );

                // Actualizar estadísticas
                this.loadStats();
            }),
            catchError(error => {
                console.error('Error marking notification as read:', error);
                return of(undefined);
            })
        );
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    markAllAsRead(): Observable<void> {
        return this.http.patch<void>(
            `${environment.apiUrl}${this.slug}/notifications/read-all`,
            {},
            { headers: this.headers }
        ).pipe(
            tap(() => {
                // Actualizar todas en la lista
                this.notificationsSignal.update(notifications =>
                    notifications.map(n => ({ ...n, is_read: true }))
                );

                // Actualizar estadísticas
                this.loadStats();
            }),
            catchError(error => {
                this.errorSignal.set('Error al marcar todas como leídas');
                console.error('Error marking all notifications as read:', error);
                return of(undefined);
            })
        );
    }

    /**
     * Eliminar una notificación
     */
    deleteNotification(id: number): Observable<void> {
        return this.http.delete<void>(
            `${environment.apiUrl}${this.slug}/notifications/${id}`,
            { headers: this.headers }
        ).pipe(
            tap(() => {
                // Remover de la lista
                this.notificationsSignal.update(notifications =>
                    notifications.filter(n => n.id !== id)
                );

                // Actualizar estadísticas
                this.loadStats();
            }),
            catchError(error => {
                this.errorSignal.set('Error al eliminar la notificación');
                console.error('Error deleting notification:', error);
                return of(undefined);
            })
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
}
