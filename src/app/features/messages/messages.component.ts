import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Send,
  Plus,
  Megaphone,
  MessageSquare,
  ArrowLeft,
} from 'lucide-angular';

import { InternalMessageService } from '../../core/services/internal-message.service';
import {
  InternalMessage,
  MessageRecipient,
  MessageThread,
} from '../../core/models/internal-message.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'mensajes', alias: 'messages' })],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent {
  readonly Send = Send;
  readonly Plus = Plus;
  readonly Megaphone = Megaphone;
  readonly MessageSquare = MessageSquare;
  readonly ArrowLeft = ArrowLeft;

  private readonly messageService = inject(InternalMessageService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly threads = signal<MessageThread[]>([]);
  readonly isLoading = signal(true);
  readonly activeUserId = signal<number | null>(null);
  readonly activeName = signal('');
  readonly messages = signal<InternalMessage[]>([]);
  readonly loadingThread = signal(false);
  readonly loadingOlder = signal(false);
  readonly hasMoreMessages = signal(false);
  readonly draft = signal('');
  readonly sending = signal(false);

  private readonly THREAD_PAGE_SIZE = 30;

  readonly recipients = signal<MessageRecipient[]>([]);
  readonly composeOpen = signal(false);
  readonly composeRecipient = signal<number | null>(null);
  readonly composeBody = signal('');

  readonly broadcastOpen = signal(false);
  readonly broadcastBody = signal('');

  private readonly currentUserId = Number(this.auth.currentUser()?.id ?? 0);

  readonly recipientOptions = computed<AppSelectOption<number>[]>(() =>
    this.recipients().map((r) => ({ value: r.id, label: `${r.name} (${r.role})` })),
  );

  textareaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  constructor() {
    this.load();
    this.messageService.getRecipients().subscribe({
      next: (recipients) => this.recipients.set(recipients),
      error: () => this.recipients.set([]),
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.messageService.getThreads().subscribe({
      next: (threads) => {
        this.threads.set(threads);
        this.isLoading.set(false);
      },
      error: () => {
        this.threads.set([]);
        this.isLoading.set(false);
      },
    });
    this.messageService.refreshUnread().subscribe();
  }

  isMine(message: InternalMessage): boolean {
    return message.sender_id === this.currentUserId;
  }

  openThread(thread: MessageThread): void {
    this.activeUserId.set(thread.user_id);
    this.activeName.set(thread.user_name);
    this.loadingThread.set(true);
    this.messageService.getThread(thread.user_id, { limit: this.THREAD_PAGE_SIZE }).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.hasMoreMessages.set(messages.length === this.THREAD_PAGE_SIZE);
        this.loadingThread.set(false);
        // Refrescar el contador de no leídos del hilo abierto
        this.threads.update((threads) =>
          threads.map((t) => (t.user_id === thread.user_id ? { ...t, unread: 0 } : t)),
        );
        this.messageService.refreshUnread().subscribe();
      },
      error: () => this.loadingThread.set(false),
    });
  }

  loadOlderMessages(): void {
    const userId = this.activeUserId();
    const current = this.messages();
    if (userId === null || current.length === 0 || this.loadingOlder()) return;
    const oldestId = current[0].id;
    this.loadingOlder.set(true);
    this.messageService
      .getThread(userId, { limit: this.THREAD_PAGE_SIZE, before: oldestId })
      .subscribe({
        next: (older) => {
          this.messages.update((msgs) => [...older, ...msgs]);
          this.hasMoreMessages.set(older.length === this.THREAD_PAGE_SIZE);
          this.loadingOlder.set(false);
        },
        error: () => this.loadingOlder.set(false),
      });
  }

  closeThread(): void {
    this.activeUserId.set(null);
  }

  send(): void {
    const body = this.draft().trim();
    const userId = this.activeUserId();
    if (!body || !userId) return;
    this.sending.set(true);
    this.messageService.send(userId, body).subscribe({
      next: (message) => {
        this.sending.set(false);
        this.messages.update((msgs) => [...msgs, message]);
        this.draft.set('');
        this.load();
      },
      error: () => {
        this.sending.set(false);
        this.toast.error(this.transloco.translate('messages.sendError'));
      },
    });
  }

  // ── Componer nuevo ──
  openCompose(): void {
    this.composeRecipient.set(null);
    this.composeBody.set('');
    this.composeOpen.set(true);
  }

  closeCompose(): void {
    this.composeOpen.set(false);
  }

  sendNew(): void {
    const recipient = this.composeRecipient();
    const body = this.composeBody().trim();
    if (!recipient || !body) return;
    this.sending.set(true);
    this.messageService.send(recipient, body).subscribe({
      next: () => {
        this.sending.set(false);
        this.composeOpen.set(false);
        this.toast.success(this.transloco.translate('messages.sent'));
        this.load();
      },
      error: () => {
        this.sending.set(false);
        this.toast.error(this.transloco.translate('messages.sendError'));
      },
    });
  }

  // ── Envío masivo ──
  openBroadcast(): void {
    this.broadcastBody.set('');
    this.broadcastOpen.set(true);
  }

  closeBroadcast(): void {
    this.broadcastOpen.set(false);
  }

  sendBroadcast(): void {
    const body = this.broadcastBody().trim();
    if (!body) return;
    this.sending.set(true);
    this.messageService.broadcast(body).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.broadcastOpen.set(false);
        this.toast.success(
          this.transloco.translate('messages.broadcastSent', { count: res.count }),
        );
        this.load();
      },
      error: () => {
        this.sending.set(false);
        this.toast.error(this.transloco.translate('messages.sendError'));
      },
    });
  }
}
