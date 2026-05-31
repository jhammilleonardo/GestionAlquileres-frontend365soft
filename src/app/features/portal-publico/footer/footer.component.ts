import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  LucideAngularModule,
  Home,
  MapPin,
  Mail,
  Phone,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  // Lucide icons
  readonly Home = Home;
  readonly MapPin = MapPin;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Clock = Clock;
  readonly Facebook = Facebook;
  readonly Instagram = Instagram;
  readonly Twitter = Twitter;
  readonly Linkedin = Linkedin;

  socialLinks = [
    { name: 'Facebook', icon: this.Facebook, url: '#' },
    { name: 'Instagram', icon: this.Instagram, url: '#' },
    { name: 'Twitter', icon: this.Twitter, url: '#' },
    { name: 'LinkedIn', icon: this.Linkedin, url: '#' },
  ];
}
