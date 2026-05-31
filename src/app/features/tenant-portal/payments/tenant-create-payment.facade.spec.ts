import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { TranslocoService } from '@jsverse/transloco';

import {
  Currency,
  Payment,
  PaymentMethod,
  PaymentProcessor,
  PaymentStatus,
  PaymentType,
} from '../../../core/models/payment.model';
import { Contract, ContractStatus } from '../../../core/services/tenant/tenant-contract.service';
import { TenantCreatePaymentFacade } from './tenant-create-payment.facade';

describe('TenantCreatePaymentFacade', () => {
  let facade: TenantCreatePaymentFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TenantCreatePaymentFacade,
        {
          provide: TranslocoService,
          useValue: {
            getActiveLang: () => 'es',
            translate: (key: string) => key,
          },
        },
      ],
    });

    facade = TestBed.inject(TenantCreatePaymentFacade);
  });

  it('normaliza metodos de pago conocidos y alias del tenant', () => {
    expect(facade.normalizePaymentMethod('TRANSFERENCIA_BANCARIA')).toBe(PaymentMethod.TRANSFER);
    expect(facade.normalizePaymentMethod('QR_ACCL')).toBe(PaymentMethod.QR_MC4);
    expect(facade.normalizePaymentMethod('efectivo')).toBe(PaymentMethod.CASH);
    expect(facade.normalizePaymentMethod('desconocido')).toBeNull();
  });

  it('prepara el patch inicial desde el contrato', () => {
    expect(
      facade.getContractPaymentPatch(
        makeContract({
          monthly_rent: 1500,
          currency: 'bob',
          payment_method: 'transferencia',
        }),
      ),
    ).toEqual({
      amount: 1500,
      currency: Currency.BOB,
      payment_method: PaymentMethod.TRANSFER,
    });
  });

  it('construye calendario marcando cuotas pagadas y futuras', () => {
    facade.buildPaymentSchedule(makeContract(), [
      makePayment({ id: 1, status: PaymentStatus.APPROVED }),
    ]);

    const schedule = facade.paymentSchedule();

    expect(schedule).toHaveLength(3);
    expect(schedule[0].status).toBe('paid');
    expect(schedule[1].status).toBe('upcoming');
    expect(schedule[2].status).toBe('upcoming');
    expect(facade.paidCount()).toBe(1);
  });

  it('cuenta pagos pendientes/procesando como cuotas en revision', () => {
    facade.buildPaymentSchedule(makeContract(), [
      makePayment({ id: 1, status: PaymentStatus.PENDING }),
      makePayment({ id: 2, status: PaymentStatus.PROCESSING }),
    ]);

    expect(facade.paymentSchedule().map((item) => item.status)).toEqual([
      'paid',
      'paid',
      'upcoming',
    ]);
  });
});

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 1,
    tenant_id: 1,
    property_id: 1,
    contract_number: 'C-001',
    start_date: new Date(2099, 0, 1),
    end_date: new Date(2099, 2, 31),
    monthly_rent: 1200,
    currency: Currency.BOB,
    payment_day: 5,
    status: ContractStatus.ACTIVO,
    is_signed: true,
    created_at: new Date(2099, 0, 1),
    updated_at: new Date(2099, 0, 1),
    ...overrides,
  };
}

function makePayment(overrides: { id: number; status: PaymentStatus }): Payment {
  return {
    id: overrides.id,
    tenant_id: 1,
    contract_id: 1,
    property_id: 1,
    amount: 1200,
    currency: Currency.BOB,
    payment_type: PaymentType.RENT,
    payment_method: PaymentMethod.TRANSFER,
    status: overrides.status,
    payment_date: new Date(2099, 0, 5),
    payment_processor: PaymentProcessor.MANUAL,
    is_partial_payment: false,
    is_recurring: false,
    is_autopay: false,
    created_at: new Date(2099, 0, 5),
    updated_at: new Date(2099, 0, 5),
  };
}
