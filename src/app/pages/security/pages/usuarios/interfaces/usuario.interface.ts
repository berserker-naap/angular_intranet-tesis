export interface Usuario {
  id?: number | null; // null cuando es nuevo, number cuando existe
  login: string;
  password?: string | null;
  persona?: {
    id: number;
    nombre: string;
    apellido: string | null;
    idTipoDocumentoIdentidad?: number | null;
    documentoIdentidad?: string;
    fechaNacimiento?: Date | null;
  } | null; // Puede ser null si no hay persona
  roles: {
    id: number;
    nombre: string;
  }[];
}
