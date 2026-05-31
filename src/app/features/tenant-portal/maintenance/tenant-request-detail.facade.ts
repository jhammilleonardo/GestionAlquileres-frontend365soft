import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';

import {
  MaintenanceMessage,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../core/models/maintenance-request.model';
import { TenantMaintenanceService } from '../../../core/services/tenant/tenant-maintenance.service';

@Injectable()
export class TenantRequestDetailFacade implements OnDestroy {
  private readonly maintenanceService = inject(TenantMaintenanceService);

  readonly request = signal<MaintenanceRequest | null>(null);
  readonly messages = signal<MaintenanceMessage[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingMessages = signal(false);
  readonly isSending = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly firstUnreadMessageId = signal(0);
  readonly unreadCountFromHere = signal(0);
  readonly newMessagesCount = signal(0);
  readonly pollingNewFromId = signal(0);
  readonly scrollVersion = signal(0);
  readonly canSendMessage = computed(() => {
    const request = this.request();

    if (!request) {
      return false;
    }

    return ![MaintenanceStatus.COMPLETED, MaintenanceStatus.CLOSED].includes(request.status);
  });

  private currentUserId: number | null = null;
  private pollingSub: Subscription | null = null;
  private lastMessageId = 0;
  private conversationAtBottom = true;

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadRequest(id: number): void {
    this.resetState();
    this.isLoading.set(true);

    this.maintenanceService.getRequestById(id).subscribe({
      next: (request) => {
        this.request.set(request);
        this.currentUserId = request.tenant_id;
        this.isLoading.set(false);
        this.loadMessages(id);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  setConversationAtBottom(isAtBottom: boolean): void {
    this.conversationAtBottom = isAtBottom;

    if (isAtBottom) {
      this.clearNewMessageMarkers();
    }
  }

  scrollToNewMessages(): void {
    this.clearNewMessageMarkers();
    this.requestScroll();
  }

  addFiles(files: File[]): void {
    const remaining = 3 - this.selectedFiles().length;

    if (remaining <= 0) {
      return;
    }

    this.selectedFiles.update((current) => [...current, ...files.slice(0, remaining)]);
  }

  removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  sendMessage(message: string): void {
    const request = this.request();
    const normalizedMessage = message.trim();

    if (!request || !normalizedMessage) {
      return;
    }

    this.isSending.set(true);

    const send = (fileUrls: string[]) => {
      this.maintenanceService
        .sendMessage(request.id, {
          message: normalizedMessage,
          ...(fileUrls.length > 0 && { files: fileUrls }),
        })
        .subscribe({
          next: (createdMessage) => {
            this.messages.update((messages) => [...messages, createdMessage]);
            this.lastMessageId = createdMessage.id;
            this.selectedFiles.set([]);
            this.isSending.set(false);
            this.requestScroll();
            this.markMessagesRead(this.messages(), request.id);
          },
          error: () => {
            this.isSending.set(false);
          },
        });
    };

    if (this.selectedFiles().length > 0) {
      this.maintenanceService.uploadFiles(request.id, this.selectedFiles()).subscribe({
        next: (attachments) => send(attachments.map((attachment) => attachment.file_url)),
        error: () => {
          this.isSending.set(false);
        },
      });
      return;
    }

    send([]);
  }

  isMyMessage(message: MaintenanceMessage): boolean {
    return message.user_id === this.currentUserId;
  }

  isFirstUnread(message: MaintenanceMessage): boolean {
    return this.firstUnreadMessageId() > 0 && message.id === this.firstUnreadMessageId();
  }

  isFirstPollingNew(message: MaintenanceMessage): boolean {
    return this.pollingNewFromId() > 0 && message.id === this.pollingNewFromId();
  }

  private resetState(): void {
    this.stopPolling();
    this.request.set(null);
    this.messages.set([]);
    this.selectedFiles.set([]);
    this.firstUnreadMessageId.set(0);
    this.unreadCountFromHere.set(0);
    this.newMessagesCount.set(0);
    this.pollingNewFromId.set(0);
    this.lastMessageId = 0;
    this.conversationAtBottom = true;
  }

  private loadMessages(requestId: number): void {
    const lastReadId = this.getLastReadId(requestId);

    this.isLoadingMessages.set(true);
    this.messages.set([]);

    this.maintenanceService.getMessages(requestId).subscribe({
      next: (messages) => {
        this.computeUnread(messages, lastReadId);
        this.lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : 0;
        this.messages.set(messages);
        this.isLoadingMessages.set(false);
        this.requestScroll();
        this.markMessagesRead(messages, requestId);
        this.startPolling(requestId);
      },
      error: () => {
        this.isLoadingMessages.set(false);
      },
    });
  }

  private startPolling(requestId: number): void {
    this.stopPolling();

    this.pollingSub = interval(5000).subscribe(() => {
      if (document.hidden) {
        return;
      }

      this.maintenanceService.getMessages(requestId).subscribe({
        next: (messages) => this.applyPolledMessages(messages, requestId),
        error: () => undefined,
      });
    });
  }

  private applyPolledMessages(messages: MaintenanceMessage[], requestId: number): void {
    const newLastId = messages.length > 0 ? messages[messages.length - 1].id : 0;

    if (newLastId === this.lastMessageId) {
      return;
    }

    const oldLastId = this.lastMessageId;
    const incoming = messages.length - this.messages().length;
    this.lastMessageId = newLastId;
    const firstNew = messages.find((message) => message.id > oldLastId);

    if (firstNew) {
      this.pollingNewFromId.set(firstNew.id);
    }

    this.messages.set(messages);

    if (this.conversationAtBottom) {
      this.requestScroll();
      this.clearNewMessageMarkers();
      this.markMessagesRead(messages, requestId);
      return;
    }

    this.newMessagesCount.update((count) => count + (incoming > 0 ? incoming : 1));
  }

  private stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }

  private requestScroll(): void {
    this.scrollVersion.update((version) => version + 1);
  }

  private clearNewMessageMarkers(): void {
    this.newMessagesCount.set(0);
    this.pollingNewFromId.set(0);
  }

  private getLastReadId(requestId: number): number {
    return parseInt(localStorage.getItem(`mnt_lastread_${requestId}`) ?? '0', 10);
  }

  private computeUnread(messages: MaintenanceMessage[], lastReadId: number): void {
    if (lastReadId === 0) {
      this.firstUnreadMessageId.set(0);
      this.unreadCountFromHere.set(0);
      return;
    }

    const unread = messages.filter(
      (message) => !this.isMyMessage(message) && message.id > lastReadId,
    );

    this.unreadCountFromHere.set(unread.length);
    this.firstUnreadMessageId.set(unread.length > 0 ? unread[0].id : 0);
  }

  private markMessagesRead(messages: MaintenanceMessage[], requestId: number): void {
    if (messages.length > 0) {
      const lastId = Math.max(...messages.map((message) => message.id));
      localStorage.setItem(`mnt_lastread_${requestId}`, String(lastId));
    }

    const adminCount = messages.filter((message) => !this.isMyMessage(message)).length;
    localStorage.setItem(`mnt_read_${requestId}`, String(adminCount));
  }
}
