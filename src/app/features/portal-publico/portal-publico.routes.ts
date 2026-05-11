import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './public-layout/public-layout.component';
import { HomeComponent } from './home/home.component';
import { PropertyListComponent } from './property-list/property-list.component';
import { PropertyDetailComponent } from './property-detail/property-detail.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { FaqComponent } from './faq/faq.component';
import { ApplicationFormComponent } from './application-form/application-form.component';

export const PORTAL_PUBLICO_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: HomeComponent },
      { path: 'propiedades', component: PropertyListComponent },
      { path: 'propiedades/:id', component: PropertyDetailComponent },
      { path: 'mapa', loadComponent: () => import('./property-map/property-map.component').then(m => m.PropertyMapComponent) },
      { path: 'solicitud/:propertyId', component: ApplicationFormComponent },
      { path: 'nosotros', component: AboutComponent },
      { path: 'contacto', component: ContactComponent },
      { path: 'faq', component: FaqComponent }
    ]
  }
];
