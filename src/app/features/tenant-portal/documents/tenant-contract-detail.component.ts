import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileCheck,
  FileText,
  Home,
  Info,
  X,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import {
  Contract,
  ContractStatus,
  TenantContractService,
} from '../../../core/services/tenant/tenant-contract.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { FileDownloadService } from '../../../core/services/file-download.service';
import { FormatService } from '../../../core/services/format.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppStatusBadgeComponent,
  AppStatusTone,
  ToastService,
} from '../../../shared/ui';
import { ContractSigningDialogComponent } from '../dialogs/contract-signing-dialog.component';
import { SigningSuccessDialogComponent } from '../dialogs/signing-success-dialog.component';
import type { SignatureResult } from '../dialogs/signature-pad.component';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-contract-detail',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
    ContractSigningDialogComponent,
    SigningSuccessDialogComponent,
  ],
  templateUrl: './tenant-contract-detail.component.html',
  styleUrls: ['./tenant-contract-detail.component.scss'],
})
export class TenantContractDetailComponent {
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly Download = Download;
  protected readonly Edit = FileCheck;
  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Home = Home;
  protected readonly Calendar = Calendar;
  protected readonly DollarSign = DollarSign;
  protected readonly FileCheck = FileCheck;
  protected readonly Info = Info;
  protected readonly FileText = FileText;
  protected readonly X = X;
  protected readonly ContractStatus = ContractStatus;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(TenantContractService);
  private readonly authService = inject(TenantAuthService);
  private readonly slugService = inject(SlugService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly translocoService = inject(TranslocoService);
  private readonly formatService = inject(FormatService);
  private readonly toast = inject(ToastService);

  protected readonly contract = signal<Contract | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly isSigning = signal(false);
  protected readonly isSigningDialogOpen = signal(false);
  protected readonly isSuccessDialogOpen = signal(false);
  protected readonly signedContract = signal<Contract | null>(null);

  constructor() {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (!contractId) {
      this.error.set(this.translocoService.translate('tenantContracts.details.missingId'));
      this.isLoading.set(false);
      return;
    }

    this.loadContract(Number(contractId));
  }

  protected loadContract(id: number): void {
    this.contractService
      .getContract(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contract) => {
          this.contract.set(contract);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set(this.translocoService.translate('tenantContracts.details.loadError'));
          this.isLoading.set(false);
        },
      });
  }

  protected goBack(): void {
    const url = this.slugService.buildUrl('/portal/documentos');
    void this.router.navigateByUrl(url);
  }

  protected signContract(): void {
    if (!this.contract() || this.isSigning()) return;
    this.isSigningDialogOpen.set(true);
  }

  protected closeSigningDialog(): void {
    if (this.isSigning()) return;
    this.isSigningDialogOpen.set(false);
  }

  protected confirmSigning(signature: SignatureResult): void {
    const contract = this.contract();
    if (!contract || this.isSigning()) return;

    this.isSigningDialogOpen.set(false);
    this.performSigning(contract.id, signature);
  }

  private performSigning(contractId: Contract['id'], signature: SignatureResult): void {
    this.isSigning.set(true);

    this.contractService
      .signContract(contractId, {
        signatureImage: signature.image,
        signatureMethod: signature.method,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSigning.set(false);
          this.contract.set(response);
          this.signedContract.set(response);
          this.isSuccessDialogOpen.set(true);
        },
        error: (err: { error?: { message?: string } }) => {
          this.isSigning.set(false);
          this.toast.error(
            getApiErrorMessage(
              err,
              this.translocoService.translate('tenantContracts.details.signError'),
            ),
          );
        },
      });
  }

  protected closeSuccessDialog(): void {
    this.isSuccessDialogOpen.set(false);
    this.authService
      .refreshUserData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.slugService.navigateTo(['portal', 'dashboard']);
      });
  }

  protected downloadPDF(): void {
    const contract = this.contract();
    if (!contract) return;

    this.contractService
      .downloadContractPDF(contract.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.fileDownload.downloadBlob(blob, this.getContractPdfFileName(contract));
        },
        error: () => {
          this.toast.error(
            this.translocoService.translate('tenantContracts.details.downloadPdfError'),
          );
        },
      });
  }

  protected viewPDF(): void {
    const contract = this.contract();
    if (!contract) return;

    this.contractService
      .downloadContractPDF(contract.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const opened = this.fileDownload.openBlob(blob);

          if (!opened) {
            this.fileDownload.downloadBlob(blob, this.getContractPdfFileName(contract));
            this.toast.info(
              this.translocoService.translate('tenantContracts.details.pdfPopupBlocked'),
            );
          }
        },
        error: () => {
          this.toast.error(this.translocoService.translate('tenantContracts.details.pdfError'));
        },
      });
  }

  private getContractPdfFileName(contract: Contract): string {
    const number = contract.contract_number.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${this.translocoService.translate('tenantContracts.details.pdfFilePrefix')}_${number}.pdf`;
  }

  protected statusTone(status: ContractStatus): AppStatusTone {
    if (status === ContractStatus.ACTIVO || status === ContractStatus.FIRMADO) return 'success';
    if (status === ContractStatus.BORRADOR || status === ContractStatus.PENDIENTE) return 'warning';
    if (status === ContractStatus.VENCIDO || status === ContractStatus.CANCELADO) return 'danger';
    if (status === ContractStatus.POR_VENCER) return 'info';
    return 'neutral';
  }

  protected formatDate(date: Date | string): string {
    return this.formatService.formatDate(date);
  }
}
