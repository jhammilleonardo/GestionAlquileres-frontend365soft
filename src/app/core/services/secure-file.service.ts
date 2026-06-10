import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthContext, SessionTokenService } from './session-token.service';

@Injectable({ providedIn: 'root' })
export class SecureFileService {
  private readonly http = inject(HttpClient);
  private readonly sessionToken = inject(SessionTokenService);
  private readonly objectUrlCache = new Map<string, Observable<string>>();

  getObjectUrl(path: string, context: AuthContext): Observable<string> {
    const url = this.toAbsoluteUrl(path);
    const cacheKey = `${context}:${url}`;
    const cached = this.objectUrlCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get(url, {
        headers: this.buildHeaders(context),
        responseType: 'blob',
      })
      .pipe(
        map((blob) => URL.createObjectURL(blob)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.objectUrlCache.set(cacheKey, request$);
    return request$;
  }

  open(path: string, context: AuthContext): void {
    this.getObjectUrl(path, context).subscribe((objectUrl) => {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    });
  }

  download(path: string, filename: string, context: AuthContext): void {
    this.getObjectUrl(path, context).subscribe((objectUrl) => {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  resolveCachedObjectUrl(path: string, context: AuthContext): Observable<string | null> {
    const cached = this.objectUrlCache.get(`${context}:${this.toAbsoluteUrl(path)}`);
    return cached ?? of(null);
  }

  private buildHeaders(context: AuthContext): HttpHeaders {
    const token = this.sessionToken.getToken(context);
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private toAbsoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const baseUrl = environment.apiUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }
}
