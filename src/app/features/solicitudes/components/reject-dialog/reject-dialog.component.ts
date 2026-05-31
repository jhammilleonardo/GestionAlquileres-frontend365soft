import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import {
  AppButtonComponent,
  AppLoadingStateComponent,
  AppTextareaComponent,
} from '../../../../shared/ui';

import { getApiErrorMessage } from '../../../../core/http/http-error.util';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppTextareaComponent,
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

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

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
    if (this.submitting()) return;

    if (!this.formData.admin_feedback.trim()) {
      this.error.set(this.transloco.translate('solicitudes.reject.requiredFeedback'));
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const applicationId = Number(this.route.snapshot.paramMap.get('id'));

    this.applicationService
      .rejectApplication(applicationId, this.formData.admin_feedback)
      .subscribe({
        next: () => {
          this.success.set(true);
          this.submitting.set(false);
          setTimeout(() => {
            void this.router.navigate(['../../'], { relativeTo: this.route });
          }, 2000);
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.error.set(getApiErrorMessage(err, err.message ?? 'Error al rechazar la solicitud'));
          this.submitting.set(false);
        },
      });
  }

  selectReason(key: string): void {
    this.formData.admin_feedback = this.transloco.translate(key);
  }

  cancel(): void {
    void this.router.navigate(['../'], { relativeTo: this.route });
  }
}
