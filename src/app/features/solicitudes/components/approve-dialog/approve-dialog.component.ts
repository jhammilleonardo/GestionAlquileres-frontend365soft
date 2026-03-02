import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  LucideAngularModule,
  ArrowLeft, CheckCircle2, AlertCircle, DollarSign, Clock,
  Calendar, Wrench, RefreshCw, ClipboardList, ScrollText,
  FileText, Building2, MessageSquare, Timer
} from 'lucide-angular';
import { ApplicationService } from '../../../../core/services/application.service';
import { Application, ApproveApplicationDto, ApproveApplicationResponse } from '../../../../core/models/application.model';

@Component({
  selector: 'app-approve-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatSlideToggleModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
    LucideAngularModule
  ],
  templateUrl: './approve-dialog.component.html',
  styleUrls: ['./approve-dialog.component.css']
})
export class ApproveDialogComponent implements OnInit {
  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly DollarSign = DollarSign;
  readonly Clock = Clock;
  readonly Calendar = Calendar;
  readonly Wrench = Wrench;
  readonly RefreshCw = RefreshCw;
  readonly ClipboardList = ClipboardList;
  readonly ScrollText = ScrollText;
  readonly FileText = FileText;
  readonly Building2 = Building2;
  readonly MessageSquare = MessageSquare;
  readonly Timer = Timer;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private applicationService = inject(ApplicationService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  submitting = false;
  error: string | null = null;
  success = false;
  contractGenerated: ApproveApplicationResponse['contract_generated'] | null = null;

  formData: ApproveApplicationDto = {
    monthly_rent: 0,
    currency: 'BOB',
    payment_day: 5,
    auto_renew: false,
    renewal_notice_days: 30,
    auto_increase_percentage: 0,
    late_fee_percentage: 0,
    grace_days: 0
  };

  availableServices = [
    'Internet', 'Cable TV', 'Expensas', 'Agua',
    'Luz', 'Gas', 'Limpieza', 'Seguridad'
  ];

  ngOnInit(): void {
    const app$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (!id) {
          this.error = 'ID de solicitud no válido';
          throw new Error('Invalid ID');
        }
        return this.applicationService.getApplicationById(id);
      })
    );

    app$.subscribe({
      next: (app: Application) => {
        this.formData.monthly_rent = app.employment_data.monthly_income;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al cargar la solicitud';
      }
    });
  }

  onSubmit(): void {
    if (this.submitting) return;
    this.submitting = true;
    this.error = null;

    const applicationId = Number(this.route.snapshot.paramMap.get('id'));

    this.applicationService.approveApplication(applicationId, this.formData).subscribe({
      next: (response: ApproveApplicationResponse) => {
        this.success = true;
        this.contractGenerated = response.contract_generated;
        this.submitting = false;
        setTimeout(() => {
          this.router.navigate(['../../'], { relativeTo: this.route });
        }, 3000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al aprobar la solicitud';
        this.submitting = false;
      }
    });
  }

  toggleService(service: string): void {
    if (!this.formData.included_services) {
      this.formData.included_services = [];
    }
    const index = this.formData.included_services.indexOf(service);
    if (index > -1) {
      this.formData.included_services.splice(index, 1);
    } else {
      this.formData.included_services.push(service);
    }
  }

  isServiceSelected(service: string): boolean {
    return this.formData.included_services?.includes(service) || false;
  }

  cancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
