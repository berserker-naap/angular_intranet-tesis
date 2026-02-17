import { Injectable } from "@angular/core";
import { CanActivate, CanActivateChild, Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { AuthService } from "../../pages/auth/services/auth.service";

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
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
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      return of(false);
    }

    return of(true);
  }
}
