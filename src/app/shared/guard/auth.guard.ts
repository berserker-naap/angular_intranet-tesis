import { Injectable } from "@angular/core";
import { CanActivate, CanActivateChild, Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { AuthService } from "../../pages/auth/services/auth.service";

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate,CanActivateChild  {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.validate();
  }

  canActivateChild(): Observable<boolean> {
    return this.validate();
  }

  private validate(): Observable<boolean> {
    if (!this.authService.getToken() || this.authService.isTokenExpired()) {
      this.router.navigate(['/auth/login']); // ✅ asegúrate de apuntar bien a tu ruta de login
      return of(false);
    }
    return of(true);
  }
}
