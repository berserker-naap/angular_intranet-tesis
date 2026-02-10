import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
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
import { Modulo } from './interfaces/modulo.interface';
import { NotificationToastService } from '../../../../shared/services/notification-toast.service';


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
})
export class ModulosComponent implements OnInit {
    moduloDialog: boolean = false;
    modulos = signal<Modulo[]>([]);
    modulo!: Modulo;
    selectedModulos!: Modulo[] | null;
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    constructor(
        private modulosService: ModulosService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private notificationToastService: NotificationToastService,
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
            nombre: [modulo.nombre ?? '', Validators.required],
            icono: [modulo.icono ?? '', Validators.required]
        });
    }

    loadData() {
        this.modulosService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) {
                    const modulosMapeados = res.data.map((item: any) => this.mapToModulo(item));
                    this.modulos.set(modulosMapeados);
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
        this.modulo = {} as Modulo;
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.moduloDialog = true;
    }

    openEdit(modulo: any) {
        this.modulo = { ...modulo } as Modulo;
        this.buildForm(this.modulo);
        this.moduloDialog = true;
    }



    hideDialog() {
        this.modulo = {} as Modulo;
        this.form.reset();
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
                        if (res.ok) {
                            this.modulos.set(this.modulos().filter((val) => val.id !== modulo.id));
                            this.hideDialog();
                            this.notificationToastService.success('Módulo Eliminado');
                        } else {
                            this.notificationToastService.error(this.utils.normalizeMessages(res.message));
                        }
                    },
                    error: (err) => {
                        this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                    }
                });
            }
        });
    }

    deleteSelectedModulos() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las modulos seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedModulos?.map(modulo => modulo.id!) || [];
                this.modulosService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {
                            this.modulos.set(this.modulos().filter((val) => !idsToDelete.includes(val.id!)));
                            this.notificationToastService.success('Módulos eliminados correctamente');
                            this.selectedModulos = null;
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

    saveUpdateModulo() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.modulo.id) {
            const updated = this.mapToModulo({ ...this.modulo, ...data });

            this.modulosService.update(updated.id!, updated).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.modulos.set(
                            this.modulos().map(op => op.id === res.data.id ? updated : op)
                        );
                        this.notificationToastService.success('Módulo actualizado correctamente');
                        this.hideDialog();
                    } else {
                        this.notificationToastService.error(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                }
            });

        } else {

            const newModulo = this.mapToModulo({ ...data });

            this.modulosService.create(newModulo).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.modulos.set([...this.modulos(), res.data]);
                        this.notificationToastService.success('Módulo creado correctamente');
                        this.hideDialog();
                    } else {
                        this.notificationToastService.error(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }
    }

    private mapToModulo(data: any): Modulo {
        return {
            id: data.id,
            nombre: data.nombre,
            icono: data.icono
        };
    }

}
