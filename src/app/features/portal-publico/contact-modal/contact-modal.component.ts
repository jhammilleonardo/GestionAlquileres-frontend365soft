import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Property } from '../../../core/models/property.model';

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-modal.component.html',
  styleUrls: ['./contact-modal.component.css']
})
export class ContactModalComponent {
  @Input() property!: Property;
  @Output() close = new EventEmitter<void>();

  contactForm = {
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredContact: 'email'
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

