import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, HelpCircle, ChevronDown, ChevronUp } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-faq',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
})
export class FaqComponent {
  readonly HelpCircle = HelpCircle;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  // Preguntas frecuentes fijas (claves i18n) — comunes a cualquier portal de alquiler
  readonly defaultFaqs = [
    { question: 'public.faq.q1', answer: 'public.faq.a1' },
    { question: 'public.faq.q2', answer: 'public.faq.a2' },
    { question: 'public.faq.q3', answer: 'public.faq.a3' },
    { question: 'public.faq.q4', answer: 'public.faq.a4' },
    { question: 'public.faq.q5', answer: 'public.faq.a5' },
    { question: 'public.faq.q6', answer: 'public.faq.a6' },
    { question: 'public.faq.q7', answer: 'public.faq.a7' },
    { question: 'public.faq.q8', answer: 'public.faq.a8' },
  ];

  private readonly count = computed(() => this.defaultFaqs.length);

  private readonly openState = signal<ReadonlySet<number>>(new Set());

  isOpen(index: number): boolean {
    return this.openState().has(index);
  }

  toggleFaq(index: number): void {
    this.openState.update((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  openAll(): void {
    this.openState.set(new Set(Array.from({ length: this.count() }, (_, i) => i)));
  }

  closeAll(): void {
    this.openState.set(new Set());
  }
}
