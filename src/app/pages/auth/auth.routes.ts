import { NoAuthGuard } from '../../shared/guard/no-auth.guard';
import { Logout } from './pages/logout';
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [NoAuthGuard], // ⬅️ aquí lo aplicas
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'logout',
    loadComponent: () => import('./pages/logout').then(m => m.Logout)
  },
  {
    path: 'access',
    loadComponent: () => import('./pages/access').then(m => m.Access)
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/error').then(m => m.Error)
  }
];
