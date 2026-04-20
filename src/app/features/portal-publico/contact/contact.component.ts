import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Mail, Phone, MapPin, Send } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent {
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Send = Send;

  contactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  };

  isSubmitting = false;
  submitted = false;

  onSubmit() {
    this.isSubmitting = true;

    // Simulate form submission
    setTimeout(() => {
      this.isSubmitting = false;
      this.submitted = true;
      this.contactForm = {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      };

      setTimeout(() => {
        this.submitted = false;
      }, 5000);
    }, 1500);
  }

  resetForm() {
    this.contactForm = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    };
  }
}
