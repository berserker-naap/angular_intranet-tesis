import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
    providedIn: 'root'
})
export class NotificationToastService {

    constructor(private messageService: MessageService) { }

    success(message: string, summary: string = 'Éxito', life: number = 3000) {
        this.messageService.add({
            severity: 'success',
            summary,
            detail: message,
            life
        });
    }

    error(message: string | string[], summary: string = 'Error', life: number = 5000) {
        const detail = Array.isArray(message) ? message.join('\n') : message;
        this.messageService.add({
            severity: 'error',
            summary,
            detail,
            life
        });
    }

    info(message: string, summary: string = 'Información', life: number = 3000) {
        this.messageService.add({
            severity: 'info',
            summary,
            detail: message,
            life
        });
    }

    warn(message: string, summary: string = 'Advertencia', life: number = 4000) {
        this.messageService.add({
            severity: 'warn',
            summary,
            detail: message,
            life
        });
    }
}
