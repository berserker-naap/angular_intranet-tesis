import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';

export type FinanceCategoryType = 'INGRESO' | 'EGRESO';

export interface EntidadFinancieraItem {
    id: number;
    nombre: string;
    activo?: boolean;
}

export interface CategoriaFinanceItem {
    id: number;
    tipo: FinanceCategoryType;
    nombre: string;
    icono: string | null;
    colorHex: string | null;
    orden: number | null;
}

export interface SubcategoriaFinanceItem {
    id: number;
    nombre: string;
    orden: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class FinanceCatalogosService {
    private readonly apiUrl = environment.apiUrlFinance;
    private readonly loadingSubject = new BehaviorSubject<boolean>(false);
    private activeRequests = 0;

    readonly loading$ = this.loadingSubject.asObservable();

    constructor(private readonly http: HttpClient) {}

    getEntidadesFinancieras(): Observable<StatusResponse<EntidadFinancieraItem[]>> {
        return this.withLoading(
            this.http.get<StatusResponse<EntidadFinancieraItem[]>>(`${this.apiUrl}/entidades-financieras`)
        );
    }

    getCategorias(tipo?: FinanceCategoryType): Observable<StatusResponse<CategoriaFinanceItem[]>> {
        const query = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
        return this.withLoading(
            this.http.get<StatusResponse<CategoriaFinanceItem[]>>(`${this.apiUrl}/categorias${query}`)
        );
    }

    getSubcategorias(idCategoria: number): Observable<StatusResponse<SubcategoriaFinanceItem[]>> {
        return this.withLoading(
            this.http.get<StatusResponse<SubcategoriaFinanceItem[]>>(`${this.apiUrl}/subcategorias/categoria/${idCategoria}`)
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
