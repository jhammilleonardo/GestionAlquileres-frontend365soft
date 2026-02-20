import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantAuthService } from './tenant-auth.service';
import { SlugService } from './slug.service';

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
    SUSPENDIDO = 'SUSPENDIDO'
}

export const ContractStatusLabels: Record<ContractStatus, string> = {
    [ContractStatus.BORRADOR]: 'Borrador',
    [ContractStatus.PENDIENTE]: 'Pendiente',
    [ContractStatus.FIRMADO]: 'Firmado',
    [ContractStatus.ACTIVO]: 'Activo',
    [ContractStatus.POR_VENCER]: 'Por Vencer',
    [ContractStatus.VENCIDO]: 'Vencido',
    [ContractStatus.RENOVADO]: 'Renovado',
    [ContractStatus.FINALIZADO]: 'Finalizado',
    [ContractStatus.CANCELADO]: 'Cancelado',
    [ContractStatus.SUSPENDIDO]: 'Suspendido'
};

export interface Contract {
    id: number;
    tenant_id: number;
    property_id: number;
    contract_number: string;
    start_date: Date;
    end_date: Date;
    key_delivery_date?: Date;
    monthly_rent: number;
    currency?: string;
    payment_day?: number;
    deposit_amount?: number;
    payment_method?: string;
    status: ContractStatus;
    is_signed: boolean;
    signed_at?: Date;
    signed_ip?: string;
    property?: {
        id: number;
        title: string;
        address?: string;
    };
    // Campos adicionales del contrato
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
    // Datos bancarios
    bank_name?: string;
    bank_account_number?: string;
    bank_account_type?: string;
    bank_account_holder?: string;
    created_at: Date;
    updated_at: Date;
}

export interface SignContractResponse {
    message: string;
    contract: Contract;
}

@Injectable({
    providedIn: 'root'
})
export class TenantContractService {
    private http = inject(HttpClient);
    private authService = inject(TenantAuthService);
    private slugService = inject(SlugService);

    // Signal-based reactive state
    private contractsSignal = signal<Contract[]>([]);
    private currentContractSignal = signal<Contract | null>(null);
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    contracts = this.contractsSignal.asReadonly();
    currentContract = this.currentContractSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();

    private get slug(): string {
        return this.slugService.getSlug() || '';
    }

    private get headers(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    /**
     * Cargar el contrato activo del inquilino
     */
    loadCurrentContract(): void {
        if (!this.slug) return;

        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        this.http.get<any>(
            `${environment.apiUrl}${this.slug}/tenant/contracts/current`,
            { headers: this.headers }
        ).pipe(
            tap(contract => {
                const processedContract = this.processContract(contract);
                this.currentContractSignal.set(processedContract);
                this.isLoadingSignal.set(false);
            }),
            catchError(error => {
                this.errorSignal.set('Error al cargar el contrato activo');
                this.isLoadingSignal.set(false);
                console.error('Error loading current contract:', error);
                return of(null);
            })
        ).subscribe();
    }

    /**
     * Cargar todos los contratos del inquilino
     */
    loadContracts(status?: ContractStatus): void {
        if (!this.slug) return;

        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        const url = status
            ? `${environment.apiUrl}${this.slug}/tenant/contracts?status=${status}`
            : `${environment.apiUrl}${this.slug}/tenant/contracts`;

        this.http.get<any[]>(url, { headers: this.headers })
            .pipe(
                tap(contracts => {
                    const processedContracts = contracts.map(c => this.processContract(c));
                    this.contractsSignal.set(processedContracts);
                    this.isLoadingSignal.set(false);
                }),
                catchError(error => {
                    this.errorSignal.set('Error al cargar los contratos');
                    this.isLoadingSignal.set(false);
                    console.error('Error loading contracts:', error);
                    return of([]);
                })
            )
            .subscribe();
    }

    /**
     * Obtener un contrato específico por ID
     */
    getContract(id: number): Observable<Contract> {
        return this.http.get<any>(
            `${environment.apiUrl}${this.slug}/tenant/contracts/${id}`,
            { headers: this.headers }
        ).pipe(
            tap(contract => {
                const processedContract = this.processContract(contract);

                // Actualizar en la lista si existe
                this.contractsSignal.update(contracts =>
                    contracts.map(c => c.id === processedContract.id ? processedContract : c)
                );
            })
        );
    }

    /**
     * Firmar un contrato digitalmente
     */
    signContract(contractId: number): Observable<Contract> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.post<any>(
            `${environment.apiUrl}${this.slug}/tenant/contracts/${contractId}/sign`,
            {},
            { headers: this.headers }
        ).pipe(
            tap(response => {
                const processedContract = this.processContract(response);

                // Actualizar el contrato actual si es el mismo
                if (this.currentContractSignal()?.id === contractId) {
                    this.currentContractSignal.set(processedContract);
                }

                // Actualizar en la lista
                this.contractsSignal.update(contracts =>
                    contracts.map(c => c.id === processedContract.id ? processedContract : c)
                );

                this.isLoadingSignal.set(false);
            }),
            catchError(error => {
                this.errorSignal.set(error.error?.message || 'Error al firmar el contrato');
                this.isLoadingSignal.set(false);
                throw error;
            })
        );
    }

    /**
     * Descargar contrato como PDF
     */
    downloadContractPDF(contractId: number): Observable<Blob> {
        return this.http.get(
            `${environment.apiUrl}${this.slug}/tenant/contracts/${contractId}/pdf`,
            {
                headers: this.headers,
                responseType: 'blob'
            }
        );
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.errorSignal.set(null);
    }

    /**
     * Procesar fechas y mapear datos del contrato desde la API
     */
    private processContract(contract: any): Contract {
        return {
            id: contract.id,
            tenant_id: contract.tenant_id,
            property_id: contract.property_id,
            contract_number: contract.contract_number,
            start_date: new Date(contract.start_date),
            end_date: new Date(contract.end_date),
            key_delivery_date: contract.key_delivery_date ? new Date(contract.key_delivery_date) : undefined,
            monthly_rent: parseFloat(contract.monthly_rent),
            currency: contract.currency,
            payment_day: contract.payment_day,
            deposit_amount: contract.deposit_amount ? parseFloat(contract.deposit_amount) : undefined,
            payment_method: contract.payment_method,
            status: contract.status,
            is_signed: contract.is_signed,
            signed_at: contract.tenant_signature_date ? new Date(contract.tenant_signature_date) : undefined,
            signed_ip: contract.signed_ip,
            // Mapear datos de la propiedad (puede venir como objeto anidado o campos planos)
            property: {
                id: contract.property?.id || contract.property_id,
                title: contract.property?.title || contract.property_title || '',
                address: contract.property?.street_address
                    || contract.street_address
                    || [contract.city, contract.country].filter(Boolean).join(', ')
                    || ''
            },
            // Campos adicionales del contrato
            late_fee_percentage: contract.late_fee_percentage ? parseFloat(contract.late_fee_percentage) : undefined,
            grace_days: contract.grace_days,
            included_services: contract.included_services || [],
            tenant_responsibilities: contract.tenant_responsibilities,
            owner_responsibilities: contract.owner_responsibilities,
            prohibitions: contract.prohibitions,
            coexistence_rules: contract.coexistence_rules,
            renewal_terms: contract.renewal_terms,
            termination_terms: contract.termination_terms,
            jurisdiction: contract.jurisdiction,
            auto_renew: contract.auto_renew,
            renewal_notice_days: contract.renewal_notice_days,
            auto_increase_percentage: contract.auto_increase_percentage ? parseFloat(contract.auto_increase_percentage) : undefined,
            // Datos bancarios
            bank_name: contract.bank_name,
            bank_account_number: contract.bank_account_number,
            bank_account_type: contract.bank_account_type,
            bank_account_holder: contract.bank_account_holder,
            created_at: new Date(contract.created_at),
            updated_at: new Date(contract.updated_at)
        };
    }
}
