/**
 * Modelos de datos para el sistema de contratos
 * Coincide con la API del backend
 */

/**
 * Estados posibles de un contrato
 */
export enum ContractStatus {
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  FIRMADO = 'FIRMADO',
  ACTIVO = 'ACTIVO',
  POR_VENCER = 'POR_VENCER',
  VENCIDO = 'VENCIDO',
  RENOVADO = 'RENOVADO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
  SUSPENDIDO = 'SUSPENDIDO',
}

/**
 * Labels para mostrar en la UI
 */
export const ContractStatusLabels: Record<ContractStatus, string> = {
  [ContractStatus.BORRADOR]: 'Borrador',
  [ContractStatus.PENDIENTE]: 'Pendiente',
  [ContractStatus.FIRMADO]: 'Firmado',
  [ContractStatus.ACTIVO]: 'Activo',
  [ContractStatus.POR_VENCER]: 'Por vencer',
  [ContractStatus.VENCIDO]: 'Vencido',
  [ContractStatus.RENOVADO]: 'Renovado',
  [ContractStatus.FINALIZADO]: 'Finalizado',
  [ContractStatus.CANCELADO]: 'Cancelado',
  [ContractStatus.SUSPENDIDO]: 'Suspendido',
};

/**
 * Clases CSS para badges de estado
 */
export const ContractStatusClasses: Record<ContractStatus, string> = {
  [ContractStatus.BORRADOR]: 'status-borrador',
  [ContractStatus.PENDIENTE]: 'status-pendiente',
  [ContractStatus.FIRMADO]: 'status-firmado',
  [ContractStatus.ACTIVO]: 'status-activo',
  [ContractStatus.POR_VENCER]: 'status-por_vencer',
  [ContractStatus.VENCIDO]: 'status-vencido',
  [ContractStatus.RENOVADO]: 'status-renovado',
  [ContractStatus.FINALIZADO]: 'status-finalizado',
  [ContractStatus.CANCELADO]: 'status-cancelado',
  [ContractStatus.SUSPENDIDO]: 'status-suspendido',
};

/**
 * Información del inquilino en un contrato
 */
export interface ContractTenant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  tenant_id: number;
}

/**
 * Información de la propiedad en un contrato
 */
export interface ContractProperty {
  id: number;
  title: string;
  addresses?: ContractAddress[];
  owners?: ContractOwner[];
}

/**
 * Dirección de una propiedad
 */
export interface ContractAddress {
  street_address: string;
  city: string;
  state?: string;
  country: string;
  zip_code?: string;
}

/**
 * Propietario de una propiedad
 */
export interface ContractOwner {
  name: string;
  primary_email: string;
  phone_number?: string;
}

/**
 * Contrato completo (respuesta del backend)
 */
export interface Contract {
  id: number;
  contract_number: string;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  key_delivery_date?: string;
  monthly_rent: number;
  currency?: string;
  payment_day?: number;
  deposit_amount?: number;
  payment_method?: string;
  late_fee_percentage?: number;
  grace_days?: number;
  included_services?: string[];
  tenant_responsibilities?: string;
  owner_responsibilities?: string;
  prohibitions?: string;
  coexistence_rules?: string;
  renewal_terms?: string;
  termination_terms?: string;
  special_clauses?: string[];
  jurisdiction?: string;
  pdf_url?: string;
  is_signed?: boolean;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  auto_increase_percentage?: number;
  previous_contract_id?: number;
  termination_reason?: string;
  applied_penalty?: number;
  returned_deposit?: number;
  terminated_by?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  bank_account_holder?: string;
  tenant_signature_date?: string;
  owner_signature_date?: string;
  signed_ip?: string;
  activation_date?: string;
  actual_termination_date?: string;
  duration_months?: number;
  created_at: string;
  updated_at: string;
  // Datos del inquilino (directos desde el backend)
  tenant_id?: number;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  // Datos de la propiedad (directos desde el backend)
  property_id?: number;
  property_title?: string;
  property_description?: string;
  property_status?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  // Objetos anidados (para compatibilidad)
  tenant?: ContractTenant;
  property?: ContractProperty;
}

/**
 * DTO para crear un contrato (mínimo requerido)
 */
export interface CreateContractDTO {
  tenant_id: number;
  property_id: number;
  start_date: string;
  end_date: string;
  key_delivery_date?: string;
  monthly_rent: number;
  currency?: string;
  payment_day?: number;
  deposit_amount?: number;
  payment_method?: string;
  late_fee_percentage?: number;
  grace_days?: number;
  included_services?: string[];
  tenant_responsibilities?: string;
  owner_responsibilities?: string;
  prohibitions?: string;
  coexistence_rules?: string;
  renewal_terms?: string;
  termination_terms?: string;
  jurisdiction?: string;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  auto_increase_percentage?: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  bank_account_holder?: string;
}

/**
 * DTO para actualizar un contrato (todos opcionales)
 */
export interface UpdateContractDTO {
  start_date?: string;
  end_date?: string;
  key_delivery_date?: string;
  monthly_rent?: number;
  currency?: string;
  payment_day?: number;
  deposit_amount?: number;
  payment_method?: string;
  late_fee_percentage?: number;
  grace_days?: number;
  included_services?: string[];
  tenant_responsibilities?: string;
  owner_responsibilities?: string;
  prohibitions?: string;
  coexistence_rules?: string;
  renewal_terms?: string;
  termination_terms?: string;
  jurisdiction?: string;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  auto_increase_percentage?: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  bank_account_holder?: string;
}

/**
 * DTO para cambiar estado de un contrato
 */
export interface UpdateContractStatusDTO {
  status: ContractStatus;
  reason?: string;
}

/**
 * Métricas del dashboard de contratos
 */
export interface ContractDashboard {
  total_contracts: number;
  active_contracts: number;
  draft_contracts: number;
  completed_contracts: number;
  monthly_revenue: number;
  avg_rent: number;
  contracts_expiring_soon: number;
  contracts_by_status: {
    BORRADOR: number;
    ACTIVO: number;
    FINALIZADO: number;
  };
  expiring_next_30_days?: ContractExpiring[];
}

/**
 * Contrato por vencer
 */
export interface ContractExpiring {
  id: number;
  contract_number: string;
  end_date: string;
  tenant: {
    name: string;
  };
  property: {
    title: string;
  };
}

/**
 * Filtros para listar contratos
 */
export interface ContractFilters {
  status?: ContractStatus;
  tenant_id?: number;
  property_id?: number;
}

/**
 * Respuesta de renovación de contrato
 */
export interface RenewContractResponse {
  id: number;
  contract_number: string;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
  tenant_id: number;
  property_id: number;
  renewed_from: number;
  tenant?: ContractTenant;
  property?: ContractProperty;
}

/**
 * Opciones de moneda
 */
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - Dólar estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'ARS', label: 'ARS - Peso argentino' },
];

/**
 * Opciones de servicios incluidos
 */
export const SERVICE_OPTIONS = [
  'Internet',
  'Cable TV',
  'Expensas',
  'Agua',
  'Luz',
  'Gas',
  'Aseo',
  'Seguridad',
];

/**
 * Opciones de tipo de cuenta bancaria
 */
export const BANK_ACCOUNT_TYPES = [
  { value: 'Ahorros', label: 'Cuenta de Ahorros' },
  { value: 'Corriente', label: 'Cuenta Corriente' },
  { value: 'Nómina', label: 'Cuenta de Nómina' },
];
