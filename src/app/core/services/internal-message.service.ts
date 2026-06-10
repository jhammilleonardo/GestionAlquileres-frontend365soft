import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiClientService, ApiRequestOptions } from '../http/api-client.service';
import { SlugService } from './slug.service';
import { SessionTokenService, AuthContext } from './session-token.service';
import {
  InternalMessage,
  MessageAttachment,
  MessageRecipient,
  MessageThread,
} from '../models/internal-message.model';

@Injectable({ providedIn: 'root' })
export class InternalMessageService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);
  private readonly http = inject(HttpClient);
  private readonly sessionToken = inject(SessionTokenService);

  private readonly unreadSignal = signal(0);
  readonly unread = this.unreadSignal.asReadonly();

  // Los endpoints de mensajería (`/:slug/messages/...`) son idénticos para
  // admin e inquilino, por lo que el interceptor no puede inferir el token por
  // la URL. El llamador indica el contexto y aquí fijamos el Authorization
  // explícito (el interceptor respeta los headers ya presentes).
  getThreads(context: AuthContext = 'admin'): Observable<MessageThread[]> {
    return this.api.get<MessageThread[]>(this.endpoint('messages/threads'), this.opts(context));
  }

  /**
   * Conversación con un usuario. Paginación por cursor: `before` trae los
   * mensajes anteriores (más antiguos) a ese id para "cargar más".
   */
  getThread(
    userId: number,
    options: { limit?: number; before?: number } = {},
    context: AuthContext = 'admin',
  ): Observable<InternalMessage[]> {
    const params: Record<string, number> = {};
    if (options.limit) params['limit'] = options.limit;
    if (options.before) params['before'] = options.before;
    return this.api.get<InternalMessage[]>(this.endpoint(`messages/thread/${userId}`), {
      ...this.opts(context),
      params,
    });
  }

  getRecipients(context: AuthContext = 'admin'): Observable<MessageRecipient[]> {
    return this.api.get<MessageRecipient[]>(
      this.endpoint('messages/recipients'),
      this.opts(context),
    );
  }

  send(
    recipientId: number,
    body: string,
    files: string[] = [],
    context: AuthContext = 'admin',
  ): Observable<InternalMessage> {
    return this.api.post<InternalMessage, { recipient_id: number; body: string; files?: string[] }>(
      this.endpoint('messages'),
      {
        recipient_id: recipientId,
        body,
        ...(files.length > 0 && { files }),
      },
      this.opts(context),
    );
  }

  /**
   * Sube archivos del chat y devuelve los adjuntos persistidos (con file_url).
   * Esas URLs se envían luego en `send(...)` para enlazarlas al mensaje.
   * Usa HttpClient directo porque ApiClientService no maneja multipart.
   */
  uploadFiles(files: File[], context: AuthContext): Observable<MessageAttachment[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const token = this.sessionToken.getToken(context);
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
    const url = `${environment.apiUrl.replace(/\/$/, '')}/${this.slugService.getSlug()}/messages/upload`;
    return this.http.post<MessageAttachment[]>(url, formData, { headers });
  }

  broadcast(body: string, context: AuthContext = 'admin'): Observable<{ count: number }> {
    return this.api.post<{ count: number }, { body: string }>(
      this.endpoint('messages/broadcast'),
      { body },
      this.opts(context),
    );
  }

  refreshUnread(context: AuthContext = 'admin'): Observable<{ count: number }> {
    return this.api
      .get<{ count: number }>(this.endpoint('messages/unread-count'), this.opts(context))
      .pipe(tap((res) => this.unreadSignal.set(res.count)));
  }

  private opts(context: AuthContext): ApiRequestOptions {
    const token = this.sessionToken.getToken(context);
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
