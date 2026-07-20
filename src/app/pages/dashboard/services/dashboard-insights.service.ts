import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';

export interface DashboardDominantCategoryItem {
    idCategoria: number | null;
    nombre: string;
}

export interface DashboardPredictionItem {
    idCategoria: number | null;
    categoriaNombre: string;
    montoPredicho: number;
    confianza: number;
    aptoPresupuesto: boolean;
    montoPresupuestoSugerido: number | null;
    tendencia: 'UP' | 'DOWN' | 'STABLE';
}

export interface DashboardAnomalyItem {
    idTransaccion: number | null;
    idCategoria: number | null;
    fecha: string;
    monto: number;
    categoriaNombre: string;
    score: number;
    severidad: 'ALTA' | 'MEDIA' | 'BAJA';
    motivo: string;
    monedaCodigo: string;
    monedaSimbolo: string;
}

export interface DashboardSegmentClusterItem {
    nombre: string;
    participacion: number;
    montoPromedio: number;
    categoriasDominantes: string[];
    categoriasDominantesDetalle: DashboardDominantCategoryItem[];
}

export interface DashboardSegmentProfileItem {
    nombre: string;
    descripcion: string;
    confianza: number;
}

export interface DashboardInsightsResponse {
    periodoInicio: string;
    periodoFin: string;
    cantidadTransacciones: number;
    monedaCodigo: string;
    monedaSimbolo: string;
    resumenAccionable: {
        totalPredicho: number;
        categoriaMayorCrecimiento: DashboardDominantCategoryItem | null;
        oportunidadAhorro: (DashboardDominantCategoryItem & { montoEstimado: number }) | null;
    };
    prediccion: {
        proximoMes: string;
        items: DashboardPredictionItem[];
        fuente: 'ML_SERVICE' | 'FALLBACK';
    };
    anomalias: {
        total: number;
        items: DashboardAnomalyItem[];
        fuente: 'ML_SERVICE' | 'FALLBACK';
    };
    segmentacion: {
        perfil: DashboardSegmentProfileItem;
        clusters: DashboardSegmentClusterItem[];
        fuente: 'ML_SERVICE' | 'FALLBACK';
    };
    metadata: {
        proveedor: string;
        versionModelo: string;
        generadoEn: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DashboardInsightsService {
    private readonly apiUrl = `${environment.apiUrlAnalytics}/dashboard`;
    private readonly loadingSubject = new BehaviorSubject<boolean>(false);
    private activeRequests = 0;

    readonly loading$ = this.loadingSubject.asObservable();

    constructor(private readonly http: HttpClient) {}

    getInsights(): Observable<StatusResponse<DashboardInsightsResponse>> {
        return this.withLoading(this.http.get<StatusResponse<DashboardInsightsResponse>>(`${this.apiUrl}/insights`));
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
