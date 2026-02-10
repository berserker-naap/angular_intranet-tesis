import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { Persona } from './interfaces/persona.interface';
import { MultitablaService } from './../../services/multitabla.service';
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
import { PersonasService } from '../../services/personas.service';
import { Observable } from 'rxjs';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { DropdownModule } from 'primeng/dropdown';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-personas',
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
        DatePickerModule,
        DropdownModule,
        LoadingOverlayComponent
    ],
    templateUrl: './personas.component.html',
    styleUrls: ['./personas.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class PersonasComponent implements OnInit {
    personaDialog: boolean = false;
    personas = signal<Persona[]>([]);
    persona!: Persona;
    selectedPersonas!: Persona[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean

    tipoDocumentos: any[] = [];
    constructor(
        private personasService: PersonasService,
        private multitablaService: MultitablaService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
        this.loading$ = this.personasService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.getTipoDocumentos();
        this.buildForm();
    }

    loadData() {
        this.personasService.findAll().subscribe({
            next: (res: StatusResponse<Persona[]>) => {
                if (res.ok && res.data) {
                    this.personas.set(res.data);
                } else {
                    this.errorToast(this.utils.normalizeMessages(res.message));
                }
            },
            error: (err) => {
                this.errorToast(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }


    getTipoDocumentos() {
        this.multitablaService.getTipoDocumento().subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) {
                    this.tipoDocumentos = res.data.items;
                } else {
                    this.errorToast(this.utils.normalizeMessages(res.message));
                }
            },
            error: (err) => {
                this.errorToast(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }


    exportExcel() {
        // Generar datos planos para exportar
        const exportData = this.personas().map(persona => ({
            Nombre: persona.nombre,
            Apellido: persona.apellido,
            'Tipo Doc.': persona.tipoDocumento?.valor ?? '',
            'Documento de Identidad': persona.documentoIdentidad
        }));
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
        const workbook: XLSX.WorkBook = { Sheets: { 'Personas': worksheet }, SheetNames: ['Personas'] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, 'personas');
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
        this.persona = {} as Persona;
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.personaDialog = true;
    }

    openEdit(persona: Persona) {
        this.persona = { ...persona };
        this.buildForm(this.persona);
        this.personaDialog = true;
    }

    buildForm(persona: Persona = {} as Persona) {
        this.form = this.fb.group({
            nombre: [persona.nombre || '', Validators.required],
            apellido: [persona.apellido || '', Validators.required],
            idTipoDocumentoIdentidad: [persona.tipoDocumento?.id || null, Validators.required],
            documentoIdentidad: [persona.documentoIdentidad || '', Validators.required],
            fechaNacimiento: [
                persona.fechaNacimiento ? new Date(persona.fechaNacimiento) : null,
                Validators.required
            ]
        });
    }

    hideDialog() {
        this.personaDialog = false;
        this.submitted = false;
    }

    private formatDateToString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    saveUpdatePersona() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;
        // Formatear fechaNacimiento como YYYY-MM-DD
        const fechaNacimientoFormateada = data.fechaNacimiento
            ? this.formatDateToString(data.fechaNacimiento)
            : null;

        if (this.persona.id) {
            this.personasService.update(this.persona.id, {
                nombre: data.nombre,
                apellido: data.apellido,
                idTipoDocumentoIdentidad: data.idTipoDocumentoIdentidad,
                documentoIdentidad: data.documentoIdentidad,
                fechaNacimiento: fechaNacimientoFormateada
            }
            ).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.personas.set(
                            this.personas().map(op => op.id === this.persona.id ? res.data : op)
                        );
                        this.successToast('Persona actualizada correctamente');
                        this.hideDialog();
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });

        } else {
            this.personasService.create({
                nombre: data.nombre,
                apellido: data.apellido,
                idTipoDocumentoIdentidad: data.idTipoDocumentoIdentidad,
                documentoIdentidad: data.documentoIdentidad,
                fechaNacimiento: fechaNacimientoFormateada
            }).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.personas.set([...this.personas(), res.data]);
                        this.successToast('Persona creada correctamente');
                        this.hideDialog();
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }

        this.personaDialog = false;
    }

    deletePersona(persona: Persona) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de eliminar a ' + persona.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.personasService.delete(persona.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok) {
                            this.personas.set(this.personas().filter((val) => val.id !== persona.id));
                            this.persona = {} as Persona;
                            this.successToast('Persona eliminada correctamente');
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

    deleteSelectedPersonas() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de eliminar las personas seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedPersonas?.map(persona => persona.id).filter(id => id !== undefined) || [];
                this.personasService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok) {
                            this.personas.set(
                                this.personas().filter((val) => !idsToDelete.includes(val.id))
                            );
                            this.selectedPersonas = null;
                            this.successToast('Personas eliminadas correctamente');
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
