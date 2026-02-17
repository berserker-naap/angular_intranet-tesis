import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../pages/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const token = this.authService.getToken();

    if (token && !this.authService.isTokenExpired()) {
      this.router.navigate(['/']);
      return of(false);
    }

    if (token && this.authService.isTokenExpired()) {
      this.authService.logout();
    }

    return of(true);
  }
}
