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
import { NotificationToastService } from '../../../../shared/services/notification-toast.service';
import { StatusResponse } from '../../../../shared/interface/status-response.interface';
import { InputSwitchModule } from 'primeng/inputswitch';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { Observable } from 'rxjs';
import { MultitablaService } from '../../services/multitabla.service';
import { Multitabla, MultitablaItem } from './interfaces/multitabla.interface';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

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
    styleUrls: ['./multitabla.component.scss']
})
export class MultitablaComponent implements OnInit {
    multitablaDialog: boolean = false;
    multitablas = signal<Multitabla[]>([]);
    multitabla!: Multitabla;
    selectedMultitablas!: Multitabla[] | null;
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;

    form!: FormGroup;
    items!: FormArray;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean

    constructor(
        private multitablaService: MultitablaService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
        private notificationToastService: NotificationToastService
    ) {
        this.loading$ = this.multitablaService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();
    }

    loadData() {
        this.multitablaService.findAll().subscribe({
            next: (res: StatusResponse<Multitabla[]>) => {
                if (res.ok && res.data) {
                    this.multitablas.set(res.data);
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

    buildForm(multitabla: Multitabla = {} as Multitabla) {
        this.items = this.fb.array([]);
        if (Array.isArray(multitabla.items)) {
            for (const item of multitabla.items as MultitablaItem[]) {
                this.items.push(this.fb.group({
                    id: [item.id],
                    nombre: [item.nombre, Validators.required],
                    valor: [item.valor ?? null],
                    valor2: [item.valor2 ?? null]
                }));
            }
        }
        this.form = this.fb.group({
            nombre: [multitabla.nombre, Validators.required],
            valor: [multitabla.valor ?? null],
            valor2: [multitabla.valor2 ?? null],
            items: this.items
        });
    }
    get itemsArray(): FormArray {
        return this.form.get('items') as FormArray;
    }
    openNew() {
        this.multitabla = {} as Multitabla;
        this.submitted = false;
        this.buildForm();
        this.multitablaDialog = true;
    }

    openEdit(multitabla: Multitabla) {
        this.submitted = false;

        this.multitabla = { ...multitabla } as Multitabla;
        this.multitablaService.findOne(multitabla.id!).subscribe({
            next: (response) => {
                if (response.ok && response.data) {
                    this.buildForm({ id: multitabla.id!, ...response.data } as Multitabla);
                    this.multitablaDialog = true;
                } else {
                    this.notificationToastService.error('No se encontró el registro');
                }
            },
            error: (err) => {
                this.notificationToastService.error('Error al obtener los datos');
            }
        });
    }


    hideDialog() {
        this.multitabla = {} as Multitabla;
        this.form.reset();
        this.itemsArray.clear();
        this.multitablaDialog = false;
        this.submitted = false;
    }

    saveUpdateMultitabla() {
        this.submitted = true;

        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.multitabla.id) {
            // Si el id existe, es una actualización. De lo contrario, es una creación.
            // UPDATE
            this.multitablaService.update(this.multitabla.id, data).subscribe({
                next: (response: StatusResponse<any>) => {
                    if (response.ok && response.data) {
                        this.multitablas.set(
                            this.multitablas().map(op => op.id === response.data.id ? response.data! : op)
                        );
                        this.notificationToastService.success(`Multitabla "${data.nombre}" actualizada correctamente`);
                    } else {
                        this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                    }
                },
                error: (err) => {
                    this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        } else {
            // CREATE
            this.multitablaService.create(data).subscribe({
                next: (response: StatusResponse<any>) => {
                    if (response.ok && response.data) {
                        this.multitablas.set([...this.multitablas(), response.data]);
                        this.notificationToastService.success(`Multitabla "${response.data.nombre}" creada correctamente`);
                    } else {
                        this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                    }
                },
                error: (err) => {
                    this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }
        this.multitablaDialog = false;
    }

    deleteSelectedMultitablas() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de eliminar las multitablas seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedMultitablas?.map(multitabla => multitabla.id!) || [];
                this.multitablaService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {
                            this.multitablas.set(
                                this.multitablas().filter((val) => !idsToDelete.includes(val.id!))
                            );
                            this.notificationToastService.success('Multitablas eliminadas correctamente');
                            this.selectedMultitablas = null;
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

   deleteMultitabla(multitabla: Multitabla) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la multitabla "${multitabla.nombre}"?`,
            header: 'Confirmación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.multitablaService.delete(multitabla.id!).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {
                            this.multitablas.set(
                                this.multitablas().filter((val) => val.id !== multitabla.id)
                            );
                            this.notificationToastService.success('Multitabla eliminada correctamente');
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



    agregarItem() {
        this.itemsArray.push(
            this.fb.group({
                id: [undefined],
                nombre: ['', Validators.required],
                valor: [''],
                valor2: ['']
            })
        );
    }

    eliminarItem(index: number) {
        this.itemsArray.removeAt(index);
    }

    exportExcel() {
        const exportData = this.multitablas().map(multitabla => ({
            Nombre: multitabla.nombre,
            Valor: multitabla.valor,
            'Valor 2': multitabla.valor2
        }));
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
        const workbook: XLSX.WorkBook = { Sheets: { 'Multitabla': worksheet }, SheetNames: ['Multitabla'] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, 'multitabla');
    }

    saveAsExcelFile(buffer: any, fileName: string): void {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
    }


}
