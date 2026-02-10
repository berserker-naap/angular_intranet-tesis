export interface Opcion {
  id?: number;
  nombre: string;
  path: string | null;
  isVisibleNavegacion: boolean;
  modulo: {
    id: number;
    nombre: string;
  };
}
