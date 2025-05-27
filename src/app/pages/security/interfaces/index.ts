export interface PermisoAccion {
  id: number;
  nombre: string;
  asignado: boolean;
}

export interface PermisoOpcion {
  id: number;
  nombre: string;
  acciones: PermisoAccion[];
}

export interface PermisoModulo {
  id: number;
  nombre: string;
  opciones: PermisoOpcion[];
}

export interface UsuarioDto {
  id: number;
  login: string;
  persona: {
    id: number;
    nombre: string;
    apellido?: string;
  };
  roles: { id: number; nombre: string }[];
}

export interface CreateUsuarioDto {
  login: string;
  password: string;
  idPersona?: number;
  persona?: {
    nombre: string;
    apellido?: string;
    idTipoDocumentoIdentidad?: number;
    documentoIdentidad?: string;
    fechaNacimiento?: Date;
  };
  roles: number[];
}
