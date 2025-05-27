import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';
import { CreateUsuarioDto, UsuarioDto } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private readonly apiUrl = `${environment.apiUrlSecurity}/usuario`;

    private _loading = new BehaviorSubject<boolean>(false);
    public readonly loading$: Observable<boolean> = this._loading.asObservable();

    constructor(private http: HttpClient) { }

    private withLoading<T>(obs: Observable<T>): Observable<T> {
        this._loading.next(true);
        return obs.pipe(finalize(() =>
            setTimeout(() => this._loading.next(false), 50)
        ));
    }

    findAll(): Observable<StatusResponse<any>> {
        return this.withLoading(
            this.http.get<StatusResponse<any>>(this.apiUrl)
        );
    }

    create(data: CreateUsuarioDto): Observable<StatusResponse<any>> {
        return this.withLoading(
            this.http.post<StatusResponse<any>>(this.apiUrl, data)
        );
    }

    asignarRoles(idUsuario: number, roles: number[]): Observable<StatusResponse<any>> {
        return this.withLoading(
            this.http.post<StatusResponse<any>>(`${this.apiUrl}/${idUsuario}/roles`, { roles })
        );
    }
}
