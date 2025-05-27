import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { UtilsService } from '../../../../shared/services/utils.service';
import { StatusResponse } from '../../../../shared/interface/status-response.interface';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ModulosService } from '../../services/modulos.service';
import { DropdownModule } from 'primeng/dropdown';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { Observable } from 'rxjs';
import { PermisoModulo } from '../../../../shared/interface/general';
import { PermisoService } from '../../services/permiso.service';
import { RolesService } from '../../services/roles.service';
import { CheckboxModule } from 'primeng/checkbox';
interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-permisos',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        CheckboxModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        ReactiveFormsModule,
        InputSwitchModule,
        DropdownModule,
        LoadingOverlayComponent
    ],
    templateUrl: './permisos.component.html',
    styleUrls: ['./permisos.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class PermisosComponent implements OnInit {

    roles: any[] = [];
    rolSeleccionado: number | null = null;
    permisos: PermisoModulo[] = [];
    cambios: { idRol: number; idOpcion: number; idAccion: number; asignado: boolean }[] = [];
    loadingRoles$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean

    constructor(
        private rolesService: RolesService,
        private permisoService: PermisoService,
        private utilsService: UtilsService,
        private messageService: MessageService,) {
        this.loadingRoles$ = this.rolesService.loading$; // Observable boolean
        this.loading$ = this.permisoService.loading$; // Observable boolean
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData() {
        this.rolesService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) {
                    this.roles = res.data;
                } else {
                    this.errorToast(this.utilsService.normalizeMessages(res.message));
                    console.warn(this.utilsService.normalizeMessages(res.message));
                }
            },
            error: (err) => {
                this.errorToast(this.utilsService.normalizeMessages(err?.error?.message));
                console.warn(this.utilsService.normalizeMessages(err?.error?.message));
            }
        });
    }

    cargarPermisos() {
        if (!this.rolSeleccionado) return;

        this.permisoService.getPermisosPorRol(this.rolSeleccionado).subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) {
                    this.permisos = res.data;
                    this.cambios = [];
                } else {
                    this.errorToast(this.utilsService.normalizeMessages(res.message));
                    console.warn(this.utilsService.normalizeMessages(res.message));
                }
            },
            error: (err) => {
                this.errorToast(this.utilsService.normalizeMessages(err?.error?.message));
                console.warn(this.utilsService.normalizeMessages(err?.error?.message));
            }
        });
    }

    togglePermiso(opcionId: number, accionId: number, asignado: boolean) {
        const payload = [{
            idRol: this.rolSeleccionado!,
            idOpcion: opcionId,
            idAccion: accionId,
            asignado
        }];

        this.permisoService.actualizarPermisos(payload).subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok) {
                      console.log('Permiso actualizado correctamente');
                    this.successToast('Permiso actualizado correctamente');
                } else {
                       console.log('Permiso no actualizado:', res.message);
                    this.errorToast(this.utilsService.normalizeMessages(res.message));
                    this.revertirPermiso(opcionId, accionId);
                }
            },
            error: (err) => {
                this.errorToast(this.utilsService.normalizeMessages(err?.error?.message));
                this.revertirPermiso(opcionId, accionId);
            }
        });
    }

    revertirPermiso(opcionId: number, accionId: number) {
        const modulo = this.permisos.find(m =>
            m.opciones.some(o => o.id === opcionId)
        );

        const opcion = modulo?.opciones.find(o => o.id === opcionId);
        const accion = opcion?.acciones.find(a => a.id === accionId);

        if (accion) {
            accion.asignado = !accion.asignado;
        }
    }

    private successToast(message: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: message,
            life: 3000
        });
    }

    private errorToast(message: string | string[]) {
        const detail = Array.isArray(message) ? message.join('\n') : message;
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail,
            life: 5000
        });
    }
}
