import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiClientService } from '../http/api-client.service';
import { SlugService } from './slug.service';
import { InternalMessage, MessageRecipient, MessageThread } from '../models/internal-message.model';

@Injectable({ providedIn: 'root' })
export class InternalMessageService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  private readonly unreadSignal = signal(0);
  readonly unread = this.unreadSignal.asReadonly();

  getThreads(): Observable<MessageThread[]> {
    return this.api.get<MessageThread[]>(this.endpoint('messages/threads'));
  }

  /**
   * Conversación con un usuario. Paginación por cursor: `before` trae los
   * mensajes anteriores (más antiguos) a ese id para "cargar más".
   */
  getThread(
    userId: number,
    options: { limit?: number; before?: number } = {},
  ): Observable<InternalMessage[]> {
    const params: Record<string, number> = {};
    if (options.limit) params['limit'] = options.limit;
    if (options.before) params['before'] = options.before;
    return this.api.get<InternalMessage[]>(this.endpoint(`messages/thread/${userId}`), { params });
  }

  getRecipients(): Observable<MessageRecipient[]> {
    return this.api.get<MessageRecipient[]>(this.endpoint('messages/recipients'));
  }

  send(recipientId: number, body: string): Observable<InternalMessage> {
    return this.api.post<InternalMessage, { recipient_id: number; body: string }>(
      this.endpoint('messages'),
      { recipient_id: recipientId, body },
    );
  }

  broadcast(body: string): Observable<{ count: number }> {
    return this.api.post<{ count: number }, { body: string }>(this.endpoint('messages/broadcast'), {
      body,
    });
  }

  refreshUnread(): Observable<{ count: number }> {
    return this.api
      .get<{ count: number }>(this.endpoint('messages/unread-count'))
      .pipe(tap((res) => this.unreadSignal.set(res.count)));
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
