import { of } from 'rxjs';
import { ReportesComponent } from './reportes.component';

describe('ReportesComponent', () => {
    function createComponent() {
        const emptyResponse = { ok: true, message: 'ok', data: [] };
        const reportesService = {
            loading$: of(false),
            getServiceErrors: jasmine.createSpy('getServiceErrors').and.returnValue(of(emptyResponse)),
            getWhatsappLogs: jasmine.createSpy('getWhatsappLogs').and.returnValue(of(emptyResponse)),
            getEmailLogs: jasmine.createSpy('getEmailLogs').and.returnValue(of(emptyResponse)),
            getPushLogs: jasmine.createSpy('getPushLogs').and.returnValue(of(emptyResponse))
        };
        const utils = {
            normalizeMessages: (value: string | string[]) => value
        };
        const notificationToast = {
            error: jasmine.createSpy('error')
        };

        return {
            component: new ReportesComponent(reportesService as any, utils as any, notificationToast as any),
            reportesService,
            notificationToast
        };
    }

    it('carga reportes con limite y rango de fechas', () => {
        const { component, reportesService } = createComponent();
        component.dateFrom = '2026-07-01';
        component.dateTo = '2026-07-20';

        component.loadData();

        expect(reportesService.getServiceErrors).toHaveBeenCalledWith({
            limit: 200,
            from: '2026-07-01',
            to: '2026-07-20'
        });
        expect(reportesService.getPushLogs).toHaveBeenCalledWith({
            limit: 200,
            from: '2026-07-01',
            to: '2026-07-20'
        });
    });

    it('bloquea filtros con rango invalido', () => {
        const { component, reportesService, notificationToast } = createComponent();
        component.dateFrom = '2026-07-20';
        component.dateTo = '2026-07-01';

        component.applyFilters();

        expect(notificationToast.error).toHaveBeenCalled();
        expect(reportesService.getServiceErrors).not.toHaveBeenCalled();
    });

    it('abre detalle con payload formateado', () => {
        const { component } = createComponent();

        component.openDetail('Error de servicio', {
            id: 7,
            detail: 'Fallo controlado',
            payloadJson: '{"ok":false}',
            stackTrace: 'stack',
            ipRegistro: '127.0.0.1'
        } as any);

        expect(component.detailDialog).toBeTrue();
        expect(component.detail()?.title).toBe('Error de servicio #7');
        expect(component.detail()?.rows.some((row) => row.value.includes('"ok": false'))).toBeTrue();
    });
});
