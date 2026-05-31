import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule, HelpCircle, ChevronDown, ChevronUp } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-faq',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
})
export class FaqComponent {
  readonly HelpCircle = HelpCircle;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  faqs = [
    { question: 'public.faq.q1', answer: 'public.faq.a1', isOpen: false },
    { question: 'public.faq.q2', answer: 'public.faq.a2', isOpen: false },
    { question: 'public.faq.q3', answer: 'public.faq.a3', isOpen: false },
    { question: 'public.faq.q4', answer: 'public.faq.a4', isOpen: false },
    { question: 'public.faq.q5', answer: 'public.faq.a5', isOpen: false },
    { question: 'public.faq.q6', answer: 'public.faq.a6', isOpen: false },
    { question: 'public.faq.q7', answer: 'public.faq.a7', isOpen: false },
    { question: 'public.faq.q8', answer: 'public.faq.a8', isOpen: false },
  ];

  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  openAll() {
    this.faqs.forEach((faq) => (faq.isOpen = true));
  }

  closeAll() {
    this.faqs.forEach((faq) => (faq.isOpen = false));
  }
}
