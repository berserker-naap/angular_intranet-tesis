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
    selector: 'app-multitablas',
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
    templateUrl: './multitablas.component.html',
    styleUrls: ['./multitablas.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class MultitablasComponent implements OnInit {
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
        this.form = this.fb.group({
            nombre: [multitabla.nombre || '', Validators.required],
            icono: [multitabla.icono || '', Validators.required]
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
        this.buildForm(this.multitabla); // <- Aquí
        this.multitablaDialog = true;
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

    hideDialog() {
        this.multitablaDialog = false;
        this.submitted = false;
    }

    deleteMultitabla(multitabla: any) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta multitabla ' + multitabla.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.multitablaService.delete(multitabla.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok && res.data) {
                            this.multitablas.set(this.multitablas().filter((val) => val.id !== multitabla.id));
                            this.multitabla = {};
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Multitablas Deleted',
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

    saveUpdateMultitabla() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.multitabla.id) {
            const updated = { ...this.multitabla, ...data };

            this.multitablaService.update(updated.id, { nombre: updated.nombre, icono: updated.icono }).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.multitablas.set(
                            this.multitablas().map(op => op.id === this.multitabla.id ? updated : op)
                        );
                        this.successToast('Multitabla actualizada correctamente');
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });

        } else {
            const newMultitabla = { ...data };

            this.multitablaService.create(newMultitabla).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.multitablas.set([...this.multitablas(), res.data]);
                        this.successToast('Multitabla creada correctamente');
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

        this.multitablaDialog = false;
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
