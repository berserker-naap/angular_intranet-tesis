import { Component, OnInit, signal, ViewChild } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";

import { PersonasService } from "../../services/personas.service";
import { RolesService } from "../../services/roles.service";
import { CommonModule } from "@angular/common";

import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
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
import { PickListModule } from "primeng/picklist";
import { DatePickerModule } from "primeng/datepicker";
import { ConfirmationService, MessageService } from "primeng/api";

import { LoadingOverlayComponent } from "../../../../shared/components/loading-overlay/loading-overlay.component";
import { UsuariosService } from "../../services/usuarios.service";
import { UtilsService } from "../../../../shared/services/utils.service";
import { StatusResponse } from "../../../../shared/interface/status-response.interface";
import { MultitablaService } from "../../services/multitabla.service";
import { NotificationToastService } from "../../../../shared/services/notification-toast.service";

import { Observable } from "rxjs";
import { Usuario } from "./interfaces/usuario.interface";

@Component({
    standalone: true,
    imports: [
        CommonModule,
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
        PickListModule,
        DatePickerModule,
        LoadingOverlayComponent,
    ],
    templateUrl: "./usuarios.component.html",
    styleUrls: ["./usuarios.component.scss"],
    providers: [MessageService, ConfirmationService, NotificationToastService],
})
export class UsuariosComponent implements OnInit {
    usuarioDialog = false;

    usuarios = signal<Usuario[]>([]);
    usuario!: Usuario;

    selectedUsuarios: Usuario[] | null = null;

    // catálogos
    personas: any[] = [];
    tipoDocumentos: any[] = [];
    allRoles: any[] = [];

    // roles asignados al usuario en el modal
    rolesAsignados: any[] = [];

    form!: FormGroup;
    submitted = false;

    crearPersona = false;
    isEditMode = false;

    loading$: Observable<boolean>;

    @ViewChild("dt") dt!: Table;

    constructor(
        private fb: FormBuilder,
        private usuariosService: UsuariosService,
        private multitablaService: MultitablaService,
        private personasService: PersonasService,
        private rolesService: RolesService,
        private utils: UtilsService,
        private confirmationService: ConfirmationService,
        private notificationToast: NotificationToastService
    ) {
        this.loading$ = this.usuariosService.loading$;
    }

    ngOnInit() {
        this.loadData();
        this.getRoles();
        this.getPersonas();
        this.getTipoDocumentos();
    }

    // =========================
    // CARGA DE DATA
    // =========================
    loadData() {
        this.usuariosService.findAll().subscribe({
            next: (res: StatusResponse<Usuario[]>) => {
                if (res.ok && res.data) this.usuarios.set(res.data);
                else this.notificationToast.error(this.utils.normalizeMessages(res.message));
            },
            error: (err) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
        });
    }

    getRoles() {
        this.rolesService.findAll().subscribe({
            next: (res: StatusResponse<any[]>) => {
                if (res.ok && res.data) {
                    // Normalización defensiva por si el backend cambia naming
                    this.allRoles = res.data.map((r: any) => ({
                        ...r,
                        id: r.id ?? r.idRol,
                    }));
                } else {
                    this.notificationToast.error(this.utils.normalizeMessages(res.message));
                }
            },
            error: (err) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
        });
    }

    getPersonas() {
        this.personasService.findAll().subscribe({
            next: (res: StatusResponse<any[]>) => {
                if (res.ok && res.data) this.personas = res.data;
                else this.notificationToast.error(this.utils.normalizeMessages(res.message));
            },
            error: (err) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
        });
    }

    getTipoDocumentos() {
        this.multitablaService.getTipoDocumento().subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok && res.data) this.tipoDocumentos = res.data.items ?? [];
                else this.notificationToast.error(this.utils.normalizeMessages(res.message));
            },
            error: (err) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
        });
    }

    // =========================
    // FORM
    // =========================
    buildForm(usuario: Usuario = {} as Usuario) {
        const persona: any = usuario.persona || {};

        // Backend devuelve persona.tipoDocumento{id,...}
        const idTipoDocumentoIdentidad =
            persona?.idTipoDocumentoIdentidad ??
            persona?.tipoDocumento?.id ??
            null;

        this.form = this.fb.group({
            login: [usuario.login ?? "", Validators.required],

            // En tu backend password es requerido SOLO al crear.
            // En edición, déjalo sin required. Si lo dejas disabled, usa getRawValue() al guardar.
            password: [
                { value: "", disabled: this.isEditMode },
                this.isEditMode ? [] : [Validators.required],
            ],

            idPersona: [persona?.id ?? null],

            persona: this.fb.group({
                nombre: [persona?.nombre ?? ""],
                apellido: [persona?.apellido ?? ""],
                idTipoDocumentoIdentidad: [idTipoDocumentoIdentidad],
                documentoIdentidad: [persona?.documentoIdentidad ?? ""],
                fechaNacimiento: [
                    persona?.fechaNacimiento ? new Date(persona.fechaNacimiento) : null,
                ],
            }),
        });

        this.aplicarValidadoresDinamicos();
    }

    get personaForm(): FormGroup {
        return this.form.get("persona") as FormGroup;
    }

    aplicarValidadoresDinamicos() {
        const personaGroup = this.form.get("persona") as FormGroup;
        const idPersonaControl = this.form.get("idPersona");

        if (this.crearPersona) {
            personaGroup.get("nombre")?.setValidators([Validators.required]);
            personaGroup.get("apellido")?.setValidators([Validators.required]);
            personaGroup.get("idTipoDocumentoIdentidad")?.setValidators([Validators.required]);
            personaGroup.get("documentoIdentidad")?.setValidators([Validators.required]);
            personaGroup.get("fechaNacimiento")?.setValidators([Validators.required]);

            idPersonaControl?.clearValidators();
        } else {
            Object.values(personaGroup.controls).forEach((c) => c.clearValidators());
            idPersonaControl?.setValidators([Validators.required]);
        }

        Object.values(personaGroup.controls).forEach((control) =>
            control.updateValueAndValidity({ emitEvent: false })
        );
        personaGroup.updateValueAndValidity({ emitEvent: false });
        idPersonaControl?.updateValueAndValidity({ emitEvent: false });
    }

    togglePersona(event: any) {
        // Compatible con PrimeNG y HTML nativo
        this.crearPersona = !!(event?.checked ?? event?.target?.checked);

        if (this.crearPersona) {
            this.form.get("idPersona")?.reset(null);
            this.personaForm.reset({
                nombre: "",
                apellido: "",
                idTipoDocumentoIdentidad: null,
                documentoIdentidad: "",
                fechaNacimiento: null,
            });
        } else {
            this.form.get("idPersona")?.reset(null);
            this.personaForm.reset();
        }

        this.aplicarValidadoresDinamicos();

        // Limpia estado visual
        this.form.markAsPristine();
        this.form.markAsUntouched();
    }

    // =========================
    // MODAL
    // =========================
    openNew() {
        this.usuario = {} as Usuario;
        this.submitted = false;
        this.isEditMode = false;
        this.crearPersona = false;

        this.rolesAsignados = [];

        this.buildForm();
        this.usuarioDialog = true;
    }

    openEdit(usuario: Usuario) {
        const id = usuario?.id;
        if (!id) return;
        this.getPersonas();
        this.usuariosService.findOne(id).subscribe({
            next: (res: StatusResponse<Usuario>) => {
                if (!res.ok || !res.data) {
                    this.notificationToast.error(this.utils.normalizeMessages(res.message));
                    this.hideDialog();
                    return;
                }


                this.submitted = false;
                this.isEditMode = true;
                this.crearPersona = false;

                // Abre modal de una vez (opcional) y muestra overlay
                this.usuarioDialog = true;

                // data completa
                this.usuario = res.data;

                // roles en modal
                this.rolesAsignados = this.usuario.roles ? [...this.usuario.roles] : [];

                // construir form con data completa
                this.buildForm(this.usuario);

                // (opcional) reset visual
                this.form.markAsPristine();
                this.form.markAsUntouched();
            },
            error: (err) => {
                this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
                this.hideDialog();
            },
        });



    }


    hideDialog() {
        this.usuarioDialog = false;
        this.submitted = false;
        this.form?.reset();
        this.rolesAsignados = [];
        this.crearPersona = false;
        this.isEditMode = false;
    }

    // =========================
    // ROLES (checkbox / lista)
    // =========================
    isRolAsignado(role: any): boolean {
        const id = role?.id ?? role?.idRol;
        return this.rolesAsignados.some((r) => (r?.id) === id);
    }

    toggleRol(role: any) {
        const id = role?.id ?? role?.idRol;
        const exists = this.rolesAsignados.find((r) => (r?.id) === id);

        if (exists) this.rolesAsignados = this.rolesAsignados.filter((r) => (r?.id) !== id);
        else this.rolesAsignados = [...this.rolesAsignados, { ...role, id }];
    }

    // =========================
    // CREATE / UPDATE (100% compatible con tu UsuarioService)
    // =========================
    saveUpdateUsuario() {
        this.submitted = true;
        if (this.form.invalid) return;

        // IMPORTANTE: incluye password aunque esté disabled
        const data = this.form.getRawValue();

        const payload: any = {
            login: data.login,
            roles: (this.rolesAsignados || []).map((r: any) => {
                const id = r?.id;
                const nombre = r?.nombre ?? this.allRoles?.find((ar: any) => (ar?.id) === id)?.nombre;
                return { id, nombre };
            }),
        };

        // Create: password requerido, Update: opcional
        if (!this.isEditMode) {
            payload.password = data.password;
        } else if (data.password) {
            payload.password = data.password;
        }

        // Persona: tu backend exige idPersona o persona en create.
        if (this.crearPersona) {
            payload.idPersona = null;
            payload.persona = {
                nombre: data.persona?.nombre,
                apellido: data.persona?.apellido,
                idTipoDocumentoIdentidad: data.persona?.idTipoDocumentoIdentidad,
                documentoIdentidad: data.persona?.documentoIdentidad,
                fechaNacimiento: data.persona?.fechaNacimiento ?? null,
            };
        } else {
            payload.idPersona = data.idPersona;
            payload.persona = null;
        }

        // Validación de negocio opcional (si no quieres permitir sin roles)
        if (!payload.roles.length) {
            this.notificationToast.error("Debe asignar al menos un rol.");
            return;
        }

        if (this.usuario?.id) {
            this.usuariosService.update(this.usuario.id, payload).subscribe({
                next: (res: StatusResponse<any>) => {
                    if (res.ok) {
                        this.upsertUsuarioInList(res.data);
                        this.notificationToast.success("Usuario actualizado correctamente");
                        this.hideDialog();
                    } else {
                        this.notificationToast.error(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err: any) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
            });
        } else {
            this.usuariosService.create(payload).subscribe({
                next: (res: StatusResponse<any>) => {
                    if (res.ok) {
                        this.upsertUsuarioInList(res.data);
                        this.notificationToast.success("Usuario creado correctamente");
                        this.hideDialog();
                    } else {
                        this.notificationToast.error(this.utils.normalizeMessages(res.message));
                    }
                },
                error: (err: any) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
            });
        }
    }

    // =========================
    // DELETE
    // =========================
    deleteUsuario(usuario: Usuario) {
        this.confirmationService.confirm({
            message: "¿Estás seguro de eliminar al usuario " + usuario.login + "?",
            header: "Confirmar",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.usuariosService.delete(usuario.id!).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok) {
                            this.removeUsuarioFromList(usuario.id!);
                            this.notificationToast.success("Usuario eliminado correctamente");
                        } else {
                            this.notificationToast.error(this.utils.normalizeMessages(res.message));
                        }
                    },
                    error: (err: any) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
                });
            },
        });
    }

    deleteSelectedUsuarios() {
        if (!this.selectedUsuarios?.length) return;

        this.confirmationService.confirm({
            message: "¿Estás seguro de eliminar los usuarios seleccionados?",
            header: "Confirmar",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                const idsToDelete = this.selectedUsuarios?.map((u) => u.id).filter(Boolean) as number[];

                this.usuariosService.deleteMany(idsToDelete).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok) {
                            this.removeManyUsuarios(idsToDelete);
                            this.notificationToast.success("Usuarios eliminados correctamente");
                            this.selectedUsuarios = null;
                        } else {
                            this.notificationToast.error(this.utils.normalizeMessages(res.message));
                        }
                    },
                    error: (err: any) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
                });
            },
        });
    }

    resetPassword(usuario: Usuario) {
        const id = usuario?.id;
        if (!id) return;

        this.confirmationService.confirm({
            message: `Â¿Seguro que deseas resetear la contraseÃ±a del usuario ${usuario.login}?`,
            header: "Confirmar",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.usuariosService.resetPassword(id).subscribe({
                    next: (res: StatusResponse<any>) => {
                        if (res.ok) {
                            this.notificationToast.success("ContraseÃ±a reseteada correctamente");
                        } else {
                            this.notificationToast.error(this.utils.normalizeMessages(res.message));
                        }
                    },
                    error: (err: any) =>
                        this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
                });
            },
        });
    }

    rolesDialog = false;
    usuarioRolesTarget!: Usuario;

    abrirAsignarRoles(usuario: Usuario) {
        const id = usuario?.id;
        if (!id) return;

        this.rolesDialog = true;
        this.usuarioRolesTarget = usuario;

        // Traer data completa (roles actualizados)
        this.usuariosService.findOne(id).subscribe({
            next: (res: StatusResponse<Usuario>) => {
                if (!res.ok || !res.data) {
                    this.notificationToast.error(this.utils.normalizeMessages(res.message));
                    this.rolesDialog = false;
                    return;
                }

                this.usuarioRolesTarget = res.data;
                this.rolesAsignados = res.data.roles ? [...res.data.roles] : [];
            },
            error: (err) => {
                this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
                this.rolesDialog = false;
            },
        });
    }

    guardarRoles() {
        const id = this.usuarioRolesTarget?.id;
        if (!id) return;

        const rolesPayload = (this.rolesAsignados || []).map((r: any) => ({ id: r.id }));

        if (!rolesPayload.length) {
            this.notificationToast.error("Debe asignar al menos un rol.");
            return;
        }

        this.usuariosService.updateRoles(id, rolesPayload).subscribe({
            next: (res: StatusResponse<any>) => {
                if (res.ok) {
                    this.upsertUsuarioInList(res.data);
                    this.notificationToast.success("Roles actualizados correctamente");
                    this.rolesDialog = false;
                    this.cerrarRolesDialog(); // 👈 AQUÍ
                } else {
                    this.notificationToast.error(this.utils.normalizeMessages(res.message));
                }
            },
            error: (err) => this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message)),
        });
    }

    cerrarRolesDialog() {
        this.rolesDialog = false;
        this.rolesAsignados = [];
        this.usuarioRolesTarget = {} as any;
    }

    private upsertUsuarioInList(u: Usuario) {
        const list = this.usuarios();
        const idx = list.findIndex(x => x.id === u.id);

        if (idx === -1) this.usuarios.set([...list, u]);
        else this.usuarios.set(list.map(x => x.id === u.id ? u : x));
    }

    private removeUsuarioFromList(id: number) {
        this.usuarios.set(this.usuarios().filter(x => x.id !== id));
    }

    private removeManyUsuarios(ids: number[]) {
        const setIds = new Set(ids);
        this.usuarios.set(this.usuarios().filter(x => !setIds.has(x.id!)));
    }

}


