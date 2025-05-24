import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, switchMap, EMPTY } from "rxjs";
import { AuthService } from "../../pages/auth/services/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (!token) return next.handle(req);

    if (this.authService.isTokenExpired()) {
      return this.authService.checkStatusAndRefresh().pipe(
        switchMap((valid) => {
          if (valid) {
            const newToken = this.authService.getToken();
            const authReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next.handle(authReq);
          } else {
            this.router.navigate(['/login']);
            return EMPTY;
          }
        })
      );
    }

    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });

    return next.handle(authReq);
  }
}
