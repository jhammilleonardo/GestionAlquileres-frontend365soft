import { Routes } from '@angular/router';
import { tenantAuthGuard, tenantLoginGuard, tenantPreContractGuard, tenantWithContractGuard } from '../../core/guards/tenant-auth.guard';

export const TENANT_PORTAL_ROUTES: Routes = [
    {
        path: 'login',
        canActivate: [tenantLoginGuard],
        loadComponent: () => import('./auth/tenant-login.component').then(m => m.TenantLoginComponent)
    },
    {
        path: '',
        canActivate: [tenantAuthGuard],
        loadComponent: () => import('./layout/tenant-layout.component').then(m => m.TenantLayoutComponent),
        children: [
            // ==================== RUTAS PRE-CONTRATO ====================
            {
                path: 'home',
                canActivate: [tenantPreContractGuard],
                loadComponent: () => import('./home-pre-contract/home-pre-contract.component').then(m => m.HomePreContractComponent)
            },
            {
                path: 'new-application',
                canActivate: [tenantPreContractGuard],
                loadComponent: () => import('./new-application/new-application.component').then(m => m.NewApplicationComponent)
            },
            {
                path: 'application-wizard/:propertyId',
                canActivate: [tenantPreContractGuard],
                loadComponent: () => import('./application-wizard/application-wizard.component').then(m => m.ApplicationWizardComponent)
            },
            {
                path: 'my-applications',
                canActivate: [tenantPreContractGuard],
                loadComponent: () => import('./my-applications/my-applications.component').then(m => m.MyApplicationsComponent)
            },

            // ==================== RUTAS CON CONTRATO ====================
            {
                path: 'dashboard',
                canActivate: [tenantWithContractGuard],
                loadComponent: () => import('./dashboard/tenant-dashboard.component').then(m => m.TenantDashboardComponent)
            },
            {
                path: 'mantenimiento',
                canActivate: [tenantWithContractGuard],
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./maintenance/tenant-maintenance-list.component').then(m => m.TenantMaintenanceListComponent)
                    },
                    {
                        path: 'nueva',
                        loadComponent: () => import('./maintenance/tenant-create-request.component').then(m => m.TenantCreateRequestComponent)
                    },
                    {
                        path: ':id',
                        loadComponent: () => import('./maintenance/tenant-request-detail.component').then(m => m.TenantRequestDetailComponent)
                    }
                ]
            },
            {
                path: 'pagos',
                canActivate: [tenantWithContractGuard],
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./payments/tenant-payments-list.component').then(m => m.TenantPaymentsListComponent)
                    },
                    {
                        path: 'nuevo',
                        loadComponent: () => import('./payments/tenant-create-payment.component').then(m => m.TenantCreatePaymentComponent)
                    },
                    {
                        path: 'qr',
                        loadComponent: () => import('./payments/tenant-qr-payments-list.component').then(m => m.TenantQrPaymentsListComponent)
                    },
                    {
                        path: 'qr/nuevo',
                        loadComponent: () => import('./payments/tenant-qr-generate.component').then(m => m.TenantQrGenerateComponent)
                    }
                ]
            },
            {
                path: 'documentos',
                children: [
                    {
                        path: '',
                        canActivate: [tenantWithContractGuard],
                        loadComponent: () => import('./documents/tenant-documents.component').then(m => m.TenantDocumentsComponent)
                    },
                    // Contratos accesibles con BORRADOR o ACTIVO (para firma y visualización)
                    {
                        path: 'contratos',
                        loadComponent: () => import('./documents/tenant-contract-list.component').then(m => m.TenantContractListComponent)
                    },
                    {
                        path: 'contratos/:id',
                        loadComponent: () => import('./documents/tenant-contract-detail.component').then(m => m.TenantContractDetailComponent)
                    }
                ]
            },
            {
                path: 'mensajes',
                canActivate: [tenantWithContractGuard],
                loadComponent: () => import('./messages/tenant-messages.component').then(m => m.TenantMessagesComponent)
            },
            {
                path: 'notificaciones',
                canActivate: [tenantWithContractGuard],
                loadComponent: () => import('./notifications/tenant-notifications.component').then(m => m.TenantNotificationsComponent)
            },
            {
                path: 'perfil',
                canActivate: [tenantWithContractGuard],
                loadComponent: () => import('./profile/tenant-profile.component').then(m => m.TenantProfileComponent)
            },

            // ==================== REDIRECCIÓN POR DEFECTO ====================
            // NOTA: Esta redirección se maneja en tenant-layout.component mediante ContractService
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    }
];
