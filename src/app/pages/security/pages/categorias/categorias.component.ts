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
import { Observable } from 'rxjs';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { CategoriasService } from '../../services/categorias.service';
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
    selector: 'app-categorias',
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
    templateUrl: './categorias.component.html',
    styleUrls: ['./categorias.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class CategoriasComponent implements OnInit {
    categoriaDialog: boolean = false;
    categorias = signal<any[]>([]);
    categoria!: any;
    selectedCategorias!: any[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>( observer => observer.next(false)); // Observable boolean
    constructor(
        private categoriasService: CategoriasService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
         this.loading$ = this.categoriasService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();
    }


    buildForm(categoria: any = {}) {
        this.form = this.fb.group({
            nombre: [categoria.nombre || '', Validators.required],
        });
    }


    loadData() {
        this.categoriasService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.categorias.set(res.data);
                } else {
                    this.errorToast(this.utils.normalizeMessages(res.message));
                        console.warn(this.utils.normalizeMessages(res.message));   }
            },
            error: (err) => {
                  this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                    console.warn(this.utils.normalizeMessages(err?.error?.message)); }
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
        this.categoria = {};
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.categoriaDialog = true;
    }

    openEdit(categoria: any) {
        this.categoria = { ...categoria };
        this.buildForm(this.categoria); // <- Aquí
        this.categoriaDialog = true;
    }


    deleteSelectedCategorias() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las categorias seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedCategorias?.map(categoria => categoria.id) || [];
                this.categoriasService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok && response.data) {
                            console.log(response);
                            this.categorias.set(this.categorias().filter((val) => !this.selectedCategorias?.includes(val)));
                            this.selectedCategorias = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Categorias Deleted',
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
        this.categoriaDialog = false;
        this.submitted = false;
    }

    deleteCategoria(categoria: any) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta categoria ' + categoria.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.categoriasService.delete(categoria.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok && res.data) {
                            this.categorias.set(this.categorias().filter((val) => val.id !== categoria.id));
                            this.categoria = {};
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Categorias Deleted',
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

    saveUpdateCategoria() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.categoria.id) {
            const updated = { ...this.categoria, ...data };

            this.categoriasService.update(updated.id, {nombre: updated.nombre}).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.categorias.set(
                            this.categorias().map(op => op.id === this.categoria.id ? updated : op)
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
            const newCategoria = { ...data };

            this.categoriasService.create(newCategoria).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.categorias.set([...this.categorias(), res.data]);
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

        this.categoriaDialog = false;
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
