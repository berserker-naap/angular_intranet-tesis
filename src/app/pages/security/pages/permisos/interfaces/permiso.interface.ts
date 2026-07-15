export interface PermisoAccion {
  id: number;
  nombre: string;
  isAsignado: boolean;
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
