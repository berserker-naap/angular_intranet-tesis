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
import { OpcionesService } from '../../services/opciones.service';
import { ModulosService } from '../../services/modulos.service';
import { DropdownModule } from 'primeng/dropdown';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { Observable } from 'rxjs';
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
    selector: 'app-opciones',
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
        DropdownModule,
        LoadingOverlayComponent
    ],
    templateUrl: './opciones.component.html',
    styleUrls: ['./opciones.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class OpcionesComponent implements OnInit {
    opcionDialog: boolean = false;
    opciones = signal<any[]>([]);
    modulos: any[] = [];
    opcion!: any;
    selectedOpciones!: any[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>( observer => observer.next(false)); // Observable boolean
    constructor(
        private modulosService: ModulosService,
        private opcionesService: OpcionesService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
         this.loading$ = this.opcionesService.loading$; // Observable boolean
     }

    ngOnInit() {
        this.loadData();
        this.getModulos(); // 👈 IMPORTANTE: cargar los módulos disponibles
        this.buildForm();

    }

    buildForm(opcion: any = {}) {
        this.form = this.fb.group({
            idModulo: [opcion.modulo?.id ?? null, Validators.required], // 👈 clave
            nombre: [opcion.nombre || '', Validators.required],
            path: [opcion.path || '', Validators.required],
            isVisibleNavegacion: [opcion.isVisibleNavegacion ?? false] // default false
        });
    }

    getModulos() {
        this.modulosService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.modulos = res.data;
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

    loadData() {
        this.modulos = [];
        this.opcionesService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.opciones.set(res.data);
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

        // this.cols = [
        //     { field: 'Nombre', header: 'Name' },
        //     { field: 'image', header: 'Image' },
        //     { field: 'price', header: 'Price' },
        //     { field: 'category', header: 'Category' }
        // ];

        // this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    exportCSV() {
        // this.dt.exportCSV();
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.opcion = {};
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.opcionDialog = true;
    }

    openEdit(opcion: any) {
        this.opcion = { ...opcion };
        this.buildForm(this.opcion); // <- Aquí
        this.opcionDialog = true;
    }


    deleteSelectedOpciones() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las opciones seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedOpciones?.map(opcion => opcion.id) || [];
                this.opcionesService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok && response.data) {
                            console.log(response);
                            this.opciones.set(this.opciones().filter((val) => !this.selectedOpciones?.includes(val)));
                            this.selectedOpciones = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Opciones Deleted',
                                life: 3000
                            });
                        } else {
                            console.warn(this.utils.normalizeMessages(response.message));
                        }
                    },
                    error: (err) => {
                        console.warn(this.utils.normalizeMessages(err?.error?.message));
                    }
                });


            }
        });
    }

    hideDialog() {
        this.opcionDialog = false;
        this.submitted = false;
    }

    deleteOpcion(opcion: any) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta opcion ' + opcion.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.opcionesService.delete(opcion.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok && res.data) {
                            this.opciones.set(this.opciones().filter((val) => val.id !== opcion.id));
                            this.opcion = {};
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Opciones Deleted',
                                life: 3000
                            });
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
        });
    }

    saveUpdateOpcion() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.opcion.id) {
            const updated = { ...this.opcion, ...data };

            this.opcionesService.update(updated.id,
                {
                    idModulo: updated.idModulo,
                    nombre: updated.nombre,
                    path: updated.path,
                    isVisibleNavegacion: updated.isVisibleNavegacion
                }
            ).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.opciones.set(
                            this.opciones().map(op => op.id === res.data.id ? res.data : op)
                        );
                        this.successToast('Opción actualizada correctamente');
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });

        } else {
            const newOpcion = { ...data };

            this.opcionesService.create(newOpcion).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                       this.opciones.set([...this.opciones(), res.data]);
                        this.successToast('Opción creada correctamente');
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

        this.opcionDialog = false;
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
