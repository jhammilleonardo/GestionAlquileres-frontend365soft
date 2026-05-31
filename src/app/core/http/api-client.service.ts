import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

export type QueryParamPrimitive = string | number | boolean;
export type QueryParams = Record<
  string,
  QueryParamPrimitive | readonly QueryParamPrimitive[] | null | undefined
>;

export type ApiHeaders = HttpHeaders | Record<string, string>;

export interface ApiRequestOptions {
  params?: HttpParams | QueryParams;
  headers?: ApiHeaders;
}

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<TResponse>(endpoint: string, options: ApiRequestOptions = {}): Observable<TResponse> {
    return this.http
      .get<TResponse>(this.buildUrl(endpoint), this.buildOptions(options))
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  post<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody,
    options: ApiRequestOptions = {},
  ): Observable<TResponse> {
    return this.http
      .post<TResponse>(this.buildUrl(endpoint), body, this.buildOptions(options, body))
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  put<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody,
    options: ApiRequestOptions = {},
  ): Observable<TResponse> {
    return this.http
      .put<TResponse>(this.buildUrl(endpoint), body, this.buildOptions(options, body))
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  patch<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody,
    options: ApiRequestOptions = {},
  ): Observable<TResponse> {
    return this.http
      .patch<TResponse>(this.buildUrl(endpoint), body, this.buildOptions(options, body))
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  delete<TResponse>(endpoint: string, options: ApiRequestOptions = {}): Observable<TResponse> {
    return this.http
      .delete<TResponse>(this.buildUrl(endpoint), this.buildOptions(options))
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private buildUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    const normalizedBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${normalizedBaseUrl}${normalizedEndpoint}`;
  }

  private buildOptions<TBody>(
    options: ApiRequestOptions,
    body?: TBody,
  ): { params?: HttpParams; headers: HttpHeaders } {
    return {
      params: this.buildParams(options.params),
      headers: this.buildHeaders(options.headers, body),
    };
  }

  private buildParams(params?: HttpParams | QueryParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    if (params instanceof HttpParams) {
      return params;
    }

    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          httpParams = httpParams.append(key, String(item));
        }
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }

  private buildHeaders<TBody>(headers?: ApiHeaders, body?: TBody): HttpHeaders {
    const isFormData = body instanceof FormData;
    let httpHeaders = headers instanceof HttpHeaders ? headers : new HttpHeaders(headers ?? {});

    if (!isFormData && !httpHeaders.has('Content-Type')) {
      httpHeaders = httpHeaders.set('Content-Type', 'application/json');
    }

    return httpHeaders;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = this.resolveErrorMessage(error);
    return throwError(() => new Error(message));
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const errorBody: unknown = error.error;
    const backendMessage = this.extractBackendMessage(errorBody);

    if (errorBody instanceof ErrorEvent) {
      return `Error: ${errorBody.message}`;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }

    if (backendMessage) {
      return backendMessage;
    }

    if (error.status === 404) {
      return 'Recurso no encontrado.';
    }

    if (error.status === 500) {
      return 'Error interno del servidor.';
    }

    return `Error del servidor: ${error.status} - ${error.message}`;
  }

  private extractBackendMessage(errorBody: unknown): string | null {
    if (!this.hasMessage(errorBody)) {
      return null;
    }

    const { message } = errorBody;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.filter((item): item is string => typeof item === 'string').join(', ');
    }

    return null;
  }

  private hasMessage(value: unknown): value is { message: unknown } {
    return typeof value === 'object' && value !== null && 'message' in value;
  }
}
