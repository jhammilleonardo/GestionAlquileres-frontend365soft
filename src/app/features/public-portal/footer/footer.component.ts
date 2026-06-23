import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
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
  MessageCircle,
} from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

import { PublicBrandingService } from '../../../core/services/public-branding.service';
import { normalizeSocialUrl } from '../../../core/utils/social-link.util';

interface FooterSocialLink {
  name: string;
  icon: LucideIconData;
  url: string;
}

const SOCIAL_ICONS: Record<string, { name: string; icon: LucideIconData }> = {
  facebook: { name: 'Facebook', icon: Facebook },
  instagram: { name: 'Instagram', icon: Instagram },
  twitter: { name: 'Twitter', icon: Twitter },
  linkedin: { name: 'LinkedIn', icon: Linkedin },
  whatsapp: { name: 'WhatsApp', icon: MessageCircle },
};

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

  private readonly brandingService = inject(PublicBrandingService);

  readonly logoUrl = computed(() => this.brandingService.logoUrl());
  readonly companyName = computed(() => this.brandingService.branding()?.company_name ?? null);
  readonly companyDescription = computed(
    () => this.brandingService.branding()?.company_description ?? null,
  );
  readonly contactEmail = computed(() => this.brandingService.branding()?.contact_email ?? null);
  readonly contactPhone = computed(() => this.brandingService.branding()?.contact_phone ?? null);

  // Redes sociales configuradas por el tenant; vacío si no hay ninguna.
  readonly socialLinks = computed<FooterSocialLink[]>(() => {
    const links = this.brandingService.branding()?.social_links ?? {};
    return Object.entries(links)
      .filter(([, url]) => !!url)
      .map(([key, url]) => {
        const meta = SOCIAL_ICONS[key.toLowerCase()];
        const normalizedUrl = normalizeSocialUrl(key, url);
        return meta && normalizedUrl
          ? { name: meta.name, icon: meta.icon, url: normalizedUrl }
          : null;
      })
      .filter((link): link is FooterSocialLink => link !== null);
  });
}
