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
import { RolesService } from '../../services/roles.service';
import { Observable } from 'rxjs';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { Rol } from './interfaces/rol.interface';



@Component({
    selector: 'app-roles',
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
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class RolesComponent implements OnInit {
    rolDialog: boolean = false;
    roles = signal<Rol[]>([]);
    rol!: Rol;
    selectedRoles!: Rol[] | null;
    submitted: boolean = false;
    @ViewChild('dt') dt!: Table;
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>( observer => observer.next(false)); // Observable boolean
    constructor(
        private rolesService: RolesService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
         this.loading$ = this.rolesService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();
    }


    buildForm(rol: any = {}) {
        this.form = this.fb.group({
            nombre: [rol.nombre || '', Validators.required],
            descripcion: [rol.descripcion || '', Validators.required],
        });
    }


    loadData() {
        this.rolesService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.roles.set(res.data);
                } else {
                    this.errorToast(this.utils.normalizeMessages(res.message));
                        console.warn(this.utils.normalizeMessages(res.message));   }
            },
            error: (err) => {
                  this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                    console.warn(this.utils.normalizeMessages(err?.error?.message)); }
        });

    }


    exportExcel() {
        // Generar datos planos para exportar
        const exportData = this.roles().map(rol => ({
            Nombre: rol.nombre,
            Descripcion: rol.descripcion
        }));
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
        const workbook: XLSX.WorkBook = { Sheets: { 'Roles': worksheet }, SheetNames: ['Roles'] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, 'roles');
    }

    saveAsExcelFile(buffer: any, fileName: string): void {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
    }
    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.rol = {} as Rol;
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.rolDialog = true;
    }

    openEdit(rol: any) {
        this.rol = { ...rol };
        this.buildForm(this.rol); // <- Aquí
        this.rolDialog = true;
    }


    hideDialog() {
        this.rolDialog = false;
        this.submitted = false;
    }

    deleteRol(rol: any) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta rol ' + rol.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.rolesService.delete(rol.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok) {
                            this.roles.set(this.roles().filter((val) => val.id !== rol.id));
                            this.rol = {} as Rol;
                            this.successToast('Rol eliminado correctamente');
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


    deleteSelectedRoles() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar los roles seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedRoles?.map(rol => rol.id).filter(id => id !== undefined) || [];
                this.rolesService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {
                            this.roles.set(this.roles().filter((val) => !this.selectedRoles?.includes(val)));
                            this.selectedRoles = null;
                            this.successToast('Roles eliminados correctamente');
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


    saveUpdateRol() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.rol.id) {
            const updated = { ...this.rol, ...data };

            this.rolesService.update(updated.id, {nombre: updated.nombre , descripcion : updated.descripcion}).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.roles.set(
                            this.roles().map(op => op.id === this.rol.id ? updated : op)
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
            const newRol = { ...data };

            this.rolesService.create(newRol).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.roles.set([...this.roles(), res.data]);
                        this.successToast('Opción creada correctamente');
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }

        this.rolDialog = false;
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
