import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Payment, PaymentStats, CreatePaymentDto, PaymentStatus } from '../../models/payment.model';
import { SlugService } from '../slug.service';

@Injectable({
  providedIn: 'root',
})
export class TenantPaymentService {
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
    const endpoint = this.slugService.buildApiEndpoint('tenant/payments');
    return `${environment.apiUrl}${endpoint}`;
  }

  /**
   * Cargar historial de pagos del inquilino
   * GET /:slug/tenant/payments
   */
  loadPayments(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<Payment[]>(this.getBaseUrl())
      .pipe(
        tap((payments) => {
          this.paymentsSignal.set(payments);
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.errorSignal.set(error.error?.message || 'Error al cargar los pagos');
          this.isLoadingSignal.set(false);
          console.error('Error loading payments:', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Cargar estadísticas de pagos
   * GET /:slug/tenant/payments/stats
   */
  loadStats(): void {
    const endpoint = this.slugService.buildApiEndpoint('tenant/payments/stats');
    this.http
      .get<PaymentStats>(`${environment.apiUrl}${endpoint}`)
      .pipe(
        tap((stats) => {
          this.statsSignal.set(stats);
        }),
        catchError((error) => {
          console.error('Error loading payment stats:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Registrar un nuevo pago
   * POST /:slug/tenant/payments
   */
  createPayment(payment: CreatePaymentDto): Observable<Payment> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    // Formatear la fecha si es un objeto Date
    const formattedPayment = {
      ...payment,
      payment_date:
        payment.payment_date instanceof Date
          ? payment.payment_date.toISOString().split('T')[0]
          : payment.payment_date,
    };

    return this.http.post<Payment>(this.getBaseUrl(), formattedPayment).pipe(
      tap((newPayment) => {
        this.paymentsSignal.update((payments) => [newPayment, ...payments]);
        this.isLoadingSignal.set(false);

        // Recargar stats
        this.loadStats();
      }),
      catchError((error) => {
        this.errorSignal.set(error.error?.message || 'Error al registrar el pago');
        this.isLoadingSignal.set(false);
        throw error;
      }),
    );
  }

  /**
   * Obtener un pago específico
   * GET /:slug/tenant/payments/:id
   */
  getPayment(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.getBaseUrl()}/${id}`).pipe(
      tap((payment) => {
        // Actualizar en la lista si existe
        this.paymentsSignal.update((payments) =>
          payments.map((p) => (p.id === payment.id ? payment : p)),
        );
      }),
      catchError((error) => {
        console.error('Error loading payment:', error);
        throw error;
      }),
    );
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
