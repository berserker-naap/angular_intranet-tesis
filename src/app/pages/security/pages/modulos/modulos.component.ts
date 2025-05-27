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
import { ModulosService } from '../../services/modulos.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { StatusResponse } from '../../../../shared/interface/status-response.interface';
import { InputSwitchModule } from 'primeng/inputswitch';
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
    selector: 'app-modulos',
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
    templateUrl: './modulos.component.html',
    styleUrls: ['./modulos.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class ModulosComponent implements OnInit {
    moduloDialog: boolean = false;
    modulos = signal<any[]>([]);
    modulo!: any;
    selectedModulos!: any[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    constructor(
        private modulosService: ModulosService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
        this.loading$ = this.modulosService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();

    }

    buildForm(modulo: any = {}) {
        this.form = this.fb.group({
            nombre: [modulo.nombre || '', Validators.required],
            icono: [modulo.icono || '', Validators.required]
        });
    }

    loadData() {
        this.modulosService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.modulos.set(res.data);
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
        this.modulo = {};
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.moduloDialog = true;
    }

    openEdit(modulo: any) {
        this.modulo = { ...modulo };
        this.buildForm(this.modulo); // <- Aquí
        this.moduloDialog = true;
    }


    deleteSelectedModulos() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las modulos seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedModulos?.map(modulo => modulo.id) || [];
                this.modulosService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok && response.data) {
                            console.log(response);
                            this.modulos.set(this.modulos().filter((val) => !this.selectedModulos?.includes(val)));
                            this.selectedModulos = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Modulos Deleted',
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
        this.moduloDialog = false;
        this.submitted = false;
    }

    deleteModulo(modulo: any) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta modulo ' + modulo.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.modulosService.delete(modulo.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok && res.data) {
                            this.modulos.set(this.modulos().filter((val) => val.id !== modulo.id));
                            this.modulo = {};
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Modulos Deleted',
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

    saveUpdateModulo() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.modulo.id) {
            const updated = { ...this.modulo, ...data };

            this.modulosService.update(updated.id, { nombre: updated.nombre, icono: updated.icono }).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.modulos.set(
                            this.modulos().map(op => op.id === this.modulo.id ? updated : op)
                        );
                        this.successToast('Modulo actualizada correctamente');
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });

        } else {
            const newModulo = { ...data };

            this.modulosService.create(newModulo).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.modulos.set([...this.modulos(), res.data]);
                        this.successToast('Modulo creada correctamente');
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

        this.moduloDialog = false;
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
