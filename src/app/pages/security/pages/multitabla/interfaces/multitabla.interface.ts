export interface MultitablaItem {
  id?: number;
  nombre: string;
  valor?: string | null;
  valor2?: string | null;
}

export interface Multitabla {
  id?: number;
  nombre: string;
  valor?: string | null;
  valor2?: string | null;
  items?: MultitablaItem[];
}
