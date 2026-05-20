import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { Property } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/admin/property.service';

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './contact-modal.component.html',
  styleUrls: ['./contact-modal.component.css'],
})
export class ContactModalComponent {
  @Input() property!: Property;
  @Output() close = new EventEmitter<void>();

  contactForm = {
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredContact: 'email',
  };

  isSubmitting = false;
  submitted = false;

  constructor(private propertyService: PropertyService) {}

  submitForm() {
    if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.message) {
      return;
    }

    this.isSubmitting = true;

    this.propertyService
      .submitPropertyContact(this.property.id, {
        name: this.contactForm.name,
        email: this.contactForm.email,
        phone: this.contactForm.phone,
        message: this.contactForm.message,
      })
      .subscribe({
        next: () => {
          this.submitted = true;
          this.isSubmitting = false;
          setTimeout(() => {
            this.closeModal();
          }, 2500);
        },
        error: (error: any) => {
          console.error('Error submitting contact form:', error);
          this.isSubmitting = false;
          alert('Hubo un error al enviar su mensaje. Por favor intente más tarde.');
        },
      });
  }

  closeModal() {
    this.close.emit();
  }
}
