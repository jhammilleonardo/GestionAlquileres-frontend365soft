import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PropiedadesComponent } from './features/propiedades/propiedades.component';
import { PropertyDetailAdminComponent } from './features/propiedades/property-detail-admin.component';
import { InquilinosComponent } from './features/inquilinos/inquilinos.component';
import { ContratosComponent } from './features/contratos/contratos.component';
import { ContractCreateComponent } from './features/contratos/contract-create/contract-create.component';
import { ContractDetailComponent } from './features/contratos/contract-detail/contract-detail.component';
import { ContractEditComponent } from './features/contratos/contract-edit/contract-edit.component';
import { SolicitudesComponent } from './features/solicitudes/solicitudes.component';
import { ApplicationDetailComponent } from './features/solicitudes/components/application-detail/application-detail.component';
import { ApproveDialogComponent } from './features/solicitudes/components/approve-dialog/approve-dialog.component';
import { RejectDialogComponent } from './features/solicitudes/components/reject-dialog/reject-dialog.component';
import { PagosComponent } from './features/pagos/pagos.component';
import { MantenimientoComponent } from './features/mantenimiento/mantenimiento.component';
import { ComponentesComponent } from './features/componentes/componentes.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { AdminPerfilComponent } from './features/perfil/admin-perfil.component';
import { ConfiguracionComponent } from './features/configuracion/configuracion.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { LandingComponent } from './features/landing/landing.component';
import { TenantRegisterComponent } from './features/portal-publico/tenant-register/tenant-register.component';
import { authGuard, adminLoginGuard } from './core/guards/auth.guard';
import { tenantLoginGuard } from './core/guards/tenant-auth.guard';
import { setupCompleteGuard, wizardGuard } from './core/guards/setup-complete.guard';

export const routes: Routes = [
  // ==================== LANDING PAGE (PÚBLICO) ====================
  {
    path: '',
    component: LandingComponent,
  },

  // ==================== AUTH ADMIN (PÚBLICO - SIN SLUG) ====================
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [adminLoginGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },

  // ==================== RUTAS CON SLUG ====================
  {
    path: ':slug',
    children: [
      // ==================== AUTH INQUILINO (CON SLUG) ====================
      {
        path: 'login',
        loadComponent: () =>
          import('./features/tenant-portal/auth/tenant-login.component').then(
            (m) => m.TenantLoginComponent,
          ),
        canActivate: [tenantLoginGuard],
      },
      { path: 'register', component: TenantRegisterComponent },

      // ==================== PORTAL PÚBLICO ====================
      {
        path: 'publico',
        loadChildren: () =>
          import('./features/portal-publico/portal-publico.routes').then(
            (m) => m.PORTAL_PUBLICO_ROUTES,
          ),
      },

      // ==================== TENANT PORTAL (INQUILINOS) ====================
      {
        path: 'portal',
        loadChildren: () =>
          import('./features/tenant-portal/tenant-portal.routes').then(
            (m) => m.TENANT_PORTAL_ROUTES,
          ),
      },

      // ==================== SETUP WIZARD (una vez, sin layout) ====================
      {
        path: 'configuracion/inicio',
        loadComponent: () =>
          import('./features/configuracion/wizard-setup/wizard-setup.component').then(
            (m) => m.WizardSetupComponent,
          ),
        canActivate: [wizardGuard],
      },

      // ==================== ADMIN PANEL ====================
      {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard, setupCompleteGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'propiedades', component: PropiedadesComponent },
          { path: 'propiedades/:id', component: PropertyDetailAdminComponent },
          { path: 'inquilinos', component: InquilinosComponent },
          { path: 'contratos', component: ContratosComponent },
          { path: 'contratos/nuevo', component: ContractCreateComponent },
          { path: 'contratos/:id', component: ContractDetailComponent },
          { path: 'contratos/:id/editar', component: ContractEditComponent },
          { path: 'solicitudes', component: SolicitudesComponent },
          { path: 'solicitudes/:id', component: ApplicationDetailComponent },
          { path: 'solicitudes/:id/aprobar', component: ApproveDialogComponent },
          { path: 'solicitudes/:id/rechazar', component: RejectDialogComponent },
          { path: 'pagos', component: PagosComponent },
          { path: 'mantenimiento', component: MantenimientoComponent },
          { path: 'componentes', component: ComponentesComponent },
          { path: 'notificaciones', component: NotificationsComponent },
          { path: 'perfil', component: AdminPerfilComponent },
          { path: 'configuracion', component: ConfiguracionComponent },
        ],
      },
    ],
  },

  // ==================== FALLBACK ====================
  {
    path: '**',
    redirectTo: '/',
  },
];
