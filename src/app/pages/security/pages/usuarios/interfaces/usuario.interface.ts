export interface Persona {
  id: number;
  nombre: string;
  apellido: string | null;
  idTipoDocumentoIdentidad?: number | null;
  documentoIdentidad?: string | null;
  fechaNacimiento?: Date | string | null;
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id?: number;
  login: string;
  password?: string;
  persona?: Persona | null;
  roles?: Rol[];
}
