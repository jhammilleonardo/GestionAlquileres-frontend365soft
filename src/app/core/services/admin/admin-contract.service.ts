import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiHttpService } from '../api-http.service';
import { SlugService } from '../slug.service';
import { AuthService } from '../auth.service';
import {
  Contract,
  ContractDashboard,
  CreateContractDTO,
  UpdateContractDTO,
  UpdateContractStatusDTO,
  RenewContractResponse,
  ContractFilters,
} from '../../models/contract.model';

/**
 * Respuesta del endpoint de generación de PDF
 */
export interface PdfUrlResponse {
  path: string;
  url: string;
  fullUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminContractService {
  private apiHttp = inject(ApiHttpService);
  private slugService = inject(SlugService);
  private authService = inject(AuthService);

  // Signals para estado reactivo
  private contractsSignal = signal<Contract[]>([]);
  private currentContractSignal = signal<Contract | null>(null);
  private dashboardSignal = signal<ContractDashboard | null>(null);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Signals públicas de solo lectura
  contracts = this.contractsSignal.asReadonly();
  currentContract = this.currentContractSignal.asReadonly();
  dashboard = this.dashboardSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  /**
   * Obtener el slug actual
   */
  private get slug(): string {
    return this.slugService.getSlug() || '';
  }

  /**
   * Obtener headers con autenticación
   */
  private get headers() {
    const token = this.authService.getToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Cargar métricas del dashboard
   */
  loadDashboard(): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint('admin/contracts/dashboard');

    this.apiHttp
      .get<ContractDashboard>(endpoint, {}, this.headers)
      .pipe(
        tap((dashboard) => {
          this.dashboardSignal.set(dashboard);
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set('Error al cargar las métricas');
          this.isLoadingSignal.set(false);
          console.error('Error loading dashboard:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Cargar lista de contratos con filtros opcionales
   */
  loadContracts(filters?: ContractFilters): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint('admin/contracts');
    const params: any = {};

    if (filters?.status) params.status = filters.status;
    if (filters?.tenant_id) params.tenant_id = filters.tenant_id;
    if (filters?.property_id) params.property_id = filters.property_id;

    this.apiHttp
      .get<Contract[]>(endpoint, params, this.headers)
      .pipe(
        tap((contracts) => {
          const processedContracts = contracts.map((c) => this.processContract(c));
          this.contractsSignal.set(processedContracts);
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set('Error al cargar los contratos');
          this.isLoadingSignal.set(false);
          console.error('Error loading contracts:', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Obtener un contrato por ID
   */
  getContract(id: number): Observable<Contract> {
    if (!this.slug) {
      return of();
    }

    const endpoint = this.slugService.buildApiEndpoint(`admin/contracts/${id}`);

    return this.apiHttp.get<Contract>(endpoint, {}, this.headers).pipe(
      tap((contract) => {
        const processedContract = this.processContract(contract);
        this.currentContractSignal.set(processedContract);

        // Actualizar en la lista si existe
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === processedContract.id ? processedContract : c)),
        );
      }),
      catchError((error) => {
        this.errorSignal.set('Error al cargar el contrato');
        console.error('Error getting contract:', error);
        throw error;
      }),
    );
  }

  /**
   * Crear un nuevo contrato
   */
  createContract(data: CreateContractDTO): Observable<Contract> {
    if (!this.slug) {
      return of();
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint('admin/contracts');

    return this.apiHttp.post<Contract>(endpoint, data, this.headers).pipe(
      tap((contract) => {
        const processedContract = this.processContract(contract);

        // Agregar a la lista
        this.contractsSignal.update((contracts) => [processedContract, ...contracts]);

        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.error?.message || 'Error al crear el contrato');
        this.isLoadingSignal.set(false);
        throw error;
      }),
    );
  }

  /**
   * Actualizar un contrato
   */
  updateContract(id: number, data: UpdateContractDTO): Observable<Contract> {
    if (!this.slug) {
      return of();
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint(`admin/contracts/${id}`);

    return this.apiHttp.patch<Contract>(endpoint, data, this.headers).pipe(
      tap((contract) => {
        const processedContract = this.processContract(contract);

        // Actualizar en la lista
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === processedContract.id ? processedContract : c)),
        );

        // Actualizar contrato actual si es el mismo
        if (this.currentContractSignal()?.id === id) {
          this.currentContractSignal.set(processedContract);
        }

        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.error?.message || 'Error al actualizar el contrato');
        this.isLoadingSignal.set(false);
        throw error;
      }),
    );
  }

  /**
   * Cambiar estado de un contrato
   */
  updateStatus(id: number, statusData: UpdateContractStatusDTO): Observable<Contract> {
    if (!this.slug) {
      return of();
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint(`admin/contracts/${id}/status`);

    return this.apiHttp.patch<Contract>(endpoint, statusData, this.headers).pipe(
      tap((contract) => {
        const processedContract = this.processContract(contract);

        // Actualizar en la lista
        this.contractsSignal.update((contracts) =>
          contracts.map((c) => (c.id === processedContract.id ? processedContract : c)),
        );

        // Actualizar contrato actual si es el mismo
        if (this.currentContractSignal()?.id === id) {
          this.currentContractSignal.set(processedContract);
        }

        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.error?.message || 'Error al cambiar el estado');
        this.isLoadingSignal.set(false);
        throw error;
      }),
    );
  }

  /**
   * Renovar un contrato
   */
  renewContract(id: number): Observable<RenewContractResponse> {
    if (!this.slug) {
      return of();
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const endpoint = this.slugService.buildApiEndpoint(`admin/contracts/${id}/renew`);

    return this.apiHttp.post<RenewContractResponse>(endpoint, {}, this.headers).pipe(
      tap((response) => {
        // Crear un objeto Contract a partir de la respuesta
        const newContract: Contract = {
          ...response,
          status: response.status,
          start_date: response.start_date,
          end_date: response.end_date,
          monthly_rent: response.monthly_rent,
          currency: response.currency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const processedContract = this.processContract(newContract);

        // Agregar a la lista
        this.contractsSignal.update((contracts) => [processedContract, ...contracts]);

        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.error?.message || 'Error al renovar el contrato');
        this.isLoadingSignal.set(false);
        throw error;
      }),
    );
  }

  /**
   * Generar y obtener la URL del PDF de un contrato
   */
  generatePdfUrl(id: number): Observable<PdfUrlResponse> {
    if (!this.slug) {
      return of();
    }

    const endpoint = this.slugService.buildApiEndpoint(`admin/contracts/${id}/pdf-url`);

    return this.apiHttp.get<PdfUrlResponse>(endpoint, {}, this.headers);
  }

  /**
   * Visualizar PDF de un contrato (abre en nueva pestaña)
   */
  viewPDF(id: number): void {
    if (!this.slug) {
      return;
    }

    this.generatePdfUrl(id).subscribe({
      next: (response) => {
        // Abrir el PDF en una nueva pestaña para visualización
        window.open(response.fullUrl, '_blank');
      },
      error: (error) => {
        console.error('Error generating PDF:', error);
        alert('Error al generar el PDF');
      },
    });
  }

  /**
   * Descargar PDF de un contrato (abre en nueva pestaña, el usuario puede guardar desde allí)
   */
  downloadPDF(id: number): void {
    this.viewPDF(id);
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Limpiar contrato actual
   */
  clearCurrentContract(): void {
    this.currentContractSignal.set(null);
  }

  /**
   * Procesar contrato para crear objetos anidados
   */
  private processContract(contract: Contract): Contract {
    // Si el contrato no tiene objeto tenant pero tiene los campos directos,
    // crear el objeto tenant para compatibilidad con el componente
    if (!contract.tenant && (contract.tenant_name || contract.tenant_email)) {
      contract.tenant = {
        id: contract.tenant_id || 0,
        name: contract.tenant_name || '',
        email: contract.tenant_email || '',
        phone: contract.tenant_phone,
        tenant_id: contract.tenant_id || 0,
      };
    }

    // Si el contrato no tiene objeto property pero tiene los campos directos,
    // crear el objeto property para compatibilidad con el componente
    if (!contract.property && (contract.property_title || contract.street_address)) {
      contract.property = {
        id: contract.property_id || 0,
        title: contract.property_title || '',
        addresses: contract.street_address
          ? [
              {
                street_address: contract.street_address,
                city: contract.city || '',
                state: contract.state,
                country: contract.country || '',
                zip_code: contract.zip_code,
              },
            ]
          : [],
        owners: [],
      };
    }

    // Convertir monthly_rent y deposit_amount a number si vienen como string
    if (typeof contract.monthly_rent === 'string') {
      contract.monthly_rent = parseFloat(contract.monthly_rent);
    }
    if (contract.deposit_amount && typeof contract.deposit_amount === 'string') {
      contract.deposit_amount = parseFloat(contract.deposit_amount);
    }
    if (contract.late_fee_percentage && typeof contract.late_fee_percentage === 'string') {
      contract.late_fee_percentage = parseFloat(contract.late_fee_percentage);
    }
    if (
      contract.auto_increase_percentage &&
      typeof contract.auto_increase_percentage === 'string'
    ) {
      contract.auto_increase_percentage = parseFloat(contract.auto_increase_percentage);
    }

    return contract;
  }
}
