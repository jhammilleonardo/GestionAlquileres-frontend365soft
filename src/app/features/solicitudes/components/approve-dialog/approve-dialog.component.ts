import {
  ChangeDetectorRef,
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  LucideAngularModule,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Clock,
  Calendar,
  Wrench,
  RefreshCw,
  ClipboardList,
  ScrollText,
  FileText,
  Building2,
  MessageSquare,
  Timer,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { ApplicationService } from '../../../../core/services/admin/application.service';
import {
  Application,
  ApproveApplicationDto,
  ApproveApplicationResponse,
} from '../../../../core/models/application.model';
import {
  AppButtonComponent,
  AppCheckboxComponent,
  AppDatePickerComponent,
  AppLoadingStateComponent,
  AppSelectComponent,
  AppSelectOption,
  AppTextFieldComponent,
  AppTextareaComponent,
} from '../../../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-approve-dialog',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppCheckboxComponent,
    AppDatePickerComponent,
    AppLoadingStateComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
  ],
  providers: [provideTranslocoScope('solicitudes')],
  templateUrl: './approve-dialog.component.html',
  styleUrls: ['./approve-dialog.component.css'],
})
export class ApproveDialogComponent {
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

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly contractGenerated = signal<ApproveApplicationResponse['contract_generated'] | null>(
    null,
  );

  formData: ApproveApplicationDto = {
    monthly_rent: 0,
    currency: 'BOB',
    payment_day: 5,
    auto_renew: false,
    renewal_notice_days: 30,
    auto_increase_percentage: 0,
    late_fee_percentage: 0,
    grace_days: 0,
  };

  availableServices = [
    'Internet',
    'Cable TV',
    'Expensas',
    'Agua',
    'Luz',
    'Gas',
    'Limpieza',
    'Seguridad',
  ];
  readonly currencyOptions: AppSelectOption<string>[] = [
    { value: 'BOB', label: 'BOB - Bolivia' },
    { value: 'USD', label: 'USD - USA' },
    { value: 'EUR', label: 'EUR - Euro' },
  ];
  readonly accountTypeOptions: AppSelectOption<string>[] = [
    { value: '', label: 'Seleccionar' },
    { value: 'Ahorros', label: 'Ahorros' },
    { value: 'Corriente', label: 'Corriente' },
  ];

  constructor() {
    const app$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = Number(params.get('id'));
        if (!id) {
          this.error.set('ID de solicitud no válido');
          throw new Error('Invalid ID');
        }
        return this.applicationService.getApplicationById(id);
      }),
    );

    app$.subscribe({
      next: (app: Application) => {
        this.formData.monthly_rent = app.employment_data.monthly_income;
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.error.set(err.error?.message ?? err.message ?? 'Error al cargar la solicitud');
      },
    });
  }

  onSubmit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    const applicationId = Number(this.route.snapshot.paramMap.get('id'));

    this.applicationService.approveApplication(applicationId, this.buildPayload()).subscribe({
      next: (response: ApproveApplicationResponse) => {
        this.success.set(true);
        this.contractGenerated.set(response.contract_generated);
        this.submitting.set(false);
        setTimeout(() => {
          this.router.navigate(['../../'], { relativeTo: this.route });
        }, 3000);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.error.set(err.error?.message ?? err.message ?? 'Error al aprobar la solicitud');
        this.submitting.set(false);
      },
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

  private buildPayload(): ApproveApplicationDto {
    return {
      ...this.formData,
      monthly_rent: Number(this.formData.monthly_rent) || 0,
      deposit_amount:
        this.formData.deposit_amount === undefined
          ? undefined
          : Number(this.formData.deposit_amount) || 0,
      payment_day:
        this.formData.payment_day === undefined ? undefined : Number(this.formData.payment_day),
      late_fee_percentage:
        this.formData.late_fee_percentage === undefined
          ? undefined
          : Number(this.formData.late_fee_percentage) || 0,
      grace_days:
        this.formData.grace_days === undefined ? undefined : Number(this.formData.grace_days) || 0,
      renewal_notice_days:
        this.formData.renewal_notice_days === undefined
          ? undefined
          : Number(this.formData.renewal_notice_days) || 0,
      auto_increase_percentage:
        this.formData.auto_increase_percentage === undefined
          ? undefined
          : Number(this.formData.auto_increase_percentage) || 0,
    };
  }
}
