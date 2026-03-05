import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentStats, PaymentFilters, UpdatePaymentStatusDto, PaymentStatus, CreatePaymentAsAdminDto, BulkPaymentActionDto } from '../models/payment.model';
import { SlugService } from './slug.service';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private slugService = inject(SlugService);

    // Reactive state
    private paymentsSignal = signal<Payment[]>([]);
    private statsSignal = signal<PaymentStats | null>(null);
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    payments = this.paymentsSignal.asReadonly();
    stats = this.statsSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();

    // Computed values
    pendingPayments = computed(() =>
        this.paymentsSignal().filter(p => p.status === PaymentStatus.PENDING)
    );

    approvedPayments = computed(() =>
        this.paymentsSignal().filter(p => p.status === PaymentStatus.APPROVED)
    );

    rejectedPayments = computed(() =>
        this.paymentsSignal().filter(p => p.status === PaymentStatus.REJECTED)
    );

    /**
     * Obtener el endpoint base con slug
     */
    private getBaseUrl(): string {
        const endpoint = this.slugService.buildApiEndpoint('admin/payments');
        return `${environment.apiUrl}${endpoint}`;
    }

    /**
     * Normalizar Payment - convertir strings a números
     */
    private normalizePayment(payment: any): Payment {
        return {
            ...payment,
            amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
            processor_fee: payment.processor_fee ?
                (typeof payment.processor_fee === 'string' ? parseFloat(payment.processor_fee) : payment.processor_fee) :
                undefined
        };
    }

    /**
     * Normalizar PaymentStats - convertir strings a números
     */
    private normalizeStats(stats: any): PaymentStats {
        return {
            ...stats,
            total_amount_pending: typeof stats.total_amount_pending === 'string' ?
                parseFloat(stats.total_amount_pending) : stats.total_amount_pending,
            total_amount_approved: typeof stats.total_amount_approved === 'string' ?
                parseFloat(stats.total_amount_approved) : stats.total_amount_approved,
            total_amount_failed: typeof stats.total_amount_failed === 'string' ?
                parseFloat(stats.total_amount_failed) : stats.total_amount_failed
        };
    }

    /**
     * Cargar todos los pagos con filtros opcionales
     * GET /:slug/admin/payments
     */
    loadPayments(filters?: PaymentFilters): void {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        let params = new HttpParams();
        if (filters) {
            if (filters.status) params = params.set('status', filters.status);
            if (filters.type) params = params.set('type', filters.type);
            if (filters.method) params = params.set('method', filters.method);
            if (filters.date_from) params = params.set('date_from', filters.date_from);
            if (filters.date_to) params = params.set('date_to', filters.date_to);
        }

        this.http.get<{ payments: any[], total: number, page: number, limit: number }>(this.getBaseUrl(), { params })
            .pipe(
                tap(response => {
                    const normalizedPayments = (response.payments || []).map(p => this.normalizePayment(p));
                    this.paymentsSignal.set(normalizedPayments);
                    this.isLoadingSignal.set(false);
                }),
                catchError(error => {
                    this.errorSignal.set(error.error?.message || 'Error al cargar los pagos');
                    this.isLoadingSignal.set(false);
                    console.error('Error loading payments:', error);
                    this.paymentsSignal.set([]);
                    return of({ payments: [], total: 0, page: 1, limit: 50 });
                })
            )
            .subscribe();
    }

    /**
     * Cargar estadísticas de pagos
     * GET /:slug/admin/payments/stats
     */
    loadStats(): void {
        const endpoint = this.slugService.buildApiEndpoint('admin/payments/stats');
        this.http.get<any>(`${environment.apiUrl}${endpoint}`)
            .pipe(
                tap(stats => {
                    const normalizedStats = this.normalizeStats(stats);
                    this.statsSignal.set(normalizedStats);
                }),
                catchError(error => {
                    console.error('Error loading payment stats:', error);
                    return of(null);
                })
            )
            .subscribe();
    }

    /**
     * Obtener un pago específico
     * GET /:slug/admin/payments/:id
     */
    getPayment(id: number): Observable<Payment> {
        return this.http.get<any>(`${this.getBaseUrl()}/${id}`)
            .pipe(
                tap(payment => {
                    const normalizedPayment = this.normalizePayment(payment);
                    // Actualizar en la lista si existe
                    this.paymentsSignal.update(payments =>
                        payments.map(p => p.id === normalizedPayment.id ? normalizedPayment : p)
                    );
                }),
                catchError(error => {
                    console.error('Error loading payment:', error);
                    throw error;
                })
            );
    }

    /**
     * Actualizar estado de un pago (aprobar/rechazar)
     * PATCH /:slug/admin/payments/:id
     */
    updatePaymentStatus(id: number, data: UpdatePaymentStatusDto): Observable<Payment> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.patch<any>(`${this.getBaseUrl()}/${id}`, data)
            .pipe(
                tap(updatedPayment => {
                    const normalizedPayment = this.normalizePayment(updatedPayment);
                    this.paymentsSignal.update(payments =>
                        payments.map(p => p.id === normalizedPayment.id ? normalizedPayment : p)
                    );
                    this.isLoadingSignal.set(false);

                    // Recargar stats
                    this.loadStats();
                }),
                catchError(error => {
                    this.errorSignal.set(error.error?.message || 'Error al actualizar el pago');
                    this.isLoadingSignal.set(false);
                    throw error;
                })
            );
    }

    /**
     * Crear un pago como Admin
     * POST /:slug/admin/payments
     */
    createPaymentAsAdmin(data: CreatePaymentAsAdminDto): Observable<Payment> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        // Convertir fecha si es Date
        const payload = {
            ...data,
            payment_date: typeof data.payment_date === 'string'
                ? data.payment_date
                : data.payment_date.toISOString().split('T')[0],
            due_date: data.due_date
                ? (typeof data.due_date === 'string'
                    ? data.due_date
                    : data.due_date.toISOString().split('T')[0])
                : undefined
        };

        return this.http.post<any>(this.getBaseUrl(), payload)
            .pipe(
                tap(newPayment => {
                    const normalizedPayment = this.normalizePayment(newPayment);
                    this.paymentsSignal.update(payments => [normalizedPayment, ...payments]);
                    this.isLoadingSignal.set(false);

                    // Recargar stats
                    this.loadStats();
                }),
                catchError(error => {
                    this.errorSignal.set(error.error?.message || 'Error al crear el pago');
                    this.isLoadingSignal.set(false);
                    throw error;
                })
            );
    }

    /**
     * Eliminar un pago
     * DELETE /:slug/admin/payments/:id
     */
    deletePayment(id: number): Observable<void> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.delete<void>(`${this.getBaseUrl()}/${id}`)
            .pipe(
                tap(() => {
                    this.paymentsSignal.update(payments =>
                        payments.filter(p => p.id !== id)
                    );
                    this.isLoadingSignal.set(false);

                    // Recargar stats
                    this.loadStats();
                }),
                catchError(error => {
                    this.errorSignal.set(error.error?.message || 'Error al eliminar el pago');
                    this.isLoadingSignal.set(false);
                    throw error;
                })
            );
    }

    /**
     * Acción masiva: aprobar, rechazar o eliminar varios pagos
     * POST /:slug/admin/payments/bulk-action
     */
    bulkAction(data: BulkPaymentActionDto): Observable<{ processed: number; errors: number }> {
        this.isLoadingSignal.set(true);
        const endpoint = this.slugService.buildApiEndpoint('admin/payments/bulk-action');
        return this.http.post<{ processed: number; errors: number }>(`${environment.apiUrl}${endpoint}`, data)
            .pipe(
                tap(() => {
                    this.isLoadingSignal.set(false);
                    this.loadPayments();
                    this.loadStats();
                }),
                catchError(error => {
                    this.errorSignal.set(error.error?.message || 'Error en acción masiva');
                    this.isLoadingSignal.set(false);
                    throw error;
                })
            );
    }

    /**
     * Exportar pagos como CSV
     * GET /:slug/admin/payments/export
     */
    exportCsv(filters?: PaymentFilters): Observable<Blob> {
        const endpoint = this.slugService.buildApiEndpoint('admin/payments/export');
        let params = new HttpParams();
        if (filters) {
            if (filters.status) params = params.set('status', filters.status);
            if (filters.type) params = params.set('type', filters.type);
            if (filters.method) params = params.set('method', filters.method);
            if (filters.date_from) params = params.set('date_from', filters.date_from);
            if (filters.date_to) params = params.set('date_to', filters.date_to);
        }
        return this.http.get(`${environment.apiUrl}${endpoint}`, {
            params,
            responseType: 'blob'
        });
    }

    /**
     * Construir URL completa para ver el comprobante de pago
     */
    getProofUrl(payment: Payment): string | null {
        if (!payment.proof_file) return null;
        return `${environment.apiUrl}/storage/${payment.proof_file}`;
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.errorSignal.set(null);
    }

    /**
     * Limpiar estado
     */
    clearState(): void {
        this.paymentsSignal.set([]);
        this.statsSignal.set(null);
        this.errorSignal.set(null);
    }
}
