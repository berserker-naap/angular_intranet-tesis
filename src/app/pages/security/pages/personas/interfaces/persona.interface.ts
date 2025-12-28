export interface TipoDocumento {
  idTipoDocumentoIdentidad: number;
  nombre: string;
  valor: string;
}

export interface Persona {
  activo: boolean;
  eliminado: boolean;
  ipRegistro: string;
  fechaRegistro: string;
  usuarioRegistro: string;
  ipModificacion: string | null;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
  ipEliminacion: string | null;
  fechaEliminacion: string | null;
  usuarioEliminacion: string | null;
  id: number;
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  documentoIdentidad: string;
  fechaNacimiento: string;
}

export interface PersonaResponse {
  ok: boolean;
  statusCode: number;
  message: string;
  data: Persona[];
}
