import { Routes } from '@angular/router';
import { HasAccessGuard } from '../../shared/guard/has-access.guard';

export const SECURITY_ROUTES: Routes = [
    {
        path: '',
        children: [
            {
                path: 'usuario',
                redirectTo: 'usuarios',
                pathMatch: 'full'
            },
            {
                path: 'usuarios',
                loadComponent: () =>
                    import('./pages/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/usuarios', '/security/usuario']
                }
            },
            {
                path: 'multitabla',
                loadComponent: () =>
                    import('./pages/multitabla/multitabla.component').then((m) => m.MultitablaComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/multitabla']
                }
            },
            {
                path: 'rol',
                redirectTo: 'roles',
                pathMatch: 'full'
            },
            {
                path: 'roles',
                loadComponent: () =>
                    import('./pages/roles/roles.component').then((m) => m.RolesComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/roles', '/security/rol']
                }
            },
            {
                path: 'permiso',
                redirectTo: 'permisos',
                pathMatch: 'full'
            },
            {
                path: 'permisos',
                loadComponent: () =>
                    import('./pages/permisos/permisos.component').then((m) => m.PermisosComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/permisos', '/security/permiso']
                }
            },
            {
                path: 'modulo',
                redirectTo: 'modulos',
                pathMatch: 'full'
            },
            {
                path: 'modulos',
                loadComponent: () =>
                    import('./pages/modulos/modulos.component').then((m) => m.ModulosComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/modulos', '/security/modulo']
                }
            },
            {
                path: 'opcion',
                redirectTo: 'opciones',
                pathMatch: 'full'
            },
            {
                path: 'opciones',
                loadComponent: () =>
                    import('./pages/opciones/opciones.component').then((m) => m.OpcionesComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/opciones', '/security/opcion']
                }
            },
            {
                path: 'accion',
                redirectTo: 'acciones',
                pathMatch: 'full'
            },
            {
                path: 'acciones',
                loadComponent: () =>
                    import('./pages/acciones/acciones.component').then((m) => m.AccionesComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/acciones', '/security/accion']
                }
            },
            {
                path: 'campanas',
                loadComponent: () =>
                    import('./pages/campanas/campanas.component').then((m) => m.CampanasComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/campanas']
                }
            },
            {
                path: 'reportes',
                loadComponent: () =>
                    import('./pages/reportes/reportes.component').then((m) => m.ReportesComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/security/reportes']
                }
            }
        ]
    }
];

export default SECURITY_ROUTES;
