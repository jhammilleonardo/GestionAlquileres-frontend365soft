import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError, map } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import {
  Payment,
  PaymentStats,
  PaymentFilters,
  UpdatePaymentStatusDto,
  PaymentStatus,
  CreatePaymentAsAdminDto,
  BulkPaymentActionDto,
} from '../../models/payment.model';
import { SlugService } from '../slug.service';

import { getApiErrorMessage } from '../../http/http-error.util';
/** Pago crudo del backend: montos pueden venir como string. */
type RawPayment = Omit<Payment, 'amount' | 'processor_fee'> & {
  amount: string | number;
  processor_fee?: string | number;
};

/** Estadísticas crudas del backend: totales monetarios pueden venir como string. */
type RawPaymentStats = Omit<
  PaymentStats,
  'total_amount_pending' | 'total_amount_approved' | 'total_amount_failed'
> & {
  total_amount_pending: string | number;
  total_amount_approved: string | number;
  total_amount_failed: string | number;
};

interface PaymentsListResponse {
  payments: RawPayment[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminLedgerMonth {
  label: string;
  due_date: string;
  rent_amount: number;
  paid_rent: number;
  pending_review: number;
  late_fee: number;
  outstanding_rent: number;
  total_due: number;
  days_overdue: number;
  status: 'paid' | 'partial' | 'review' | 'overdue' | 'current' | 'upcoming';
}

export interface AdminLongTermLedger {
  contract_id: number;
  contract_number: string;
  tenant_id: number;
  tenant_name: string;
  property_id: number;
  property_name: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  elapsed_months: number;
  paid_months: number;
  overdue_months: number;
  monthly_rent: number;
  currency: string;
  payment_day: number;
  grace_days: number;
  late_fee_percentage: number;
  total_paid_rent: number;
  total_pending_review: number;
  base_debt: number;
  late_fee_debt: number;
  total_debt: number;
  months: AdminLedgerMonth[];
}

export interface AdminShortTermLedger {
  reservation_id: number;
  tenant_id: number;
  tenant_name: string;
  property_id: number;
  property_name: string;
  unit_number: string | null;
  checkin_date: string;
  checkout_date: string;
  nights: number;
  status: string;
  total_amount: number;
  deposit_required: number;
  paid_amount: number;
  pending_review: number;
  refunded_amount: number;
  balance_due: number;
  deposit_due: number;
  cleaning_fee: number;
  security_deposit: number;
  currency: string;
  alert:
    | 'deposit_required'
    | 'balance_before_checkin'
    | 'checkout_debt'
    | 'refund_pending'
    | 'paid';
  days_to_checkin: number;
}

export interface AdminPaymentLedger {
  generated_at: string;
  summary: {
    long_term_contracts: number;
    long_term_debt: number;
    long_term_overdue_months: number;
    short_term_reservations: number;
    short_term_balance_due: number;
    short_term_pending_review: number;
    total_receivable: number;
  };
  long_term: AdminLongTermLedger[];
  short_term: AdminShortTermLedger[];
  alerts: Array<{
    scope: 'long_term' | 'short_term';
    severity: 'info' | 'warning' | 'danger';
    message: string;
    amount?: number;
    entity_id?: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

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
    this.paymentsSignal().filter((p) => p.status === PaymentStatus.PENDING),
  );

  approvedPayments = computed(() =>
    this.paymentsSignal().filter((p) => p.status === PaymentStatus.APPROVED),
  );

  rejectedPayments = computed(() =>
    this.paymentsSignal().filter((p) => p.status === PaymentStatus.REJECTED),
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
  private normalizePayment(payment: RawPayment): Payment {
    return {
      ...payment,
      amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
      processor_fee: payment.processor_fee
        ? typeof payment.processor_fee === 'string'
          ? parseFloat(payment.processor_fee)
          : payment.processor_fee
        : undefined,
    };
  }

  /**
   * Normalizar PaymentStats - convertir strings a números
   */
  private normalizeStats(stats: RawPaymentStats): PaymentStats {
    return {
      ...stats,
      total_amount_pending:
        typeof stats.total_amount_pending === 'string'
          ? parseFloat(stats.total_amount_pending)
          : stats.total_amount_pending,
      total_amount_approved:
        typeof stats.total_amount_approved === 'string'
          ? parseFloat(stats.total_amount_approved)
          : stats.total_amount_approved,
      total_amount_failed:
        typeof stats.total_amount_failed === 'string'
          ? parseFloat(stats.total_amount_failed)
          : stats.total_amount_failed,
    };
  }

  private buildParams(filters?: PaymentFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;

    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.method) params = params.set('method', filters.method);
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);

    return params;
  }

  getPayments(filters?: PaymentFilters): Observable<Payment[]> {
    return this.http
      .get<PaymentsListResponse>(this.getBaseUrl(), { params: this.buildParams(filters) })
      .pipe(map((response) => (response.payments || []).map((p) => this.normalizePayment(p))));
  }

  getAdminLedger(): Observable<AdminPaymentLedger> {
    return this.http.get<AdminPaymentLedger>(`${this.getBaseUrl()}/ledger`);
  }

  /**
   * Cargar todos los pagos con filtros opcionales
   * GET /:slug/admin/payments
   */
  loadPayments(filters?: PaymentFilters): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.getPayments(filters)
      .pipe(
        tap((payments) => {
          this.paymentsSignal.set(payments);
          this.isLoadingSignal.set(false);
        }),
        catchError((error: unknown) => {
          this.errorSignal.set(
            getApiErrorMessage(error, this.transloco.translate('common.errors.loadPayments')),
          );
          this.isLoadingSignal.set(false);
          this.paymentsSignal.set([]);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Cargar estadísticas de pagos
   * GET /:slug/admin/payments/stats
   */
  loadStats(): void {
    const endpoint = this.slugService.buildApiEndpoint('admin/payments/stats');
    this.http
      .get<RawPaymentStats>(`${environment.apiUrl}${endpoint}`)
      .pipe(
        tap((stats) => {
          const normalizedStats = this.normalizeStats(stats);
          this.statsSignal.set(normalizedStats);
        }),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  /**
   * Obtener un pago específico
   * GET /:slug/admin/payments/:id
   */
  getPayment(id: number): Observable<Payment> {
    return this.http.get<RawPayment>(`${this.getBaseUrl()}/${id}`).pipe(
      map((payment) => {
        const normalizedPayment = this.normalizePayment(payment);
        // Actualizar en la lista si existe
        this.paymentsSignal.update((payments) =>
          payments.map((p) => (p.id === normalizedPayment.id ? normalizedPayment : p)),
        );
        return normalizedPayment;
      }),
    );
  }

  /**
   * Actualizar estado de un pago (aprobar/rechazar)
   * PATCH /:slug/admin/payments/:id
   */
  /**
   * Aprobar un pago. Usa el endpoint dedicado /approve, que además del cambio
   * de estado ejecuta el reparto al propietario (split + liquidaciones) en una
   * transacción. El PATCH genérico no genera esas liquidaciones.
   */
  approvePayment(id: number, adminNotes?: string): Observable<Payment> {
    return this.patchPaymentStatus(`${this.getBaseUrl()}/${id}/approve`, {
      admin_notes: adminNotes,
    });
  }

  /** Rechazar un pago con motivo (endpoint dedicado /reject). */
  rejectPayment(id: number, rejectionReason: string, adminNotes?: string): Observable<Payment> {
    return this.patchPaymentStatus(`${this.getBaseUrl()}/${id}/reject`, {
      rejection_reason: rejectionReason,
      admin_notes: adminNotes,
    });
  }

  /**
   * Cambio de estado genérico. Mantenido por compatibilidad; preferir
   * approvePayment/rejectPayment para esos flujos.
   */
  updatePaymentStatus(id: number, data: UpdatePaymentStatusDto): Observable<Payment> {
    return this.patchPaymentStatus(`${this.getBaseUrl()}/${id}`, data);
  }

  /** PATCH compartido que normaliza la respuesta y refresca lista + stats. */
  private patchPaymentStatus(url: string, body: unknown): Observable<Payment> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.patch<RawPayment>(url, body).pipe(
      map((updatedPayment) => {
        const normalizedPayment = this.normalizePayment(updatedPayment);
        this.paymentsSignal.update((payments) =>
          payments.map((p) => (p.id === normalizedPayment.id ? normalizedPayment : p)),
        );
        this.isLoadingSignal.set(false);

        // Recargar stats
        this.loadStats();
        return normalizedPayment;
      }),
      catchError((error: { error?: { message?: string } }) => {
        this.errorSignal.set(
          getApiErrorMessage(error, this.transloco.translate('common.errors.updatePayment')),
        );
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
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
      payment_date:
        typeof data.payment_date === 'string'
          ? data.payment_date
          : data.payment_date.toISOString().split('T')[0],
      due_date: data.due_date
        ? typeof data.due_date === 'string'
          ? data.due_date
          : data.due_date.toISOString().split('T')[0]
        : undefined,
    };

    return this.http.post<RawPayment>(this.getBaseUrl(), payload).pipe(
      map((newPayment) => {
        const normalizedPayment = this.normalizePayment(newPayment);
        this.paymentsSignal.update((payments) => [normalizedPayment, ...payments]);
        this.isLoadingSignal.set(false);

        // Recargar stats
        this.loadStats();
        return normalizedPayment;
      }),
      catchError((error: { error?: { message?: string } }) => {
        this.errorSignal.set(
          getApiErrorMessage(error, this.transloco.translate('common.errors.createPayment')),
        );
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Eliminar un pago
   * DELETE /:slug/admin/payments/:id
   */
  deletePayment(id: number): Observable<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.getBaseUrl()}/${id}`).pipe(
      tap(() => {
        this.paymentsSignal.update((payments) => payments.filter((p) => p.id !== id));
        this.isLoadingSignal.set(false);

        // Recargar stats
        this.loadStats();
      }),
      catchError((error: unknown) => {
        this.errorSignal.set(
          getApiErrorMessage(error, this.transloco.translate('common.errors.deletePayment')),
        );
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Acción masiva: aprobar, rechazar o eliminar varios pagos
   * POST /:slug/admin/payments/bulk-action
   */
  bulkAction(data: BulkPaymentActionDto): Observable<{ processed: number; errors: number }> {
    this.isLoadingSignal.set(true);
    const endpoint = this.slugService.buildApiEndpoint('admin/payments/bulk-action');
    return this.http
      .post<{ processed: number; errors: number }>(`${environment.apiUrl}${endpoint}`, data)
      .pipe(
        tap(() => {
          this.isLoadingSignal.set(false);
          this.loadPayments();
          this.loadStats();
        }),
        catchError((error: { error?: { message?: string } }) => {
          this.errorSignal.set(
            getApiErrorMessage(error, this.transloco.translate('common.errors.bulkAction')),
          );
          this.isLoadingSignal.set(false);
          return throwError(() => error);
        }),
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
      responseType: 'blob',
    });
  }

  /**
   * Construir URL completa para ver el comprobante de pago
   */
  getProofUrl(payment: Payment): string | null {
    const proofFile = payment.proof_file?.trim();
    if (!proofFile) return null;

    if (/^https?:\/\//i.test(proofFile)) {
      return proofFile;
    }

    const normalizedProofPath = proofFile.replace(/\\/g, '/').replace(/^\/+/, '');
    const baseUrl = environment.apiUrl.replace(/\/+$/, '');

    if (normalizedProofPath.startsWith('storage/')) {
      return `${baseUrl}/${normalizedProofPath}`;
    }

    return `${baseUrl}/storage/${normalizedProofPath}`;
  }

  /**
   * Descargar comprobante como Blob para poder renderizar archivos privados
   * protegidos por JWT (la solicitud sí pasa por el interceptor de auth).
   */
  downloadProof(payment: Payment): Observable<Blob> {
    const proofUrl = this.getProofUrl(payment);
    if (!proofUrl) {
      return throwError(() => new Error('Comprobante no disponible'));
    }

    return this.http.get(proofUrl, { responseType: 'blob' });
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
