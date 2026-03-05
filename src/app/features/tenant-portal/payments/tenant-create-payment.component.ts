import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { LucideAngularModule, ArrowLeft, CreditCard, AlertCircle, CheckCircle2, FileText, Home, Calendar, Landmark, Info, QrCode, RefreshCw, XCircle, Clock, Download, CalendarDays, ChevronDown, ChevronUp, CheckCheck, TriangleAlert } from 'lucide-angular';
import { TenantPaymentService } from '../../../core/services/tenant-payment.service';
import { TenantQrPaymentService } from '../../../core/services/tenant-qr-payment.service';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantContractService } from '../../../core/services/tenant-contract.service';
import { PaymentType, PaymentMethod, Currency, PaymentTypeLabels, PaymentMethodLabels, CurrencyLabels, CurrencySymbols, QrPayment, QrPaymentStatus, PaymentStatus } from '../../../core/models/payment.model';

interface PaymentScheduleItem {
    label: string;
    year: number;
    month: number;
    dueDate: Date;
    amount: number;
    currency: string;
    status: 'paid' | 'overdue' | 'current' | 'upcoming';
    statusLabel: string;
}

@Component({
    selector: 'app-tenant-create-payment',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        LucideAngularModule
    ],
    template: `
        <div class="create-payment-container">
            <div class="page-header">
                <button mat-icon-button (click)="goBack()" class="back-btn">
                    <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
                </button>
                <div>
                    <h1>Registrar Pago</h1>
                    <p>Completa la información de tu pago</p>
                </div>
            </div>

            <!-- Resumen del Contrato -->
            @if (contractService.isLoading()) {
                <mat-card class="contract-summary-card loading">
                    <mat-spinner diameter="32"></mat-spinner>
                    <span>Cargando datos del contrato...</span>
                </mat-card>
            } @else if (contractService.currentContract(); as c) {
                <mat-card class="contract-summary-card">
                    <div class="summary-header">
                        <span class="summary-icon">
                            <lucide-icon [img]="FileText" [size]="16"></lucide-icon>
                        </span>
                        <h2>Lo que debes pagar según tu contrato</h2>
                        <span class="contract-number">{{ c.contract_number }}</span>
                    </div>
                    <div class="summary-grid">
                        <!-- Propiedad -->
                        <div class="summary-item">
                            <span class="icon-wrap">
                                <lucide-icon [img]="Home" [size]="16"></lucide-icon>
                            </span>
                            <div>
                                <span class="summary-label">Propiedad</span>
                                <span class="summary-value">{{ c.property?.title || 'Propiedad' }}</span>
                            </div>
                        </div>

                        <!-- Renta mensual -->
                        <div class="summary-item highlight">
                            <span class="icon-wrap">
                                <lucide-icon [img]="CreditCard" [size]="16"></lucide-icon>
                            </span>
                            <div>
                                <span class="summary-label">Renta mensual</span>
                                <span class="summary-value amount">
                                    {{ c.currency || 'USD' }} {{ c.monthly_rent | number:'1.2-2' }}
                                </span>
                            </div>
                        </div>

                        <!-- Día de pago -->
                        @if (c.payment_day) {
                            <div class="summary-item">
                                <span class="icon-wrap">
                                    <lucide-icon [img]="Calendar" [size]="16"></lucide-icon>
                                </span>
                                <div>
                                    <span class="summary-label">Día de pago</span>
                                    <span class="summary-value">Día {{ c.payment_day }} de cada mes</span>
                                </div>
                            </div>
                        }

                        <!-- Método de pago pactado -->
                        @if (c.payment_method) {
                            <div class="summary-item">
                                <span class="icon-wrap">
                                    <lucide-icon [img]="Info" [size]="16"></lucide-icon>
                                </span>
                                <div>
                                    <span class="summary-label">Método pactado</span>
                                    <span class="summary-value">{{ c.payment_method }}</span>
                                </div>
                            </div>
                        }

                        <!-- Datos bancarios del propietario -->
                        @if (c.bank_name) {
                            <div class="summary-item bank-info">
                                <span class="icon-wrap">
                                    <lucide-icon [img]="Landmark" [size]="16"></lucide-icon>
                                </span>
                                <div>
                                    <span class="summary-label">Banco destino (propietario)</span>
                                    <span class="summary-value">{{ c.bank_name }}</span>
                                    @if (c.bank_account_holder) {
                                        <span class="summary-sub">Titular: {{ c.bank_account_holder }}</span>
                                    }
                                    @if (c.bank_account_number) {
                                        <span class="summary-sub">Cuenta: {{ c.bank_account_number }}</span>
                                    }
                                    @if (c.bank_account_type) {
                                        <span class="summary-sub">Tipo: {{ c.bank_account_type }}</span>
                                    }
                                </div>
                            </div>
                        }

                        <!-- Días de gracia / mora -->
                        @if (c.grace_days || c.late_fee_percentage) {
                            <div class="summary-item warning">
                                <span class="icon-wrap">
                                    <lucide-icon [img]="AlertCircle" [size]="16"></lucide-icon>
                                </span>
                                <div>
                                    <span class="summary-label">Penalidad por mora</span>
                                    <span class="summary-value">
                                        @if (c.grace_days) { {{ c.grace_days }} días de gracia · }
                                        @if (c.late_fee_percentage) { {{ c.late_fee_percentage }}% de recargo }
                                    </span>
                                </div>
                            </div>
                        }
                    </div>
                </mat-card>
            }

            <!-- ============ Calendario de Pagos ============ -->
            @if (contractService.isLoading()) {
                <mat-card class="calendar-card loading-cal">
                    <mat-spinner diameter="28"></mat-spinner>
                    <span>Cargando calendario...</span>
                </mat-card>
            } @else if (paymentSchedule().length > 0) {
                <mat-card class="calendar-card">
                    <div class="calendar-header" (click)="calendarExpanded.set(!calendarExpanded())">
                        <div class="calendar-title">
                            <lucide-icon [img]="CalendarDays" [size]="20" class="cal-icon"></lucide-icon>
                            <h2>Calendario de Pagos</h2>
                            <span class="cal-badge">{{ paymentSchedule().length }} cuotas</span>
                        </div>
                        <!-- Stepper inline -->
                        <div class="cal-stepper">
                            @for (item of paymentSchedule(); track item.label; let last = $last) {
                                <div class="cal-step-item">
                                    <div class="cal-step-circle cal-step-{{ item.status }}" [title]="item.label">
                                        @if (item.status === 'paid') {
                                            <lucide-icon [img]="CheckCheck" [size]="9"></lucide-icon>
                                        }
                                    </div>
                                    @if (!last) {
                                        <div class="cal-step-line cal-step-line-{{ item.status }}"></div>
                                    }
                                </div>
                            }
                            <span class="cal-stepper-label">{{ paidCount() }}/{{ paymentSchedule().length }}</span>
                        </div>
                        <button mat-icon-button type="button" class="cal-toggle-btn">
                            @if (calendarExpanded()) {
                                <lucide-icon [img]="ChevronUp" [size]="20"></lucide-icon>
                            } @else {
                                <lucide-icon [img]="ChevronDown" [size]="20"></lucide-icon>
                            }
                        </button>
                    </div>

                    @if (calendarExpanded()) {
                        <mat-divider></mat-divider>

                        <div class="cal-legend">
                            <span class="legend-item paid"><span class="legend-dot"></span>Pagado</span>
                            <span class="legend-item current"><span class="legend-dot"></span>Este mes</span>
                            <span class="legend-item overdue"><span class="legend-dot"></span>Pendiente</span>
                            <span class="legend-item upcoming"><span class="legend-dot"></span>Próximo</span>
                        </div>

                        <div class="cal-scroll-container">
                            <div class="cal-track">
                                @for (item of paymentSchedule(); track item.label) {
                                    <div class="cal-item cal-{{ item.status }}">
                                        <div class="cal-item-body">
                                            <div class="cal-month">{{ item.label }}</div>
                                            <div class="cal-due">Vence día {{ item.dueDate.getDate() }}</div>
                                            <div class="cal-amount">{{ item.currency }}&nbsp;{{ item.amount | number:'1.2-2' }}</div>
                                            <div class="cal-status-row">
                                                @switch (item.status) {
                                                    @case ('paid') {
                                                        <lucide-icon [img]="CheckCheck" [size]="11"></lucide-icon>
                                                    }
                                                    @case ('current') {
                                                        <lucide-icon [img]="CreditCard" [size]="11"></lucide-icon>
                                                    }
                                                    @case ('overdue') {
                                                        <lucide-icon [img]="TriangleAlert" [size]="11"></lucide-icon>
                                                    }
                                                    @case ('upcoming') {
                                                        <lucide-icon [img]="Clock" [size]="11"></lucide-icon>
                                                    }
                                                }
                                                <span class="cal-status-badge">{{ item.statusLabel }}</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                </mat-card>
            }

            @if (paymentService.error()) {
                <div class="error-alert">
                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                    <span>{{ paymentService.error() }}</span>
                </div>
            }
            @if (qrError()) {
                <div class="error-alert">
                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                    <span>{{ qrError() }}</span>
                </div>
            }

            <!-- QR confirmado -->
            @if (qrService.activeQr()?.status === QrStatus.PAGADO) {
                <mat-card class="success-card">
                    <lucide-icon [img]="CheckCircle2" [size]="48" class="success-icon"></lucide-icon>
                    <h2>¡Pago QR Confirmado!</h2>
                    <p>
                        Tu pago por
                        <strong>{{ currencySymbol(qrService.activeQr()!.currency) }}{{ qrService.activeQr()!.amount | number:'1.2-2' }}</strong>
                        fue procesado automáticamente.
                    </p>
                    @if (qrService.activeQr()?.transaction_id) {
                        <span class="tx-badge">TXN: {{ qrService.activeQr()!.transaction_id }}</span>
                    }
                    <div class="success-actions">
                        <button mat-raised-button color="primary" (click)="goBack()">Volver a Pagos</button>
                        <button mat-stroked-button (click)="resetForm()">Nuevo Pago</button>
                    </div>
                </mat-card>
            } @else if (success()) {
                <mat-card class="success-card">
                    <lucide-icon [img]="CheckCircle2" [size]="48" class="success-icon"></lucide-icon>
                    <h2>¡Pago Registrado!</h2>
                    <p>Tu pago ha sido registrado exitosamente y está pendiente de aprobación.</p>
                    <div class="success-actions">
                        <button mat-raised-button color="primary" (click)="goBack()">Volver a Pagos</button>
                        <button mat-stroked-button (click)="resetForm()">Registrar Otro Pago</button>
                    </div>
                </mat-card>
            } @else {
                <mat-card class="form-card">
                    <!-- Header del formulario -->
                    <div class="form-card-header">
                        <span class="form-card-header-icon">
                            <lucide-icon [img]="CreditCard" [size]="16"></lucide-icon>
                        </span>
                        <span>Registrar Pago</span>
                    </div>

                    <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="form-body">

                        <!-- Sección 1: Información del Pago -->
                        <div class="form-section">
                            <div class="section-title">
                                <span class="section-title-accent"></span>
                                <lucide-icon [img]="CreditCard" [size]="15"></lucide-icon>
                                Información del Pago
                            </div>

                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Tipo de Pago*</mat-label>
                                <mat-select formControlName="payment_type" required>
                                    @for (type of paymentTypes; track type.value) {
                                        <mat-option [value]="type.value">{{ type.label }}</mat-option>
                                    }
                                </mat-select>
                                @if (paymentForm.get('payment_type')?.hasError('required') && paymentForm.get('payment_type')?.touched) {
                                    <mat-error>El tipo de pago es requerido</mat-error>
                                }
                            </mat-form-field>

                            <div class="form-row">
                                <mat-form-field appearance="outline">
                                    <mat-label>Monto*</mat-label>
                                    <span matTextPrefix>Bs&nbsp;</span>
                                    <input matInput type="number" formControlName="amount"
                                           placeholder="0.00" step="0.01" min="0" required>
                                    @if (paymentForm.get('amount')?.hasError('required') && paymentForm.get('amount')?.touched) {
                                        <mat-error>El monto es requerido</mat-error>
                                    }
                                    @if (paymentForm.get('amount')?.hasError('min')) {
                                        <mat-error>El monto debe ser mayor a 0</mat-error>
                                    }
                                </mat-form-field>

                                <mat-form-field appearance="outline">
                                    <mat-label>Moneda*</mat-label>
                                    <mat-select formControlName="currency" required>
                                        @for (curr of currencies; track curr.value) {
                                            <mat-option [value]="curr.value">
                                                {{ curr.symbol }} - {{ curr.label }}
                                            </mat-option>
                                        }
                                    </mat-select>
                                    @if (paymentForm.get('currency')?.hasError('required') && paymentForm.get('currency')?.touched) {
                                        <mat-error>La moneda es requerida</mat-error>
                                    }
                                </mat-form-field>
                            </div>

                            <div class="form-row">
                                <mat-form-field appearance="outline">
                                    <mat-label>Método de Pago*</mat-label>
                                    <mat-select formControlName="payment_method" required>
                                        @for (method of paymentMethods; track method.value) {
                                            <mat-option [value]="method.value">{{ method.label }}</mat-option>
                                        }
                                    </mat-select>
                                    @if (paymentForm.get('payment_method')?.hasError('required') && paymentForm.get('payment_method')?.touched) {
                                        <mat-error>El método de pago es requerido</mat-error>
                                    }
                                </mat-form-field>

                                @if (!isQrMethod()) {
                                    <mat-form-field appearance="outline">
                                        <mat-label>Fecha de Pago*</mat-label>
                                        <input matInput [matDatepicker]="picker" formControlName="payment_date"
                                               [max]="maxDate" required>
                                        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                                        <mat-datepicker #picker></mat-datepicker>
                                        @if (paymentForm.get('payment_date')?.hasError('required') && paymentForm.get('payment_date')?.touched) {
                                            <mat-error>La fecha es requerida</mat-error>
                                        }
                                    </mat-form-field>
                                }
                            </div>
                        </div>

                        <!-- ══ Sección QR ══ -->
                        @if (isQrMethod()) {
                            <div class="form-section last">
                                <div class="qr-info-banner">
                                    <lucide-icon [img]="QrCode" [size]="18"></lucide-icon>
                                    <span>Compatible con <strong>MC4 / SIP Bolivia</strong>. Escanéalo desde cualquier app bancaria que soporte QR interbancario.</span>
                                </div>

                                @if (qrService.activeQr()?.status === QrStatus.EXPIRADO || qrService.activeQr()?.status === QrStatus.CANCELADO) {
                                    <div class="qr-result-msg expired">
                                        <lucide-icon [img]="XCircle" [size]="20"></lucide-icon>
                                        <span>El QR {{ qrService.activeQr()!.status === QrStatus.EXPIRADO ? 'expiró' : 'fue cancelado' }}. Genera uno nuevo.</span>
                                        <button mat-stroked-button type="button" (click)="resetQr()">Intentar de nuevo</button>
                                    </div>
                                }

                                @if (qrService.activeQr()?.status === QrStatus.PENDIENTE) {
                                    <div class="qr-active-section">
                                        <div class="qr-amount-row">
                                            <span class="qr-amount-label">Total a pagar</span>
                                            <span class="qr-amount-value">
                                                {{ currencySymbol(qrService.activeQr()!.currency) }}{{ qrService.activeQr()!.amount | number:'1.2-2' }}
                                                <small>{{ qrService.activeQr()!.currency }}</small>
                                            </span>
                                            <span class="qr-pending-chip">
                                                <lucide-icon [img]="Clock" [size]="13"></lucide-icon>
                                                Esperando pago...
                                            </span>
                                        </div>
                                        <div class="qr-image-wrapper">
                                            @if (qrSafeUrl()) {
                                                <img [src]="qrSafeUrl()!" alt="Código QR de pago" class="qr-image">
                                            } @else {
                                                <div class="qr-placeholder">
                                                    <lucide-icon [img]="QrCode" [size]="72"></lucide-icon>
                                                    <span>Generando QR...</span>
                                                </div>
                                            }
                                        </div>
                                        <div class="qr-steps">
                                            <div class="step"><span class="step-no">1</span>Abre tu app bancaria</div>
                                            <div class="step"><span class="step-no">2</span>Selecciona <strong>Pagar con QR</strong></div>
                                            <div class="step"><span class="step-no">3</span>Escanea y confirma el pago</div>
                                            <div class="step"><span class="step-no">4</span>Esta pantalla se actualiza sola</div>
                                        </div>
                                        @if (qrService.activeQr()?.expires_at) {
                                            <div class="qr-expires">
                                                <lucide-icon [img]="Clock" [size]="13"></lucide-icon>
                                                Vence: {{ formatDate(qrService.activeQr()!.expires_at!) }}
                                                <span class="poll-label">· Verificando cada 5s</span>
                                            </div>
                                        }
                                        <div class="qr-active-actions">
                                            <button mat-stroked-button type="button" (click)="manualVerify()" [disabled]="qrPolling()">
                                                @if (qrPolling()) { <mat-spinner diameter="16"></mat-spinner> }
                                                @else { <lucide-icon [img]="RefreshCw" [size]="16"></lucide-icon> }
                                                Verificar ahora
                                            </button>
                                            @if (qrSafeUrl()) {
                                                <button mat-stroked-button type="button" (click)="downloadQr()">
                                                    <lucide-icon [img]="Download" [size]="16"></lucide-icon>
                                                    Descargar QR
                                                </button>
                                            }
                                            <button mat-stroked-button color="warn" type="button" (click)="onCancelQr()" [disabled]="qrCancelling()">
                                                @if (qrCancelling()) { <mat-spinner diameter="16"></mat-spinner> }
                                                @else { <lucide-icon [img]="XCircle" [size]="16"></lucide-icon> }
                                                Cancelar QR
                                            </button>
                                        </div>
                                    </div>
                                }

                                @if (!qrService.activeQr()) {
                                    <div class="form-actions">
                                        <button type="submit" mat-raised-button color="primary"
                                                [disabled]="paymentForm.get('amount')?.invalid || qrService.isLoading()">
                                            @if (qrService.isLoading()) {
                                                <mat-spinner diameter="20"></mat-spinner> Generando QR...
                                            } @else {
                                                <lucide-icon [img]="QrCode" [size]="20"></lucide-icon> Generar QR de Pago
                                            }
                                        </button>
                                        <button type="button" mat-stroked-button (click)="goBack()">Cancelar</button>
                                    </div>
                                }
                            </div>
                        }

                        <!-- Sección 2: Datos del Método (solo métodos no-QR) -->
                        @if (!isQrMethod() && (paymentForm.get('payment_method')?.value === PaymentMethod.CREDIT_CARD ||
                             paymentForm.get('payment_method')?.value === PaymentMethod.DEBIT_CARD ||
                             paymentForm.get('payment_method')?.value === PaymentMethod.CHECK ||
                             paymentForm.get('payment_method')?.value === PaymentMethod.TRANSFER ||
                             paymentForm.get('payment_method')?.value === PaymentMethod.WIRE_TRANSFER ||
                             paymentForm.get('payment_method')?.value === PaymentMethod.CASH)) {
                            <div class="form-section">
                                <div class="section-title">
                                    <span class="section-title-accent"></span>
                                    <lucide-icon [img]="Landmark" [size]="15"></lucide-icon>
                                    Datos del Método
                                </div>

                                <!-- Tarjeta de Crédito/Débito -->
                                @if (paymentForm.get('payment_method')?.value === PaymentMethod.CREDIT_CARD ||
                                     paymentForm.get('payment_method')?.value === PaymentMethod.DEBIT_CARD) {
                                    <div class="form-row">
                                        <mat-form-field appearance="outline">
                                            <mat-label>Últimos 4 dígitos</mat-label>
                                            <input matInput formControlName="card_last_4_digits"
                                                   placeholder="1234" maxlength="4" pattern="[0-9]{4}">
                                            <mat-hint>Dígitos de la tarjeta</mat-hint>
                                        </mat-form-field>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Nombre del Titular</mat-label>
                                            <input matInput formControlName="card_holder_name"
                                                   placeholder="Juan Pérez">
                                        </mat-form-field>
                                    </div>

                                    <div class="form-row">
                                        <mat-form-field appearance="outline">
                                            <mat-label>Fecha de Expiración</mat-label>
                                            <input matInput formControlName="card_expiry"
                                                   placeholder="MM/YY" maxlength="5">
                                            <mat-hint>Formato: MM/YY</mat-hint>
                                        </mat-form-field>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Código de Autorización (Opcional)</mat-label>
                                            <input matInput formControlName="reference_number"
                                                   placeholder="Ej: AUTH-123456">
                                        </mat-form-field>
                                    </div>
                                }

                                <!-- Cheque -->
                                @if (paymentForm.get('payment_method')?.value === PaymentMethod.CHECK) {
                                    <div class="form-row">
                                        <mat-form-field appearance="outline">
                                            <mat-label>Número de Cheque</mat-label>
                                            <input matInput formControlName="check_number"
                                                   placeholder="Ej: CHK-001">
                                        </mat-form-field>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Banco Emisor</mat-label>
                                            <input matInput formControlName="bank_name"
                                                   placeholder="Banco Nacional">
                                        </mat-form-field>
                                    </div>

                                    <mat-form-field appearance="outline" class="full-width">
                                        <mat-label>Últimos 4 dígitos cuenta</mat-label>
                                        <input matInput formControlName="bank_account_last_4"
                                               placeholder="5678" maxlength="4">
                                    </mat-form-field>
                                }

                                <!-- Transferencia -->
                                @if (paymentForm.get('payment_method')?.value === PaymentMethod.TRANSFER ||
                                     paymentForm.get('payment_method')?.value === PaymentMethod.WIRE_TRANSFER) {
                                    <mat-form-field appearance="outline" class="full-width">
                                        <mat-label>Número de Referencia</mat-label>
                                        <input matInput formControlName="reference_number"
                                               placeholder="Ej: TRF-12345">
                                        <mat-hint>Número de transacción bancaria</mat-hint>
                                    </mat-form-field>

                                    <div class="form-row">
                                        <mat-form-field appearance="outline">
                                            <mat-label>Banco de Origen</mat-label>
                                            <input matInput formControlName="bank_name"
                                                   placeholder="Tu banco">
                                        </mat-form-field>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Últimos 4 dígitos cuenta</mat-label>
                                            <input matInput formControlName="bank_account_last_4"
                                                   placeholder="9012" maxlength="4">
                                        </mat-form-field>
                                    </div>
                                }

                                <!-- Efectivo -->
                                @if (paymentForm.get('payment_method')?.value === PaymentMethod.CASH) {
                                    <div class="form-row">
                                        <mat-form-field appearance="outline">
                                            <mat-label>Recibido por</mat-label>
                                            <input matInput formControlName="received_by"
                                                   placeholder="Nombre de quien recibió">
                                            <mat-hint>Persona que recibió el pago</mat-hint>
                                        </mat-form-field>

                                        <mat-form-field appearance="outline">
                                            <mat-label>Número de Recibo (Opcional)</mat-label>
                                            <input matInput formControlName="reference_number"
                                                   placeholder="Ej: REC-001">
                                        </mat-form-field>
                                    </div>
                                }
                            </div>
                        }

                        <!-- Sección 3: Notas (solo métodos no-QR) -->
                        @if (!isQrMethod()) {
                        <div class="form-section last">
                            <div class="section-title">
                                <span class="section-title-accent"></span>
                                <lucide-icon [img]="FileText" [size]="15"></lucide-icon>
                                Notas Adicionales
                            </div>

                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Notas del Pago (Opcional)</mat-label>
                                <textarea matInput formControlName="notes" rows="3" maxlength="500"
                                          placeholder="Información adicional sobre el pago..."></textarea>
                                <mat-hint align="end">
                                    {{ paymentForm.get('notes')?.value?.length || 0 }} / 500
                                </mat-hint>
                            </mat-form-field>
                        </div>

                        <div class="form-actions">
                            <button type="submit" mat-raised-button color="primary"
                                    [disabled]="paymentForm.invalid || paymentService.isLoading()">
                                @if (paymentService.isLoading()) {
                                    <mat-spinner diameter="20"></mat-spinner>
                                    Registrando...
                                } @else {
                                    <lucide-icon [img]="CreditCard" [size]="20"></lucide-icon>
                                    Registrar Pago
                                }
                            </button>
                            <button type="button" mat-stroked-button (click)="goBack()"
                                    [disabled]="paymentService.isLoading()">
                                Cancelar
                            </button>
                        </div>
                        }
                    </form>
                </mat-card>
            }
        </div>
    `,
    styles: [`
        .create-payment-container {
            max-width: 800px;
            margin: 0 auto;
        }

        /* ---- QR inline ---- */
        .qr-info-banner {
            display: flex; align-items: flex-start; gap: 10px;
            background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
            padding: 12px 16px; margin-bottom: 20px;
            font-size: 0.85rem; color: #1e40af; line-height: 1.5;
        }
        .qr-info-banner lucide-icon { margin-top: 2px; flex-shrink: 0; color: #3b82f6; }

        .qr-result-msg {
            display: flex; align-items: center; gap: 12px;
            padding: 14px 16px; border-radius: 8px; margin-bottom: 16px;
        }
        .qr-result-msg.expired { background: #fee2e2; color: #dc2626; }
        .qr-result-msg button { margin-left: auto; }

        .qr-active-section { display: flex; flex-direction: column; align-items: center; }

        .qr-amount-row {
            display: flex; align-items: center; gap: 12px;
            width: 100%; margin-bottom: 20px; flex-wrap: wrap;
        }
        .qr-amount-label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .qr-amount-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .qr-amount-value small { font-size: 0.8rem; color: #64748b; margin-left: 4px; }
        .qr-pending-chip {
            display: flex; align-items: center; gap: 5px;
            padding: 4px 12px; border-radius: 999px;
            background: #fef3c7; color: #92400e;
            font-size: 0.78rem; font-weight: 600; margin-left: auto;
        }

        .qr-image-wrapper {
            position: relative; display: flex; justify-content: center; align-items: center;
            background: #f8fafc; border-radius: 12px; padding: 16px; width: 100%; margin-bottom: 20px;
            box-sizing: border-box;
        }
        .qr-image {
            width: 100%;
            max-width: 480px;
            height: auto;
            aspect-ratio: 1;
            border-radius: 10px;
            border: 3px solid #e2e8f0;
            display: block;
        }
        .qr-placeholder {
            width: 100%;
            max-width: 480px;
            aspect-ratio: 1;
            border: 3px dashed #cbd5e1; border-radius: 10px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 10px; color: #94a3b8;
        }
        .qr-steps { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-bottom: 16px; }
        .step { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; color: #475569; }
        .step-no {
            width: 22px; height: 22px; border-radius: 50%;
            background: var(--mat-sys-primary, #1976d2); color: white;
            font-size: 0.72rem; font-weight: 700;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .qr-expires {
            display: flex; align-items: center; gap: 6px;
            font-size: 0.78rem; color: #64748b; width: 100%; margin-bottom: 16px;
        }
        .poll-label { color: #94a3b8; font-size: 0.72rem; }

        .qr-active-actions {
            display: flex; gap: 12px; width: 100%;
            padding-top: 16px; border-top: 1px solid #e2e8f0;
        }
        .qr-active-actions button { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center; }

        .tx-badge {
            display: inline-block; font-family: monospace; font-size: 0.82rem;
            background: #f1f5f9; padding: 3px 10px; border-radius: 6px;
            margin-bottom: 20px; color: #475569;
        }

        /* ════════════════════════════════════
           RESUMEN DEL CONTRATO — Rediseño
           ════════════════════════════════════ */
        .contract-summary-card {
            margin-bottom: 24px;
            padding: 0;
            overflow: hidden;
            border: none !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(37,99,235,0.08) !important;
        }

        .contract-summary-card.loading {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 24px !important;
            color: #64748b;
            font-size: 0.9rem;
        }

        /* Header azul plano */
        .summary-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 24px;
            background: #2563eb;
            flex-wrap: wrap;
        }

        .summary-header h2 {
            font-size: 0.975rem;
            font-weight: 600;
            color: rgba(255,255,255,0.95);
            margin: 0;
            letter-spacing: 0.01em;
        }

        .summary-icon {
            color: rgba(255,255,255,0.9);
            flex-shrink: 0;
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            padding: 6px;
            display: flex;
        }

        .contract-number {
            margin-left: auto;
            font-size: 0.75rem;
            color: rgba(255,255,255,0.7);
            font-weight: 600;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.25);
            padding: 3px 10px;
            border-radius: 999px;
            letter-spacing: 0.03em;
        }

        /* Grid de items */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 0;
            padding: 16px;
            background: #ffffff;
            gap: 10px;
        }

        .summary-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 14px;
            background: #f8fafc;
            border-radius: 10px;
            border: 1px solid #f1f5f9;
            transition: box-shadow 0.15s;
        }

        .summary-item:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        /* Contenedor circular del ícono */
        .summary-item lucide-icon {
            flex-shrink: 0;
            margin-top: 1px;
        }

        /* Wrapper de ícono con fondo de color */
        .summary-item .icon-wrap {
            width: 34px; height: 34px;
            border-radius: 9px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            background: #e2e8f0;
            color: #475569;
        }

        /* Highlight (renta mensual) — azul plano */
        .summary-item.highlight {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
        }

        .summary-item.highlight .icon-wrap {
            background: #2563eb;
            color: white;
        }

        .summary-item.highlight .summary-value.amount {
            background: none;
        }

        .summary-item.bank-info {
            grid-column: 1 / -1;
            background: #f0f9ff;
            border-color: #bae6fd;
        }

        .summary-item.bank-info .icon-wrap {
            background: #0ea5e9;
            color: white;
        }

        .summary-item.warning {
            background: #fffbeb;
            border: 1px solid #fde68a;
        }

        .summary-item.warning .icon-wrap {
            background: #f59e0b;
            color: white;
        }

        /* Item genérico — ícono verde pizarra */
        .summary-item:not(.highlight):not(.bank-info):not(.warning) .icon-wrap {
            background: #e2e8f0;
            color: #64748b;
        }

        .summary-label {
            display: block;
            font-size: 0.68rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 700;
            margin-bottom: 3px;
        }

        .summary-value {
            display: block;
            font-size: 0.9rem;
            color: #1e293b;
            font-weight: 500;
            line-height: 1.3;
        }

        .summary-value.amount {
            font-size: 1.2rem;
            font-weight: 800;
            color: #1d4ed8;
            letter-spacing: -0.01em;
        }

        .summary-sub {
            display: block;
            font-size: 0.8rem;
            color: #64748b;
            margin-top: 2px;
        }

        /* ════════ Form Card ════════ */
        .form-card {
            padding: 0 !important;
            overflow: hidden;
            border: none !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(37,99,235,0.08) !important;
        }

        .form-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 24px;
            background: #2563eb;
            font-size: 0.975rem;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: 0.01em;
        }

        .form-card-header-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            padding: 6px;
            color: rgba(255,255,255,0.9);
        }

        .form-body {
            padding: 24px;
        }

        /* Secciones */
        .form-section {
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 1px solid #f1f5f9;
        }

        .form-section.last {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        /* Section title con acento */
        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 16px;
            letter-spacing: 0.01em;
        }

        .section-title-accent {
            display: block;
            width: 3px;
            height: 16px;
            background: #2563eb;
            border-radius: 99px;
            flex-shrink: 0;
        }

        .section-title lucide-icon {
            color: #2563eb;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }

        .form-row mat-form-field { width: 100%; }

        .full-width {
            width: 100%;
            display: block;
            margin-bottom: 16px;
        }

        .full-width:last-child { margin-bottom: 0; }

        .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            padding-top: 20px;
            border-top: 1px solid #f1f5f9;
            margin-top: 8px;
        }

        .form-actions button {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* ─── Page Header ─── */
        .page-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .back-btn {
            margin-right: 8px;
        }

        .page-header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .page-header p {
            color: #64748b;
            margin: 0;
        }

        .error-alert {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #fee2e2;
            color: #dc2626;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .success-card {
            padding: 48px;
            text-align: center;
        }

        .success-icon {
            color: #10b981;
            margin-bottom: 16px;
        }

        .success-card h2 {
            color: #1e293b;
            margin: 0 0 8px;
        }

        .success-card p {
            color: #64748b;
            margin: 0 0 24px;
        }

        .success-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
        }

        @media (max-width: 768px) {
            .form-row { grid-template-columns: 1fr; }
            .form-actions { flex-direction: column-reverse; }
            .form-actions button { width: 100%; justify-content: center; }
            .page-header h1 { font-size: 1.35rem; }
            .form-body { padding: 16px; }
            .success-card { padding: 32px; }
            .success-actions { flex-direction: column; }
            .success-actions button { width: 100%; }
            .qr-active-actions { flex-direction: column; }
            .qr-amount-row { flex-direction: column; align-items: flex-start; }
            .qr-pending-chip { margin-left: 0; }
        }

        @media (max-width: 480px) {
            .page-header {
                gap: 8px;
            }

            .page-header h1 {
                font-size: 1.25rem;
            }

            .success-card {
                padding: 24px;
            }

            .success-card h2 {
                font-size: 1.25rem;
            }

            .back-btn {
                margin-right: 4px;
            }
        }

        @media (max-width: 360px) {
            .form-card {
                padding: 16px;
            }

            .form-section {
                margin-bottom: 20px;
                padding-bottom: 20px;
            }
        }

        /* ════════════════════════════════════
           CALENDARIO DE PAGOS — Rediseño
           ════════════════════════════════════ */
        .calendar-card {
            margin-bottom: 24px;
            padding: 0;
            overflow: hidden;
            border: none !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(37,99,235,0.08) !important;
        }

        .loading-cal {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 20px !important;
            color: #64748b;
            font-size: 0.9rem;
        }

        .calendar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
            cursor: pointer;
            user-select: none;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.15s;
        }

        .calendar-header:hover { background: #f8fafc; }

        .calendar-title {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .calendar-title h2 {
            font-size: 0.975rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
        }

        .cal-icon {
            color: #2563eb;
            background: #dbeafe;
            border-radius: 8px;
            padding: 5px;
            display: flex;
        }

        .cal-badge {
            font-size: 0.72rem;
            background: #dbeafe;
            color: #1d4ed8;
            padding: 3px 9px;
            border-radius: 999px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }

        .cal-toggle-btn {
            width: 32px; height: 32px;
            background: #f1f5f9 !important;
            border-radius: 8px !important;
            color: #64748b;
        }

        /* Stepper inline en el header */
        .cal-stepper {
            display: flex;
            align-items: center;
            margin-left: auto;
            margin-right: 8px;
            gap: 0;
            overflow-x: auto;
            scrollbar-width: none;
            max-width: 260px;
        }
        .cal-stepper::-webkit-scrollbar { display: none; }

        .cal-step-item {
            display: flex;
            align-items: center;
        }

        .cal-step-circle {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: transform 0.15s;
            cursor: default;
        }

        .cal-step-circle:hover { transform: scale(1.25); }

        .cal-step-paid    { background: #10b981; color: white; }
        .cal-step-current { background: #2563eb; color: white; box-shadow: 0 0 0 3px #dbeafe; }
        .cal-step-overdue { background: #ef4444; color: white; }
        .cal-step-upcoming {
            background: #ffffff;
            border: 2px solid #e2e8f0;
            color: #cbd5e1;
        }

        .cal-step-line {
            width: 18px;
            height: 2px;
            flex-shrink: 0;
        }

        .cal-step-line-paid    { background: #10b981; }
        .cal-step-line-current { background: #dbeafe; }
        .cal-step-line-overdue { background: #fca5a5; }
        .cal-step-line-upcoming { background: #e2e8f0; }

        .cal-stepper-label {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 600;
            white-space: nowrap;
            flex-shrink: 0;
        }

        /* Leyenda */
        .cal-legend {
            display: flex;
            gap: 16px;
            padding: 10px 20px;
            background: #fafbfc;
            border-bottom: 1px solid #f1f5f9;
            flex-wrap: wrap;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 600;
        }

        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .legend-item.paid    .legend-dot { background: #10b981; }
        .legend-item.current .legend-dot { background: #2563eb; }
        .legend-item.overdue .legend-dot { background: #ef4444; }
        .legend-item.upcoming .legend-dot { background: #cbd5e1; }

        /* Track horizontal */
        .cal-scroll-container {
            overflow-x: auto;
            padding: 16px 20px 20px;
            background: #ffffff;
            scrollbar-width: thin;
            scrollbar-color: #e2e8f0 transparent;
        }

        .cal-track {
            display: flex;
            gap: 10px;
            min-width: max-content;
        }

        /* Tarjeta de mes */
        .cal-item {
            min-width: 120px;
            max-width: 120px;
            border-radius: 12px;
            padding: 0;
            display: flex;
            flex-direction: column;
            border: 1px solid transparent;
            transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
            background: #ffffff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .cal-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
            border-color: #10b981;
        }

        .cal-current { box-shadow: 0 0 0 2px #93c5fd; }

        /* Contenido interno */
        .cal-item-body {
            padding: 10px 11px 11px;
            display: flex;
            flex-direction: column;
            gap: 3px;
            flex: 1;
        }

        .cal-month {
            font-size: 0.82rem;
            font-weight: 800;
            text-transform: capitalize;
            letter-spacing: 0.01em;
        }

        .cal-due {
            font-size: 0.7rem;
            color: #94a3b8;
            font-weight: 500;
        }

        .cal-amount {
            font-size: 0.88rem;
            font-weight: 800;
            margin-top: 6px;
            letter-spacing: -0.01em;
        }

        /* Badge de estado */
        .cal-status-row {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 8px;
            padding: 3px 7px;
            border-radius: 999px;
            width: fit-content;
        }

        .cal-status-badge { font-size: 0.67rem; font-weight: 700; letter-spacing: 0.02em; }

        /* Colores por estado */
        .cal-paid .cal-month  { color: #065f46; }
        .cal-paid .cal-amount { color: #059669; }
        .cal-paid .cal-status-row { background: #d1fae5; color: #065f46; }

        .cal-current {
            box-shadow: 0 0 0 2px #93c5fd;
        }
        .cal-current .cal-month  { color: #1e3a8a; }
        .cal-current .cal-amount { color: #2563eb; }
        .cal-current .cal-status-row { background: #dbeafe; color: #1d4ed8; }

        .cal-overdue .cal-month  { color: #7f1d1d; }
        .cal-overdue .cal-amount { color: #dc2626; }
        .cal-overdue .cal-status-row { background: #fee2e2; color: #991b1b; }

        .cal-upcoming .cal-month  { color: #334155; }
        .cal-upcoming .cal-amount { color: #475569; }
        .cal-upcoming .cal-status-row { background: #f1f5f9; color: #64748b; }
    `]
})
export class TenantCreatePaymentComponent implements OnInit, OnDestroy {
    readonly ArrowLeft     = ArrowLeft;
    readonly CreditCard    = CreditCard;
    readonly AlertCircle   = AlertCircle;
    readonly CheckCircle2  = CheckCircle2;
    readonly FileText      = FileText;
    readonly Home          = Home;
    readonly Calendar      = Calendar;
    readonly Landmark      = Landmark;
    readonly Info          = Info;
    readonly QrCode        = QrCode;
    readonly RefreshCw     = RefreshCw;
    readonly XCircle       = XCircle;
    readonly Clock         = Clock;
    readonly Download      = Download;
    readonly CalendarDays  = CalendarDays;
    readonly ChevronDown   = ChevronDown;
    readonly ChevronUp     = ChevronUp;
    readonly CheckCheck    = CheckCheck;
    readonly TriangleAlert = TriangleAlert;

    private fb              = inject(FormBuilder);
    private router          = inject(Router);
    private slugService     = inject(SlugService);
    private sanitizer       = inject(DomSanitizer);
    paymentService          = inject(TenantPaymentService);
    qrService               = inject(TenantQrPaymentService);
    contractService         = inject(TenantContractService);
    private tenantAuthService = inject(TenantAuthService);

    success      = signal(false);
    maxDate      = new Date();
    qrPolling    = signal(false);
    qrCancelling = signal(false);
    qrError      = signal<string | null>(null);
    private qrPollTimer?: ReturnType<typeof setInterval>;

    calendarExpanded = signal(true);
    private paymentScheduleSignal = signal<PaymentScheduleItem[]>([]);
    paymentSchedule = this.paymentScheduleSignal.asReadonly();
    paidCount = computed(() => this.paymentSchedule().filter(i => i.status === 'paid').length);

    PaymentMethod = PaymentMethod;
    QrStatus      = QrPaymentStatus;

    isQrMethod(): boolean {
        return this.paymentForm.get('payment_method')?.value === PaymentMethod.QR_MC4;
    }

    qrSafeUrl = computed<SafeUrl | null>(() => {
        const qr = this.qrService.activeQr();
        if (!qr?.qr_image) return null;
        if (qr.qr_image.startsWith('http')) return this.sanitizer.bypassSecurityTrustUrl(qr.qr_image);
        const src = qr.qr_image.startsWith('data:') ? qr.qr_image : `data:image/png;base64,${qr.qr_image}`;
        return this.sanitizer.bypassSecurityTrustUrl(src);
    });

    paymentTypes = Object.keys(PaymentType).map(key => ({
        value: PaymentType[key as keyof typeof PaymentType],
        label: PaymentTypeLabels[PaymentType[key as keyof typeof PaymentType]]
    }));

    paymentMethods = Object.keys(PaymentMethod).map(key => ({
        value: PaymentMethod[key as keyof typeof PaymentMethod],
        label: PaymentMethodLabels[PaymentMethod[key as keyof typeof PaymentMethod]]
    }));

    currencies = Object.keys(Currency).map(key => ({
        value: Currency[key as keyof typeof Currency],
        label: CurrencyLabels[Currency[key as keyof typeof Currency]],
        symbol: CurrencySymbols[Currency[key as keyof typeof Currency]]
    }));

    paymentForm = this.fb.group({
        payment_type: [PaymentType.RENT, Validators.required],
        amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
        currency: [Currency.USD, Validators.required],
        payment_method: [PaymentMethod.TRANSFER, Validators.required],
        payment_date: [new Date(), Validators.required],
        reference_number: [''],
        check_number: [''],
        notes: ['', Validators.maxLength(500)],

        // Campos específicos por método de pago
        card_last_4_digits: [''],
        card_holder_name: [''],
        card_expiry: [''],
        bank_name: [''],
        bank_account_last_4: [''],
        received_by: ['']
    });

    ngOnInit(): void {
        this.qrService.clearActiveQr();
        if (!this.contractService.currentContract()) {
            this.contractService.loadCurrentContract();
        }
        this.paymentService.loadPayments();

        // Cuando el contrato está disponible, pre-rellenar monto, moneda y construir calendario
        const tryPrefill = () => {
            const contract = this.contractService.currentContract();
            if (contract) {
                const currencyValue = this.normalizeCurrency(contract.currency);
                const methodValue = this.normalizePaymentMethod(contract.payment_method);

                this.paymentForm.patchValue({
                    amount: typeof contract.monthly_rent === 'number'
                        ? contract.monthly_rent
                        : parseFloat(contract.monthly_rent as unknown as string) || null,
                    currency: currencyValue ?? Currency.USD,
                    payment_method: methodValue ?? PaymentMethod.TRANSFER
                });

                setTimeout(() => this.buildPaymentSchedule(contract), 200);
            } else {
                // Reintentar al siguiente frame si aún está cargando
                setTimeout(tryPrefill, 300);
            }
        };
        setTimeout(tryPrefill, 100);
    }

    private buildPaymentSchedule(contract: any): void {
        const start  = new Date(contract.start_date as unknown as string);
        const end    = new Date(contract.end_date   as unknown as string);
        const payDay = contract.payment_day || 1;
        const now    = new Date();
        const existing = this.paymentService.payments();

        const items: PaymentScheduleItem[] = [];
        let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        while (cursor <= endMonth) {
            const year  = cursor.getFullYear();
            const month = cursor.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            const dueDate = new Date(year, month, Math.min(payDay, lastDay));

            const isPaid = existing.some(p => {
                const pd = new Date(p.payment_date as string);
                return pd.getFullYear() === year && pd.getMonth() === month &&
                       p.payment_type === PaymentType.RENT &&
                       (p.status === PaymentStatus.APPROVED ||
                        p.status === PaymentStatus.PENDING  ||
                        p.status === PaymentStatus.PROCESSING);
            });

            const isCurrent = now.getFullYear() === year && now.getMonth() === month;
            const isPastDue = dueDate < now && !isCurrent;

            let status: PaymentScheduleItem['status'];
            let statusLabel: string;

            if (isPaid)          { status = 'paid';     statusLabel = 'Pagado'; }
            else if (isCurrent)  { status = 'current';  statusLabel = 'Este mes'; }
            else if (isPastDue)  { status = 'overdue';  statusLabel = 'Pendiente'; }
            else                 { status = 'upcoming'; statusLabel = 'Próximo'; }

            const raw = cursor.toLocaleDateString('es', { month: 'short', year: 'numeric' });
            items.push({
                label: raw.charAt(0).toUpperCase() + raw.slice(1),
                year, month, dueDate,
                amount: typeof contract.monthly_rent === 'number'
                    ? contract.monthly_rent
                    : parseFloat(contract.monthly_rent as unknown as string) || 0,
                currency: contract.currency || 'USD',
                status, statusLabel
            });
            cursor = new Date(year, month + 1, 1);
        }
        this.paymentScheduleSignal.set(items);
    }

    ngOnDestroy(): void {
        this.stopPolling();
    }

    private normalizeCurrency(value?: string): Currency | null {
        if (!value) return null;
        const upper = value.toUpperCase();
        return Object.values(Currency).includes(upper as Currency)
            ? (upper as Currency)
            : null;
    }

    private normalizePaymentMethod(value?: string): PaymentMethod | null {
        if (!value) return null;
        const upper = value.toUpperCase();
        return Object.values(PaymentMethod).includes(upper as PaymentMethod)
            ? (upper as PaymentMethod)
            : null;
    }

    currencySymbol(code: string): string {
        return CurrencySymbols[code as Currency] ?? code;
    }

    formatDate(iso: string): string {
        return new Date(iso).toLocaleString('es-BO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    onSubmit(): void {
        if (this.isQrMethod()) {
            this.generateQr();
            return;
        }
        if (this.paymentForm.invalid) {
            this.paymentForm.markAllAsTouched();
            return;
        }

        const formValue = this.paymentForm.value;
        this.paymentService.createPayment({
            payment_type: formValue.payment_type!,
            amount: formValue.amount!,
            currency: formValue.currency ?? Currency.USD,
            payment_method: formValue.payment_method!,
            payment_date: formValue.payment_date!,
            reference_number: formValue.reference_number || undefined,
            check_number: formValue.check_number || undefined,
            notes: formValue.notes || undefined,
            // Campos específicos por método de pago
            card_last_4_digits: formValue.card_last_4_digits || undefined,
            card_holder_name: formValue.card_holder_name || undefined,
            card_expiry: formValue.card_expiry || undefined,
            bank_name: formValue.bank_name || undefined,
            bank_account_last_4: formValue.bank_account_last_4 || undefined,
            received_by: formValue.received_by || undefined
        }).subscribe({
            next: () => this.success.set(true),
            error: (err) => console.error('Error creando pago:', err)
        });
    }

    private generateQr(): void {
        const v = this.paymentForm.value;
        if (!v.amount || v.amount <= 0) { this.paymentForm.get('amount')?.markAsTouched(); return; }
        this.qrError.set(null);
        this.qrService.generateQr({
            amount:       v.amount,
            currency:     v.currency ?? Currency.USD,
            payment_type: v.payment_type ?? PaymentType.RENT,
            notes:        v.notes || undefined
        }).subscribe({
            next:  () => this.startPolling(),
            error: (err) => this.qrError.set(err?.error?.message || err?.message || 'Error al generar el QR.')
        });
    }

    manualVerify(): void {
        const qr = this.qrService.activeQr();
        if (qr) this.doVerify(qr);
    }

    downloadQr(): void {
        const qr = this.qrService.activeQr();
        if (!qr?.qr_image) return;
        const raw = qr.qr_image;
        const href = raw.startsWith('http') || raw.startsWith('data:')
            ? raw
            : `data:image/png;base64,${raw}`;
        const a = document.createElement('a');
        a.href = href;
        a.download = `QR-pago-${qr.id}.png`;
        a.click();
    }

    onCancelQr(): void {
        const qr = this.qrService.activeQr();
        if (!qr) return;
        this.qrCancelling.set(true);
        this.stopPolling();
        this.qrService.cancelQr(qr.id).subscribe({
            next:  () => this.qrCancelling.set(false),
            error: () => this.qrCancelling.set(false)
        });
    }

    resetQr(): void {
        this.stopPolling();
        this.qrService.clearActiveQr();
        this.qrError.set(null);
    }

    private startPolling(): void {
        this.stopPolling();
        this.qrPollTimer = setInterval(() => {
            const qr = this.qrService.activeQr();
            if (!qr || this.qrService.isTerminalStatus(qr.status)) { this.stopPolling(); return; }
            this.doVerify(qr);
        }, 5000);
    }

    private stopPolling(): void {
        if (this.qrPollTimer !== undefined) { clearInterval(this.qrPollTimer); this.qrPollTimer = undefined; }
        this.qrPolling.set(false);
    }

    private doVerify(qr: QrPayment): void {
        this.qrPolling.set(true);
        this.qrService.verifyQr({ qr_id: qr.id }).subscribe({
            next: updated => {
                this.qrPolling.set(false);
                if (this.qrService.isTerminalStatus(updated.status)) this.stopPolling();
            },
            error: () => this.qrPolling.set(false)
        });
    }

    resetForm(): void {
        this.stopPolling();
        this.qrService.clearActiveQr();
        this.qrError.set(null);
        this.paymentForm.reset({
            payment_type:   PaymentType.RENT,
            currency:       Currency.USD,
            payment_method: PaymentMethod.TRANSFER,
            payment_date:   new Date()
        });
        this.success.set(false);
        this.paymentService.clearError();
    }

    goBack(): void {
        this.slugService.navigateTo(['portal', 'pagos']);
    }
}
