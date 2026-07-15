
import { Routes } from '@angular/router';

export const SECURITY_ROUTES: Routes = [
    {
        path: '',
        children: [
            {
                path: 'usuario',
                loadComponent: () =>
                    import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
            },
            {
                path: 'multitabla',
                loadComponent: () =>
                    import('./pages/multitabla/multitabla.component').then(m => m.MultitablaComponent),
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
            {
                path: 'campanas',
                loadComponent: () =>
                    import('./pages/campanas/campanas.component').then(m => m.CampanasComponent),
            },

        ]
    }
];

export default SECURITY_ROUTES;
