import { firstValueFrom } from 'rxjs';
import { HasAccessGuard } from './has-access.guard';

describe('HasAccessGuard', () => {
    function createGuard(roleGranted: boolean, pathGranted: boolean) {
        const authService = {
            hasAnyRole: jasmine.createSpy('hasAnyRole').and.returnValue(roleGranted),
            hasAnyPathAccess: jasmine.createSpy('hasAnyPathAccess').and.returnValue(pathGranted)
        };
        const router = {
            navigate: jasmine.createSpy('navigate')
        };

        return {
            guard: new HasAccessGuard(authService as any, router as any),
            authService,
            router
        };
    }

    it('permite acceso cuando rol y ruta son validos', async () => {
        const { guard, router } = createGuard(true, true);

        const result = await firstValueFrom(guard.canActivate(
            { data: { roles: ['ADMINISTRADOR'], paths: ['/security/reportes'] } } as any,
            { url: '/security/reportes' } as any
        ));

        expect(result).toBeTrue();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('redirige a access cuando falla el permiso de ruta', async () => {
        const { guard, router } = createGuard(true, false);

        const result = await firstValueFrom(guard.canActivate(
            { data: { roles: ['SOPORTE'], paths: ['/security/usuarios'] } } as any,
            { url: '/security/usuarios' } as any
        ));

        expect(result).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/access'], {
            queryParams: { redirectTo: '/security/usuarios' }
        });
    });
});
