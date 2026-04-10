/**
 * Payment Models - Sincronizados con Backend
 * Sistema multi-moneda y multi-método (USA, Europa, Latinoamérica)
 */

// =====================================================
// ENUMS
// =====================================================

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  REVERSED = 'REVERSED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentMethod {
  // USA
  ACH = 'ACH',
  ECHECK = 'ECHECK',
  ZELLE = 'ZELLE',
  VENMO = 'VENMO',
  // Europa
  SEPA = 'SEPA',
  // Global
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  TRANSFER = 'TRANSFER',
  CASH = 'CASH',
  MONEY_ORDER = 'MONEY_ORDER',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
  // Bolivia QR
  QR_MC4 = 'QR_MC4',
}

export enum PaymentType {
  RENT = 'RENT',
  DEPOSIT = 'DEPOSIT',
  LATE_FEE = 'LATE_FEE',
  UTILITY = 'UTILITY',
  HOA_FEE = 'HOA_FEE',
  PET_FEE = 'PET_FEE',
  PARKING_FEE = 'PARKING_FEE',
  APPLICATION_FEE = 'APPLICATION_FEE',
  MAINTENANCE_FEE = 'MAINTENANCE_FEE',
  OTHER = 'OTHER',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  MXN = 'MXN',
  AUD = 'AUD',
  BRL = 'BRL',
  COP = 'COP',
  CLP = 'CLP',
  PEN = 'PEN',
  ARS = 'ARS',
  BOB = 'BOB',
}

export enum PaymentProcessor {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  AUTHORIZE_NET = 'authorize_net',
  PLAID = 'plaid',
  DWOLLA = 'dwolla',
  MERCADO_PAGO = 'mercado_pago',
  MANUAL = 'manual',
  MC4_QR = 'MC4_QR',
}

// =====================================================
// QR PAYMENT
// =====================================================

export enum QrPaymentStatus {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  EXPIRADO = 'VENCIDO', // El backend usa 'VENCIDO'
  CANCELADO = 'CANCELADO',
}

export interface QrPayment {
  id: number;
  tenant_id: number;
  contract_id?: number;
  property_id?: number;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  status: QrPaymentStatus;
  qr_image: string; // base64 o URL
  qr_code?: string; // código raw
  transaction_id?: string;
  reference_number?: string;
  notes?: string;
  expires_at?: string;
  paid_at?: string;
  payment_id?: number; // id del pago registrado en payments cuando status=PAGADO
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GenerateQrPaymentDto {
  amount: number;
  currency?: string;
  payment_type?: PaymentType;
  notes?: string;
  contract_id?: number;
}

export interface VerifyQrDto {
  qr_id?: number;
  transaction_id?: string;
}

export const QrPaymentStatusLabels: Record<QrPaymentStatus, string> = {
  [QrPaymentStatus.PENDIENTE]: 'Pendiente de pago',
  [QrPaymentStatus.PAGADO]: 'Pagado',
  [QrPaymentStatus.EXPIRADO]: 'Expirado',
  [QrPaymentStatus.CANCELADO]: 'Cancelado',
};

export const QrPaymentStatusColors: Record<QrPaymentStatus, string> = {
  [QrPaymentStatus.PENDIENTE]: '#f59e0b',
  [QrPaymentStatus.PAGADO]: '#10b981',
  [QrPaymentStatus.EXPIRADO]: '#64748b',
  [QrPaymentStatus.CANCELADO]: '#ef4444',
};

// =====================================================
// INTERFACES
// =====================================================

export interface Payment {
  id: number;
  tenant_id: number;
  contract_id: number;
  property_id: number;

  // Financiero
  amount: number;
  currency: Currency;

  // Tipo y método
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  status: PaymentStatus;

  // Fechas
  payment_date: Date | string;
  due_date?: Date | string;
  processed_date?: Date | string;

  // Referencias
  reference_number?: string;
  transaction_id?: string;
  check_number?: string;

  // Procesador
  payment_processor: PaymentProcessor;
  processor_fee?: number;

  // Archivos
  proof_file?: string;
  receipt_file?: string;

  // Notas
  notes?: string;
  admin_notes?: string;
  rejection_reason?: string;

  // Flags
  is_partial_payment: boolean;
  parent_payment_id?: number;
  is_recurring: boolean;
  recurring_schedule_id?: number;
  is_autopay: boolean;

  // Tracking
  created_by?: number;
  approved_by?: number;
  approved_at?: Date | string;

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  created_at: Date | string;
  updated_at: Date | string;

  // Relaciones
  contract?: ContractReference;
  property?: PropertyReference;
  tenant?: TenantReference;
}

export interface ContractReference {
  id: number;
  contract_number: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface PropertyReference {
  id: number;
  title: string;
  address?: string;
}

export interface TenantReference {
  id: number;
  name?: string; // el backend puede devolver el nombre como campo único
  first_name?: string;
  last_name?: string;
  email: string;
}

export interface PaymentStats {
  total_payments: number;
  total_pending: number;
  total_processing: number;
  total_approved: number;
  total_rejected: number;
  total_failed: number;
  total_amount_pending: number;
  total_amount_approved: number;
  total_amount_failed: number;
}

// =====================================================
// DTOs
// =====================================================

export interface CreatePaymentDto {
  amount: number;
  currency?: Currency;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  payment_date: Date | string;
  due_date?: Date | string;
  reference_number?: string;
  check_number?: string;
  notes?: string;
  payment_processor?: PaymentProcessor;
  is_partial_payment?: boolean;
  parent_payment_id?: number;
  is_recurring?: boolean;
  recurring_schedule_id?: number;
  // Campos específicos por método de pago
  card_last_4_digits?: string;
  card_holder_name?: string;
  card_expiry?: string;
  bank_name?: string;
  bank_account_last_4?: string;
  received_by?: string;
}

export interface CreatePaymentAsAdminDto {
  tenant_id: number;
  contract_id: number;
  property_id: number;
  amount: number;
  currency?: Currency;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  status?: PaymentStatus;
  payment_date: Date | string;
  due_date?: Date | string;
  reference_number?: string;
  check_number?: string;
  notes?: string;
  admin_notes?: string;
  payment_processor?: PaymentProcessor;
  is_partial_payment?: boolean;
  parent_payment_id?: number;
  is_recurring?: boolean;
  recurring_schedule_id?: number;

  // Campos específicos por método de pago
  card_last_4_digits?: string;
  card_holder_name?: string;
  card_expiry?: string;
  bank_name?: string;
  bank_account_last_4?: string;
  received_by?: string;
}

export interface UpdatePaymentStatusDto {
  status: PaymentStatus;
  admin_notes?: string;
  rejection_reason?: string;
}

export interface BulkPaymentActionDto {
  ids: number[];
  action: string;
  admin_notes?: string;
  rejection_reason?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  type?: PaymentType;
  method?: PaymentMethod;
  currency?: Currency;
  date_from?: string;
  date_to?: string;
  tenant_id?: number;
  property_id?: number;
  contract_id?: number;
}

// =====================================================
// LABELS (Español)
// =====================================================

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pendiente',
  [PaymentStatus.PROCESSING]: 'Procesando',
  [PaymentStatus.APPROVED]: 'Aprobado',
  [PaymentStatus.REJECTED]: 'Rechazado',
  [PaymentStatus.FAILED]: 'Fallido',
  [PaymentStatus.REFUNDED]: 'Reembolsado',
  [PaymentStatus.REVERSED]: 'Revertido',
  [PaymentStatus.DISPUTED]: 'En Disputa',
};

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.ACH]: 'ACH (Transferencia Automática)',
  [PaymentMethod.ECHECK]: 'Cheque Electrónico',
  [PaymentMethod.ZELLE]: 'Zelle',
  [PaymentMethod.VENMO]: 'Venmo',
  [PaymentMethod.SEPA]: 'SEPA (Europa)',
  [PaymentMethod.CREDIT_CARD]: 'Tarjeta de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Tarjeta de Débito',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.STRIPE]: 'Stripe',
  [PaymentMethod.WIRE_TRANSFER]: 'Transferencia Bancaria',
  [PaymentMethod.TRANSFER]: 'Transferencia',
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.MONEY_ORDER]: 'Giro Postal',
  [PaymentMethod.CHECK]: 'Cheque',
  [PaymentMethod.OTHER]: 'Otro',
  [PaymentMethod.QR_MC4]: 'QR MC4 (Bolivia)',
};

export const PaymentTypeLabels: Record<PaymentType, string> = {
  [PaymentType.RENT]: 'Renta',
  [PaymentType.DEPOSIT]: 'Depósito de Seguridad',
  [PaymentType.LATE_FEE]: 'Cargo por Retraso',
  [PaymentType.UTILITY]: 'Servicios Públicos',
  [PaymentType.HOA_FEE]: 'Cuota HOA',
  [PaymentType.PET_FEE]: 'Cargo por Mascota',
  [PaymentType.PARKING_FEE]: 'Estacionamiento',
  [PaymentType.APPLICATION_FEE]: 'Tarifa de Solicitud',
  [PaymentType.MAINTENANCE_FEE]: 'Mantenimiento',
  [PaymentType.OTHER]: 'Otro',
};

export const CurrencyLabels: Record<Currency, string> = {
  [Currency.USD]: 'USD - Dólar Estadounidense',
  [Currency.EUR]: 'EUR - Euro',
  [Currency.GBP]: 'GBP - Libra Esterlina',
  [Currency.CAD]: 'CAD - Dólar Canadiense',
  [Currency.MXN]: 'MXN - Peso Mexicano',
  [Currency.AUD]: 'AUD - Dólar Australiano',
  [Currency.BRL]: 'BRL - Real Brasileño',
  [Currency.COP]: 'COP - Peso Colombiano',
  [Currency.CLP]: 'CLP - Peso Chileno',
  [Currency.PEN]: 'PEN - Sol Peruano',
  [Currency.ARS]: 'ARS - Peso Argentino',
  [Currency.BOB]: 'BOB - Boliviano',
};

export const CurrencySymbols: Record<Currency, string> = {
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
  [Currency.CAD]: 'CA$',
  [Currency.MXN]: 'MX$',
  [Currency.AUD]: 'A$',
  [Currency.BRL]: 'R$',
  [Currency.COP]: 'COL$',
  [Currency.CLP]: 'CL$',
  [Currency.PEN]: 'S/',
  [Currency.ARS]: 'AR$',
  [Currency.BOB]: 'Bs',
};

// =====================================================
// COLORES
// =====================================================

export const PaymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: '#f59e0b',
  [PaymentStatus.PROCESSING]: '#3b82f6',
  [PaymentStatus.APPROVED]: '#10b981',
  [PaymentStatus.REJECTED]: '#ef4444',
  [PaymentStatus.FAILED]: '#dc2626',
  [PaymentStatus.REFUNDED]: '#8b5cf6',
  [PaymentStatus.REVERSED]: '#64748b',
  [PaymentStatus.DISPUTED]: '#f97316',
};
