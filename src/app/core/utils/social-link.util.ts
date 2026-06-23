interface SocialPlatformConfig {
  readonly hosts: readonly string[];
  readonly profileBase: string;
}

const SOCIAL_PLATFORMS: Readonly<Record<string, SocialPlatformConfig>> = {
  facebook: {
    hosts: ['facebook.com', 'fb.com'],
    profileBase: 'https://www.facebook.com/',
  },
  instagram: {
    hosts: ['instagram.com'],
    profileBase: 'https://www.instagram.com/',
  },
  twitter: {
    hosts: ['twitter.com', 'x.com'],
    profileBase: 'https://x.com/',
  },
  linkedin: {
    hosts: ['linkedin.com'],
    profileBase: 'https://www.linkedin.com/in/',
  },
  whatsapp: {
    hosts: ['wa.me', 'whatsapp.com'],
    profileBase: 'https://wa.me/',
  },
};

export function normalizeSocialUrl(platform: string, value: unknown): string | null {
  const config = SOCIAL_PLATFORMS[platform.toLowerCase()];
  if (!config || typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  const externalUrl = parsePlatformUrl(raw, config);
  if (externalUrl) return externalUrl;
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) return null;

  if (platform.toLowerCase() === 'whatsapp') {
    const phone = raw.replace(/\D/g, '');
    return phone.length >= 7 && phone.length <= 15 ? `${config.profileBase}${phone}` : null;
  }

  const handle = raw.replace(/^@/, '');
  return /^[a-z\d._-]{1,100}$/i.test(handle)
    ? `${config.profileBase}${encodeURIComponent(handle)}`
    : null;
}

function parsePlatformUrl(raw: string, config: SocialPlatformConfig): string | null {
  const withoutProtocol = raw.replace(/^\/\//, '');
  const looksLikePlatformUrl = config.hosts.some((host) =>
    withoutProtocol
      .toLowerCase()
      .replace(/^www\./, '')
      .startsWith(host),
  );
  if (!/^https?:\/\//i.test(raw) && !looksLikePlatformUrl) return null;

  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${withoutProtocol}`);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const allowed = config.hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    if (!allowed) return null;
    parsed.protocol = 'https:';
    return parsed.toString();
  } catch {
    return null;
  }
}
