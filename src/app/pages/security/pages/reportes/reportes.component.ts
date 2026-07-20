import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { NotificationToastService } from '../../../../shared/services/notification-toast.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import {
    EmailLogItem,
    PushLogItem,
    ReportesQuery,
    ReportesService,
    ServiceErrorLogItem,
    WhatsappLogItem
} from '../../services/reportes.service';

type ReportItem = ServiceErrorLogItem | WhatsappLogItem | EmailLogItem | PushLogItem;

interface DetailRow {
    label: string;
    value: string;
    mono?: boolean;
}

interface DetailContext {
    title: string;
    rows: DetailRow[];
}

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TableModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        LoadingOverlayComponent
    ],
    templateUrl: './reportes.component.html',
    styleUrls: ['./reportes.component.scss'],
    providers: [NotificationToastService]
})
export class ReportesComponent implements OnInit {
    readonly limit = 200;
    readonly loading$: Observable<boolean>;

    dateFrom = '';
    dateTo = '';
    detailDialog = false;

    readonly serviceErrors = signal<ServiceErrorLogItem[]>([]);
    readonly whatsappLogs = signal<WhatsappLogItem[]>([]);
    readonly emailLogs = signal<EmailLogItem[]>([]);
    readonly pushLogs = signal<PushLogItem[]>([]);
    readonly detail = signal<DetailContext | null>(null);

    constructor(
        private readonly reportesService: ReportesService,
        private readonly utils: UtilsService,
        private readonly notificationToast: NotificationToastService
    ) {
        this.loading$ = this.reportesService.loading$;
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        const query = this.buildQuery();

        forkJoin({
            serviceErrors: this.reportesService.getServiceErrors(query),
            whatsappLogs: this.reportesService.getWhatsappLogs(query),
            emailLogs: this.reportesService.getEmailLogs(query),
            pushLogs: this.reportesService.getPushLogs(query)
        }).subscribe({
            next: (response) => {
                this.serviceErrors.set(this.resolveData(response.serviceErrors, 'errores de servicio'));
                this.whatsappLogs.set(this.resolveData(response.whatsappLogs, 'bitacora de WhatsApp'));
                this.emailLogs.set(this.resolveData(response.emailLogs, 'bitacora de correos'));
                this.pushLogs.set(this.resolveData(response.pushLogs, 'bitacora push'));
            },
            error: (err) => {
                this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    applyFilters(): void {
        if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) {
            this.notificationToast.error('La fecha inicial no puede ser mayor que la fecha final.');
            return;
        }

        this.loadData();
    }

    resetFilters(): void {
        this.dateFrom = '';
        this.dateTo = '';
        this.loadData();
    }

    exportCsv(): void {
        const rows = [
            ['Seccion', 'ID', 'Fecha', 'Estado/Fuente', 'Referencia', 'Usuario', 'Mensaje/Detalle'],
            ...this.serviceErrors().map((item) => [
                'Errores de servicio',
                `${item.id}`,
                this.formatDate(item.fechaRegistro),
                item.sourceType,
                `${item.httpMethod ?? 'N/A'} ${item.route ?? ''}`.trim(),
                item.usuarioLogin || 'system',
                this.joinText(item.message, item.detail)
            ]),
            ...this.whatsappLogs().map((item) => [
                'WhatsApp',
                `${item.id}`,
                this.formatDate(item.fechaRegistro),
                `${item.direction} ${item.status}`.trim(),
                item.phone,
                item.usuarioLogin || 'Sin usuario',
                this.joinText(item.text, item.detail)
            ]),
            ...this.emailLogs().map((item) => [
                'Correos',
                `${item.id}`,
                this.formatDate(item.fechaRegistro),
                item.status,
                item.recipientsSummary,
                item.usuarioLogin || 'system',
                this.joinText(item.subject, item.detail)
            ]),
            ...this.pushLogs().map((item) => [
                'Push',
                `${item.id}`,
                this.formatDate(item.fechaRegistro),
                item.status,
                item.targetExpression,
                item.usuarioLogin || 'system',
                this.joinText(item.title, item.messagePreview, item.detail)
            ])
        ];

        const content = rows.map((row) => row.map((value) => this.escapeCsv(value)).join(',')).join('\r\n');
        const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reportes-operativos-${this.dateFrom || 'inicio'}-${this.dateTo || 'hoy'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    openDetail(section: string, item: ReportItem): void {
        this.detail.set({
            title: `${section} #${item.id}`,
            rows: this.buildDetailRows(item)
        });
        this.detailDialog = true;
    }

    hasDetail(item: ReportItem): boolean {
        return this.buildDetailRows(item).some((row) => row.value !== 'Sin dato');
    }

    getErrorSeverity(item: ServiceErrorLogItem): 'danger' | 'warn' | 'secondary' {
        if ((item.statusCode ?? 0) >= 500 || item.sourceType === 'SERVICE_EXCEPTION') return 'danger';
        if ((item.statusCode ?? 0) >= 400) return 'warn';
        return 'secondary';
    }

    getStatusSeverity(status: string | null | undefined): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
        const normalized = `${status ?? ''}`.trim().toUpperCase();
        if (['SENT', 'SUCCESS', 'DELIVERED', 'OK'].includes(normalized)) return 'success';
        if (['PENDING', 'QUEUED', 'DRAFT', 'IN_PROGRESS'].includes(normalized)) return 'warn';
        if (['FAILED', 'ERROR', 'REJECTED'].includes(normalized)) return 'danger';
        if (['IN', 'OUT'].includes(normalized)) return 'info';
        return 'secondary';
    }

    formatDate(value: string | null | undefined): string {
        if (!value) return 'Sin fecha';

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

    get filterSummary(): string {
        if (this.dateFrom && this.dateTo) return `Del ${this.dateFrom} al ${this.dateTo}`;
        if (this.dateFrom) return `Desde ${this.dateFrom}`;
        if (this.dateTo) return `Hasta ${this.dateTo}`;
        return `Ultimos ${this.limit} registros por bitacora`;
    }

    private buildQuery(): ReportesQuery {
        return {
            limit: this.limit,
            from: this.dateFrom || undefined,
            to: this.dateTo || undefined
        };
    }

    private resolveData<T>(response: { ok: boolean; message: string | string[]; data?: T[] }, label: string): T[] {
        if (response.ok && Array.isArray(response.data)) {
            return response.data;
        }

        this.notificationToast.error(this.utils.normalizeMessages(response.message), `No se pudo cargar ${label}`);
        return [];
    }

    private buildDetailRows(item: ReportItem): DetailRow[] {
        return [
            { label: 'Detalle', value: this.readValue(item, 'detail') },
            { label: 'Payload JSON', value: this.formatJson(this.readValue(item, 'payloadJson')), mono: true },
            { label: 'Stack trace', value: this.readValue(item, 'stackTrace'), mono: true },
            { label: 'Provider message ID', value: this.readValue(item, 'providerMessageId'), mono: true },
            { label: 'IP registro', value: this.readValue(item, 'ipRegistro'), mono: true }
        ];
    }

    private readValue(item: ReportItem, key: string): string {
        const value = (item as Record<string, unknown>)[key];
        if (value === null || value === undefined || value === '') return 'Sin dato';
        return `${value}`;
    }

    private formatJson(value: string): string {
        if (value === 'Sin dato') return value;

        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }

    private escapeCsv(value: string): string {
        return `"${`${value ?? ''}`.replace(/"/g, '""')}"`;
    }

    private joinText(...values: Array<string | null | undefined>): string {
        return values.filter((value) => !!value).join(' | ');
    }
}
