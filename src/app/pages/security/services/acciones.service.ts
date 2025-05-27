import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StatusResponse } from '../../../shared/interface/status-response.interface';

@Injectable({
  providedIn: 'root'
})
export class AccionesService {
  private readonly apiUrl = `${environment.apiUrlSecurity}/accion`;

  private _loading = new BehaviorSubject<boolean>(false);
  public readonly loading$: Observable<boolean> = this._loading.asObservable();

  constructor(private http: HttpClient) {}

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

  findOne(id: number): Observable<StatusResponse<any>> {
    return this.withLoading(
      this.http.get<StatusResponse<any>>(`${this.apiUrl}/${id}`)
    );
  }

  create(data: any): Observable<StatusResponse<any>> {
    return this.withLoading(
      this.http.post<StatusResponse<any>>(this.apiUrl, data)
    );
  }

  update(id: number, data: any): Observable<StatusResponse<any>> {
    return this.withLoading(
      this.http.patch<StatusResponse<any>>(`${this.apiUrl}/${id}`, data)
    );
  }

  delete(id: number): Observable<StatusResponse<any>> {
    return this.withLoading(
      this.http.delete<StatusResponse<any>>(`${this.apiUrl}/${id}`)
    );
  }

  deleteMany(ids: number[]): Observable<StatusResponse<any>> {
    return this.withLoading(
      this.http.post<StatusResponse<any>>(`${this.apiUrl}/delete-all`, ids)
    );
  }
}
