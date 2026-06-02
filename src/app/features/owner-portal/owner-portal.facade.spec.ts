import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  OwnerPortalRecord,
  OwnerPortalService,
} from '../../core/services/owner/owner-portal.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { OwnerPortalFacade } from './owner-portal.facade';

describe('OwnerPortalFacade', () => {
  let ownerPortal: {
    getDashboard: ReturnType<typeof vi.fn>;
    getProperties: ReturnType<typeof vi.fn>;
    getStatements: ReturnType<typeof vi.fn>;
    getMaintenance: ReturnType<typeof vi.fn>;
    getContracts: ReturnType<typeof vi.fn>;
    authorizeMaintenance: ReturnType<typeof vi.fn>;
    downloadStatementPdf: ReturnType<typeof vi.fn>;
    downloadContractPdf: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: OwnerPortalFacade;

  beforeEach(() => {
    ownerPortal = {
      getDashboard: vi.fn().mockReturnValue(of({ properties_count: 1 })),
      getProperties: vi.fn().mockReturnValue(of([record({ id: 1, title: 'Casa' })])),
      getStatements: vi.fn().mockReturnValue(of([record({ id: 2, net_amount: 100 })])),
      getMaintenance: vi.fn().mockReturnValue(of([record({ id: 3, current_stage: 'SCHEDULED' })])),
      getContracts: vi.fn().mockReturnValue(of([record({ id: 4, pdf_url: '/storage/test.pdf' })])),
      authorizeMaintenance: vi.fn().mockReturnValue(of({ message: 'ok' })),
      downloadStatementPdf: vi.fn().mockReturnValue(of(new Blob(['pdf']))),
      downloadContractPdf: vi.fn().mockReturnValue(of(new Blob(['pdf']))),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        OwnerPortalFacade,
        { provide: OwnerPortalService, useValue: ownerPortal },
        { provide: ToastService, useValue: toast },
      ],
    });

    facade = TestBed.inject(OwnerPortalFacade);
  });

  it('loads dashboard and all owner sections', () => {
    facade.load();

    expect(facade.isLoading()).toBe(false);
    expect(facade.dashboard().properties_count).toBe(1);
    expect(facade.properties()).toHaveLength(1);
    expect(facade.statements()).toHaveLength(1);
    expect(facade.maintenance()).toHaveLength(1);
    expect(facade.contracts()).toHaveLength(1);
  });

  it('resolves active count by selected tab', () => {
    facade.load();

    facade.activeTab.set('maintenance');

    expect(facade.activeCount()).toBe(1);
    expect(facade.canAuthorize(record({ current_stage: 'SCHEDULED' }))).toBe(true);
    expect(facade.stageIndex(record({ current_stage: 'SCHEDULED' }))).toBe(2);
  });

  it('authorizes maintenance and reloads data', () => {
    facade.authorize(record({ id: 99, current_stage: 'SCHEDULED' }));

    expect(ownerPortal.authorizeMaintenance).toHaveBeenCalledWith(99);
    expect(toast.success).toHaveBeenCalledWith('Gasto autorizado');
    expect(facade.authorizingId()).toBeNull();
    expect(ownerPortal.getDashboard).toHaveBeenCalled();
  });

  it('shows authorization errors', () => {
    ownerPortal.authorizeMaintenance.mockReturnValue(throwError(() => new Error('fail')));

    facade.authorize(record({ id: 99 }));

    expect(toast.error).toHaveBeenCalledWith('fail');
    expect(facade.authorizingId()).toBeNull();
  });
});

function record(overrides: Partial<OwnerPortalRecord>): OwnerPortalRecord {
  return { id: 1, ...overrides };
}
