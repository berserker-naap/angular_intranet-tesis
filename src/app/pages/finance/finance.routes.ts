import { Routes } from '@angular/router';
import { HasAccessGuard } from '../../shared/guard/has-access.guard';

export const FINANCE_ROUTES: Routes = [
    {
        path: '',
        children: [
            {
                path: 'resumen',
                loadComponent: () =>
                    import('./pages/resumen/resumen.component').then((m) => m.FinanceResumenComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/finance/resumen']
                }
            },
            {
                path: 'catalogos',
                loadComponent: () =>
                    import('./pages/catalogos/catalogos.component').then((m) => m.FinanceCatalogosComponent),
                canActivate: [HasAccessGuard],
                data: {
                    paths: ['/finance/catalogos']
                }
            },
            {
                path: '',
                redirectTo: 'resumen',
                pathMatch: 'full'
            }
        ]
    }
];

export default FINANCE_ROUTES;
