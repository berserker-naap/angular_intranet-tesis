import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap, map, catchError, of, BehaviorSubject, finalize } from "rxjs";
import { environment } from "../../../../environments/environment";
import { StatusResponse } from "../../../shared/interface/status-response.interface";
import { LoginDataResponse } from "../interfaces";
@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly TOKEN_KEY = 'access_token';
    private readonly REMEMBER_KEY = 'remember_me';

    private _loading = new BehaviorSubject<boolean>(false);
    public readonly loading$: Observable<boolean> = this._loading.asObservable();

    constructor(private http: HttpClient) { }

    login(credentials: { login: string; password: string }): Observable<StatusResponse<any>> {
        this._loading.next(true);

        return this.http.post<StatusResponse<any>>(
            `${environment.apiUrlAuth}/login`,
            credentials
        ).pipe(
            finalize(() =>
                setTimeout(() => this._loading.next(false), 100)
            )
        );
    }
    storeToken(token: string, remember: boolean) {
        const encodedToken = btoa(token);
        localStorage.setItem(this.TOKEN_KEY, encodedToken);
        localStorage.setItem(this.REMEMBER_KEY, String(remember));
    }

    getToken(): string | null {
        const encoded = localStorage.getItem(this.TOKEN_KEY);
        return encoded ? atob(encoded) : null;
    }

    isRemembered(): boolean {
        return localStorage.getItem(this.REMEMBER_KEY) === 'true';
    }

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REMEMBER_KEY);
    }

    isTokenExpired(): boolean {
        const token = this.getToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log(Date.now() >= payload.exp * 1000);
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    checkStatusAndRefresh(): Observable<boolean> {
        this._loading.next(true);

        return this.http.get<StatusResponse<any>>(
            `${environment.apiUrlAuth}/check-status`
        ).pipe(
            tap((res) => {
                if (res.ok && res.data?.token) {
                    this.storeToken(res.data.token, this.isRemembered());
                }
            }),
            map((res) => res.ok),
            catchError(() => {
                this.logout();
                return of(false);
            }),
            finalize(() => {
                setTimeout(() => this._loading.next(false), 300);
            })
        );
    }


    logout() {
        this.removeToken();
        // puedes limpiar más aquí si fuera necesario
    }
}
