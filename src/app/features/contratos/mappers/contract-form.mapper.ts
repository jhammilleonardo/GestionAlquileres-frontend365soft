import {
  Contract,
  CreateContractDTO,
  UpdateContractDTO,
} from '../../../core/models/contract.model';
import { ContractCreateFormValue, ContractEditFormValue } from '../models/contract-form.model';

export function formatContractDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hasValidContractDateRange(
  startDate: Date | string | null,
  endDate: Date | string | null,
): boolean {
  if (!startDate || !endDate) return false;
  return new Date(endDate).getTime() > new Date(startDate).getTime();
}

export function toCreateContractDto(formData: ContractCreateFormValue): CreateContractDTO {
  return {
    tenant_id: formData.tenant_id!,
    property_id: formData.property_id!,
    start_date: formatContractDate(formData.start_date),
    end_date: formatContractDate(formData.end_date),
    key_delivery_date: formData.key_delivery_date
      ? formatContractDate(formData.key_delivery_date)
      : undefined,
    monthly_rent: parseFloat(formData.monthly_rent),
    payment_day: formData.payment_day ? parseInt(formData.payment_day) : 5,
    payment_method: formData.payment_method || undefined,
    included_services: formData.included_services || [],
    late_fee_percentage: formData.late_fee_percentage
      ? parseFloat(formData.late_fee_percentage)
      : undefined,
    grace_days: formData.grace_days ? parseInt(formData.grace_days) : undefined,
  };
}

export function toUpdateContractDto(formData: ContractEditFormValue): UpdateContractDTO {
  return {
    start_date: formData.start_date ? formatContractDate(formData.start_date) : undefined,
    end_date: formData.end_date ? formatContractDate(formData.end_date) : undefined,
    key_delivery_date: formData.key_delivery_date
      ? formatContractDate(formData.key_delivery_date)
      : undefined,
    monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : undefined,
    payment_day: formData.payment_day ? parseInt(formData.payment_day) : undefined,
    payment_method: formData.payment_method || undefined,
    late_fee_percentage: formData.late_fee_percentage
      ? parseFloat(formData.late_fee_percentage)
      : undefined,
    grace_days: formData.grace_days ? parseInt(formData.grace_days) : undefined,
    included_services: formData.included_services ?? [],
    tenant_responsibilities: formData.tenant_responsibilities || undefined,
    owner_responsibilities: formData.owner_responsibilities || undefined,
    prohibitions: formData.prohibitions || undefined,
    coexistence_rules: formData.coexistence_rules || undefined,
    renewal_terms: formData.renewal_terms || undefined,
    termination_terms: formData.termination_terms || undefined,
    auto_renew: formData.auto_renew ?? undefined,
    renewal_notice_days: formData.renewal_notice_days
      ? parseInt(formData.renewal_notice_days)
      : undefined,
    auto_increase_percentage: formData.auto_increase_percentage
      ? parseFloat(formData.auto_increase_percentage)
      : undefined,
    jurisdiction: formData.jurisdiction || undefined,
    bank_name: formData.bank_name || undefined,
    bank_account_type: formData.bank_account_type || undefined,
    bank_account_number: formData.bank_account_number || undefined,
    bank_account_holder: formData.bank_account_holder || undefined,
  };
}

export function toContractEditFormValue(contract: Contract): Partial<ContractEditFormValue> {
  return {
    start_date: contract.start_date ? new Date(contract.start_date) : null,
    end_date: contract.end_date ? new Date(contract.end_date) : null,
    key_delivery_date: contract.key_delivery_date ? new Date(contract.key_delivery_date) : null,
    monthly_rent: valueToInput(contract.monthly_rent),
    payment_day: valueToInput(contract.payment_day),
    payment_method: contract.payment_method ?? null,
    late_fee_percentage: valueToInput(contract.late_fee_percentage),
    grace_days: valueToInput(contract.grace_days),
    tenant_responsibilities: contract.tenant_responsibilities ?? null,
    owner_responsibilities: contract.owner_responsibilities ?? null,
    prohibitions: contract.prohibitions ?? null,
    coexistence_rules: contract.coexistence_rules ?? null,
    renewal_terms: contract.renewal_terms ?? null,
    termination_terms: contract.termination_terms ?? null,
    auto_renew: contract.auto_renew ?? false,
    renewal_notice_days: valueToInput(contract.renewal_notice_days),
    auto_increase_percentage: valueToInput(contract.auto_increase_percentage),
    jurisdiction: contract.jurisdiction ?? null,
    bank_name: contract.bank_name ?? null,
    bank_account_type: contract.bank_account_type ?? null,
    bank_account_number: contract.bank_account_number ?? null,
    bank_account_holder: contract.bank_account_holder ?? null,
    included_services: contract.included_services || [],
  };
}

function valueToInput(value: number | string | undefined): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}
