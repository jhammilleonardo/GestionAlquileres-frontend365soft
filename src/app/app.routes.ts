import { Routes } from '@angular/router';
import { adminLoginGuard } from './core/guards/auth.guard';
import { ownerAuthGuard, ownerLoginGuard } from './core/guards/owner-auth.guard';
import { vendorAuthGuard, vendorLoginGuard } from './core/guards/vendor-auth.guard';
import { tenantLoginGuard } from './core/guards/tenant-auth.guard';
import { wizardGuard } from './core/guards/setup-complete.guard';

export const routes: Routes = [
  // ==================== LANDING PAGE (PÚBLICO) ====================
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },

  // ==================== AUTH ADMIN (PÚBLICO - SIN SLUG) ====================
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
    canActivate: [adminLoginGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
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
      {
        path: 'register',
        loadComponent: () =>
          import('./features/public-portal/tenant-register/tenant-register.component').then(
            (m) => m.TenantRegisterComponent,
          ),
      },

      // ==================== PORTAL PÚBLICO ====================
      {
        path: 'publico',
        loadChildren: () =>
          import('./features/public-portal/public-portal.routes').then(
            (m) => m.PUBLIC_PORTAL_ROUTES,
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

      // ==================== OWNER PORTAL (PROPIETARIOS) ====================
      {
        path: 'owner/login',
        loadComponent: () =>
          import('./features/owner-portal/auth/owner-login.component').then(
            (m) => m.OwnerLoginComponent,
          ),
        canActivate: [ownerLoginGuard],
      },
      {
        path: 'owner',
        loadComponent: () =>
          import('./features/owner-portal/owner-portal.component').then(
            (m) => m.OwnerPortalComponent,
          ),
        canActivate: [ownerAuthGuard],
      },

      // ==================== VENDOR PORTAL (PROVEEDORES) ====================
      {
        path: 'vendor/login',
        loadComponent: () =>
          import('./features/vendor-portal/auth/vendor-login.component').then(
            (m) => m.VendorLoginComponent,
          ),
        canActivate: [vendorLoginGuard],
      },
      {
        path: 'vendor',
        loadComponent: () =>
          import('./features/vendor-portal/layout/vendor-layout.component').then(
            (m) => m.VendorLayoutComponent,
          ),
        canActivate: [vendorAuthGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/vendor-portal/vendor-portal.component').then(
                (m) => m.VendorPortalComponent,
              ),
          },
          {
            path: 'perfil',
            loadComponent: () =>
              import('./features/vendor-portal/profile/vendor-profile.component').then(
                (m) => m.VendorProfileComponent,
              ),
          },
        ],
      },

      // ==================== SETUP WIZARD (una vez, sin layout) ====================
      {
        path: 'configuracion/inicio',
        loadComponent: () =>
          import('./features/configuration/wizard-setup/wizard-setup.component').then(
            (m) => m.WizardSetupComponent,
          ),
        canActivate: [wizardGuard],
      },

      // ==================== ADMIN PANEL ====================
      {
        path: '',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },

  // ==================== FALLBACK ====================
  {
    path: '**',
    redirectTo: '/',
  },
];
