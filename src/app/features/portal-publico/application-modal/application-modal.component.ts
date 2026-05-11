import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { Property, RentalApplication } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/admin/property.service';

@Component({
  selector: 'app-application-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './application-modal.component.html',
  styleUrls: ['./application-modal.component.css'],
})
export class ApplicationModalComponent {
  @Input() property!: Property;
  @Output() close = new EventEmitter<void>();

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

  isSubmitting = false;
  submitted = false;

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.application.propertyId = this.property.id;
  }

  submitApplication() {
    this.isSubmitting = true;

    this.propertyService.submitApplication(this.application).subscribe({
      next: (success) => {
        if (success) {
          this.submitted = true;
          setTimeout(() => {
            this.closeModal();
          }, 3000);
        }
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error submitting application:', error);
        alert('Hubo un error al enviar la solicitud. Por favor intente nuevamente.');
        this.isSubmitting = false;
      },
    });
  }

  closeModal() {
    this.close.emit();
  }
}
