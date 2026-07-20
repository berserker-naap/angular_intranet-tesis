import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap, map, catchError, of, BehaviorSubject, finalize } from "rxjs";
import { environment } from "../../../../environments/environment";
import { StatusResponse } from "../../../shared/interface/status-response.interface";
import { SessionResponseDto } from "../interfaces";

@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly TOKEN_KEY = 'access_token';
    private readonly REMEMBER_KEY = 'remember_me';
    private readonly SESSION_KEY = 'session_data';
    private readonly authApiUrl: string = (environment as any).apiUrlAuth ?? `${(environment as any).apiUrl}/auth`;

    private _loading = new BehaviorSubject<boolean>(false);
    public readonly loading$: Observable<boolean> = this._loading.asObservable();

    constructor(private http: HttpClient) { }

    private normalizeLogin(value: string | null | undefined): string {
        return `${value ?? ''}`.trim().toLowerCase();
    }

    login(credentials: { login: string; password: string }): Observable<StatusResponse<SessionResponseDto> | any> {
        this._loading.next(true);
        const payload = {
            ...credentials,
            login: this.normalizeLogin(credentials.login),
        };

        return this.http.post<StatusResponse<SessionResponseDto> | any>(
            `${this.authApiUrl}/login`,
            payload
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

    storeSession(session: SessionResponseDto) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    getToken(): string | null {
        const encoded = localStorage.getItem(this.TOKEN_KEY);
        return encoded ? atob(encoded) : null;
    }

    getSession(): SessionResponseDto | null {
        const raw = localStorage.getItem(this.SESSION_KEY);
        if (!raw) return null;

        try {
            return JSON.parse(raw) as SessionResponseDto;
        } catch {
            return null;
        }
    }

    getRoles(): string[] {
        return (this.getSession()?.roles ?? [])
            .map((role) => `${role ?? ''}`.trim().toUpperCase())
            .filter(Boolean);
    }

    hasAnyRole(expectedRoles: string[] = []): boolean {
        if (!expectedRoles.length) return true;

        const currentRoles = new Set(this.getRoles());
        return expectedRoles.some((role) => currentRoles.has(`${role ?? ''}`.trim().toUpperCase()));
    }

    hasAdministradorRole(): boolean {
        return this.hasAnyRole(['ADMINISTRADOR']);
    }

    hasAnyPathAccess(paths: string[] = []): boolean {
        if (!paths.length || this.hasAdministradorRole()) return true;

        const normalizedTargets = new Set(paths.map((path) => this.normalizePath(path)).filter(Boolean));
        if (!normalizedTargets.size) return true;

        return this.getPermissionOptions().some((option) => {
            const currentPath = this.normalizePath(option?.path);
            return !!currentPath && normalizedTargets.has(currentPath);
        });
    }

    hasAnyVisibleNavigationAccess(paths: string[] = []): boolean {
        if (!paths.length || this.hasAdministradorRole()) return true;

        const normalizedTargets = new Set(paths.map((path) => this.normalizePath(path)).filter(Boolean));
        if (!normalizedTargets.size) return true;

        return this.getPermissionOptions().some((option) => {
            const currentPath = this.normalizePath(option?.path);
            return !!currentPath && option?.isVisibleNavegacion !== false && normalizedTargets.has(currentPath);
        });
    }

    hasActionAccess(paths: string | string[] = [], actions: string | string[] = []): boolean {
        if (this.hasAdministradorRole()) return true;

        const targetPaths = (Array.isArray(paths) ? paths : [paths]).map((path) => this.normalizePath(path)).filter(Boolean);
        const targetActions = (Array.isArray(actions) ? actions : [actions]).map((action) => this.normalizeAction(action)).filter(Boolean);

        if (!targetPaths.length) return true;
        if (!targetActions.length) return this.hasAnyPathAccess(targetPaths);

        return this.getPermissionOptions().some((option) => {
            const currentPath = this.normalizePath(option?.path);
            if (!currentPath || !targetPaths.includes(currentPath)) return false;

            const optionActions = Array.isArray(option?.acciones) ? option.acciones : [];
            return optionActions.some((action) => targetActions.includes(this.normalizeAction(action?.nombre)));
        });
    }

    isRemembered(): boolean {
        return localStorage.getItem(this.REMEMBER_KEY) === 'true';
    }

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REMEMBER_KEY);
        localStorage.removeItem(this.SESSION_KEY);
    }

    isTokenExpired(): boolean {
        const token = this.getToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    checkStatusAndRefresh(): Observable<boolean> {
        this._loading.next(true);

        return this.http.get<StatusResponse<SessionResponseDto> | any>(
            `${this.authApiUrl}/check-status`
        ).pipe(
            tap((res) => {
                this.persistSessionFromResponse(res, this.isRemembered());
            }),
            map((res) => this.isSuccessResponse(res)),
            catchError(() => {
                this.logout();
                return of(false);
            }),
            finalize(() => {
                setTimeout(() => this._loading.next(false), 300);
            })
        );
    }

    validateSessionOnAppStart(): Observable<boolean> {
        const token = this.getToken();
        if (!token) return of(true);

        return this.checkStatusAndRefresh().pipe(
            tap((isValid) => {
                if (!isValid) this.logout();
            }),
            catchError(() => {
                this.logout();
                return of(false);
            })
        );
    }

    logout() {
        this.removeToken();
    }

    persistSessionFromResponse(response: any, remember: boolean): boolean {
        const session = this.extractSessionFromLoginResponse(response);
        const token = this.extractToken(session);
        if (!token) return false;

        this.storeToken(token, remember);
        this.storeSession(session);
        return true;
    }

    extractSessionFromLoginResponse(response: any): SessionResponseDto {
        if (response?.data?.session && typeof response.data.session === 'object') return response.data.session;
        if (response?.session && typeof response.session === 'object') return response.session;
        if (response?.data && typeof response.data === 'object') return response.data;
        if (response && typeof response === 'object') return response;
        return {};
    }

    private extractToken(session: SessionResponseDto | null | undefined): string | null {
        if (!session) return null;
        return session.token ?? session.accessToken ?? session.access_token ?? null;
    }

    private isSuccessResponse(response: any): boolean {
        if (typeof response?.ok === 'boolean') return response.ok;
        return !!this.extractToken(this.extractSessionFromLoginResponse(response));
    }

    private getPermissionOptions(): Array<{ path?: string | null; isVisibleNavegacion?: boolean | null; acciones?: Array<{ nombre?: string | null }> }> {
        const permisos = this.getSession()?.permisos;
        if (!Array.isArray(permisos)) return [];

        return permisos.flatMap((modulo: any) =>
            Array.isArray(modulo?.opciones) ? modulo.opciones : []
        );
    }

    private normalizePath(value: string | null | undefined): string {
        const normalized = `${value ?? ''}`.trim().toLowerCase().replace(/\/+$/, '');
        if (!normalized) return '';
        return normalized.startsWith('/') ? normalized : `/${normalized}`;
    }

    private normalizeAction(value: string | null | undefined): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toUpperCase();
    }
}
