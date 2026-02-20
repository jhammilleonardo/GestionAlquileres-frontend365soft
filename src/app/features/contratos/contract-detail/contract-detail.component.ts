import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { LucideAngularModule, ArrowLeft, FileText, Download, Edit, RefreshCw, XCircle, Check, CheckCircle2 } from 'lucide-angular';
import { AdminContractService } from '../../../core/services/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { Contract, ContractStatus, ContractStatusLabels } from '../../../core/models/contract.model';

@Component({
    selector: 'app-contract-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatMenuModule,
        LucideAngularModule
    ],
    template: `
        <div class="contract-detail-container">
            <!-- Header -->
            <div class="page-header">
                <button mat-button class="back-button" (click)="goBack()">
                    <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
                    Volver a Contratos
                </button>
                <div class="header-title">
                    <h1>Contrato {{ contractNumber() }}</h1>
                    @if (currentContract()) {
                        <span class="status-badge" [class]="getStatusClass(currentContract()!.status)">
                            {{ ContractStatusLabels[currentContract()!.status] }}
                        </span>
                    }
                </div>
            </div>

            @if (isLoading()) {
                <div class="loading-container">
                    <mat-spinner diameter="50"></mat-spinner>
                    <p>Cargando contrato...</p>
                </div>
            } @else if (currentContract()) {
                <div class="content-grid">
                    <!-- Columna Principal -->
                    <div class="main-column">
                        <!-- Información de Propiedad e Inquilino -->
                        <mat-card class="info-card">
                            <div class="card-header">
                                <h3>Información del Contrato</h3>
                            </div>

                            <!-- Propiedad -->
                            <div class="info-section">
                                <div class="section-label">Propiedad</div>
                                <div class="section-content">
                                    <h4>{{ currentContract()!.property?.title }}</h4>
                                    @if (currentContract()!.property?.addresses && (currentContract()!.property?.addresses?.length ?? 0) > 0) {
                                        <p class="address">
                                            {{ currentContract()!.property?.addresses?.[0]?.street_address }},
                                            {{ currentContract()!.property?.addresses?.[0]?.city }}
                                            @if (currentContract()!.property?.addresses?.[0]?.state) {
                                                , {{ currentContract()!.property?.addresses?.[0]?.state }}
                                            }
                                        </p>
                                    }
                                </div>
                            </div>

                            <hr>

                            <!-- Inquilino -->
                            <div class="info-section">
                                <div class="section-label">Inquilino</div>
                                <div class="section-content">
                                    <h4>{{ currentContract()!.tenant?.name }}</h4>
                                    <p class="contact">
                                        <mat-icon>email</mat-icon>
                                        {{ currentContract()!.tenant?.email }}
                                    </p>
                                    @if (currentContract()!.tenant?.phone) {
                                        <p class="contact">
                                            <mat-icon>phone</mat-icon>
                                            {{ currentContract()!.tenant?.phone }}
                                        </p>
                                    }
                                </div>
                            </div>

                            <hr>

                            <!-- Fechas -->
                            <div class="info-section">
                                <div class="section-label">Fechas</div>
                                <div class="dates-grid">
                                    <div class="date-item">
                                        <span class="label">Inicio:</span>
                                        <span class="value">{{ formatDate(currentContract()!.start_date) }}</span>
                                    </div>
                                    <div class="date-item">
                                        <span class="label">Fin:</span>
                                        <span class="value">{{ formatDate(currentContract()!.end_date) }}</span>
                                    </div>
                                    @if (currentContract()!.key_delivery_date) {
                                        <div class="date-item">
                                            <span class="label">Entrega llaves:</span>
                                            <span class="value">{{ formatDate(currentContract()!.key_delivery_date) }}</span>
                                        </div>
                                    }
                                </div>
                            </div>

                            <hr>

                            <!-- Alquiler -->
                            <div class="info-section">
                                <div class="section-label">Alquiler</div>
                                <div class="rent-info">
                                    <div class="rent-amount">
                                        \${{ currentContract()!.monthly_rent.toLocaleString() }}
                                        <span class="currency">{{ currentContract()!.currency || 'USD' }}</span>
                                    </div>
                                    <div class="rent-details">
                                        @if (currentContract()!.payment_day) {
                                            <span>Día de pago: {{ currentContract()!.payment_day }}</span>
                                        }
                                        @if (currentContract()!.deposit_amount) {
                                            <span>Depósito: \${{ currentContract()!.deposit_amount?.toLocaleString() }}</span>
                                        }
                                        @if (currentContract()!.payment_method) {
                                            <span>Método: {{ currentContract()!.payment_method }}</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </mat-card>

                        <!-- Condiciones -->
                        @if (hasConditions()) {
                            <mat-card class="info-card">
                                <div class="card-header">
                                    <h3>Condiciones de Pago</h3>
                                </div>

                                <div class="conditions-list">
                                    @if (currentContract()!.late_fee_percentage) {
                                        <div class="condition-item">
                                            <mat-icon>trending_up</mat-icon>
                                            <span>Recargo por mora: {{ currentContract()!.late_fee_percentage }}%</span>
                                        </div>
                                    }
                                    @if (currentContract()!.grace_days) {
                                        <div class="condition-item">
                                            <mat-icon>schedule</mat-icon>
                                            <span>Días de gracia: {{ currentContract()!.grace_days }}</span>
                                        </div>
                                    }
                                    @if (currentContract()!.auto_renew !== undefined) {
                                        <div class="condition-item">
                                            <mat-icon>autorenew</mat-icon>
                                            <span>Renovación automática: {{ currentContract()!.auto_renew ? 'Sí' : 'No' }}</span>
                                        </div>
                                    }
                                    @if (currentContract()!.renewal_notice_days) {
                                        <div class="condition-item">
                                            <mat-icon>notifications</mat-icon>
                                            <span>Aviso de renovación: {{ currentContract()!.renewal_notice_days }} días</span>
                                        </div>
                                    }
                                    @if (currentContract()!.auto_increase_percentage) {
                                        <div class="condition-item">
                                            <mat-icon>show_chart</mat-icon>
                                            <span>Aumento anual: {{ currentContract()!.auto_increase_percentage }}%</span>
                                        </div>
                                    }
                                </div>

                                @if (currentContract()!.included_services && (currentContract()!.included_services?.length ?? 0) > 0) {
                                    <hr>
                                    <div class="services-section">
                                        <div class="section-label">Servicios Incluidos</div>
                                        <div class="services-list">
                                            @for (service of currentContract()!.included_services; track service) {
                                                <span class="service-tag">{{ service }}</span>
                                            }
                                        </div>
                                    </div>
                                }
                            </mat-card>
                        }
                    </div>

                    <!-- Columna Secundaria -->
                    <div class="side-column">
                        <!-- Acciones -->
                        <mat-card class="actions-card">
                            <div class="card-header">
                                <h3>Acciones</h3>
                            </div>

                            <!-- Banner: pendiente de firma del inquilino -->
                            @if (canActivate()) {
                                <div class="pending-sign-banner">
                                    <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                                    <div>
                                        <strong>Pendiente de firma</strong>
                                        <p>El inquilino debe iniciar sesión en su portal para revisar y firmar este contrato.</p>
                                    </div>
                                </div>
                            }

                            <div class="actions-list">
                                <button mat-raised-button color="primary" class="action-button" (click)="downloadPDF()">
                                    <lucide-icon [img]="Download" [size]="18"></lucide-icon>
                                    Ver PDF
                                    <span class="button-hint">(abre en nueva pestaña)</span>
                                </button>

                                @if (canEdit()) {
                                    <button mat-stroked-button class="action-button" (click)="editContract()">
                                        <lucide-icon [img]="Edit" [size]="18"></lucide-icon>
                                        Editar Contrato
                                    </button>
                                }

                                @if (canRenew()) {
                                    <button mat-stroked-button class="action-button" (click)="renewContract()">
                                        <lucide-icon [img]="RefreshCw" [size]="18"></lucide-icon>
                                        Renovar Contrato
                                    </button>
                                }

                                @if (canFinalize()) {
                                    <button mat-stroked-button class="action-button warn" (click)="finalizeContract()">
                                        <lucide-icon [img]="XCircle" [size]="18"></lucide-icon>
                                        Finalizar Contrato
                                    </button>
                                }
                            </div>
                        </mat-card>

                        <!-- Términos -->
                        @if (hasTerms()) {
                            <mat-card class="info-card">
                                <div class="card-header">
                                    <h3>Términos y Condiciones</h3>
                                </div>

                                @if (currentContract()!.tenant_responsibilities) {
                                    <div class="term-section">
                                        <div class="term-label">Responsabilidades del Inquilino</div>
                                        <p class="term-text">{{ currentContract()!.tenant_responsibilities }}</p>
                                    </div>
                                }

                                @if (currentContract()!.owner_responsibilities) {
                                    <div class="term-section">
                                        <div class="term-label">Responsabilidades del Propietario</div>
                                        <p class="term-text">{{ currentContract()!.owner_responsibilities }}</p>
                                    </div>
                                }

                                @if (currentContract()!.prohibitions) {
                                    <div class="term-section">
                                        <div class="term-label">Prohibiciones</div>
                                        <p class="term-text">{{ currentContract()!.prohibitions }}</p>
                                    </div>
                                }

                                @if (currentContract()!.coexistence_rules) {
                                    <div class="term-section">
                                        <div class="term-label">Reglas de Convivencia</div>
                                        <p class="term-text">{{ currentContract()!.coexistence_rules }}</p>
                                    </div>
                                }

                                @if (currentContract()!.renewal_terms) {
                                    <div class="term-section">
                                        <div class="term-label">Renovación</div>
                                        <p class="term-text">{{ currentContract()!.renewal_terms }}</p>
                                    </div>
                                }

                                @if (currentContract()!.termination_terms) {
                                    <div class="term-section">
                                        <div class="term-label">Rescisión</div>
                                        <p class="term-text">{{ currentContract()!.termination_terms }}</p>
                                    </div>
                                }

                                @if (currentContract()!.jurisdiction) {
                                    <hr>
                                    <div class="term-section">
                                        <div class="term-label">Jurisdicción</div>
                                        <p class="term-text">{{ currentContract()!.jurisdiction }}</p>
                                    </div>
                                }
                            </mat-card>
                        }

                        <!-- Datos Bancarios -->
                        @if (hasBankInfo()) {
                            <mat-card class="info-card">
                                <div class="card-header">
                                    <h3>Datos Bancarios</h3>
                                </div>

                                <div class="bank-info">
                                    @if (currentContract()!.bank_name) {
                                        <div class="bank-item">
                                            <span class="bank-label">Banco:</span>
                                            <span class="bank-value">{{ currentContract()!.bank_name }}</span>
                                        </div>
                                    }
                                    @if (currentContract()!.bank_account_type) {
                                        <div class="bank-item">
                                            <span class="bank-label">Tipo:</span>
                                            <span class="bank-value">{{ currentContract()!.bank_account_type }}</span>
                                        </div>
                                    }
                                    @if (currentContract()!.bank_account_number) {
                                        <div class="bank-item">
                                            <span class="bank-label">Cuenta:</span>
                                            <span class="bank-value">{{ currentContract()!.bank_account_number }}</span>
                                        </div>
                                    }
                                    @if (currentContract()!.bank_account_holder) {
                                        <div class="bank-item">
                                            <span class="bank-label">Titular:</span>
                                            <span class="bank-value">{{ currentContract()!.bank_account_holder }}</span>
                                        </div>
                                    }
                                </div>
                            </mat-card>
                        }

                        <!-- Firmas -->
                        @if (hasSignatures()) {
                            <mat-card class="info-card">
                                <div class="card-header">
                                    <h3>Firmas</h3>
                                </div>

                                <div class="signatures-list">
                                    @if (currentContract()!.owner_signature_date) {
                                        <div class="signature-item">
                                            <lucide-icon [img]="Check" [size]="16"></lucide-icon>
                                            <div>
                                                <div class="sig-label">Admin</div>
                                                <div class="sig-date">{{ formatDateTime(currentContract()!.owner_signature_date) }}</div>
                                            </div>
                                        </div>
                                    }
                                    @if (currentContract()!.tenant_signature_date) {
                                        <div class="signature-item">
                                            <lucide-icon [img]="Check" [size]="16"></lucide-icon>
                                            <div>
                                                <div class="sig-label">Inquilino</div>
                                                <div class="sig-date">{{ formatDateTime(currentContract()!.tenant_signature_date) }}</div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </mat-card>
                        }
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .contract-detail-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
        }

        .page-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .back-button {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .header-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-title h1 {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 600;
        }

        .status-badge {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .status-badge.status-borrador {
            background: #fff3cd;
            color: #856404;
        }

        .status-badge.status-activo {
            background: #d1fae5;
            color: #065f46;
        }

        .status-badge.status-finalizado {
            background: #e5e7eb;
            color: #374151;
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px;
            gap: 16px;
        }

        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
        }

        .info-card {
            padding: 24px;
            margin-bottom: 24px;
        }

        .card-header h3 {
            margin: 0 0 20px;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--mat-sys-primary);
        }

        .info-section {
            margin-bottom: 20px;
        }

        .info-section:last-child {
            margin-bottom: 0;
        }

        .section-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--mat-sys-on-surface-variant);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .section-content h4 {
            margin: 0 0 8px;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .address, .contact {
            margin: 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--mat-sys-on-surface-variant);
        }

        .dates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
        }

        .date-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .date-item .label {
            font-size: 12px;
            color: var(--mat-sys-on-surface-variant);
        }

        .date-item .value {
            font-weight: 500;
        }

        .rent-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .rent-amount {
            font-size: 2rem;
            font-weight: 700;
            color: var(--mat-sys-primary);
        }

        .currency {
            font-size: 1rem;
            font-weight: 500;
        }

        .rent-details {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
        }

        .rent-details span {
            font-size: 14px;
            color: var(--mat-sys-on-surface-variant);
        }

        .conditions-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .condition-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
        }

        .services-section {
            margin-top: 16px;
        }

        .services-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }

        .service-tag {
            padding: 4px 12px;
            background: var(--mat-sys-primary-container);
            color: var(--mat-sys-on-primary-container);
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
        }

        .actions-card {
            position: sticky;
            top: 24px;
        }

        .actions-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .action-button {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .action-button .button-hint {
            font-size: 11px;
            opacity: 0.7;
            font-weight: normal;
        }

        .action-button.warn {
            border-color: #f44;
            color: #f44;
        }

        .pending-sign-banner {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 10px;
            margin-bottom: 16px;
        }

        .pending-sign-banner lucide-icon {
            color: #d97706;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .pending-sign-banner strong {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 4px;
        }

        .pending-sign-banner p {
            margin: 0;
            font-size: 12px;
            color: #b45309;
            line-height: 1.4;
        }

        .term-section {
            margin-bottom: 16px;
        }

        .term-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--mat-sys-primary);
            margin-bottom: 6px;
        }

        .term-text {
            margin: 0;
            font-size: 14px;
            color: var(--mat-sys-on-surface-variant);
            line-height: 1.5;
        }

        .bank-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .bank-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
        }

        .bank-label {
            font-weight: 500;
            color: var(--mat-sys-on-surface-variant);
        }

        .bank-value {
            font-weight: 600;
        }

        .signatures-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .signature-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .sig-label {
            font-weight: 500;
        }

        .sig-date {
            font-size: 13px;
            color: var(--mat-sys-on-surface-variant);
        }

        @media (max-width: 1024px) {
            .content-grid {
                grid-template-columns: 1fr;
            }

            .actions-card {
                position: static;
            }
        }

        @media (max-width: 768px) {
            .contract-detail-container {
                padding: 16px;
            }

            .page-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .header-title {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .dates-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class ContractDetailComponent implements OnInit {
    readonly ArrowLeft = ArrowLeft;
    readonly Download = Download;
    readonly Edit = Edit;
    readonly RefreshCw = RefreshCw;
    readonly XCircle = XCircle;
    readonly Check = Check;
    readonly CheckCircle2 = CheckCircle2;
    readonly ContractStatus = ContractStatus;
    readonly ContractStatusLabels = ContractStatusLabels;

    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private contractService = inject(AdminContractService);
    private slugService = inject(SlugService);

    isLoading = signal(true);
    currentContract = signal<Contract | null>(null);
    contractNumber = signal<string>('');

    ngOnInit(): void {
        const contractId = this.route.snapshot.paramMap.get('id');
        if (contractId) {
            this.loadContract(parseInt(contractId));
        } else {
            this.isLoading.set(false);
            this.goBack();
        }
    }

    loadContract(id: number): void {
        this.contractService.getContract(id).subscribe({
            next: (contract) => {
                this.currentContract.set(contract);
                this.contractNumber.set(contract.contract_number);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.goBack();
            }
        });
    }

    canActivate(): boolean {
        const contract = this.currentContract();
        return contract?.status === ContractStatus.BORRADOR || false;
    }

    canEdit(): boolean {
        const contract = this.currentContract();
        return contract?.status === ContractStatus.BORRADOR || false;
    }

    canRenew(): boolean {
        const contract = this.currentContract();
        return contract?.status === ContractStatus.ACTIVO || contract?.status === ContractStatus.FINALIZADO || false;
    }

    canFinalize(): boolean {
        const contract = this.currentContract();
        return contract?.status === ContractStatus.ACTIVO || false;
    }

    hasConditions(): boolean {
        const contract = this.currentContract();
        return Boolean(
            contract?.late_fee_percentage ||
            contract?.grace_days ||
            contract?.auto_renew !== undefined ||
            contract?.renewal_notice_days ||
            contract?.auto_increase_percentage ||
            (contract?.included_services && contract.included_services.length > 0)
        );
    }

    hasTerms(): boolean {
        const contract = this.currentContract();
        return Boolean(
            contract?.tenant_responsibilities ||
            contract?.owner_responsibilities ||
            contract?.prohibitions ||
            contract?.coexistence_rules ||
            contract?.renewal_terms ||
            contract?.termination_terms ||
            contract?.jurisdiction
        );
    }

    hasBankInfo(): boolean {
        const contract = this.currentContract();
        return Boolean(
            contract?.bank_name ||
            contract?.bank_account_type ||
            contract?.bank_account_number ||
            contract?.bank_account_holder
        );
    }

    hasSignatures(): boolean {
        const contract = this.currentContract();
        return Boolean(
            contract?.owner_signature_date ||
            contract?.tenant_signature_date
        );
    }

    downloadPDF(): void {
        const contract = this.currentContract();
        if (!contract) return;

        this.contractService.downloadPDF(contract.id);
    }

    editContract(): void {
        const contract = this.currentContract();
        if (!contract) return;

        const editUrl = this.slugService.buildUrl(`/contratos/${contract.id}/editar`);
        this.router.navigateByUrl(editUrl);
    }

    renewContract(): void {
        const contract = this.currentContract();
        if (!contract) return;

        if (!confirm(`¿Deseas renovar el contrato ${contract.contract_number}? Se creará un nuevo contrato basado en el actual.`)) {
            return;
        }

        this.contractService.renewContract(contract.id).subscribe({
            next: (response) => {
                alert('Contrato renovado exitosamente. Redirigiendo al nuevo contrato...');
                const newContractUrl = this.slugService.buildUrl(`/contratos/${response.id}`);
                this.router.navigateByUrl(newContractUrl);
            },
            error: () => {
                alert('Error al renovar el contrato');
            }
        });
    }

    finalizeContract(): void {
        const contract = this.currentContract();
        if (!contract) return;

        if (!confirm(`¿Deseas finalizar el contrato ${contract.contract_number}? Esta acción pasará el contrato a estado Finalizado.`)) {
            return;
        }

        this.contractService.updateStatus(contract.id, {
            status: ContractStatus.FINALIZADO,
            reason: 'Finalizado por el administrador'
        }).subscribe({
            next: () => {
                alert('Contrato finalizado exitosamente');
                this.loadContract(contract.id);
            },
            error: () => {
                alert('Error al finalizar el contrato');
            }
        });
    }

    goBack(): void {
        const contractsUrl = this.slugService.buildUrl('/contratos');
        this.router.navigateByUrl(contractsUrl);
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatDateTime(dateString: string | undefined): string {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusClass(status: ContractStatus): string {
        return `status-${status.toLowerCase()}`;
    }
}
