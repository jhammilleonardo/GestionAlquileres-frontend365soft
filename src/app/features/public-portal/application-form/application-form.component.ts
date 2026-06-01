import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationService } from '../../../core/services/admin/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import {
  CreateApplicationDto,
  PersonalData,
  EmploymentData,
  MaritalStatus,
  EmploymentType,
} from '../../../core/models/application.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
interface ApplicationPayload {
  property_id: number;
  personal_data: {
    full_name: string;
    phone: string;
    identity_document: string;
    current_address: string;
  };
  employment_data: {
    employer_name: string;
    position: string;
    monthly_income: number;
    employment_duration: string;
    employer_phone: string;
  };
  rental_history: {
    previous_address: string;
    previous_landlord_name: string;
    previous_landlord_phone: string;
    previous_rent_amount: number;
    reason_for_leaving: string;
  }[];
  references: { name: string; relationship: string; phone: string }[];
  additional_notes?: string;
}

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationFormComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly applicationService = inject(ApplicationService);
  private readonly authService = inject(AuthService);
  private readonly slugService = inject(SlugService);
  private readonly translocoService = inject(TranslocoService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly FORM_DATA_KEY = 'pending_application_form';

  readonly propertyId = signal(0);
  readonly submitting = signal(false);
  readonly submitSuccess = signal(false);
  readonly error = signal<string | null>(null);

  // Form data
  formData: CreateApplicationDto = {
    property_id: 0,
    personal_data: this.getEmptyPersonalData(),
    employment_data: this.getEmptyEmploymentData(),
    rental_history: [],
    references: {
      personal: [],
      professional: [],
    },
    documents: [],
    additional_notes: '',
  };

  // Options for selects
  maritalStatuses = Object.values(MaritalStatus);
  employmentTypes = Object.values(EmploymentType);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params.get('restoreForm') === 'true') this.restoreFormData();
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('propertyId');
      if (id) {
        this.propertyId.set(Number(id));
        this.formData.property_id = Number(id);
      }
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('propertyId');
      if (id && !this.propertyId()) {
        this.propertyId.set(Number(id));
        this.formData.property_id = Number(id);
      }
    });

    if (!this.propertyId()) {
      void this.router.navigate(['../../properties'], { relativeTo: this.route });
    }
  }

  // Personal Data Methods
  getEmptyPersonalData(): PersonalData {
    return {
      full_name: '',
      phone: '',
      email: '',
      birth_date: '',
      national_id: '',
      marital_status: MaritalStatus.SOLTERO,
      number_of_dependents: 0,
    };
  }

  // Employment Data Methods
  getEmptyEmploymentData(): EmploymentData {
    return {
      current_job: {
        company: '',
        position: '',
        salary: 0,
        currency: 'BOB',
        start_date: '',
        employment_type: EmploymentType.TIEMPO_COMPLETO,
        supervisor_name: '',
        supervisor_phone: '',
      },
    };
  }

  // Rental History Methods
  addRentalHistory(): void {
    this.formData.rental_history.push({
      property_address: '',
      landlord_name: '',
      landlord_phone: '',
      monthly_rent: 0,
      start_date: '',
      end_date: '',
      reason_for_leaving: '',
    });
  }

  removeRentalHistory(index: number): void {
    this.formData.rental_history.splice(index, 1);
  }

  // References Methods
  addPersonalReference(): void {
    this.formData.references.personal.push({
      name: '',
      relationship: '',
      phone: '',
      email: '',
    });
  }

  removePersonalReference(index: number): void {
    this.formData.references.personal.splice(index, 1);
  }

  addProfessionalReference(): void {
    this.formData.references.professional.push({
      name: '',
      company: '',
      position: '',
      phone: '',
      email: '',
    });
  }

  removeProfessionalReference(index: number): void {
    this.formData.references.professional.splice(index, 1);
  }

  // Getter for previous job to handle optional chaining in template
  get previousJob() {
    return (
      this.formData.employment_data.previous_job || {
        company: '',
        position: '',
        salary: 0,
        end_date: '',
      }
    );
  }

  // Submit
  onSubmit(): void {
    // Validate all sections
    if (
      !this.validatePersonalData() ||
      !this.validateEmploymentData() ||
      !this.validateReferences()
    ) {
      return;
    }

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.saveFormData();
      this.redirectToLogin();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const pd = this.formData.personal_data;
    const cj = this.formData.employment_data.current_job;
    const allRefs = [
      ...this.formData.references.personal.map((r) => ({
        name: r.name,
        relationship: r.relationship,
        phone: r.phone,
      })),
      ...this.formData.references.professional.map((r) => ({
        name: r.name,
        relationship: r.company,
        phone: r.phone,
      })),
    ];

    const payload: ApplicationPayload = {
      property_id: this.formData.property_id,
      personal_data: {
        full_name: pd.full_name,
        phone: pd.phone,
        identity_document: (pd as PersonalData & { national_id?: string }).national_id ?? '',
        current_address: (pd as PersonalData & { current_address?: string }).current_address ?? '',
      },
      employment_data: {
        employer_name: cj.company,
        position: cj.position,
        monthly_income: Number(cj.salary) || 0,
        employment_duration: cj.start_date ?? '',
        employer_phone: cj.supervisor_phone,
      },
      rental_history: this.formData.rental_history.map((h) => ({
        previous_address: h.property_address ?? '',
        previous_landlord_name: h.landlord_name ?? '',
        previous_landlord_phone: h.landlord_phone ?? '',
        previous_rent_amount: Number(h.monthly_rent) || 0,
        reason_for_leaving: h.reason_for_leaving ?? '',
      })),
      references: allRefs,
      additional_notes: this.formData.additional_notes || undefined,
    };

    this.applicationService
      .createApplication(payload as unknown as CreateApplicationDto)
      .subscribe({
        next: (response) => {
          this.submitSuccess.set(true);
          this.submitting.set(false);
          this.clearSavedFormData();
          setTimeout(() => {
            void this.router.navigate(['../../registro'], {
              relativeTo: this.route,
              queryParams: { application: 'success', applicationId: response.id },
            });
          }, 3000);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            getApiErrorMessage(
              err,
              this.translocoService.translate('public.applicationForm.errSubmit'),
            ),
          );
          this.submitting.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
  }

  async cancel(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translocoService.translate('public.applicationForm.msgCancel'),
      message: '',
      confirmLabel: this.translocoService.translate('common.confirm'),
    });
    if (!confirmed) return;
    this.clearSavedFormData();
    void this.router.navigate(['../../properties'], { relativeTo: this.route });
  }

  private saveFormData(): void {
    try {
      const dataToSave = {
        formData: this.formData,
        propertyId: this.propertyId(),
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(this.FORM_DATA_KEY, JSON.stringify(dataToSave));
    } catch {
      // localStorage not available — continue silently
    }
  }

  private restoreFormData(): void {
    try {
      const savedData = localStorage.getItem(this.FORM_DATA_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as {
          formData: CreateApplicationDto;
          propertyId: number;
        };
        this.formData = parsed.formData;
        this.propertyId.set(parsed.propertyId);
        this.clearSavedFormData();
        setTimeout(() => this.onSubmit(), 500);
      }
    } catch {
      this.clearSavedFormData();
    }
  }

  private clearSavedFormData(): void {
    localStorage.removeItem(this.FORM_DATA_KEY);
  }

  private redirectToLogin(): void {
    const slug = this.slugService.getSlug();
    const currentUrl = this.router.url.split('?')[0];
    const loginUrl = `/${slug}/login?returnUrl=${encodeURIComponent(currentUrl + '?restoreForm=true')}`;
    void this.router.navigateByUrl(loginUrl);
  }

  // Validation Methods
  validatePersonalData(): boolean {
    const pd = this.formData.personal_data;
    if (!pd.full_name || !pd.phone || !pd.email || !pd.birth_date || !pd.national_id) {
      this.error.set(this.translocoService.translate('public.applicationForm.errPersonal'));
      return false;
    }
    if (!pd.email.includes('@')) {
      this.error.set(this.translocoService.translate('public.applicationForm.errEmail'));
      return false;
    }
    this.error.set(null);
    return true;
  }

  validateEmploymentData(): boolean {
    const cj = this.formData.employment_data.current_job;
    if (
      !cj.company ||
      !cj.position ||
      !cj.salary ||
      !cj.start_date ||
      !cj.supervisor_name ||
      !cj.supervisor_phone
    ) {
      this.error.set(this.translocoService.translate('public.applicationForm.errWork'));
      return false;
    }
    if (cj.salary <= 0) {
      this.error.set(this.translocoService.translate('public.applicationForm.errSalary'));
      return false;
    }
    this.error.set(null);
    return true;
  }

  validateReferences(): boolean {
    const refs = this.formData.references;
    if (refs.personal.length === 0 && refs.professional.length === 0) {
      this.error.set(this.translocoService.translate('public.applicationForm.errRefMissing'));
      return false;
    }
    for (const ref of refs.personal) {
      if (!ref.name || !ref.relationship || !ref.phone) {
        this.error.set(this.translocoService.translate('public.applicationForm.errRefPersonal'));
        return false;
      }
    }
    for (const ref of refs.professional) {
      if (!ref.name || !ref.company || !ref.position || !ref.phone) {
        this.error.set(this.translocoService.translate('public.applicationForm.errRefProf'));
        return false;
      }
    }
    this.error.set(null);
    return true;
  }
}
