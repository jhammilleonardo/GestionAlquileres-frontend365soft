import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SlugService } from '../slug.service';
import { TenantAuthService } from './tenant-auth.service';
import { TenantNotification, TenantNotificationService } from './tenant-notification.service';

describe('TenantNotificationService', () => {
  let service: TenantNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TenantNotificationService,
        { provide: HttpClient, useValue: {} },
        { provide: TenantAuthService, useValue: { getToken: () => 'tenant-token' } },
        { provide: SlugService, useValue: { getSlug: () => 'demo' } },
        {
          provide: TranslocoService,
          useValue: {
            translate: vi.fn((key: string, params?: Record<string, string>) => {
              const dictionary: Record<string, string> = {
                'public.tenantNotifications.messages.applicationStatusChangedTitle':
                  'Application update',
                'public.tenantNotifications.messages.applicationStatusChangedMessage': `Your application for ${params?.['property']} changed to: ${params?.['status']}.`,
                'public.tenantNotifications.status.APROBADA': 'Approved',
              };
              return dictionary[key] ?? key;
            }),
          },
        },
      ],
    });

    service = TestBed.inject(TenantNotificationService);
  });

  it('traduce notificaciones de solicitud aunque el mensaje guardado venga en español', () => {
    const notification: TenantNotification = {
      id: 1,
      user_id: 5,
      event_type: 'application.status.changed',
      title: 'Actualización de tu solicitud',
      message: 'Tu solicitud para la propiedad Casa Norte ha cambiado a: APROBADA',
      metadata: { status: 'APROBADA' },
      is_read: false,
      created_at: new Date(),
    };

    expect(service.getDisplayTitle(notification)).toBe('Application update');
    expect(service.getDisplayMessage(notification)).toBe(
      'Your application for Casa Norte changed to: Approved.',
    );
  });
});
