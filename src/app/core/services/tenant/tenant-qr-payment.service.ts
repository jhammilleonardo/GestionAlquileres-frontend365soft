import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import {
  QrPayment,
  QrPaymentStatus,
  GenerateQrPaymentDto,
  VerifyQrDto,
} from '../../models/payment.model';
import { SlugService } from '../slug.service';

@Injectable({
  providedIn: 'root',
})
export class TenantQrPaymentService {
  private http = inject(HttpClient);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  // ── Reactive state ──────────────────────────────────────────────────────
  private qrListSignal = signal<QrPayment[]>([]);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private activeQrSignal = signal<QrPayment | null>(null);

  // ── Public readonly signals ─────────────────────────────────────────────
  qrList = this.qrListSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  activeQr = this.activeQrSignal.asReadonly();

  // ── Helpers ─────────────────────────────────────────────────────────────
  private buildUrl(path = ''): string {
    const endpoint = this.slugService.buildApiEndpoint(`tenant/qr-payments${path}`);
    return `${environment.apiUrl}${endpoint}`;
  }

  // ── API Methods ─────────────────────────────────────────────────────────

  /**
   * GET /:slug/tenant/qr-payments
   * Listar todos los QR del inquilino
   */
  loadQrList(): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<QrPayment[]>(this.buildUrl())
      .pipe(
        tap((list) => {
          this.qrListSignal.set(list);
          this.isLoadingSignal.set(false);
        }),
        catchError((err) => {
          this.errorSignal.set(
            err.error?.message || this.transloco.translate('common.errors.loadQR'),
          );
          this.isLoadingSignal.set(false);
          return [];
        }),
      )
      .subscribe();
  }

  /**
   * POST /:slug/tenant/qr-payments
   * Generar un nuevo QR de pago
   */
  generateQr(dto: GenerateQrPaymentDto): Observable<QrPayment> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<QrPayment>(this.buildUrl(), dto).pipe(
      tap((qr) => {
        this.activeQrSignal.set(qr);
        this.qrListSignal.update((list) => [qr, ...list]);
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        const msg = err.error?.message || 'Error al generar el QR';
        this.errorSignal.set(msg);
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(msg));
      }),
    );
  }

  /**
   * POST /:slug/tenant/qr-payments/verificar
   * Verificar el estado de un QR (usado para polling)
   */
  verifyQr(dto: VerifyQrDto): Observable<QrPayment> {
    return this.http.post<QrPayment>(this.buildUrl('/verificar'), dto).pipe(
      tap((qr) => {
        // Actualizar la lista y el QR activo
        this.qrListSignal.update((list) => list.map((q) => (q.id === qr.id ? qr : q)));
        if (this.activeQrSignal()?.id === qr.id) {
          this.activeQrSignal.set(qr);
        }
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * POST /:slug/tenant/qr-payments/:id/cancelar
   * Cancelar un QR pendiente
   */
  cancelQr(id: number): Observable<QrPayment> {
    return this.http.post<QrPayment>(this.buildUrl(`/${id}/cancelar`), {}).pipe(
      tap((qr) => {
        this.qrListSignal.update((list) => list.map((q) => (q.id === id ? qr : q)));
        if (this.activeQrSignal()?.id === id) {
          this.activeQrSignal.set(qr);
        }
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /** Limpiar error */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /** Limpiar QR activo (al salir del diálogo de pago) */
  clearActiveQr(): void {
    this.activeQrSignal.set(null);
  }

  /** Estatus finales que dejan de necesitar polling */
  isTerminalStatus(status: QrPaymentStatus): boolean {
    return (
      status === QrPaymentStatus.PAGADO ||
      status === QrPaymentStatus.EXPIRADO ||
      status === QrPaymentStatus.CANCELADO
    );
  }
}
