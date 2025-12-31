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
    providers: [MessageService, ConfirmationService]
})
export class AccionesComponent implements OnInit {
    accionDialog: boolean = false;
    acciones = signal<any[]>([]);
    accion!: any;
    selectedAcciones!: any[] | null;
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    constructor(
        private accionesService: AccionesService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
        this.loading$ = this.accionesService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();
    }


    buildForm(accion: any = {}) {
        this.form = this.fb.group({
            nombre: [accion.nombre || '', Validators.required],
        });
    }


    loadData() {
        this.accionesService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.acciones.set(res.data);
                } else {
                    this.errorToast(this.utils.normalizeMessages(res.message));
                }
            },
            error: (err) => {
                this.errorToast(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }


    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.accion = {};
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.accionDialog = true;
    }

    openEdit(accion: any) {
        this.accion = { ...accion };
        this.buildForm(this.accion); // <- Aquí
        this.accionDialog = true;
    }



    hideDialog() {
        this.accionDialog = false;
        this.submitted = false;
    }


    deleteSelectedAcciones() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las acciones seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedAcciones?.map(accion => accion.id) || [];
                this.accionesService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {
                            console.log(response);
                            this.acciones.set(this.acciones().filter((val) => !idsToDelete.includes(val.id)));
                            this.selectedAcciones = null;
                            this.successToast('Acciones eliminadas correctamente');
                        } else {
                            this.errorToast(this.utils.normalizeMessages(response.message));
                        }
                    },
                    error: (err) => {
                        this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                    }
                });


            }
        });
    }

    deleteAccion(accion: any) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta accion ' + accion.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.accionesService.delete(accion.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok) {
                            this.acciones.set(this.acciones().filter((val) => val.id !== accion.id));
                            this.accion = {};
                            this.successToast('Acción Eliminada');
                        } else {
                            this.errorToast(this.utils.normalizeMessages(res.message));
                        }
                    },
                    error: (err) => {
                        this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                    }
                });

            }
        });
    }

    saveUpdateAccion() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.accion.id) {
            const updated = { ...this.accion, ...data };

            this.accionesService.update(updated.id, { nombre: updated.nombre }).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.acciones.set(
                            this.acciones().map(op => op.id === this.accion.id ? updated : op)
                        );
                        this.successToast('Acción actualizada correctamente');
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });

        } else {
            const newAccion = { ...data };

            this.accionesService.create(newAccion).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.acciones.set([...this.acciones(), res.data]);
                        this.successToast('Acción creada correctamente');
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                        console.warn(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                    console.warn(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }

        this.accionDialog = false;
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
