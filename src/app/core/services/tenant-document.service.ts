import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantDocument } from '../models/document.model';

@Injectable({
    providedIn: 'root'
})
export class TenantDocumentService {
    private http = inject(HttpClient);
    
    // Reactive state
    private documentsSignal = signal<TenantDocument[]>([]);
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    documents = this.documentsSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();

    /**
     * Cargar todos los documentos del inquilino
     * NOTE: Requiere endpoint backend: GET /tenant/documents
     */
    loadDocuments(): void {
        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        this.http.get<TenantDocument[]>(`${environment.apiUrl}tenant/documents`)
            .pipe(
                tap(documents => {
                    const parsedDocs = documents.map(d => ({
                        ...d,
                        uploaded_at: new Date(d.uploaded_at),
                        expires_at: d.expires_at ? new Date(d.expires_at) : undefined,
                        signed_at: d.signed_at ? new Date(d.signed_at) : undefined
                    }));
                    this.documentsSignal.set(parsedDocs);
                    this.isLoadingSignal.set(false);
                }),
                catchError(error => {
                    this.errorSignal.set('Error al cargar los documentos');
                    this.isLoadingSignal.set(false);
                    console.error('Error loading documents:', error);
                    return of([]);
                })
            )
            .subscribe();
    }

    /**
     * Obtener un documento específico
     */
    getDocument(id: number): Observable<TenantDocument> {
        return this.http.get<TenantDocument>(`${environment.apiUrl}/tenant/documents/${id}`)
            .pipe(
                tap(document => {
                    const parsedDoc = {
                        ...document,
                        uploaded_at: new Date(document.uploaded_at),
                        expires_at: document.expires_at ? new Date(document.expires_at) : undefined,
                        signed_at: document.signed_at ? new Date(document.signed_at) : undefined
                    };
                    
                    // Actualizar en la lista si existe
                    this.documentsSignal.update(docs => 
                        docs.map(d => d.id === parsedDoc.id ? parsedDoc : d)
                    );
                }),
                catchError(error => {
                    console.error('Error loading document:', error);
                    throw error;
                })
            );
    }

    /**
     * Descargar un documento
     */
    downloadDocument(documentId: number): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}/tenant/documents/${documentId}/download`, {
            responseType: 'blob'
        });
    }

    /**
     * Marcar documento como firmado
     */
    signDocument(documentId: number): Observable<TenantDocument> {
        return this.http.post<TenantDocument>(
            `${environment.apiUrl}/tenant/documents/${documentId}/sign`,
            {}
        ).pipe(
            tap(document => {
                const parsedDoc = {
                    ...document,
                    uploaded_at: new Date(document.uploaded_at),
                    expires_at: document.expires_at ? new Date(document.expires_at) : undefined,
                    signed_at: document.signed_at ? new Date(document.signed_at) : undefined
                };
                
                // Actualizar en la lista
                this.documentsSignal.update(docs => 
                    docs.map(d => d.id === parsedDoc.id ? parsedDoc : d)
                );
            }),
            catchError(error => {
                this.errorSignal.set('Error al firmar el documento');
                throw error;
            })
        );
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.errorSignal.set(null);
    }
}
