import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, ArrowLeft, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-angular';
import { TenantPaymentService } from '../../../core/services/tenant-payment.service';
import { PaymentType, PaymentMethod, PaymentTypeLabels, PaymentMethodLabels } from '../../../core/models/payment.model';

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

            @if (paymentService.error()) {
                <div class="error-alert">
                    <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
                    <span>{{ paymentService.error() }}</span>
                </div>
            }

            @if (success()) {
                <mat-card class="success-card">
                    <lucide-icon [img]="CheckCircle2" [size]="48" class="success-icon"></lucide-icon>
                    <h2>¡Pago Registrado!</h2>
                    <p>Tu pago ha sido registrado exitosamente</p>
                    <div class="success-actions">
                        <button mat-raised-button (click)="goBack()">Volver a Pagos</button>
                        <button mat-stroked-button (click)="resetForm()">Registrar Otro Pago</button>
                    </div>
                </mat-card>
            } @else {
                <mat-card class="form-card">
                    <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()">
                        <div class="form-grid">
                            <!-- Tipo de Pago -->
                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Tipo de Pago</mat-label>
                                <mat-select formControlName="payment_type" required>
                                    @for (type of paymentTypes; track type.value) {
                                        <mat-option [value]="type.value">
                                            {{ type.label }}
                                        </mat-option>
                                    }
                                </mat-select>
                                @if (paymentForm.get('payment_type')?.hasError('required') && paymentForm.get('payment_type')?.touched) {
                                    <mat-error>El tipo de pago es requerido</mat-error>
                                }
                            </mat-form-field>

                            <!-- Monto -->
                            <mat-form-field appearance="outline">
                                <mat-label>Monto</mat-label>
                                <span matTextPrefix>$ &nbsp;</span>
                                <input 
                                    matInput 
                                    type="number" 
                                    formControlName="amount" 
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required>
                                @if (paymentForm.get('amount')?.hasError('required') && paymentForm.get('amount')?.touched) {
                                    <mat-error>El monto es requerido</mat-error>
                                }
                                @if (paymentForm.get('amount')?.hasError('min')) {
                                    <mat-error>El monto debe ser mayor a 0</mat-error>
                                }
                            </mat-form-field>

                            <!-- Método de Pago -->
                            <mat-form-field appearance="outline">
                                <mat-label>Método de Pago</mat-label>
                                <mat-select formControlName="payment_method" required>
                                    @for (method of paymentMethods; track method.value) {
                                        <mat-option [value]="method.value">
                                            {{ method.label }}
                                        </mat-option>
                                    }
                                </mat-select>
                                @if (paymentForm.get('payment_method')?.hasError('required') && paymentForm.get('payment_method')?.touched) {
                                    <mat-error>El método de pago es requerido</mat-error>
                                }
                            </mat-form-field>

                            <!-- Fecha de Pago -->
                            <mat-form-field appearance="outline">
                                <mat-label>Fecha de Pago</mat-label>
                                <input 
                                    matInput 
                                    [matDatepicker]="picker"
                                    formControlName="payment_date"
                                    [max]="maxDate"
                                    required>
                                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                                <mat-datepicker #picker></mat-datepicker>
                                @if (paymentForm.get('payment_date')?.hasError('required') && paymentForm.get('payment_date')?.touched) {
                                    <mat-error>La fecha es requerida</mat-error>
                                }
                            </mat-form-field>

                            <!-- Número de Referencia -->
                            <mat-form-field appearance="outline">
                                <mat-label>Número de Referencia</mat-label>
                                <input 
                                    matInput 
                                    formControlName="reference_number" 
                                    placeholder="Ej: 123456789"
                                    maxlength="50">
                                <mat-hint>Opcional - Número de transacción o cheque</mat-hint>
                            </mat-form-field>

                            <!-- Notas -->
                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Notas Adicionales</mat-label>
                                <textarea 
                                    matInput 
                                    formControlName="notes" 
                                    rows="3"
                                    maxlength="500"
                                    placeholder="Información adicional sobre el pago...">
                                </textarea>
                                <mat-hint align="end">
                                    {{ paymentForm.get('notes')?.value?.length || 0 }} / 500
                                </mat-hint>
                            </mat-form-field>
                        </div>

                        <div class="form-actions">
                            <button 
                                type="button" 
                                mat-stroked-button 
                                (click)="goBack()"
                                [disabled]="paymentService.isLoading()">
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                mat-raised-button 
                                color="primary"
                                [disabled]="paymentForm.invalid || paymentService.isLoading()">
                                @if (paymentService.isLoading()) {
                                    <mat-spinner diameter="20"></mat-spinner>
                                    Registrando...
                                } @else {
                                    <lucide-icon [img]="CreditCard" [size]="20"></lucide-icon>
                                    Registrar Pago
                                }
                            </button>
                        </div>
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

        .form-card {
            padding: 32px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
        }

        .full-width {
            grid-column: 1 / -1;
        }

        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
        }

        button[type="submit"] {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }

            .form-actions {
                flex-direction: column-reverse;
            }

            .form-actions button {
                width: 100%;
            }

            .page-header h1 {
                font-size: 1.35rem;
            }

            .form-card {
                padding: 24px;
            }

            .success-card {
                padding: 32px;
            }

            .success-actions {
                flex-direction: column;
            }

            .success-actions button {
                width: 100%;
            }
        }

        @media (max-width: 480px) {
            .page-header {
                gap: 8px;
            }

            .page-header h1 {
                font-size: 1.25rem;
            }

            .form-card {
                padding: 20px;
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

            .form-grid {
                gap: 12px;
                margin-bottom: 20px;
            }
        }
    `]
})
export class TenantCreatePaymentComponent {
    readonly ArrowLeft = ArrowLeft;
    readonly CreditCard = CreditCard;
    readonly AlertCircle = AlertCircle;
    readonly CheckCircle2 = CheckCircle2;

    private fb = inject(FormBuilder);
    private router = inject(Router);
    paymentService = inject(TenantPaymentService);

    success = signal(false);
    maxDate = new Date();

    paymentTypes = Object.keys(PaymentType).map(key => ({
        value: PaymentType[key as keyof typeof PaymentType],
        label: PaymentTypeLabels[PaymentType[key as keyof typeof PaymentType]]
    }));

    paymentMethods = Object.keys(PaymentMethod).map(key => ({
        value: PaymentMethod[key as keyof typeof PaymentMethod],
        label: PaymentMethodLabels[PaymentMethod[key as keyof typeof PaymentMethod]]
    }));

    paymentForm = this.fb.group({
        payment_type: [PaymentType.RENT, Validators.required],
        amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
        payment_method: [PaymentMethod.BANK_TRANSFER, Validators.required],
        payment_date: [new Date(), Validators.required],
        reference_number: [''],
        notes: ['', Validators.maxLength(500)]
    });

    onSubmit(): void {
        if (this.paymentForm.invalid) {
            this.paymentForm.markAllAsTouched();
            return;
        }

        const formValue = this.paymentForm.value;
        this.paymentService.createPayment({
            payment_type: formValue.payment_type!,
            amount: formValue.amount!,
            payment_method: formValue.payment_method!,
            payment_date: formValue.payment_date!,
            reference_number: formValue.reference_number || undefined,
            notes: formValue.notes || undefined
        }).subscribe({
            next: () => {
                this.success.set(true);
            },
            error: (error) => {
                console.error('Error creating payment:', error);
            }
        });
    }

    resetForm(): void {
        this.paymentForm.reset({
            payment_type: PaymentType.RENT,
            payment_method: PaymentMethod.BANK_TRANSFER,
            payment_date: new Date()
        });
        this.success.set(false);
        this.paymentService.clearError();
    }

    goBack(): void {
        this.router.navigate(['/portal/pagos']);
    }
}
