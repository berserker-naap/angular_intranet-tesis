import { AppMenu } from './app.menu';

describe('AppMenu', () => {
    function createMenu(isAdmin: boolean, visiblePaths: string[]) {
        const authService = {
            hasAdministradorRole: jasmine.createSpy('hasAdministradorRole').and.returnValue(isAdmin),
            hasAnyVisibleNavigationAccess: jasmine
                .createSpy('hasAnyVisibleNavigationAccess')
                .and.callFake((paths: string[]) => isAdmin || paths.some((path) => visiblePaths.includes(path)))
        };
        const menu = new AppMenu(authService as any);

        menu.ngOnInit();
        return menu;
    }

    it('filtra opciones sin permiso visible', () => {
        const menu = createMenu(false, ['/security/usuarios']);
        const seguridad = menu.model.find((item) => item.label === 'Seguridad');
        const labels = seguridad?.items?.map((item) => item.label);

        expect(labels).toEqual(['Usuarios']);
        expect(menu.model.some((item) => item.label === 'Finanzas')).toBeFalse();
    });

    it('muestra reportes y finanzas para administrador', () => {
        const menu = createMenu(true, []);
        const seguridad = menu.model.find((item) => item.label === 'Seguridad');
        const finanzas = menu.model.find((item) => item.label === 'Finanzas');

        expect(seguridad?.items?.some((item) => item.label === 'Reportes')).toBeTrue();
        expect(finanzas?.items?.map((item) => item.label)).toEqual(['Resumen', 'Catalogos']);
    });

    it('muestra solo reportes para soporte', () => {
        const menu = createMenu(false, ['/security/reportes']);
        const seguridad = menu.model.find((item) => item.label === 'Seguridad');

        expect(seguridad?.items?.map((item) => item.label)).toEqual(['Reportes']);
        expect(menu.model.some((item) => item.label === 'Finanzas')).toBeFalse();
    });

    it('muestra solo finanzas para rol finanzas', () => {
        const menu = createMenu(false, ['/finance/resumen', '/finance/catalogos']);
        const finanzas = menu.model.find((item) => item.label === 'Finanzas');

        expect(finanzas?.items?.map((item) => item.label)).toEqual(['Resumen', 'Catalogos']);
        expect(menu.model.some((item) => item.label === 'Comunicaciones')).toBeFalse();
    });
});
