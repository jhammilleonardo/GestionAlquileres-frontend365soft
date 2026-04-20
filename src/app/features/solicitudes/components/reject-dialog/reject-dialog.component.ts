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
  ArrowLeft,
  XCircle,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lightbulb,
  Timer,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ApplicationService } from '../../../../core/services/admin/application.service';

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope('solicitudes')],
  templateUrl: './reject-dialog.component.html',
  styleUrls: ['./reject-dialog.component.css'],
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
  private transloco = inject(TranslocoService);

  submitting = false;
  error: string | null = null;
  success = false;

  formData = {
    admin_feedback: '',
    status: 'RECHAZADA',
  };

  readonly commonReasonKeys = [
    'solicitudes.reject.reason1',
    'solicitudes.reject.reason2',
    'solicitudes.reject.reason3',
    'solicitudes.reject.reason4',
    'solicitudes.reject.reason5',
    'solicitudes.reject.reason6',
  ];

  onSubmit(): void {
    if (this.submitting) return;

    if (!this.formData.admin_feedback.trim()) {
      this.error = this.transloco.translate('solicitudes.reject.requiredFeedback');
      return;
    }

    this.submitting = true;
    this.error = null;

    const applicationId = Number(this.route.snapshot.paramMap.get('id'));

    this.applicationService
      .rejectApplication(applicationId, this.formData.admin_feedback)
      .subscribe({
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
        },
      });
  }

  selectReason(key: string): void {
    this.formData.admin_feedback = this.transloco.translate(key);
  }

  cancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
