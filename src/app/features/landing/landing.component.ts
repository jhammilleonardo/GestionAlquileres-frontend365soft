import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  LogIn,
  Home,
  Star,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope('landing')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements AfterViewInit {
  readonly languageService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly Building2 = Building2;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly DollarSign = DollarSign;
  readonly Wrench = Wrench;
  readonly BarChart3 = BarChart3;
  readonly Shield = Shield;
  readonly CheckCircle = CheckCircle;
  readonly ArrowRight = ArrowRight;
  readonly LogIn = LogIn;
  readonly Home = Home;
  readonly Star = Star;
  readonly TrendingUp = TrendingUp;
  readonly Clock = Clock;
  readonly Zap = Zap;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    document
      .querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach((el) => observer.observe(el));
  }
}
