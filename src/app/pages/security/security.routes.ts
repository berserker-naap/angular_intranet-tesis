// src/app/pages/security/security.routes.ts
import { Routes } from '@angular/router';

export const SECURITY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then(m => m.UsersComponent),
      }
    ]
  }
];

export default SECURITY_ROUTES;
