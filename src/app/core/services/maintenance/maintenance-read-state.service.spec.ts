import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, afterEach } from 'vitest';

import { MaintenanceReadStateService } from './maintenance-read-state.service';
import { MaintenanceMessage } from '../../models/maintenance-request.model';

describe('MaintenanceReadStateService', () => {
  let service: MaintenanceReadStateService;

  const messages = [createMessage(1, 10), createMessage(3, 20)];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintenanceReadStateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores admin last read id from latest message', () => {
    service.markAdminMessagesRead(7, messages);

    expect(service.getAdminLastReadId(7)).toBe(3);
  });

  it('stores tenant last read id and visible read count', () => {
    service.markTenantMessagesRead(9, messages, (message) => message.user_id === 10);

    expect(service.getTenantLastReadId(9)).toBe(3);
    expect(service.getTenantVisibleUnreadCount(9, 3)).toBe(2);
  });

  it('returns zero when storage has invalid data', () => {
    localStorage.setItem('mnt_lastread_1', 'invalid');

    expect(service.getTenantLastReadId(1)).toBe(0);
  });
});

function createMessage(id: number, userId: number): MaintenanceMessage {
  return {
    id,
    maintenance_request_id: 9,
    user_id: userId,
    message: 'Mensaje',
    send_to_resident: true,
    created_at: new Date(),
    attachments: [],
  };
}
