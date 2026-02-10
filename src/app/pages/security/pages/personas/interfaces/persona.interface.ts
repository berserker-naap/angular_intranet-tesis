export interface TipoDocumento {
  id: number;
  nombre: string;
  valor: string | null;
}

export interface Persona {
  id: number;
  nombre: string;
  apellido: string | null;
  documentoIdentidad: string | null;
  fechaNacimiento: string | null;
  tipoDocumento: TipoDocumento | null;
}

export interface PersonaResponse {
  ok: boolean;
  statusCode: number;
  message: string;
  data: Persona[];
}
