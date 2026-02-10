import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PropiedadesComponent } from './features/propiedades/propiedades.component';
import { InquilinosComponent } from './features/inquilinos/inquilinos.component';
import { ContratosComponent } from './features/contratos/contratos.component';
import { PagosComponent } from './features/pagos/pagos.component';
import { MantenimientoComponent } from './features/mantenimiento/mantenimiento.component';
import { ComponentesComponent } from './features/componentes/componentes.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { LandingComponent } from './features/landing/landing.component';
import { TenantRegisterComponent } from './features/portal-publico/tenant-register/tenant-register.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ==================== LANDING PAGE (PÚBLICO) ====================
  {
    path: '',
    component: LandingComponent
  },

  // ==================== AUTH ADMIN (PÚBLICO - SIN SLUG) ====================
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },

  // ==================== RUTAS CON SLUG ====================
  {
    path: ':slug',
    children: [
      // ==================== AUTH INQUILINO (CON SLUG) ====================
      { path: 'login', component: LoginComponent },
      { path: 'register', component: TenantRegisterComponent },

      // ==================== PORTAL PÚBLICO ====================
      {
        path: 'publico',
        loadChildren: () => import('./features/portal-publico/portal-publico.routes').then(m => m.PORTAL_PUBLICO_ROUTES)
      },

      // ==================== TENANT PORTAL (INQUILINOS) ====================
      {
        path: 'portal',
        loadChildren: () => import('./features/tenant-portal/tenant-portal.routes').then(m => m.TENANT_PORTAL_ROUTES)
      },

      // ==================== ADMIN PANEL ====================
      {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'propiedades', component: PropiedadesComponent },
          { path: 'inquilinos', component: InquilinosComponent },
          { path: 'contratos', component: ContratosComponent },
          { path: 'pagos', component: PagosComponent },
          { path: 'mantenimiento', component: MantenimientoComponent },
          { path: 'componentes', component: ComponentesComponent }
        ]
      }
    ]
  },

  // ==================== FALLBACK ====================
  {
    path: '**',
    redirectTo: '/'
  }
];
