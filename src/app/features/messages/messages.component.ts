import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Plus,
  Megaphone,
  MessageSquare,
  ArrowLeft,
  Paperclip,
  X,
} from 'lucide-angular';
import { Subscription, interval } from 'rxjs';

import { InternalMessageService } from '../../core/services/internal-message.service';
import { NotificationSocketService } from '../../core/services/notification-socket.service';
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
import { AppConversationComponent } from '../../shared/ui/conversation/conversation.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    AppConversationComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'mensajes', alias: 'messages' })],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnDestroy {
  readonly Plus = Plus;
  readonly Megaphone = Megaphone;
  readonly MessageSquare = MessageSquare;
  readonly ArrowLeft = ArrowLeft;
  readonly Paperclip = Paperclip;
  readonly X = X;

  private readonly messageService = inject(InternalMessageService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly notificationSocket = inject(NotificationSocketService);

  readonly threads = signal<MessageThread[]>([]);
  readonly isLoading = signal(true);
  readonly activeUserId = signal<number | null>(null);
  readonly activeName = signal('');
  readonly messages = signal<InternalMessage[]>([]);
  readonly loadingThread = signal(false);
  readonly loadingOlder = signal(false);
  readonly hasMoreMessages = signal(false);
  readonly sending = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly sentVersion = signal(0);

  readonly currentUserId = Number(this.auth.currentUser()?.id ?? 0);

  private readonly THREAD_PAGE_SIZE = 30;
  private readonly POLL_INTERVAL_MS = 8000;
  private pollSub: Subscription | null = null;
  private realtimeSub: Subscription | null = null;

  readonly recipients = signal<MessageRecipient[]>([]);
  readonly composeOpen = signal(false);
  readonly composeRecipient = signal<number | null>(null);
  readonly composeBody = signal('');
  readonly composeFiles = signal<File[]>([]);

  readonly broadcastOpen = signal(false);
  readonly broadcastBody = signal('');

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
    this.notificationSocket.connect();
    this.listenForRealtimeMessages();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.realtimeSub?.unsubscribe();
  }

  load(silent = false): void {
    if (!silent) this.isLoading.set(true);
    this.messageService.getThreads().subscribe({
      next: (threads) => {
        this.threads.set(threads);
        if (!silent) this.isLoading.set(false);
      },
      error: () => {
        this.threads.set([]);
        if (!silent) this.isLoading.set(false);
      },
    });
    this.messageService.refreshUnread().subscribe();
  }

  private startPolling(): void {
    this.pollSub = interval(this.POLL_INTERVAL_MS).subscribe(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (this.sending()) return;
      this.load(true);
      this.refreshActiveThread();
    });
  }

  private listenForRealtimeMessages(): void {
    this.realtimeSub = this.notificationSocket.events$.subscribe((event) => {
      if (event.type !== 'message.new') {
        return;
      }

      this.load(true);
      const peerUserId = Number(event.payload.peerUserId);
      if (Number.isFinite(peerUserId) && peerUserId === this.activeUserId()) {
        this.refreshActiveThread();
      }
    });
  }

  private refreshActiveThread(): void {
    const userId = this.activeUserId();
    if (userId === null || this.loadingThread() || this.loadingOlder()) return;

    this.messageService.getThread(userId, { limit: this.THREAD_PAGE_SIZE }).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.hasMoreMessages.set(messages.length === this.THREAD_PAGE_SIZE);
        this.threads.update((threads) =>
          threads.map((thread) => (thread.user_id === userId ? { ...thread, unread: 0 } : thread)),
        );
        this.messageService.refreshUnread().subscribe();
      },
    });
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
    this.selectedFiles.set([]);
  }

  addFiles(files: File[]): void {
    const remaining = 3 - this.selectedFiles().length;
    if (remaining <= 0) return;
    this.selectedFiles.update((current) => [...current, ...files.slice(0, remaining)]);
  }

  removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  send(body: string): void {
    const userId = this.activeUserId();
    const files = this.selectedFiles();
    if (!userId || this.sending() || (!body && files.length === 0)) return;

    this.sending.set(true);

    const dispatch = (fileUrls: string[]) => {
      this.messageService.send(userId, body, fileUrls).subscribe({
        next: (message) => {
          this.appendMessage(message);
          this.selectedFiles.set([]);
          this.sentVersion.update((version) => version + 1);
          this.sending.set(false);
          this.load(true);
        },
        error: () => {
          this.sending.set(false);
          this.toast.error(this.transloco.translate('messages.sendError'));
        },
      });
    };

    if (files.length > 0) {
      this.messageService.uploadFiles(files, 'admin').subscribe({
        next: (attachments) => dispatch(attachments.map((a) => a.file_url)),
        error: () => {
          this.sending.set(false);
          this.toast.error(this.transloco.translate('messages.sendError'));
        },
      });
      return;
    }

    dispatch([]);
  }

  /** Inserta evitando duplicados por id. */
  private appendMessage(message: InternalMessage): void {
    this.messages.update((msgs) =>
      msgs.some((m) => m.id === message.id) ? msgs : [...msgs, message],
    );
  }

  // ── Componer nuevo ──
  openCompose(): void {
    this.composeRecipient.set(null);
    this.composeBody.set('');
    this.composeFiles.set([]);
    this.composeOpen.set(true);
  }

  closeCompose(): void {
    this.composeOpen.set(false);
    this.composeFiles.set([]);
  }

  addComposeFiles(files: File[]): void {
    const remaining = 3 - this.composeFiles().length;
    if (remaining <= 0) return;
    this.composeFiles.update((current) => [...current, ...files.slice(0, remaining)]);
  }

  onComposeFileSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files) return;
    this.addComposeFiles(Array.from(input.files));
    input.value = '';
  }

  removeComposeFile(index: number): void {
    this.composeFiles.update((files) => files.filter((_, i) => i !== index));
  }

  sendNew(): void {
    const recipient = this.composeRecipient();
    const body = this.composeBody().trim();
    const files = this.composeFiles();
    if (!recipient || this.sending() || (!body && files.length === 0)) return;
    this.sending.set(true);

    const dispatch = (fileUrls: string[]) => {
      this.messageService.send(recipient, body, fileUrls).subscribe({
        next: () => {
          this.sending.set(false);
          this.composeOpen.set(false);
          this.composeBody.set('');
          this.composeFiles.set([]);
          this.toast.success(this.transloco.translate('messages.sent'));
          this.load(true);
        },
        error: () => {
          this.sending.set(false);
          this.toast.error(this.transloco.translate('messages.sendError'));
        },
      });
    };

    if (files.length > 0) {
      this.messageService.uploadFiles(files, 'admin').subscribe({
        next: (attachments) => dispatch(attachments.map((attachment) => attachment.file_url)),
        error: () => {
          this.sending.set(false);
          this.toast.error(this.transloco.translate('messages.sendError'));
        },
      });
      return;
    }

    dispatch([]);
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
        this.load(true);
      },
      error: () => {
        this.sending.set(false);
        this.toast.error(this.transloco.translate('messages.sendError'));
      },
    });
  }
}
