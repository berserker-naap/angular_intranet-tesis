import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from './app.routes';
import { AuthService } from './app/pages/auth/services/auth.service';
import { AuthInterceptor } from './app/shared/interceptor/auth-iterceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withEnabledBlockingInitialNavigation()
    ),

    // HttpClient + Interceptors
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AuthService],
      useFactory: (authService: AuthService) => () =>
        firstValueFrom(authService.validateSessionOnAppStart())
    },

    // Animations & PrimeNG
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.app-dark' }
      }
    }),

    // PrimeNG Services
    MessageService,
    ConfirmationService
  ]
};
