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
        LoadingOverlayComponent
    ],
    templateUrl: './personas.component.html',
    styleUrls: ['./personas.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class PersonasComponent implements OnInit {
    personaDialog: boolean = false;
    personas = signal<any[]>([]);
    persona!: any;
    selectedPersonas!: any[] | null;
    submitted: boolean = false;
    statuses!: any[];
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    form!: FormGroup;
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    constructor(
        private personasService: PersonasService,
        private messageService: MessageService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
    ) {
        this.loading$ = this.personasService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();
    }


    buildForm(persona: any = {}) {
        this.form = this.fb.group({
            nombre: [persona.nombre || '', Validators.required],
            apellido: [persona.apellido || '', Validators.required],
            idTipoDocumentoIdentidad: [persona.idTipoDocumentoIdentidad || null, Validators.required],
            documentoIdentidad: [persona.documentoIdentidad || '', Validators.required],
            fechaNacimiento: [persona.fechaNacimiento || '', Validators.required],
        });
    }

    getDocumentosIdentidad() {
        // this.modulosService.findAll().subscribe({
        //     next: (res: StatusResponse<any>) => {
        //         console.log(res);
        //         if (res.ok && res.data) {
        //             this.modulos = res.data;
        //         } else {
        //             this.errorToast(this.utils.normalizeMessages(res.message));
        //             console.warn(this.utils.normalizeMessages(res.message));
        //         }
        //     },
        //     error: (err) => {
        //         this.errorToast(this.utils.normalizeMessages(err?.error?.message));
        //         console.warn(this.utils.normalizeMessages(err?.error?.message));
        //     }
        // });
    }


    loadData() {
        this.personasService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.personas.set(res.data);
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
        this.persona = {};
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.personaDialog = true;
    }

    openEdit(persona: any) {
        this.persona = { ...persona };
        this.buildForm(this.persona); // <- Aquí
        this.personaDialog = true;
    }


    deleteSelectedPersonas() {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar las personas seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idsToDelete = this.selectedPersonas?.map(persona => persona.id) || [];
                this.personasService.deleteMany(idsToDelete).subscribe({
                    next: (response: StatusResponse<any>) => {
                        if (response.ok && response.data) {
                            console.log(response);
                            this.personas.set(this.personas().filter((val) => !this.selectedPersonas?.includes(val)));
                            this.selectedPersonas = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Personas Deleted',
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
        this.personaDialog = false;
        this.submitted = false;
    }

    deletePersona(persona: any) {
        this.confirmationService.confirm({
            message: '¿Estas seguro de eliminar esta persona ' + persona.nombre + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.personasService.delete(persona.id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok && res.data) {
                            this.personas.set(this.personas().filter((val) => val.id !== persona.id));
                            this.persona = {};
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Personas Deleted',
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

    saveUpdatePersona() {
        this.submitted = true;
        if (this.form.invalid) return;

        const data = this.form.value;

        if (this.persona.id) {
            const updated = { ...this.persona, ...data };

            this.personasService.update(updated.id,
                {
                    nombre: updated.nombre,
                    apellido: updated.apellido,
                    idTipoDocumentoIdentidad: updated.idTipoDocumentoIdentidad,
                    documentoIdentidad: updated.documentoIdentidad,
                    fechaNacimiento: updated.fechaNacimiento
                }
            ).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.personas.set(
                            this.personas().map(op => op.id === this.persona.id ? updated : op)
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
            const newPersona = { ...data };

            this.personasService.create(newPersona).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.personas.set([...this.personas(), res.data]);
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

        this.personaDialog = false;
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
