import { Contract, ContractStatus } from '../../../core/models/contract.model';
import { describe, expect, it } from 'vitest';
import {
  formatContractDate,
  hasValidContractDateRange,
  toContractEditFormValue,
  toCreateContractDto,
  toUpdateContractDto,
} from './contract-form.mapper';

describe('contract form mapper', () => {
  it('formats Date and string values as yyyy-mm-dd', () => {
    expect(formatContractDate(new Date(2026, 4, 9))).toBe('2026-05-09');
    expect(formatContractDate('2026-05-09T10:30:00.000Z')).toBe('2026-05-09');
  });

  it('validates strict date ranges', () => {
    expect(hasValidContractDateRange('2026-01-01', '2026-01-02')).toBe(true);
    expect(hasValidContractDateRange('2026-01-02', '2026-01-02')).toBe(false);
    expect(hasValidContractDateRange(null, '2026-01-02')).toBe(false);
  });

  it('maps create form values to the backend DTO', () => {
    expect(
      toCreateContractDto({
        tenant_id: 12,
        property_id: 22,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        key_delivery_date: null,
        monthly_rent: '1400.50',
        payment_day: '',
        payment_method: '',
        included_services: ['Agua'],
        late_fee_percentage: '5',
        grace_days: '3',
      }),
    ).toEqual({
      tenant_id: 12,
      property_id: 22,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      key_delivery_date: undefined,
      monthly_rent: 1400.5,
      payment_day: 5,
      payment_method: undefined,
      included_services: ['Agua'],
      late_fee_percentage: 5,
      grace_days: 3,
    });
  });

  it('maps edit form values to sparse update DTOs', () => {
    expect(
      toUpdateContractDto({
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        key_delivery_date: '',
        monthly_rent: '1200',
        payment_day: '10',
        payment_method: 'bank',
        late_fee_percentage: '',
        grace_days: '2',
        included_services: null,
        tenant_responsibilities: '',
        owner_responsibilities: 'Repairs',
        prohibitions: null,
        coexistence_rules: null,
        renewal_terms: null,
        termination_terms: null,
        auto_renew: false,
        renewal_notice_days: '30',
        auto_increase_percentage: '',
        jurisdiction: 'La Paz',
        bank_name: '',
        bank_account_type: 'checking',
        bank_account_number: '123',
        bank_account_holder: 'Owner',
      }),
    ).toEqual({
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      key_delivery_date: undefined,
      monthly_rent: 1200,
      payment_day: 10,
      payment_method: 'bank',
      late_fee_percentage: undefined,
      grace_days: 2,
      included_services: [],
      tenant_responsibilities: undefined,
      owner_responsibilities: 'Repairs',
      prohibitions: undefined,
      coexistence_rules: undefined,
      renewal_terms: undefined,
      termination_terms: undefined,
      auto_renew: false,
      renewal_notice_days: 30,
      auto_increase_percentage: undefined,
      jurisdiction: 'La Paz',
      bank_name: undefined,
      bank_account_type: 'checking',
      bank_account_number: '123',
      bank_account_holder: 'Owner',
    });
  });

  it('maps a contract to edit form values', () => {
    const contract: Contract = {
      id: 1,
      contract_number: 'C-1',
      status: ContractStatus.BORRADOR,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      monthly_rent: 900,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      included_services: ['Internet'],
      auto_renew: true,
    };

    expect(toContractEditFormValue(contract)).toEqual(
      expect.objectContaining({
        monthly_rent: '900',
        included_services: ['Internet'],
        auto_renew: true,
      }),
    );
  });
});
