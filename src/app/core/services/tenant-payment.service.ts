import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentSchedule, PaymentStats, CreatePaymentDto } from '../models/payment.model';

@Injectable({
    providedIn: 'root'
})
export class TenantPaymentService {
    private http = inject(HttpClient);
    
    // Reactive state
    private paymentsSignal = signal<Payment[]>([]);
    private scheduleSignal = signal<PaymentSchedule[]>([]);
    private statsSignal = signal<PaymentStats | null>(null);
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    payments = this.paymentsSignal.asReadonly();
    schedule = this.scheduleSignal.asReadonly();
    stats = this.statsSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();

    // Computed values
    pendingPayments = computed(() => 
        this.paymentsSignal().filter(p => p.status === 'PENDING')
    );
    
    completedPayments = computed(() => 
        this.paymentsSignal().filter(p => p.status === 'COMPLETED')
    );

    /**
     * Cargar historial de pagos del inquilino
     */
    loadPayments(): void {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        this.http.get<Payment[]>(`${environment.apiUrl}/tenant/payments`)
            .pipe(
                tap(payments => {
                    // Convertir fechas de string a Date
                    const parsedPayments = payments.map(p => ({
                        ...p,
                        due_date: new Date(p.due_date),
                        payment_date: p.payment_date ? new Date(p.payment_date) : undefined,
                        created_at: new Date(p.created_at),
                        updated_at: new Date(p.updated_at)
                    }));
                    this.paymentsSignal.set(parsedPayments);
                    this.isLoadingSignal.set(false);
                }),
                catchError(error => {
                    this.errorSignal.set('Error al cargar los pagos');
                    this.isLoadingSignal.set(false);
                    console.error('Error loading payments:', error);
                    return of([]);
                })
            )
            .subscribe();
    }

    /**
     * Cargar calendario de pagos programados
     */
    loadSchedule(): void {
        this.http.get<PaymentSchedule[]>(`${environment.apiUrl}/tenant/payment-schedule`)
            .pipe(
                tap(schedule => {
                    const parsedSchedule = schedule.map(s => ({
                        ...s,
                        due_date: new Date(s.due_date)
                    }));
                    this.scheduleSignal.set(parsedSchedule);
                }),
                catchError(error => {
                    console.error('Error loading payment schedule:', error);
                    return of([]);
                })
            )
            .subscribe();
    }

    /**
     * Cargar estadísticas de pagos
     */
    loadStats(): void {
        this.http.get<PaymentStats>(`${environment.apiUrl}/tenant/payment-stats`)
            .pipe(
                tap(stats => {
                    const parsedStats = {
                        ...stats,
                        next_payment_date: stats.next_payment_date ? new Date(stats.next_payment_date) : undefined
                    };
                    this.statsSignal.set(parsedStats);
                }),
                catchError(error => {
                    console.error('Error loading payment stats:', error);
                    return of(null);
                })
            )
            .subscribe();
    }

    /**
     * Registrar un nuevo pago
     */
    createPayment(payment: CreatePaymentDto): Observable<Payment> {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        return this.http.post<Payment>(`${environment.apiUrl}/tenant/payments`, payment)
            .pipe(
                tap(newPayment => {
                    const parsedPayment = {
                        ...newPayment,
                        due_date: new Date(newPayment.due_date),
                        payment_date: newPayment.payment_date ? new Date(newPayment.payment_date) : undefined,
                        created_at: new Date(newPayment.created_at),
                        updated_at: new Date(newPayment.updated_at)
                    };
                    this.paymentsSignal.update(payments => [parsedPayment, ...payments]);
                    this.isLoadingSignal.set(false);
                    
                    // Recargar stats
                    this.loadStats();
                }),
                catchError(error => {
                    this.errorSignal.set(error.error?.message || 'Error al registrar el pago');
                    this.isLoadingSignal.set(false);
                    throw error;
                })
            );
    }

    /**
     * Obtener un pago específico
     */
    getPayment(id: number): Observable<Payment> {
        return this.http.get<Payment>(`${environment.apiUrl}/tenant/payments/${id}`)
            .pipe(
                tap(payment => {
                    const parsedPayment = {
                        ...payment,
                        due_date: new Date(payment.due_date),
                        payment_date: payment.payment_date ? new Date(payment.payment_date) : undefined,
                        created_at: new Date(payment.created_at),
                        updated_at: new Date(payment.updated_at)
                    };
                    
                    // Actualizar en la lista si existe
                    this.paymentsSignal.update(payments => 
                        payments.map(p => p.id === parsedPayment.id ? parsedPayment : p)
                    );
                }),
                catchError(error => {
                    console.error('Error loading payment:', error);
                    throw error;
                })
            );
    }

    /**
     * Descargar recibo de pago
     */
    downloadReceipt(paymentId: number): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}/tenant/payments/${paymentId}/receipt`, {
            responseType: 'blob'
        });
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.errorSignal.set(null);
    }
}
