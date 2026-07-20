import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';

export interface ReportesQuery {
    limit: number;
    from?: string;
    to?: string;
}

export interface ServiceErrorLogItem {
    id: number;
    sourceType: string;
    moduleName: string | null;
    serviceName: string | null;
    methodName: string | null;
    errorType: string | null;
    statusCode: number | null;
    message: string;
    detail: string | null;
    stackTrace: string | null;
    httpMethod: string | null;
    route: string | null;
    idUsuario: number | null;
    usuarioLogin: string | null;
    ipRegistro: string | null;
    fechaRegistro: string;
    payloadJson: string | null;
}

export interface WhatsappLogItem {
    id: number;
    direction: 'IN' | 'OUT';
    status: string;
    phone: string;
    providerMessageId: string | null;
    idUsuario: number | null;
    usuarioLogin: string | null;
    idTransaccion: number | null;
    text: string | null;
    detail: string | null;
    ipRegistro: string | null;
    fechaRegistro: string;
    payloadJson: string | null;
}

export interface EmailLogItem {
    id: number;
    status: string;
    provider: string;
    senderAddress: string;
    recipientsSummary: string;
    subject: string;
    templateCode: string | null;
    providerMessageId: string | null;
    idUsuario: number | null;
    usuarioLogin: string | null;
    detail: string | null;
    ipRegistro: string | null;
    fechaRegistro: string;
    payloadJson: string | null;
}

export interface PushLogItem {
    id: number;
    status: string;
    provider: string;
    platform: string;
    format: string;
    targetExpression: string;
    title: string | null;
    messagePreview: string | null;
    providerMessageId: string | null;
    idUsuario: number | null;
    usuarioLogin: string | null;
    detail: string | null;
    ipRegistro: string | null;
    fechaRegistro: string;
    payloadJson: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class ReportesService {
    private readonly apiUrl = `${environment.apiUrlSecurity}/reportes`;
    private readonly loadingSubject = new BehaviorSubject<boolean>(false);
    private activeRequests = 0;

    readonly loading$ = this.loadingSubject.asObservable();

    constructor(private readonly http: HttpClient) {}

    getServiceErrors(query: ReportesQuery): Observable<StatusResponse<ServiceErrorLogItem[]>> {
        return this.withLoading(
            this.http.get<StatusResponse<ServiceErrorLogItem[]>>(`${this.apiUrl}/errores-servicio`, { params: this.buildParams(query) })
        );
    }

    getWhatsappLogs(query: ReportesQuery): Observable<StatusResponse<WhatsappLogItem[]>> {
        return this.withLoading(
            this.http.get<StatusResponse<WhatsappLogItem[]>>(`${this.apiUrl}/whatsapp`, { params: this.buildParams(query) })
        );
    }

    getEmailLogs(query: ReportesQuery): Observable<StatusResponse<EmailLogItem[]>> {
        return this.withLoading(
            this.http.get<StatusResponse<EmailLogItem[]>>(`${this.apiUrl}/correos`, { params: this.buildParams(query) })
        );
    }

    getPushLogs(query: ReportesQuery): Observable<StatusResponse<PushLogItem[]>> {
        return this.withLoading(
            this.http.get<StatusResponse<PushLogItem[]>>(`${this.apiUrl}/push`, { params: this.buildParams(query) })
        );
    }

    private buildParams(query: ReportesQuery): Record<string, string> {
        const params: Record<string, string> = {
            limit: `${query.limit}`
        };

        if (query.from) params['from'] = query.from;
        if (query.to) params['to'] = query.to;

        return params;
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
