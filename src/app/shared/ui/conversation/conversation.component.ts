import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { FileText, LucideAngularModule, MessageSquare, Paperclip, Send, X } from 'lucide-angular';

import { InternalMessage, MessageAttachment } from '../../../core/models/internal-message.model';
import { SecureFileService } from '../../../core/services/secure-file.service';
import { AuthContext } from '../../../core/services/session-token.service';

/**
 * Conversación tipo WhatsApp reutilizable por el chat de admin y el del
 * inquilino. Es puramente presentacional: recibe los mensajes y emite los
 * eventos de envío/adjuntos; el contenedor decide cómo persistirlos.
 */
@Component({
  selector: 'app-conversation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, TranslocoModule, LucideAngularModule],
  template: `
    <div class="conv-messages-wrap">
      <div class="conv-messages" #msgContainer>
        @if (hasMore()) {
          <button
            type="button"
            class="load-older"
            [disabled]="isLoadingOlder()"
            (click)="loadOlder.emit()"
          >
            {{ (isLoadingOlder() ? 'messages.loadingOlder' : 'messages.loadOlder') | transloco }}
          </button>
        }
        @if (messages().length === 0) {
          <div class="conv-empty">
            <div class="conv-empty-icon">
              <lucide-icon [img]="MessageSquare" [size]="28" />
            </div>
            <p class="conv-empty-title">{{ emptyTitle() }}</p>
          </div>
        } @else {
          @for (message of messages(); track message.id) {
            <div class="msg-row" [class.msg-mine]="isMine(message)">
              @if (!isMine(message)) {
                <div class="msg-avatar peer-avatar">{{ peerInitial() }}</div>
              }
              <div class="msg-group">
                <span class="msg-sender" [class.msg-sender-mine]="isMine(message)">
                  {{ isMine(message) ? ('messages.you' | transloco) : peerName() }}
                </span>

                @if (message.body.trim()) {
                  <div class="msg-bubble" [class.bubble-mine]="isMine(message)">
                    {{ message.body }}
                  </div>
                }

                @if (message.attachments && message.attachments.length > 0) {
                  <div class="msg-attachments" [class.msg-attachments-mine]="isMine(message)">
                    @for (att of message.attachments; track att.id) {
                      @if (att.file_type === 'image') {
                        <button type="button" class="att-media" (click)="open(att)">
                          @if (mediaUrl(att.file_url)) {
                            <img [src]="mediaUrl(att.file_url)" [alt]="att.file_name" />
                          } @else {
                            <span class="att-media-loading"></span>
                          }
                        </button>
                      } @else if (att.file_type === 'video') {
                        @if (mediaUrl(att.file_url)) {
                          <video class="att-media" [src]="mediaUrl(att.file_url)" controls></video>
                        } @else {
                          <span class="att-media att-media-loading"></span>
                        }
                      } @else {
                        <button
                          type="button"
                          class="att-chip"
                          [class.att-chip-mine]="isMine(message)"
                          (click)="download(att)"
                        >
                          <lucide-icon [img]="FileText" [size]="12" />
                          <span>{{ att.file_name }}</span>
                        </button>
                      }
                    }
                  </div>
                }

                <span class="msg-time">{{ message.created_at | date: 'short' }}</span>
              </div>
            </div>
          }
        }
      </div>
    </div>

    @if (canSend()) {
      <div class="conv-input-wrapper">
        <input
          #fileInputRef
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,application/pdf"
          class="file-input"
          (change)="onFileSelected($event)"
        />

        @if (selectedFiles().length > 0) {
          <div class="file-preview">
            @for (file of selectedFiles(); track $index; let i = $index) {
              <div class="file-chip">
                <lucide-icon [img]="Paperclip" [size]="11" />
                <span>{{ file.name }}</span>
                <button type="button" class="file-remove" (click)="removeFile.emit(i)">
                  <lucide-icon [img]="X" [size]="10" />
                </button>
              </div>
            }
          </div>
        }

        <div class="conv-input-area">
          <button
            type="button"
            class="attach-btn"
            (click)="fileInputRef.click()"
            [disabled]="selectedFiles().length >= 3 || isSending()"
            [attr.aria-label]="'messages.attach' | transloco"
            [title]="'messages.attach' | transloco"
          >
            <lucide-icon [img]="Paperclip" [size]="16" />
            @if (selectedFiles().length > 0) {
              <span class="attach-count">{{ selectedFiles().length }}/3</span>
            }
          </button>
          <textarea
            class="conv-textarea"
            rows="1"
            [(ngModel)]="draft"
            [placeholder]="'messages.typeMessage' | transloco"
            (keydown.enter)="$event.preventDefault(); submit()"
          ></textarea>
          <button
            type="button"
            class="send-btn"
            (click)="submit()"
            [disabled]="!canSubmit() || isSending()"
            [attr.aria-label]="'messages.send' | transloco"
          >
            @if (isSending()) {
              <span class="send-spinner" aria-hidden="true"></span>
            } @else {
              <lucide-icon [img]="Send" [size]="16" />
            }
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
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
      background: var(--app-color-bg, #f8fafc);
    }

    .conv-messages::-webkit-scrollbar {
      width: 5px;
    }

    .conv-messages::-webkit-scrollbar-thumb {
      background: var(--app-color-border-strong, #cbd5e1);
      border-radius: 4px;
    }

    .load-older {
      align-self: center;
      margin-bottom: 4px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid var(--app-color-border, #e2e8f0);
      border-radius: 20px;
      background: var(--app-color-surface, #fff);
      color: var(--app-color-text-muted, #64748b);
      cursor: pointer;
    }

    .load-older:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .conv-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px;
      text-align: center;
    }

    .conv-empty-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--app-color-primary-soft, #eff6ff);
      color: var(--app-color-primary, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .conv-empty-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--app-color-text-muted, #475569);
      margin: 0;
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
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #e0e7ff;
      color: #4338ca;
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
      color: var(--app-color-text-muted, #64748b);
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
      color: var(--app-color-text, #1e293b);
      background: var(--app-color-surface, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
      word-break: break-word;
      white-space: pre-wrap;
      max-width: 100%;
    }

    .msg-mine .msg-bubble,
    .bubble-mine {
      background: var(--app-color-primary, #3b82f6);
      color: #fff;
      border-radius: 14px 4px 14px 14px;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
    }

    .msg-time {
      font-size: 10px;
      color: var(--app-color-text-muted, #94a3b8);
      opacity: 0.8;
      padding: 0 4px;
    }

    .msg-mine .msg-time,
    .msg-mine .msg-sender,
    .msg-mine .msg-attachments {
      align-self: flex-end;
    }

    .msg-attachments {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }

    .msg-attachments-mine {
      justify-content: flex-end;
    }

    .att-media {
      display: block;
      width: 180px;
      max-width: 60vw;
      border-radius: 12px;
      border: 1px solid var(--app-color-border, #dbe3ef);
      overflow: hidden;
      padding: 0;
      background: var(--app-color-surface-muted, #f1f5f9);
      cursor: pointer;
    }

    img.att-media,
    button.att-media img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      display: block;
    }

    video.att-media {
      aspect-ratio: 16 / 9;
      object-fit: cover;
      cursor: default;
    }

    .att-media-loading {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    .att-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 10px;
      background: var(--app-color-surface-muted, #f1f5f9);
      border: 1px solid var(--app-color-border, #e2e8f0);
      border-radius: 10px;
      font-size: 12px;
      color: var(--app-color-text, #475569);
      cursor: pointer;
      max-width: 180px;
    }

    .att-chip span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .att-chip-mine {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
      color: #fff;
    }

    .conv-input-wrapper {
      border-top: 1px solid var(--app-color-border, #e2e8f0);
      background: var(--app-color-surface, #fff);
      flex-shrink: 0;
    }

    .file-input {
      display: none;
    }

    .file-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 12px 0;
    }

    .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      background: var(--app-color-primary-soft, #eff6ff);
      border: 1px solid var(--app-color-primary, #bfdbfe);
      border-radius: 20px;
      font-size: 11px;
      color: var(--app-color-primary, #1d4ed8);
      max-width: 180px;
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
      color: currentColor;
      padding: 0;
      flex-shrink: 0;
      opacity: 0.7;
    }

    .file-remove:hover {
      opacity: 1;
    }

    .conv-input-area {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      gap: 8px;
    }

    .attach-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1.5px solid var(--app-color-border, #e2e8f0);
      background: var(--app-color-surface-muted, #f8fafc);
      color: var(--app-color-text-muted, #64748b);
      cursor: pointer;
      flex-shrink: 0;
      position: relative;
      transition:
        border-color 0.15s,
        color 0.15s,
        background 0.15s;
    }

    .attach-btn:hover:not(:disabled) {
      border-color: var(--app-color-primary, #3b82f6);
      color: var(--app-color-primary, #3b82f6);
      background: var(--app-color-primary-soft, #eff6ff);
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
      background: var(--app-color-primary, #3b82f6);
      color: #fff;
      border-radius: 10px;
      padding: 1px 4px;
    }

    .conv-textarea {
      flex: 1;
      resize: none;
      border: 1.5px solid var(--app-color-border, #e2e8f0);
      border-radius: 22px;
      padding: 10px 16px;
      font-size: 13px;
      font-family: inherit;
      color: var(--app-color-text, #1e293b);
      outline: none;
      background: var(--app-color-surface-muted, #f8fafc);
      min-height: 40px;
      max-height: 120px;
      line-height: 1.4;
      transition:
        border-color 0.18s,
        box-shadow 0.18s,
        background 0.18s;
    }

    .conv-textarea:focus {
      border-color: var(--app-color-primary, #3b82f6);
      background: var(--app-color-surface, #fff);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--app-color-primary, #3b82f6);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
      transition:
        background 0.15s,
        transform 0.1s;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.06);
    }

    .send-btn:disabled {
      background: var(--app-color-border-strong, #cbd5e1);
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
  `,
})
export class AppConversationComponent implements AfterViewChecked, OnChanges {
  @ViewChild('msgContainer') private msgContainer?: ElementRef<HTMLElement>;

  readonly messages = input.required<InternalMessage[]>();
  readonly currentUserId = input.required<number>();
  readonly peerName = input('');
  readonly emptyTitle = input('');
  readonly isSending = input(false);
  readonly selectedFiles = input<readonly File[]>([]);
  readonly canSend = input(true);
  readonly fileContext = input.required<AuthContext>();
  readonly hasMore = input(false);
  readonly isLoadingOlder = input(false);
  readonly sentVersion = input(0);

  readonly filesSelected = output<File[]>();
  readonly removeFile = output<number>();
  readonly messageSubmitted = output<string>();
  readonly loadOlder = output<void>();

  readonly FileText = FileText;
  readonly MessageSquare = MessageSquare;
  readonly Paperclip = Paperclip;
  readonly Send = Send;
  readonly X = X;

  protected draft = '';

  private readonly secureFile = inject(SecureFileService);
  private readonly objectUrls = signal<Record<string, string>>({});
  private lastMessageId = computed(() => {
    const list = this.messages();
    return list.length > 0 ? list[list.length - 1].id : 0;
  });
  private scrolledForId = -1;
  private handledSentVersion = 0;

  protected peerInitial = computed(() => this.peerName().charAt(0).toUpperCase() || 'A');

  ngOnChanges(changes: SimpleChanges): void {
    if ('messages' in changes) {
      this.prepareMediaPreviews();
    }
    if ('sentVersion' in changes && this.sentVersion() !== this.handledSentVersion) {
      this.handledSentVersion = this.sentVersion();
      this.draft = '';
    }
  }

  ngAfterViewChecked(): void {
    const lastId = this.lastMessageId();
    if (lastId !== this.scrolledForId) {
      this.scrolledForId = lastId;
      this.scrollToBottom();
    }
  }

  protected isMine(message: InternalMessage): boolean {
    return message.sender_id === this.currentUserId();
  }

  protected mediaUrl(fileUrl: string): string {
    return this.objectUrls()[fileUrl] ?? '';
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) {
      return;
    }
    this.filesSelected.emit(Array.from(input.files));
    input.value = '';
  }

  protected canSubmit(): boolean {
    return this.draft.trim().length > 0 || this.selectedFiles().length > 0;
  }

  protected submit(): void {
    if (!this.canSubmit() || this.isSending()) {
      return;
    }
    this.messageSubmitted.emit(this.draft.trim());
  }

  protected open(attachment: MessageAttachment): void {
    this.secureFile.open(attachment.file_url, this.fileContext());
  }

  protected download(attachment: MessageAttachment): void {
    this.secureFile.download(attachment.file_url, attachment.file_name, this.fileContext());
  }

  private prepareMediaPreviews(): void {
    const media = this.messages().flatMap((message) =>
      (message.attachments ?? []).filter(
        (att) => att.file_type === 'image' || att.file_type === 'video',
      ),
    );

    for (const att of media) {
      if (this.objectUrls()[att.file_url]) {
        continue;
      }
      this.secureFile.getObjectUrl(att.file_url, this.fileContext()).subscribe({
        next: (objectUrl) =>
          this.objectUrls.update((urls) => ({ ...urls, [att.file_url]: objectUrl })),
        error: () => undefined,
      });
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.msgContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
