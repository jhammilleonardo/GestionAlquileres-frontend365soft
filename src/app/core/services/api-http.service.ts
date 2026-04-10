import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiHttpService {
  private readonly baseUrl = environment.apiUrl;
  private readonly defaultTimeout = environment.apiTimeout || 30000;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: any, headers?: any): Observable<T> {
    const httpParams = this.buildParams(params);
    const httpOptions = {
      params: httpParams,
      headers: this.getHeaders(headers),
    };

    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, httpOptions)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: any, headers?: any): Observable<T> {
    const httpOptions = {
      headers: this.getHeaders(headers, body),
    };

    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, body, httpOptions)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: any, headers?: any): Observable<T> {
    const httpOptions = {
      headers: this.getHeaders(headers, body),
    };

    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, body, httpOptions)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: any, headers?: any): Observable<T> {
    const httpOptions = {
      headers: this.getHeaders(headers, body),
    };

    return this.http
      .patch<T>(`${this.baseUrl}${endpoint}`, body, httpOptions)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, headers?: any): Observable<T> {
    const httpOptions = {
      headers: this.getHeaders(headers),
    };

    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`, httpOptions)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Build HTTP params from object
   */
  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return httpParams;
  }

  /**
   * Get headers with default Content-Type and JWT token if available
   * Note: When body is FormData, Content-Type is omitted to let browser set it automatically with boundary
   */
  private getHeaders(customHeaders?: any, body?: any): HttpHeaders {
    // Si el body es FormData, NO establecer Content-Type (el navegador lo hará automáticamente con boundary)
    const isFormData = body instanceof FormData;

    let headers = new HttpHeaders();

    // Solo establecer Content-Type para JSON si NO es FormData
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }

    // Add JWT token if available (admin or tenant)
    const token =
      localStorage.getItem('admin_access_token') ||
      sessionStorage.getItem('admin_access_token') ||
      localStorage.getItem('tenant_access_token') ||
      sessionStorage.getItem('tenant_access_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (customHeaders) {
      Object.keys(customHeaders).forEach((key) => {
        headers = headers.set(key, customHeaders[key]);
      });
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }

    console.error('HTTP Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
