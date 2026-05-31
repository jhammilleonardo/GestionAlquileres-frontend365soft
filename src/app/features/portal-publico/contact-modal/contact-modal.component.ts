import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { Property } from '../../../core/models/property.model';

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
  };

  isSubmitting = false;
  submitted = false;

  submitForm() {
    this.isSubmitting = true;

    // Simular envío
    setTimeout(() => {
      this.submitted = true;
      this.isSubmitting = false;

      setTimeout(() => {
        this.closeModal();
      }, 2500);
    }, 1000);
  }

  closeModal() {
    this.close.emit();
  }
}
