import { Component, OnInit } from "@angular/core";
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
import { TableModule } from "primeng/table";
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
        LoadingOverlayComponent],
    templateUrl: './usuarios.component.html',
     styleUrls: ['./usuarios.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class UsuariosComponent implements OnInit {
    usuarios: UsuarioDto[] = [];
    personas: any[] = []; // cargar desde un servicio
    rolesDisponibles: any[] = []; // cargar desde servicio
    rolesAsignados: any[] = [];

    form!: FormGroup;
    mostrarModal = false;
    crearPersona = false;
  loading$: Observable<boolean> = new Observable<boolean>( observer => observer.next(false)); // Observable boolean
    constructor(
        private fb: FormBuilder,
        private usuariosService: UsuariosService,
        private personasService: PersonasService,
        private rolesService: RolesService,
        private utils: UtilsService, // Asegúrate de tener un servicio para manejar mensajes y utilidades
        private messageService: MessageService
    ) {
          this.loading$ = this.usuariosService.loading$; // Observable boolean
    }

    ngOnInit() {
        this.loadData();
        this.buildForm();
    }
    buildForm() {
        this.form = this.fb.group({
            login: ['', Validators.required],
            password: ['', Validators.required],
            idPersona: [null],
            persona: this.fb.group({
                nombre: [''],
                apellido: [''],
                idTipoDocumentoIdentidad: [null],
                documentoIdentidad: [''],
                fechaNacimiento: [null]
            }),
            roles: [[]]
        });
    }


    loadData() {
        this.rolesService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.rolesDisponibles = res.data;
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

        this.personasService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
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
        this.cargarUsuarios();
    }

    cargarUsuarios() {
        this.usuariosService.findAll().subscribe({
            next: (res: StatusResponse<any>) => {
                console.log(res);
                if (res.ok && res.data) {
                    this.usuarios = res.data;
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

    abrirModal() {
        this.form = this.fb.group({
            login: ['', Validators.required],
            password: ['', Validators.required],
            idPersona: [null],
            persona: this.fb.group({
                nombre: [''],
                apellido: ['']
            }),
            roles: [[]]
        });
        this.crearPersona = false;
        this.rolesAsignados = [];
        this.mostrarModal = true;
    }

    togglePersona() {
        if (this.crearPersona) {
            this.form.get('idPersona')?.setValue(null);
        } else {
            this.form.get('persona')?.reset();
        }
    }

    actualizarRoles() {
        const ids = this.rolesAsignados.map(r => r.id);
        this.form.patchValue({ roles: ids });
    }

    guardar() {
        if (this.form.invalid) return;

        const data = this.form.value;
        if (!this.crearPersona) {
            delete data.persona;
        } else {
            delete data.idPersona;
        }

        this.usuariosService.create(data).subscribe(res => {
            if (res.ok) {
                this.mostrarModal = false;
                this.cargarUsuarios();
            }
        });
    }

    abrirAsignarRoles(usuario: UsuarioDto) {
        // Lo vemos si deseas implementar edición desde modal aparte
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
