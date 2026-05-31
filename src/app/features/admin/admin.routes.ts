import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { moduleGuard } from '../../core/guards/module.guard';
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
          import('../propiedades/propiedades.component').then((m) => m.PropiedadesComponent),
        canActivate: [moduleGuard],
        data: { module: 'properties' },
      },
      {
        path: 'propiedades/:id',
        loadComponent: () =>
          import('../propiedades/property-detail-admin.component').then(
            (m) => m.PropertyDetailAdminComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'properties' },
      },
      {
        path: 'inquilinos',
        loadComponent: () =>
          import('../inquilinos/inquilinos.component').then((m) => m.InquilinosComponent),
        canActivate: [moduleGuard],
        data: { module: 'users' },
      },
      {
        path: 'contratos',
        loadComponent: () =>
          import('../contratos/contratos.component').then((m) => m.ContratosComponent),
        canActivate: [moduleGuard],
        data: { module: 'contracts' },
      },
      {
        path: 'contratos/nuevo',
        loadComponent: () =>
          import('../contratos/contract-create/contract-create.component').then(
            (m) => m.ContractCreateComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'contracts' },
      },
      {
        path: 'contratos/:id',
        loadComponent: () =>
          import('../contratos/contract-detail/contract-detail.component').then(
            (m) => m.ContractDetailComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'contracts' },
      },
      {
        path: 'contratos/:id/editar',
        loadComponent: () =>
          import('../contratos/contract-edit/contract-edit.component').then(
            (m) => m.ContractEditComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'contracts' },
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('../solicitudes/solicitudes.component').then((m) => m.SolicitudesComponent),
        canActivate: [moduleGuard],
        data: { module: 'applications' },
      },
      {
        path: 'solicitudes/:id',
        loadComponent: () =>
          import('../solicitudes/components/application-detail/application-detail.component').then(
            (m) => m.ApplicationDetailComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'applications' },
      },
      {
        path: 'solicitudes/:id/aprobar',
        loadComponent: () =>
          import('../solicitudes/components/approve-dialog/approve-dialog.component').then(
            (m) => m.ApproveDialogComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'applications' },
      },
      {
        path: 'solicitudes/:id/rechazar',
        loadComponent: () =>
          import('../solicitudes/components/reject-dialog/reject-dialog.component').then(
            (m) => m.RejectDialogComponent,
          ),
        canActivate: [moduleGuard],
        data: { module: 'applications' },
      },
      {
        path: 'pagos',
        loadComponent: () => import('../pagos/pagos.component').then((m) => m.PagosComponent),
        canActivate: [moduleGuard],
        data: { module: 'payments' },
      },
      {
        path: 'mantenimiento',
        loadComponent: () =>
          import('../mantenimiento/mantenimiento.component').then((m) => m.MantenimientoComponent),
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
          import('../configuracion/configuracion.component').then((m) => m.ConfiguracionComponent),
        canActivate: [moduleGuard],
        data: { module: 'config' },
      },
      {
        path: 'empleados',
        loadComponent: () =>
          import('../empleados/empleados.component').then((m) => m.EmpleadosComponent),
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
          import('../perfil/admin-perfil.component').then((m) => m.AdminPerfilComponent),
      },
    ],
  },
];
