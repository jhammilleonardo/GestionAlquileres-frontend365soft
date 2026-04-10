import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  LucideAngularModule,
  Building2,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
  ],
  template: `
    <div class="forgot-page">
      <div class="forgot-container">
        <div class="forgot-header">
          <div class="brand-logo">
            <lucide-icon [img]="Building2" [size]="48"></lucide-icon>
          </div>
          <h1>¿Olvidaste tu contraseña?</h1>
          <p>Ingresa tu correo electrónico y te enviaremos instrucciones para restablecerla</p>
        </div>

        @if (successMessage()) {
          <div class="success-alert">
            <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
            <div class="alert-content">
              <strong>Email enviado</strong>
              <span>{{ successMessage() }}</span>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <div class="error-alert">
            <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
            <div class="alert-content">
              <strong>Error</strong>
              <span>{{ errorMessage() }}</span>
            </div>
          </div>
        }

        @if (!successMessage()) {
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="forgot-form">
            <div class="form-group">
              <label class="form-label">Correo Electrónico</label>
              <mat-form-field appearance="outline" class="custom-field">
                <input
                  matInput
                  type="email"
                  formControlName="email"
                  placeholder="correo@ejemplo.com"
                  autocomplete="email"
                />
                @if (
                  forgotForm.get('email')?.hasError('required') && forgotForm.get('email')?.touched
                ) {
                  <mat-error>Requerido</mat-error>
                }
                @if (forgotForm.get('email')?.hasError('email')) {
                  <mat-error>Correo inválido</mat-error>
                }
              </mat-form-field>
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="submit-btn"
              [disabled]="forgotForm.invalid || isLoading()"
            >
              @if (isLoading()) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
                <span>Enviando...</span>
              } @else {
                <span>Enviar Instrucciones</span>
              }
            </button>
          </form>
        }

        <div class="forgot-footer">
          <a routerLink="/login" class="back-link">
            <lucide-icon [img]="ArrowLeft" [size]="16"></lucide-icon>
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      }

      .forgot-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }

      .forgot-container {
        width: 100%;
        max-width: 480px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 48px;
      }

      .forgot-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .brand-logo {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .forgot-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 12px;
      }

      .forgot-header p {
        font-size: 1rem;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
      }

      .success-alert {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: #f0fdf4;
        border-left: 4px solid #22c55e;
        border-radius: 8px;
        margin-bottom: 24px;
      }

      .success-alert lucide-icon {
        color: #22c55e;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .error-alert {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: #fef2f2;
        border-left: 4px solid #ef4444;
        border-radius: 8px;
        margin-bottom: 24px;
      }

      .error-alert lucide-icon {
        color: #ef4444;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .alert-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .alert-content strong {
        font-size: 0.875rem;
        font-weight: 600;
      }

      .alert-content span {
        font-size: 0.875rem;
      }

      .forgot-form {
        margin-bottom: 24px;
      }

      .form-group {
        margin-bottom: 24px;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 8px;
      }

      .custom-field {
        width: 100%;
      }

      .submit-btn {
        width: 100%;
        height: 52px;
        font-size: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .forgot-footer {
        text-align: center;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .back-link:hover {
        color: #3b82f6;
      }

      @media (max-width: 640px) {
        .forgot-container {
          padding: 32px 24px;
        }

        .forgot-header h1 {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowLeft = ArrowLeft;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.forgotForm.value.email!;

    // TODO: Replace with actual API endpoint when available
    // this.http.post(`${environment.apiUrl}auth/forgot-password`, { email })

    // Simulated API call
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(
        `Se han enviado las instrucciones de recuperación a ${email}. Por favor revisa tu bandeja de entrada.`,
      );
    }, 1500);
  }
}
