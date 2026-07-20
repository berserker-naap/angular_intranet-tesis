import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';

export type FinanceTransactionType = 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA' | 'AJUSTE';
export type FinanceTransactionFilterType = 'INGRESO' | 'EGRESO';

export interface FinanceCuentaItem {
    id: number;
    alias: string;
    saldoActual: number;
    lineaCredito: number | null;
    diaCierre: number | null;
    diaPago: number | null;
    proximaFechaPago: string | null;
    esTarjetaCredito: boolean;
    moneda: {
        id: number;
        codigo: string;
        nombre: string;
        simbolo: string;
    };
    tipoCuenta: {
        id: number;
        nombre: string;
        naturaleza: string;
    };
    entidadFinanciera: {
        id: number;
        nombre: string;
        tipo: string;
        iconoUrl: string | null;
    } | null;
}

export interface FinanceBalanceCuentaResumenItem {
    id: number;
    alias: string;
    saldoActual: number;
    lineaCredito: number | null;
    esTarjetaCredito: boolean;
    diaCierre: number | null;
    diaPago: number | null;
    proximaFechaPago: string | null;
    monedaCodigo: string;
    monedaSimbolo: string;
    tipoCuenta: string;
    entidadFinanciera: string | null;
    entidadFinancieraIconoUrl: string | null;
}

export interface FinanceBalanceTipoCuentaResumenItem {
    tipoCuenta: string;
    monedaCodigo: string;
    monedaSimbolo: string;
    cantidad: number;
    saldoTotal: number;
}

export interface FinanceBalanceTarjetaResumenItem {
    monedaCodigo: string;
    monedaSimbolo: string;
    cantidadTarjetas: number;
    consumido: number;
    lineaCredito: number;
    disponible: number;
}

export interface FinanceBalanceMesResumenItem {
    monedaCodigo: string;
    monedaSimbolo: string;
    periodoInicio: string;
    periodoFin: string;
    ingresos: number;
    egresos: number;
    balance: number;
    porcentajeAhorro: number | null;
    egresosMesAnterior: number;
    variacionEgresosPorcentaje: number | null;
}

export interface FinanceBalanceMovimientoRecienteItem {
    id: number;
    idCuenta: number;
    fecha: string;
    tipo: FinanceTransactionType;
    monto: number;
    concepto: string;
    categoriaNombre: string | null;
    cuentaAlias: string;
    monedaCodigo: string;
    monedaSimbolo: string;
}

export interface FinanceBalanceAlertaItem {
    monedaCodigo: string | null;
    tipo: 'INFO' | 'WARNING' | 'DANGER';
    titulo: string;
    mensaje: string;
    icono: string;
}

export interface FinanceResumenResponse {
    hasAccounts: boolean;
    totalAccounts: number;
    totalSaldoPen: number;
    totalSaldoUsd: number;
    totalDisponiblePen: number;
    totalDisponibleUsd: number;
    deudaTarjetaPen: number;
    deudaTarjetaUsd: number;
    cuentas: FinanceBalanceCuentaResumenItem[];
    saldoPorTipoCuenta: FinanceBalanceTipoCuentaResumenItem[];
    resumenTarjetaCreditoPorMoneda: FinanceBalanceTarjetaResumenItem[];
    resumenMesPorMoneda: FinanceBalanceMesResumenItem[];
    ultimasTransacciones: FinanceBalanceMovimientoRecienteItem[];
    alertas: FinanceBalanceAlertaItem[];
}

export interface FinanceTransactionItem {
    id: number;
    idCuenta: number;
    fecha: string;
    tipo: FinanceTransactionType;
    monto: number;
    concepto: string;
    nota: string | null;
    idCategoria: number | null;
    categoriaNombre: string | null;
    idSubcategoria: number | null;
    subcategoriaNombre: string | null;
    cuentaAlias: string;
    entidadFinancieraNombre: string | null;
    monedaCodigo: string;
    monedaSimbolo: string;
    origen: string;
    editable: boolean;
}

export interface FinanceTransactionCurrencyTotal {
    monedaCodigo: string;
    monedaSimbolo: string;
    ingresos: number;
    egresos: number;
    balance: number;
    cantidad: number;
}

export interface FinanceTransactionListResponse {
    items: FinanceTransactionItem[];
    totalesPorMoneda: FinanceTransactionCurrencyTotal[];
    totalResultados: number;
}

export interface FinanceTransactionFilters {
    idCuenta?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    search?: string;
    tipo?: FinanceTransactionFilterType;
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})
export class FinanceOperacionService {
    private readonly apiUrl = environment.apiUrlFinance;
    private readonly loadingSubject = new BehaviorSubject<boolean>(false);
    private activeRequests = 0;

    readonly loading$ = this.loadingSubject.asObservable();

    constructor(private readonly http: HttpClient) {}

    getResumen(): Observable<StatusResponse<FinanceResumenResponse>> {
        return this.withLoading(this.http.get<StatusResponse<FinanceResumenResponse>>(`${this.apiUrl}/balance-account/summary`));
    }

    getCuentas(): Observable<StatusResponse<FinanceCuentaItem[]>> {
        return this.withLoading(this.http.get<StatusResponse<FinanceCuentaItem[]>>(`${this.apiUrl}/cuentas`));
    }

    getTransacciones(filters: FinanceTransactionFilters = {}): Observable<StatusResponse<FinanceTransactionListResponse>> {
        let params = new HttpParams();

        if (filters.idCuenta) {
            params = params.set('idCuenta', String(filters.idCuenta));
        }
        if (filters.fechaDesde) {
            params = params.set('fechaDesde', filters.fechaDesde);
        }
        if (filters.fechaHasta) {
            params = params.set('fechaHasta', filters.fechaHasta);
        }
        if (filters.search) {
            params = params.set('search', filters.search.trim());
        }
        if (filters.tipo) {
            params = params.set('tipo', filters.tipo);
        }
        if (filters.limit) {
            params = params.set('limit', String(filters.limit));
        }

        return this.withLoading(
            this.http.get<StatusResponse<FinanceTransactionListResponse>>(`${this.apiUrl}/transacciones`, { params })
        );
    }

    private withLoading<T>(obs: Observable<T>): Observable<T> {
        this.activeRequests += 1;
        if (this.activeRequests === 1) {
            this.loadingSubject.next(true);
        }

        return obs.pipe(
            finalize(() => {
                setTimeout(() => {
                    this.activeRequests = Math.max(0, this.activeRequests - 1);
                    if (this.activeRequests === 0) {
                        this.loadingSubject.next(false);
                    }
                }, 50);
            })
        );
    }
}
