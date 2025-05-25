import { AccionesComponent } from './pages/acciones/acciones.component';
import { ModulosComponent } from './pages/modulos/modulos.component';
import { OptionsComponent } from './pages/options/options.component';
// src/app/pages/security/security.routes.ts
import { Routes } from '@angular/router';

export const SECURITY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'usuario',
        loadComponent: () =>
          import('./pages/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'modulo',
        loadComponent: () =>
          import('./pages/modulos/modulos.component').then(m => m.ModulosComponent),
      },
      {
        path: 'accion',
        loadComponent: () =>
          import('./pages/acciones/acciones.component').then(m => m.AccionesComponent),
      },
      {
        path: 'opcion',
        loadComponent: () =>
          import('./pages/options/options.component').then(m => m.OptionsComponent),
      }
    ]
  }
];

export default SECURITY_ROUTES;
