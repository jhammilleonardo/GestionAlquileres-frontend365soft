import { Routes } from '@angular/router';

export const PUBLIC_PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'propiedades',
        loadComponent: () =>
          import('./property-list/property-list.component').then((m) => m.PropertyListComponent),
      },
      {
        path: 'propiedades/:id',
        loadComponent: () =>
          import('./property-detail/property-detail.component').then(
            (m) => m.PropertyDetailComponent,
          ),
      },
      {
        path: 'mapa',
        loadComponent: () =>
          import('./property-map/property-map.component').then((m) => m.PropertyMapComponent),
      },
      {
        path: 'solicitud/:propertyId',
        loadComponent: () =>
          import('./application-form/application-form.component').then(
            (m) => m.ApplicationFormComponent,
          ),
      },
      {
        path: 'nosotros',
        loadComponent: () => import('./about/about.component').then((m) => m.AboutComponent),
      },
      {
        path: 'contacto',
        loadComponent: () => import('./contact/contact.component').then((m) => m.ContactComponent),
      },
      {
        path: 'faq',
        loadComponent: () => import('./faq/faq.component').then((m) => m.FaqComponent),
      },
    ],
  },
];
