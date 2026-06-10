import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SlugService } from './slug.service';
import { NotificationService } from './admin/notification.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AuthContext, SessionTokenService } from './session-token.service';

interface RealtimePayload {
  user_id?: number;
  title?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  messageId?: number;
  peerUserId?: number;
  senderId?: number;
  recipientId?: number;
}

export interface RealtimeEvent {
  type: string;
  payload: RealtimePayload;
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
  private readonly sessionToken = inject(SessionTokenService);
  private readonly slugService = inject(SlugService);
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);

  private socket: Socket | null = null;
  private activeContext: AuthContext | null = null;
  private readonly eventSubject = new Subject<RealtimeEvent>();
  readonly events$ = this.eventSubject.asObservable();

  /** Conecta al namespace de notificaciones en tiempo real (idempotente). */
  connect(context: AuthContext = 'admin'): void {
    if (this.socket?.connected && this.activeContext === context) {
      return;
    }
    if (this.socket && this.activeContext !== context) {
      this.disconnect();
    }

    const token = this.sessionToken.getToken(context);
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
    this.activeContext = context;

    for (const event of REALTIME_EVENTS) {
      this.socket.on(event, (payload: RealtimePayload) => this.handleEvent(event, payload));
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.activeContext = null;
  }

  private handleEvent(type: string, payload: RealtimePayload): void {
    this.eventSubject.next({ type, payload });
    // Toast no intrusivo + refresco del centro de notificaciones (badge)
    if (payload?.title) {
      this.toast.info(payload.title);
    }
    this.notificationService.loadNotifications({ is_read: false, limit: 5 });
    this.notificationService.loadStats();
  }
}
