import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { Property } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/admin/property.service';
import { ToastService } from '../../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contact-modal',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
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
    // Honeypot anti-spam: oculto en el formulario; un humano nunca lo rellena.
    website: '',
  };

  isSubmitting = false;
  submitted = false;

  constructor(
    private propertyService: PropertyService,
    private toast: ToastService,
    private transloco: TranslocoService,
  ) {}

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
        website: this.contactForm.website,
      })
      .subscribe({
        next: () => {
          this.submitted = true;
          this.isSubmitting = false;
          setTimeout(() => {
            this.closeModal();
          }, 2500);
        },
        error: () => {
          this.isSubmitting = false;
          this.toast.error(this.transloco.translate('public.contactModal.submitError'));
        },
      });
  }

  closeModal() {
    this.close.emit();
  }
}
