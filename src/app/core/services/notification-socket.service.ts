import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SlugService } from './slug.service';
import { NotificationService } from './admin/notification.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface RealtimePayload {
  user_id?: number;
  title?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/** Eventos en tiempo real emitidos por el gateway `/notifications`. */
const REALTIME_EVENTS = [
  'payment.received',
  'payment.approved',
  'maintenance.new',
  'maintenance.updated',
  'contract.signed',
  'screening.completed',
  'message.new',
];

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
  private readonly auth = inject(AuthService);
  private readonly slugService = inject(SlugService);
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);

  private socket: Socket | null = null;

  /** Conecta al namespace de notificaciones en tiempo real (idempotente). */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    const token = this.auth.getToken();
    const tenantSlug = this.slugService.getSlug();
    if (!token || !tenantSlug) {
      return;
    }

    const base = environment.apiUrl.replace(/\/+$/, '');
    this.socket = io(`${base}/notifications`, {
      auth: { token, tenantSlug },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    for (const event of REALTIME_EVENTS) {
      this.socket.on(event, (payload: RealtimePayload) => this.handleEvent(payload));
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  private handleEvent(payload: RealtimePayload): void {
    // Toast no intrusivo + refresco del centro de notificaciones (badge)
    if (payload?.title) {
      this.toast.info(payload.title);
    }
    this.notificationService.loadNotifications({ is_read: false, limit: 5 });
    this.notificationService.loadStats();
  }
}
