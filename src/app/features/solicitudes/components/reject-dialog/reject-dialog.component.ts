import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  LucideAngularModule,
  ArrowLeft, XCircle, CheckCircle2, AlertCircle, MessageSquare, Lightbulb, Timer
} from 'lucide-angular';
import { ApplicationService } from '../../../../core/services/application.service';

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, LucideAngularModule
  ],
  templateUrl: './reject-dialog.component.html',
  styleUrls: ['./reject-dialog.component.css']
})
export class RejectDialogComponent {
  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly XCircle = XCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly MessageSquare = MessageSquare;
  readonly Lightbulb = Lightbulb;
  readonly Timer = Timer;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private applicationService = inject(ApplicationService);

  submitting = false;
  error: string | null = null;
  success = false;

  formData = {
    admin_feedback: '',
    status: 'RECHAZADA'
  };

  commonReasons = [
    'No cumple con los requisitos mínimos de ingresos',
    'Referencias laborales insuficientes',
    'Historial de alquiler desfavorable',
    'La propiedad ya no está disponible',
    'Documentación incompleta',
    'No se pudo contactar a las referencias proporcionadas'
  ];

  onSubmit(): void {
    if (this.submitting) return;

    if (!this.formData.admin_feedback.trim()) {
      this.error = 'Por favor proporciona una razón para el rechazo';
      return;
    }

    this.submitting = true;
    this.error = null;

    const applicationId = Number(this.route.snapshot.paramMap.get('id'));

    this.applicationService.rejectApplication(applicationId, this.formData.admin_feedback).subscribe({
      next: () => {
        this.success = true;
        this.submitting = false;
        setTimeout(() => {
          this.router.navigate(['../../'], { relativeTo: this.route });
        }, 2000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al rechazar la solicitud';
        this.submitting = false;
      }
    });
  }

  selectReason(reason: string): void {
    this.formData.admin_feedback = reason;
  }

  cancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
