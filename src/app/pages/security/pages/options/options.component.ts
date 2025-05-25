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
import { OpcionsService } from '../../services/options.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { StatusResponse } from '../../../../shared/interface/status-response.interface';
import { InputSwitchModule } from 'primeng/inputswitch';
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
    selector: 'app-options',
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
    ],
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss'],
    providers: [MessageService, OpcionsService, ConfirmationService]
})
export class OptionsComponent implements OnInit {
    opcionDialog: boolean = false;
    opciones = signal<any[]>([]);
    opcion!: any;
    selectedOpciones!: any[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    form!: FormGroup;
    constructor(
        private optionsService: OpcionsService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) { }

    ngOnInit() {
        this.loadData();
        this.buildForm();

    }


    buildForm(opcion: any = {}) {
        this.form = this.fb.group({
            nombre: [opcion.nombre || '', Validators.required],
            path: [opcion.path || '', Validators.required],
            isVisibleNavegacion: [opcion.isVisibleNavegacion ?? false] // default false
        });
    }


    loadData() {
        this.optionsService.findAll().subscribe({
            next: (response: StatusResponse<any>) => {
                console.log(response);
                if (response.ok && response.data) {
                    this.opciones.set(response.data);
                } else {
                    console.warn(this.utils.normalizeMessages(response.message));
                }
            },
            error: (err) => {
                console.warn(this.utils.normalizeMessages(err?.error?.message));
            }
        });

        this.cols = [
            { field: 'Nombre', header: 'Name' },
            { field: 'image', header: 'Image' },
            { field: 'price', header: 'Price' },
            { field: 'category', header: 'Category' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
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
            message: 'Are you sure you want to delete the selected opciones?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedOpciones?.map(opcion => opcion.id) || [];
                this.optionsService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok && response.data) {
                            this.opciones.set(response.data);
                            this.opciones.set(this.opciones().filter((val) => !this.selectedOpciones?.includes(val)));
                            this.selectedOpciones = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Opcions Deleted',
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
            message: 'Are you sure you want to delete ' + opcion.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.opciones.set(this.opciones().filter((val) => val.id !== opcion.id));
                this.opcion = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Opcion Deleted',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        return this.opciones().findIndex(p => p.id === id);
    }

    saveOpcion() {
        this.submitted = true;

        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.opcion.id) {
            const updated = { ...this.opcion, ...data };
            this.opciones.set(
                this.opciones().map(op => op.id === this.opcion.id ? updated : op)
            );
            this.messageService.add({
                severity: 'success',
                summary: 'Actualizado',
                detail: 'Opción actualizada correctamente',
                life: 3000
            });
        } else {
            const newOpcion = {
                ...data,
                id: Date.now(), // solo para demo
                image: 'opcion-placeholder.svg'
            };
            this.opciones.set([...this.opciones(), newOpcion]);
            this.messageService.add({
                severity: 'success',
                summary: 'Creado',
                detail: 'Opción creada correctamente',
                life: 3000
            });
        }

        this.opcionDialog = false;
    }

}
