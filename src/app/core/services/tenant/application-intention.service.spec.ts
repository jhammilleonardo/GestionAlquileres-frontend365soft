import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { SlugService } from '../slug.service';
import { ApplicationIntentionService } from './application-intention.service';

describe('ApplicationIntentionService', () => {
  let service: ApplicationIntentionService;
  let navigate: ReturnType<typeof vi.fn>;
  let navigateTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    navigate = vi.fn().mockResolvedValue(true);
    navigateTo = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ApplicationIntentionService,
        { provide: Router, useValue: { navigate } },
        { provide: SlugService, useValue: { navigateTo } },
      ],
    });

    service = TestBed.inject(ApplicationIntentionService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('guarda y expone una intención de aplicación', () => {
    service.setIntention(15, 'Casa Norte');

    expect(service.hasIntention()).toBe(true);
    expect(service.getIntention()).toEqual({ propertyId: 15, propertyTitle: 'Casa Norte' });
  });

  it('redirige al login real del tenant, no a /portal/login', () => {
    service.navigateToLoginWithIntention('demo', 15, 'Casa Norte');

    expect(navigate).toHaveBeenCalledWith(['/', 'demo', 'login'], {
      queryParams: { application: 'true' },
    });
    expect(service.getIntention()).toEqual({ propertyId: 15, propertyTitle: 'Casa Norte' });
  });

  it('redirige al wizard cuando existe intención guardada', () => {
    service.setIntention(15, 'Casa Norte');

    service.navigateToApplication('demo');

    expect(navigateTo).toHaveBeenCalledWith(['portal', 'application-wizard', '15']);
  });

  it('limpia intención expirada al iniciar', () => {
    const expired = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      'application_intention',
      JSON.stringify({ propertyId: 15, propertyTitle: 'Casa Norte', timestamp: expired }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ApplicationIntentionService,
        { provide: Router, useValue: { navigate } },
        { provide: SlugService, useValue: { navigateTo } },
      ],
    });

    const restored = TestBed.inject(ApplicationIntentionService);

    expect(restored.getIntention()).toBeNull();
    expect(localStorage.getItem('application_intention')).toBeNull();
  });
});
