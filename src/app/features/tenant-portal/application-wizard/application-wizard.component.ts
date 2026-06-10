import {
  Component,
  DestroyRef,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { debounceTime, merge } from 'rxjs';
import { ApplicationService } from '../../../core/services/admin/application.service';
import { PropertyService } from '../../../core/services/admin/property.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { ApplicationIntentionService } from '../../../core/services/tenant/application-intention.service';
import { SlugService } from '../../../core/services/slug.service';
import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { Property } from '../../../core/models/property.model';
import { CreateApplicationDto } from '../../../core/models/application.model';
import {
  AppButtonComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppStepperComponent,
  ToastService,
} from '../../../shared/ui';
import { Step1PersonalInfoComponent } from './steps/step-1-personal-info.component';
import { Step2EmploymentHistoryComponent } from './steps/step-2-employment-history.component';
import { Step3PreviewSubmitComponent } from './steps/step-3-preview-submit.component';

interface WizardDraft {
  personalInfo?: Record<string, unknown>;
  employmentHistory?: {
    current_job?: Record<string, unknown>;
    previous_job?: Record<string, unknown>;
    rental_history?: RentalHistoryDraft[];
  };
}

interface PersonalInfoDraft {
  full_name?: string;
  phone?: string;
  national_id?: string;
  current_address?: string;
  birth_date?: string | Date;
}

interface CurrentJobDraft {
  company?: string;
  position?: string;
  salary?: number | string;
  start_date?: string;
  supervisor_phone?: string;
}

interface EmploymentRawValue {
  current_job?: CurrentJobDraft;
  previous_job?: Record<string, unknown>;
  rental_history?: RentalHistoryDraft[];
  personal_references?: PersonalReferenceDraft[];
}

interface RentalHistoryDraft {
  property_address?: string;
  landlord_name?: string;
  landlord_phone?: string;
  monthly_rent?: number | string;
  start_date?: string | Date;
  end_date?: string | Date;
  reason_for_leaving?: string;
}

interface PersonalReferenceDraft {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

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
  rental_history: Array<{
    previous_address: string;
    previous_landlord_name: string;
    previous_landlord_phone: string;
    previous_rent_amount: number;
    reason_for_leaving: string;
  }>;
  references: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-application-wizard',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStepperComponent,
    Step1PersonalInfoComponent,
    Step2EmploymentHistoryComponent,
    Step3PreviewSubmitComponent,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <section class="application-wizard">
      <app-button appearance="outline" size="s" (clicked)="goBack()">
        <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
        {{ 'rentalApp.back' | transloco }}
      </app-button>

      <app-page-header
        class="wizard-header"
        [eyebrow]="'tenantApplications.marketplace.title' | transloco"
        [title]="'rentalApp.title' | transloco"
        [description]="property()?.title || null"
      />

      @if (isLoadingProperty()) {
        <div class="state-box">
          <app-loading-state [label]="'rentalApp.loading' | transloco" />
        </div>
      } @else if (property()) {
        <section class="wizard-panel">
          <app-stepper [steps]="stepLabels()" [currentIndex]="currentStep()" />

          @if (currentStep() === 0) {
            <app-step-1-personal-info
              [formGroup]="personalInfoForm"
              (isValid)="personalInfoValid.set($event)"
            />
          } @else if (currentStep() === 1) {
            <app-step-2-employment-history
              [formGroup]="employmentHistoryForm"
              (isValid)="employmentHistoryValid.set($event)"
            />
          } @else if (property(); as selectedProperty) {
            <app-step-3-preview-submit
              [property]="selectedProperty"
              [personalInfo]="personalInfoForm.value"
              [employmentHistory]="employmentHistoryForm.value"
              [rentalHistory]="employmentHistoryForm.get('rental_history')?.value || []"
              [isSubmitting]="isSubmitting()"
              (submit)="submitApplication()"
              (editStep)="goToStep($event)"
            />
          }

          <footer class="wizard-actions">
            <app-button
              appearance="outline"
              [disabled]="currentStep() === 0 || isSubmitting()"
              (clicked)="previousStep()"
            >
              <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
              {{ 'rentalApp.previous' | transloco }}
            </app-button>

            @if (currentStep() < 2) {
              <app-button appearance="primary" [disabled]="!canGoNext()" (clicked)="nextStep()">
                {{ 'rentalApp.next' | transloco }}
                <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
              </app-button>
            } @else {
              <app-button
                appearance="primary"
                [loading]="isSubmitting()"
                [disabled]="isSubmitting()"
                (clicked)="submitApplication()"
              >
                <lucide-icon [img]="CheckCircle2" [size]="18"></lucide-icon>
                {{ 'rentalApp.submitBtn' | transloco }}
              </app-button>
            }
          </footer>
        </section>
      }
    </section>
  `,
  styles: `
    .application-wizard {
      display: grid;
      gap: var(--app-space-4);
      max-inline-size: 980px;
      margin-inline: auto;
    }

    .wizard-header {
      margin-block-start: var(--app-space-2);
    }

    .state-box {
      display: grid;
      min-block-size: 20rem;
      place-items: center;
    }

    .wizard-panel {
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
      padding: var(--app-space-5);
    }

    .wizard-actions {
      display: flex;
      justify-content: space-between;
      gap: var(--app-space-3);
      border-top: 1px solid var(--app-color-border);
      margin-block-start: var(--app-space-5);
      padding-block-start: var(--app-space-4);
    }

    @media (max-width: 640px) {
      .wizard-panel {
        padding: var(--app-space-4);
      }

      .wizard-actions {
        flex-direction: column-reverse;
      }

      .wizard-actions app-button {
        inline-size: 100%;
      }
    }
  `,
})
export class ApplicationWizardComponent implements OnInit {
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly ArrowRight = ArrowRight;
  protected readonly CheckCircle2 = CheckCircle2;

  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(TenantAuthService);
  private readonly applicationService = inject(ApplicationService);
  private readonly propertyService = inject(PropertyService);
  private readonly slugService = inject(SlugService);
  private readonly intentionService = inject(ApplicationIntentionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly toast = inject(ToastService);

  protected readonly currentStep = signal(0);
  protected readonly property = signal<Property | null>(null);
  protected readonly isLoadingProperty = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly personalInfoValid = signal(false);
  protected readonly employmentHistoryValid = signal(false);

  protected personalInfoForm!: FormGroup;
  protected employmentHistoryForm!: FormGroup;

  private readonly DRAFT_PREFIX = 'wizard_draft_';

  private get draftKey(): string {
    const propertyId = this.route.snapshot.paramMap.get('propertyId') || 'unknown';
    return `${this.DRAFT_PREFIX}${propertyId}`;
  }

  protected stepLabels(): readonly string[] {
    return [
      this.translocoService.translate('rentalApp.step1Label'),
      this.translocoService.translate('rentalApp.step2Label'),
      this.translocoService.translate('rentalApp.step3Label'),
    ];
  }

  ngOnInit(): void {
    this.initializeForms();
    this.restoreDraft();
    this.loadProperty();
    this.setupAutosave();
  }

  protected canGoNext(): boolean {
    if (this.currentStep() === 0) return this.personalInfoForm.valid;
    if (this.currentStep() === 1) return this.employmentHistoryForm.valid;
    return false;
  }

  protected nextStep(): void {
    if (!this.canGoNext()) {
      if (this.currentStep() === 0) this.personalInfoForm.markAllAsTouched();
      if (this.currentStep() === 1) this.employmentHistoryForm.markAllAsTouched();
      return;
    }

    this.currentStep.update((step) => Math.min(2, step + 1));
  }

  protected previousStep(): void {
    this.currentStep.update((step) => Math.max(0, step - 1));
  }

  protected goToStep(stepIndex: number): void {
    this.currentStep.set(Math.max(0, Math.min(2, stepIndex)));
  }

  protected goBack(): void {
    this.slugService.navigateTo(['portal', 'new-application']);
  }

  private initializeForms(): void {
    this.personalInfoForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      email: ['', [Validators.email]],
      birth_date: ['', [Validators.required]],
      national_id: ['', [Validators.required, Validators.minLength(8)]],
      current_address: [''],
      marital_status: ['soltero', [Validators.required]],
      number_of_dependents: [0, [Validators.required, Validators.min(0)]],
    });

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
      .getPropertyById(Number(propertyId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (property) => {
          this.property.set(property || null);
          this.isLoadingProperty.set(false);
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

  private setupAutosave(): void {
    merge(this.personalInfoForm.valueChanges, this.employmentHistoryForm.valueChanges)
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saveDraft());
  }

  private saveDraft(): void {
    const draft: WizardDraft = {
      personalInfo: this.personalInfoForm.getRawValue() as Record<string, unknown>,
      employmentHistory:
        this.employmentHistoryForm.getRawValue() as WizardDraft['employmentHistory'],
    };
    sessionStorage.setItem(this.draftKey, JSON.stringify(draft));
  }

  private restoreDraft(): void {
    const saved = sessionStorage.getItem(this.draftKey);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved) as WizardDraft;

      if (draft.personalInfo) {
        this.personalInfoForm.patchValue({
          ...draft.personalInfo,
          birth_date: this.toDateInput(draft.personalInfo['birth_date']),
        });
      }

      if (draft.employmentHistory) {
        const employment = draft.employmentHistory;

        this.employmentHistoryForm.patchValue({
          current_job: {
            ...(employment.current_job || {}),
            start_date: this.toDateInput(employment.current_job?.['start_date']),
          },
          previous_job: {
            ...(employment.previous_job || {}),
            end_date: this.toDateInput(employment.previous_job?.['end_date']),
          },
        });

        if (employment.rental_history?.length) {
          const rentalArray = this.employmentHistoryForm.get('rental_history') as FormArray;
          rentalArray.clear();
          employment.rental_history.forEach((item) => {
            rentalArray.push(this.createRentalHistoryGroup(item));
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

  protected submitApplication(): void {
    const property = this.property();
    if (!property) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.slugService.navigateTo(['portal', 'login']);
      return;
    }

    this.isSubmitting.set(true);

    const personalInfo = this.personalInfoForm.getRawValue() as PersonalInfoDraft;
    const employmentInfo = this.employmentHistoryForm.getRawValue() as EmploymentRawValue;
    const currentJob = employmentInfo.current_job;
    const rentalHistory = employmentInfo.rental_history ?? [];
    const personalRefs = employmentInfo.personal_references ?? [];

    const payload: ApplicationPayload = {
      property_id: property.id,
      personal_data: {
        full_name: personalInfo.full_name || currentUser.name,
        phone: personalInfo.phone || currentUser.phone || '',
        identity_document: personalInfo.national_id || '',
        current_address: personalInfo.current_address || '',
      },
      employment_data: {
        employer_name: currentJob?.company || '',
        position: currentJob?.position || '',
        monthly_income: Number(currentJob?.salary) || 0,
        employment_duration: currentJob?.start_date || '',
        employer_phone: currentJob?.supervisor_phone || '',
      },
      rental_history: rentalHistory.map((history: RentalHistoryDraft) => ({
        previous_address: history.property_address || '',
        previous_landlord_name: history.landlord_name || '',
        previous_landlord_phone: history.landlord_phone || '',
        previous_rent_amount: Number(history.monthly_rent) || 0,
        reason_for_leaving: history.reason_for_leaving || '',
      })),
      references: personalRefs.map((reference) => ({
        name: reference.name || '',
        relationship: reference.relationship || '',
        phone: reference.phone || '',
        email: reference.email || undefined,
      })),
    };

    this.applicationService
      .createApplication(payload as unknown as CreateApplicationDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.intentionService.clearIntention();
          this.clearDraft();
          this.slugService.navigateTo(['portal', 'home']);
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          this.toast.error(
            getApiErrorMessage(error, this.translocoService.translate('rentalApp.submitError')),
          );
        },
      });
  }

  private createRentalHistoryGroup(item: RentalHistoryDraft = {}): FormGroup {
    return this.fb.group({
      property_address: [item.property_address || '', Validators.required],
      landlord_name: [item.landlord_name || '', Validators.required],
      landlord_phone: [
        item.landlord_phone || '',
        [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)],
      ],
      monthly_rent: [item.monthly_rent || '', [Validators.required, Validators.min(0)]],
      start_date: [this.toDateInput(item.start_date), Validators.required],
      end_date: [this.toDateInput(item.end_date)],
      reason_for_leaving: [item.reason_for_leaving || ''],
    });
  }

  private toDateInput(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'string') return value.slice(0, 10);
    if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10);
    return '';
  }
}
