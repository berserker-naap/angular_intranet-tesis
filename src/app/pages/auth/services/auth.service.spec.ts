import { AuthService } from './auth.service';

describe('AuthService permisos', () => {
    let service: AuthService;

    beforeEach(() => {
        localStorage.clear();
        service = new AuthService({} as any);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('detecta rol administrador sin depender de mayusculas', () => {
        service.storeSession({ roles: ['administrador'] } as any);

        expect(service.hasAdministradorRole()).toBeTrue();
    });

    it('valida acceso por ruta desde las opciones de la sesion', () => {
        service.storeSession({
            roles: ['SOPORTE'],
            permisos: [
                {
                    opciones: [
                        { path: '/security/reportes', isVisibleNavegacion: true }
                    ]
                }
            ]
        } as any);

        expect(service.hasAnyPathAccess(['/security/reportes'])).toBeTrue();
        expect(service.hasAnyPathAccess(['/security/usuarios'])).toBeFalse();
    });

    it('respeta visibilidad de navegacion', () => {
        service.storeSession({
            roles: ['SOPORTE'],
            permisos: [
                {
                    opciones: [
                        { path: '/security/reportes', isVisibleNavegacion: false }
                    ]
                }
            ]
        } as any);

        expect(service.hasAnyVisibleNavigationAccess(['/security/reportes'])).toBeFalse();
    });

    it('valida acciones normalizadas por opcion', () => {
        service.storeSession({
            roles: ['MANTENEDOR'],
            permisos: [
                {
                    opciones: [
                        {
                            path: '/security/usuarios',
                            acciones: [{ nombre: 'Editar' }, { nombre: 'Ver Detalle' }]
                        }
                    ]
                }
            ]
        } as any);

        expect(service.hasActionAccess('/security/usuarios', 'editar')).toBeTrue();
        expect(service.hasActionAccess('/security/usuarios', 'Eliminar')).toBeFalse();
    });
});
