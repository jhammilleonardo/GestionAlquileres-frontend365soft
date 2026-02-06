import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { LucideAngularModule, FileText, Download, Eye, CheckCircle2, Clock, AlertTriangle, FileCheck } from 'lucide-angular';
import { TenantDocumentService } from '../../../core/services/tenant-document.service';
import { TenantDocument, DocumentTypeLabels, DocumentType } from '../../../core/models/document.model';

@Component({
    selector: 'app-tenant-documents',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        LucideAngularModule
    ],
    template: `
        <div class="documents-container">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <lucide-icon [img]="FileText" [size]="32"></lucide-icon>
                    <div>
                        <h1>Documentos</h1>
                        <p>Accede a tus documentos y contratos</p>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="stats-row">
                <mat-chip-listbox>
                    <mat-chip-option>
                        Todos ({{ documentService.documents().length }})
                    </mat-chip-option>
                    <mat-chip-option>
                        Contratos ({{ getCountByType('CONTRACT') }})
                    </mat-chip-option>
                    <mat-chip-option>
                        Pendientes de Firma ({{ pendingSignatureCount() }})
                    </mat-chip-option>
                </mat-chip-listbox>
            </div>

            <!-- Loading -->
            @if (documentService.isLoading()) {
                <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Cargando documentos...</p>
                </div>
            }

            <!-- Empty State -->
            @else if (documentService.documents().length === 0) {
                <div class="empty-state">
                    <lucide-icon [img]="FileText" [size]="64"></lucide-icon>
                    <h2>No hay documentos disponibles</h2>
                    <p>Aún no tienes documentos en tu cuenta</p>
                </div>
            }

            <!-- Documents Grid -->
            @else {
                <div class="documents-grid">
                    @for (doc of documentService.documents(); track doc.id) {
                        <mat-card class="document-card">
                            <div class="document-header">
                                <div class="document-icon">
                                    <lucide-icon [img]="FileText" [size]="32"></lucide-icon>
                                </div>
                                <div class="document-type">
                                    {{ documentTypeLabels[doc.document_type] }}
                                </div>
                            </div>

                            <h3 class="document-title">{{ doc.title }}</h3>
                            
                            @if (doc.description) {
                                <p class="document-description">{{ doc.description }}</p>
                            }

                            <div class="document-meta">
                                <div class="meta-item">
                                    <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                                    {{ formatDate(doc.uploaded_at) }}
                                </div>
                                <div class="meta-item">
                                    {{ formatFileSize(doc.file_size) }}
                                </div>
                            </div>

                            <!-- Signature Status -->
                            @if (doc.requires_signature) {
                                <div class="signature-status" [class.signed]="doc.is_signed">
                                    @if (doc.is_signed) {
                                        <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                                        <span>Firmado el {{ formatDate(doc.signed_at!) }}</span>
                                    } @else {
                                        <lucide-icon [img]="AlertTriangle" [size]="16"></lucide-icon>
                                        <span>Requiere Firma</span>
                                    }
                                </div>
                            }

                            <!-- Expiration Warning -->
                            @if (doc.expires_at && isExpiringSoon(doc.expires_at)) {
                                <div class="expiration-warning">
                                    <lucide-icon [img]="AlertTriangle" [size]="14"></lucide-icon>
                                    <span>Expira el {{ formatDate(doc.expires_at) }}</span>
                                </div>
                            }

                            <!-- Actions -->
                            <div class="document-actions">
                                <button 
                                    mat-stroked-button 
                                    (click)="viewDocument(doc)"
                                    class="action-btn">
                                    <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                                    Ver
                                </button>
                                <button 
                                    mat-stroked-button 
                                    (click)="downloadDocument(doc)"
                                    class="action-btn">
                                    <lucide-icon [img]="Download" [size]="16"></lucide-icon>
                                    Descargar
                                </button>
                                @if (doc.requires_signature && !doc.is_signed) {
                                    <button 
                                        mat-raised-button 
                                        color="primary"
                                        (click)="signDocument(doc)"
                                        class="action-btn">
                                        <lucide-icon [img]="FileCheck" [size]="16"></lucide-icon>
                                        Firmar
                                    </button>
                                }
                            </div>
                        </mat-card>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        .documents-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 16px;
        }

        .header-content {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-content h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .header-content p {
            color: #64748b;
            margin: 0;
        }

        .stats-row {
            margin-bottom: 24px;
        }

        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px;
            color: #64748b;
        }

        .loading p {
            margin-top: 16px;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #64748b;
        }

        .empty-state lucide-icon {
            opacity: 0.5;
            margin-bottom: 16px;
        }

        .empty-state h2 {
            color: #1e293b;
            margin: 0 0 8px;
        }

        .empty-state p {
            margin: 0;
        }

        .documents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
        }

        .document-card {
            padding: 24px;
            display: flex;
            flex-direction: column;
        }

        .document-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .document-icon {
            width: 56px;
            height: 56px;
            background: var(--mat-sys-primary-container);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--mat-sys-primary);
        }

        .document-type {
            padding: 4px 12px;
            background: #f1f5f9;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
        }

        .document-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px;
        }

        .document-description {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 16px;
        }

        .document-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #64748b;
        }

        .signature-status {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 12px;
        }

        .signature-status.signed {
            background: #d1fae5;
            color: #047857;
        }

        .signature-status:not(.signed) {
            background: #fef3c7;
            color: #b45309;
        }

        .expiration-warning {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: #fee2e2;
            color: #dc2626;
            border-radius: 6px;
            font-size: 12px;
            margin-bottom: 12px;
        }

        .document-actions {
            display: flex;
            gap: 8px;
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
        }

        .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
        }

        @media (max-width: 768px) {
            .documents-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class TenantDocumentsComponent implements OnInit {
    readonly FileText = FileText;
    readonly Download = Download;
    readonly Eye = Eye;
    readonly CheckCircle2 = CheckCircle2;
    readonly Clock = Clock;
    readonly AlertTriangle = AlertTriangle;
    readonly FileCheck = FileCheck;

    documentService = inject(TenantDocumentService);

    documentTypeLabels = DocumentTypeLabels;

    pendingSignatureCount = computed(() => 
        this.documentService.documents().filter(d => d.requires_signature && !d.is_signed).length
    );

    ngOnInit(): void {
        this.documentService.loadDocuments();
    }

    getCountByType(type: string): number {
        return this.documentService.documents().filter(d => d.document_type === type).length;
    }

    viewDocument(doc: TenantDocument): void {
        window.open(doc.file_url, '_blank');
    }

    downloadDocument(doc: TenantDocument): void {
        this.documentService.downloadDocument(doc.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = doc.file_name;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                console.error('Error downloading document:', error);
                alert('Error al descargar el documento');
            }
        });
    }

    signDocument(doc: TenantDocument): void {
        if (confirm(`¿Deseas firmar el documento "${doc.title}"?`)) {
            this.documentService.signDocument(doc.id).subscribe({
                next: () => {
                    alert('Documento firmado exitosamente');
                },
                error: (error) => {
                    console.error('Error signing document:', error);
                    alert('Error al firmar el documento');
                }
            });
        }
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    isExpiringSoon(date: Date): boolean {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return date <= thirtyDaysFromNow && date >= now;
    }
}
