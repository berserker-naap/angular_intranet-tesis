import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../pages/auth/services/auth.service';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    constructor(private readonly authService: AuthService) {}

    ngOnInit() {
        this.model = this.removeEmptyGroups([
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Seguridad',
                items: [
                    this.buildProtectedItem('Usuarios', 'pi pi-fw pi-users', ['/security/usuarios'], ['/security/usuarios', '/security/usuario']),
                    this.buildProtectedItem('Roles', 'pi pi-fw pi-id-card', ['/security/roles'], ['/security/roles', '/security/rol']),
                    this.buildProtectedItem('Permisos', 'pi pi-fw pi-shield', ['/security/permisos'], ['/security/permisos', '/security/permiso']),
                    this.buildProtectedItem('Modulos', 'pi pi-fw pi-box', ['/security/modulos'], ['/security/modulos', '/security/modulo']),
                    this.buildProtectedItem('Opciones', 'pi pi-fw pi-list', ['/security/opciones'], ['/security/opciones', '/security/opcion']),
                    this.buildProtectedItem('Acciones', 'pi pi-fw pi-bolt', ['/security/acciones'], ['/security/acciones', '/security/accion']),
                    this.buildProtectedItem('Multitabla', 'pi pi-fw pi-table', ['/security/multitabla'], ['/security/multitabla']),
                    this.buildProtectedItem('Reportes', 'pi pi-fw pi-chart-bar', ['/security/reportes'], ['/security/reportes'])
                ]
            },
            {
                label: 'Comunicaciones',
                items: [this.buildProtectedItem('Campanas', 'pi pi-fw pi-megaphone', ['/security/campanas'], ['/security/campanas'])]
            },
            {
                label: 'Finanzas',
                items: [
                    this.buildProtectedItem('Resumen', 'pi pi-fw pi-chart-line', ['/finance/resumen'], ['/finance/resumen']),
                    this.buildProtectedItem('Catalogos', 'pi pi-fw pi-wallet', ['/finance/catalogos'], ['/finance/catalogos'])
                ]
            }
        ]);
    }

    private buildProtectedItem(label: string, icon: string, routerLink: string[], paths: string[]): MenuItem {
        return {
            label,
            icon,
            routerLink,
            visible: this.authService.hasAnyVisibleNavigationAccess(paths)
        };
    }

    private removeEmptyGroups(items: MenuItem[]): MenuItem[] {
        return items
            .map((item) => ({
                ...item,
                items: item.items ? this.removeEmptyGroups(item.items) : item.items
            }))
            .filter((item) => item.visible !== false)
            .filter((item) => !item.items || item.items.length > 0);
    }
}
