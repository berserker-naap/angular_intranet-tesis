import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';

export interface CampaignaItem {
    id: number;
    scope: 'ALL_USERS';
    title: string;
    message: string;
    deepLink: string | null;
    sendPush: boolean;
    publishInApp: boolean;
    status: 'DRAFT' | 'SENT';
    sentAt: string | null;
    pushStatus: string | null;
    pushProviderMessageId: string | null;
    createdAt: string;
    createdBy: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
}

export interface CampaignaPayload {
    title: string;
    message: string;
    deepLink?: string | null;
    sendPush: boolean;
    publishInApp: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CampaignasService {
    private readonly apiUrl = `${environment.apiUrlMessaging}/campaigns`;

    private _loading = new BehaviorSubject<boolean>(false);
    public readonly loading$: Observable<boolean> = this._loading.asObservable();

    constructor(private readonly http: HttpClient) {}

    private withLoading<T>(obs: Observable<T>): Observable<T> {
        this._loading.next(true);
        return obs.pipe(finalize(() =>
            setTimeout(() => this._loading.next(false), 50)
        ));
    }

    findAll(): Observable<StatusResponse<CampaignaItem[]>> {
        return this.withLoading(
            this.http.get<StatusResponse<CampaignaItem[]>>(this.apiUrl)
        );
    }

    create(payload: CampaignaPayload): Observable<StatusResponse<CampaignaItem>> {
        return this.withLoading(
            this.http.post<StatusResponse<CampaignaItem>>(this.apiUrl, payload)
        );
    }

    update(id: number, payload: Partial<CampaignaPayload>): Observable<StatusResponse<CampaignaItem>> {
        return this.withLoading(
            this.http.patch<StatusResponse<CampaignaItem>>(`${this.apiUrl}/${id}`, payload)
        );
    }

    send(id: number): Observable<StatusResponse<CampaignaItem>> {
        return this.withLoading(
            this.http.post<StatusResponse<CampaignaItem>>(`${this.apiUrl}/${id}/send`, {})
        );
    }
}
