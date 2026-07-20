import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { NotificationToastService } from '../../../../shared/services/notification-toast.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import {
    FinanceCuentaItem,
    FinanceOperacionService,
    FinanceResumenResponse,
    FinanceTransactionCurrencyTotal,
    FinanceTransactionFilterType,
    FinanceTransactionItem,
    FinanceTransactionListResponse,
    FinanceTransactionType
} from '../../services/finance-operacion.service';

@Component({
    selector: 'app-finance-resumen',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        LoadingOverlayComponent
    ],
    templateUrl: './resumen.component.html',
    styleUrls: ['./resumen.component.scss'],
    providers: [NotificationToastService]
})
export class FinanceResumenComponent implements OnInit {
    readonly loading$: Observable<boolean>;
    readonly resumen = signal<FinanceResumenResponse | null>(null);
    readonly cuentas = signal<FinanceCuentaItem[]>([]);
    readonly transacciones = signal<FinanceTransactionItem[]>([]);
    readonly totalesPorMoneda = signal<FinanceTransactionCurrencyTotal[]>([]);
    readonly totalResultados = signal<number>(0);

    readonly tiposMovimiento = [
        { label: 'Todos', value: null },
        { label: 'Ingresos', value: 'INGRESO' as FinanceTransactionFilterType },
        { label: 'Egresos', value: 'EGRESO' as FinanceTransactionFilterType }
    ];

    selectedCuentaId: number | null = null;
    selectedTipo: FinanceTransactionFilterType | null = null;
    search = '';
    fechaDesde = '';
    fechaHasta = '';
    readonly limit = 50;

    constructor(
        private readonly financeOperacionService: FinanceOperacionService,
        private readonly utils: UtilsService,
        private readonly notificationToast: NotificationToastService
    ) {
        this.loading$ = this.financeOperacionService.loading$;
    }

    ngOnInit(): void {
        this.loadDashboard();
    }

    loadDashboard(): void {
        forkJoin({
            resumen: this.financeOperacionService.getResumen(),
            cuentas: this.financeOperacionService.getCuentas(),
            movimientos: this.financeOperacionService.getTransacciones(this.buildFilters())
        }).subscribe({
            next: ({ resumen, cuentas, movimientos }) => {
                this.resumen.set(this.resolveObject(resumen, 'resumen financiero'));
                this.cuentas.set(this.resolveArray(cuentas, 'cuentas financieras'));
                this.applyMovimientosResponse(movimientos);
            },
            error: (err) => {
                this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    applyFilters(): void {
        this.financeOperacionService.getTransacciones(this.buildFilters()).subscribe({
            next: (response) => {
                this.applyMovimientosResponse(response);
            },
            error: (err) => {
                this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    resetFilters(): void {
        this.selectedCuentaId = null;
        this.selectedTipo = null;
        this.search = '';
        this.fechaDesde = '';
        this.fechaHasta = '';
        this.applyFilters();
    }

    getTransactionSeverity(tipo: FinanceTransactionType): 'success' | 'warn' | 'info' | 'secondary' {
        if (tipo === 'INGRESO') return 'success';
        if (tipo === 'EGRESO') return 'warn';
        if (tipo === 'TRANSFERENCIA') return 'info';
        return 'secondary';
    }

    getAlertSeverity(tipo: 'INFO' | 'WARNING' | 'DANGER'): 'info' | 'warn' | 'danger' {
        if (tipo === 'DANGER') return 'danger';
        if (tipo === 'WARNING') return 'warn';
        return 'info';
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
        return `${value.toFixed(1)}%`;
    }

    getCuentaDeuda(item: FinanceCuentaItem): number {
        if (!item.esTarjetaCredito || item.lineaCredito === null) return 0;
        return Number(Math.max(item.lineaCredito - item.saldoActual, 0).toFixed(2));
    }

    private buildFilters() {
        return {
            idCuenta: this.selectedCuentaId ?? undefined,
            tipo: this.selectedTipo ?? undefined,
            search: this.search.trim() || undefined,
            fechaDesde: this.fechaDesde || undefined,
            fechaHasta: this.fechaHasta || undefined,
            limit: this.limit
        };
    }

    private applyMovimientosResponse(response: { ok: boolean; message: string | string[]; data?: FinanceTransactionListResponse }): void {
        const data = this.resolveObject(response, 'movimientos financieros');
        this.transacciones.set(data?.items ?? []);
        this.totalesPorMoneda.set(data?.totalesPorMoneda ?? []);
        this.totalResultados.set(data?.totalResultados ?? 0);
    }

    private resolveArray<T>(response: { ok: boolean; message: string | string[]; data?: T[] }, label: string): T[] {
        if (response.ok && Array.isArray(response.data)) {
            return response.data;
        }

        this.notificationToast.error(this.utils.normalizeMessages(response.message), `No se pudo cargar ${label}`);
        return [];
    }

    private resolveObject<T>(response: { ok: boolean; message: string | string[]; data?: T }, label: string): T | null {
        if (response.ok && response.data) {
            return response.data;
        }

        this.notificationToast.error(this.utils.normalizeMessages(response.message), `No se pudo cargar ${label}`);
        return null;
    }
}
