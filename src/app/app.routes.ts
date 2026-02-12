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
import { authGuard } from './core/guards/auth.guard';
import { PropertyDetailAdminComponent } from './features/propiedades/property-detail-admin.component';

export const routes: Routes = [
  // ==================== AUTH ROUTES ====================
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // ==================== PUBLIC PORTAL ====================
  {
    path: 'publico',
    loadChildren: () => import('./features/portal-publico/portal-publico.routes').then(m => m.PORTAL_PUBLICO_ROUTES)
  },

  // ==================== TENANT PORTAL ====================
  {
    path: 'portal',
    loadChildren: () => import('./features/tenant-portal/tenant-portal.routes').then(m => m.TENANT_PORTAL_ROUTES)
  },

  // ==================== ADMIN PANEL (PROTECTED) ====================
  {
    path: ':slug/admin',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'propiedades', component: PropiedadesComponent },
      { path: 'propiedades/:id', component: PropertyDetailAdminComponent },
      { path: 'inquilinos', component: InquilinosComponent },
      { path: 'contratos', component: ContratosComponent },
      { path: 'pagos', component: PagosComponent },
      { path: 'mantenimiento', component: MantenimientoComponent },
      { path: 'componentes', component: ComponentesComponent }
    ]
  },

  // ==================== ROOT REDIRECT ====================
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // ==================== FALLBACK ====================
  {
    path: '**',
    redirectTo: '/login'
  }
];
