import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { FileDownloadService } from '../../../core/services/file-download.service';
import { TenantDocumentService } from '../../../core/services/tenant/tenant-document.service';
import { FormatService } from '../../../core/services/format.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppStatusBadgeComponent,
  AppTabsComponent,
  AppTabOption,
  ConfirmDialogService,
  ToastService,
} from '../../../shared/ui';
import {
  DocumentStatus,
  DocumentType,
  DocumentTypeLabels,
  TenantDocument,
} from '../../../core/models/document.model';
import { TenantContractListComponent } from './tenant-contract-list.component';

type TenantDocumentsTab = 'documents' | 'contracts';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-documents',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantContractListComponent,
    TenantDatePipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
    AppTabsComponent,
  ],
  template: `
    <section class="documents-page">
      <app-page-header
        [eyebrow]="'tenantDocuments.headerEyebrow' | transloco"
        [title]="'tenantDocuments.title' | transloco"
        [description]="'tenantDocuments.subtitle' | transloco"
      />

      <app-tabs
        class="documents-page__tabs"
        [(ngModel)]="activeTab"
        [tabs]="tabs()"
        [ariaLabel]="'tenantDocuments.title' | transloco"
      />

      @if (activeTab === 'documents') {
        <section class="documents-section">
          <div class="documents-toolbar">
            <div class="summary-chip">
              <span>{{ 'tenantDocuments.all' | transloco }}</span>
              <strong>{{ documentService.documents().length }}</strong>
            </div>
            <div class="summary-chip summary-chip--warning">
              <span>{{ 'tenantDocuments.pendingSignature' | transloco }}</span>
              <strong>{{ pendingSignatureCount() }}</strong>
            </div>
          </div>

          @if (documentService.isLoading()) {
            <div class="state-box">
              <app-loading-state [label]="'tenantDocuments.loading' | transloco" />
            </div>
          } @else if (documentService.documents().length === 0) {
            <app-empty-state
              [title]="'tenantDocuments.noDocsTitle' | transloco"
              [description]="'tenantDocuments.noDocsDesc' | transloco"
            >
              <lucide-icon icon [img]="FileText" [size]="28"></lucide-icon>
            </app-empty-state>
          } @else {
            <div class="documents-grid">
              @for (doc of documentService.documents(); track doc.id) {
                <article class="document-card">
                  <header class="document-card__header">
                    <div class="document-icon">
                      <lucide-icon [img]="FileText" [size]="26"></lucide-icon>
                    </div>
                    <app-status-badge
                      [label]="documentTypeLabel(doc.document_type)"
                      [tone]="documentStatusTone(doc)"
                    />
                  </header>

                  <div class="document-card__body">
                    <h2>{{ doc.title }}</h2>

                    @if (doc.description) {
                      <p>{{ doc.description }}</p>
                    }

                    <dl class="document-meta">
                      <div>
                        <dt>
                          <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                          {{ 'tenantDocuments.uploadedAt' | transloco }}
                        </dt>
                        <dd>{{ doc.uploaded_at | tenantDate }}</dd>
                      </div>
                      <div>
                        <dt>{{ 'tenantDocuments.fileSize' | transloco }}</dt>
                        <dd>{{ formatFileSize(doc.file_size) }}</dd>
                      </div>
                    </dl>

                    @if (doc.requires_signature) {
                      <div class="signature-state" [class.signature-state--signed]="doc.is_signed">
                        @if (doc.is_signed) {
                          <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                          <span>
                            {{
                              'tenantDocuments.signedOn'
                                | transloco: { date: formatDate(doc.signed_at!) }
                            }}
                          </span>
                        } @else {
                          <lucide-icon [img]="AlertTriangle" [size]="16"></lucide-icon>
                          <span>{{ 'tenantDocuments.requiresSignature' | transloco }}</span>
                        }
                      </div>
                    }

                    @if (doc.expires_at && isExpiringSoon(doc.expires_at)) {
                      <div class="expiration-warning">
                        <lucide-icon [img]="AlertTriangle" [size]="14"></lucide-icon>
                        <span>
                          {{
                            'tenantDocuments.expiresOn'
                              | transloco: { date: formatDate(doc.expires_at) }
                          }}
                        </span>
                      </div>
                    }
                  </div>

                  <footer class="document-actions">
                    <app-button appearance="outline" size="s" (clicked)="viewDocument(doc)">
                      <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                      {{ 'tenantDocuments.view' | transloco }}
                    </app-button>

                    <app-button appearance="outline" size="s" (clicked)="downloadDocument(doc)">
                      <lucide-icon [img]="Download" [size]="16"></lucide-icon>
                      {{ 'tenantDocuments.download' | transloco }}
                    </app-button>

                    @if (doc.requires_signature && !doc.is_signed) {
                      <app-button appearance="primary" size="s" (clicked)="signDocument(doc)">
                        <lucide-icon [img]="FileCheck" [size]="16"></lucide-icon>
                        {{ 'tenantDocuments.sign' | transloco }}
                      </app-button>
                    }
                  </footer>
                </article>
              }
            </div>
          }
        </section>
      } @else {
        <app-tenant-contract-list />
      }
    </section>
  `,
  styles: `
    .documents-page {
      max-inline-size: 1180px;
      margin-inline: auto;
    }

    .documents-page__tabs {
      margin-block-end: var(--app-space-5);
    }

    .documents-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
      margin-block-end: var(--app-space-5);
    }

    .summary-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-2);
      min-block-size: 2.25rem;
      padding: 0 var(--app-space-3);
      border: 1px solid var(--app-color-border);
      border-radius: 999px;
      background: var(--app-color-surface);
      color: var(--app-color-text-muted);
      font-size: 0.875rem;
      font-weight: 650;
    }

    .summary-chip strong {
      color: var(--app-color-text);
      font-weight: 800;
    }

    .summary-chip--warning {
      background: var(--tui-status-warning-pale);
      color: var(--tui-status-warning);
      border-color: transparent;
    }

    .state-box {
      display: grid;
      min-block-size: 18rem;
      place-items: center;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: var(--app-space-4);
    }

    .document-card {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: var(--app-space-4);
      min-block-size: 100%;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
      padding: var(--app-space-4);
    }

    .document-card__header,
    .document-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
    }

    .document-icon {
      display: inline-grid;
      place-items: center;
      inline-size: 2.75rem;
      block-size: 2.75rem;
      border-radius: var(--app-radius-md);
      background: var(--tui-status-info-pale);
      color: var(--tui-status-info);
    }

    .document-card__body h2 {
      margin: 0;
      color: var(--app-color-text);
      font-size: 1.05rem;
      font-weight: 780;
      line-height: 1.25;
    }

    .document-card__body p {
      margin: var(--app-space-2) 0 0;
      color: var(--app-color-text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .document-meta {
      display: grid;
      gap: var(--app-space-2);
      margin: var(--app-space-4) 0 0;
    }

    .document-meta div {
      display: flex;
      justify-content: space-between;
      gap: var(--app-space-3);
      border-bottom: 1px solid var(--app-color-border);
      padding-block-end: var(--app-space-2);
    }

    .document-meta dt,
    .document-meta dd {
      margin: 0;
      font-size: 0.82rem;
    }

    .document-meta dt {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-1);
      color: var(--app-color-text-muted);
      font-weight: 650;
    }

    .document-meta dd {
      color: var(--app-color-text);
      font-weight: 700;
      text-align: end;
    }

    .signature-state,
    .expiration-warning {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      margin-block-start: var(--app-space-3);
      border-radius: var(--app-radius-md);
      padding: var(--app-space-2) var(--app-space-3);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .signature-state {
      background: var(--tui-status-warning-pale);
      color: var(--tui-status-warning);
    }

    .signature-state--signed {
      background: var(--tui-status-positive-pale);
      color: var(--tui-status-positive);
    }

    .expiration-warning {
      background: var(--tui-status-negative-pale);
      color: var(--tui-status-negative);
    }

    .document-actions {
      flex-wrap: wrap;
      justify-content: flex-start;
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-3);
    }
  `,
})
export class TenantDocumentsComponent {
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Eye = Eye;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;
  readonly FileCheck = FileCheck;

  protected readonly documentService = inject(TenantDocumentService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly translocoService = inject(TranslocoService);
  private readonly formatService = inject(FormatService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  protected activeTab: TenantDocumentsTab = 'documents';

  protected readonly pendingSignatureCount = computed(
    () =>
      this.documentService.documents().filter((document) => {
        return document.requires_signature && !document.is_signed;
      }).length,
  );

  protected readonly tabs = computed<readonly AppTabOption<TenantDocumentsTab>[]>(() => [
    {
      label: this.translocoService.translate('tenantDocuments.tabDocs'),
      value: 'documents',
      badge: this.documentService.documents().length,
    },
    {
      label: this.translocoService.translate('tenantDocuments.tabContracts'),
      value: 'contracts',
    },
  ]);

  constructor() {
    this.documentService.loadDocuments();
  }

  protected viewDocument(document: TenantDocument): void {
    window.open(document.file_url, '_blank', 'noopener,noreferrer');
  }

  protected downloadDocument(document: TenantDocument): void {
    this.documentService.downloadDocument(document.id).subscribe({
      next: (blob) => {
        this.fileDownload.downloadBlob(blob, document.file_name);
      },
      error: () => {
        this.toast.error(this.translocoService.translate('tenantDocuments.downloadError'));
      },
    });
  }

  protected async signDocument(document: TenantDocument): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translocoService.translate('tenantDocuments.sign'),
      message: this.translocoService.translate('tenantDocuments.confirmSign', {
        title: document.title,
      }),
      confirmLabel: this.translocoService.translate('tenantDocuments.sign'),
      cancelLabel: this.translocoService.translate('common.cancel'),
    });

    if (!confirmed) return;

    this.documentService.signDocument(document.id).subscribe({
      next: () => {
        this.toast.success(this.translocoService.translate('tenantDocuments.signSuccess'));
      },
      error: () => {
        this.toast.error(this.translocoService.translate('tenantDocuments.signError'));
      },
    });
  }

  protected documentTypeLabel(type: DocumentType): string {
    const translated = this.translocoService.translate(`tenantDocuments.type.${type}`);
    return translated === `tenantDocuments.type.${type}` ? DocumentTypeLabels[type] : translated;
  }

  protected documentStatusTone(
    document: TenantDocument,
  ): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
    if (document.status === DocumentStatus.EXPIRED) return 'danger';
    if (document.requires_signature && !document.is_signed) return 'warning';
    if (document.is_signed) return 'success';
    return 'info';
  }

  protected formatDate(date: Date): string {
    return this.formatService.formatDate(date);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected isExpiringSoon(date: Date): boolean {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return date <= thirtyDaysFromNow && date >= now;
  }
}
