import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApplicationService } from '../../../core/services/admin/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  CreateApplicationDto,
  PersonalData,
  EmploymentData,
  MaritalStatus,
  EmploymentType,
} from '../../../core/models/application.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, AlertTriangle, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, LucideAngularModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.css'],
})
export class ApplicationFormComponent implements OnInit {
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle2 = CheckCircle2;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private applicationService = inject(ApplicationService);
  private authService = inject(AuthService);
  private slugService = inject(SlugService);
  private translocoService = inject(TranslocoService);

  private readonly FORM_DATA_KEY = 'pending_application_form';

  propertyId: number = 0;
  submitting = false;
  submitSuccess = false;
  error: string | null = null;

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

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('restoreForm') === 'true') {
        this.restoreFormData();
      }
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('propertyId');
      if (id) {
        this.propertyId = Number(id);
        this.formData.property_id = this.propertyId;
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('propertyId');
      if (id && !this.propertyId) {
        this.propertyId = Number(id);
        this.formData.property_id = this.propertyId;
      }
    });

    if (!this.propertyId) {
      this.router.navigate(['../../propiedades'], { relativeTo: this.route });
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

    this.submitting = true;
    this.error = null;

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

    const payload: any = {
      property_id: this.formData.property_id,
      personal_data: {
        full_name: pd.full_name,
        phone: pd.phone,
        identity_document: (pd as any).national_id || '',
        current_address: (pd as any).current_address || '',
      },
      employment_data: {
        employer_name: cj.company,
        position: cj.position,
        monthly_income: Number(cj.salary) || 0,
        employment_duration: cj.start_date || '',
        employer_phone: cj.supervisor_phone,
      },
      rental_history: this.formData.rental_history.map((h: any) => ({
        previous_address: h.property_address || '',
        previous_landlord_name: h.landlord_name || '',
        previous_landlord_phone: h.landlord_phone || '',
        previous_rent_amount: Number(h.monthly_rent) || 0,
        reason_for_leaving: h.reason_for_leaving || '',
      })),
      references: allRefs,
      additional_notes: this.formData.additional_notes || undefined,
    };

    this.applicationService.createApplication(payload).subscribe({
      next: (response) => {
        this.submitSuccess = true;
        this.submitting = false;

        // Clear saved form data
        this.clearSavedFormData();

        // Redirect to login/register after showing success message
        setTimeout(() => {
          this.router.navigate(['../../registro'], {
            relativeTo: this.route,
            queryParams: { application: 'success', applicationId: response.id },
          });
        }, 3000);
      },
      error: (err: any) => {
        this.error =
          err.error?.message || this.translocoService.translate('public.applicationForm.errSubmit');
        this.submitting = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  cancel(): void {
    if (confirm(this.translocoService.translate('public.applicationForm.msgCancel'))) {
      this.clearSavedFormData();
      this.router.navigate(['../../propiedades'], { relativeTo: this.route });
    }
  }

  // Save form data to localStorage
  private saveFormData(): void {
    try {
      const dataToSave = {
        formData: this.formData,
        propertyId: this.propertyId,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(this.FORM_DATA_KEY, JSON.stringify(dataToSave));
      console.log('💾 Datos del formulario guardados en localStorage');
    } catch (error) {
      console.error('Error al guardar formulario:', error);
    }
  }

  private restoreFormData(): void {
    try {
      const savedData = localStorage.getItem(this.FORM_DATA_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.formData = parsed.formData;
        this.propertyId = parsed.propertyId;
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
    this.router.navigateByUrl(loginUrl);
  }

  // Validation Methods
  validatePersonalData(): boolean {
    const pd = this.formData.personal_data;
    if (!pd.full_name || !pd.phone || !pd.email || !pd.birth_date || !pd.national_id) {
      this.error = this.translocoService.translate('public.applicationForm.errPersonal');
      return false;
    }
    if (!pd.email.includes('@')) {
      this.error = this.translocoService.translate('public.applicationForm.errEmail');
      return false;
    }
    this.error = null;
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
      this.error = this.translocoService.translate('public.applicationForm.errWork');
      return false;
    }
    if (cj.salary <= 0) {
      this.error = this.translocoService.translate('public.applicationForm.errSalary');
      return false;
    }
    this.error = null;
    return true;
  }

  validateReferences(): boolean {
    const refs = this.formData.references;
    if (refs.personal.length === 0 && refs.professional.length === 0) {
      this.error = this.translocoService.translate('public.applicationForm.errRefMissing');
      return false;
    }

    // Validate that all references have required fields
    for (const ref of refs.personal) {
      if (!ref.name || !ref.relationship || !ref.phone) {
        this.error = this.translocoService.translate('public.applicationForm.errRefPersonal');
        return false;
      }
    }

    for (const ref of refs.professional) {
      if (!ref.name || !ref.company || !ref.position || !ref.phone) {
        this.error = this.translocoService.translate('public.applicationForm.errRefProf');
        return false;
      }
    }

    this.error = null;
    return true;
  }
}
