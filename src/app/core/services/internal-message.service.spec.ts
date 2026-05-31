import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { InternalMessageService } from './internal-message.service';
import { ApiClientService } from '../http/api-client.service';
import { SlugService } from './slug.service';

describe('InternalMessageService', () => {
  let service: InternalMessageService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of([]));
    post = vi.fn().mockReturnValue(of({ id: 1 }));
    TestBed.configureTestingModule({
      providers: [
        InternalMessageService,
        { provide: ApiClientService, useValue: { get, post } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(InternalMessageService);
  });

  it('getThreads pide la bandeja', () => {
    service.getThreads().subscribe();
    expect(get).toHaveBeenCalledWith('acme/messages/threads');
  });

  it('getThread pide la conversación con un usuario', () => {
    service.getThread(5).subscribe();
    expect(get).toHaveBeenCalledWith('acme/messages/thread/5', { params: {} });
  });

  it('getThread admite paginación por cursor (limit y before)', () => {
    service.getThread(5, { limit: 30, before: 99 }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/messages/thread/5', {
      params: { limit: 30, before: 99 },
    });
  });

  it('send envía un mensaje con recipient y body', () => {
    service.send(5, 'Hola').subscribe();
    expect(post).toHaveBeenCalledWith('acme/messages', { recipient_id: 5, body: 'Hola' });
  });

  it('broadcast envía a todos', () => {
    post.mockReturnValue(of({ count: 3 }));
    service.broadcast('Aviso').subscribe();
    expect(post).toHaveBeenCalledWith('acme/messages/broadcast', { body: 'Aviso' });
  });

  it('refreshUnread actualiza la signal de no leídos', () => {
    get.mockReturnValue(of({ count: 7 }));
    service.refreshUnread().subscribe();
    expect(get).toHaveBeenCalledWith('acme/messages/unread-count');
    expect(service.unread()).toBe(7);
  });
});
