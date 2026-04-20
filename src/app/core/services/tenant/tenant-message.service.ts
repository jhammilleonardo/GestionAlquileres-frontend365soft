import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import {
  Message,
  MessageThread,
  CreateMessageDto,
  ReplyMessageDto,
  MessageStatus,
} from '../../models/message.model';

@Injectable({
  providedIn: 'root',
})
export class TenantMessageService {
  private http = inject(HttpClient);
  private transloco = inject(TranslocoService);

  // Reactive state
  private messagesSignal = signal<Message[]>([]);
  private threadsSignal = signal<MessageThread[]>([]);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  messages = this.messagesSignal.asReadonly();
  threads = this.threadsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  // Computed values
  unreadCount = computed(
    () => this.messagesSignal().filter((m) => m.status === MessageStatus.UNREAD).length,
  );

  /**
   * Cargar todos los mensajes
   * NOTE: Requiere endpoint backend: GET /tenant/messages
   */
  loadMessages(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<Message[]>(`${environment.apiUrl}tenant/messages`)
      .pipe(
        tap((messages) => {
          const parsedMessages = messages.map((m) => ({
            ...m,
            created_at: new Date(m.created_at),
            read_at: m.read_at ? new Date(m.read_at) : undefined,
          }));
          this.messagesSignal.set(parsedMessages);
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadMessages'));
          this.isLoadingSignal.set(false);
          console.error('Error loading messages:', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Cargar hilos de conversación
   */
  loadThreads(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<MessageThread[]>(`${environment.apiUrl}/tenant/message-threads`)
      .pipe(
        tap((threads) => {
          const parsedThreads = threads.map((t) => ({
            ...t,
            last_message_date: new Date(t.last_message_date),
            messages: t.messages.map((m) => ({
              ...m,
              created_at: new Date(m.created_at),
              read_at: m.read_at ? new Date(m.read_at) : undefined,
            })),
          }));
          this.threadsSignal.set(parsedThreads);
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadConversations'));
          this.isLoadingSignal.set(false);
          console.error('Error loading threads:', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Obtener un mensaje específico
   */
  getMessage(id: number): Observable<Message> {
    return this.http.get<Message>(`${environment.apiUrl}/tenant/messages/${id}`).pipe(
      tap((message) => {
        const parsedMessage = {
          ...message,
          created_at: new Date(message.created_at),
          read_at: message.read_at ? new Date(message.read_at) : undefined,
        };

        // Actualizar en la lista
        this.messagesSignal.update((messages) =>
          messages.map((m) => (m.id === parsedMessage.id ? parsedMessage : m)),
        );
      }),
      catchError((error) => {
        console.error('Error loading message:', error);
        throw error;
      }),
    );
  }

  /**
   * Crear un nuevo mensaje
   */
  createMessage(message: CreateMessageDto): Observable<Message> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Message>(`${environment.apiUrl}/tenant/messages`, message).pipe(
      tap((newMessage) => {
        const parsedMessage = {
          ...newMessage,
          created_at: new Date(newMessage.created_at),
          read_at: newMessage.read_at ? new Date(newMessage.read_at) : undefined,
        };
        this.messagesSignal.update((messages) => [parsedMessage, ...messages]);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(
          error.error?.message || this.transloco.translate('common.errors.sendMessage'),
        );
        this.isLoadingSignal.set(false);
        throw error;
      }),
    );
  }

  /**
   * Responder a un mensaje
   */
  replyMessage(reply: ReplyMessageDto): Observable<Message> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Message>(`${environment.apiUrl}/tenant/messages/reply`, reply).pipe(
      tap((newMessage) => {
        const parsedMessage = {
          ...newMessage,
          created_at: new Date(newMessage.created_at),
          read_at: newMessage.read_at ? new Date(newMessage.read_at) : undefined,
        };
        this.messagesSignal.update((messages) => [parsedMessage, ...messages]);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(
          error.error?.message || this.transloco.translate('common.errors.sendReply'),
        );
        this.isLoadingSignal.set(false);
        throw error;
      }),
    );
  }

  /**
   * Marcar mensaje como leído
   */
  markAsRead(messageId: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/tenant/messages/${messageId}/read`, {}).pipe(
      tap(() => {
        this.messagesSignal.update((messages) =>
          messages.map((m) =>
            m.id === messageId ? { ...m, status: MessageStatus.READ, read_at: new Date() } : m,
          ),
        );
      }),
      catchError((error) => {
        console.error('Error marking message as read:', error);
        return of(undefined);
      }),
    );
  }

  /**
   * Archivar mensaje
   */
  archiveMessage(messageId: number): Observable<void> {
    return this.http
      .put<void>(`${environment.apiUrl}/tenant/messages/${messageId}/archive`, {})
      .pipe(
        tap(() => {
          this.messagesSignal.update((messages) =>
            messages.map((m) =>
              m.id === messageId ? { ...m, status: MessageStatus.ARCHIVED } : m,
            ),
          );
        }),
        catchError((error) => {
          console.error('Error archiving message:', error);
          return of(undefined);
        }),
      );
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
