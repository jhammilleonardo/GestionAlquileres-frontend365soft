// Enums para documentos
export enum DocumentType {
    CONTRACT = 'CONTRACT',
    ADDENDUM = 'ADDENDUM',
    NOTICE = 'NOTICE',
    RECEIPT = 'RECEIPT',
    POLICY = 'POLICY',
    OTHER = 'OTHER'
}

export enum DocumentStatus {
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
    EXPIRED = 'EXPIRED'
}

// Interfaces
export interface TenantDocument {
    id: number;
    tenant_id: number;
    contract_id?: number;
    title: string;
    description?: string;
    document_type: DocumentType;
    status: DocumentStatus;
    file_url: string;
    file_name: string;
    file_size: number;
    uploaded_by: number;
    uploaded_at: Date;
    expires_at?: Date;
    requires_signature: boolean;
    is_signed: boolean;
    signed_at?: Date;
}

// Labels para UI
export const DocumentTypeLabels: Record<DocumentType, string> = {
    [DocumentType.CONTRACT]: 'Contrato',
    [DocumentType.ADDENDUM]: 'Addendum',
    [DocumentType.NOTICE]: 'Aviso',
    [DocumentType.RECEIPT]: 'Recibo',
    [DocumentType.POLICY]: 'Política',
    [DocumentType.OTHER]: 'Otro'
};

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
    [DocumentStatus.ACTIVE]: 'Activo',
    [DocumentStatus.ARCHIVED]: 'Archivado',
    [DocumentStatus.EXPIRED]: 'Expirado'
};
