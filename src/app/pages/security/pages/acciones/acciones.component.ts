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
import { AccionesService } from '../../services/acciones.service';
import { Observable } from 'rxjs';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { NotificationToastService } from '../../../../shared/services/notification-toast.service';
import { Accion } from './interface/accion.interface';


@Component({
    selector: 'app-acciones',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
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
        LoadingOverlayComponent
    ],
    templateUrl: './acciones.component.html',
    styleUrls: ['./acciones.component.scss'],
})
export class AccionesComponent implements OnInit {
    accionDialog: boolean = false;
    acciones = signal<Accion[]>([]);
    accion!: Accion;
    selectedAcciones!: Accion[] | null;
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    constructor(
        private accionesService: AccionesService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private notificationToastService: NotificationToastService,
        private fb: FormBuilder,
    ) {
        this.loading$ = this.accionesService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();
    }


    buildForm(accion: Accion = {} as Accion) {
        this.form = this.fb.group({
            nombre: [accion.nombre || null, Validators.required],
        });
    }


    loadData() {
        this.accionesService.findAll().subscribe({
            next: (res: StatusResponse<Accion[]>) => {
                if (res.ok && res.data) {
                    this.acciones.set(res.data);
                } else {
                    this.notificationToastService.error(this.utils.normalizeMessages(res.message));
                }
            },
            error: (err) => {
                this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.accion = {} as Accion;
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.accionDialog = true;
    }

    openEdit(accion: Accion) {
        this.accion = { ...accion };
        this.buildForm(this.accion); // <- Aquí
        this.accionDialog = true;
    }



    hideDialog() {
        this.accion = {} as Accion;
        this.form.reset();
        this.accionDialog = false;
        this.submitted = false;
    }

    saveUpdateAccion() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        //Si tengo algo en accion es que ando editando
        if (this.accion.id) {
            this.accionesService.update(this.accion.id!, data).subscribe({
                next: (response) => {
                    if (response.ok && response.data) {
                        this.acciones.set(
                            this.acciones().map(op => op.id === response.data.id ? response.data : op)
                        );
                        this.notificationToastService.success('Acción actualizada correctamente');
                        this.hideDialog();
                    } else {
                        this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                    }
                },
                error: (err) => {
                    this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                }
            });

        } else {
            this.accionesService.create(data).subscribe({
                next: (response) => {
                    if (response.ok && response.data) {
                        this.acciones.set([...this.acciones(), response.data]);
                        this.notificationToastService.success('Acción creada correctamente');
                        this.hideDialog();
                    } else {
                        this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                        console.warn(this.utils.normalizeMessages(response.message));
                    }
                },
                error: (err) => {
                    this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                    console.warn(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }
    }

    deleteSelectedAcciones() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las acciones seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedAcciones?.map(accion => accion.id!) || [];

                this.accionesService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {

                            this.acciones.set(this.acciones().filter((val) => !idsToDelete.includes(val.id!)));
                            this.notificationToastService.success('Acciones eliminadas correctamente');
                            this.selectedAcciones = null;
                            this.hideDialog();
                        } else {
                            this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                        }
                    },
                    error: (err) => {
                        this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                    }
                });


            }
        });
    }

    deleteAccion(accion: Accion) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta accion ' + accion.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.accionesService.delete(accion.id!).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {
                            this.acciones.set(this.acciones().filter((val) => val.id !== accion.id));
                            this.hideDialog();
                            this.notificationToastService.success('Acción Eliminada');
                        } else {
                            this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                        }
                    },
                    error: (err) => {
                        this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                    }
                });

            }
        });
    }

}
