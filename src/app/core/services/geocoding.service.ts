import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

// Tope de entradas en caché: descarta la más antigua al superarlo (evita crecer sin límite).
const MAX_CACHE_ENTRIES = 50;

/** Desglose de dirección de Nominatim (`addressdetails=1`). */
export interface GeocodingAddressDetails {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface GeocodingSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  address?: GeocodingAddressDetails;
}

interface GeocodingSearchOptions {
  query: string;
  limit: number;
  country?: string;
  signal?: AbortSignal;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  // Caché en memoria de resultados por clave (query|country|limit). El orden de
  // inserción de Map permite descartar la entrada más antigua al llenarse.
  private readonly cache = new Map<string, readonly GeocodingSearchResult[]>();

  async search(options: GeocodingSearchOptions): Promise<readonly GeocodingSearchResult[]> {
    const q = options.query.trim();
    if (!q) return [];

    const countryCode = this.countryCodeForSearch(options.country ?? '');
    const cacheKey = `${q.toLowerCase()}|${countryCode}|${options.limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const params = new URLSearchParams({
      format: 'json',
      limit: String(options.limit),
      addressdetails: '1',
      q,
    });
    if (countryCode) {
      params.set('countrycodes', countryCode);
    }
    // La política de Nominatim pide un contacto para uso intensivo (si está configurado).
    if (environment.geocoder.email) {
      params.set('email', environment.geocoder.email);
    }

    const res = await fetch(`${environment.geocoder.url}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: options.signal,
    });
    const data = (await res.json()) as GeocodingSearchResult[];
    const results = Array.isArray(data) ? data : [];

    this.cacheResult(cacheKey, results);
    return results;
  }

  private cacheResult(key: string, results: readonly GeocodingSearchResult[]): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, results);
  }

  private countryCodeForSearch(country: string): string {
    const normalized = country.trim().toLowerCase();
    const byCode: Record<string, string> = {
      bo: 'bo',
      bolivia: 'bo',
      us: 'us',
      usa: 'us',
      'united states': 'us',
      'estados unidos': 'us',
      gt: 'gt',
      guatemala: 'gt',
      hn: 'hn',
      honduras: 'hn',
    };

    return byCode[normalized] ?? '';
  }
}
