import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule, Users, Target, Award, Heart } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-about',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {
  readonly Users = Users;
  readonly Target = Target;
  readonly Award = Award;
  readonly Heart = Heart;
}
