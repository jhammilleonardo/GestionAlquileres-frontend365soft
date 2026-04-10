import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, ArrowLeft, CheckCircle2 } from 'lucide-angular';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { merge, debounceTime } from 'rxjs';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { ApplicationService } from '../../../core/services/admin/application.service';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationIntentionService } from '../../../core/services/tenant/application-intention.service';
import { Property } from '../../../core/models/property.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Subcomponentes (steps)
import { Step1PersonalInfoComponent } from './steps/step-1-personal-info.component';
import { Step2EmploymentHistoryComponent } from './steps/step-2-employment-history.component';
import { Step3PreviewSubmitComponent } from './steps/step-3-preview-submit.component';

@Component({
  selector: 'app-application-wizard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    Step1PersonalInfoComponent,
    Step2EmploymentHistoryComponent,
    Step3PreviewSubmitComponent,
  ],
  template: `
    <div class="application-wizard">
      <!-- Header -->
      <div class="page-header">
        <button mat-button class="back-btn" (click)="goBack()">
          <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
          <span>Volver</span>
        </button>

        <div class="header-content">
          <div class="header-icon">
            <lucide-icon [img]="CheckCircle2" [size]="28"></lucide-icon>
          </div>
          <div class="header-text">
            <h1>Solicitud de Alquiler</h1>
            @if (property()) {
              <p class="subtitle">{{ property()!.title }}</p>
            }
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoadingProperty()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Cargando información de la propiedad...</p>
        </div>
      }

      <!-- Wizard -->
      @if (!isLoadingProperty() && property()) {
        <mat-card class="wizard-card">
          <mat-stepper
            [linear]="true"
            [selectedIndex]="currentStep()"
            (selectionChange)="onStepChange($event)"
            class="application-stepper"
          >
            <!-- Step 1: Información Personal -->
            <mat-step [stepControl]="personalInfoForm">
              <ng-template matStepLabel>Datos Personales</ng-template>
              <app-step-1-personal-info
                [formGroup]="personalInfoForm"
                (isValid)="personalInfoValid.set($event)"
              >
              </app-step-1-personal-info>
            </mat-step>

            <!-- Step 2: Historial Laboral -->
            <mat-step [stepControl]="employmentHistoryForm">
              <ng-template matStepLabel>Información Laboral</ng-template>
              <app-step-2-employment-history
                [formGroup]="employmentHistoryForm"
                (isValid)="employmentHistoryValid.set($event)"
              >
              </app-step-2-employment-history>
            </mat-step>

            <!-- Step 3: Previsualización y Envío -->
            <mat-step>
              <ng-template matStepLabel>Revisar y Enviar</ng-template>
              <app-step-3-preview-submit
                [property]="property()!"
                [personalInfo]="personalInfoForm.value"
                [employmentHistory]="employmentHistoryForm.value"
                [rentalHistory]="employmentHistoryForm.get('rental_history')?.value || []"
                [isSubmitting]="isSubmitting()"
                (submit)="submitApplication()"
                (editStep)="goToStep($event)"
              >
              </app-step-3-preview-submit>
            </mat-step>
          </mat-stepper>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .application-wizard {
        max-width: 900px;
        margin: 0 auto;
        padding: 24px;
      }

      .page-header {
        margin-bottom: 32px;
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        color: var(--mat-sys-on-surface-variant);
        font-weight: 500;
      }

      .back-btn:hover {
        background: var(--mat-sys-surface-container-low);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-icon {
        width: 56px;
        height: 56px;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-text h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
      }

      .subtitle {
        margin: 4px 0 0;
        font-size: 1rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 64px 24px;
        color: var(--mat-sys-on-surface-variant);
      }

      .wizard-card {
        border: 1px solid var(--mat-sys-outline-variant);
        overflow: hidden;
      }

      .application-stepper {
        padding: 24px;
      }

      @media (max-width: 768px) {
        .application-wizard {
          padding: 16px;
        }

        .header-content {
          flex-direction: column;
          text-align: center;
        }

        .application-stepper {
          padding: 16px;
        }
      }
    `,
  ],
})
export class ApplicationWizardComponent implements OnInit {
  readonly ArrowLeft = ArrowLeft;
  readonly CheckCircle2 = CheckCircle2;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private authService = inject(TenantAuthService);
  private applicationService = inject(ApplicationService);
  private propertyService = inject(PropertyService);
  private slugService = inject(SlugService);
  private intentionService = inject(ApplicationIntentionService);
  private destroyRef = inject(DestroyRef);

  // Signals
  currentStep = signal(0);
  property = signal<Property | null>(null);
  isLoadingProperty = signal(false);
  isSubmitting = signal(false);

  // Step validation
  personalInfoValid = signal(false);
  employmentHistoryValid = signal(false);

  // Forms
  personalInfoForm!: FormGroup;
  employmentHistoryForm!: FormGroup;

  // Draft persistence
  private readonly DRAFT_PREFIX = 'wizard_draft_';

  private get draftKey(): string {
    const propertyId = this.route.snapshot.paramMap.get('propertyId') || 'unknown';
    return `${this.DRAFT_PREFIX}${propertyId}`;
  }

  ngOnInit(): void {
    this.initializeForms();
    this.restoreDraft();
    this.loadProperty(); // prefillUserData() runs here and overwrites readonly fields
    this.setupAutosave();
  }

  private initializeForms(): void {
    // Personal Info Form
    this.personalInfoForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      email: ['', [Validators.email]], // No requerido cuando está autenticado
      birth_date: ['', [Validators.required]],
      national_id: ['', [Validators.required, Validators.minLength(8)]],
      current_address: [''], // Campo opcional para dirección actual
      marital_status: ['soltero', [Validators.required]],
      number_of_dependents: [0, [Validators.required, Validators.min(0)]],
    });

    // Employment History Form
    this.employmentHistoryForm = this.fb.group({
      current_job: this.fb.group({
        company: ['', [Validators.required]],
        position: ['', [Validators.required]],
        salary: ['', [Validators.required, Validators.min(0)]],
        currency: ['USD', [Validators.required]],
        start_date: ['', [Validators.required]],
        employment_type: ['tiempo_completo', [Validators.required]],
        supervisor_name: ['', [Validators.required]],
        supervisor_phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      }),
      previous_job: this.fb.group({
        company: [''],
        position: [''],
        salary: [0],
        end_date: [''],
      }),
      rental_history: this.fb.array([]),
      personal_references: this.fb.array([]),
      professional_references: this.fb.array([]),
    });
  }

  private loadProperty(): void {
    const propertyId = this.route.snapshot.paramMap.get('propertyId');

    if (!propertyId) {
      this.slugService.navigateTo(['portal', 'new-application']);
      return;
    }

    this.isLoadingProperty.set(true);

    this.propertyService
      .getPropertyById(+propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (property) => {
          this.property.set(property || null);
          this.isLoadingProperty.set(false);

          // Pre-fill form with user data if available
          this.prefillUserData();
        },
        error: () => {
          this.isLoadingProperty.set(false);
          this.slugService.navigateTo(['portal', 'new-application']);
        },
      });
  }

  private prefillUserData(): void {
    const currentUser = this.authService.currentUser();

    if (currentUser) {
      this.personalInfoForm.patchValue({
        full_name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
    }
  }

  onStepChange(event: StepperSelectionEvent): void {
    this.currentStep.set(event.selectedIndex);
  }

  goToStep(stepIndex: number): void {
    this.currentStep.set(stepIndex);
  }

  goBack(): void {
    this.slugService.navigateTo(['portal', 'new-application']);
  }

  // ─── Draft persistence ───────────────────────────────────────────────────

  private setupAutosave(): void {
    merge(this.personalInfoForm.valueChanges, this.employmentHistoryForm.valueChanges)
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saveDraft());
  }

  private saveDraft(): void {
    const draft = {
      personalInfo: this.personalInfoForm.getRawValue(),
      employmentHistory: this.employmentHistoryForm.getRawValue(),
    };
    sessionStorage.setItem(this.draftKey, JSON.stringify(draft));
  }

  private restoreDraft(): void {
    const saved = sessionStorage.getItem(this.draftKey);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved);

      if (draft.personalInfo) {
        const pi = draft.personalInfo;
        this.personalInfoForm.patchValue({
          ...pi,
          birth_date: pi.birth_date ? new Date(pi.birth_date) : null,
        });
      }

      if (draft.employmentHistory) {
        const emp = draft.employmentHistory;

        this.employmentHistoryForm.patchValue({
          current_job: {
            ...(emp.current_job || {}),
            start_date: emp.current_job?.start_date ? new Date(emp.current_job.start_date) : null,
          },
          previous_job: {
            ...(emp.previous_job || {}),
            end_date: emp.previous_job?.end_date ? new Date(emp.previous_job.end_date) : null,
          },
        });

        // Restore rental_history FormArray
        if (emp.rental_history?.length) {
          const rentalArray = this.employmentHistoryForm.get('rental_history') as FormArray;
          rentalArray.clear();
          emp.rental_history.forEach((item: any) => {
            rentalArray.push(
              this.fb.group({
                property_address: [item.property_address || '', Validators.required],
                landlord_name: [item.landlord_name || '', Validators.required],
                landlord_phone: [
                  item.landlord_phone || '',
                  [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)],
                ],
                monthly_rent: [item.monthly_rent || '', [Validators.required, Validators.min(0)]],
                start_date: [item.start_date ? new Date(item.start_date) : '', Validators.required],
                end_date: [item.end_date ? new Date(item.end_date) : ''],
                reason_for_leaving: [item.reason_for_leaving || ''],
              }),
            );
          });
        }
      }
    } catch {
      sessionStorage.removeItem(this.draftKey);
    }
  }

  private clearDraft(): void {
    sessionStorage.removeItem(this.draftKey);
  }

  // ─────────────────────────────────────────────────────────────────────────

  submitApplication(): void {
    if (!this.property()) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.slugService.navigateTo(['portal', 'login']);
      return;
    }

    this.isSubmitting.set(true);

    const personalInfo = this.personalInfoForm.value;
    const employmentInfo = this.employmentHistoryForm.value;
    const currentJob = employmentInfo.current_job;
    const rentalHistory = employmentInfo.rental_history || [];
    const personalRefs = employmentInfo.personal_references || [];

    // Mapear referencias personales al formato del API
    const personalReferences = personalRefs.map((ref: any) => ({
      name: ref.name || '',
      relationship: ref.relationship || '',
      phone: ref.phone || '',
      email: ref.email || undefined,
    }));

    // Datos en el formato que REALMENTE espera el backend
    // NOTA: El backend usa una estructura diferente a la documentación
    const applicationData: any = {
      property_id: this.property()!.id,
      // Datos personales - campos planos según el backend
      personal_data: {
        full_name: personalInfo.full_name || currentUser.name,
        phone: personalInfo.phone || currentUser.phone || '',
        // NO enviamos email, birth_date, national_id, marital_status, number_of_dependents
        // porque el backend dice que "should not exist" en personal_data.property
        // El backend obtiene estos datos del token JWT
        identity_document: personalInfo.national_id || '',
        current_address: personalInfo.current_address || '',
      },
      // Datos laborales - campos planos según el backend
      employment_data: {
        employer_name: currentJob?.company || '',
        position: currentJob?.position || '',
        monthly_income: Number(currentJob?.salary) || 0,
        employment_duration: currentJob?.start_date || '',
        employer_phone: currentJob?.supervisor_phone || '',
        // NOTA: No enviamos current_job porque el backend dice "should not exist"
      },
      // Historial de alquiler - mapeado a los nombres que espera el backend
      rental_history: rentalHistory.map((history: any) => ({
        previous_address: history.property_address || '',
        previous_landlord_name: history.landlord_name || '',
        previous_landlord_phone: history.landlord_phone || '',
        previous_rent_amount: Number(history.monthly_rent) || 0,
        reason_for_leaving: history.reason_for_leaving || '',
        // NOTA: No enviamos property_address, landlord_name, etc.
        // porque el backend dice "should not exist"
      })),
      // Referencias - debe ser un array según el backend
      references: personalReferences.length > 0 ? personalReferences : [],
    };

    this.applicationService
      .createApplication(applicationData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.intentionService.clearIntention();
          this.clearDraft();
          this.slugService.navigateTo(['portal', 'home']);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Error submitting application:', error);
        },
      });
  }
}
