export interface ContractCreateFormValue {
  tenant_id: number | null;
  property_id: number | null;
  start_date: Date | string;
  end_date: Date | string;
  key_delivery_date: Date | string | null;
  monthly_rent: string;
  payment_day: string | null;
  payment_method: string | null;
  included_services: string[] | null;
  late_fee_percentage: string | null;
  grace_days: string | null;
}

export interface ContractEditFormValue {
  start_date: Date | string | null;
  end_date: Date | string | null;
  key_delivery_date: Date | string | null;
  monthly_rent: string | null;
  payment_day: string | null;
  payment_method: string | null;
  late_fee_percentage: string | null;
  grace_days: string | null;
  included_services: string[] | null;
  tenant_responsibilities: string | null;
  owner_responsibilities: string | null;
  prohibitions: string | null;
  coexistence_rules: string | null;
  renewal_terms: string | null;
  termination_terms: string | null;
  auto_renew: boolean | null;
  renewal_notice_days: string | null;
  auto_increase_percentage: string | null;
  jurisdiction: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
}
