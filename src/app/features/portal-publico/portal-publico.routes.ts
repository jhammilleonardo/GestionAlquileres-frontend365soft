import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './public-layout/public-layout.component';
import { PropertyListComponent } from './property-list/property-list.component';
import { PropertyDetailComponent } from './property-detail/property-detail.component';

export const PORTAL_PUBLICO_ROUTES: Routes = [
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            { path: '', redirectTo: 'propiedades', pathMatch: 'full' },
            { path: 'propiedades', component: PropertyListComponent },
            { path: 'propiedades/:id', component: PropertyDetailComponent }
        ]
    }
];
