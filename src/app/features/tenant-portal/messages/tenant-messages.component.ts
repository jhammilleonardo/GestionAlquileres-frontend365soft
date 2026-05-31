import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Send, MessageSquare } from 'lucide-angular';

import { InternalMessageService } from '../../../core/services/internal-message.service';
import { InternalMessage, MessageRecipient } from '../../../core/models/internal-message.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-tenant-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
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
        <div class="tm-body">
          <div class="tm-messages">
            @if (messages().length === 0) {
              <app-empty-state [title]="'messages.tenantEmpty' | transloco" />
            } @else {
              @for (message of messages(); track message.id) {
                <div class="bubble-row" [class.mine]="isMine(message)">
                  <div class="bubble">
                    <p>{{ message.body }}</p>
                    <span class="bubble-time">{{ message.created_at | date: 'short' }}</span>
                  </div>
                </div>
              }
            }
          </div>

          <form class="tm-composer" (ngSubmit)="send()">
            <textarea
              rows="2"
              [placeholder]="'messages.typeMessage' | transloco"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
            ></textarea>
            <app-button
              type="submit"
              [disabled]="sending() || !draft().trim() || !adminId()"
              (clicked)="send()"
            >
              <lucide-icon [img]="Send" [size]="16" />
              {{ 'messages.send' | transloco }}
            </app-button>
          </form>
          @if (!adminId()) {
            <p class="tm-warn">
              <lucide-icon [img]="MessageSquare" [size]="14" /> {{ 'messages.noAdmin' | transloco }}
            </p>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .tm-page {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      max-width: 760px;
      margin: 0 auto;
    }
    .tm-header h1 {
      margin: 0;
      font-size: 1.3rem;
    }
    .tm-header p {
      margin: 0.25rem 0 0;
      color: var(--app-color-text-muted);
    }
    .tm-body {
      display: grid;
      gap: 0.75rem;
    }
    .tm-messages {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-height: 40vh;
      max-height: 60vh;
      overflow-y: auto;
      border: 1px solid var(--app-color-border);
      border-radius: 14px;
      background: var(--app-color-surface);
      padding: 1rem;
    }
    .bubble-row {
      display: flex;
    }
    .bubble-row.mine {
      justify-content: flex-end;
    }
    .bubble {
      max-width: 75%;
      padding: 0.55rem 0.8rem;
      border-radius: 12px;
      background: var(--app-color-surface-muted, #f1f5f9);
    }
    .bubble p {
      margin: 0;
      font-size: 0.9rem;
      white-space: pre-wrap;
    }
    .bubble-row.mine .bubble {
      background: var(--app-color-primary, #2563eb);
      color: #fff;
    }
    .bubble-time {
      display: block;
      margin-top: 3px;
      font-size: 0.68rem;
      opacity: 0.7;
    }
    .tm-composer {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;
    }
    .tm-composer textarea {
      flex: 1;
      border: 1px solid var(--app-color-border);
      border-radius: 10px;
      padding: 0.55rem 0.75rem;
      font: inherit;
      resize: none;
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
export class TenantMessagesComponent {
  readonly Send = Send;
  readonly MessageSquare = MessageSquare;

  private readonly messageService = inject(InternalMessageService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly messages = signal<InternalMessage[]>([]);
  readonly draft = signal('');
  readonly sending = signal(false);
  readonly adminId = signal<number | null>(null);

  private readonly currentUserId = Number(this.auth.currentUser()?.id ?? 0);

  constructor() {
    this.init();
  }

  private init(): void {
    this.isLoading.set(true);
    // Resolver el admin destinatario y cargar la conversación existente
    this.messageService.getRecipients().subscribe({
      next: (recipients: MessageRecipient[]) => {
        const admin = recipients.find((r) => r.role === 'ADMIN') ?? recipients[0];
        this.adminId.set(admin?.id ?? null);
        this.loadConversation();
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
    this.messageService.getThread(adminId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.isLoading.set(false);
        this.messageService.refreshUnread().subscribe();
      },
      error: () => this.isLoading.set(false),
    });
  }

  isMine(message: InternalMessage): boolean {
    return message.sender_id === this.currentUserId;
  }

  send(): void {
    const body = this.draft().trim();
    const adminId = this.adminId();
    if (!body || !adminId) return;
    this.sending.set(true);
    this.messageService.send(adminId, body).subscribe({
      next: (message) => {
        this.sending.set(false);
        this.messages.update((msgs) => [...msgs, message]);
        this.draft.set('');
      },
      error: () => {
        this.sending.set(false);
        this.toast.error('No se pudo enviar el mensaje');
      },
    });
  }
}
