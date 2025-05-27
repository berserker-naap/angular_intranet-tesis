import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {
 private readonly apiUrl = `${environment.apiUrlSecurity}/permiso`;

  private _loading = new BehaviorSubject<boolean>(false);
  public readonly loading$: Observable<boolean> = this._loading.asObservable();

  constructor(private http: HttpClient) {}

  private withLoading<T>(obs: Observable<T>): Observable<T> {
    this._loading.next(true);
    return obs.pipe(
      finalize(() => setTimeout(() => this._loading.next(false), 100))
    );
  }

  getPermisosPorRol(idRol: number): Observable<StatusResponse<any[]>> {
    return this.withLoading(
      this.http.get<StatusResponse<any[]>>(`${this.apiUrl}/rol/${idRol}`)
    );
  }

  actualizarPermisos(payload: any[]): Observable<StatusResponse<any>> {
    return this.withLoading(
      this.http.post<StatusResponse<any>>(`${this.apiUrl}/rol`, payload)
    );
  }
}
