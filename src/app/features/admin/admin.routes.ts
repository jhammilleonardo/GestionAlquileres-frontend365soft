import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { moduleGuard } from '../../core/guards/module.guard';
import { rentalModeGuard } from '../../core/guards/rental-mode.guard';
import { setupCompleteGuard } from '../../core/guards/setup-complete.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard, setupCompleteGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'propiedades',
        loadComponent: () =>
          import('../properties/properties.component').then((m) => m.PropertiesComponent),
        canActivate: [moduleGuard],
        data: { module: 'properties' },
      },
      {
        path: 'propiedades/:id',
        loadComponent: () =>
          import('../properties/property-detail-admin.component').then(
            (m) => m.PropertyDetailAdminComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'properties' },
      },
      {
        path: 'inquilinos',
        loadComponent: () => import('../tenants/tenants.component').then((m) => m.TenantsComponent),
        canActivate: [moduleGuard],
        data: { module: 'users' },
      },
      {
        path: 'propietarios',
        loadComponent: () =>
          import('../rental-owners/rental-owners.component').then((m) => m.RentalOwnersComponent),
        canActivate: [moduleGuard],
        data: { module: 'properties' },
      },
      {
        path: 'contratos',
        loadComponent: () =>
          import('../contracts/contracts.component').then((m) => m.ContractsComponent),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'contracts', rentalMode: 'long_term' },
      },
      {
        path: 'contratos/nuevo',
        loadComponent: () =>
          import('../contracts/contract-create/contract-create.component').then(
            (m) => m.ContractCreateComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'contracts', rentalMode: 'long_term' },
      },
      {
        path: 'contratos/:id',
        loadComponent: () =>
          import('../contracts/contract-detail/contract-detail.component').then(
            (m) => m.ContractDetailComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'contracts', rentalMode: 'long_term' },
      },
      {
        path: 'contratos/:id/editar',
        loadComponent: () =>
          import('../contracts/contract-edit/contract-edit.component').then(
            (m) => m.ContractEditComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'contracts', rentalMode: 'long_term' },
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('../applications/applications.component').then((m) => m.ApplicationsComponent),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'applications', rentalMode: 'long_term' },
      },
      {
        path: 'solicitudes/:id',
        loadComponent: () =>
          import('../applications/components/application-detail/application-detail.component').then(
            (m) => m.ApplicationDetailComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'applications', rentalMode: 'long_term' },
      },
      {
        path: 'solicitudes/:id/aprobar',
        loadComponent: () =>
          import('../applications/components/approve-dialog/approve-dialog.component').then(
            (m) => m.ApproveDialogComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'applications', rentalMode: 'long_term' },
      },
      {
        path: 'solicitudes/:id/rechazar',
        loadComponent: () =>
          import('../applications/components/reject-dialog/reject-dialog.component').then(
            (m) => m.RejectDialogComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'applications', rentalMode: 'long_term' },
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('../payments/payments.component').then((m) => m.PaymentsComponent),
        canActivate: [moduleGuard],
        data: { module: 'payments' },
      },
      {
        path: 'mantenimiento',
        loadComponent: () =>
          import('../maintenance/maintenance.component').then((m) => m.MaintenanceComponent),
        canActivate: [moduleGuard],
        data: { module: 'maintenance' },
      },
      {
        path: 'reportes',
        loadComponent: () => import('../reports/reports.component').then((m) => m.ReportsComponent),
        canActivate: [moduleGuard],
        data: { module: 'reports' },
      },
      {
        path: 'contabilidad',
        loadComponent: () =>
          import('../contabilidad/contabilidad.component').then((m) => m.ContabilidadComponent),
        canActivate: [moduleGuard],
        data: { module: 'accounting' },
      },
      {
        path: 'proveedores',
        loadComponent: () => import('../vendors/vendors.component').then((m) => m.VendorsComponent),
        canActivate: [moduleGuard],
        data: { module: 'vendors' },
      },
      {
        path: 'gastos',
        loadComponent: () =>
          import('../expenses/expenses.component').then((m) => m.ExpensesComponent),
        canActivate: [moduleGuard],
        data: { module: 'expenses' },
      },
      {
        path: 'reservas',
        loadComponent: () =>
          import('../reservations/reservations.component').then((m) => m.ReservationsComponent),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'reservations', rentalMode: 'short_term' },
      },
      {
        path: 'resenas',
        loadComponent: () =>
          import('../reservations/reviews/admin-reviews.component').then(
            (m) => m.AdminReviewsComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'reservations', rentalMode: 'short_term' },
      },
      {
        path: 'limpieza',
        loadComponent: () =>
          import('../reservations/housekeeping/housekeeping.component').then(
            (m) => m.HousekeepingComponent,
          ),
        canActivate: [moduleGuard, rentalModeGuard],
        data: { module: 'reservations', rentalMode: 'short_term' },
      },
      {
        path: 'violaciones',
        loadComponent: () =>
          import('../violations/violations.component').then((m) => m.ViolationsComponent),
        canActivate: [moduleGuard],
        data: { module: 'violations' },
      },
      {
        path: 'inspecciones',
        loadComponent: () =>
          import('../inspections/inspections.component').then((m) => m.InspectionsComponent),
        canActivate: [moduleGuard],
        data: { module: 'inspections' },
      },
      {
        path: 'inspecciones/:id',
        loadComponent: () =>
          import('../inspections/inspection-detail.component').then(
            (m) => m.InspectionDetailComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'inspections' },
      },
      {
        path: 'auditoria',
        loadComponent: () => import('../audit/audit.component').then((m) => m.AuditComponent),
        canActivate: [moduleGuard],
        data: { module: 'config' },
      },
      {
        path: 'mensajes',
        loadComponent: () =>
          import('../messages/messages.component').then((m) => m.MessagesComponent),
        canActivate: [moduleGuard],
        data: { module: 'config' },
      },
      {
        path: 'mi-sitio-web',
        loadComponent: () =>
          import('../website/website-admin.component').then((m) => m.WebsiteAdminComponent),
        canActivate: [moduleGuard],
        data: { module: 'config' },
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('../configuration/configuration.component').then((m) => m.ConfigurationComponent),
        canActivate: [moduleGuard],
        data: { module: 'config' },
      },
      {
        path: 'empleados',
        loadComponent: () =>
          import('../employees/employees.component').then((m) => m.EmployeesComponent),
        canActivate: [moduleGuard],
        data: { module: 'employees' },
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('../notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../profile/admin-profile.component').then((m) => m.AdminProfileComponent),
      },
    ],
  },
];
