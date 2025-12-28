import { Injectable } from "@angular/core";
import { CanActivate, CanActivateChild, Router } from "@angular/router";
import { catchError, Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { AuthService } from "../../pages/auth/services/auth.service";

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild  {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.validate();
  }

  canActivateChild(): Observable<boolean> {
    return this.validate();
  }

  private validate(): Observable<boolean> {
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/auth/login']);
      return of(false);
    }

    if (this.authService.isTokenExpired()) {
      // Token expirado, intenta refrescar
      return this.authService.checkStatusAndRefresh().pipe(
        switchMap((isValid) => {
          if (isValid) {
            return of(true); // Token renovado correctamente
          } else {
            this.authService.removeToken();
            this.router.navigate(['/auth/login']);
            return of(false); // No se pudo renovar
          }
        }),
        catchError(() => {
            this.authService.removeToken();
            this.router.navigate(['/auth/login']);
            return of(false);
        })
      );
    }

    // Token válido
    return of(true);
  }
}

