import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, MessageSquare } from 'lucide-angular';

import { InternalMessageService } from '../../../core/services/internal-message.service';
import { NotificationSocketService } from '../../../core/services/notification-socket.service';
import { InternalMessage, MessageRecipient } from '../../../core/models/internal-message.model';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppConversationComponent } from '../../../shared/ui/conversation/conversation.component';

const POLL_INTERVAL_MS = 8000;

@Component({
  selector: 'app-tenant-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    AppLoadingStateComponent,
    AppConversationComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'mensajes', alias: 'messages' })],
  template: `
    <section class="tm-page">
      <header class="tm-header">
        <h1>{{ 'messages.title' | transloco }}</h1>
        <p>{{ 'messages.tenantSubtitle' | transloco }}</p>
      </header>

      @if (isLoading()) {
        <app-loading-state [label]="'messages.loading' | transloco" />
      } @else {
        <div class="tm-card">
          <app-conversation
            [messages]="messages()"
            [currentUserId]="currentUserId"
            [peerName]="'messages.management' | transloco"
            [emptyTitle]="'messages.tenantEmpty' | transloco"
            [isSending]="sending()"
            [selectedFiles]="selectedFiles()"
            [canSend]="!!adminId()"
            [sentVersion]="sentVersion()"
            fileContext="tenant"
            (filesSelected)="addFiles($event)"
            (removeFile)="removeFile($event)"
            (messageSubmitted)="send($event)"
          />
        </div>
        @if (!adminId()) {
          <p class="tm-warn">
            <lucide-icon [img]="MessageSquare" [size]="14" /> {{ 'messages.noAdmin' | transloco }}
          </p>
        }
      }
    </section>
  `,
  styles: `
    .tm-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem;
      max-width: 820px;
      margin: 0 auto;
      height: 100%;
    }
    .tm-header h1 {
      margin: 0;
      font-size: 1.3rem;
    }
    .tm-header p {
      margin: 0.25rem 0 0;
      color: var(--app-color-text-muted);
    }
    .tm-card {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 68vh;
      border: 1px solid var(--app-color-border);
      border-radius: 14px;
      background: var(--app-color-surface);
      overflow: hidden;
    }
    .tm-warn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--app-color-text-muted);
      font-size: 0.84rem;
      margin: 0;
    }
  `,
})
export class TenantMessagesComponent implements OnDestroy {
  readonly MessageSquare = MessageSquare;

  private readonly messageService = inject(InternalMessageService);
  private readonly auth = inject(TenantAuthService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly notificationSocket = inject(NotificationSocketService);

  readonly isLoading = signal(true);
  readonly messages = signal<InternalMessage[]>([]);
  readonly sending = signal(false);
  readonly adminId = signal<number | null>(null);
  readonly selectedFiles = signal<File[]>([]);
  readonly sentVersion = signal(0);

  readonly currentUserId = Number(this.auth.currentUser()?.id ?? 0);

  private pollSub: Subscription | null = null;
  private realtimeSub: Subscription | null = null;

  constructor() {
    this.init();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.realtimeSub?.unsubscribe();
  }

  private init(): void {
    this.isLoading.set(true);
    this.notificationSocket.connect('tenant');
    this.listenForRealtimeMessages();
    this.messageService.getRecipients('tenant').subscribe({
      next: (recipients: MessageRecipient[]) => {
        const admin = recipients.find((r) => r.role === 'ADMIN') ?? recipients[0];
        this.adminId.set(admin?.id ?? null);
        this.loadConversation();
        this.startPolling();
      },
      error: () => {
        this.adminId.set(null);
        this.isLoading.set(false);
      },
    });
  }

  private loadConversation(): void {
    const adminId = this.adminId();
    if (!adminId) {
      this.isLoading.set(false);
      return;
    }
    this.messageService.getThread(adminId, {}, 'tenant').subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.isLoading.set(false);
        this.messageService.refreshUnread('tenant').subscribe();
      },
      error: () => this.isLoading.set(false),
    });
  }

  private startPolling(): void {
    const adminId = this.adminId();
    if (!adminId) return;
    this.pollSub?.unsubscribe();
    this.pollSub = interval(POLL_INTERVAL_MS).subscribe(() => {
      if (document.hidden || this.sending()) return;
      this.messageService.getThread(adminId, {}, 'tenant').subscribe({
        next: (messages) => this.messages.set(messages),
        error: () => undefined,
      });
    });
  }

  private listenForRealtimeMessages(): void {
    this.realtimeSub = this.notificationSocket.events$.subscribe((event) => {
      if (event.type !== 'message.new') {
        return;
      }
      const adminId = this.adminId();
      if (!adminId) {
        return;
      }
      const peerUserId = Number(event.payload.peerUserId);
      if (Number.isFinite(peerUserId) && peerUserId !== adminId) {
        return;
      }
      this.messageService.getThread(adminId, {}, 'tenant').subscribe({
        next: (messages) => this.messages.set(messages),
        error: () => undefined,
      });
    });
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
    const adminId = this.adminId();
    const files = this.selectedFiles();
    if (!adminId || this.sending() || (!body && files.length === 0)) return;

    this.sending.set(true);

    const dispatch = (fileUrls: string[]) => {
      this.messageService.send(adminId, body, fileUrls, 'tenant').subscribe({
        next: (message) => {
          this.appendMessage(message);
          this.selectedFiles.set([]);
          this.sentVersion.update((version) => version + 1);
          this.sending.set(false);
        },
        error: () => {
          this.sending.set(false);
          this.toast.error(this.transloco.translate('messages.sendError'));
        },
      });
    };

    if (files.length > 0) {
      this.messageService.uploadFiles(files, 'tenant').subscribe({
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

  /** Inserta evitando duplicados por id (defensa ante polling concurrente). */
  private appendMessage(message: InternalMessage): void {
    this.messages.update((msgs) =>
      msgs.some((m) => m.id === message.id) ? msgs : [...msgs, message],
    );
  }
}
