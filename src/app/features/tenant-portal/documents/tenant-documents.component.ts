import { Component, inject, OnInit, computed } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import {
  LucideAngularModule,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  FileSignature,
} from 'lucide-angular';
import { TenantDocumentService } from '../../../core/services/tenant/tenant-document.service';
import { FormatService } from '../../../core/services/format.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import {
  TenantDocument,
  DocumentTypeLabels,
  DocumentType,
} from '../../../core/models/document.model';
import { TenantContractListComponent } from './tenant-contract-list.component';

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
    LucideAngularModule,
    TranslocoModule,
    TenantContractListComponent,
    TenantDatePipe,
  ],
  template: `
    <div class="documents-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <lucide-icon [img]="FileText" [size]="32"></lucide-icon>
          <div>
            <h1>{{ 'tenantDocuments.title' | transloco }}</h1>
            <p>{{ 'tenantDocuments.subtitle' | transloco }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <mat-tab-group class="docs-tabs" mat-stretch-tabs animationDuration="0ms">
        <!-- Tab: Documentos Generales -->
        <mat-tab [label]="'tenantDocuments.tabDocs' | transloco">
          <ng-template matTabContent>
            <!-- Stats -->
            <div class="stats-row">
              <mat-chip-listbox>
                <mat-chip-option>
                  {{ 'tenantDocuments.all' | transloco }} ({{ documentService.documents().length }})
                </mat-chip-option>
                <mat-chip-option>
                  {{ 'tenantDocuments.pendingSignature' | transloco }} ({{
                    pendingSignatureCount()
                  }})
                </mat-chip-option>
              </mat-chip-listbox>
            </div>

            <!-- Loading -->
            @if (documentService.isLoading()) {
              <div class="documents-grid">
                @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                  <mat-card class="skeleton-document-card">
                    <!-- ... skeleton content ... -->
                    <div class="skeleton-doc-header">
                      <div class="skeleton-doc-icon"></div>
                      <div class="skeleton-badge"></div>
                    </div>
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-meta">
                      <div class="skeleton-line short"></div>
                      <div class="skeleton-line short"></div>
                    </div>
                    <div class="skeleton-actions">
                      <div class="skeleton-btn"></div>
                      <div class="skeleton-btn"></div>
                    </div>
                  </mat-card>
                }
              </div>
            }

            <!-- Empty State -->
            @else if (documentService.documents().length === 0) {
              <div class="empty-state">
                <lucide-icon [img]="FileText" [size]="64"></lucide-icon>
                <h2>{{ 'tenantDocuments.noDocsTitle' | transloco }}</h2>
                <p>{{ 'tenantDocuments.noDocsDesc' | transloco }}</p>
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
                        {{ 'tenantDocuments.type.' + doc.document_type | transloco }}
                      </div>
                    </div>

                    <h3 class="document-title">{{ doc.title }}</h3>

                    @if (doc.description) {
                      <p class="document-description">{{ doc.description }}</p>
                    }

                    <div class="document-meta">
                      <div class="meta-item">
                        <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                        {{ doc.uploaded_at | tenantDate }}
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
                          <span>{{
                            'tenantDocuments.signedOn'
                              | transloco: { date: formatDate(doc.signed_at!) }
                          }}</span>
                        } @else {
                          <lucide-icon [img]="AlertTriangle" [size]="16"></lucide-icon>
                          <span>{{ 'tenantDocuments.requiresSignature' | transloco }}</span>
                        }
                      </div>
                    }

                    <!-- Expiration Warning -->
                    @if (doc.expires_at && isExpiringSoon(doc.expires_at)) {
                      <div class="expiration-warning">
                        <lucide-icon [img]="AlertTriangle" [size]="14"></lucide-icon>
                        <span>{{
                          'tenantDocuments.expiresOn'
                            | transloco: { date: formatDate(doc.expires_at) }
                        }}</span>
                      </div>
                    }

                    <!-- Actions -->
                    <div class="document-actions">
                      <button mat-stroked-button (click)="viewDocument(doc)" class="action-btn">
                        <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                        {{ 'tenantDocuments.view' | transloco }}
                      </button>
                      <button mat-stroked-button (click)="downloadDocument(doc)" class="action-btn">
                        <lucide-icon [img]="Download" [size]="16"></lucide-icon>
                        {{ 'tenantDocuments.download' | transloco }}
                      </button>
                      @if (doc.requires_signature && !doc.is_signed) {
                        <button
                          mat-raised-button
                          color="primary"
                          (click)="signDocument(doc)"
                          class="action-btn"
                        >
                          <lucide-icon [img]="FileCheck" [size]="16"></lucide-icon>
                          {{ 'tenantDocuments.sign' | transloco }}
                        </button>
                      }
                    </div>
                  </mat-card>
                }
              </div>
            }
          </ng-template>
        </mat-tab>

        <!-- Tab: Contratos -->
        <mat-tab [label]="'tenantDocuments.tabContracts' | transloco">
          <ng-template matTabContent>
            <app-tenant-contract-list></app-tenant-contract-list>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
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

      .docs-tabs {
        margin-bottom: 24px;
      }

      .docs-tabs ::ng-deep .mat-mdc-tab-header {
        border-bottom: 2px solid #e2e8f0;
      }

      .docs-tabs ::ng-deep .mat-mdc-tab {
        color: #64748b;
        font-weight: 500;
      }

      .docs-tabs ::ng-deep .mat-mdc-tab.mdc-tab--active {
        color: var(--mat-sys-primary);
        font-weight: 600;
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

      /* Skeleton Loaders */
      @keyframes shimmer {
        0% {
          background-position: -1000px 0;
        }
        100% {
          background-position: 1000px 0;
        }
      }

      .skeleton-document-card {
        padding: 24px;
      }

      .skeleton-doc-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .skeleton-doc-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }

      .skeleton-badge {
        width: 80px;
        height: 24px;
        border-radius: 20px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }

      .skeleton-line {
        height: 16px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
        margin-bottom: 12px;
      }

      .skeleton-line.title {
        height: 20px;
        width: 70%;
      }

      .skeleton-line.short {
        width: 40%;
      }

      .skeleton-line.medium {
        width: 80%;
      }

      .skeleton-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .skeleton-actions {
        display: flex;
        gap: 8px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .skeleton-btn {
        flex: 1;
        height: 36px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }

      @media (max-width: 768px) {
        .documents-grid {
          grid-template-columns: 1fr;
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-content h1 {
          font-size: 1.35rem;
        }

        .stats-row {
          overflow-x: auto;
        }
      }

      @media (max-width: 600px) {
        .document-card {
          padding: 20px;
        }

        .document-actions {
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
        }

        .document-meta {
          flex-wrap: wrap;
        }
      }

      @media (max-width: 420px) {
        .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .header-content lucide-icon {
          display: none;
        }

        .document-card {
          padding: 16px;
        }

        .document-icon {
          width: 48px;
          height: 48px;
        }

        .document-title {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class TenantDocumentsComponent implements OnInit {
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Eye = Eye;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;
  readonly FileCheck = FileCheck;
  readonly FileSignature = FileSignature;

  documentService = inject(TenantDocumentService);
  translocoService = inject(TranslocoService);
  private formatService = inject(FormatService);

  documentTypeLabels = DocumentTypeLabels;

  pendingSignatureCount = computed(
    () =>
      this.documentService.documents().filter((d) => d.requires_signature && !d.is_signed).length,
  );

  ngOnInit(): void {
    this.documentService.loadDocuments();
  }

  getCountByType(type: DocumentType): number {
    return this.documentService.documents().filter((d) => d.document_type === type).length;
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
        alert(this.translocoService.translate('tenantDocuments.downloadError'));
      },
    });
  }

  signDocument(doc: TenantDocument): void {
    const confirmMsg = this.translocoService.translate('tenantDocuments.confirmSign', {
      title: doc.title,
    });
    if (confirm(confirmMsg)) {
      this.documentService.signDocument(doc.id).subscribe({
        next: () => {
          alert(this.translocoService.translate('tenantDocuments.signSuccess'));
        },
        error: (error) => {
          console.error('Error signing document:', error);
          alert(this.translocoService.translate('tenantDocuments.signError'));
        },
      });
    }
  }

  formatDate(date: Date): string {
    return this.formatService.formatDate(date);
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
