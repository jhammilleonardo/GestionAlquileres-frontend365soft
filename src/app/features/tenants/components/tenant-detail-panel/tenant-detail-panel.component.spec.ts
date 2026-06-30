import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { FormatService } from '../../../../core/services/format.service';
import { TenantDetailPanelComponent } from './tenant-detail-panel.component';
import { AdminTenantUser, TenantLedger } from '../../../../core/models/tenant-user.model';

const tenant = { id: 5, name: 'Ana', email: 'a@b.com', lease_status: 'active' } as AdminTenantUser;

const ledger: TenantLedger = {
  tenant_id: 5,
  currency: 'BOB',
  summary: { total_charged: 433.33, total_paid: 100, balance_due: 333.33, pending_count: 1 },
  lines: [
    {
      id: 1,
      date: '2026-01-05',
      due_date: '2026-01-05',
      payment_type: 'RENT',
      payment_method: 'transfer',
      status: 'APPROVED',
      amount: 100,
      reference_number: 'A-1',
      contract_number: 'C-1',
      running_balance: 0,
    },
    {
      id: 2,
      date: '2026-02-05',
      due_date: '2026-02-05',
      payment_type: 'RENT',
      payment_method: 'cash',
      status: 'PENDING',
      amount: 333.33,
      reference_number: null,
      contract_number: 'C-1',
      running_balance: 333.33,
    },
  ],
};

describe('TenantDetailPanelComponent', () => {
  function build() {
    TestBed.configureTestingModule({
      imports: [TenantDetailPanelComponent],
      providers: [
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
        { provide: FormatService, useValue: { formatCurrency: (v: number) => `$${v}` } },
      ],
    }).overrideComponent(TenantDetailPanelComponent, { set: { template: '' } });
    return TestBed.createComponent(TenantDetailPanelComponent);
  }

  it('mapea las líneas del ledger a la forma de la tabla compartida', () => {
    const fixture = build();
    fixture.componentRef.setInput('tenant', tenant);
    fixture.componentRef.setInput('ledger', ledger);
    fixture.detectChanges();

    const lines = fixture.componentInstance.ledgerLines();
    expect(lines).toHaveLength(2);
    // El pago aprobado usa su número de referencia y tono de éxito.
    expect(lines[0].concept).toBe('RENT');
    expect(lines[0].reference).toBe('A-1');
    expect(lines[0].status?.tone).toBe('success');
    // El pendiente cae al método como referencia y tono de advertencia.
    expect(lines[1].reference).toBe('cash');
    expect(lines[1].status?.tone).toBe('warning');
    expect(lines[1].balance).toBe(333.33);
  });

  it('expone el tono correcto del estado de mantenimiento', () => {
    const fixture = build();
    fixture.componentRef.setInput('tenant', tenant);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      maintenanceTone(s: string): string;
    };
    expect(component.maintenanceTone('COMPLETED')).toBe('success');
    expect(component.maintenanceTone('IN_PROGRESS')).toBe('warning');
    expect(component.maintenanceTone('DESCONOCIDO')).toBe('neutral');
  });
});
