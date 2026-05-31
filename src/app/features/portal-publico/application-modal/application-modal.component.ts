import {
  Component,
  input,
  output,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { Property, RentalApplication } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/admin/property.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-application-modal',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './application-modal.component.html',
  styleUrls: ['./application-modal.component.css'],
})
export class ApplicationModalComponent implements OnInit {
  readonly property = input.required<Property>();
  readonly close = output<void>();

  application: RentalApplication = {
    propertyId: 0,
    applicantInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      currentAddress: '',
      employmentStatus: '',
      monthlyIncome: 0,
      moveInDate: new Date(),
    },
    additionalInfo: '',
  };

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);

  private propertyService = inject(PropertyService);
  private toast = inject(ToastService);

  ngOnInit() {
    this.application.propertyId = this.property().id;
  }

  submitApplication() {
    this.isSubmitting.set(true);

    this.propertyService.submitApplication(this.application).subscribe({
      next: (success) => {
        if (success) {
          this.submitted.set(true);
          setTimeout(() => {
            this.closeModal();
          }, 3000);
        }
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toast.error('Hubo un error al enviar la solicitud. Por favor intente nuevamente.');
        this.isSubmitting.set(false);
      },
    });
  }

  closeModal() {
    this.close.emit();
  }
}
