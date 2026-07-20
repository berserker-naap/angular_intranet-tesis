import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../pages/auth/services/auth.service';

type AccessRouteData = {
    roles?: string[];
    paths?: string[];
};

@Injectable({ providedIn: 'root' })
export class HasAccessGuard implements CanActivate, CanActivateChild {
    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.validateAccess(route, state);
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.validateAccess(childRoute, state);
    }

    private validateAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const data = (route.data ?? {}) as AccessRouteData;
        const roleGranted = this.authService.hasAnyRole(data.roles ?? []);
        const pathGranted = this.authService.hasAnyPathAccess(data.paths ?? []);

        if (roleGranted && pathGranted) {
            return of(true);
        }

        this.router.navigate(['/auth/access'], {
            queryParams: { redirectTo: state.url }
        });
        return of(false);
    }
}
