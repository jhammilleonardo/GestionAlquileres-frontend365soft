import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TenantUserService } from './tenant-user.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { TenantLedger, TenantMaintenanceItem } from '../../models/tenant-user.model';

describe('TenantUserService — detalle de inquilino', () => {
  let service: TenantUserService;
  let apiGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiGet = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        TenantUserService,
        { provide: ApiClientService, useValue: { get: apiGet } },
        { provide: SlugService, useValue: { getSlug: () => 'acme' } },
      ],
    });
    service = TestBed.inject(TenantUserService);
  });

  it('pide el rent ledger del inquilino al endpoint correcto', () => {
    const ledger: TenantLedger = {
      tenant_id: 5,
      currency: 'BOB',
      summary: { total_charged: 0, total_paid: 0, balance_due: 0, pending_count: 0 },
      lines: [],
    };
    apiGet.mockReturnValue(of(ledger));

    let result: TenantLedger | undefined;
    service.getTenantLedger(5).subscribe((r) => (result = r));

    expect(apiGet).toHaveBeenCalledWith('acme/users/tenants/5/ledger');
    expect(result).toEqual(ledger);
  });

  it('pide el historial de mantenimiento del inquilino', () => {
    const items: TenantMaintenanceItem[] = [];
    apiGet.mockReturnValue(of(items));

    service.getTenantMaintenance(5).subscribe();

    expect(apiGet).toHaveBeenCalledWith('acme/users/tenants/5/maintenance');
  });
});
