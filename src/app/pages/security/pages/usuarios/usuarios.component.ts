import { Component, OnInit, signal, ViewChild } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UsuarioDto } from "../../interfaces";
import { PersonasService } from "../../services/personas.service";
import { RolesService } from "../../services/roles.service";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputNumberModule } from "primeng/inputnumber";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputTextModule } from "primeng/inputtext";
import { RadioButtonModule } from "primeng/radiobutton";
import { RatingModule } from "primeng/rating";
import { RippleModule } from "primeng/ripple";
import { SelectModule } from "primeng/select";
import { Table, TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { LoadingOverlayComponent } from "../../../../shared/components/loading-overlay/loading-overlay.component";
import { UsuariosService } from "../../services/usuarios.service";
import { UtilsService } from "../../../../shared/services/utils.service";
import { StatusResponse } from "../../../../shared/interface/status-response.interface";
import { ConfirmationService, MessageService } from "primeng/api";
import { Observable } from "rxjs";
import { PickListModule } from "primeng/picklist";
import { MultitablaService } from "../../services/multitabla.service";
import { DatePickerModule } from "primeng/datepicker";
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
    standalone: true,
    imports: [CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        CheckboxModule,
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
        DropdownModule,
        PickListModule,
        DatePickerModule,
        LoadingOverlayComponent],
    templateUrl: './usuarios.component.html',
    styleUrls: ['./usuarios.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class UsuariosComponent implements OnInit {
    usuarioDialog: boolean = false;
    usuarios = signal<any[]>([]);
    usuario!: any;
    selectedUsuarios!: any[] | null;
    allRoles: any[] = []; // todos los roles posibles
    rolesDisponibles: any[] = []; // cargar desde servicio
    rolesAsignados: any[] = [];
    form!: FormGroup;
    submitted: boolean = false;
    crearPersona = false;
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    tipoDocumentos: any[] = [];
    personas: any[] = []; // cargar desde un servicio
    loading$: Observable<boolean> = new Observable<boolean>(observer => observer.next(false)); // Observable boolean
    constructor(
        private fb: FormBuilder,
        private usuariosService: UsuariosService,
        private multitablaService: MultitablaService,
        private personasService: PersonasService,
        private rolesService: RolesService,
        private utils: UtilsService, // Asegúrate de tener un servicio para manejar mensajes y utilidades
        private messageService: MessageService
    ) {
        this.loading$ = this.usuariosService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.getRoles();
        this.getPersonas();
        this.getTipoDocumentos();
        this.buildForm();
    }
    buildForm(usuario: any = {}) {
        const persona = usuario.persona || {};

        this.form = this.fb.group({
            login: [usuario.login || '', Validators.required],
            password: [usuario.password || '', Validators.required],
            idPersona: [usuario?.idPersona || null],
            persona: this.fb.group({
                nombre: [persona.nombre || ''],
                apellido: [persona.apellido || ''],
                idTipoDocumentoIdentidad: [persona.idTipoDocumentoIdentidad ?? null],
                documentoIdentidad: [persona.documentoIdentidad || ''],
                fechaNacimiento: [
                    persona.fechaNacimiento ? new Date(persona.fechaNacimiento) : null
                ]
            }),
            roles: [usuario.roles?.map((r: any) => r.id) || []]
        });
        console.log('Formulario creado:', this.usuario);
        this.rolesAsignados = usuario.roles || [];
        this.rolesDisponibles = [...this.allRoles];
        console.log('Usuario cargado:', this.rolesAsignados);
        this.aplicarValidadoresDinamicos();
    }

    getTipoDocumentos() {
        this.multitablaService.getTipoDocumento().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.tipoDocumentos = res.data.items;
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

    aplicarValidadoresDinamicos() {
        const personaGroup = this.form.get('persona') as FormGroup;
        const idPersonaControl = this.form.get('idPersona');

        if (this.crearPersona) {
            // Activar validadores del grupo persona
            personaGroup.get('nombre')?.setValidators(Validators.required);
            personaGroup.get('apellido')?.setValidators(Validators.required);
            personaGroup.get('idTipoDocumentoIdentidad')?.setValidators(Validators.required);
            personaGroup.get('documentoIdentidad')?.setValidators(Validators.required);
            personaGroup.get('fechaNacimiento')?.setValidators(Validators.required);
            // Limpiar idPersona
            idPersonaControl?.clearValidators();
        } else {
            // Limpiar validadores de persona
            Object.values(personaGroup.controls).forEach((control) => {
                control.clearValidators();
                control.updateValueAndValidity();
            });
            // Activar validador solo para idPersona
            idPersonaControl?.setValidators(Validators.required);
        }

        personaGroup.updateValueAndValidity();
        idPersonaControl?.updateValueAndValidity();
    }

    get personaForm(): FormGroup {
        return this.form.get('persona') as FormGroup;
    }

    getRoles() {
        this.rolesService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) {
                    this.allRoles = res.data;
                    console.log('rolesDisponibles:', this.rolesDisponibles);
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
    getPersonas() {
        this.personasService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) {
                    this.personas = res.data;
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

    loadData() {
        this.usuariosService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) {
                    this.usuarios.set(res.data);
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

    openNew() {
        this.usuario = {};
        this.submitted = false;
        this.buildForm(); // <- Aquí
        this.usuarioDialog = true;
    }

    openEdit(usuario: any) {
        this.usuario = { ...usuario };
        this.buildForm(this.usuario); // <- Aquí
        this.usuarioDialog = true;
    }

    togglePersona(event: Event) {
        const input = event.target as HTMLInputElement;
        this.crearPersona = input.checked;

        // Si quieres limpiar datos al activar o desactivar
        if (this.crearPersona) {
            this.form.get('idPersona')?.reset();
        } else {
            this.form.get('persona')?.reset();
        }
        this.aplicarValidadoresDinamicos();
    }

    onAsignarRoles(event: any) {
        this.form.get('roles')?.setValue(this.rolesAsignados.map(r => r.id));
        this.form.get('roles')?.markAsTouched();
    }

    onQuitarRoles(event: any) {
        this.form.get('roles')?.setValue(this.rolesAsignados.map(r => r.id));
        this.form.get('roles')?.markAsTouched();
    }


    saveUpdateUsuario() {
        console.log('Guardando usuario:', this.form.value);
        this.submitted = true;
        console.log('Errores del formulario:', this.form.errors);
        console.log('Controles individuales:', this.form.controls);
        if (this.form.invalid) return;
        console.log('Formulario válido, guardando usuario:', this.form.value);
        const dto = { ...this.form.value };

        if (dto.id) {
            // UPDATE
            // this.usuariosService.update(dto.id, dto).subscribe({
            //     next: (res) => {
            //         if (res.ok && res.data) {
            //             this.usuarios.set(
            //                 this.multitablas().map(op => op.id === dto.id ? res.data : op)
            //             );
            //             this.successToast(`Multitabla "${res.data.nombre}" actualizada correctamente`);
            //         } else {
            //             this.errorToast(this.utils.normalizeMessages(res.message));
            //         }
            //     },
            //     error: (err) => {
            //         this.errorToast(this.utils.normalizeMessages(err?.error?.message));
            //     }
            // });
        } else {
            // CREATE
            delete dto.id;

            this.usuariosService.create(dto).subscribe({
                next: (res) => {
                    if (res.ok && res.data) {
                        this.usuarios.set([...this.usuarios(), res.data]);
                        this.successToast(`Usuario "${res.data.nombre}" creada correctamente`);
                    } else {
                        this.errorToast(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err) => {
                    this.errorToast(this.utils.normalizeMessages(err?.error?.message));
                }
            });
        }

        this.usuarioDialog = false;
    }

    abrirAsignarRoles(usuario: UsuarioDto) {
        // Lo vemos si deseas implementar edición desde modal aparte
    }

    hideDialog() {
        this.usuarioDialog = false;
        this.submitted = false;
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

    deleteUsuario(usuario: any) {
    }

}
