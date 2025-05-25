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
    ],
    templateUrl: './modulos.component.html',
    styleUrls: ['./modulos.component.scss'],
    providers: [MessageService, ModulosService, ConfirmationService]
})
export class ModulosComponent implements OnInit {
    moduloDialog: boolean = false;
    modulos = signal<any[]>([]);
    modulo!: any;
    selectedOpciones!: any[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    form!: FormGroup;
    constructor(
        private modulosService: ModulosService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) { }

    ngOnInit() {
        this.loadData();
        this.buildForm();

    }


    buildForm(modulo: any = {}) {
        this.form = this.fb.group({
            nombre: [modulo.nombre || '', Validators.required],
            path: [modulo.path || '', Validators.required],
            isVisibleNavegacion: [modulo.isVisibleNavegacion ?? false] // default false
        });
    }


    loadData() {
        this.modulosService.findAll().subscribe({
            next: (response: StatusResponse<any>) => {
                console.log(response);
                if (response.ok && response.data) {
                    this.modulos.set(response.data);
                } else {
                    console.warn(this.utils.normalizeMessages(response.message));
                }
            },
            error: (err) => {
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


    deleteSelectedOpciones() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected modulos?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedOpciones?.map(modulo => modulo.id) || [];
                this.modulosService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok && response.data) {
                            this.modulos.set(response.data);
                            this.modulos.set(this.modulos().filter((val) => !this.selectedOpciones?.includes(val)));
                            this.selectedOpciones = null;
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

    deleteOpcion(modulo: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + modulo.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.modulos.set(this.modulos().filter((val) => val.id !== modulo.id));
                this.modulo = {};
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
        return this.modulos().findIndex(p => p.id === id);
    }

    saveOpcion() {
        this.submitted = true;

        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.modulo.id) {
            const updated = { ...this.modulo, ...data };
            this.modulos.set(
                this.modulos().map(op => op.id === this.modulo.id ? updated : op)
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
                image: 'modulo-placeholder.svg'
            };
            this.modulos.set([...this.modulos(), newOpcion]);
            this.messageService.add({
                severity: 'success',
                summary: 'Creado',
                detail: 'Opción creada correctamente',
                life: 3000
            });
        }

        this.moduloDialog = false;
    }

}
