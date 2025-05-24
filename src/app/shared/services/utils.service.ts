import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UtilsService {

  /**
   * Convierte un mensaje que puede ser string o array de strings en un array de strings.
   */
  normalizeMessages(message: string | string[] | null | undefined): string[] {
    if (Array.isArray(message)) return message;
    if (typeof message === 'string') return [message];
    return ['Ocurrió un error inesperado.'];
  }

}
