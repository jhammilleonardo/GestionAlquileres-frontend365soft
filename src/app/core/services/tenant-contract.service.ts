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
     * Obtener el contrato activo del inquilino
     */
    loadCurrentContract(): void {
        if (!this.slug) return;

        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        this.http.get<Contract>(
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

        this.http.get<Contract[]>(url, { headers: this.headers })
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
        return this.http.get<Contract>(
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
    signContract(contractId: number): Observable<SignContractResponse> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.post<SignContractResponse>(
            `${environment.apiUrl}${this.slug}/tenant/contracts/${contractId}/sign`,
            {},
            { headers: this.headers }
        ).pipe(
            tap(response => {
                const processedContract = this.processContract(response.contract);

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
     * Procesar fechas del contrato
     */
    private processContract(contract: Contract): Contract {
        return {
            ...contract,
            start_date: new Date(contract.start_date),
            end_date: new Date(contract.end_date),
            key_delivery_date: contract.key_delivery_date ? new Date(contract.key_delivery_date) : undefined,
            signed_at: contract.signed_at ? new Date(contract.signed_at) : undefined,
            created_at: new Date(contract.created_at),
            updated_at: new Date(contract.updated_at)
        };
    }
}
