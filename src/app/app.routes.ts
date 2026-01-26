import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PropiedadesComponent } from './features/propiedades/propiedades.component';
import { InquilinosComponent } from './features/inquilinos/inquilinos.component';
import { ContratosComponent } from './features/contratos/contratos.component';
import { PagosComponent } from './features/pagos/pagos.component';
import { MantenimientoComponent } from './features/mantenimiento/mantenimiento.component';
import { ComponentesComponent } from './features/componentes/componentes.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'propiedades', component: PropiedadesComponent },
      { path: 'inquilinos', component: InquilinosComponent },
      { path: 'contratos', component: ContratosComponent },
      { path: 'pagos', component: PagosComponent },
      { path: 'mantenimiento', component: MantenimientoComponent },
      { path: 'componentes', component: ComponentesComponent }
    ]
  }
];
