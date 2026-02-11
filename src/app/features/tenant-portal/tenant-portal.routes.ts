import { Routes } from '@angular/router';
import { tenantAuthGuard, tenantLoginGuard } from '../../core/guards/tenant-auth.guard';

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
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/tenant-dashboard.component').then(m => m.TenantDashboardComponent)
            },
            {
                path: 'mantenimiento',
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
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./payments/tenant-payments-list.component').then(m => m.TenantPaymentsListComponent)
                    },
                    {
                        path: 'nuevo',
                        loadComponent: () => import('./payments/tenant-create-payment.component').then(m => m.TenantCreatePaymentComponent)
                    }
                ]
            },
            {
                path: 'documentos',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./documents/tenant-documents.component').then(m => m.TenantDocumentsComponent)
                    },
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
                loadComponent: () => import('./messages/tenant-messages.component').then(m => m.TenantMessagesComponent)
            },
            {
                path: 'notificaciones',
                loadComponent: () => import('./notifications/tenant-notifications.component').then(m => m.TenantNotificationsComponent)
            },
            {
                path: 'perfil',
                loadComponent: () => import('./profile/tenant-profile.component').then(m => m.TenantProfileComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
