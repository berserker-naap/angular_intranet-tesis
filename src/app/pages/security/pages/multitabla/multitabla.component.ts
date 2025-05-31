import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { Observable } from 'rxjs';
import { MultitablaService } from '../../services/multitabla.service';
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
    selector: 'app-multitabla',
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
    templateUrl: './multitabla.component.html',
    styleUrls: ['./multitabla.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class MultitablaComponent implements OnInit {
    multitablaDialog: boolean = false;
    multitablas = signal<any[]>([]);
    multitabla!: any;
    selectedMultitablas!: any[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    form!: FormGroup;
    items!: FormArray;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    constructor(
        private multitablaService: MultitablaService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
        this.loading$ = this.multitablaService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();

    }

    buildForm(multitabla: any = {}) {
        this.items = this.fb.array([]);

        if (Array.isArray(multitabla.items)) {
            for (const item of multitabla.items) {
                this.items.push(this.fb.group({
                    id: [item.id || null], // ahora sí se puede editar un item existente
                    nombre: [item.nombre || '', Validators.required],
                    valor: [item.valor || ''],
                    valor2: [item.valor2 || '']
                }));
            }
        }

        this.form = this.fb.group({
            id: [multitabla.id || null],
            nombre: [multitabla.nombre || '', Validators.required],
            valor: [multitabla.valor || ''],
            valor2: [multitabla.valor2 || ''],
            items: this.items
        });
    }


    loadData() {
        this.multitablaService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.multitablas.set(res.data);
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
        this.multitabla = {};
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.multitablaDialog = true;
    }

    openEdit(multitabla: any) {
        this.multitabla = { ...multitabla };
        this.findOne(this.multitabla.id); // Cargar los datos de la multitabla seleccionada
        this.multitablaDialog = true;
    }

    findOne(id: number) {
        this.multitablaService.findOne(id).subscribe({
            next: (response) => {
                if (response.ok && response.data) {
                    this.buildForm({ id, ...response.data }); // data ya tiene nombre, valor, valor2, items
                    this.multitablaDialog = true;
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se encontró el registro',
                    });
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al obtener los datos',
                });
            }
        });
    }



    deleteSelectedMultitablas() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las multitablas seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedMultitablas?.map(multitabla => multitabla.id) || [];
                this.multitablaService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok && response.data) {
                            console.log(response);
                            this.multitablas.set(this.multitablas().filter((val) => !this.selectedMultitablas?.includes(val)));
                            this.selectedMultitablas = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Multitablas Deleted',
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

    get itemsArray(): FormArray {
        return this.form.get('items') as FormArray;
    }

    agregarItem() {
        this.itemsArray.push(
            this.fb.group({
                id: [null], // nuevo item, sin id
                nombre: ['', Validators.required],
                valor: [''],
                valor2: ['']
            })
        );
    }


    eliminarItem(index: number) {
        this.itemsArray.removeAt(index);
    }

    hideDialog() {
        this.form.reset();
        this.itemsArray.clear();
        this.multitablaDialog = false;
        this.submitted = false;
    }

    saveUpdateMultitabla() {
        this.submitted = true;
        if (this.form.invalid) return;

        const dto = { ...this.form.value };

        if (dto.id) {
            // UPDATE
            this.multitablaService.update(dto.id, dto).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.multitablas.set(
                            this.multitablas().map(op => op.id === dto.id ? res.data : op)
                        );
                        this.successToast(`Multitabla "${res.data.nombre}" actualizada correctamente`);
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        } else {
            // CREATE
            delete dto.id;

            this.multitablaService.create(dto).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.multitablas.set([...this.multitablas(), res.data]);
                        this.successToast(`Multitabla "${res.data.nombre}" creada correctamente`);
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }

        this.multitablaDialog = false;
    }




    deleteMultitabla(multitabla: any) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la multitabla "${multitabla.nombre}"?`,
            header: 'Confirmación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.multitablaService.delete(multitabla.id).subscribe({
                    next: (res: StatusResponse<null>) => {
                        if (res.ok) {
                            this.multitablas.set(
                                this.multitablas().filter((val) => val.id !== multitabla.id)
                            );
                            this.multitabla = {};
                            this.successToast('Multitabla eliminada correctamente');
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
