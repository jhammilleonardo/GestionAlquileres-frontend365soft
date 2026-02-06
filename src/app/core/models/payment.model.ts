// Enums para pagos
export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
    CASH = 'CASH',
    CHECK = 'CHECK'
}

export enum PaymentType {
    RENT = 'RENT',
    DEPOSIT = 'DEPOSIT',
    LATE_FEE = 'LATE_FEE',
    UTILITY = 'UTILITY',
    OTHER = 'OTHER'
}

// Interfaces
export interface Payment {
    id: number;
    tenant_id: number;
    contract_id: number;
    property_id: number;
    amount: number;
    payment_type: PaymentType;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    due_date: Date;
    payment_date?: Date;
    reference_number?: string;
    description?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

export interface PaymentSchedule {
    id: number;
    contract_id: number;
    amount: number;
    due_date: Date;
    payment_type: PaymentType;
    is_paid: boolean;
    payment_id?: number;
}

export interface PaymentStats {
    total_paid: number;
    total_pending: number;
    next_payment_date?: Date;
    next_payment_amount?: number;
    on_time_payments: number;
    late_payments: number;
}

// DTOs
export interface CreatePaymentDto {
    amount: number;
    payment_type: PaymentType;
    payment_method: PaymentMethod;
    payment_date: Date;
    reference_number?: string;
    notes?: string;
}

// Labels para UI
export const PaymentStatusLabels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pendiente',
    [PaymentStatus.COMPLETED]: 'Completado',
    [PaymentStatus.FAILED]: 'Fallido',
    [PaymentStatus.CANCELLED]: 'Cancelado',
    [PaymentStatus.REFUNDED]: 'Reembolsado'
};

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
    [PaymentMethod.CREDIT_CARD]: 'Tarjeta de Crédito',
    [PaymentMethod.DEBIT_CARD]: 'Tarjeta de Débito',
    [PaymentMethod.BANK_TRANSFER]: 'Transferencia Bancaria',
    [PaymentMethod.CASH]: 'Efectivo',
    [PaymentMethod.CHECK]: 'Cheque'
};

export const PaymentTypeLabels: Record<PaymentType, string> = {
    [PaymentType.RENT]: 'Renta',
    [PaymentType.DEPOSIT]: 'Depósito',
    [PaymentType.LATE_FEE]: 'Recargo por Mora',
    [PaymentType.UTILITY]: 'Servicios',
    [PaymentType.OTHER]: 'Otro'
};
