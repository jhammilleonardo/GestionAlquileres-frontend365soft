import { Injectable } from '@angular/core';

import { MaintenanceMessage } from '../../models/maintenance-request.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceReadStateService {
  getAdminLastReadId(requestId: number): number {
    return this.readNumber(`admin_mnt_lastread_${requestId}`);
  }

  markAdminMessagesRead(requestId: number, messages: readonly MaintenanceMessage[]): void {
    const lastId = this.getLastMessageId(messages);

    if (lastId > 0) {
      this.writeNumber(`admin_mnt_lastread_${requestId}`, lastId);
    }
  }

  getTenantLastReadId(requestId: number): number {
    return this.readNumber(`mnt_lastread_${requestId}`);
  }

  getTenantVisibleUnreadCount(requestId: number, totalVisible: number): number {
    const read = this.readNumber(`mnt_read_${requestId}`);

    return Math.max(0, totalVisible - read);
  }

  markTenantMessagesRead(
    requestId: number,
    messages: readonly MaintenanceMessage[],
    isMyMessage: (message: MaintenanceMessage) => boolean,
  ): void {
    const lastId = this.getLastMessageId(messages);

    if (lastId > 0) {
      this.writeNumber(`mnt_lastread_${requestId}`, lastId);
    }

    const visibleForTenant = messages.filter((message) => !isMyMessage(message)).length;
    this.writeNumber(`mnt_read_${requestId}`, visibleForTenant);
  }

  private getLastMessageId(messages: readonly MaintenanceMessage[]): number {
    return messages.length > 0 ? Math.max(...messages.map((message) => message.id)) : 0;
  }

  private readNumber(key: string): number {
    try {
      const value = localStorage.getItem(key);
      const parsed = Number.parseInt(value ?? '0', 10);

      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }

  private writeNumber(key: string, value: number): void {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* ignore storage errors */
    }
  }
}
