// ==================== APPLICATION MODELS ====================
// Modelos basados en la documentación del API de solicitudes

export enum ApplicationStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

// ==================== PERSONAL DATA ====================
export interface PersonalData {
  full_name: string;
  phone: string;
  email?: string; // Opcional cuando el usuario ya está autenticado
  birth_date: string; // YYYY-MM-DD
  national_id: string; // También conocido como identity_document en el backend
  current_address?: string; // Dirección actual (opcional)
  marital_status: MaritalStatus;
  number_of_dependents: number;
}

export enum MaritalStatus {
  SOLTERO = 'soltero',
  CASADO = 'casado',
  DIVORCIADO = 'divorciado',
  VIUDO = 'viudo',
  UNION_LIBRE = 'union_libre',
}

// ==================== EMPLOYMENT DATA ====================
export interface EmploymentData {
  current_job: CurrentJob;
  previous_job?: PreviousJob;
}

export interface CurrentJob {
  company: string;
  position: string;
  salary: number;
  currency: string;
  start_date: string; // YYYY-MM-DD
  employment_type: EmploymentType;
  supervisor_name: string;
  supervisor_phone: string;
}

export enum EmploymentType {
  TIEMPO_COMPLETO = 'tiempo_completo',
  MEDIO_TIEMPO = 'medio_tiempo',
  FREELANCE = 'freelance',
  AUTONOMO = 'autonomo',
  EMPRESARIO = 'empresario',
}

export interface PreviousJob {
  company: string;
  position: string;
  salary?: number;
  end_date?: string; // YYYY-MM-DD
}

// ==================== RENTAL HISTORY ====================
export interface RentalHistory {
  property_address: string;
  landlord_name: string;
  landlord_phone: string;
  monthly_rent: number;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  reason_for_leaving?: string;
}

// ==================== REFERENCES ====================
export interface References {
  personal: PersonalReference[];
  professional: ProfessionalReference[];
}

export interface PersonalReference {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface ProfessionalReference {
  name: string;
  company: string;
  position: string;
  phone: string;
  email?: string;
}

// ==================== DOCUMENTS ====================
export interface ApplicationDocument {
  type: DocumentType;
  url: string;
  uploaded_date?: string; // YYYY-MM-DD
}

export interface ApplicationReference {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  company?: string;
  position?: string;
}

export interface ApplicationBackendDocument {
  id?: number;
  type?: string;
  url?: string;
  file_url?: string;
  file_name?: string;
  uploaded_date?: string;
}

export enum DocumentType {
  CEDULA_IDENTIDAD = 'cedula_identidad',
  COMPROBANTE_INGRESOS = 'comprobante_ingresos',
  CARTA_RECOMENDACION = 'carta_recomendacion',
  CONTRATO_ANTERIOR = 'contrato_anterior',
  OTRO = 'otro',
}

// ==================== MAIN APPLICATION ====================
// NOTA: Esta interfaz debe coincidir con lo que realmente devuelve el backend
// El backend usa una estructura diferente a la documentación oficial
export interface Application {
  id: number;
  property_id: number;
  applicant_id: number;
  status: ApplicationStatus;
  personal_data: {
    phone: string;
    full_name: string;
    current_address: string;
    identity_document: string;
  };
  employment_data: {
    position: string;
    employer_name: string;
    employer_phone: string;
    monthly_income: number;
    employment_duration: string;
  };
  rental_history: Array<{
    previous_address: string;
    reason_for_leaving: string;
    previous_rent_amount: number;
    previous_landlord_name: string;
    previous_landlord_phone: string;
  }>;
  references: ApplicationReference[];
  documents: ApplicationBackendDocument[];
  additional_notes: string | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  property_title: string;
  applicant_name: string;
  applicant_email: string;
}

// ==================== CREATE APPLICATION DTO ====================
export interface CreateApplicationDto {
  property_id: number;
  personal_data: PersonalData;
  employment_data: EmploymentData;
  rental_history: RentalHistory[];
  references: References;
  documents?: ApplicationDocument[];
  additional_notes?: string;
}

// ==================== APPROVE APPLICATION DTO ====================
export interface ApproveApplicationDto {
  admin_feedback?: string;
  monthly_rent: number;
  deposit_amount?: number;
  currency?: string;
  payment_day?: number;
  payment_method?: string;
  late_fee_percentage?: number;
  grace_days?: number;
  included_services?: string[];
  start_date?: string;
  end_date?: string;
  key_delivery_date?: string;
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
  bank_account_number?: string;
  bank_account_type?: string;
  bank_name?: string;
  bank_account_holder?: string;
}

// ==================== CHANGE STATUS DTO ====================
export interface ChangeStatusDto {
  status: ApplicationStatus;
  admin_feedback?: string;
}

// ==================== APPLICATION LIST ITEM ====================
// NOTA: Esta interfaz debe coincidir con lo que realmente devuelve el backend
// El backend usa una estructura diferente a la documentación oficial
export interface ApplicationListItem {
  id: number;
  property_id: number;
  applicant_id: number;
  status: ApplicationStatus;
  personal_data: {
    phone: string;
    full_name: string;
    current_address: string;
    identity_document: string;
  };
  employment_data: {
    position: string;
    employer_name: string;
    employer_phone: string;
    monthly_income: number;
    employment_duration: string;
  };
  rental_history: Array<{
    previous_address: string;
    reason_for_leaving: string;
    previous_rent_amount: number;
    previous_landlord_name: string;
    previous_landlord_phone: string;
  }>;
  references: ApplicationReference[];
  documents: ApplicationBackendDocument[];
  additional_notes: string | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  property_title: string;
  applicant_name: string;
  applicant_email: string;
}

// ==================== APPROVE RESPONSE ====================
export interface ApproveApplicationResponse {
  message: string;
  application: {
    id: number;
    status: ApplicationStatus;
    property: string;
    applicant: string;
  };
  contract_generated: {
    id: number;
    number: string;
    status: string;
    monthly_rent: number;
    currency: string;
    deposit_amount: number;
    message: string;
  };
}

// ==================== FILTERS ====================
export interface ApplicationFilters {
  status?: ApplicationStatus;
  property_id?: number;
  applicant_id?: number;
}
