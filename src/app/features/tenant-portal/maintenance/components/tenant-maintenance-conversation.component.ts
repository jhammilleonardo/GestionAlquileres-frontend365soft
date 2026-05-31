import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import {
  CheckCircle2,
  FileText,
  Image,
  LucideAngularModule,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from 'lucide-angular';

import { environment } from '../../../../../environments/environment';
import { MaintenanceMessage } from '../../../../core/models/maintenance-request.model';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';

@Component({
  selector: 'app-tenant-maintenance-conversation',
  imports: [FormsModule, LucideAngularModule, TranslocoModule, TenantDatePipe],
  template: `
    <section class="conv-panel">
      <div class="conv-header">
        <div class="conv-header-icon">
          <lucide-icon [img]="MessageSquare" [size]="16"></lucide-icon>
        </div>
        <span class="conv-title">{{ 'public.tenantMaintenance.conversation' | transloco }}</span>
        @if (messages().length > 0) {
          <span class="conv-badge">{{ messages().length }}</span>
        }
      </div>

      @if (isLoading()) {
        <div class="conv-loading">
          <div class="sk-msg-item right"></div>
          <div class="sk-msg-item left"></div>
          <div class="sk-msg-item right"></div>
          <div class="sk-msg-item left"></div>
        </div>
      } @else {
        <div class="conv-messages-wrap">
          <div class="conv-messages" #msgContainer (scroll)="onMessagesScroll($event)">
            @if (messages().length === 0) {
              <div class="conv-empty">
                <div class="conv-empty-icon">
                  <lucide-icon [img]="MessageSquare" [size]="28"></lucide-icon>
                </div>
                <p class="conv-empty-title">
                  {{ 'public.tenantMaintenance.noMessages' | transloco }}
                </p>
                <p class="conv-empty-sub">
                  {{ 'public.tenantMaintenance.startConversation' | transloco }}
                </p>
              </div>
            } @else {
              @for (message of messages(); track message.id) {
                @if (isFirstPollingNew(message)) {
                  <div class="new-polling-divider">
                    <div class="new-polling-line"></div>
                    <span class="new-polling-label">
                      ↓ {{ 'public.tenantMaintenance.newMessages' | transloco }}
                    </span>
                    <div class="new-polling-line"></div>
                  </div>
                }
                @if (isFirstUnread(message)) {
                  <div class="unread-divider">
                    <div class="unread-line"></div>
                    <span class="unread-label">
                      {{
                        'public.tenantMaintenance.unreadMessages'
                          | transloco: { count: unreadCountFromHere() }
                      }}
                    </span>
                    <div class="unread-line"></div>
                  </div>
                }
                <div class="msg-row" [class.msg-mine]="isMyMessage()(message)">
                  @if (!isMyMessage()(message)) {
                    <div class="msg-avatar admin-avatar">A</div>
                  }
                  <div class="msg-group">
                    <span class="msg-sender" [class.msg-sender-mine]="isMyMessage()(message)">
                      {{
                        isMyMessage()(message)
                          ? ('public.tenantMaintenance.you' | transloco)
                          : ('public.tenantMaintenance.admin' | transloco)
                      }}
                    </span>
                    <div class="msg-bubble" [class.bubble-mine]="isMyMessage()(message)">
                      {{ message.message }}
                    </div>
                    @if (message.attachments && message.attachments.length > 0) {
                      <div
                        class="msg-attachments"
                        [class.msg-attachments-mine]="isMyMessage()(message)"
                      >
                        @for (attachment of message.attachments; track attachment.id) {
                          <a
                            [href]="getFileUrl(attachment.file_url)"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="att-chip"
                            [class.att-chip-mine]="isMyMessage()(message)"
                          >
                            <lucide-icon
                              [img]="isImageAttachment(attachment.file_type) ? Image : FileText"
                              [size]="12"
                            ></lucide-icon>
                            <span>{{ attachment.file_name }}</span>
                          </a>
                        }
                      </div>
                    }
                    <span class="msg-time">{{ message.created_at | tenantDate: true }}</span>
                  </div>
                  @if (isMyMessage()(message)) {
                    <div class="msg-avatar tenant-avatar">
                      {{ 'public.tenantMaintenance.you' | transloco }}
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>

        @if (newMessagesCount() > 0) {
          <div class="new-msg-bar">
            <button class="new-msg-btn" type="button" (click)="handleScrollToNewMessages()">
              ↓ {{ newMessagesCount() }}
              {{ 'public.tenantMaintenance.newMessages' | transloco }}
            </button>
          </div>
        }

        @if (canSendMessage()) {
          <div class="conv-input-wrapper">
            <input
              #fileInputRef
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              class="file-input"
              (change)="onFileSelected($event)"
            />

            @if (selectedFiles().length > 0) {
              <div class="file-preview">
                @for (file of selectedFiles(); track $index; let i = $index) {
                  <div class="file-chip">
                    <lucide-icon [img]="Paperclip" [size]="11"></lucide-icon>
                    <span>{{ file.name }}</span>
                    <button class="file-remove" type="button" (click)="removeFile.emit(i)">
                      <lucide-icon [img]="X" [size]="10"></lucide-icon>
                    </button>
                  </div>
                }
              </div>
            }

            <div class="conv-input-area">
              <button
                class="attach-btn"
                type="button"
                (click)="fileInputRef.click()"
                [disabled]="selectedFiles().length >= 3"
                title="Adjuntar archivo (max. 3)"
              >
                <lucide-icon [img]="Paperclip" [size]="15"></lucide-icon>
                @if (selectedFiles().length > 0) {
                  <span class="attach-count">{{ selectedFiles().length }}/3</span>
                }
              </button>
              <textarea
                class="conv-textarea"
                [(ngModel)]="draftMessage"
                rows="1"
                [placeholder]="'public.tenantMaintenance.writeMessage' | transloco"
                (keydown.enter)="$event.preventDefault(); submitMessage()"
              ></textarea>
              <button
                class="send-btn"
                type="button"
                (click)="submitMessage()"
                [disabled]="!draftMessage.trim() || isSending()"
              >
                @if (isSending()) {
                  <span class="send-spinner" aria-hidden="true"></span>
                } @else {
                  <lucide-icon [img]="Send" [size]="16"></lucide-icon>
                }
              </button>
            </div>
          </div>
        } @else {
          <div class="conv-closed">
            <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
            <p>{{ 'public.tenantMaintenance.requestClosed' | transloco }}</p>
          </div>
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .conv-panel {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      height: 640px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .conv-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
      background: #fff;
    }

    .conv-header-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: #eff6ff;
      color: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .conv-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      flex: 1;
    }

    .conv-badge {
      background: #3b82f6;
      color: #fff;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      min-width: 22px;
      text-align: center;
    }

    .conv-loading {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #f8fafc;
    }

    .sk-msg-item {
      height: 48px;
      width: 65%;
      border-radius: 14px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    .sk-msg-item.right {
      align-self: flex-end;
    }

    .sk-msg-item.left {
      align-self: flex-start;
    }

    .conv-messages-wrap {
      flex: 1;
      min-height: 0;
      position: relative;
    }

    .conv-messages {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #f8fafc;
    }

    .conv-messages::-webkit-scrollbar {
      width: 4px;
    }

    .conv-messages::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .conv-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 40px;
      text-align: center;
    }

    .conv-empty-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #eff6ff;
      color: #93c5fd;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    .conv-empty-title {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }

    .conv-empty-sub {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      max-width: 200px;
    }

    .msg-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 85%;
      align-self: flex-start;
    }

    .msg-row.msg-mine {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .admin-avatar {
      background: #e0e7ff;
      color: #4338ca;
    }

    .tenant-avatar {
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 9px;
    }

    .msg-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .msg-sender {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      padding: 0 4px;
    }

    .msg-sender.msg-sender-mine {
      text-align: right;
    }

    .msg-bubble {
      padding: 10px 14px;
      border-radius: 4px 14px 14px 14px;
      font-size: 13px;
      line-height: 1.55;
      color: #1e293b;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
      word-break: break-word;
      max-width: 100%;
    }

    .bubble-mine {
      background: #3b82f6;
      color: #fff;
      border-radius: 14px 4px 14px 14px;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
    }

    .msg-time {
      font-size: 10px;
      color: #94a3b8;
      padding: 0 4px;
    }

    .msg-sender.msg-sender-mine ~ * {
      align-self: flex-end;
    }

    .new-polling-divider,
    .unread-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 4px 0;
      width: 100%;
    }

    .new-polling-line,
    .unread-line {
      flex: 1;
      height: 1px;
      opacity: 0.5;
    }

    .new-polling-line {
      background: #3b82f6;
    }

    .unread-line {
      background: #f59e0b;
    }

    .new-polling-label,
    .unread-label {
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      border-radius: 20px;
      padding: 3px 12px;
    }

    .new-polling-label {
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .unread-label {
      color: #b45309;
      background: #fffbeb;
      border: 1px solid #fde68a;
    }

    .new-msg-bar {
      display: flex;
      justify-content: center;
      padding: 6px 12px;
      flex-shrink: 0;
    }

    .new-msg-btn {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 20px;
      padding: 7px 18px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.45);
      white-space: nowrap;
      animation: slideDown 0.2s ease;
    }

    .new-msg-btn:hover {
      background: #2563eb;
    }

    .conv-input-wrapper {
      border-top: 1px solid #e2e8f0;
      background: #fff;
      flex-shrink: 0;
    }

    .file-input {
      display: none;
    }

    .file-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      padding: 8px 12px 0;
    }

    .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 20px;
      font-size: 11px;
      color: #1d4ed8;
      max-width: 160px;
    }

    .file-chip span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border: none;
      background: none;
      cursor: pointer;
      color: #93c5fd;
      padding: 0;
      flex-shrink: 0;
    }

    .file-remove:hover {
      color: #1d4ed8;
    }

    .conv-input-area {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      background: #fff;
      flex-shrink: 0;
      gap: 8px;
    }

    .attach-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      cursor: pointer;
      justify-content: center;
      flex-shrink: 0;
      transition:
        border-color 0.15s,
        color 0.15s,
        background 0.15s;
      position: relative;
    }

    .attach-btn:hover:not(:disabled) {
      border-color: #3b82f6;
      color: #3b82f6;
      background: #eff6ff;
    }

    .attach-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .attach-count {
      position: absolute;
      top: -4px;
      right: -4px;
      font-size: 9px;
      font-weight: 700;
      background: #3b82f6;
      color: #fff;
      border-radius: 10px;
      padding: 1px 4px;
    }

    .conv-textarea {
      flex: 1;
      resize: none;
      border: 1.5px solid #e2e8f0;
      border-radius: 22px;
      padding: 10px 16px;
      font-size: 13px;
      font-family: inherit;
      color: #1e293b;
      outline: none;
      transition:
        border-color 0.18s,
        box-shadow 0.18s;
      background: #f8fafc;
      min-height: 40px;
      max-height: 100px;
      line-height: 1.4;
    }

    .conv-textarea:focus {
      border-color: #3b82f6;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    .conv-textarea::placeholder {
      color: #94a3b8;
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3b82f6;
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition:
        background 0.15s,
        transform 0.1s;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
    }

    .send-btn:hover:not(:disabled) {
      background: #2563eb;
      transform: scale(1.06);
    }

    .send-btn:disabled {
      background: #cbd5e1;
      box-shadow: none;
      cursor: not-allowed;
    }

    .send-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.55);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .conv-closed {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
      background: #f8fafc;
      flex-shrink: 0;
    }

    .conv-closed p {
      margin: 0;
    }

    .msg-attachments {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }

    .msg-attachments-mine {
      justify-content: flex-end;
    }

    .att-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 11px;
      color: #475569;
      text-decoration: none;
      transition: background 0.15s;
    }

    .att-chip:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .att-chip span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 120px;
    }

    .att-chip.att-chip-mine {
      background: #e2e8f0;
      border-color: #cbd5e1;
      color: #1e293b;
    }

    .att-chip.att-chip-mine:hover {
      background: #cbd5e1;
      color: #0f172a;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantMaintenanceConversationComponent implements AfterViewChecked {
  @ViewChild('msgContainer') private msgContainer?: ElementRef<HTMLElement>;

  readonly messages = input.required<MaintenanceMessage[]>();
  readonly isLoading = input(false);
  readonly isSending = input(false);
  readonly selectedFiles = input<readonly File[]>([]);
  readonly canSendMessage = input(false);
  readonly newMessagesCount = input(0);
  readonly pollingNewFromId = input(0);
  readonly firstUnreadMessageId = input(0);
  readonly unreadCountFromHere = input(0);
  readonly scrollVersion = input(0);
  readonly isMyMessage = input.required<(message: MaintenanceMessage) => boolean>();

  readonly filesSelected = output<File[]>();
  readonly removeFile = output<number>();
  readonly messageSubmitted = output<string>();
  readonly conversationAtBottomChange = output<boolean>();
  readonly newMessagesOpened = output<void>();

  readonly CheckCircle2 = CheckCircle2;
  readonly FileText = FileText;
  readonly Image = Image;
  readonly MessageSquare = MessageSquare;
  readonly Paperclip = Paperclip;
  readonly Send = Send;
  readonly X = X;

  protected draftMessage = '';
  private handledScrollVersion = -1;

  ngAfterViewChecked(): void {
    const version = this.scrollVersion();

    if (version !== this.handledScrollVersion) {
      this.handledScrollVersion = version;
      this.scrollToBottom();
    }
  }

  protected onMessagesScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
    this.conversationAtBottomChange.emit(isAtBottom);
  }

  protected handleScrollToNewMessages(): void {
    this.newMessagesOpened.emit();
    this.scrollToBottom();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files) {
      return;
    }

    this.filesSelected.emit(Array.from(input.files));
    input.value = '';
  }

  protected submitMessage(): void {
    const message = this.draftMessage.trim();

    if (!message) {
      return;
    }

    this.messageSubmitted.emit(message);
    this.draftMessage = '';
  }

  protected getFileUrl(url: string): string {
    return environment.apiUrl.replace(/\/$/, '') + url;
  }

  protected isImageAttachment(fileType: string): boolean {
    return fileType === 'image';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.msgContainer?.nativeElement;

      if (element) {
        element.scrollTop = element.scrollHeight;
        this.conversationAtBottomChange.emit(true);
      }
    }, 50);
  }

  protected isFirstUnread(message: MaintenanceMessage): boolean {
    return this.firstUnreadMessageId() > 0 && message.id === this.firstUnreadMessageId();
  }

  protected isFirstPollingNew(message: MaintenanceMessage): boolean {
    return this.pollingNewFromId() > 0 && message.id === this.pollingNewFromId();
  }
}
