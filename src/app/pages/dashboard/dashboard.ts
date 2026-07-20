import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { AuthService } from '../auth/services/auth.service';
import { FinanceResumenResponse, FinanceOperacionService } from '../finance/services/finance-operacion.service';
import { ServiceErrorLogItem, ReportesService, WhatsappLogItem, EmailLogItem, PushLogItem } from '../security/services/reportes.service';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { NotificationToastService } from '../../shared/services/notification-toast.service';
import { UtilsService } from '../../shared/services/utils.service';
import { DashboardInsightsResponse, DashboardInsightsService } from './services/dashboard-insights.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TableModule, TagModule, ToastModule, ToolbarModule, LoadingOverlayComponent],
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.scss'],
    providers: [NotificationToastService]
})
export class Dashboard implements OnInit {
    readonly loading = signal(false);
    readonly analyticsInsights = signal<DashboardInsightsResponse | null>(null);
    readonly financeSummary = signal<FinanceResumenResponse | null>(null);
    readonly operationalSummary = signal<{
        serviceErrors: ServiceErrorLogItem[];
        whatsapp: WhatsappLogItem[];
        emails: EmailLogItem[];
        push: PushLogItem[];
    } | null>(null);
    readonly generatedAt = signal<string | null>(null);
    readonly reportLimit = 20;
    readonly canViewFinance: boolean;
    readonly canViewReports: boolean;

    constructor(
        private readonly dashboardInsightsService: DashboardInsightsService,
        private readonly financeOperacionService: FinanceOperacionService,
        private readonly reportesService: ReportesService,
        private readonly authService: AuthService,
        private readonly utils: UtilsService,
        private readonly notificationToast: NotificationToastService
    ) {
        this.canViewFinance = this.authService.hasAnyPathAccess(['/finance/resumen', '/finance/catalogos']);
        this.canViewReports = this.authService.hasAnyPathAccess(['/security/reportes']);
    }

    ngOnInit(): void {
        this.loadDashboard();
    }

    loadDashboard(): void {
        this.loading.set(true);

        if (this.canViewReports) {
            const reportQuery = { limit: this.reportLimit };

            forkJoin({
                analytics: this.dashboardInsightsService.getInsights(),
                finance: this.financeOperacionService.getResumen(),
                serviceErrors: this.reportesService.getServiceErrors(reportQuery),
                whatsapp: this.reportesService.getWhatsappLogs(reportQuery),
                emails: this.reportesService.getEmailLogs(reportQuery),
                push: this.reportesService.getPushLogs(reportQuery)
            }).subscribe({
                next: ({ analytics, finance, serviceErrors, whatsapp, emails, push }) => {
                    this.analyticsInsights.set(this.resolveObject(analytics, 'analitica del dashboard'));
                    this.financeSummary.set(this.resolveObject(finance, 'resumen financiero'));
                    this.operationalSummary.set({
                        serviceErrors: this.resolveArray(serviceErrors, 'errores de servicio'),
                        whatsapp: this.resolveArray(whatsapp, 'bitacora de WhatsApp'),
                        emails: this.resolveArray(emails, 'bitacora de correos'),
                        push: this.resolveArray(push, 'bitacora push')
                    });
                    this.generatedAt.set(new Date().toISOString());
                    this.loading.set(false);
                },
                error: (err) => {
                    this.handleError(err);
                }
            });

            return;
        }

        forkJoin({
            analytics: this.dashboardInsightsService.getInsights(),
            finance: this.financeOperacionService.getResumen()
        }).subscribe({
            next: ({ analytics, finance }) => {
                this.analyticsInsights.set(this.resolveObject(analytics, 'analitica del dashboard'));
                this.financeSummary.set(this.resolveObject(finance, 'resumen financiero'));
                this.operationalSummary.set(null);
                this.generatedAt.set(new Date().toISOString());
                this.loading.set(false);
            },
            error: (err) => {
                this.handleError(err);
            }
        });
    }

    formatDate(value: string | null | undefined): string {
        if (!value) return '-';

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Fecha invalida';

        return parsed.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatDateTime(value: string | null | undefined): string {
        if (!value) return '-';

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Fecha invalida';

        return parsed.toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatMoney(amount: number | null | undefined, symbol: string): string {
        const normalizedAmount = Number(amount ?? 0);
        return `${symbol}${normalizedAmount.toFixed(2)}`;
    }

    formatPercent(value: number | null | undefined): string {
        if (value === null || value === undefined) return '-';
        return `${Number(value).toFixed(1)}%`;
    }

    getTrendSeverity(value: 'UP' | 'DOWN' | 'STABLE'): 'danger' | 'success' | 'info' {
        if (value === 'UP') return 'danger';
        if (value === 'DOWN') return 'success';
        return 'info';
    }

    getAnomalySeverity(value: 'ALTA' | 'MEDIA' | 'BAJA'): 'danger' | 'warn' | 'info' {
        if (value === 'ALTA') return 'danger';
        if (value === 'MEDIA') return 'warn';
        return 'info';
    }

    getAlertSeverity(value: 'INFO' | 'WARNING' | 'DANGER'): 'info' | 'warn' | 'danger' {
        if (value === 'DANGER') return 'danger';
        if (value === 'WARNING') return 'warn';
        return 'info';
    }

    getMovementSeverity(value: string): 'success' | 'warn' | 'info' | 'secondary' {
        const normalized = `${value ?? ''}`.trim().toUpperCase();
        if (normalized === 'INGRESO') return 'success';
        if (normalized === 'EGRESO') return 'warn';
        if (normalized === 'TRANSFERENCIA') return 'info';
        return 'secondary';
    }

    getStatusSeverity(statusCode: number | null | undefined): 'danger' | 'warn' | 'secondary' {
        if ((statusCode ?? 0) >= 500) return 'danger';
        if ((statusCode ?? 0) >= 400) return 'warn';
        return 'secondary';
    }

    formatStatusCode(statusCode: number | null | undefined): string {
        return statusCode === null || statusCode === undefined ? 'NA' : `${statusCode}`;
    }

    private resolveObject<T>(response: { ok: boolean; message: string | string[]; data?: T }, label: string): T | null {
        if (response.ok && response.data) {
            return response.data;
        }

        this.notificationToast.error(this.utils.normalizeMessages(response.message), `No se pudo cargar ${label}`);
        return null;
    }

    private resolveArray<T>(response: { ok: boolean; message: string | string[]; data?: T[] }, label: string): T[] {
        if (response.ok && Array.isArray(response.data)) {
            return response.data;
        }

        this.notificationToast.error(this.utils.normalizeMessages(response.message), `No se pudo cargar ${label}`);
        return [];
    }

    private handleError(err: any): void {
        this.loading.set(false);
        this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
    }
}
