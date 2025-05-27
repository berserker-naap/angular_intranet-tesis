import { RolesComponent } from './pages/roles/roles.component';
import { AccionesComponent } from './pages/acciones/acciones.component';
import { ModulosComponent } from './pages/modulos/modulos.component';
import { OpcionesComponent } from './pages/opciones/opciones.component';
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
                path: 'multitabla',
                loadComponent: () =>
                    import('./pages/users/users.component').then(m => m.UsersComponent),
            },
            {
                path: 'rol',
                loadComponent: () =>
                    import('./pages/roles/roles.component').then(m => m.RolesComponent),
            },
            {
                path: 'permiso',
                loadComponent: () =>
                    import('./pages/permisos/permisos.component').then(m => m.PermisosComponent),
            },
            {
                path: 'modulo',
                loadComponent: () =>
                    import('./pages/modulos/modulos.component').then(m => m.ModulosComponent),
            },
            {
                path: 'opcion',
                loadComponent: () =>
                    import('./pages/opciones/opciones.component').then(m => m.OpcionesComponent),
            },
            {
                path: 'accion',
                loadComponent: () =>
                    import('./pages/acciones/acciones.component').then(m => m.AccionesComponent),
            },

        ]
    }
];

export default SECURITY_ROUTES;
